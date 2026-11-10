'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Pin,
  Archive,
  Trash2,
  CheckSquare,
  Plus,
  Palette,
  Tag as TagIcon,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Link as LinkIcon,
  Eye,
  Edit3,
  Columns,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Note, ChecklistItem, NoteColor, NOTE_COLORS } from '@/types/note';
import { extractInlineTags, extractWikiLinks, findBacklinks } from '@/lib/db';

interface NoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedNote: Note) => void;
  onDelete: (noteId: string) => void;
  onArchive: (noteId: string) => void;
  allNotes: Note[];
  onOpenLinkedNote?: (linkedTitle: string) => void;
}

export function NoteModal({
  note,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onArchive,
  allNotes,
  onOpenLinkedNote,
}: NoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [color, setColor] = useState<NoteColor>('default');
  const [tags, setTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [isTrashed, setIsTrashed] = useState(false);
  
  // Editor view modes: 'edit' | 'preview' | 'split'
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [isMaximized, setIsMaximized] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // WikiLink autocomplete popup state
  const [wikiSearch, setWikiSearch] = useState<string | null>(null);
  const [wikiCursorPos, setWikiCursorPos] = useState<number>(0);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Backlinks
  const [backlinks, setBacklinks] = useState<Note[]>([]);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setItems(note.items || []);
      setColor(note.color || 'default');
      setTags(note.tags || []);
      setIsPinned(note.isPinned);
      setIsArchived(note.isArchived);
      setIsTrashed(note.isTrashed);

      // Fetch backlinks referencing this note's title
      if (note.title) {
        findBacklinks(note.title, note.id).then(setBacklinks);
      } else {
        setBacklinks([]);
      }
    } else {
      setTitle('');
      setContent('');
      setItems([]);
      setColor('default');
      setTags([]);
      setIsPinned(false);
      setIsArchived(false);
      setIsTrashed(false);
      setBacklinks([]);
    }
    setEditorMode('edit');
  }, [note]);

  // Handle Cmd+Enter to save, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape' && !wikiSearch) {
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, title, content, items, color, tags, isPinned, isArchived, isTrashed, wikiSearch]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() && !content.trim() && items.length === 0) {
      onClose();
      return;
    }

    // Auto extract any inline tags from content & title
    const contentTags = extractInlineTags(content);
    const titleTags = extractInlineTags(title);
    const combinedTags = Array.from(new Set([...tags, ...contentTags, ...titleTags]));

    const updated: Note = {
      id: note?.id || `note-${Date.now()}`,
      title: title.trim(),
      content,
      items,
      color,
      tags: combinedTags,
      isPinned,
      isArchived,
      isTrashed,
      createdAt: note?.createdAt || Date.now(),
      updatedAt: Date.now(),
      syncState: 'pending_update',
      version: (note?.version || 0) + 1,
      googleKeepId: note?.googleKeepId,
      googleDriveFileId: note?.googleDriveFileId,
    };

    onSave(updated);
    onClose();
  };

  // Checklist manipulations
  const handleToggleCheck = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isChecked: !i.isChecked } : i))
    );
  };

  const handleItemTextChange = (id: string, text: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, text } : i))
    );
  };

  const handleIndentItem = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const newIndent = Math.max(0, Math.min(2, i.indent + delta));
          return { ...i, indent: newIndent };
        }
        return i;
      })
    );
  };

  const handleAddItem = (afterIndex?: number) => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: '',
      isChecked: false,
      order: items.length,
      indent: afterIndex !== undefined && items[afterIndex] ? items[afterIndex].indent : 0,
    };

    if (afterIndex !== undefined) {
      const copy = [...items];
      copy.splice(afterIndex + 1, 0, newItem);
      setItems(copy);
    } else {
      setItems((prev) => [...prev, newItem]);
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // WikiLink detection while typing in textarea
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);

    // Look for [[ before the cursor
    const textBefore = val.slice(0, pos);
    const lastOpen = textBefore.lastIndexOf('[[');
    const lastClose = textBefore.lastIndexOf(']]');

    if (lastOpen !== -1 && (lastClose === -1 || lastOpen > lastClose)) {
      const query = textBefore.slice(lastOpen + 2);
      setWikiSearch(query);
      setWikiCursorPos(lastOpen);
    } else {
      setWikiSearch(null);
    }
  };

  const insertWikiLink = (targetTitle: string) => {
    if (wikiSearch === null || wikiCursorPos === -1) return;
    const before = content.slice(0, wikiCursorPos);
    const after = content.slice(wikiCursorPos + 2 + wikiSearch.length);
    const newContent = `${before}[[${targetTitle}]]${after}`;
    setContent(newContent);
    setWikiSearch(null);
  };

  // Tag manipulation
  const handleAddTag = () => {
    const trimmed = newTagInput.trim().replace(/^#/, '').toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const colorStyles = NOTE_COLORS[color] || NOTE_COLORS.default;

  // Wiki links list matching query
  const matchingNotesForLink = allNotes.filter(
    (n) =>
      (!wikiSearch || n.title.toLowerCase().includes(wikiSearch.toLowerCase())) &&
      n.id !== note?.id &&
      n.title.trim().length > 0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleSave}
    >
      <div
        className={`w-full transition-all duration-200 rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
          colorStyles.bgLight
        } ${colorStyles.borderLight} ${colorStyles.bgDark} ${colorStyles.borderDark} ${
          isMaximized
            ? 'h-[96vh] max-w-6xl'
            : 'max-h-[90vh] max-w-3xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
          <div className="flex-1 mr-4">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold bg-transparent placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mode Switcher */}
            <div className="flex items-center rounded-lg bg-neutral-200/50 dark:bg-neutral-800/60 p-0.5 text-xs text-neutral-600 dark:text-neutral-400 mr-2">
              <button
                onClick={() => setEditorMode('edit')}
                className={`p-1.5 rounded-md transition-colors ${
                  editorMode === 'edit'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
                title="Edit Markdown"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditorMode('split')}
                className={`p-1.5 rounded-md hidden sm:block transition-colors ${
                  editorMode === 'split'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
                title="Split View"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEditorMode('preview')}
                className={`p-1.5 rounded-md transition-colors ${
                  editorMode === 'preview'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
                title="Preview Rendered Markdown"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pin Toggle */}
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-lg transition-colors ${
                isPinned
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
            </button>

            {/* Maximize Toggle */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors hidden sm:block"
              title={isMaximized ? 'Restore size' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={handleSave}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Save & close (Cmd+Enter)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Editor & Preview Area */}
          <div
            className={`grid gap-4 ${
              editorMode === 'split' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* Textarea for Markdown */}
            {(editorMode === 'edit' || editorMode === 'split') && (
              <div className="relative">
                <textarea
                  ref={contentTextareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Take a note (Markdown supported: **bold**, # header, ```code blocks, [[links]])..."
                  rows={editorMode === 'split' ? 14 : 9}
                  className="w-full bg-transparent text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none resize-none font-sans"
                />

                {/* WikiLink Autocomplete Menu */}
                {wikiSearch !== null && matchingNotesForLink.length > 0 && (
                  <div className="absolute left-4 top-12 z-50 w-72 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-1.5 animate-in fade-in">
                    <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
                      Link to note
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {matchingNotesForLink.slice(0, 6).map((match) => (
                        <button
                          key={match.id}
                          onClick={() => insertWikiLink(match.title)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-left rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-amber-500/10 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                        >
                          <LinkIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{match.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Live Markdown Render View */}
            {(editorMode === 'preview' || editorMode === 'split') && (
              <div
                className={`prose prose-sm dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 leading-relaxed overflow-y-auto ${
                  editorMode === 'split'
                    ? 'border-l border-neutral-200/60 dark:border-neutral-800/60 pl-4 max-h-[380px]'
                    : 'min-h-[160px]'
                }`}
              >
                {content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom renderer for clickable WikiLinks [[Title]]
                      p: ({ children }) => {
                        return <p>{renderTextWithWikiLinks(children, onOpenLinkedNote)}</p>;
                      },
                      li: ({ children }) => {
                        return <li>{renderTextWithWikiLinks(children, onOpenLinkedNote)}</li>;
                      },
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-neutral-400 italic">No markdown body entered yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Interactive Nestable Checklist Items */}
          <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                Checklist ({items.filter((i) => i.isChecked).length}/{items.length})
              </span>
              <button
                onClick={() => handleAddItem()}
                className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add item
              </button>
            </div>

            <div className="space-y-1.5">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 group py-0.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ paddingLeft: `${item.indent * 20}px` }}
                >
                  <GripVertical className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />

                  {/* Indent / Outdent Controls */}
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleIndentItem(item.id, -1)}
                      disabled={item.indent === 0}
                      className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20"
                      title="Outdent (Shift+Tab)"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleIndentItem(item.id, 1)}
                      disabled={item.indent >= 2}
                      className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-20"
                      title="Indent (Tab)"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="checkbox"
                    checked={item.isChecked}
                    onChange={() => handleToggleCheck(item.id)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 cursor-pointer"
                  />

                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleItemTextChange(item.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem(idx);
                      } else if (e.key === 'Backspace' && item.text === '') {
                        e.preventDefault();
                        handleDeleteItem(item.id);
                      } else if (e.key === 'Tab') {
                        e.preventDefault();
                        handleIndentItem(item.id, e.shiftKey ? -1 : 1);
                      }
                    }}
                    placeholder="List item..."
                    className={`flex-1 bg-transparent text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none ${
                      item.isChecked ? 'line-through text-neutral-400 dark:text-neutral-500' : ''
                    }`}
                  />

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-neutral-300 group-hover:text-neutral-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Chips Bar */}
          <div className="pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-200/60 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {showTagInput ? (
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="tag (e.g. work/frontend)"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    } else if (e.key === 'Escape') {
                      setShowTagInput(false);
                    }
                  }}
                  autoFocus
                  className="text-xs px-2.5 py-1 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={handleAddTag}
                  className="text-xs text-amber-600 dark:text-amber-400 font-semibold px-1"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add tag
              </button>
            )}
          </div>

          {/* Bi-Directional Backlinks Section */}
          {backlinks.length > 0 && (
            <div className="pt-4 border-t border-black/5 dark:border-white/5">
              <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-amber-500" />
                Linked References ({backlinks.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {backlinks.map((bl) => (
                  <div
                    key={bl.id}
                    onClick={() => {
                      if (onOpenLinkedNote) {
                        handleSave();
                        onOpenLinkedNote(bl.title);
                      }
                    }}
                    className="p-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-900/40 hover:border-amber-500/50 cursor-pointer transition-all"
                  >
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {bl.title || 'Untitled'}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate mt-0.5">
                      {bl.content.slice(0, 80)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-1 relative">
            {/* Color Picker Toggle */}
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Change note color"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Color Palette Popover */}
            {showColorPicker && (
              <div className="absolute left-0 bottom-12 z-50 p-2.5 rounded-2xl bg-white dark:bg-neutral-800 shadow-xl border border-neutral-200 dark:border-neutral-700 grid grid-cols-6 gap-2">
                {Object.entries(NOTE_COLORS).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setColor(key as NoteColor);
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full border transition-transform ${
                      color === key ? 'scale-125 ring-2 ring-amber-500 ring-offset-1' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: val.badge }}
                    title={val.name}
                  />
                ))}
              </div>
            )}

            {/* Archive Toggle */}
            <button
              onClick={() => setIsArchived(!isArchived)}
              className={`p-2 rounded-lg transition-colors ${
                isArchived
                  ? 'text-amber-600 bg-amber-500/10'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
              title={isArchived ? 'Unarchive' : 'Archive note'}
            >
              <Archive className="w-4 h-4" />
            </button>

            {/* Trash */}
            {note && (
              <button
                onClick={() => {
                  onDelete(note.id);
                  onClose();
                }}
                className="p-2 rounded-lg text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 hidden sm:inline">
              Press <kbd className="font-mono">Cmd+Enter</kbd> to save
            </span>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to replace [[Title]] in markdown text with interactive link badges
function renderTextWithWikiLinks(
  children: React.ReactNode,
  onOpenLinkedNote?: (title: string) => void
): React.ReactNode {
  if (typeof children === 'string') {
    const parts = children.split(/(\[\[.*?\]\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[[') && part.endsWith(']]')) {
        const title = part.slice(2, -2).trim();
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenLinkedNote) onOpenLinkedNote(title);
            }}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium cursor-pointer hover:underline text-xs"
          >
            <LinkIcon className="w-3 h-3 inline" />
            {title}
          </span>
        );
      }
      return part;
    });
  }

  if (Array.isArray(children)) {
    return children.map((c, i) => (
      <React.Fragment key={i}>{renderTextWithWikiLinks(c, onOpenLinkedNote)}</React.Fragment>
    ));
  }

  return children;
}
