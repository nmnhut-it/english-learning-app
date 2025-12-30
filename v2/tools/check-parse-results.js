#!/usr/bin/env node
/**
 * Check parse results - identify files with 0 vocab or suspicious patterns
 */

const fs = require('fs');
const path = require('path');

// Import the parser
const parserPath = path.join(__dirname, 'parse-vocabulary.js');

class VocabularyParser {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.results = [];
    this.errors = [];
    this.stats = { filesProcessed: 0, wordsFound: 0, parseErrors: 0 };
  }

  log(message) { if (this.verbose) console.log(message); }

  parseLine(line, context = {}) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('|:')) return null;

    const PATTERNS = {
      GRADE_6_STYLE: /^\s*(\d+)\.\s*([^:]+)\s*:\s*\(([^)]+)\)\s*([^/]+)\s*\/([^/]+)\/(?:\s*\/[^/]+\/)?/,
      GRADE_7_8_STYLE: /^\s*(\d+)\.\s*([^:]+)\s*:\s*\(([^)]+)\)\s*(.+?)\s*\/([^/]+)\/\s*$/,
      GRADE_7_8_NO_IPA: /^\s*(\d+)\.\s*([^:]+)\s*:\s*(?:\(([^)]+)\)\s*)?(.+?)\s*$/,
      GRADE_10_STYLE: /^\s*(\d+)\.\s*\*\*([^*]+)\*\*\s*\/([^/]+)\/\s*\(([^)]+)\)\s*:\s*(.+)/,
      GRADE_11_SUMMARY: /^\s*[-*]\s*\*\*([^*]+)\*\*\s*(?:\(([^)]+)\))?\s*:\s*(.+)/,
      // Grade 9 style with escaped dot and Vietnamese approx: 1\.	word: (pos) meaning /viet/
      GRADE_9_ESCAPED: /^\s*\d+\\\.\s+([^:]+)\s*:\s*(?:\(([^)]+)\)\s*)?(.+?)(?:\s*\/[^/]+\/)?$/,
      // Simple bullet format: - word (pos): meaning
      BULLET_POS: /^\s*[-*]\s+([^(:]+)\s*\(([^)]+)\)\s*:\s*(.+)/,
    };

    let match, vocab = null;

    match = trimmed.match(PATTERNS.GRADE_10_STYLE);
    if (match) {
      return { word: match[2].trim(), ipa: `/${match[3].trim()}/`, pos: match[4].trim(), meaning: match[5].trim(), format: 'grade10+' };
    }

    match = trimmed.match(PATTERNS.GRADE_6_STYLE);
    if (match) {
      return { word: match[2].trim(), pos: match[3].trim(), meaning: match[4].trim(), ipa: `/${match[5].trim()}/`, format: 'grade6' };
    }

    match = trimmed.match(PATTERNS.GRADE_7_8_STYLE);
    if (match) {
      return { word: match[2].trim(), pos: match[3].trim(), meaning: match[4].trim(), ipa: `/${match[5].trim()}/`, format: 'grade7-8' };
    }

    match = trimmed.match(PATTERNS.GRADE_11_SUMMARY);
    if (match) {
      return { word: match[1].trim(), pos: match[2] ? match[2].trim() : '', meaning: match[3].trim(), ipa: '', format: 'grade11-summary' };
    }

    // Grade 9 escaped dot format
    match = trimmed.match(PATTERNS.GRADE_9_ESCAPED);
    if (match) {
      const meaning = match[3].trim();
      // Skip if meaning looks like an answer or exercise reference
      if (meaning && !meaning.match(/^[A-F\d,\s]+$/) && meaning.length > 1) {
        return { word: match[1].trim(), pos: match[2] ? match[2].trim() : '', meaning, ipa: '', format: 'grade9-escaped' };
      }
    }

    // Simple bullet format: - word (pos): meaning
    match = trimmed.match(PATTERNS.BULLET_POS);
    if (match) {
      return { word: match[1].trim(), pos: match[2].trim(), meaning: match[3].trim(), ipa: '', format: 'bullet-pos' };
    }

    match = trimmed.match(PATTERNS.GRADE_7_8_NO_IPA);
    if (match && match[4] && !match[4].includes('trang') && !match[4].includes('Bài')) {
      if (/^\d+$/.test(match[4].trim())) return null;
      if (match[4].includes('→') || match[4].includes('=')) return null;
      const vocab = { word: match[2].trim(), pos: match[3] ? match[3].trim() : '', meaning: match[4].trim(), ipa: '', format: 'grade7-8-no-ipa' };
      if (vocab.meaning.length > 1 && !/^[A-F\d\s,]+$/.test(vocab.meaning)) return vocab;
    }

    return null;
  }

  parseFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const vocabItems = [];

      for (let i = 0; i < lines.length; i++) {
        const vocab = this.parseLine(lines[i]);
        if (vocab) {
          vocabItems.push({ ...vocab, line: i + 1 });
        }
      }

      this.stats.filesProcessed++;
      this.stats.wordsFound += vocabItems.length;
      return { file: filePath, count: vocabItems.length, items: vocabItems };
    } catch (error) {
      this.stats.parseErrors++;
      return { file: filePath, count: 0, error: error.message, items: [] };
    }
  }
}

