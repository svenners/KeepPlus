'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  CheckSquare,
  Pin,
  Palette,
  X,
  Plus,
  Tag,
  Code,
  FileText,
} from 'lucide-react';
import { Note, ChecklistItem, NoteColor, NOTE_COLORS } from '@/types/note';
import { extractInlineTags } from '@/lib/db';

interface QuickNoteCreatorProps {
  onSave: (note: Note) => void;
  defaultMode?: 'text' | 'checklist';
}

export function QuickNoteCreator({ onSave }: QuickNoteCreatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [color, setColor] = useState<NoteColor>('default');
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        isExpanded
      ) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded, title, content, items, color, isPinned, tags]);

  const handleSave = () => {
    if (!title.trim() && !content.trim() && items.length === 0) {
      setIsExpanded(false);
      resetState();
      return;
    }

    const contentTags = extractInlineTags(content);
    const titleTags = extractInlineTags(title);
    const combinedTags = Array.from(new Set([...tags, ...contentTags, ...titleTags]));

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: title.trim(),
      content,
      items: isChecklistMode ? items : [],
      color,
      tags: combinedTags,
      isPinned,
      isArchived: false,
      isTrashed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      syncState: 'pending_create',
      version: 1,
    };

    onSave(newNote);
    setIsExpanded(false);
    resetState();
  };

  const resetState = () => {
    setTitle('');
    setContent('');
    setItems([]);
    setIsChecklistMode(false);
    setColor('default');
    setIsPinned(false);
    setTags([]);
    setShowColorPicker(false);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length}`,
        text: '',
        isChecked: false,
        order: prev.length,
        indent: 0,
      },
    ]);
  };

  const colorStyles = NOTE_COLORS[color] || NOTE_COLORS.default;

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4" ref={containerRef}>
      {!isExpanded ? (
        // Collapsed View
        <div
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md cursor-text transition-all gap-2"
        >
          <input
            type="text"
            placeholder="Take a note (click here to write, Markdown & #tags supported)..."
            onClick={() => setIsExpanded(true)}
            onFocus={() => setIsExpanded(true)}
            onChange={(e) => {
              setIsExpanded(true);
              setContent(e.target.value);
            }}
            className="flex-1 bg-transparent text-sm font-medium text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none cursor-text"
          />
          <div className="flex items-center gap-1.5 shrink-0 text-neutral-500">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsChecklistMode(true);
                setIsExpanded(true);
                handleAddItem();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500/10 text-neutral-600 dark:text-neutral-300 hover:text-amber-600 transition-colors text-xs font-semibold"
              title="New checklist (L)"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                setContent('```typescript\n// Paste code here\n```\n');
              }}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-amber-500 transition-colors"
              title="New code block"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // Expanded View
        <div
          className={`rounded-2xl border shadow-lg overflow-hidden transition-all duration-150 ${colorStyles.bgLight} ${colorStyles.borderLight} ${colorStyles.bgDark} ${colorStyles.borderDark}`}
        >
          {/* Title & Pin */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-bold bg-transparent placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1.5 rounded-lg transition-colors ${
                isPinned
                  ? 'text-amber-600 bg-amber-500/10'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
              title={isPinned ? 'Unpin' : 'Pin to top'}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Content / Checklist Body */}
          <div className="px-4 py-2 space-y-3">
            <textarea
              placeholder="Take a note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full bg-transparent text-sm leading-relaxed text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none resize-none font-sans"
            />

            {/* Checklist items if active */}
            {isChecklistMode && (
              <div className="space-y-1.5 border-t border-black/5 dark:border-white/5 pt-2">
                {items.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={() =>
                        setItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id ? { ...i, isChecked: !i.isChecked } : i
                          )
                        )
                      }
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-neutral-300 dark:border-neutral-700"
                    />
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id ? { ...i, text: e.target.value } : i
                          )
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddItem();
                        }
                      }}
                      placeholder="List item..."
                      className="flex-1 bg-transparent text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none"
                    />
                    <button
                      onClick={() =>
                        setItems((prev) => prev.filter((i) => i.id !== item.id))
                      }
                      className="p-1 text-neutral-400 hover:text-rose-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline pt-1"
                >
                  <Plus className="w-3 h-3" />
                  Add item
                </button>
              </div>
            )}

            {/* Tags Pills */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/5 dark:bg-white/10 text-neutral-700 dark:text-neutral-300"
                  >
                    #{t}
                    <button
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="hover:text-rose-500"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-1 relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Color"
              >
                <Palette className="w-4 h-4" />
              </button>

              {showColorPicker && (
                <div className="absolute left-0 bottom-10 z-50 p-2 rounded-2xl bg-white dark:bg-neutral-800 shadow-xl border border-neutral-200 dark:border-neutral-700 grid grid-cols-6 gap-1.5">
                  {Object.entries(NOTE_COLORS).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setColor(key as NoteColor);
                        setShowColorPicker(false);
                      }}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        color === key ? 'scale-125 ring-2 ring-amber-500' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: val.badge }}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  if (!isChecklistMode) {
                    setIsChecklistMode(true);
                    if (items.length === 0) handleAddItem();
                  } else {
                    setIsChecklistMode(false);
                  }
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  isChecklistMode
                    ? 'text-amber-600 bg-amber-500/10'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                title="Toggle checklist mode"
              >
                <CheckSquare className="w-4 h-4" />
              </button>

              {showTagInput ? (
                <div className="flex items-center gap-1 ml-1">
                  <input
                    type="text"
                    placeholder="tag"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTagInput.trim()) {
                          setTags([...tags, newTagInput.trim().replace(/^#/, '')]);
                          setNewTagInput('');
                          setShowTagInput(false);
                        }
                      }
                    }}
                    className="text-xs px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  title="Add tag"
                >
                  <Tag className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
