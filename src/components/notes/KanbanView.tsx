'use client';

import React, { useState } from 'react';
import { Note, NoteColor } from '@/types/note';
import { NoteCard } from './NoteCard';
import { Plus, X, Kanban as KanbanIcon } from 'lucide-react';

interface KanbanViewProps {
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onUpdateNoteTags: (noteId: string, newTags: string[]) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onChangeColor: (noteId: string, color: NoteColor) => void;
  onToggleCheckItem: (noteId: string, itemId: string) => void;
  onOpenWikiLink?: (targetTitle: string) => void;
  backlinkCounts?: Record<string, number>;
}

const DEFAULT_COLUMNS = ['todo', 'doing', 'done', 'ideas'];

export function KanbanView({
  notes,
  onSelectNote,
  onUpdateNoteTags,
  onTogglePin,
  onToggleArchive,
  onDeleteNote,
  onChangeColor,
  onToggleCheckItem,
  onOpenWikiLink,
  backlinkCounts = {},
}: KanbanViewProps) {
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [newColumnName, setNewColumnName] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleAddColumn = () => {
    const trimmed = newColumnName.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && !columns.includes(trimmed)) {
      setColumns([...columns, trimmed]);
      setNewColumnName('');
      setIsAddingColumn(false);
    }
  };

  const handleRemoveColumn = (col: string) => {
    setColumns(columns.filter((c) => c !== col));
  };

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData('text/plain', noteId);
    setDraggedNoteId(noteId);
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    setDragOverColumn(col);
  };

  const handleDrop = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const noteId = e.dataTransfer.getData('text/plain') || draggedNoteId;
    if (!noteId) return;

    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    // Remove any of the other kanban column tags and add the target column tag
    const remainingTags = note.tags.filter((t) => !columns.includes(t.toLowerCase()));
    const updatedTags = Array.from(new Set([...remainingTags, targetCol.toLowerCase()]));

    onUpdateNoteTags(noteId, updatedTags);
    setDraggedNoteId(null);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 pb-12 overflow-x-auto">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <KanbanIcon className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Tag-Based Kanban Workflow
          </h2>
          <span className="text-xs text-neutral-400">
            (Drag notes between columns to change tags)
          </span>
        </div>

        {isAddingColumn ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Column tag..."
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddColumn();
                if (e.key === 'Escape') setIsAddingColumn(false);
              }}
              className="text-xs px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleAddColumn}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600"
            >
              Add
            </button>
            <button
              onClick={() => setIsAddingColumn(false)}
              className="p-1 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingColumn(true)}
            className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Tag Column
          </button>
        )}
      </div>

      <div className="flex gap-4 items-start min-h-[70vh]">
        {columns.map((col) => {
          const columnNotes = notes.filter(
            (n) => !n.isTrashed && n.tags.some((t) => t.toLowerCase() === col)
          );
          const isOver = dragOverColumn === col;

          return (
            <div
              key={col}
              onDragOver={(e) => handleDragOver(e, col)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, col)}
              className={`w-80 shrink-0 rounded-2xl border transition-all p-3 flex flex-col max-h-[82vh] ${
                isOver
                  ? 'border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/20'
                  : 'border-neutral-200 dark:border-neutral-800/80 bg-neutral-100/60 dark:bg-neutral-900/60'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    #{col}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono">
                    {columnNotes.length}
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveColumn(col)}
                  className="p-1 rounded text-neutral-400 hover:text-rose-500 transition-colors"
                  title="Remove column"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 p-1">
                {columnNotes.map((note) => (
                  <div
                    key={note.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, note.id)}
                    className="cursor-grab active:cursor-grabbing transition-transform"
                  >
                    <NoteCard
                      note={note}
                      onClick={() => onSelectNote(note)}
                      onTogglePin={() => onTogglePin(note.id)}
                      onToggleArchive={() => onToggleArchive(note.id)}
                      onDelete={() => onDeleteNote(note.id)}
                      onChangeColor={(color) => onChangeColor(note.id, color)}
                      onToggleCheckItem={(itemId) => onToggleCheckItem(note.id, itemId)}
                      onOpenWikiLink={onOpenWikiLink}
                      backlinkCount={backlinkCounts[note.title?.toLowerCase() || ''] || 0}
                    />
                  </div>
                ))}

                {columnNotes.length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl text-xs text-neutral-400">
                    Drop notes here to tag as #{col}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
