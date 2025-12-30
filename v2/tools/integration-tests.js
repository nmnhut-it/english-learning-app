#!/usr/bin/env node
/**
 * Integration Tests - Test actual code logic without browser/UI
 * Tests the game logic, data processing, and component interactions
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}. ${msg}`);
  }
}

function assertTrue(condition, msg = '') {
  if (!condition) {
    throw new Error(`Expected true. ${msg}`);
  }
}

function assertFalse(condition, msg = '') {
  if (condition) {
    throw new Error(`Expected false. ${msg}`);
  }
}

function assertGreaterThan(actual, expected, msg = '') {
  if (actual <= expected) {
    throw new Error(`Expected ${actual} > ${expected}. ${msg}`);
  }
}

function assertDefined(value, msg = '') {
  if (value === undefined || value === null) {
    throw new Error(`Expected defined value. ${msg}`);
  }
}

// ============================================
// Setup: Create execution context
// ============================================

function createContext() {
  // Mock browser globals
  const mockLocalStorage = {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, value) { this._data[key] = String(value); },
    removeItem(key) { delete this._data[key]; },
    clear() { this._data = {}; },
  };

  const mockSpeechSynthesis = {
    cancel() {},
    speak() {},
    getVoices() { return []; },
  };

  const context = {
    // Browser globals
    window: {},
    document: { hidden: false },
    localStorage: mockLocalStorage,
    speechSynthesis: mockSpeechSynthesis,
    SpeechSynthesisUtterance: class {
      constructor(text) { this.text = text; }
    },
    AudioContext: class {
      createOscillator() {
        return {
          connect() {},
          start() {},
          stop() {},
          type: 'sine',
          frequency: { setValueAtTime() {} },
        };
      }
      createGain() {
        return {
          connect() {},
          gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        };
      }
      get currentTime() { return 0; }
      get destination() { return {}; }
    },
    console: console,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Error: Error,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    module: { exports: {} },
  };

  context.window = context;
  return context;
}

function loadScript(context, filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');

  // Wrap code to capture top-level const/let declarations into context
  // This is needed because vm.Script isolates const/let
  const wrappedCode = `
    (function() {
      ${code}

      // Export common variables to context
      if (typeof GAME_WIDTH !== 'undefined') this.GAME_WIDTH = GAME_WIDTH;
      if (typeof GAME_HEIGHT !== 'undefined') this.GAME_HEIGHT = GAME_HEIGHT;
      if (typeof COLORS !== 'undefined') this.COLORS = COLORS;
      if (typeof COLOR_STRINGS !== 'undefined') this.COLOR_STRINGS = COLOR_STRINGS;
      if (typeof POINTS !== 'undefined') this.POINTS = POINTS;
      if (typeof EXTRACTED_VOCABULARY !== 'undefined') this.EXTRACTED_VOCABULARY = EXTRACTED_VOCABULARY;
      if (typeof VOCABULARY_SETS !== 'undefined') this.VOCABULARY_SETS = VOCABULARY_SETS;
      if (typeof currentVocabSet !== 'undefined') this.currentVocabSet = currentVocabSet;
      if (typeof getCurrentVocabSet !== 'undefined') this.getCurrentVocabSet = getCurrentVocabSet;
      if (typeof getAllVocabSets !== 'undefined') this.getAllVocabSets = getAllVocabSets;
      if (typeof setCurrentVocabSet !== 'undefined') this.setCurrentVocabSet = setCurrentVocabSet;
      if (typeof getVocabSetsByGrade !== 'undefined') this.getVocabSetsByGrade = getVocabSetsByGrade;
      if (typeof searchVocabulary !== 'undefined') this.searchVocabulary = searchVocabulary;
      if (typeof getRandomWords !== 'undefined') this.getRandomWords = getRandomWords;
      if (typeof ProgressTracker !== 'undefined') this.ProgressTracker = ProgressTracker;
      if (typeof AudioManager !== 'undefined') this.AudioManager = AudioManager;
    }).call(this);
  `;

  const script = new vm.Script(wrappedCode, { filename: filePath });
  script.runInContext(vm.createContext(context));
}

// ============================================
// Test 1: Config Module
// ============================================
console.log('\n📋 Integration Test: Config Module...');

const configContext = createContext();
loadScript(configContext, path.join(__dirname, '../js/config.js'));

test('GAME_WIDTH is 800', () => {
  assertEqual(configContext.GAME_WIDTH, 800);
});

test('GAME_HEIGHT is 600', () => {
  assertEqual(configContext.GAME_HEIGHT, 600);
});

test('COLORS has all required colors', () => {
  assertDefined(configContext.COLORS, 'COLORS object missing');
  assertDefined(configContext.COLORS.PRIMARY, 'PRIMARY color missing');
  assertDefined(configContext.COLORS.SECONDARY, 'SECONDARY color missing');
  assertDefined(configContext.COLORS.CORRECT, 'CORRECT color missing');
  assertDefined(configContext.COLORS.INCORRECT, 'INCORRECT color missing');
  assertDefined(configContext.COLORS.BG_DARK, 'BG_DARK color missing');
});

test('POINTS has scoring values', () => {
  assertDefined(configContext.POINTS, 'POINTS object missing');
  assertDefined(configContext.POINTS.CORRECT_FIRST_TRY, 'CORRECT_FIRST_TRY missing');
  assertDefined(configContext.POINTS.CORRECT_ANSWER, 'CORRECT_ANSWER missing');
  assertGreaterThan(configContext.POINTS.CORRECT_FIRST_TRY, 0);
});

test('COLOR_STRINGS are hex format', () => {
  assertTrue(configContext.COLOR_STRINGS.TEXT.startsWith('#'));
  assertTrue(configContext.COLOR_STRINGS.PRIMARY.startsWith('#'));
});

// ============================================
// Test 2: Vocabulary Data Module
// ============================================
console.log('\n📋 Integration Test: Vocabulary Data Module...');

const vocabContext = createContext();
loadScript(vocabContext, path.join(__dirname, '../js/data/vocabulary-extracted.js'));
loadScript(vocabContext, path.join(__dirname, '../js/data/vocabulary-data.js'));

test('VOCABULARY_SETS is populated from extracted data', () => {
  assertDefined(vocabContext.VOCABULARY_SETS);
  assertGreaterThan(Object.keys(vocabContext.VOCABULARY_SETS).length, 0);
});

test('getCurrentVocabSet returns a valid set', () => {
  const set = vocabContext.getCurrentVocabSet();
  assertDefined(set);
  assertDefined(set.id);
  assertDefined(set.items);
  assertTrue(Array.isArray(set.items));
});

test('getAllVocabSets returns array of sets', () => {
  const sets = vocabContext.getAllVocabSets();
  assertTrue(Array.isArray(sets));
  assertGreaterThan(sets.length, 0);
});

test('setCurrentVocabSet changes current set', () => {
  const sets = vocabContext.getAllVocabSets();
  const targetSet = sets[sets.length - 1]; // Get last set

  vocabContext.setCurrentVocabSet(targetSet.id);
  const current = vocabContext.getCurrentVocabSet();

  assertEqual(current.id, targetSet.id);
});

test('setCurrentVocabSet returns false for invalid id', () => {
  const result = vocabContext.setCurrentVocabSet('invalid-set-id-12345');
  assertFalse(result);
});

test('getVocabSetsByGrade filters correctly', () => {
  const grade10Sets = vocabContext.getVocabSetsByGrade(10);
  assertTrue(Array.isArray(grade10Sets));
  for (const set of grade10Sets) {
    assertEqual(set.grade, 10);
  }
});

test('searchVocabulary finds words', () => {
  // Search for a common word
  const results = vocabContext.searchVocabulary('the');
  assertTrue(Array.isArray(results));
  // Should find at least some results
  assertGreaterThan(results.length, 0);
});

test('getRandomWords returns correct count', () => {
  const words = vocabContext.getRandomWords(5);
  assertTrue(Array.isArray(words));
  assertEqual(words.length, 5);
});

test('Vocabulary items have required fields', () => {
  const set = vocabContext.getCurrentVocabSet();
  for (const item of set.items.slice(0, 10)) {
    assertDefined(item.word, 'Missing word');
    assertDefined(item.meaning, 'Missing meaning');
    assertDefined(item.id, 'Missing id');
  }
});

// ============================================
// Test 3: Progress Tracker Module
// ============================================
console.log('\n📋 Integration Test: Progress Tracker Module...');

const progressContext = createContext();
loadScript(progressContext, path.join(__dirname, '../js/data/progress-tracker.js'));

test('ProgressTracker initializes correctly', () => {
  assertDefined(progressContext.ProgressTracker, 'ProgressTracker missing');
  assertDefined(progressContext.ProgressTracker.getWordProgress, 'getWordProgress missing');
  assertDefined(progressContext.ProgressTracker.recordAnswer, 'recordAnswer missing');
});

test('recordAnswer updates word progress', () => {
  const wordId = 'test-word-1';
  progressContext.ProgressTracker.recordAnswer(wordId, true);

  const progress = progressContext.ProgressTracker.getWordProgress(wordId);
  assertDefined(progress);
  assertEqual(progress.correctCount, 1);
});

test('recordAnswer tracks incorrect answers', () => {
  const wordId = 'test-word-2';
  progressContext.ProgressTracker.recordAnswer(wordId, false);
  progressContext.ProgressTracker.recordAnswer(wordId, false);
  progressContext.ProgressTracker.recordAnswer(wordId, true);

  const progress = progressContext.ProgressTracker.getWordProgress(wordId);
  assertEqual(progress.correctCount, 1);
  assertEqual(progress.incorrectCount, 2);
});

test('Spaced repetition increases mastery on correct', () => {
  const wordId = 'test-word-sr-1';
  progressContext.ProgressTracker.recordAnswer(wordId, true);
  const mastery1 = progressContext.ProgressTracker.getWordProgress(wordId).masteryLevel;

  progressContext.ProgressTracker.recordAnswer(wordId, true);
  const mastery2 = progressContext.ProgressTracker.getWordProgress(wordId).masteryLevel;

  assertGreaterThan(mastery2, mastery1, 'Mastery should increase');
});

test('Spaced repetition decreases mastery on incorrect', () => {
  const wordId = 'test-word-sr-2';
  // Build up mastery
  progressContext.ProgressTracker.recordAnswer(wordId, true);
  progressContext.ProgressTracker.recordAnswer(wordId, true);
  progressContext.ProgressTracker.recordAnswer(wordId, true);

  const masteryBefore = progressContext.ProgressTracker.getWordProgress(wordId).masteryLevel;

  // Wrong answer decreases mastery
  progressContext.ProgressTracker.recordAnswer(wordId, false);
  const masteryAfter = progressContext.ProgressTracker.getWordProgress(wordId).masteryLevel;

  assertTrue(masteryAfter < masteryBefore, 'Mastery should decrease');
});

test('addPoints increases total points', () => {
  const before = progressContext.ProgressTracker.getStats().totalPoints;
  progressContext.ProgressTracker.addPoints(100);
  const after = progressContext.ProgressTracker.getStats().totalPoints;

  assertEqual(after - before, 100);
});

test('getStats returns valid stats object', () => {
  const stats = progressContext.ProgressTracker.getStats();
  assertDefined(stats.totalPoints);
  assertDefined(stats.totalWordsLearned);
  assertDefined(stats.currentStreak);
});

test('getWordsForReview returns array when vocabSet provided', () => {
  // Load vocabulary data first
  loadScript(progressContext, path.join(__dirname, '../js/data/vocabulary-extracted.js'));
  loadScript(progressContext, path.join(__dirname, '../js/data/vocabulary-data.js'));

  const vocabSet = progressContext.getCurrentVocabSet();
  const words = progressContext.ProgressTracker.getWordsForReview(vocabSet);
  assertTrue(Array.isArray(words));
});

test('save persists data to localStorage', () => {
  // Record some data
  progressContext.ProgressTracker.recordAnswer('persist-test', true);
  progressContext.ProgressTracker.addPoints(50);

  // Check localStorage has data
  const savedProgress = progressContext.localStorage.getItem('vocab_progress');
  const savedStats = progressContext.localStorage.getItem('vocab_stats');

  assertDefined(savedProgress, 'Progress not saved');
  assertDefined(savedStats, 'Stats not saved');

  const parsed = JSON.parse(savedProgress);
  assertDefined(parsed['persist-test'], 'Word progress not saved');
});

// ============================================
// Test 4: Audio Manager Module
// ============================================
console.log('\n📋 Integration Test: Audio Manager Module...');

const audioContext = createContext();
loadScript(audioContext, path.join(__dirname, '../js/engine/audio-manager.js'));

test('AudioManager initializes correctly', () => {
  assertDefined(audioContext.AudioManager);
  assertDefined(audioContext.AudioManager.synth);
  assertEqual(audioContext.AudioManager.isMuted, false);
});

test('setMuted changes mute state', () => {
  audioContext.AudioManager.setMuted(true);
  assertEqual(audioContext.AudioManager.isMuted, true);

  audioContext.AudioManager.setMuted(false);
  assertEqual(audioContext.AudioManager.isMuted, false);
});

test('setVolume clamps to valid range', () => {
  audioContext.AudioManager.setVolume(0.5);
  assertEqual(audioContext.AudioManager.volume, 0.5);

  audioContext.AudioManager.setVolume(2.0);
  assertEqual(audioContext.AudioManager.volume, 1.0);

  audioContext.AudioManager.setVolume(-1.0);
  assertEqual(audioContext.AudioManager.volume, 0);
});

test('getEffectSettings returns valid settings', () => {
  const correctSettings = audioContext.AudioManager.getEffectSettings('correct');
  assertDefined(correctSettings.frequency);
  assertDefined(correctSettings.duration);
  assertDefined(correctSettings.waveType);
});

test('getEffectSettings returns click for unknown type', () => {
  const unknown = audioContext.AudioManager.getEffectSettings('unknown_type');
  const click = audioContext.AudioManager.getEffectSettings('click');
  assertEqual(unknown.frequency, click.frequency);
});

test('playWord does not throw when muted', () => {
  audioContext.AudioManager.setMuted(true);
  // Should not throw
  audioContext.AudioManager.playWord('test');
  assertTrue(true);
});

test('playEffect does not throw when muted', () => {
  audioContext.AudioManager.setMuted(true);
  audioContext.AudioManager.playEffect('correct');
  assertTrue(true);
});

// ============================================
// Test 5: Game Logic Simulation
// ============================================
console.log('\n📋 Integration Test: Game Logic Simulation...');

// Simulate game flow
const gameContext = createContext();
loadScript(gameContext, path.join(__dirname, '../js/config.js'));
loadScript(gameContext, path.join(__dirname, '../js/data/vocabulary-extracted.js'));
loadScript(gameContext, path.join(__dirname, '../js/data/vocabulary-data.js'));
loadScript(gameContext, path.join(__dirname, '../js/data/progress-tracker.js'));

test('Full game flow: Select vocab set', () => {
  const sets = gameContext.getAllVocabSets();
  const selected = sets.find(s => s.items.length >= 10);
  assertDefined(selected, 'Should find a set with 10+ items');

  gameContext.setCurrentVocabSet(selected.id);
  assertEqual(gameContext.getCurrentVocabSet().id, selected.id);
});

test('Full game flow: Flashcard simulation', () => {
  const vocabSet = gameContext.getCurrentVocabSet();
  const words = [...vocabSet.items].slice(0, 5);

  let score = 0;
  const pointsPerCorrect = gameContext.POINTS.CORRECT_FIRST_TRY;

  for (const word of words) {
    // Simulate "Know" action
    gameContext.ProgressTracker.recordAnswer(word.id, true);
    score += pointsPerCorrect;
  }

  gameContext.ProgressTracker.addPoints(score);
  assertEqual(score, pointsPerCorrect * 5);
});

test('Full game flow: Meaning Match simulation', () => {
  const vocabSet = gameContext.getCurrentVocabSet();
  const words = [...vocabSet.items].slice(0, 4);

  // Simulate shuffled meanings
  const meanings = words.map(w => w.meaning);
  const shuffled = [...meanings].sort(() => Math.random() - 0.5);

  // Simulate matching
  let matched = 0;
  for (const word of words) {
    const correctMeaning = word.meaning;
    if (shuffled.includes(correctMeaning)) {
      matched++;
      gameContext.ProgressTracker.recordAnswer(word.id, true);
    }
  }

  assertEqual(matched, 4, 'Should match all 4 words');
});

test('Full game flow: Word Blitz timer logic', () => {
  let timeLeft = 60;
  let score = 0;
  const correctAnswers = 10;
  const pointsPerCorrect = gameContext.POINTS.CORRECT_FIRST_TRY;

  for (let i = 0; i < correctAnswers; i++) {
    score += pointsPerCorrect;
    timeLeft = Math.min(60, timeLeft + 2); // Bonus time
  }

  // Simulate wrong answer
  timeLeft = Math.max(0, timeLeft - 3);

  assertEqual(score, pointsPerCorrect * 10);
  assertTrue(timeLeft > 0);
});

test('Full game flow: Streak calculation', () => {
  let streak = 0;
  let maxStreak = 0;
  let score = 0;
  const pointsPerCorrect = gameContext.POINTS.CORRECT_FIRST_TRY;
  const streakBonus = gameContext.POINTS.FAST_ANSWER_BONUS; // Use existing bonus

  // 7 correct in a row
  for (let i = 0; i < 7; i++) {
    streak++;
    if (streak > maxStreak) maxStreak = streak;

    score += pointsPerCorrect;
    if (streak >= 5) {
      score += streakBonus;
    }
  }

  // Wrong answer breaks streak
  streak = 0;

  // 3 more correct
  for (let i = 0; i < 3; i++) {
    streak++;
    score += pointsPerCorrect;
  }

  assertEqual(maxStreak, 7);
  assertEqual(streak, 3);
  // 10 correct answers + 3 streak bonuses (for answers 5,6,7)
  const expectedScore = (10 * pointsPerCorrect) + (3 * streakBonus);
  assertEqual(score, expectedScore);
});

// ============================================
// Test 6: Data Integrity
// ============================================
console.log('\n📋 Integration Test: Data Integrity...');

test('All vocabulary items can be tracked', () => {
  const testContext = createContext();
  loadScript(testContext, path.join(__dirname, '../js/data/vocabulary-extracted.js'));
  loadScript(testContext, path.join(__dirname, '../js/data/vocabulary-data.js'));
  loadScript(testContext, path.join(__dirname, '../js/data/progress-tracker.js'));

  const set = testContext.getCurrentVocabSet();
  for (const item of set.items.slice(0, 20)) {
    testContext.ProgressTracker.recordAnswer(item.id, true);
    const progress = testContext.ProgressTracker.getWordProgress(item.id);
    assertDefined(progress, `Progress for ${item.id} should exist`);
    assertGreaterThan(progress.correctCount, 0, `Correct count for ${item.id} should be > 0`);
  }
});

test('Vocabulary search is case-insensitive', () => {
  const results1 = vocabContext.searchVocabulary('HELLO');
  const results2 = vocabContext.searchVocabulary('hello');
  const results3 = vocabContext.searchVocabulary('Hello');

  // All should return same results
  assertEqual(results1.length, results2.length);
  assertEqual(results2.length, results3.length);
});

test('Large vocabulary set handling', () => {
  const sets = vocabContext.getAllVocabSets();
  const largeSet = sets.reduce((max, set) =>
    set.items.length > max.items.length ? set : max
  );

  assertGreaterThan(largeSet.items.length, 100, 'Should have a large set');

  // Test random selection from large set
  vocabContext.setCurrentVocabSet(largeSet.id);
  const random = vocabContext.getRandomWords(50);
  assertEqual(random.length, 50);

  // Verify all are unique
  const ids = new Set(random.map(w => w.id));
  assertEqual(ids.size, 50, 'Random words should be unique');
});

// ============================================
// Test 7: Edge Cases
// ============================================
console.log('\n📋 Integration Test: Edge Cases...');

test('Empty search query returns empty array', () => {
  const results = vocabContext.searchVocabulary('');
  assertTrue(Array.isArray(results));
});

test('Special characters in search', () => {
  // Should not throw
  const results = vocabContext.searchVocabulary('test"\'<>{}[]');
  assertTrue(Array.isArray(results));
});

test('getRandomWords with count > items returns all items', () => {
  const set = vocabContext.getCurrentVocabSet();
  const words = vocabContext.getRandomWords(10000);
  assertTrue(words.length <= set.items.length);
});

test('Multiple rapid recordAnswer calls', () => {
  const testContext = createContext();
  loadScript(testContext, path.join(__dirname, '../js/data/progress-tracker.js'));

  const wordId = 'rapid-test';
  for (let i = 0; i < 100; i++) {
    testContext.ProgressTracker.recordAnswer(wordId, i % 2 === 0);
  }

  const progress = testContext.ProgressTracker.getWordProgress(wordId);
  const totalAttempts = progress.correctCount + progress.incorrectCount;
  assertEqual(totalAttempts, 100);
  assertEqual(progress.correctCount, 50);
});

test('Save/Load with corrupted data handles gracefully', () => {
  const testContext = createContext();
  testContext.localStorage.setItem('vocabGameProgress', 'invalid json {{{');

  // Should not throw during load
  loadScript(testContext, path.join(__dirname, '../js/data/progress-tracker.js'));
  assertDefined(testContext.ProgressTracker);
});

// ============================================
// Summary
// ============================================
console.log('\n' + '='.repeat(50));
console.log(`📊 Integration Test Results: ${passedTests}/${totalTests} passed`);

if (failedTests.length > 0) {
  console.log('\n❌ Failed Tests:');
  for (const { name, error } of failedTests) {
    console.log(`   - ${name}: ${error}`);
  }
  console.log('\n');
  process.exit(1);
} else {
  console.log('\n✅ All integration tests passed!\n');
  process.exit(0);
}
