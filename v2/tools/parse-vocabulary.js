#!/usr/bin/env node
/**
 * Vocabulary Parser Script
 * Extracts vocabulary from markdown files in different formats
 *
 * Usage: node parse-vocabulary.js [options]
 *   --input, -i   Input file or directory
 *   --output, -o  Output JSON file
 *   --test        Run tests only
 *   --verbose, -v Verbose output
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// VOCABULARY PATTERNS
// ============================================================

const PATTERNS = {
  // Grade 6 format: "1. word: (pos) meaning /ipa/ /viet-approx/"
  // Example: "1. loud: (adj) lớn tiếng /laʊd/) /lau.d/"
  GRADE_6_STYLE: /^\s*(\d+)\.\s*([^:]+)\s*:\s*\(([^)]+)\)\s*([^/]+)\s*\/([^/]+)\/(?:\s*\/[^/]+\/)?/,

  // Grade 7-8 format: "1. word : (pos) meaning /ipa/"
  // Example: "1. hobby : (n) sở thích /ˈhɒbi/"
  GRADE_7_8_STYLE: /^\s*(\d+)\.\s*([^:]+)\s*:\s*\(([^)]+)\)\s*(.+?)\s*\/([^/]+)\/\s*$/,

  // Grade 7-8 format without IPA: "1. word : (pos) meaning"
  // Example: "12. need: cần"
  GRADE_7_8_NO_IPA: /^\s*(\d+)\.\s*([^:]+)\s*:\s*(?:\(([^)]+)\)\s*)?(.+?)\s*$/,

  // Grade 10+ format: "1. **word** /ipa/ (pos): meaning"
  // Example: "1. **volunteering activities** /ˌvɒlənˈtɪərɪŋ ækˈtɪvɪtiz/ (n.phr): hoạt động tình nguyện"
  GRADE_10_STYLE: /^\s*(\d+)\.\s*\*\*([^*]+)\*\*\s*\/([^/]+)\/\s*\(([^)]+)\)\s*:\s*(.+)/,

  // Grade 11 Vocabulary Summary format: "- **word** (pos): meaning"
  // Example: "- **self-confidence** (n): tự tin"
  GRADE_11_SUMMARY: /^\s*[-*]\s*\*\*([^*]+)\*\*\s*(?:\(([^)]+)\))?\s*:\s*(.+)/,

  // Grade 9 escaped dot format: "1\.	word: (pos) meaning /viet/"
  GRADE_9_ESCAPED: /^\s*\d+\\\.\s+([^:]+)\s*:\s*(?:\(([^)]+)\)\s*)?(.+?)(?:\s*\/[^/]+\/)?$/,

  // Simple bullet format: "- word (pos): meaning"
  BULLET_POS: /^\s*[-*]\s+([^(:]+)\s*\(([^)]+)\)\s*:\s*(.+)/,

  // Simple bold word with colon: "**word:** meaning"
  BOLD_COLON: /^\s*\*\*([^*]+)\*\*\s*:\s*(.+)/,

  // Table row vocabulary: "| 1. word | meaning |"
  TABLE_VOCAB: /^\|\s*\d+\.\s*([^|]+)\s*\|\s*([^|]+)\s*\|/,
};

// ============================================================
// PARSER CLASS
// ============================================================

class VocabularyParser {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.results = [];
    this.errors = [];
    this.stats = {
      filesProcessed: 0,
      wordsFound: 0,
      parseErrors: 0,
    };
  }

  log(message) {
    if (this.verbose) {
      console.log(message);
    }
  }

  /**
   * Parse a single line of vocabulary
   */
  parseLine(line, context = {}) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('|:')) {
      return null;
    }

    let match;
    let vocab = null;

    // Try Grade 10+ format first (most specific)
    match = trimmed.match(PATTERNS.GRADE_10_STYLE);
    if (match) {
      vocab = {
        word: match[2].trim(),
        ipa: `/${match[3].trim()}/`,
        pos: match[4].trim(),
        meaning: match[5].trim(),
        format: 'grade10+',
      };
      this.log(`  [Grade10+] ${vocab.word}`);
      return vocab;
    }

    // Try Grade 6 format
    match = trimmed.match(PATTERNS.GRADE_6_STYLE);
    if (match) {
      vocab = {
        word: match[2].trim(),
        pos: match[3].trim(),
        meaning: match[4].trim(),
        ipa: `/${match[5].trim()}/`,
        format: 'grade6',
      };
      this.log(`  [Grade6] ${vocab.word}`);
      return vocab;
    }

    // Try Grade 7-8 format with IPA
    match = trimmed.match(PATTERNS.GRADE_7_8_STYLE);
    if (match) {
      vocab = {
        word: match[2].trim(),
        pos: match[3].trim(),
        meaning: match[4].trim(),
        ipa: `/${match[5].trim()}/`,
        format: 'grade7-8',
      };
      this.log(`  [Grade7-8] ${vocab.word}`);
      return vocab;
    }

    // Try Grade 11 summary format
    match = trimmed.match(PATTERNS.GRADE_11_SUMMARY);
    if (match) {
      vocab = {
        word: match[1].trim(),
        pos: match[2] ? match[2].trim() : '',
        meaning: match[3].trim(),
        ipa: '',
        format: 'grade11-summary',
      };
      this.log(`  [Grade11-Summary] ${vocab.word}`);
      return vocab;
    }

    // Try Grade 9 escaped dot format
    match = trimmed.match(PATTERNS.GRADE_9_ESCAPED);
    if (match) {
      const meaning = match[3].trim();
      if (meaning && !meaning.match(/^[A-F\d,\s]+$/) && meaning.length > 1) {
        vocab = {
          word: match[1].trim(),
          pos: match[2] ? match[2].trim() : '',
          meaning: meaning,
          ipa: '',
          format: 'grade9-escaped',
        };
        this.log(`  [Grade9-Escaped] ${vocab.word}`);
        return vocab;
      }
    }

    // Try simple bullet format: - word (pos): meaning
    match = trimmed.match(PATTERNS.BULLET_POS);
    if (match) {
      vocab = {
        word: match[1].trim(),
        pos: match[2].trim(),
        meaning: match[3].trim(),
        ipa: '',
        format: 'bullet-pos',
      };
      this.log(`  [Bullet-POS] ${vocab.word}`);
      return vocab;
    }

    // Try Grade 7-8 format without IPA (less specific, try last)
    match = trimmed.match(PATTERNS.GRADE_7_8_NO_IPA);
    if (match && match[4] && !match[4].includes('trang') && !match[4].includes('Bài')) {
      // Skip if it looks like an exercise reference
      if (/^\d+$/.test(match[4].trim())) return null;
      if (match[4].includes('→') || match[4].includes('=')) return null;

      vocab = {
        word: match[2].trim(),
        pos: match[3] ? match[3].trim() : '',
        meaning: match[4].trim(),
        ipa: '',
        format: 'grade7-8-no-ipa',
      };
      // Only accept if meaning looks valid (not just numbers or exercise markers)
      if (vocab.meaning.length > 1 && !/^[A-F\d\s,]+$/.test(vocab.meaning)) {
        this.log(`  [Grade7-8-NoIPA] ${vocab.word}`);
        return vocab;
      }
    }

    return null;
  }

  /**
   * Parse vocabulary from file content
   */
  parseContent(content, fileInfo = {}) {
    const lines = content.split('\n');
    const vocabItems = [];
    let inVocabSection = false;
    let currentExample = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Detect vocabulary section start
      if (lowerLine.includes('vocabulary') || lowerLine.includes('từ vựng')) {
        inVocabSection = true;
        this.log(`Found vocab section at line ${i + 1}`);
        continue;
      }

      // Detect vocabulary section end (next major section)
      if (inVocabSection && /^(#{1,3}|\*\*Bài|\*\*Tập|----)/.test(line.trim())) {
        if (!lowerLine.includes('vocabulary') && !lowerLine.includes('từ vựng')) {
          // Check if this is just a sub-section
          if (/^\*\*[A-Z]/.test(line.trim()) && !line.includes('Bài')) {
            continue; // Skip, might be vocabulary category
          }
          inVocabSection = false;
          this.log(`End vocab section at line ${i + 1}`);
        }
      }

      // Try to parse vocabulary
      const vocab = this.parseLine(line, { lineNum: i + 1, ...fileInfo });
      if (vocab) {
        // Check for example on next line (Grade 10+ format)
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.startsWith('-') && !nextLine.match(/^\d+\./)) {
            const exampleMatch = nextLine.match(/^-\s*(.+)/);
            if (exampleMatch && !exampleMatch[1].startsWith('*')) {
              vocab.example = exampleMatch[1].trim();
            }
          }
        }

        vocabItems.push({
          ...vocab,
          source: fileInfo.filename || 'unknown',
          grade: fileInfo.grade,
          unit: fileInfo.unit,
          lesson: fileInfo.lesson,
        });
      }
    }

    return vocabItems;
  }

  /**
   * Parse a markdown file
   */
  parseFile(filePath) {
    this.log(`\nParsing: ${filePath}`);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath);

      // Extract grade, unit, lesson from filename
      const fileInfo = this.extractFileInfo(filePath);

      const vocabItems = this.parseContent(content, fileInfo);

      this.stats.filesProcessed++;
      this.stats.wordsFound += vocabItems.length;

      this.log(`  Found ${vocabItems.length} vocabulary items`);

      return vocabItems;
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      this.stats.parseErrors++;
      console.error(`Error parsing ${filePath}: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract grade, unit, lesson info from filepath
   */
  extractFileInfo(filePath) {
    const filename = path.basename(filePath, '.md');
    const dirPath = path.dirname(filePath);

    let grade = null;
    let unit = null;
    let lesson = null;

    // Try to extract from directory name (g6, g7, g8, g10, g11, formatg6)
    const dirMatch = dirPath.match(/(?:format)?g(\d+)/i);
    if (dirMatch) {
      grade = parseInt(dirMatch[1], 10);
    }

    // Try to extract from filename
    const gradeMatch = filename.match(/(?:grade-?|g)(\d+)/i);
    if (gradeMatch) {
      grade = parseInt(gradeMatch[1], 10);
    }

    const unitMatch = filename.match(/(?:unit-?|u)(\d+)/i);
    if (unitMatch) {
      unit = parseInt(unitMatch[1], 10);
    }

    // Extract lesson type
    const lessonTypes = ['getting-started', 'a-closer-look', 'communication', 'skills', 'looking-back', 'reading', 'listening', 'speaking', 'writing', 'language'];
    for (const type of lessonTypes) {
      if (filename.toLowerCase().includes(type.replace('-', ''))) {
        lesson = type;
        break;
      }
    }

    return { filename, grade, unit, lesson };
  }

  /**
   * Parse all files in a directory
   */
  parseDirectory(dirPath, recursive = true) {
    const allVocab = [];

    const processDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && recursive) {
          processDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          // Skip translation files
          if (entry.name.includes('.translation.')) continue;

          const vocabItems = this.parseFile(fullPath);
          allVocab.push(...vocabItems);
        }
      }
    };

    processDir(dirPath);
    return allVocab;
  }

  /**
   * Deduplicate vocabulary items
   */
  deduplicateVocab(vocabItems) {
    const seen = new Map();

    for (const item of vocabItems) {
      const key = `${item.word.toLowerCase()}-${item.meaning}`;
      if (!seen.has(key)) {
        seen.set(key, item);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Group vocabulary by grade and unit
   */
  groupByGradeUnit(vocabItems) {
    const grouped = {};

    for (const item of vocabItems) {
      const key = `g${item.grade}-u${item.unit}`;
      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          grade: item.grade,
          unit: item.unit,
          title: `Grade ${item.grade} - Unit ${item.unit}`,
          items: [],
          _seen: new Set(), // Track seen words within group
        };
      }

      // Deduplicate within group by word (case-insensitive)
      const wordKey = item.word.toLowerCase().trim();
      if (!grouped[key]._seen.has(wordKey)) {
        grouped[key].items.push(item);
        grouped[key]._seen.add(wordKey);
      }
    }

    // Remove internal tracking set
    for (const set of Object.values(grouped)) {
      delete set._seen;
    }

    return grouped;
  }
}

// ============================================================
// TEST CASES
// ============================================================

function runTests() {
  console.log('Running vocabulary parser tests...\n');

  const parser = new VocabularyParser({ verbose: false });
  let passed = 0;
  let failed = 0;

  const testCases = [
    // Grade 6 format
    {
      name: 'Grade 6 - basic',
      input: '1. loud: (adj) lớn tiếng /laʊd/',
      expected: { word: 'loud', pos: 'adj', meaning: 'lớn tiếng', ipa: '/laʊd/' },
    },
    {
      name: 'Grade 6 - with Vietnamese approx',
      input: '6. ready: (adj) sẵn sàng /ˈrɛd.i/ /ré đi/',
      expected: { word: 'ready', pos: 'adj', meaning: 'sẵn sàng', ipa: '/ˈrɛd.i/' },
    },
    // Grade 7-8 format
    {
      name: 'Grade 7-8 - basic',
      input: '1. hobby : (n) sở thích /ˈhɒbi/',
      expected: { word: 'hobby', pos: 'n', meaning: 'sở thích', ipa: '/ˈhɒbi/' },
    },
    {
      name: 'Grade 7-8 - compound word',
      input: '2. knitting kit : (n) bộ đan len /ˈnɪtɪŋ kɪt/',
      expected: { word: 'knitting kit', pos: 'n', meaning: 'bộ đan len', ipa: '/ˈnɪtɪŋ kɪt/' },
    },
    {
      name: 'Grade 7-8 - phrase',
      input: '9. hang out with friends : (v) đi chơi với bạn bè /hæŋ aʊt wɪð frɛndz/',
      expected: { word: 'hang out with friends', pos: 'v', meaning: 'đi chơi với bạn bè' },
    },
    // Grade 10+ format
    {
      name: 'Grade 10+ - basic',
      input: '1. **volunteering activities** /ˌvɒlənˈtɪərɪŋ ækˈtɪvɪtiz/ (n.phr): hoạt động tình nguyện',
      expected: { word: 'volunteering activities', pos: 'n.phr', meaning: 'hoạt động tình nguyện' },
    },
    {
      name: 'Grade 10+ - phrasal verb',
      input: '8. **get involved** /gɛt ɪnˈvɒlvd/ (v.phr): tham gia = join /ʤɔɪn/ = take part in',
      expected: { word: 'get involved', pos: 'v.phr' },
    },
    // Grade 11 summary format
    {
      name: 'Grade 11 summary - basic',
      input: '- **self-confidence** (n): tự tin',
      expected: { word: 'self-confidence', pos: 'n', meaning: 'tự tin' },
    },
    {
      name: 'Grade 11 summary - no pos',
      input: '- **earning trust**: giành được sự tin tưởng',
      expected: { word: 'earning trust', meaning: 'giành được sự tin tưởng' },
    },
    // Edge cases - should NOT parse
    {
      name: 'Skip exercise reference',
      input: '**Bài 2 trang 9**',
      expected: null,
    },
    {
      name: 'Skip answer line',
      input: '1-F',
      expected: null,
    },
    {
      name: 'Skip table header',
      input: '| :---- | :---- |',
      expected: null,
    },
  ];

  for (const tc of testCases) {
    const result = parser.parseLine(tc.input);

    if (tc.expected === null) {
      if (result === null) {
        console.log(`✓ ${tc.name}`);
        passed++;
      } else {
        console.log(`✗ ${tc.name}`);
        console.log(`  Expected: null`);
        console.log(`  Got: ${JSON.stringify(result)}`);
        failed++;
      }
    } else if (result === null) {
      console.log(`✗ ${tc.name}`);
      console.log(`  Expected: ${JSON.stringify(tc.expected)}`);
      console.log(`  Got: null`);
      failed++;
    } else {
      let match = true;
      for (const key of Object.keys(tc.expected)) {
        if (result[key] !== tc.expected[key]) {
          match = false;
          break;
        }
      }

      if (match) {
        console.log(`✓ ${tc.name}`);
        passed++;
      } else {
        console.log(`✗ ${tc.name}`);
        console.log(`  Expected: ${JSON.stringify(tc.expected)}`);
        console.log(`  Got: ${JSON.stringify(result)}`);
        failed++;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Tests: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);
  console.log(`========================================\n`);

  return failed === 0;
}

// ============================================================
// MAIN
// ============================================================

function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const options = {
    input: null,
    output: null,
    test: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--test':
      case '-t':
        options.test = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--input':
      case '-i':
        options.input = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Vocabulary Parser - Extract vocabulary from markdown files

Usage: node parse-vocabulary.js [options]

Options:
  --input, -i   Input file or directory (default: ../../../markdown-files)
  --output, -o  Output JSON file (default: ../js/data/vocabulary-extracted.js)
  --test, -t    Run tests only
  --verbose, -v Verbose output
  --help, -h    Show this help

Examples:
  node parse-vocabulary.js --test
  node parse-vocabulary.js -i ../../../markdown-files/g8 -o vocab-g8.json -v
  node parse-vocabulary.js -i ../../../markdown-files -o all-vocab.js
`);
        process.exit(0);
    }
  }

  // Run tests if requested
  if (options.test) {
    const success = runTests();
    process.exit(success ? 0 : 1);
  }

  // Set defaults
  const scriptDir = __dirname;
  const defaultInput = path.join(scriptDir, '..', '..', '..', 'markdown-files');
  const defaultOutput = path.join(scriptDir, '..', 'js', 'data', 'vocabulary-extracted.js');

  options.input = options.input || defaultInput;
  options.output = options.output || defaultOutput;

  console.log(`Vocabulary Parser`);
  console.log(`=================`);
  console.log(`Input: ${options.input}`);
  console.log(`Output: ${options.output}`);
  console.log(`Verbose: ${options.verbose}`);
  console.log();

  // Check input exists
  if (!fs.existsSync(options.input)) {
    console.error(`Error: Input path does not exist: ${options.input}`);
    process.exit(1);
  }

  // Parse vocabulary
  const parser = new VocabularyParser({ verbose: options.verbose });
  let allVocab = [];

  const stat = fs.statSync(options.input);
  if (stat.isDirectory()) {
    allVocab = parser.parseDirectory(options.input);
  } else {
    allVocab = parser.parseFile(options.input);
  }

  // Deduplicate and group
  const deduped = parser.deduplicateVocab(allVocab);
  const grouped = parser.groupByGradeUnit(deduped);

  // Generate output
  const outputDir = path.dirname(options.output);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate JavaScript file for browser use
  const jsContent = `/**
 * Extracted Vocabulary Data
 * Generated: ${new Date().toISOString()}
 * Files processed: ${parser.stats.filesProcessed}
 * Total words: ${parser.stats.wordsFound}
 * After deduplication: ${deduped.length}
 */

const EXTRACTED_VOCABULARY = ${JSON.stringify(grouped, null, 2)};

// Make available globally
if (typeof window !== 'undefined') {
  window.EXTRACTED_VOCABULARY = EXTRACTED_VOCABULARY;
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EXTRACTED_VOCABULARY;
}
`;

  fs.writeFileSync(options.output, jsContent);

  // Print summary
  console.log(`\n========================================`);
  console.log(`SUMMARY`);
  console.log(`========================================`);
  console.log(`Files processed: ${parser.stats.filesProcessed}`);
  console.log(`Total words found: ${parser.stats.wordsFound}`);
  console.log(`After deduplication: ${deduped.length}`);
  console.log(`Vocabulary sets: ${Object.keys(grouped).length}`);
  console.log(`Parse errors: ${parser.stats.parseErrors}`);
  console.log(`Output: ${options.output}`);
  console.log();

  // Print vocabulary sets
  console.log(`Vocabulary Sets:`);
  for (const [key, set] of Object.entries(grouped)) {
    console.log(`  ${key}: ${set.items.length} words`);
  }

  if (parser.errors.length > 0) {
    console.log(`\nErrors:`);
    for (const err of parser.errors) {
      console.log(`  ${err.file}: ${err.error}`);
    }
  }

  console.log(`\nDone!`);
}

// Run
main();
