#!/usr/bin/env node
/**
 * Normalize Vocabulary Format Script
 * Converts all vocabulary entries to standard format:
 * 1. **word** : (pos) meaning /ipa/
 *
 * Usage: node normalize-vocabulary.js [options]
 *   --input, -i   Input directory (default: ../../markdown-files)
 *   --dry-run     Show changes without modifying files
 *   --verbose, -v Verbose output
 */

const fs = require('fs');
const path = require('path');

// Patterns to match vocabulary entries (order matters - more specific first)
const PATTERNS = {
  // Pattern 1: - **word** : (pos) meaning /ipa/ (bullet + bold)
  BULLET_BOLD: /^(\s*)- \*\*([^*]+)\*\*\s*:\s*\(([^)]+)\)\s*(.+?)\s*(\/[^/]+\/)?\s*$/,

  // Pattern 2: 1. **word** : (pos) meaning /ipa/ (numbered + bold) - SKIP if already normalized
  NUMBERED_BOLD: /^(\s*)(\d+)\.\s*\*\*([^*]+)\*\*\s*:\s*\(([^)]+)\)\s*(.+?)\s*(\/[^/]+\/)?\s*$/,

  // Pattern 3: 1. **word**: meaning (numbered + bold, no pos) - SKIP if already normalized
  NUMBERED_BOLD_NO_POS: /^(\s*)(\d+)\.\s*\*\*([^*]+)\*\*\s*:\s*([^(/]+?)\s*(\/[^/]+\/)?\s*$/,

  // Pattern 4: 1. word: (pos) meaning /ipa/ (numbered plain)
  NUMBERED_PLAIN: /^(\s*)(\d+)\.\s*([^:*]+)\s*:\s*\(([^)]+)\)\s*(.+?)\s*(\/[^/]+\/)?\s*$/,

  // Pattern 5: 1. word: meaning /ipa/ (no pos, no bold) - multi-word vocab
  NUMBERED_NO_POS: /^(\s*)(\d+)\.\s*([^:*]+?)\s*:\s*([^(/]+?)\s*(\/[^/]+\/)?\s*$/,

  // Pattern 6: - **word** (pos): meaning /ipa/
  BULLET_BOLD_ALT: /^(\s*)- \*\*([^*]+)\*\*\s*\(([^)]+)\)\s*:\s*(.+?)\s*(\/[^/]+\/)?\s*$/,
};

// Track statistics
const stats = {
  filesProcessed: 0,
  entriesNormalized: 0,
  entriesSkipped: 0,
  errors: [],
};

// Counter for renumbering within sections
let entryCounter = 0;

function normalizeEntry(line, lineNumber, keepOriginalNumber) {
  // Try each pattern
  for (const [patternName, pattern] of Object.entries(PATTERNS)) {
    const match = line.match(pattern);
    if (match) {
      entryCounter++;

      let indent, origNum, word, pos, meaning, ipa;

      switch (patternName) {
        case 'BULLET_BOLD':
          [, indent, word, pos, meaning, ipa] = match;
          origNum = null;
          break;
        case 'NUMBERED_BOLD':
          // Already in correct format with pos - skip
          return null;
        case 'NUMBERED_BOLD_NO_POS':
          // Already in correct format without pos - skip
          return null;
        case 'NUMBERED_PLAIN':
          [, indent, origNum, word, pos, meaning, ipa] = match;
          break;
        case 'NUMBERED_NO_POS':
          [, indent, origNum, word, meaning, ipa] = match;
          pos = null;
          break;
        case 'BULLET_BOLD_ALT':
          [, indent, word, pos, meaning, ipa] = match;
          origNum = null;
          break;
      }

      // Clean up values
      word = word.trim();
      meaning = meaning ? meaning.trim() : '';
      ipa = ipa ? ipa.trim() : '';
      pos = pos ? pos.trim().toLowerCase() : '';
      indent = indent || '';

      // Skip if missing essential parts
      if (!word || !meaning) {
        stats.entriesSkipped++;
        return null;
      }

      // Use original number if available, otherwise use counter
      const num = keepOriginalNumber && origNum ? origNum : entryCounter;

      // Build normalized entry
      let normalized = `${num}. **${word}** : `;
      if (pos) {
        normalized += `(${pos}) ${meaning}`;
      } else {
        normalized += meaning;
      }
      if (ipa) {
        normalized += ` ${ipa}`;
      }

      stats.entriesNormalized++;
      return normalized;
    }
  }

  return null;
}

function processFile(filePath, dryRun, verbose) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    let inVocabSection = false;
    entryCounter = 0;

    const newLines = lines.map((line, index) => {
      // Detect vocabulary section headers
      if (/^#{1,4}\s*(📚\s*)?(Vocabulary|Từ vựng)/i.test(line) ||
          /^\*\*Vocabulary\*\*/i.test(line)) {
        inVocabSection = true;
        entryCounter = 0;
        return line;
      }

      // Reset on new section
      if (/^#{1,4}\s+[^V📚]/.test(line) && !line.includes('Vocabulary')) {
        inVocabSection = false;
        entryCounter = 0;
      }

      // Try to normalize vocabulary entries (keep original numbers)
      const normalized = normalizeEntry(line, index + 1, true);
      if (normalized && normalized !== line) {
        modified = true;
        if (verbose) {
          console.log(`  Line ${index + 1}: ${line.substring(0, 60)}...`);
          console.log(`       => ${normalized.substring(0, 60)}...`);
        }
        return normalized;
      }

      return line;
    });

    if (modified && !dryRun) {
      fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    }

    stats.filesProcessed++;
    return modified;
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    return false;
  }
}

function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDirectory(filePath, callback);
    } else if (file.endsWith('.md')) {
      callback(filePath);
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const options = {
    input: null,
    dryRun: false,
    verbose: false,
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
      case '-i':
        options.input = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Normalize Vocabulary Format Script

Usage: node normalize-vocabulary.js [options]

Options:
  --input, -i   Input directory (default: ../../markdown-files)
  --dry-run     Show changes without modifying files
  --verbose, -v Verbose output
  --help, -h    Show this help

Target format: 1. **word** : (pos) meaning /ipa/
`);
        process.exit(0);
    }
  }

  // Set defaults
  const scriptDir = __dirname;
  options.input = options.input || path.join(scriptDir, '..', '..', 'markdown-files');

  console.log('Vocabulary Format Normalizer');
  console.log('============================');
  console.log(`Input: ${options.input}`);
  console.log(`Dry run: ${options.dryRun}`);
  console.log(`Verbose: ${options.verbose}`);
  console.log('');

  if (!fs.existsSync(options.input)) {
    console.error(`Error: Input path does not exist: ${options.input}`);
    process.exit(1);
  }

  // Process files
  const modifiedFiles = [];
  walkDirectory(options.input, (filePath) => {
    if (options.verbose) {
      console.log(`Processing: ${filePath}`);
    }
    const modified = processFile(filePath, options.dryRun, options.verbose);
    if (modified) {
      modifiedFiles.push(filePath);
    }
  });

  // Print summary
  console.log('');
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${modifiedFiles.length}`);
  console.log(`Entries normalized: ${stats.entriesNormalized}`);
  console.log(`Entries skipped: ${stats.entriesSkipped}`);

  if (stats.errors.length > 0) {
    console.log(`Errors: ${stats.errors.length}`);
    for (const err of stats.errors) {
      console.log(`  ${err.file}: ${err.error}`);
    }
  }

  if (options.dryRun) {
    console.log('\n(Dry run - no files were modified)');
  }

  console.log('\nDone!');
}

main();
