import { Note, SyncEngineAdapter, SyncEngineStatus, SyncQueueItem } from '@/types/note';
import { db } from '../db';
import { ISyncAdapter } from './types';
import { KeepApiAdapter } from './keep-adapter';
import { DriveFallbackAdapter } from './drive-adapter';

type StatusListener = (status: SyncEngineStatus) => void;

class SyncService {
  private keepAdapter: KeepApiAdapter = new KeepApiAdapter();
  private driveAdapter: DriveFallbackAdapter = new DriveFallbackAdapter();
  
  private activeAdapterType: SyncEngineAdapter = 'keep_api';
  private accessToken: string | null = null;
  private isOnline: boolean = typeof window !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private statusListeners: Set<StatusListener> = new Set();
  private lastSyncedAt?: number;
  private errorMessage?: string;
  private hasKeepAccess: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyStatus();
        this.drainSyncQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyStatus();
      });

      // Load saved adapter preference if any
      this.loadSettings();
    }
  }

  private async loadSettings() {
    try {
      const saved = await db.settings.get('syncAdapterPreference');
      if (saved?.value) {
        this.activeAdapterType = saved.value;
      }
      this.notifyStatus();
    } catch (e) {
      console.warn('Could not read settings from db:', e);
    }
  }

  public setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      // Auto-trigger sync when token becomes available
      this.syncNow();
    } else {
      this.notifyStatus();
    }
  }

  public setAdapterPreference(adapter: SyncEngineAdapter) {
    this.activeAdapterType = adapter;
    db.settings.put({ key: 'syncAdapterPreference', value: adapter });
    this.notifyStatus();
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus() {
    const status = this.getStatus();
    this.statusListeners.forEach((l) => l(status));
  }

  public getStatus(): SyncEngineStatus {
    let mode: SyncEngineStatus['mode'] = 'idle';
    if (!this.isOnline) {
      mode = 'offline';
    } else if (this.isSyncing) {
      mode = 'syncing';
    } else if (this.errorMessage) {
      mode = 'error';
    } else if (this.lastSyncedAt) {
      mode = 'synced';
    }

    return {
      mode,
      activeAdapter: this.activeAdapterType,
      lastSyncedAt: this.lastSyncedAt,
      pendingCount: 0, // dynamically refreshed
      errorMessage: this.errorMessage,
      hasKeepAccess: this.hasKeepAccess,
    };
  }

  private getActiveAdapter(): ISyncAdapter {
    if (this.activeAdapterType === 'drive_fallback') {
      return this.driveAdapter;
    }
    return this.keepAdapter;
  }

  // Queue a change for offline syncing
  public async queueChange(noteId: string, action: SyncQueueItem['action'], payload?: Partial<Note>) {
    const queueItem: SyncQueueItem = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      noteId,
      action,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
    };
    await db.syncQueue.put(queueItem);

    if (this.isOnline && this.accessToken) {
      this.drainSyncQueue();
    }
  }

  // Drain pending offline items
  public async drainSyncQueue(): Promise<void> {
    if (!this.isOnline || !this.accessToken || this.isSyncing) return;

    const pending = await db.syncQueue.orderBy('timestamp').toArray();
    if (pending.length === 0) return;

    for (const item of pending) {
      try {
        const note = await db.notes.get(item.noteId);
        const adapter = this.getActiveAdapter();

        if (item.action === 'delete') {
          await adapter.deleteNote(this.accessToken, item.noteId, (item.payload as any)?.googleKeepId);
          await db.syncQueue.delete(item.id);
        } else if (note) {
          let res = await adapter.updateNote(this.accessToken, note);
          if (res.requiresFallback && this.activeAdapterType === 'keep_api') {
            this.handleFallback();
            res = await this.driveAdapter.updateNote(this.accessToken, note);
          }

          if (res.success) {
            await db.notes.update(item.noteId, { syncState: 'synced' });
            await db.syncQueue.delete(item.id);
          }
        }
      } catch (err) {
        console.error('Error draining queue item:', err);
      }
    }
    this.notifyStatus();
  }

  private handleFallback() {
    this.hasKeepAccess = false;
    this.activeAdapterType = 'drive_fallback';
    db.settings.put({ key: 'syncAdapterPreference', value: 'drive_fallback' });
    this.errorMessage = 'Google Keep API access restricted (personal Gmail). Automatically switched to Google Drive AppData Sync.';
    this.notifyStatus();
  }

  // Trigger full bi-directional sync
  public async syncNow(): Promise<void> {
    if (!this.isOnline) {
      this.errorMessage = 'Cannot sync while offline';
      this.notifyStatus();
      return;
    }

    if (!this.accessToken) {
      // In local demo mode, simulate sync success
      this.lastSyncedAt = Date.now();
      this.errorMessage = undefined;
      this.notifyStatus();
      return;
    }

    this.isSyncing = true;
    this.errorMessage = undefined;
    this.notifyStatus();

    try {
      let adapter = this.getActiveAdapter();
      let pullRes = await adapter.pullNotes(this.accessToken);

      // Auto-fallback check
      if (pullRes.requiresFallback && this.activeAdapterType === 'keep_api') {
        this.handleFallback();
        adapter = this.driveAdapter;
        pullRes = await adapter.pullNotes(this.accessToken);
      }

      if (!pullRes.success) {
        this.errorMessage = pullRes.error || 'Sync failed';
        this.isSyncing = false;
        this.notifyStatus();
        return;
      }

      // Merge remote notes with local notes (conflict resolution: last updated wins)
      const remoteNotes = pullRes.data || [];
      const localNotes = await db.notes.toArray();
      const localMap = new Map(localNotes.map((n) => [n.id, n]));

      for (const remote of remoteNotes) {
        const local = localMap.get(remote.id);
        if (!local) {
          // New remote note
          await db.notes.put(remote);
        } else if (remote.updatedAt > local.updatedAt) {
          // Remote is newer
          await db.notes.put({
            ...remote,
            tags: Array.from(new Set([...local.tags, ...remote.tags])), // union tags
          });
        }
      }

      // Push any local notes created/updated while offline to remote
      const pendingUploads = localNotes.filter(
        (n) => n.syncState !== 'synced' || !remoteNotes.find((r) => r.id === n.id)
      );

      for (const note of pendingUploads) {
        if (note.isTrashed) continue;
        const pushRes = await adapter.createNote(this.accessToken, note);
        if (pushRes.success) {
          await db.notes.update(note.id, { syncState: 'synced' });
        }
      }

      this.lastSyncedAt = Date.now();
      this.errorMessage = undefined;
    } catch (err: any) {
      this.errorMessage = err.message || 'Sync error occurred';
    } finally {
      this.isSyncing = false;
      this.notifyStatus();
    }
  }
}

export const syncService = new SyncService();
