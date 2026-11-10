'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Note, ViewMode } from '@/types/note';
import {
  Search,
  Plus,
  CheckSquare,
  LayoutGrid,
  Kanban,
  FileText,
  RefreshCw,
  UploadCloud,
  Moon,
  Sun,
  X,
  Tag,
  CornerDownLeft,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  onNewChecklist: () => void;
  onSwitchView: (mode: ViewMode) => void;
  onForceSync: () => void;
  onOpenTakeoutModal: () => void;
  onSelectTag: (tag: string | null) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onNewNote,
  onNewChecklist,
  onSwitchView,
  onForceSync,
  onOpenTakeoutModal,
  onSelectTag,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Close on Escape, navigate with ArrowUp/Down
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Static actions
  const staticActions = [
    {
      id: 'action-new-note',
      title: 'New Note',
      description: 'Create a new markdown note',
      icon: Plus,
      shortcut: 'C',
      action: () => {
        onNewNote();
        onClose();
      },
    },
    {
      id: 'action-new-checklist',
      title: 'New Checklist',
      description: 'Create an interactive task list',
      icon: CheckSquare,
      shortcut: 'L',
      action: () => {
        onNewChecklist();
        onClose();
      },
    },
    {
      id: 'action-view-masonry',
      title: 'Switch to Masonry View',
      description: 'Classic Google Keep sticky grid layout',
      icon: LayoutGrid,
      shortcut: '1',
      action: () => {
        onSwitchView('masonry');
        onClose();
      },
    },
    {
      id: 'action-view-kanban',
      title: 'Switch to Kanban View',
      description: 'Organize notes by status columns',
      icon: Kanban,
      shortcut: '2',
      action: () => {
        onSwitchView('kanban');
        onClose();
      },
    },
    {
      id: 'action-view-focus',
      title: 'Switch to Focus List',
      description: 'Distraction-free split-pane editor',
      icon: FileText,
      shortcut: '3',
      action: () => {
        onSwitchView('focus');
        onClose();
      },
    },
    {
      id: 'action-sync',
      title: 'Force Sync with Google',
      description: 'Run Keep API & Drive AppData synchronization',
      icon: RefreshCw,
      shortcut: 'R',
      action: () => {
        onForceSync();
        onClose();
      },
    },
    {
      id: 'action-takeout',
      title: 'Import Google Takeout Archive',
      description: 'Import Keep .json files',
      icon: UploadCloud,
      shortcut: 'I',
      action: () => {
        onOpenTakeoutModal();
        onClose();
      },
    },
  ];

  // Filter notes and actions based on query
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return {
        actions: staticActions,
        notes: notes.filter((n) => !n.isTrashed).slice(0, 5),
      };
    }

    const matchingActions = staticActions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );

    const matchingNotes = notes
      .filter((n) => !n.isTrashed)
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          n.items.some((i) => i.text.toLowerCase().includes(q))
      )
      .slice(0, 8);

    return {
      actions: matchingActions,
      notes: matchingNotes,
    };
  }, [query, notes]);

  const totalItems = filteredItems.actions.length + filteredItems.notes.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredItems.actions.length) {
        filteredItems.actions[selectedIndex].action();
      } else {
        const noteIdx = selectedIndex - filteredItems.actions.length;
        const note = filteredItems.notes[noteIdx];
        if (note) {
          onSelectNote(note);
          onClose();
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 gap-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            className="flex-1 bg-transparent text-base text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
            placeholder="Type a command, search notes, tags, or tasks..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-neutral-100 dark:divide-neutral-800/50">
          {filteredItems.actions.length > 0 && (
            <div className="pb-2">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-3 py-1.5">
                Actions
              </div>
              {filteredItems.actions.map((action, idx) => {
                const Icon = action.icon;
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={action.id}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-900 dark:text-amber-100 font-medium'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                    }`}
                    onClick={action.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{action.title}</div>
                        <div className="text-xs text-neutral-400">{action.description}</div>
                      </div>
                    </div>
                    {action.shortcut && (
                      <kbd className="text-xs px-2 py-0.5 font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                        {action.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {filteredItems.notes.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-3 py-1.5">
                Matching Notes
              </div>
              {filteredItems.notes.map((note, idx) => {
                const itemIdx = filteredItems.actions.length + idx;
                const isSelected = selectedIndex === itemIdx;
                return (
                  <button
                    key={note.id}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-900 dark:text-amber-100 font-medium'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                    }`}
                    onClick={() => {
                      onSelectNote(note);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(itemIdx)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 shrink-0">
                        {note.items.length > 0 ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {note.title || 'Untitled Note'}
                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          {note.content || `${note.items.length} checklist items`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {note.tags.length > 0 && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          #{note.tags[0]}
                        </span>
                      )}
                      <CornerDownLeft className="w-3.5 h-3.5 text-neutral-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div className="py-12 text-center text-sm text-neutral-400">
              No matching commands or notes found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 dark:bg-neutral-950/50 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div>KeepPlus Power-Search</div>
        </div>
      </div>
    </div>
  );
}
