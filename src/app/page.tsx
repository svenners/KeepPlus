'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Note,
  ViewMode,
  NoteColor,
  SyncEngineStatus,
} from '@/types/note';
import {
  db,
  ensureDatabaseSeeded,
  forceSeedDemoNotes,
  buildTagTree,
  extractInlineTags,
} from '@/lib/db';
import { INITIAL_DEMO_NOTES } from '@/lib/sample-data';
import { syncService } from '@/lib/sync/sync-service';

// Layout & UI Components
import { Header } from '@/components/layout/Header';
import { Sidebar, SidebarFilterMode } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { QuickNoteCreator } from '@/components/notes/QuickNoteCreator';
import { MasonryView } from '@/components/notes/MasonryView';
import { KanbanView } from '@/components/notes/KanbanView';
import { FocusListView } from '@/components/notes/FocusListView';
import { NoteModal } from '@/components/notes/NoteModal';
import { SyncStatusModal } from '@/components/sync/SyncStatusModal';
import { TakeoutImportModal } from '@/components/sync/TakeoutImportModal';
import { ShortcutsModal } from '@/components/common/ShortcutsModal';

const STORAGE_KEY = 'keepplus_local_notes';

export default function KeepPlusApp() {
  const { data: session } = useSession();

  // Infallible Hybrid State: Pre-loaded with demo notes so UI is never empty on first load
  const [notes, setNotes] = useState<Note[]>(INITIAL_DEMO_NOTES);

  // View & Filter States
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [filterMode, setFilterMode] = useState<SidebarFilterMode>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isTakeoutModalOpen, setIsTakeoutModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Sync Engine Status
  const [syncStatus, setSyncStatus] = useState<SyncEngineStatus>(syncService.getStatus());

  // Helper: Persist to localStorage safely
  const persistLocal = (newNotes: Note[]) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes));
      }
    } catch (e) {
      console.warn('localStorage error:', e);
    }
  };

  // Initialize DB, localStorage cache, and Sync listener
  useEffect(() => {
    // 1. Try reading from localStorage first for instant hydration
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotes(parsed);
        }
      }
    } catch (e) {}

    // 2. Hydrate & seed IndexedDB in background
    ensureDatabaseSeeded()
      .then(() => {
        db.notes
          .toArray()
          .then((dbNotes) => {
            if (dbNotes && dbNotes.length > 0) {
              setNotes(dbNotes);
              persistLocal(dbNotes);
            }
          })
          .catch(() => {});
      })
      .catch(() => {});

    // 3. Subscribe to sync engine status
    const unsubscribe = syncService.subscribeStatus((newStatus) => {
      setSyncStatus(newStatus);
    });

    return () => unsubscribe();
  }, []);

  // Sync NextAuth access token to SyncService
  useEffect(() => {
    const token = (session as any)?.accessToken || null;
    syncService.setAccessToken(token);
  }, [session]);

  // Dark mode class toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        setViewMode('masonry');
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        setViewMode('kanban');
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '3') {
        e.preventDefault();
        setViewMode('focus');
        return;
      }

      if (isInput) return;

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleCreateNewNote();
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleCreateNewChecklist();
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('header input') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        syncService.syncNow();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setIsTakeoutModalOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notes]);

  // Hierarchical Tag Tree calculation
  const tagTree = useMemo(() => buildTagTree(notes), [notes]);

  // Pre-calculate backlink references for badges
  const backlinkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of notes) {
      if (note.isTrashed || !note.content) continue;
      const links = note.content.match(/\[\[(.*?)\]\]/g) || [];
      for (const link of links) {
        const title = link.slice(2, -2).trim().toLowerCase();
        counts[title] = (counts[title] || 0) + 1;
      }
    }
    return counts;
  }, [notes]);

  // Sidebar Counts
  const counts = useMemo(() => {
    return {
      all: notes.filter((n) => !n.isTrashed && !n.isArchived).length,
      checklists: notes.filter((n) => !n.isTrashed && !n.isArchived && n.items.length > 0).length,
      untagged: notes.filter((n) => !n.isTrashed && !n.isArchived && (!n.tags || n.tags.length === 0)).length,
      archive: notes.filter((n) => n.isArchived && !n.isTrashed).length,
      trash: notes.filter((n) => n.isTrashed).length,
    };
  }, [notes]);

  // Filtered Notes based on search, filterMode, and hierarchical selectedTag
  const visibleNotes = useMemo(() => {
    return notes.filter((note) => {
      // 1. Filter mode
      if (filterMode === 'trash') {
        if (!note.isTrashed) return false;
      } else {
        if (note.isTrashed) return false;
        if (filterMode === 'archive') {
          if (!note.isArchived) return false;
        } else {
          if (note.isArchived) return false;
          if (filterMode === 'checklists' && note.items.length === 0) return false;
          if (filterMode === 'untagged' && note.tags && note.tags.length > 0) return false;
        }
      }

      // 2. Hierarchical Tag filter
      if (selectedTag) {
        const lowerSelected = selectedTag.toLowerCase();
        const hasTagOrChild = note.tags.some(
          (t) => t.toLowerCase() === lowerSelected || t.toLowerCase().startsWith(`${lowerSelected}/`)
        );
        if (!hasTagOrChild) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = note.title.toLowerCase().includes(q);
        const matchesContent = note.content.toLowerCase().includes(q);
        const matchesTags = note.tags.some((t) => t.toLowerCase().includes(q));
        const matchesItems = note.items.some((i) => i.text.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesTags && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [notes, filterMode, selectedTag, searchQuery]);

  // --------------------------------------------------------------------------
  // Instant Visual Handlers (updates React state immediately + persists to DB)
  // --------------------------------------------------------------------------

  const handleSaveNote = async (note: Note) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === note.id);
      const updated = exists
        ? prev.map((n) => (n.id === note.id ? note : n))
        : [note, ...prev];
      persistLocal(updated);
      return updated;
    });

    try {
      await db.notes.put(note);
      await syncService.queueChange(note.id, 'update', note);
    } catch (e) {
      console.warn('DB error:', e);
    }
  };

  const handleCreateNewNote = () => {
    setEditingNote(null);
    setIsNoteModalOpen(true);
  };

  const handleCreateNewChecklist = () => {
    const emptyChecklistNote: Note = {
      id: `note-${Date.now()}`,
      title: '',
      content: '',
      items: [
        {
          id: `item-${Date.now()}-1`,
          text: '',
          isChecked: false,
          order: 0,
          indent: 0,
        },
      ],
      color: 'default',
      tags: [],
      isPinned: false,
      isArchived: false,
      isTrashed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncState: 'pending_create',
      version: 1,
    };
    setEditingNote(emptyChecklistNote);
    setIsNoteModalOpen(true);
  };

  const handleTogglePin = async (noteId: string) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === noteId ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() } : n
      );
      persistLocal(updated);
      return updated;
    });

    try {
      const note = await db.notes.get(noteId);
      if (note) {
        const updated = { ...note, isPinned: !note.isPinned, updatedAt: Date.now() };
        await db.notes.put(updated);
        await syncService.queueChange(noteId, 'update', updated);
      }
    } catch (e) {}
  };

  const handleToggleArchive = async (noteId: string) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === noteId ? { ...n, isArchived: !n.isArchived, updatedAt: Date.now() } : n
      );
      persistLocal(updated);
      return updated;
    });

    try {
      const note = await db.notes.get(noteId);
      if (note) {
        const updated = { ...note, isArchived: !note.isArchived, updatedAt: Date.now() };
        await db.notes.put(updated);
        await syncService.queueChange(noteId, 'update', updated);
      }
    } catch (e) {}
  };

  const handleDeleteNote = async (noteId: string) => {
    setNotes((prev) => {
      const target = prev.find((n) => n.id === noteId);
      if (!target) return prev;
      let updated: Note[];
      if (target.isTrashed) {
        // Permanent removal
        updated = prev.filter((n) => n.id !== noteId);
      } else {
        // Move to trash
        updated = prev.map((n) =>
          n.id === noteId ? { ...n, isTrashed: true, trashedAt: Date.now(), updatedAt: Date.now() } : n
        );
      }
      persistLocal(updated);
      return updated;
    });

    try {
      const note = await db.notes.get(noteId);
      if (note) {
        if (note.isTrashed) {
          await db.notes.delete(noteId);
          await syncService.queueChange(noteId, 'delete', { googleKeepId: note.googleKeepId });
        } else {
          const updated = { ...note, isTrashed: true, trashedAt: Date.now(), updatedAt: Date.now() };
          await db.notes.put(updated);
          await syncService.queueChange(noteId, 'update', updated);
        }
      }
    } catch (e) {}
  };

  const handleChangeColor = async (noteId: string, color: NoteColor) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === noteId ? { ...n, color, updatedAt: Date.now() } : n
      );
      persistLocal(updated);
      return updated;
    });

    try {
      const note = await db.notes.get(noteId);
      if (note) {
        const updated = { ...note, color, updatedAt: Date.now() };
        await db.notes.put(updated);
        await syncService.queueChange(noteId, 'update', updated);
      }
    } catch (e) {}
  };

  const handleToggleCheckItem = async (noteId: string, itemId: string) => {
    setNotes((prev) => {
      const updated = prev.map((note) => {
        if (note.id !== noteId) return note;
        const items = note.items.map((i) =>
          i.id === itemId ? { ...i, isChecked: !i.isChecked } : i
        );
        return { ...note, items, updatedAt: Date.now() };
      });
      persistLocal(updated);
      return updated;
    });

    try {
      const note = await db.notes.get(noteId);
      if (note) {
        const items = note.items.map((i) =>
          i.id === itemId ? { ...i, isChecked: !i.isChecked } : i
        );
        const updated = { ...note, items, updatedAt: Date.now() };
        await db.notes.put(updated);
        await syncService.queueChange(noteId, 'update', updated);
      }
    } catch (e) {}
  };

  const handleUpdateNoteTags = async (noteId: string, newTags: string[]) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === noteId ? { ...n, tags: newTags, updatedAt: Date.now() } : n
      );
      persistLocal(updated);
      return updated;
    });

    try {
      const note = await db.notes.get(noteId);
      if (note) {
        const updated = { ...note, tags: newTags, updatedAt: Date.now() };
        await db.notes.put(updated);
        await syncService.queueChange(noteId, 'update', updated);
      }
    } catch (e) {}
  };

  const handleOpenWikiLink = (targetTitle: string) => {
    const matching = notes.find(
      (n) => n.title.toLowerCase() === targetTitle.toLowerCase() && !n.isTrashed
    );
    if (matching) {
      setEditingNote(matching);
      setIsNoteModalOpen(true);
    } else {
      const newLinkedNote: Note = {
        id: `note-${Date.now()}`,
        title: targetTitle,
        content: `Referenced from wiki-link [[${targetTitle}]].`,
        items: [],
        color: 'default',
        tags: [],
        isPinned: false,
        isArchived: false,
        isTrashed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncState: 'pending_create',
        version: 1,
      };
      handleSaveNote(newLinkedNote);
      setEditingNote(newLinkedNote);
      setIsNoteModalOpen(true);
    }
  };

  // 1-Click infallible demo loader
  const handleLoadDemoNotes = async () => {
    setNotes([...INITIAL_DEMO_NOTES]);
    persistLocal(INITIAL_DEMO_NOTES);
    try {
      await forceSeedDemoNotes();
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Application Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        syncStatus={syncStatus}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenTakeoutModal={() => setIsTakeoutModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewNote={handleCreateNewNote}
        isAuthenticated={!!session}
        userEmail={session?.user?.email}
        userImage={session?.user?.image}
        onSignIn={() => signIn('google')}
        onSignOut={() => signOut()}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <div className="flex flex-1">
        {/* Hierarchical Tags & Navigation Sidebar */}
        <Sidebar
          currentFilter={filterMode}
          onSelectFilter={setFilterMode}
          tagTree={tagTree}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          counts={counts}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {/* Quick Note Creator (shown in all views except trash/archive) */}
          {filterMode === 'all' && (
            <QuickNoteCreator onSave={handleSaveNote} />
          )}

          {/* View Mode Switching */}
          {viewMode === 'masonry' && (
            <MasonryView
              notes={visibleNotes}
              onSelectNote={(note) => {
                setEditingNote(note);
                setIsNoteModalOpen(true);
              }}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
              onDeleteNote={handleDeleteNote}
              onChangeColor={handleChangeColor}
              onToggleCheckItem={handleToggleCheckItem}
              onTagClick={(tag) => setSelectedTag(tag)}
              onOpenWikiLink={handleOpenWikiLink}
              backlinkCounts={backlinkCounts}
              onNewNote={handleCreateNewNote}
              onLoadDemoNotes={handleLoadDemoNotes}
            />
          )}

          {viewMode === 'kanban' && (
            <KanbanView
              notes={visibleNotes}
              onSelectNote={(note) => {
                setEditingNote(note);
                setIsNoteModalOpen(true);
              }}
              onUpdateNoteTags={handleUpdateNoteTags}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
              onDeleteNote={handleDeleteNote}
              onChangeColor={handleChangeColor}
              onToggleCheckItem={handleToggleCheckItem}
              onOpenWikiLink={handleOpenWikiLink}
              backlinkCounts={backlinkCounts}
            />
          )}

          {viewMode === 'focus' && (
            <FocusListView
              notes={visibleNotes}
              selectedNote={editingNote}
              onSelectNote={setEditingNote}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onToggleArchive={handleToggleArchive}
              onTogglePin={handleTogglePin}
              onNewNote={handleCreateNewNote}
              onOpenWikiLink={handleOpenWikiLink}
              backlinkCounts={backlinkCounts}
            />
          )}
        </main>
      </div>

      {/* Note Editor Modal */}
      <NoteModal
        note={editingNote}
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        onArchive={handleToggleArchive}
        allNotes={notes}
        onOpenLinkedNote={handleOpenWikiLink}
      />

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={notes}
        onSelectNote={(note) => {
          setEditingNote(note);
          setIsNoteModalOpen(true);
        }}
        onNewNote={handleCreateNewNote}
        onNewChecklist={handleCreateNewChecklist}
        onSwitchView={setViewMode}
        onForceSync={() => syncService.syncNow()}
        onOpenTakeoutModal={() => setIsTakeoutModalOpen(true)}
        onSelectTag={(tag) => setSelectedTag(tag)}
      />

      {/* Google Sync Status Modal */}
      <SyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        status={syncStatus}
        isAuthenticated={!!session}
        userEmail={session?.user?.email}
        onSignIn={() => signIn('google')}
        onSignOut={() => signOut()}
      />

      {/* Google Takeout Importer Modal */}
      <TakeoutImportModal
        isOpen={isTakeoutModalOpen}
        onClose={() => setIsTakeoutModalOpen(false)}
        onImportComplete={() => {
          // Re-sync notes from DB or sample data
          db.notes.toArray().then((n) => {
            if (n && n.length > 0) {
              setNotes(n);
              persistLocal(n);
            }
          });
        }}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
