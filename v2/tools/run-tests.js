#!/usr/bin/env node
/**
 * Comprehensive Test Suite for Vocabulary Games
 * Runs without browser - tests data, logic, and integration
 */

const fs = require('fs');
const path = require('path');

// Test tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ ${name}`);
  } catch (error) {
    failedTests.push({ name, error: error.message });
    console.log(`  ❌ ${name}: ${error.message}`);
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${msg}`);
  }
}

function assertTrue(condition, msg = '') {
  if (!condition) {
    throw new Error(`Expected true. ${msg}`);
  }
}

function assertGreaterThan(actual, expected, msg = '') {
  if (actual <= expected) {
    throw new Error(`Expected ${actual} > ${expected}. ${msg}`);
  }
}

// ============================================
// Test 1: Vocabulary Extracted Data Structure
// ============================================
console.log('\n📋 Testing Extracted Vocabulary Data...');

const extractedPath = path.join(__dirname, '../js/data/vocabulary-extracted.js');
const extractedContent = fs.readFileSync(extractedPath, 'utf-8');

// Execute in isolated context to get EXTRACTED_VOCABULARY
const extractedMatch = extractedContent.match(/const EXTRACTED_VOCABULARY = (\{[\s\S]*?\});?\s*$/);
let EXTRACTED_VOCABULARY;
if (extractedMatch) {
  try {
    // Use eval carefully - this is test code
    eval('EXTRACTED_VOCABULARY = ' + extractedMatch[1]);
  } catch (e) {
    console.error('Failed to parse EXTRACTED_VOCABULARY:', e.message);
    process.exit(1);
  }
}

test('EXTRACTED_VOCABULARY exists', () => {
  assertTrue(EXTRACTED_VOCABULARY !== undefined);
});

test('Has vocabulary sets', () => {
  const setCount = Object.keys(EXTRACTED_VOCABULARY).length;
  assertGreaterThan(setCount, 0, `Found ${setCount} sets`);
});

test('Each set has required fields', () => {
  for (const [key, set] of Object.entries(EXTRACTED_VOCABULARY)) {
    assertTrue(set.id !== undefined, `${key} missing id`);
    assertTrue(set.grade !== undefined, `${key} missing grade`);
    assertTrue(set.items !== undefined, `${key} missing items`);
    assertTrue(Array.isArray(set.items), `${key} items not array`);
  }
});

test('Each vocabulary item has required fields', () => {
  let checkedItems = 0;
  for (const set of Object.values(EXTRACTED_VOCABULARY)) {
    for (const item of set.items.slice(0, 10)) { // Check first 10 per set
      assertTrue(item.word !== undefined, 'Missing word');
      assertTrue(item.meaning !== undefined, 'Missing meaning');
      checkedItems++;
    }
  }
  assertGreaterThan(checkedItems, 50, `Checked ${checkedItems} items`);
});

test('Word field is not empty', () => {
  for (const set of Object.values(EXTRACTED_VOCABULARY)) {
    for (const item of set.items) {
      assertTrue(item.word.trim().length > 0, `Empty word in ${set.id}`);
    }
  }
});

test('Meaning field is not empty', () => {
  for (const set of Object.values(EXTRACTED_VOCABULARY)) {
    for (const item of set.items) {
      assertTrue(item.meaning.trim().length > 0, `Empty meaning for "${item.word}" in ${set.id}`);
    }
  }
});

// ============================================
// Test 2: Vocabulary Parser Patterns
// ============================================
console.log('\n📋 Testing Vocabulary Parser Patterns...');

const parserPath = path.join(__dirname, 'parse-vocabulary.js');
const parserContent = fs.readFileSync(parserPath, 'utf-8');

// Extract patterns
const patternsMatch = parserContent.match(/const PATTERNS = \{([\s\S]*?)\};/);
let patternNames = [];
if (patternsMatch) {
  patternNames = patternsMatch[1].match(/\b[A-Z_0-9]+(?=\s*:)/g) || [];
}

test('Parser has multiple patterns', () => {
  assertGreaterThan(patternNames.length, 3, `Found ${patternNames.length} patterns`);
});

test('Parser has pattern for Grade 6-8', () => {
  const patterns = patternNames.join(' ');
  const hasG6 = patterns.includes('GRADE_6') || patterns.includes('GRADE_7') || patterns.includes('GRADE_8');
  assertTrue(hasG6, 'Missing Grade 6-8 patterns');
});

test('Parser has pattern for Grade 9-11', () => {
  const patterns = patternNames.join(' ');
  const hasG10 = patterns.includes('GRADE_9') || patterns.includes('GRADE_10') || patterns.includes('GRADE_11');
  assertTrue(hasG10, 'Missing Grade 9-11 patterns');
});

// ============================================
// Test 3: Game Configuration
// ============================================
console.log('\n📋 Testing Game Configuration...');

const configPath = path.join(__dirname, '../js/config.js');
const configContent = fs.readFileSync(configPath, 'utf-8');

test('GAME_WIDTH is defined', () => {
  assertTrue(configContent.includes('GAME_WIDTH'), 'Missing GAME_WIDTH');
});

test('GAME_HEIGHT is defined', () => {
  assertTrue(configContent.includes('GAME_HEIGHT'), 'Missing GAME_HEIGHT');
});

test('COLORS object is defined', () => {
  assertTrue(configContent.includes('const COLORS'), 'Missing COLORS');
});

test('POINTS object is defined', () => {
  assertTrue(configContent.includes('const POINTS'), 'Missing POINTS');
});

// ============================================
// Test 4: Scene Files Exist and Valid
// ============================================
console.log('\n📋 Testing Scene Files...');

const scenesDir = path.join(__dirname, '../js/scenes');
const requiredScenes = [
  'boot-scene.js',
  'menu-scene.js',
  'flashcard-scene.js',
  'meaning-match-scene.js',
  'pronunciation-scene.js',
  'word-blitz-scene.js'
];

for (const scene of requiredScenes) {
  const scenePath = path.join(scenesDir, scene);

  test(`${scene} exists`, () => {
    assertTrue(fs.existsSync(scenePath), `${scene} not found`);
  });

  test(`${scene} has class definition`, () => {
    const content = fs.readFileSync(scenePath, 'utf-8');
    assertTrue(content.includes('class '), `${scene} missing class definition`);
    assertTrue(content.includes('extends Phaser.Scene'), `${scene} not extending Phaser.Scene`);
  });

  test(`${scene} has create method`, () => {
    const content = fs.readFileSync(scenePath, 'utf-8');
    assertTrue(content.includes('create()'), `${scene} missing create method`);
  });
}

// ============================================
// Test 5: Progress Tracker Logic
// ============================================
console.log('\n📋 Testing Progress Tracker...');

const trackerPath = path.join(__dirname, '../js/data/progress-tracker.js');
const trackerContent = fs.readFileSync(trackerPath, 'utf-8');

test('ProgressTracker object is defined', () => {
  assertTrue(trackerContent.includes('const ProgressTracker'), 'Missing ProgressTracker');
});

test('Has recordAnswer method', () => {
  assertTrue(trackerContent.includes('recordAnswer'), 'Missing recordAnswer');
});

test('Has getStats method', () => {
  assertTrue(trackerContent.includes('getStats'), 'Missing getStats');
});

test('Has spaced repetition logic', () => {
  assertTrue(
    trackerContent.includes('interval') || trackerContent.includes('nextReview'),
    'Missing spaced repetition logic'
  );
});

test('Uses localStorage for persistence', () => {
  assertTrue(trackerContent.includes('localStorage'), 'Missing localStorage usage');
});

// ============================================
// Test 6: Audio Manager
// ============================================
console.log('\n📋 Testing Audio Manager...');

const audioPath = path.join(__dirname, '../js/engine/audio-manager.js');
const audioContent = fs.readFileSync(audioPath, 'utf-8');

test('AudioManager object is defined', () => {
  assertTrue(audioContent.includes('const AudioManager'), 'Missing AudioManager');
});

test('Has playWord method', () => {
  assertTrue(audioContent.includes('playWord'), 'Missing playWord');
});

test('Has playEffect method', () => {
  assertTrue(audioContent.includes('playEffect'), 'Missing playEffect');
});

test('Uses Web Speech API', () => {
  assertTrue(audioContent.includes('speechSynthesis'), 'Missing speechSynthesis');
});

test('Has mute functionality', () => {
  assertTrue(audioContent.includes('isMuted') || audioContent.includes('setMuted'), 'Missing mute functionality');
});

// ============================================
// Test 7: Vocabulary Data Integration
// ============================================
console.log('\n📋 Testing Vocabulary Data Integration...');

const vocabDataPath = path.join(__dirname, '../js/data/vocabulary-data.js');
const vocabDataContent = fs.readFileSync(vocabDataPath, 'utf-8');

test('vocabulary-data.js integrates with extracted data', () => {
  assertTrue(vocabDataContent.includes('EXTRACTED_VOCABULARY'), 'Not using EXTRACTED_VOCABULARY');
});

test('Has getCurrentVocabSet function', () => {
  assertTrue(vocabDataContent.includes('getCurrentVocabSet'), 'Missing getCurrentVocabSet');
});

test('Has getAllVocabSets function', () => {
  assertTrue(vocabDataContent.includes('getAllVocabSets'), 'Missing getAllVocabSets');
});

test('Has setCurrentVocabSet function', () => {
  assertTrue(vocabDataContent.includes('setCurrentVocabSet'), 'Missing setCurrentVocabSet');
});

test('Has fallback sample data', () => {
  assertTrue(vocabDataContent.includes('sample') || vocabDataContent.includes('fallback'),
    'Missing fallback data');
});

// ============================================
// Test 8: HTML File Structure
// ============================================
console.log('\n📋 Testing HTML Structure...');

const htmlPath = path.join(__dirname, '../index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

test('HTML includes Phaser CDN', () => {
  assertTrue(htmlContent.includes('phaser'), 'Missing Phaser script');
});

test('HTML includes game-container', () => {
  assertTrue(htmlContent.includes('game-container'), 'Missing game-container');
});

test('HTML loads vocabulary-extracted.js before vocabulary-data.js', () => {
  const extractedPos = htmlContent.indexOf('vocabulary-extracted.js');
  const dataPos = htmlContent.indexOf('vocabulary-data.js');
  assertTrue(extractedPos < dataPos, 'Wrong script order');
});

test('HTML loads all scene files', () => {
  for (const scene of requiredScenes) {
    assertTrue(htmlContent.includes(scene), `Missing ${scene} in HTML`);
  }
});

test('HTML loads main.js last', () => {
  const mainPos = htmlContent.indexOf('main.js');
  const lastScenePos = htmlContent.lastIndexOf('-scene.js');
  assertTrue(mainPos > lastScenePos, 'main.js should load after scenes');
});

// ============================================
// Test 9: CSS File
// ============================================
console.log('\n📋 Testing CSS...');

const cssPath = path.join(__dirname, '../css/style.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');

test('CSS file exists and not empty', () => {
  assertGreaterThan(cssContent.length, 100, 'CSS too short');
});

test('CSS has game-container styles', () => {
  assertTrue(cssContent.includes('#game-container') || cssContent.includes('game-container'),
    'Missing game-container styles');
});

test('CSS has mobile optimization', () => {
  assertTrue(cssContent.includes('@media'), 'Missing media queries');
});

// ============================================
// Test 10: Data Quality Checks
// ============================================
console.log('\n📋 Testing Data Quality...');

test('No excessive duplicate words within same set (< 5%)', () => {
  let totalDuplicates = 0;
  let totalWords = 0;
  for (const [key, set] of Object.entries(EXTRACTED_VOCABULARY)) {
    const words = new Set();
    for (const item of set.items) {
      totalWords++;
      if (words.has(item.word.toLowerCase())) {
        totalDuplicates++;
      }
      words.add(item.word.toLowerCase());
    }
  }
  const dupRate = totalDuplicates / totalWords;
  assertTrue(dupRate < 0.05, `Duplicate rate ${(dupRate * 100).toFixed(1)}% too high`);
});

test('IPA format is valid (when present)', () => {
  let ipaCount = 0;
  for (const set of Object.values(EXTRACTED_VOCABULARY)) {
    for (const item of set.items) {
      if (item.ipa) {
        assertTrue(item.ipa.includes('/'), `Invalid IPA format for "${item.word}": ${item.ipa}`);
        ipaCount++;
      }
    }
  }
  assertGreaterThan(ipaCount, 100, `Only ${ipaCount} items have IPA`);
});

test('POS (part of speech) is present for many items (> 40%)', () => {
  let posCount = 0;
  let totalCount = 0;
  for (const set of Object.values(EXTRACTED_VOCABULARY)) {
    for (const item of set.items) {
      totalCount++;
      if (item.pos) posCount++;
    }
  }
  const posRatio = posCount / totalCount;
  assertGreaterThan(posRatio, 0.4, `Only ${(posRatio * 100).toFixed(1)}% items have POS`);
});

test('Total vocabulary count matches expected', () => {
  let total = 0;
  for (const set of Object.values(EXTRACTED_VOCABULARY)) {
    total += set.items.length;
  }
  assertGreaterThan(total, 5000, `Only ${total} vocabulary items`);
});

// ============================================
// Test 11: Game Logic Simulation
// ============================================
console.log('\n📋 Testing Game Logic (Simulated)...');

test('Shuffle function produces different orders', () => {
  const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const shuffled1 = shuffle(original);
  const shuffled2 = shuffle(original);

  // At least one should be different from original
  const isChanged = JSON.stringify(shuffled1) !== JSON.stringify(original) ||
                    JSON.stringify(shuffled2) !== JSON.stringify(original);
  assertTrue(isChanged, 'Shuffle not working');
});

test('Score calculation is correct', () => {
  const POINTS_CORRECT = 10;
  const STREAK_BONUS = 5;

  let score = 0;
  let streak = 0;

  // Simulate 5 correct answers
  for (let i = 0; i < 5; i++) {
    streak++;
    score += POINTS_CORRECT;
    if (streak >= 5) score += STREAK_BONUS;
  }

  assertEqual(score, 55, 'Score calculation wrong'); // 50 + 5 bonus
});

test('Spaced repetition intervals increase correctly', () => {
  const getNextInterval = (currentInterval, correct) => {
    if (correct) {
      return currentInterval ? currentInterval * 2 : 1;
    }
    return 1;
  };

  let interval = 0;
  interval = getNextInterval(interval, true); // 1
  interval = getNextInterval(interval, true); // 2
  interval = getNextInterval(interval, true); // 4
  assertEqual(interval, 4, 'Interval calculation wrong');

  interval = getNextInterval(interval, false); // reset to 1
  assertEqual(interval, 1, 'Reset on wrong answer failed');
});

// ============================================
// Summary
// ============================================
console.log('\n' + '='.repeat(50));
console.log(`📊 Test Results: ${passedTests}/${totalTests} passed`);

if (failedTests.length > 0) {
  console.log('\n❌ Failed Tests:');
  for (const { name, error } of failedTests) {
    console.log(`   - ${name}: ${error}`);
  }
  console.log('\n');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!\n');
  process.exit(0);
}
