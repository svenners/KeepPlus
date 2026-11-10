import Dexie, { type Table } from 'dexie';
import { Note, SyncQueueItem, TagTreeNode } from '@/types/note';
import { INITIAL_DEMO_NOTES } from './sample-data';

export interface SettingRecord {
  key: string;
  value: any;
}

export class KeepPlusDatabase extends Dexie {
  notes!: Table<Note, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  settings!: Table<SettingRecord, string>;

  constructor() {
    super('KeepPlusDatabase');
    this.version(1).stores({
      notes: 'id, isPinned, isArchived, isTrashed, updatedAt, *tags, syncState',
      syncQueue: 'id, timestamp, retryCount, action, noteId',
      settings: 'key',
    });
  }
}

export const db = new KeepPlusDatabase();

// Initial database seeding if empty
export async function ensureDatabaseSeeded(): Promise<void> {
  try {
    const count = await db.notes.count();
    if (count === 0) {
      await db.notes.bulkPut(INITIAL_DEMO_NOTES);
      await db.settings.put({
        key: 'isSeeded',
        value: true,
      });
      await db.settings.put({
        key: 'kanbanColumns',
        value: ['todo', 'doing', 'done', 'ideas'],
      });
    }
  } catch (err) {
    console.error('Error seeding initial notes:', err);
  }
}

export async function forceSeedDemoNotes(): Promise<void> {
  try {
    await db.notes.bulkPut(INITIAL_DEMO_NOTES);
  } catch (err) {
    console.error('Error force seeding notes:', err);
  }
}

// Helper: Extract inline #tags from content & title
export function extractInlineTags(text: string): string[] {
  if (!text) return [];
  // Match tags like #work, #work/frontend, #project-alpha (exclude hex colors like #ffffff)
  const regex = /(?:^|\s)#([a-zA-Z0-9_\-\/]+)/g;
  const tags: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const tag = match[1].toLowerCase();
    // Exclude valid hex colors (3, 6, 8 chars of hex only)
    if (!/^[0-9a-fA-F]{3,8}$/.test(tag) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags;
}

// Helper: Extract [[Note Title]] wiki-links
export function extractWikiLinks(text: string): string[] {
  if (!text) return [];
  const regex = /\[\[(.*?)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const title = match[1].trim();
    if (title && !links.includes(title)) {
      links.push(title);
    }
  }
  return links;
}

// Find all notes that reference a given note title in their title/content
export async function findBacklinks(targetTitle: string, excludeNoteId: string): Promise<Note[]> {
  if (!targetTitle) return [];
  const allNotes = await db.notes
    .where('isTrashed')
    .equals(0)
    .toArray();

  const lowerTarget = targetTitle.toLowerCase();
  return allNotes.filter(
    (n) =>
      n.id !== excludeNoteId &&
      n.content &&
      n.content.toLowerCase().includes(`[[${lowerTarget}]]`)
  );
}

// Build hierarchical tag tree from a list of tags
export function buildTagTree(notes: Note[]): TagTreeNode[] {
  const rootNodes: Record<string, TagTreeNode> = {};
  const tagCounts: Record<string, number> = {};

  // Count active non-trashed notes per tag
  for (const note of notes) {
    if (note.isTrashed) continue;
    for (const tag of note.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  // Build tree
  const sortedTags = Object.keys(tagCounts).sort();

  for (const tag of sortedTags) {
    const parts = tag.split('/');
    let currentPath = '';
    let currentLevel: TagTreeNode[] = Object.values(rootNodes);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let found = currentLevel.find((node) => node.name === part);
      if (!found) {
        found = {
          name: part,
          fullPath: currentPath,
          count: tagCounts[currentPath] || 0,
          children: [],
        };

        if (i === 0) {
          rootNodes[part] = found;
        } else {
          // Add to parent children
          const parentPath = parts.slice(0, i).join('/');
          const parentNode = findNodeInTree(Object.values(rootNodes), parentPath);
          if (parentNode) {
            parentNode.children.push(found);
          }
        }
      }
      currentLevel = found.children;
    }
  }

  return Object.values(rootNodes);
}

function findNodeInTree(nodes: TagTreeNode[], fullPath: string): TagTreeNode | null {
  for (const node of nodes) {
    if (node.fullPath === fullPath) return node;
    const sub = findNodeInTree(node.children, fullPath);
    if (sub) return sub;
  }
  return null;
}
