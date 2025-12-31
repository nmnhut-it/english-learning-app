#!/usr/bin/env node
/**
 * Vocabulary Cleaner Script
 * Cleans extracted vocabulary data by removing markdown artifacts,
 * invalid entries, and normalizing data.
 *
 * Usage: node clean-vocabulary.js
 */

const fs = require('fs');
const path = require('path');

// Minimum word length for valid English vocabulary
const MIN_WORD_LENGTH = 2;
const MAX_WORD_LENGTH = 100;

// Words that should be filtered out (common function words, numbers, etc.)
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their',
  'this', 'that', 'these', 'those',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'and', 'or', 'but', 'if', 'so', 'yet', 'nor',
  'do', 'does', 'did', 'have', 'has', 'had',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'just', 'very', 'too', 'also', 'only', 'now', 'then', 'here', 'there',
  'oh', 'hi', 'hey', 'yes', 'no', 'ok', 'okay', 'hmm', 'wow', 'ah',
]);

// Patterns that indicate invalid entries
const INVALID_PATTERNS = [
  /^\/br\/$/i,                    // Just /br/
  /^\d+$/,                        // Just numbers
  /^[A-Z\s,]+$/,                  // All caps (headers)
  /^Câu hỏi/i,                    // Vietnamese section headers
  /^Thời gian/i,
  /^Bài \d+/i,
  /^Unit \d+/i,
  /^\\</,                         // Escaped HTML
  /^[<>]/,                        // HTML tags
  /^\*+$/,                        // Just asterisks
  /^-+$/,                         // Just dashes
  /^_+$/,                         // Just underscores
  /^\d{4}$/,                      // Years
  /^(1[0-2]|[1-9])$/,             // Single/double digit numbers
];

/**
 * Clean markdown from text
 */
function cleanMarkdown(text) {
  if (!text) return '';

  return text
    .replace(/\*\*/g, '')           // Remove bold markers
    .replace(/\*/g, '')             // Remove italic markers
    .replace(/_([^_]+)_/g, '$1')    // Remove underline markers
    .replace(/`([^`]+)`/g, '$1')    // Remove code markers
    .replace(/~~([^~]+)~~/g, '$1')  // Remove strikethrough
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove links
    .replace(/<[^>]+>/g, '')        // Remove HTML tags
    .replace(/\\([<>])/g, '$1')     // Unescape HTML brackets
    .trim();
}

/**
 * Clean IPA pronunciation
 */
function cleanIPA(ipa) {
  if (!ipa) return '';

  let cleaned = ipa.trim();

  // Remove surrounding slashes if duplicated
  cleaned = cleaned.replace(/^\/+/, '/').replace(/\/+$/, '/');

  // Ensure it starts and ends with /
  if (!cleaned.startsWith('/')) cleaned = '/' + cleaned;
  if (!cleaned.endsWith('/')) cleaned = cleaned + '/';

  // Remove empty IPA
  if (cleaned === '//') return '';

  return cleaned;
}

/**
 * Clean meaning/definition
 */
function cleanMeaning(meaning) {
  if (!meaning) return '';

  let cleaned = cleanMarkdown(meaning);

  // Remove leading patterns like "** (n)" or "(n)"
  cleaned = cleaned.replace(/^\*+\s*(\([^)]+\))?\s*/, '');

  // Remove IPA from meaning (sometimes mistakenly included)
  cleaned = cleaned.replace(/\/[^/]+\/\s*/g, '');

  // Remove pos from meaning if at start
  cleaned = cleaned.replace(/^\([^)]+\)\s*/, '');

  return cleaned.trim();
}

/**
 * Validate if a word is a valid English vocabulary entry
 */
function isValidWord(word) {
  if (!word) return false;

  const cleaned = word.toLowerCase().trim();

  // Check length
  if (cleaned.length < MIN_WORD_LENGTH || cleaned.length > MAX_WORD_LENGTH) {
    return false;
  }

  // Check against invalid patterns
  for (const pattern of INVALID_PATTERNS) {
    if (pattern.test(word)) {
      return false;
    }
  }

  // Check if it's mostly non-letter characters
  const letterCount = (word.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < cleaned.length * 0.5) {
    return false;
  }

  // Check for Vietnamese words (basic check - words with diacritics)
  const viDiacritics = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  if (viDiacritics.test(word)) {
    return false;
  }

  return true;
}

/**
 * Check if entry is a stop word
 */
function isStopWord(word) {
  return STOP_WORDS.has(word.toLowerCase().trim());
}

/**
 * Clean a single vocabulary item
 */
function cleanVocabItem(item) {
  const cleaned = {
    word: cleanMarkdown(item.word),
    pos: cleanMarkdown(item.pos || ''),
    meaning: cleanMeaning(item.meaning),
    ipa: cleanIPA(item.ipa || ''),
    format: item.format,
    source: item.source,
    grade: item.grade,
    unit: item.unit,
    lesson: item.lesson,
  };

  // Additional word cleaning
  cleaned.word = cleaned.word
    .replace(/^\d+\.\s*/, '')       // Remove leading numbers
    .replace(/\s+/g, ' ')           // Normalize spaces
    .trim();

  return cleaned;
}

/**
 * Process all vocabulary data
 */
function cleanVocabulary(inputPath, outputPath) {
  console.log('Vocabulary Cleaner');
  console.log('==================');
  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log();

  // Read input file
  const content = fs.readFileSync(inputPath, 'utf-8');

  // Extract the JSON object from the JS file
  const match = content.match(/const EXTRACTED_VOCABULARY = ({[\s\S]*?});/);
  if (!match) {
    console.error('Could not find EXTRACTED_VOCABULARY in input file');
    process.exit(1);
  }

  const vocabulary = JSON.parse(match[1]);

  const stats = {
    totalBefore: 0,
    totalAfter: 0,
    removed: {
      invalid: 0,
      stopWords: 0,
      duplicates: 0,
      noMeaning: 0,
      tooShort: 0,
    },
    cleaned: {
      markdown: 0,
      ipa: 0,
      meaning: 0,
    },
  };

  const cleanedVocabulary = {};

  for (const [setId, vocabSet] of Object.entries(vocabulary)) {
    const cleanedItems = [];
    const seenWords = new Set();

    for (const item of vocabSet.items) {
      stats.totalBefore++;

      // Clean the item
      const cleaned = cleanVocabItem(item);

      // Track if we cleaned markdown
      if (cleaned.word !== item.word && item.word.includes('**')) {
        stats.cleaned.markdown++;
      }

      // Validate word
      if (!isValidWord(cleaned.word)) {
        stats.removed.invalid++;
        continue;
      }

      // Skip stop words (but allow phrases containing them)
      if (isStopWord(cleaned.word) && !cleaned.word.includes(' ')) {
        stats.removed.stopWords++;
        continue;
      }

      // Check for meaningful meaning
      if (!cleaned.meaning || cleaned.meaning.length < 1) {
        stats.removed.noMeaning++;
        continue;
      }

      // Check word length again after cleaning
      if (cleaned.word.length < MIN_WORD_LENGTH) {
        stats.removed.tooShort++;
        continue;
      }

      // Deduplicate within set
      const wordKey = cleaned.word.toLowerCase();
      if (seenWords.has(wordKey)) {
        stats.removed.duplicates++;
        continue;
      }
      seenWords.add(wordKey);

      cleanedItems.push(cleaned);
      stats.totalAfter++;
    }

    if (cleanedItems.length > 0) {
      cleanedVocabulary[setId] = {
        id: setId,
        grade: vocabSet.grade,
        unit: vocabSet.unit,
        title: vocabSet.title,
        items: cleanedItems,
      };
    }
  }

  // Generate output
  const jsContent = `/**
 * Cleaned Vocabulary Data
 * Generated: ${new Date().toISOString()}
 * Total vocabulary sets: ${Object.keys(cleanedVocabulary).length}
 * Total words: ${stats.totalAfter}
 */

