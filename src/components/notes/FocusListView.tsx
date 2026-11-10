'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Search,
  Plus,
  CheckSquare,
  FileText,
  Pin,
  Archive,
  Trash2,
  Palette,
  Eye,
  Edit3,
  Link as LinkIcon,
} from 'lucide-react';
import { Note, ChecklistItem, NoteColor, NOTE_COLORS } from '@/types/note';

interface FocusListViewProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onSaveNote: (note: Note) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onNewNote: () => void;
  onOpenWikiLink?: (targetTitle: string) => void;
  backlinkCounts?: Record<string, number>;
}

export function FocusListView({
  notes,
  selectedNote,
  onSelectNote,
  onSaveNote,
  onDeleteNote,
  onToggleArchive,
  onTogglePin,
  onNewNote,
  onOpenWikiLink,
  backlinkCounts = {},
}: FocusListViewProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const activeNote = selectedNote || notes[0] || null;

  const filteredNotes = notes.filter((n) => {
    if (n.isTrashed) return false;
    const q = filterQuery.toLowerCase();
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleTitleChange = (val: string) => {
    if (!activeNote) return;
    onSaveNote({ ...activeNote, title: val, updatedAt: Date.now() });
  };

  const handleContentChange = (val: string) => {
    if (!activeNote) return;
    onSaveNote({ ...activeNote, content: val, updatedAt: Date.now() });
  };

  const handleToggleCheck = (itemId: string) => {
    if (!activeNote) return;
    const updatedItems = activeNote.items.map((i) =>
      i.id === itemId ? { ...i, isChecked: !i.isChecked } : i
    );
    onSaveNote({ ...activeNote, items: updatedItems, updatedAt: Date.now() });
  };

  const handleColorChange = (color: NoteColor) => {
    if (!activeNote) return;
    onSaveNote({ ...activeNote, color, updatedAt: Date.now() });
  };

  const activeColorStyles = activeNote
    ? NOTE_COLORS[activeNote.color] || NOTE_COLORS.default
    : NOTE_COLORS.default;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-12 flex flex-col md:flex-row gap-6 h-[80vh]">
      {/* Left Column: Note List */}
      <div className="w-full md:w-80 shrink-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-xs">
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search in focus..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800 border-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none"
            />
          </div>
          <button
            onClick={onNewNote}
            className="p-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            title="New note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60 p-1.5">
          {filteredNotes.map((note) => {
            const isSelected = activeNote?.id === note.id;
            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {note.title || 'Untitled Note'}
                  </h4>
                  {note.isPinned && (
                    <Pin className="w-3 h-3 text-amber-500 fill-current shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                  {note.content || `${note.items.length} checklist items`}
                </p>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-2">
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  {note.tags.length > 0 && (
                    <span className="truncate max-w-[100px]">#{note.tags[0]}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Focus Editor Pane */}
      {activeNote ? (
        <div
          className={`flex-1 rounded-2xl border shadow-sm flex flex-col overflow-hidden transition-all ${
            activeColorStyles.bgLight
          } ${activeColorStyles.borderLight} ${activeColorStyles.bgDark} ${activeColorStyles.borderDark}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Title"
              className="text-lg font-bold bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none flex-1 mr-4"
            />

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  previewMode
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {previewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {previewMode ? 'Edit' : 'Preview'}
                </span>
              </button>

              <button
                onClick={() => onTogglePin(activeNote.id)}
                className={`p-2 rounded-lg transition-colors ${
                  activeNote.isPinned
                    ? 'text-amber-500 bg-amber-500/10'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <Pin className={`w-4 h-4 ${activeNote.isPinned ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={() => onDeleteNote(activeNote.id)}
                className="p-2 rounded-lg text-neutral-400 hover:text-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {previewMode ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeNote.content}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={activeNote.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Write in distraction-free focus mode..."
                rows={12}
                className="w-full bg-transparent text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none resize-none font-sans"
              />
            )}

            {/* Checklists */}
            {activeNote.items && activeNote.items.length > 0 && (
              <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-2">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Checklist Items
                </div>
                {activeNote.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 text-sm text-neutral-800 dark:text-neutral-200"
                    style={{ paddingLeft: `${item.indent * 16}px` }}
                  >
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={() => handleToggleCheck(item.id)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className={item.isChecked ? 'line-through text-neutral-400' : ''}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center border border-dashed rounded-2xl text-neutral-400 text-sm">
          Select or create a note to start focusing.
        </div>
      )}
    </div>
  );
}
