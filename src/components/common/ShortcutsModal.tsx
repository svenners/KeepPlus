'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Cmd / Ctrl + K', desc: 'Open Global Command Palette' },
    { key: 'c', desc: 'Create a new markdown note' },
    { key: 'l', desc: 'Create a new checklist' },
    { key: '/', desc: 'Focus instant search bar' },
    { key: 'Cmd / Ctrl + 1', desc: 'Switch to Masonry Grid View' },
    { key: 'Cmd / Ctrl + 2', desc: 'Switch to Kanban Board View' },
    { key: 'Cmd / Ctrl + 3', desc: 'Switch to Focus List View' },
    { key: 'Cmd / Ctrl + Enter', desc: 'Save and close note editor' },
    { key: 'Tab / Shift + Tab', desc: 'Indent or outdent checklist item' },
    { key: '[[', desc: 'Trigger note title autocomplete (Wiki-links)' },
    { key: 'Esc', desc: 'Close modals, palettes, or editors' },
    { key: '?', desc: 'Open this keyboard shortcuts dialog' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-neutral-600 dark:text-neutral-300">{sc.desc}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 text-center">
          Pro-tip: Press <kbd className="font-mono text-neutral-600 dark:text-neutral-300">?</kbd> at any time to open this cheat sheet.
        </div>
      </div>
    </div>
  );
}
