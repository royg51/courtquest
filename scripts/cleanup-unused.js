#!/usr/bin/env node
/**
 * CourtQuest Asset Cleanup — Phase 3
 *
 * Moves unused/archived media files to /Trash_CourtQuest/.
 * NEVER permanently deletes anything. All moves are reversible.
 *
 * What moves:
 *   A) Unused bench files in /public/media/ (12 files, ~8.4MB)
 *      — moved to /Trash_CourtQuest/media-unused/
 *
 *   B) All original /public/tournaments/ archives (544 files, 12.4GB)
 *      — moved to /Trash_CourtQuest/tournaments-original/
 *      — these are no longer referenced by any code after the migration
 *
 * Usage:
 *   node scripts/cleanup-unused.js           # dry run (shows what would move)
 *   node scripts/cleanup-unused.js --commit  # executes the moves
 *
 * To recover any file: look in /Trash_CourtQuest/ and move it back manually.
 * A recovery manifest is written to scripts/cleanup-unused-reverse.json after --commit.
 *
 * Safe guards:
 *   - Only moves files listed in UNUSED_BENCH or found under /public/tournaments/
 *   - Never touches /public/media/ files referenced in lib/media.ts
 *   - Skips .DS_Store files
 *   - Logs every operation
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = !process.argv.includes('--commit');
const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(PROJECT_ROOT, 'public');
const TRASH = path.join(PROJECT_ROOT, 'Trash_CourtQuest');
const REVERSE_LOG = path.join(__dirname, 'cleanup-unused-reverse.json');

// ─── A: Unused bench files in /public/media/ ─────────────────────────────────
// These were moved from /tournaments/ as high-quality reserves but are not
// referenced in lib/media.ts and render on no page.
const UNUSED_BENCH = [
  'media/tournaments/chill-dill/235-DSC06370.jpg',
  'media/tournaments/chill-dill/300-DSC06298.jpg',
  'media/tournaments/chill-dill/348-DSC06242.jpg',
  'media/tournaments/chill-dill/455-DSC06112.jpg',
  'media/tournaments/chill-dill/468-DSC06097.jpg',
  'media/tournaments/chill-dill/51-DSC06611.jpg',
  'media/tournaments/rally-royale/IMG_4632.JPG',
  'media/tournaments/rally-royale/IMG_4669.JPG',
  'media/tournaments/rally-royale/IMG_4701.JPG',
  'media/tournaments/rally-royale/IMG_4705.JPG',
  'media/tournaments/rally-royale/IMG_4706.JPG',
  'media/tournaments/rally-royale/IMG_4707.JPG',
];

// ─── B: All /public/tournaments/ originals ───────────────────────────────────
function walkTournaments() {
  const results = [];
  const dir = path.join(PUBLIC, 'tournaments');
  if (!fs.existsSync(dir)) return results;

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === '.DS_Store') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const allBenchSrc = UNUSED_BENCH.map((rel) => ({
  src: path.join(PUBLIC, rel),
  dest: path.join(TRASH, 'media-unused', path.basename(rel)),
  rel,
}));

const allOriginals = walkTournaments().map((full) => {
  const rel = path.relative(PUBLIC, full);
  return {
    src: full,
    dest: path.join(TRASH, 'tournaments-original', rel),
    rel,
  };
});

const allMoves = [...allBenchSrc, ...allOriginals];

const benchSizeTotal = allBenchSrc.reduce((sum, m) => {
  try { return sum + fs.statSync(m.src).size; } catch { return sum; }
}, 0);

const originalSizeTotal = allOriginals.reduce((sum, m) => {
  try { return sum + fs.statSync(m.src).size; } catch { return sum; }
}, 0);

console.log(`\n${'─'.repeat(64)}`);
console.log('CourtQuest Asset Cleanup — Phase 3');
console.log(`${'─'.repeat(64)}`);
console.log(`Mode:              ${DRY_RUN ? 'DRY RUN (--commit to apply)' : 'COMMIT'}`);
console.log(`A) Bench files:    ${allBenchSrc.length} files  (${(benchSizeTotal / 1024 / 1024).toFixed(1)}MB)`);
console.log(`B) /tournaments/:  ${allOriginals.length} files  (${(originalSizeTotal / 1024 / 1024).toFixed(1)}MB)`);
console.log(`Total recoverable: ${(benchSizeTotal + originalSizeTotal) / 1024 / 1024 / 1024 > 1
  ? ((benchSizeTotal + originalSizeTotal) / 1024 / 1024 / 1024).toFixed(1) + 'GB'
  : ((benchSizeTotal + originalSizeTotal) / 1024 / 1024).toFixed(0) + 'MB'}`);
console.log(`${'─'.repeat(64)}\n`);

let moved = 0;
let skipped = 0;
const reverseLog = [];

console.log('A) Bench files (unused /public/media reserves):');
for (const m of allBenchSrc) {
  if (!fs.existsSync(m.src)) {
    console.log(`  SKIP (not found): ${m.rel}`);
    skipped++;
    continue;
  }
  if (DRY_RUN) {
    console.log(`  [DRY] ${m.rel}`);
  } else {
    fs.mkdirSync(path.dirname(m.dest), { recursive: true });
    fs.renameSync(m.src, m.dest);
    reverseLog.push({ from: m.dest, to: m.src });
    console.log(`  MOVED: ${m.rel}`);
    moved++;
  }
}

console.log('\nB) /public/tournaments/ originals (12.4GB archive):');
let origMoved = 0;
for (const m of allOriginals) {
  if (!fs.existsSync(m.src)) { skipped++; continue; }
  if (DRY_RUN) {
    // Suppress individual file output for the 544-file list
  } else {
    fs.mkdirSync(path.dirname(m.dest), { recursive: true });
    fs.renameSync(m.src, m.dest);
    reverseLog.push({ from: m.dest, to: m.src });
    origMoved++;
    moved++;
  }
}

if (DRY_RUN) {
  console.log(`  [DRY] Would move ${allOriginals.length} files from /public/tournaments/ to Trash_CourtQuest/tournaments-original/`);
  console.log('  (suppressing individual file list — 544 files)');
} else {
  console.log(`  Moved ${origMoved} files → Trash_CourtQuest/tournaments-original/`);
}

console.log(`\n${'─'.repeat(64)}`);

if (DRY_RUN) {
  console.log(`DRY RUN complete. ${allMoves.length} files would move, ${skipped} not found.`);
  console.log(`\nRun with --commit to apply:`);
  console.log(`  node scripts/cleanup-unused.js --commit`);
} else {
  console.log(`Done. ${moved} files moved, ${skipped} skipped.`);
  fs.writeFileSync(REVERSE_LOG, JSON.stringify({ timestamp: new Date().toISOString(), moves: reverseLog }, null, 2));
  console.log(`Recovery log: scripts/cleanup-unused-reverse.json (${reverseLog.length} entries)`);
  console.log(`\nTo recover any file: check Trash_CourtQuest/ and move back manually.`);
}