const EXTRACTED_VOCABULARY = ${JSON.stringify(cleanedVocabulary, null, 2)};

// Make available globally
if (typeof window !== 'undefined') {
  window.EXTRACTED_VOCABULARY = EXTRACTED_VOCABULARY;
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EXTRACTED_VOCABULARY;
}
`;

  fs.writeFileSync(outputPath, jsContent);

  // Print summary
  console.log('CLEANING SUMMARY');
  console.log('================');
  console.log(`Total before: ${stats.totalBefore}`);
  console.log(`Total after: ${stats.totalAfter}`);
  console.log(`Removed: ${stats.totalBefore - stats.totalAfter}`);
  console.log();
  console.log('Removal reasons:');
  console.log(`  Invalid patterns: ${stats.removed.invalid}`);
  console.log(`  Stop words: ${stats.removed.stopWords}`);
  console.log(`  No meaning: ${stats.removed.noMeaning}`);
  console.log(`  Too short: ${stats.removed.tooShort}`);
  console.log(`  Duplicates: ${stats.removed.duplicates}`);
  console.log();
  console.log('Cleaned:');
  console.log(`  Markdown removed: ${stats.cleaned.markdown}`);
  console.log();
  console.log(`Vocabulary sets: ${Object.keys(cleanedVocabulary).length}`);

  // Print per-set stats
  console.log('\nVocabulary sets:');
  for (const [setId, set] of Object.entries(cleanedVocabulary)) {
    console.log(`  ${setId}: ${set.items.length} words`);
  }

  console.log(`\nOutput written to: ${outputPath}`);
  console.log('Done!');
}

// Main
const scriptDir = __dirname;
const inputPath = path.join(scriptDir, '..', 'js', 'data', 'vocabulary-extracted.js');
const outputPath = path.join(scriptDir, '..', 'js', 'data', 'vocabulary-extracted.js');

cleanVocabulary(inputPath, outputPath);
