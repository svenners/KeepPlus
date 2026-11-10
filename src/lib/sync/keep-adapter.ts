import { Note, ChecklistItem } from '@/types/note';
import {
  ISyncAdapter,
  SyncResult,
  GoogleKeepNoteResource,
  GoogleKeepListResponse,
  GoogleKeepListItem,
} from './types';

const KEEP_API_BASE = 'https://keep.googleapis.com/v1';

export class KeepApiAdapter implements ISyncAdapter {
  readonly name = 'keep_api' as const;
  readonly displayName = 'Google Keep REST API';

  async testConnection(accessToken: string): Promise<boolean> {
    try {
      const res = await fetch(`${KEEP_API_BASE}/notes?pageSize=1`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 403 || res.status === 401) {
        return false;
      }
      return res.ok;
    } catch {
      return false;
    }
  }

  async pullNotes(accessToken: string): Promise<SyncResult<Note[]>> {
    try {
      const res = await fetch(`${KEEP_API_BASE}/notes?pageSize=100`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 403) {
        return {
          success: false,
          statusCode: 403,
          requiresFallback: true,
          error: 'Google Keep API is restricted to Workspace Enterprise accounts. Falling back to Google Drive AppData sync.',
        };
      }

      if (!res.ok) {
        const text = await res.text();
        return {
          success: false,
          statusCode: res.status,
          error: `Keep API error (${res.status}): ${text}`,
        };
      }

      const data: GoogleKeepListResponse = await res.json();
      const notes: Note[] = (data.notes || []).map((remoteNote) =>
        this.mapKeepToNote(remoteNote)
      );

      return {
        success: true,
        data: notes,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error connecting to Google Keep API',
      };
    }
  }

  async createNote(accessToken: string, note: Note): Promise<SyncResult<Note>> {
    try {
      const body = this.mapNoteToKeep(note);
      const res = await fetch(`${KEEP_API_BASE}/notes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 403) {
        return {
          success: false,
          statusCode: 403,
          requiresFallback: true,
          error: 'Workspace Keep API permission required. Auto-switching to Drive storage.',
        };
      }

      if (!res.ok) {
        const errorText = await res.text();
        return {
          success: false,
          statusCode: res.status,
          error: errorText,
        };
      }

      const createdResource: GoogleKeepNoteResource = await res.json();
      const updatedNote: Note = {
        ...note,
        googleKeepId: createdResource.name,
        syncState: 'synced',
        updatedAt: Date.now(),
      };

      return {
        success: true,
        data: updatedNote,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error creating note in Google Keep',
      };
    }
  }

  async updateNote(accessToken: string, note: Note): Promise<SyncResult<Note>> {
    try {
      if (!note.googleKeepId) {
        // If no remote ID yet, treat as create
        return this.createNote(accessToken, note);
      }

      // Keep v1 API updates via patch
      const body = this.mapNoteToKeep(note);
      const res = await fetch(`${KEEP_API_BASE}/${note.googleKeepId}?updateMask=title,body`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 403) {
        return {
          success: false,
          statusCode: 403,
          requiresFallback: true,
          error: 'Enterprise permission required. Falling back to Drive.',
        };
      }

      if (!res.ok) {
        return {
          success: false,
          statusCode: res.status,
          error: await res.text(),
        };
      }

      return {
        success: true,
        data: {
          ...note,
          syncState: 'synced',
          updatedAt: Date.now(),
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error updating note in Google Keep',
      };
    }
  }

  async deleteNote(accessToken: string, _noteId: string, remoteId?: string): Promise<SyncResult<void>> {
    if (!remoteId) {
      return { success: true };
    }

    try {
      const res = await fetch(`${KEEP_API_BASE}/${remoteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.status === 403) {
        return {
          success: false,
          statusCode: 403,
          requiresFallback: true,
        };
      }

      return { success: res.ok };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  }

  // Helper mappings
  private mapKeepToNote(remote: GoogleKeepNoteResource): Note {
    const id = remote.name ? remote.name.replace('notes/', '') : `remote-${Date.now()}`;
    const title = remote.title || 'Untitled Note';
    let content = '';
    const items: ChecklistItem[] = [];

    if (remote.body?.text?.text) {
      content = remote.body.text.text;
    }

    if (remote.body?.list?.listItems) {
      remote.body.list.listItems.forEach((li, idx) => {
        items.push({
          id: `item-${idx}-${Date.now()}`,
          text: li.text?.text || '',
          isChecked: !!li.checked,
          order: idx,
          indent: 0,
        });

        // Parse nested child items if present
        if (li.childList?.listItems) {
          li.childList.listItems.forEach((child, cIdx) => {
            items.push({
              id: `item-${idx}-${cIdx}-${Date.now()}`,
              text: child.text?.text || '',
              isChecked: !!child.checked,
              order: idx + cIdx + 0.1,
              indent: 1,
            });
          });
        }
      });
    }

    return {
      id,
      googleKeepId: remote.name,
      title,
      content,
      items,
      color: 'default',
      tags: [],
      isPinned: false,
      isArchived: false,
      isTrashed: !!remote.trashTime,
      createdAt: remote.createTime ? new Date(remote.createTime).getTime() : Date.now(),
      updatedAt: remote.updateTime ? new Date(remote.updateTime).getTime() : Date.now(),
      syncState: 'synced',
      version: 1,
    };
  }

  private mapNoteToKeep(note: Note): Partial<GoogleKeepNoteResource> {
    const resource: Partial<GoogleKeepNoteResource> = {
      title: note.title,
    };

    if (note.items && note.items.length > 0) {
      // Map checklists
      const listItems: GoogleKeepListItem[] = [];
      const parentItems = note.items.filter((i) => i.indent === 0);

      parentItems.forEach((parent) => {
        const itemObj: GoogleKeepListItem = {
          text: { text: parent.text },
          checked: parent.isChecked,
        };

        // Find immediately following indented items
        const childItems = note.items.filter((i) => i.indent > 0 && i.order > parent.order);
        if (childItems.length > 0) {
          itemObj.childList = {
            listItems: childItems.map((c) => ({
              text: { text: c.text },
              checked: c.isChecked,
            })),
          };
        }

        listItems.push(itemObj);
      });

      resource.body = {
        list: { listItems },
      };
    } else {
      // Regular markdown/text body
      resource.body = {
        text: {
          text: note.content || '',
        },
      };
    }

    return resource;
  }
}
