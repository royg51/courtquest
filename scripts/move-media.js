#!/usr/bin/env node
/**
 * CourtQuest Media Move Script
 *
 * Moves the KEEP files from media-selection-manifest.json into:
 *   public/media/tournaments/chill-dill/
 *   public/media/tournaments/rally-royale/
 *
 * NEVER deletes anything. Source files are moved (renamed) only.
 * A reverse manifest is written so every move can be undone.
 *
 * Usage (from the courtquest/ directory):
 *   node scripts/move-media.js           # dry run — shows what would move
 *   node scripts/move-media.js --commit  # actually moves the files
 *
 * To REVERSE all moves after --commit:
 *   node scripts/move-media.js --reverse
 *
 * WARNING: After running --commit, UI code that references the original paths
 * will break. You must update the src paths in:
 *   - app/(public)/page.tsx
 *   - app/(public)/events/page.tsx
 *   - app/(public)/about/page.tsx
 *   - lib/content/events.ts
 * The new paths will be:
 *   /media/tournaments/chill-dill/<filename>
 *   /media/tournaments/rally-royale/<filename>
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = !process.argv.includes('--commit') && !process.argv.includes('--reverse');
const REVERSE = process.argv.includes('--reverse');

const PROJECT_ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(__dirname, 'media-selection-manifest.json');
const REVERSE_LOG_PATH = path.join(__dirname, 'move-media-reverse.json');

// ─── Load manifest ────────────────────────────────────────────────────────────
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

function resolvePublic(relPath) {
  return path.join(PROJECT_ROOT, 'public', relPath);
}

// ─── Reverse mode ─────────────────────────────────────────────────────────────
if (REVERSE) {
  if (!fs.existsSync(REVERSE_LOG_PATH)) {
    console.error('ERROR: No reverse log found at scripts/move-media-reverse.json');
    console.error('       Run --commit first before reversing.');
    process.exit(1);
  }

  const reverseLog = JSON.parse(fs.readFileSync(REVERSE_LOG_PATH, 'utf8'));
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`CourtQuest Media Move — REVERSE`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`Reversing ${reverseLog.moves.length} moves...\n`);

  let reversed = 0;
  let skipped = 0;

  for (const entry of reverseLog.moves) {
    const src = path.join(PROJECT_ROOT, 'public', entry.dest);
    const orig = path.join(PROJECT_ROOT, 'public', entry.src);

    if (!fs.existsSync(src)) {
      console.log(`SKIP (not found at dest): ${entry.dest}`);
      skipped++;
      continue;
    }

    const origDir = path.dirname(orig);
    if (!fs.existsSync(origDir)) {
      fs.mkdirSync(origDir, { recursive: true });
    }

    fs.renameSync(src, orig);
    console.log(`REVERSED: ${entry.dest}`);
    console.log(`      ← ${entry.src}`);
    reversed++;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Done. ${reversed} reversed, ${skipped} skipped.`);
  process.exit(0);
}

// ─── Build move list ──────────────────────────────────────────────────────────
const allKeep = [
  ...manifest.keep['chill-dill'],
  ...manifest.keep['rally-royale'],
];

console.log(`\n${'─'.repeat(60)}`);
console.log(`CourtQuest Media Move`);
console.log(`${'─'.repeat(60)}`);
console.log(`Mode:        ${DRY_RUN ? 'DRY RUN (pass --commit to apply)' : 'COMMIT — files will be moved'}`);
console.log(`Files to move: ${allKeep.length}`);
console.log(`${'─'.repeat(60)}\n`);

const moves = [];
const errors = [];

for (const entry of allKeep) {
  const src = resolvePublic(entry.src);
  const dest = resolvePublic(entry.dest);
  const destDir = path.dirname(dest);

  if (!fs.existsSync(src)) {
    errors.push(`SOURCE NOT FOUND: ${entry.src}`);
    continue;
  }

  moves.push({ src: entry.src, dest: entry.dest, srcAbs: src, destAbs: dest, destDir });
}

// Report missing files
if (errors.length > 0) {
  console.log(`\n⚠️  MISSING SOURCE FILES (${errors.length}):`);
  for (const e of errors) console.log(`   ${e}`);
  console.log('');
}

// Show/execute moves
let moved = 0;
for (const m of moves) {
  if (DRY_RUN) {
    console.log(`[DRY] MOVE  ${m.src}`);
    console.log(`      →     ${m.dest}`);
  } else {
    // Create destination directory if needed
    if (!fs.existsSync(m.destDir)) {
      fs.mkdirSync(m.destDir, { recursive: true });
      console.log(`Created dir: ${path.relative(PROJECT_ROOT, m.destDir)}`);
    }

    fs.renameSync(m.srcAbs, m.destAbs);
    console.log(`MOVED  ${m.src}`);
    console.log(`   →   ${m.dest}`);
    moved++;
  }
}

console.log(`\n${'─'.repeat(60)}`);

if (DRY_RUN) {
  console.log(`DRY RUN: ${moves.length} moves would be made, ${errors.length} sources missing.`);
  console.log(`Run with --commit to apply.`);
} else {
  console.log(`Done. ${moved} files moved.`);

  // Write reverse log for undo support
  const reverseLog = {
    timestamp: new Date().toISOString(),
    moves: moves.map((m) => ({ src: m.src, dest: m.dest })),
  };
  fs.writeFileSync(REVERSE_LOG_PATH, JSON.stringify(reverseLog, null, 2));
  console.log(`Reverse log written to scripts/move-media-reverse.json`);
  console.log(`To undo all moves: node scripts/move-media.js --reverse`);

  console.log(`\n⚠️  IMPORTANT: Update these files to use the new paths:`);
  console.log(`   app/(public)/page.tsx`);
  console.log(`   app/(public)/events/page.tsx`);
  console.log(`   app/(public)/about/page.tsx`);
  console.log(`   lib/content/events.ts`);
  console.log(`\n   New path format: /media/tournaments/chill-dill/<filename>`);
  console.log(`                    /media/tournaments/rally-royale/<filename>`);
}
