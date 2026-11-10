'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, FileCode, X, Sparkles } from 'lucide-react';
import { parseTakeoutJsonString, TakeoutNoteJson } from '@/lib/sync/takeout-importer';
import { db } from '@/lib/db';
import { Note } from '@/types/note';

interface TakeoutImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

const SAMPLE_TAKEOUT_PAYLOAD: TakeoutNoteJson = {
  title: '🎒 Google Takeout Sample Import',
  textContent: 'This note was exported directly from Google Takeout (Keep archive). KeepPlus maps labels to tags and restores all checklist items.\n\n#travel #gear/packing',
  color: 'TEAL',
  isPinned: true,
  isArchived: false,
  isTrashed: false,
  userEditedTimestampUsec: Date.now() * 1000,
  createdTimestampUsec: (Date.now() - 86400000) * 1000,
  listContent: [
    { text: 'Passport & International Driving Permit', isChecked: true },
    { text: 'Noise-cancelling headphones & USB-C hub', isChecked: true },
    { text: 'Universal power adapter & power bank', isChecked: false },
    { text: 'First-aid kit & emergency prescriptions', isChecked: false },
  ],
  labels: [
    { name: 'Travel' },
    { name: 'Packing Checklist' },
  ],
};

export function TakeoutImportModal({ isOpen, onClose, onImportComplete }: TakeoutImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedNotes, setImportedNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImporting(true);
    setError(null);

    const newNotes: Note[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.name.endsWith('.json')) continue;
        const text = await file.text();
        const parsed = parseTakeoutJsonString(text);
        newNotes.push(...parsed);
      }

      if (newNotes.length === 0) {
        setError('No valid Google Keep JSON files were found in the uploaded files.');
        setImporting(false);
        return;
      }

      await db.notes.bulkPut(newNotes);
      setImportedNotes(newNotes);
      if (onImportComplete) onImportComplete();
    } catch (err: any) {
      setError(err.message || 'Error parsing files');
    } finally {
      setImporting(false);
    }
  };

  const handleLoadSample = async () => {
    setImporting(true);
    setError(null);
    try {
      const sample = parseTakeoutJsonString(JSON.stringify(SAMPLE_TAKEOUT_PAYLOAD));
      await db.notes.bulkPut(sample);
      setImportedNotes(sample);
      if (onImportComplete) onImportComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setImportedNotes([]);
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Import Google Takeout Keep Archive
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Export your notes from{' '}
            <a
              href="https://takeout.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 underline font-medium"
            >
              takeout.google.com
            </a>{' '}
            (select Google Keep, JSON format). Upload the extracted <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">.json</code> files below to restore checklists, labels, and colors.
          </p>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-neutral-300 dark:border-neutral-700 hover:border-amber-500/60 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
              multiple
              accept=".json"
              className="hidden"
            />
            <FileCode className="w-10 h-10 mx-auto text-neutral-400 mb-2" />
            <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {importing ? 'Processing archive...' : 'Click to select or drag & drop .json files'}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Supports single notes or multiple JSON files at once
            </div>
          </div>

          {/* Quick Demo Sample Button */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                Want to test without a Google account?
              </div>
            </div>
            <button
              onClick={handleLoadSample}
              disabled={importing}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
            >
              1-Click Load Sample
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {importedNotes.length > 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-semibold">Successfully imported {importedNotes.length} note(s)!</span>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Checklists, colors, and hierarchical tags have been indexed into your local storage.
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
