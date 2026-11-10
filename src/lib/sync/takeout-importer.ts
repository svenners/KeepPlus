import { Note, ChecklistItem, NoteColor } from '@/types/note';
import { extractInlineTags } from '../db';

export interface TakeoutNoteJson {
  color?: string;
  isTrashed?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  textContent?: string;
  title?: string;
  userEditedTimestampUsec?: number;
  createdTimestampUsec?: number;
  listContent?: Array<{
    text: string;
    isChecked?: boolean;
  }>;
  labels?: Array<{
    name: string;
  }>;
}

const TAKEOUT_COLOR_MAP: Record<string, NoteColor> = {
  DEFAULT: 'default',
  RED: 'coral',
  ORANGE: 'peach',
  YELLOW: 'sand',
  GREEN: 'mint',
  TEAL: 'fog',
  CERULEAN: 'storm',
  BLUE: 'dusk',
  PURPLE: 'blossom',
  PINK: 'blossom',
  BROWN: 'clay',
  GRAY: 'chalk',
  WHITE: 'default',
};

export function parseTakeoutNote(json: TakeoutNoteJson): Note {
  const title = (json.title || '').trim() || 'Imported Note';
  const content = json.textContent || '';
  const color = (json.color && TAKEOUT_COLOR_MAP[json.color.toUpperCase()]) || 'default';

  // Checklists
  const items: ChecklistItem[] = [];
  if (json.listContent && Array.isArray(json.listContent)) {
    json.listContent.forEach((item, index) => {
      items.push({
        id: `takeout-item-${Date.now()}-${index}`,
        text: item.text || '',
        isChecked: !!item.isChecked,
        order: index,
        indent: 0,
      });
    });
  }

  // Tags & Labels
  const tagSet = new Set<string>();
  if (json.labels && Array.isArray(json.labels)) {
    json.labels.forEach((l) => {
      if (l.name) {
        tagSet.add(l.name.toLowerCase().replace(/^#/, ''));
      }
    });
  }

  // Also extract any inline #tags from content or title
  extractInlineTags(content).forEach((t) => tagSet.add(t));
  extractInlineTags(title).forEach((t) => tagSet.add(t));

  const createdAt = json.createdTimestampUsec
    ? Math.floor(json.createdTimestampUsec / 1000)
    : Date.now();
  const updatedAt = json.userEditedTimestampUsec
    ? Math.floor(json.userEditedTimestampUsec / 1000)
    : createdAt;

  return {
    id: `takeout-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    title,
    content,
    items,
    color,
    tags: Array.from(tagSet),
    isPinned: !!json.isPinned,
    isArchived: !!json.isArchived,
    isTrashed: !!json.isTrashed,
    createdAt,
    updatedAt,
    syncState: 'synced',
    version: 1,
  };
}

export function parseTakeoutJsonString(jsonString: string): Note[] {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => parseTakeoutNote(item));
    } else if (typeof parsed === 'object' && parsed !== null) {
      return [parseTakeoutNote(parsed)];
    }
    return [];
  } catch (err) {
    console.error('Failed to parse takeout JSON:', err);
    throw new Error('Invalid JSON format. Please provide a valid Google Takeout Keep JSON file.');
  }
}
