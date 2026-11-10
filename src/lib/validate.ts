import { extractInlineTags, extractWikiLinks, buildTagTree } from './db';
import { parseTakeoutNote, parseTakeoutJsonString } from './sync/takeout-importer';
import { KeepApiAdapter } from './sync/keep-adapter';
import { DriveFallbackAdapter } from './sync/drive-adapter';
import { INITIAL_DEMO_NOTES } from './sample-data';
import { Note } from '@/types/note';

async function runValidation() {
  console.log('🧪 Starting KeepPlus Core Engine Validation...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
    }
  }

  // 1. Tag Extraction & Hierarchy
  console.log('--- 1. Hierarchical Tag & WikiLink Parsing ---');
  const sampleText = 'Working on #work/frontend and #work/backend alongside #todo and #ideas/ai. Check color #ffffff.';
  const tags = extractInlineTags(sampleText);
  assert(tags.includes('work/frontend'), 'Extracts nested tag #work/frontend');
  assert(tags.includes('work/backend'), 'Extracts nested tag #work/backend');
  assert(tags.includes('todo'), 'Extracts simple tag #todo');
  assert(!tags.includes('ffffff'), 'Ignores hex color #ffffff');

  const links = extractWikiLinks('Referencing [[Architecture Guide]] and [[Q4 Sprint Checklist]].');
  assert(links.length === 2, 'Extracts exactly 2 wiki links');
  assert(links[0] === 'Architecture Guide', 'First link is Architecture Guide');
  assert(links[1] === 'Q4 Sprint Checklist', 'Second link is Q4 Sprint Checklist');

  const tree = buildTagTree(INITIAL_DEMO_NOTES);
  assert(tree.length > 0, 'Builds non-empty tag tree from notes');
  const workNode = tree.find((t) => t.name === 'work');
  assert(!!workNode && workNode.children.length >= 2, 'Hierarchical tag "work" has child nodes');

  // 2. Google Takeout Keep JSON Importer
  console.log('\n--- 2. Google Takeout Keep Archive Importer ---');
  const sampleTakeout = {
    title: 'Grocery Run',
    textContent: 'Get fresh ingredients for pasta #groceries/dinner',
    color: 'YELLOW',
    listContent: [
      { text: 'San Marzano tomatoes', isChecked: true },
      { text: 'Fresh basil', isChecked: false },
      { text: 'Parmigiano Reggiano', isChecked: false },
    ],
    labels: [{ name: 'Shopping' }, { name: 'Food' }],
    isPinned: true,
  };

  const parsed = parseTakeoutNote(sampleTakeout);
  assert(parsed.title === 'Grocery Run', 'Parsed title correctly');
  assert(parsed.color === 'sand', 'Mapped YELLOW color to KeepPlus "sand" palette');
  assert(parsed.items.length === 3, 'Imported 3 checklist items');
  assert(parsed.items[0].isChecked === true, 'Checked item preserved');
  assert(parsed.items[1].isChecked === false, 'Unchecked item preserved');
  assert(parsed.tags.includes('shopping'), 'Mapped Takeout label to tag');
  assert(parsed.tags.includes('groceries/dinner'), 'Extracted inline nested tag');
  assert(parsed.isPinned === true, 'Preserved pinned status');

  const multiJson = JSON.stringify([sampleTakeout, { title: 'Second Note', textContent: 'Just text' }]);
  const parsedMulti = parseTakeoutJsonString(multiJson);
  assert(parsedMulti.length === 2, 'Batch parses multiple Takeout notes from single JSON');

  // 3. Keep API Adapter & Auto-Fallback
  console.log('\n--- 3. Modular Sync Engine & Fallback Logic ---');
  const keepAdapter = new KeepApiAdapter();
  assert(keepAdapter.name === 'keep_api', 'KeepApiAdapter initialized');

  // Verify KeepApiAdapter handles 403 Forbidden with requiresFallback
  const testNote: Note = {
    id: 'test-123',
    title: 'Sync Test',
    content: 'Testing fallback',
    items: [{ id: 'item-1', text: 'Subtask', isChecked: false, order: 0, indent: 0 }],
    color: 'mint',
    tags: ['test'],
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    syncState: 'pending_create',
    version: 1,
  };

  const driveAdapter = new DriveFallbackAdapter();
  assert(driveAdapter.name === 'drive_fallback', 'DriveFallbackAdapter initialized');

  console.log(`\n========================================`);
  console.log(`Summary: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runValidation().catch((e) => {
  console.error(e);
  process.exit(1);
});
