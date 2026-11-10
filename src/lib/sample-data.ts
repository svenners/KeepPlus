import { Note } from '@/types/note';

export const INITIAL_DEMO_NOTES: Note[] = [
  {
    id: 'note-welcome-1',
    title: '⚡ Welcome to KeepPlus',
    content: `### Google Keep for Power Users

KeepPlus gives you the speed of local-first storage, combined with live **Markdown rendering**, nested checklists, and automatic synchronization with Google.

#### ✨ Key Shortcuts
- \`Cmd + K\` / \`Ctrl + K\` : Global Command Palette
- \`c\` : Create a new note
- \`l\` : Create a new checklist
- \`/\` : Focus instant search
- \`[[Note Title]]\` : Bi-directional note linking

Check out the linked guide: [[Architecture Guide]] and review your [[Q4 Sprint Checklist]].`,
    items: [],
    color: 'sand',
    tags: ['welcome', 'guide'],
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    createdAt: Date.now() - 3600000 * 24 * 2,
    updatedAt: Date.now() - 3600000 * 2,
    syncState: 'synced',
    version: 1,
  },
  {
    id: 'note-checklist-2',
    title: '🚀 Q4 Sprint Checklist',
    content: 'Interactive nested task list with sub-tasks and status tracking.',
    items: [
      { id: 'item-1', text: 'Implement Dexie.js IndexedDB schema', isChecked: true, order: 0, indent: 0 },
      { id: 'item-2', text: 'Configure offline sync queue & retry logic', isChecked: true, order: 1, indent: 1 },
      { id: 'item-3', text: 'Google Keep v1 REST API adapter', isChecked: true, order: 2, indent: 0 },
      { id: 'item-4', text: 'Google Drive appDataFolder JSON fallback adapter', isChecked: true, order: 3, indent: 1 },
      { id: 'item-5', text: 'Bi-directional [[WikiLinks]] parser & backlink index', isChecked: true, order: 4, indent: 0 },
      { id: 'item-6', text: 'Kanban view column drag-and-drop', isChecked: false, order: 5, indent: 0 },
      { id: 'item-7', text: 'Test Google Takeout .json archive importer', isChecked: false, order: 6, indent: 1 },
    ],
    color: 'mint',
    tags: ['work/frontend', 'sprint/q4', 'todo'],
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 1,
    syncState: 'synced',
    version: 2,
  },
  {
    id: 'note-architecture-3',
    title: '🏗️ Architecture Guide',
    content: `### Modular Sync Engine Architecture

KeepPlus implements a dual-tier sync strategy:

\`\`\`typescript
interface ISyncAdapter {
  authenticate(token: string): Promise<boolean>;
  fetchNotes(): Promise<SyncResult<Note[]>>;
  createNote(note: Note): Promise<SyncResult<Note>>;
  updateNote(note: Note): Promise<SyncResult<Note>>;
  deleteNote(noteId: string): Promise<SyncResult<void>>;
}
\`\`\`

1. **Google Keep API:** Used when Google Workspace Enterprise OAuth credentials with Keep scopes are present.
2. **Google Drive AppData Fallback:** Automatically activated if the user's account lacks Enterprise permissions (HTTP 403 Forbidden). Stores encrypted JSON notes inside hidden \`appDataFolder\`.

Referenced by [[⚡ Welcome to KeepPlus]].`,
    items: [],
    color: 'storm',
    tags: ['work/backend', 'architecture'],
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    createdAt: Date.now() - 3600000 * 72,
    updatedAt: Date.now() - 3600000 * 5,
    syncState: 'synced',
    version: 1,
  },
  {
    id: 'note-kanban-doing',
    title: '🎨 Polish Drag & Drop Micro-Interactions',
    content: `Enhance Kanban board card dragging with smooth spring physics via Framer Motion.
- Ensure dragging a card across columns updates the tag from \`#doing\` to \`#done\`.
- Keep color accents intact.`,
    items: [
      { id: 'k-1', text: 'Add column drop indicator', isChecked: true, order: 0, indent: 0 },
      { id: 'k-2', text: 'Haptic / visual card elevation on grab', isChecked: false, order: 1, indent: 0 },
    ],
    color: 'peach',
    tags: ['doing', 'work/design'],
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 3,
    syncState: 'synced',
    version: 1,
  },
  {
    id: 'note-kanban-done',
    title: '📦 Google Takeout Keep Importer',
    content: `Successfully built the parser for Google Takeout JSON files!
Users can export their Keep notes from \`takeout.google.com\` and import all checklists, labels, and colors in 1 click into IndexedDB.`,
    items: [],
    color: 'blossom',
    tags: ['done', 'features'],
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    createdAt: Date.now() - 3600000 * 96,
    updatedAt: Date.now() - 3600000 * 10,
    syncState: 'synced',
    version: 1,
  },
  {
    id: 'note-personal-travel',
    title: '✈️ Tokyo & Kyoto Travel Plan',
    content: `### Japan Itinerary Ideas
- Visit Akihabara tech markets
- Shinjuku Gyoen National Garden
- Day trip to Mount Fuji & Hakone onsen

\`\`\`markdown
| Day | Location | Highlights |
|---|---|---|
| Day 1-3 | Tokyo | Shibuya, Ginza, TeamLab Planets |
| Day 4-6 | Kyoto | Fushimi Inari, Arashiyama Bamboo |
\`\`\``,
    items: [
      { id: 'trip-1', text: 'Book Shinkansen bullet train passes', isChecked: true, order: 0, indent: 0 },
      { id: 'trip-2', text: 'Exchange Yen or configure travel card', isChecked: false, order: 1, indent: 0 },
      { id: 'trip-3', text: 'Pocket Wi-Fi / eSIM activation', isChecked: true, order: 2, indent: 0 },
    ],
    color: 'coral',
    tags: ['personal/travel', 'ideas'],
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    createdAt: Date.now() - 3600000 * 120,
    updatedAt: Date.now() - 3600000 * 12,
    syncState: 'synced',
    version: 1,
  },
];
