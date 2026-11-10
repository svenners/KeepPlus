import { Note } from '@/types/note';
import { ISyncAdapter, SyncResult, DriveAppDataBundle } from './types';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';
const BUNDLE_FILENAME = 'keepplus_sync_bundle.json';

export class DriveFallbackAdapter implements ISyncAdapter {
  readonly name = 'drive_fallback' as const;
  readonly displayName = 'Google Drive AppData Sync';
  private cachedFileId: string | null = null;

  async testConnection(accessToken: string): Promise<boolean> {
    try {
      const res = await fetch(`${DRIVE_API_BASE}/about?fields=user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Find or create the sync bundle file ID in appDataFolder
  private async getOrCreateBundleFileId(accessToken: string): Promise<string | null> {
    if (this.cachedFileId) return this.cachedFileId;

    try {
      // Search in appDataFolder
      const query = encodeURIComponent(`name = '${BUNDLE_FILENAME}' and trashed = false`);
      const searchRes = await fetch(
        `${DRIVE_API_BASE}/files?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!searchRes.ok) {
        return null;
      }

      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        this.cachedFileId = searchData.files[0].id;
        return this.cachedFileId;
      }

      // If not found, create new bundle file in appDataFolder
      const metadata = {
        name: BUNDLE_FILENAME,
        parents: ['appDataFolder'],
        mimeType: 'application/json',
      };

      const initialBundle: DriveAppDataBundle = {
        version: 1,
        updatedAt: Date.now(),
        device: 'KeepPlus Web App',
        notes: [],
      };

      // Multipart upload
      const boundary = '-------KeepPlusBoundary' + Math.random().toString(36).substring(2);
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(initialBundle) +
        closeDelimiter;

      const createRes = await fetch(
        `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      );

      if (!createRes.ok) {
        return null;
      }

      const createData = await createRes.json();
      this.cachedFileId = createData.id;
      return this.cachedFileId;
    } catch (err) {
      console.error('Error finding/creating AppData bundle:', err);
      return null;
    }
  }

  async pullNotes(accessToken: string): Promise<SyncResult<Note[]>> {
    try {
      const fileId = await this.getOrCreateBundleFileId(accessToken);
      if (!fileId) {
        return {
          success: false,
          error: 'Could not access Google Drive AppData folder',
        };
      }

      const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        return {
          success: false,
          error: `Failed to download notes bundle from Drive (${res.status})`,
        };
      }

      const bundle: DriveAppDataBundle = await res.json();
      return {
        success: true,
        data: bundle.notes || [],
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error pulling notes from Google Drive',
      };
    }
  }

  async saveAllNotes(accessToken: string, notes: Note[]): Promise<SyncResult<void>> {
    try {
      const fileId = await this.getOrCreateBundleFileId(accessToken);
      if (!fileId) {
        return {
          success: false,
          error: 'Failed to access Google Drive AppData bundle',
        };
      }

      const bundle: DriveAppDataBundle = {
        version: 1,
        updatedAt: Date.now(),
        device: 'KeepPlus Web App',
        notes: notes.map((n) => ({
          ...n,
          syncState: 'synced',
        })),
      };

      const res = await fetch(
        `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bundle),
        }
      );

      if (!res.ok) {
        return {
          success: false,
          error: `Drive update error: ${res.statusText}`,
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error saving bundle to Google Drive',
      };
    }
  }

  async createNote(accessToken: string, note: Note): Promise<SyncResult<Note>> {
    // In Drive AppData model, single item creates update the master bundle
    const pullRes = await this.pullNotes(accessToken);
    const existing = pullRes.data || [];
    const updatedList = [
      ...existing.filter((n) => n.id !== note.id),
      { ...note, syncState: 'synced' as const, updatedAt: Date.now() },
    ];

    const saveRes = await this.saveAllNotes(accessToken, updatedList);
    if (!saveRes.success) {
      return { success: false, error: saveRes.error };
    }

    return {
      success: true,
      data: {
        ...note,
        syncState: 'synced',
        updatedAt: Date.now(),
      },
    };
  }

  async updateNote(accessToken: string, note: Note): Promise<SyncResult<Note>> {
    return this.createNote(accessToken, note);
  }

  async deleteNote(accessToken: string, noteId: string): Promise<SyncResult<void>> {
    const pullRes = await this.pullNotes(accessToken);
    if (!pullRes.data) return { success: true };

    const remaining = pullRes.data.filter((n) => n.id !== noteId);
    return this.saveAllNotes(accessToken, remaining);
  }
}
