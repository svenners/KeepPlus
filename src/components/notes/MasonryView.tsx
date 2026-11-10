'use client';

import React from 'react';
import { Note, NoteColor } from '@/types/note';
import { NoteCard } from './NoteCard';
import { Pin, Sparkles } from 'lucide-react';

interface MasonryViewProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onChangeColor: (noteId: string, color: NoteColor) => void;
  onToggleCheckItem: (noteId: string, itemId: string) => void;
  onTagClick?: (tag: string) => void;
  onOpenWikiLink?: (targetTitle: string) => void;
  backlinkCounts?: Record<string, number>;
  onNewNote?: () => void;
  onLoadDemoNotes?: () => void;
}

export function MasonryView({
  notes,
  onSelectNote,
  onTogglePin,
  onToggleArchive,
  onDeleteNote,
  onChangeColor,
  onToggleCheckItem,
  onTagClick,
  onOpenWikiLink,
  backlinkCounts = {},
  onNewNote,
  onLoadDemoNotes,
}: MasonryViewProps) {
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);

  if (notes.length === 0) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4">
        <Sparkles className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-200">
          Ready to capture your thoughts
        </h3>
        <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
          Create notes with live Markdown, nestable checklists, and bi-directional WikiLinks, or load pre-built demo notes to explore all features.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          {onNewNote && (
            <button
              onClick={onNewNote}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              ＋ Create First Note
            </button>
          )}
          {onLoadDemoNotes && (
            <button
              onClick={onLoadDemoNotes}
              className="w-full sm:w-auto px-5 py-2.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 transition-all active:scale-95"
            >
              ⚡ Load Demo Notes
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-16">
      {/* Pinned Section */}
      {pinnedNotes.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3 px-1 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            <Pin className="w-3.5 h-3.5" />
            <span>Pinned</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onSelectNote(note)}
                onTogglePin={() => onTogglePin(note.id)}
                onToggleArchive={() => onToggleArchive(note.id)}
                onDelete={() => onDeleteNote(note.id)}
                onChangeColor={(color) => onChangeColor(note.id, color)}
                onToggleCheckItem={(itemId) => onToggleCheckItem(note.id, itemId)}
                onTagClick={onTagClick}
                onOpenWikiLink={onOpenWikiLink}
                backlinkCount={backlinkCounts[note.title?.toLowerCase() || ''] || 0}
              />
            ))}
          </div>
        </section>
      )}

      {/* Others Section */}
      {otherNotes.length > 0 && (
        <section>
          {pinnedNotes.length > 0 && (
            <div className="flex items-center gap-2 mb-3 px-1 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <span>Others</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onSelectNote(note)}
                onTogglePin={() => onTogglePin(note.id)}
                onToggleArchive={() => onToggleArchive(note.id)}
                onDelete={() => onDeleteNote(note.id)}
                onChangeColor={(color) => onChangeColor(note.id, color)}
                onToggleCheckItem={(itemId) => onToggleCheckItem(note.id, itemId)}
                onTagClick={onTagClick}
                onOpenWikiLink={onOpenWikiLink}
                backlinkCount={backlinkCounts[note.title?.toLowerCase() || ''] || 0}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
