export type NoteColor =
  | 'default'
  | 'coral'
  | 'peach'
  | 'sand'
  | 'mint'
  | 'sage'
  | 'fog'
  | 'storm'
  | 'dusk'
  | 'blossom'
  | 'clay'
  | 'chalk';

export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
  order: number;
  indent: number; // 0, 1, or 2 (nesting level)
}

export type SyncState =
  | 'synced'
  | 'pending_create'
  | 'pending_update'
  | 'pending_delete'
  | 'conflict';

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown body text
  items: ChecklistItem[]; // Interactive checklist
  color: NoteColor;
  tags: string[]; // e.g. ["work/frontend", "todo"]
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  createdAt: number;
  updatedAt: number;
  trashedAt?: number;
  
  // Google sync metadata
  syncState: SyncState;
  googleKeepId?: string;
  googleDriveFileId?: string;
  etag?: string;
  version: number;
}

export interface SyncQueueItem {
  id: string;
  noteId: string;
  action: 'create' | 'update' | 'delete';
  payload?: Partial<Note>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export type ViewMode = 'masonry' | 'kanban' | 'focus';

export interface TagTreeNode {
  name: string;
  fullPath: string;
  count: number;
  children: TagTreeNode[];
}

export type SyncEngineAdapter = 'keep_api' | 'drive_fallback' | 'local_only';

export interface SyncEngineStatus {
  mode: 'idle' | 'syncing' | 'offline' | 'error' | 'synced';
  activeAdapter: SyncEngineAdapter;
  lastSyncedAt?: number;
  pendingCount: number;
  errorMessage?: string;
  hasKeepAccess?: boolean;
}

export const NOTE_COLORS: Record<NoteColor, {
  name: string;
  bgLight: string;
  borderLight: string;
  bgDark: string;
  borderDark: string;
  badge: string;
}> = {
  default: {
    name: 'Default',
    bgLight: 'bg-white',
    borderLight: 'border-neutral-200',
    bgDark: 'dark:bg-neutral-900',
    borderDark: 'dark:border-neutral-800',
    badge: '#94a3b8',
  },
  coral: {
    name: 'Coral',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
    bgDark: 'dark:bg-rose-950/40',
    borderDark: 'dark:border-rose-900/60',
    badge: '#f43f5e',
  },
  peach: {
    name: 'Peach',
    bgLight: 'bg-orange-50',
    borderLight: 'border-orange-200',
    bgDark: 'dark:bg-orange-950/40',
    borderDark: 'dark:border-orange-900/60',
    badge: '#f97316',
  },
  sand: {
    name: 'Sand',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    bgDark: 'dark:bg-amber-950/40',
    borderDark: 'dark:border-amber-900/60',
    badge: '#f59e0b',
  },
  mint: {
    name: 'Mint',
    bgLight: 'bg-emerald-50',
    borderLight: 'border-emerald-200',
    bgDark: 'dark:bg-emerald-950/40',
    borderDark: 'dark:border-emerald-900/60',
    badge: '#10b981',
  },
  sage: {
    name: 'Sage',
    bgLight: 'bg-green-50',
    borderLight: 'border-green-200',
    bgDark: 'dark:bg-green-950/40',
    borderDark: 'dark:border-green-900/60',
    badge: '#84cc16',
  },
  fog: {
    name: 'Fog',
    bgLight: 'bg-cyan-50',
    borderLight: 'border-cyan-200',
    bgDark: 'dark:bg-cyan-950/40',
    borderDark: 'dark:border-cyan-900/60',
    badge: '#06b6d4',
  },
  storm: {
    name: 'Storm',
    bgLight: 'bg-sky-50',
    borderLight: 'border-sky-200',
    bgDark: 'dark:bg-sky-950/40',
    borderDark: 'dark:border-sky-900/60',
    badge: '#0ea5e9',
  },
  dusk: {
    name: 'Dusk',
    bgLight: 'bg-indigo-50',
    borderLight: 'border-indigo-200',
    bgDark: 'dark:bg-indigo-950/40',
    borderDark: 'dark:border-indigo-900/60',
    badge: '#6366f1',
  },
  blossom: {
    name: 'Blossom',
    bgLight: 'bg-purple-50',
    borderLight: 'border-purple-200',
    bgDark: 'dark:bg-purple-950/40',
    borderDark: 'dark:border-purple-900/60',
    badge: '#a855f7',
  },
  clay: {
    name: 'Clay',
    bgLight: 'bg-stone-100',
    borderLight: 'border-stone-300',
    bgDark: 'dark:bg-stone-900',
    borderDark: 'dark:border-stone-800',
    badge: '#78716c',
  },
  chalk: {
    name: 'Chalk',
    bgLight: 'bg-slate-50',
    borderLight: 'border-slate-200',
    bgDark: 'dark:bg-slate-900',
    borderDark: 'dark:border-slate-800',
    badge: '#64748b',
  },
};
