import { Note } from '@/types/note';

export interface SyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  requiresFallback?: boolean;
}

export interface ISyncAdapter {
  readonly name: 'keep_api' | 'drive_fallback' | 'local_only';
  readonly displayName: string;
  
  // Test connection & verify scope permissions
  testConnection(accessToken: string): Promise<boolean>;
  
  // Pull all notes from remote
  pullNotes(accessToken: string): Promise<SyncResult<Note[]>>;
  
  // Create note on remote
  createNote(accessToken: string, note: Note): Promise<SyncResult<Note>>;
  
  // Update note on remote
  updateNote(accessToken: string, note: Note): Promise<SyncResult<Note>>;
  
  // Delete note on remote
  deleteNote(accessToken: string, noteId: string, remoteId?: string): Promise<SyncResult<void>>;
}

// Google Keep v1 API Schema Representation
export interface GoogleKeepListItem {
  text: {
    text: string;
  };
  checked: boolean;
  childList?: {
    listItems: GoogleKeepListItem[];
  };
}

export interface GoogleKeepNoteResource {
  name?: string; // notes/{note_id}
  title?: string;
  body?: {
    text?: {
      text: string;
    };
    list?: {
      listItems: GoogleKeepListItem[];
    };
  };
  trashTime?: string;
  createTime?: string;
  updateTime?: string;
}

export interface GoogleKeepListResponse {
  notes?: GoogleKeepNoteResource[];
  nextPageToken?: string;
}

// Google Drive AppData Note Payload
export interface DriveAppDataBundle {
  version: number;
  updatedAt: number;
  device: string;
  notes: Note[];
}