function scanDirectory(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.md') && !entry.name.includes('.translation.')) {
      results.push(fullPath);
    }
  }
  return results;
}

function main() {
  // Use absolute path
  const markdownDir = '/home/user/english-learning-app/markdown-files';

  console.log('Scanning markdown files...\n');

  const parser = new VocabularyParser();
  const files = scanDirectory(markdownDir);

  const zeroVocabFiles = [];
  const lowVocabFiles = [];
  const allResults = [];

  for (const file of files) {
    const result = parser.parseFile(file);
    allResults.push(result);

    if (result.count === 0) {
      zeroVocabFiles.push(file);
    } else if (result.count < 5) {
      lowVocabFiles.push({ file, count: result.count });
    }
  }

  // Report
  console.log('========================================');
  console.log('PARSE RESULTS');
  console.log('========================================');
  console.log(`Total files: ${files.length}`);
  console.log(`Files with vocabulary: ${files.length - zeroVocabFiles.length}`);
  console.log(`Files with 0 vocabulary: ${zeroVocabFiles.length}`);
  console.log(`Total vocabulary items: ${parser.stats.wordsFound}`);

  if (zeroVocabFiles.length > 0) {
    console.log('\n========================================');
    console.log('FILES WITH 0 VOCABULARY (need pattern check)');
    console.log('========================================');
    // Group by directory
    const byDir = {};
    for (const file of zeroVocabFiles) {
      const dir = path.dirname(file).replace(markdownDir, '');
      if (!byDir[dir]) byDir[dir] = [];
      byDir[dir].push(path.basename(file));
    }
    for (const [dir, files] of Object.entries(byDir)) {
      console.log(`\n${dir}/`);
      for (const f of files.slice(0, 5)) {
        console.log(`  - ${f}`);
      }
      if (files.length > 5) {
        console.log(`  ... and ${files.length - 5} more`);
      }
    }
  }

  if (lowVocabFiles.length > 0 && lowVocabFiles.length <= 20) {
    console.log('\n========================================');
    console.log('FILES WITH LOW VOCABULARY (1-4 items)');
    console.log('========================================');
    for (const { file, count } of lowVocabFiles) {
      console.log(`  ${count} items: ${path.relative(markdownDir, file)}`);
    }
  }

  // Sample some extracted vocabulary for verification
  console.log('\n========================================');
  console.log('SAMPLE EXTRACTED VOCABULARY');
  console.log('========================================');

  const sampledFiles = allResults.filter(r => r.count > 0).slice(0, 5);
  for (const result of sampledFiles) {
    console.log(`\n${path.relative(markdownDir, result.file)} (${result.count} items):`);
    for (const item of result.items.slice(0, 3)) {
      console.log(`  Line ${item.line}: ${item.word} (${item.pos}) = ${item.meaning}`);
    }
    if (result.count > 3) {
      console.log(`  ... and ${result.count - 3} more`);
    }
  }

  // Return exit code based on zero vocab files
  console.log('\n');
  if (zeroVocabFiles.length > files.length * 0.5) {
    console.log('WARNING: More than 50% of files have 0 vocabulary!');
    process.exit(1);
  }
}

main();
