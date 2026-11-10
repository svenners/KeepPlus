'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Pin,
  Archive,
  Trash2,
  Palette,
  CheckSquare,
  Link as LinkIcon,
  CloudCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Note, NOTE_COLORS, NoteColor } from '@/types/note';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onToggleArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onChangeColor: (color: NoteColor) => void;
  onToggleCheckItem: (itemId: string) => void;
  onTagClick?: (tag: string) => void;
  onOpenWikiLink?: (targetTitle: string) => void;
  backlinkCount?: number;
}

export function NoteCard({
  note,
  onClick,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onChangeColor,
  onToggleCheckItem,
  onTagClick,
  onOpenWikiLink,
  backlinkCount = 0,
}: NoteCardProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorStyles = NOTE_COLORS[note.color] || NOTE_COLORS.default;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden p-4 flex flex-col justify-between hover:shadow-md ${
        colorStyles.bgLight
      } ${colorStyles.borderLight} ${colorStyles.bgDark} ${colorStyles.borderDark}`}
    >
      {/* Top Header: Title & Pin Button */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug">
          {note.title || (note.content ? '' : 'Untitled Note')}
        </h3>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(e);
          }}
          className={`p-1.5 rounded-lg transition-all ${
            note.isPinned
              ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
              : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5'
          }`}
          title={note.isPinned ? 'Unpin note' : 'Pin note'}
        >
          <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content Preview */}
      {note.content && (
        <div className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 line-clamp-6 leading-relaxed mb-3 font-sans break-words prose prose-xs dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Intercept WikiLinks in cards
              p: ({ children }) => <span>{renderWikiLinks(children, onOpenWikiLink)}</span>,
            }}
          >
            {note.content}
          </ReactMarkdown>
        </div>
      )}

      {/* Interactive Checklists (Live toggle on card) */}
      {note.items && note.items.length > 0 && (
        <div className="space-y-1.5 mb-3 border-t border-black/5 dark:border-white/5 pt-2">
          {note.items.slice(0, 5).map((item) => (
            <div
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                onToggleCheckItem(item.id);
              }}
              style={{ paddingLeft: `${item.indent * 12}px` }}
              className="flex items-center gap-2 text-xs text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white"
            >
              <input
                type="checkbox"
                checked={item.isChecked}
                onChange={() => onToggleCheckItem(item.id)}
                className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span
                className={`truncate ${
                  item.isChecked ? 'line-through text-neutral-400 dark:text-neutral-500' : ''
                }`}
              >
                {item.text || 'Item'}
              </span>
            </div>
          ))}

          {note.items.length > 5 && (
            <div className="text-[11px] text-neutral-400 italic pt-0.5">
              +{note.items.length - 5} more items...
            </div>
          )}
        </div>
      )}

      {/* Tags & Metadata Badges */}
      <div className="mt-auto space-y-2">
        {(note.tags.length > 0 || backlinkCount > 0) && (
          <div className="flex flex-wrap items-center gap-1">
            {note.tags.map((tag) => (
              <span
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTagClick) onTagClick(tag);
                }}
                className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-amber-500/10 hover:text-amber-700 transition-colors"
              >
                #{tag}
              </span>
            ))}

            {backlinkCount > 0 && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300"
                title={`${backlinkCount} notes link to this note`}
              >
                <LinkIcon className="w-2.5 h-2.5" />
                {backlinkCount}
              </span>
            )}
          </div>
        )}

        {/* Hover Toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-0.5 relative">
            {/* Color Picker */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowColorPicker(!showColorPicker);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5"
              title="Change color"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {showColorPicker && (
              <div
                className="absolute left-0 bottom-8 z-50 p-2 rounded-xl bg-white dark:bg-neutral-800 shadow-xl border border-neutral-200 dark:border-neutral-700 grid grid-cols-4 gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {Object.entries(NOTE_COLORS).map(([k, val]) => (
                  <button
                    key={k}
                    onClick={() => {
                      onChangeColor(k as NoteColor);
                      setShowColorPicker(false);
                    }}
                    className="w-4 h-4 rounded-full border hover:scale-125 transition-transform"
                    style={{ backgroundColor: val.badge }}
                  />
                ))}
              </div>
            )}

            {/* Archive */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleArchive(e);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5"
              title={note.isArchived ? 'Unarchive' : 'Archive'}
            >
              <Archive className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(e);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sync indicator */}
          <div className="text-[10px] text-neutral-400 flex items-center gap-1">
            {note.syncState === 'synced' ? (
              <span className="text-emerald-600 dark:text-emerald-400" title="Synced with Google">
                ● Synced
              </span>
            ) : (
              <span className="text-amber-500" title="Pending local sync">
                ○ Local
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderWikiLinks(
  children: React.ReactNode,
  onOpenWikiLink?: (title: string) => void
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
              if (onOpenWikiLink) onOpenWikiLink(title);
            }}
            className="inline-flex items-center gap-0.5 px-1 py-0.2 mx-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium cursor-pointer hover:underline text-[11px]"
          >
            <LinkIcon className="w-2.5 h-2.5 inline" />
            {title}
          </span>
        );
      }
      return part;
    });
  }

  if (Array.isArray(children)) {
    return children.map((c, i) => (
      <React.Fragment key={i}>{renderWikiLinks(c, onOpenWikiLink)}</React.Fragment>
    ));
  }

  return children;
}
