#!/usr/bin/env node
/**
 * Generate TTS audio for G7 voice lectures missing href attributes.
 * Calls the TTS admin API (POST /api/generate) one script at a time.
 *
 * Usage:
 *   node scripts/generate-g7-tts.js --voice-id <id> [--dry-run]
 *
 * Prerequisites: TTS admin server running at http://localhost:5003
 * Related: v2-tts-admin/server.js, v2-tts-admin/services/markdownService.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TTS_API_BASE = 'http://localhost:5003';
const VOICE_LECTURES_DIR = path.join(__dirname, '../v2/data/voice-lectures');
const AUDIO_DIR = path.join(__dirname, '../v2/audio');
let GRADE = 'g7';
let UNIT_FILTER = null;

const SCRIPT_REGEX = /<teacher_script([^>]*)>([\s\S]*?)<\/teacher_script>/gi;

const SECTION_ORDER = [
  'getting-started',
  'a-closer-look-1',
  'a-closer-look-2',
  'communication',
  'skills-1',
  'skills-2',
  'looking-back',
  'project',
];

/** Clean text for TTS - mirrors markdownService.cleanTextForTTS exactly. */
function cleanTextForTTS(text) {
  let cleaned = text.replace(/<(eng|vn)>([\s\S]*?)<\/\1>/gi, '$2');
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

/** Generate hash - mirrors markdownService.generateHash exactly. */
function generateHash(text) {
  return crypto.createHash('md5').update(text).digest('hex').slice(0, 8);
}

/** Parse teacher scripts from markdown content. */
function parseTeacherScripts(content) {
  const scripts = [];
  let match;
  SCRIPT_REGEX.lastIndex = 0;

  while ((match = SCRIPT_REGEX.exec(content)) !== null) {
    const attrs = match[1];
    const text = match[2].trim();
    const cleanedText = cleanTextForTTS(text);
    const hrefMatch = attrs.match(/href="([^"]+)"/);

    scripts.push({
      index: scripts.length,
      text,
      cleanedText,
      href: hrefMatch ? hrefMatch[1] : null,
      hash: generateHash(cleanedText),
    });
  }

  return scripts;
}

/** Check if audio file exists locally. */
function audioFileExists(hash) {
  const filename = `tts_${hash}.mp3`;
  return fs.existsSync(path.join(AUDIO_DIR, filename));
}

/** Call POST /api/generate on the TTS admin server. */
async function callGenerateAPI(filePath, scriptIndex, voiceId, cleanedText, hash) {
  const resp = await fetch(`${TTS_API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath, scriptIndex, voiceId, cleanedText, hash }),
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${errBody}`);
  }

  return resp.json();
}

/** Get sorted list of markdown files for the grade. */
function getMarkdownFiles() {
  const gradeDir = path.join(VOICE_LECTURES_DIR, GRADE);
  const units = fs.readdirSync(gradeDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && (!UNIT_FILTER || UNIT_FILTER.includes(d.name)))
    .map(d => d.name)
    .sort();

  const files = [];

  for (const unit of units) {
    const unitDir = path.join(gradeDir, unit);
    const mdFiles = fs.readdirSync(unitDir)
      .filter(f => f.endsWith('.md'))
      .sort((a, b) => {
        const secA = a.replace('.md', '');
        const secB = b.replace('.md', '');
        const idxA = SECTION_ORDER.indexOf(secA);
        const idxB = SECTION_ORDER.indexOf(secB);
        const orderA = idxA === -1 ? SECTION_ORDER.length : idxA;
        const orderB = idxB === -1 ? SECTION_ORDER.length : idxB;
        return orderA - orderB;
      });

    for (const file of mdFiles) {
      files.push({
        relativePath: `${GRADE}/${unit}/${file}`,
        absolutePath: path.join(unitDir, file),
        unit,
        section: file.replace('.md', ''),
      });
    }
  }

  return files;
}

/** Parse CLI arguments. */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { dryRun: false, voiceId: null, grade: null, units: null };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      result.dryRun = true;
    } else if (args[i] === '--voice-id' && args[i + 1]) {
      result.voiceId = args[++i];
    } else if (args[i] === '--grade' && args[i + 1]) {
      result.grade = args[++i];
    } else if (args[i] === '--units' && args[i + 1]) {
      result.units = args[++i].split(',');
    }
  }

  return result;
}

async function main() {
  const { dryRun, voiceId, grade, units } = parseArgs();
  if (grade) GRADE = grade;
  if (units) UNIT_FILTER = units;

  if (!voiceId) {
    console.error('Usage: node scripts/generate-g7-tts.js --voice-id <id> --grade <g6|g7|...> [--units unit-10,unit-11] [--dry-run]');
    console.error('\nGet voice IDs from: GET http://localhost:5003/api/voices');
    process.exit(1);
  }

  if (dryRun) {
    console.log('=== DRY RUN MODE (no changes will be made) ===\n');
  }

  const files = getMarkdownFiles();
  console.log(`Found ${files.length} markdown files in ${GRADE}/\n`);

  const totals = { scripts: 0, skipped: 0, reused: 0, generated: 0, failed: 0 };

  for (const file of files) {
    const content = fs.readFileSync(file.absolutePath, 'utf-8');
    const scripts = parseTeacherScripts(content);
    const missing = scripts.filter(s => !s.href);

    if (missing.length === 0) {
      continue;
    }

    console.log(`--- ${file.relativePath} (${missing.length}/${scripts.length} missing) ---`);

    for (const script of missing) {
      totals.scripts++;
      const hasAudio = audioFileExists(script.hash);
      const preview = script.cleanedText.slice(0, 60);

      if (dryRun) {
        const action = hasAudio ? 'REUSE' : 'GENERATE';
        console.log(`  [${action}] #${script.index} (${script.hash}) "${preview}..."`);
        if (hasAudio) totals.reused++;
        else totals.generated++;
        continue;
      }

      try {
        const result = await callGenerateAPI(
          file.relativePath, script.index, voiceId,
          script.cleanedText, script.hash
        );

        if (result.cached) {
          console.log(`  [REUSED]    #${script.index} (${script.hash}) "${preview}..."`);
          totals.reused++;
        } else {
          console.log(`  [GENERATED] #${script.index} (${script.hash}) "${preview}..."`);
          totals.generated++;
        }
      } catch (err) {
        console.error(`  [FAILED]    #${script.index} (${script.hash}) ${err.message}`);
        totals.failed++;
      }
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total scripts without href: ${totals.scripts}`);
  console.log(`Reused (audio existed):     ${totals.reused}`);
  console.log(`Generated (new audio):      ${totals.generated}`);
  console.log(`Failed:                     ${totals.failed}`);
  console.log(`Skipped (already had href): (not counted)`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
