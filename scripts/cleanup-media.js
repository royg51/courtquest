#!/usr/bin/env node
/**
 * CourtQuest Media Cleanup Script
 *
 * Moves all non-curated tournament media files to /Trash_CourtQuest/ at the
 * root of the courtquest project. Nothing is permanently deleted — every file
 * can be recovered from that folder.
 *
 * Usage (from the courtquest/ directory):
 *   node scripts/cleanup-media.js           # dry run — shows what would move
 *   node scripts/cleanup-media.js --commit  # actually moves the files
 *
 * The keep list is read from scripts/media-manifest.json.
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = !process.argv.includes('--commit');
const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public', 'tournaments');
const TRASH_DIR = path.join(PROJECT_ROOT, 'Trash_CourtQuest');
const MANIFEST_PATH = path.join(__dirname, 'media-manifest.json');

// ─── Load manifest ────────────────────────────────────────────────────────────
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

const KEEP_SET = new Set(
  [
    ...manifest.keep['chill-n-dill'],
    ...manifest.keep['rally-royale-photos'],
    ...manifest.keep['rally-royale-video'],
  ].map((p) => path.join(PROJECT_ROOT, 'public', p)),
);

// ─── Walk directory recursively ───────────────────────────────────────────────
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

// ─── Unique destination name (handles collisions) ─────────────────────────────
function uniqueDest(trashDir, basename) {
  let dest = path.join(trashDir, basename);
  let counter = 1;
  while (fs.existsSync(dest)) {
    const ext = path.extname(basename);
    const base = path.basename(basename, ext);
    dest = path.join(trashDir, `${base}_${counter}${ext}`);
    counter++;
  }
  return dest;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
if (!fs.existsSync(PUBLIC_DIR)) {
  console.error(`ERROR: /public/tournaments/ not found at ${PUBLIC_DIR}`);
  process.exit(1);
}

const allFiles = walk(PUBLIC_DIR);
const toDelete = allFiles.filter((f) => !KEEP_SET.has(f));
const toKeep = allFiles.filter((f) => KEEP_SET.has(f));

console.log(`\n${'─'.repeat(60)}`);
console.log(`CourtQuest Media Cleanup`);
console.log(`${'─'.repeat(60)}`);
console.log(`Mode:         ${DRY_RUN ? 'DRY RUN (pass --commit to apply)' : 'COMMIT — files will be moved'}`);
console.log(`Total files:  ${allFiles.length}`);
console.log(`Keep:         ${toKeep.length} curated files`);
console.log(`Move to trash:${toDelete.length} rejected files`);
console.log(`Trash folder: ${TRASH_DIR}`);
console.log(`${'─'.repeat(60)}\n`);

if (toKeep.length === 0 && allFiles.length > 0) {
  console.error('ERROR: No keep-list files found on disk. Did you run from the courtquest/ directory?');
  process.exit(1);
}

if (!DRY_RUN) {
  fs.mkdirSync(TRASH_DIR, { recursive: true });
}

const log = [];
for (const filePath of toDelete) {
  const rel = path.relative(PROJECT_ROOT, filePath);
  const dest = uniqueDest(TRASH_DIR, path.basename(filePath));
  const destRel = path.relative(PROJECT_ROOT, dest);

  log.push({ from: rel, to: destRel });

  if (DRY_RUN) {
    console.log(`[DRY] MOVE  ${rel}`);
    console.log(`       → ${destRel}`);
  } else {
    fs.renameSync(filePath, dest);
    console.log(`MOVED  ${rel}`);
    console.log(`    → ${destRel}`);
  }
}

console.log(`\n${'─'.repeat(60)}`);
if (DRY_RUN) {
  console.log(`DRY RUN complete. ${toDelete.length} files would be moved.`);
  console.log(`Run with --commit to apply:\n  node scripts/cleanup-media.js --commit`);
} else {
  console.log(`Done. ${toDelete.length} files moved to ${TRASH_DIR}`);
  console.log(`To recover: files are in Trash_CourtQuest/ — move them back manually.`);
}

// Write a log file alongside this script for audit trail
const logPath = path.join(__dirname, 'cleanup-log.json');
fs.writeFileSync(
  logPath,
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      dryRun: DRY_RUN,
      kept: toKeep.map((f) => path.relative(PROJECT_ROOT, f)),
      moved: log,
    },
    null,
    2,
  ),
);
console.log(`Log written to scripts/cleanup-log.json`);
