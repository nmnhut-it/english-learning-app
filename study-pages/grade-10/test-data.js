/**
 * Test Script for Grade 10 English Study Pages
 * Validates all exercises, translations, and explanations
 */

// Load the data
const fs = require('fs');
const path = require('path');

// Read the units data file
const dataPath = path.join(__dirname, 'data', 'units-data.js');
let dataContent = fs.readFileSync(dataPath, 'utf8');

// Replace window with global and remove the console.log at the end
dataContent = dataContent.replace('window.UNIT_DATA', 'global.UNIT_DATA');
dataContent = dataContent.replace(/console\.log\('Units data loaded.*\);?/, '');

// Extract the UNIT_DATA object
eval(dataContent);

const UNIT_DATA = global.UNIT_DATA;

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

// Helper functions
function log(type, message) {
  const icons = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
  console.log(`${icons[type] || ''} ${message}`);
}

function assert(condition, message) {
  if (condition) {
    results.passed++;
    return true;
  } else {
    results.failed++;
    results.errors.push(message);
    log('fail', message);
    return false;
  }
}

function warn(condition, message) {
  if (!condition) {
    results.warnings++;
    log('warn', message);
  }
}

// ========== UNIT STRUCTURE TESTS ==========
console.log('\n========== TESTING UNIT STRUCTURE ==========\n');

for (let unitNum = 1; unitNum <= 5; unitNum++) {
  const unit = UNIT_DATA[unitNum];

  console.log(`\n--- Unit ${unitNum}: ${unit?.title || 'MISSING'} ---\n`);

  // Check unit exists
  assert(unit, `Unit ${unitNum} should exist`);
  if (!unit) continue;

  // Check required fields
  assert(unit.title, `Unit ${unitNum}: Should have title`);
  assert(unit.titleVi, `Unit ${unitNum}: Should have Vietnamese title (titleVi)`);
  assert(unit.vocabulary, `Unit ${unitNum}: Should have vocabulary`);
  assert(unit.grammar, `Unit ${unitNum}: Should have grammar`);
  assert(unit.exercises, `Unit ${unitNum}: Should have exercises`);

  // Test vocabulary
  if (unit.vocabulary) {
    console.log(`  Vocabulary: ${unit.vocabulary.length} words`);
    unit.vocabulary.forEach((vocab, idx) => {
      assert(vocab.word, `Unit ${unitNum} Vocab ${idx + 1}: Should have word`);
      assert(vocab.meaning, `Unit ${unitNum} Vocab ${idx + 1}: Should have meaning`);
      assert(vocab.pronunciation, `Unit ${unitNum} Vocab ${idx + 1}: Should have pronunciation`);
      warn(vocab.example, `Unit ${unitNum} Vocab "${vocab.word}": Missing example sentence`);
      warn(vocab.exampleVi, `Unit ${unitNum} Vocab "${vocab.word}": Missing Vietnamese example`);
    });
  }

  // Test grammar
  if (unit.grammar) {
    assert(unit.grammar.title, `Unit ${unitNum} Grammar: Should have title`);
    assert(unit.grammar.titleVi, `Unit ${unitNum} Grammar: Should have Vietnamese title`);
    assert(unit.grammar.rules && unit.grammar.rules.length > 0, `Unit ${unitNum} Grammar: Should have rules`);

    if (unit.grammar.rules) {
      console.log(`  Grammar rules: ${unit.grammar.rules.length}`);
      unit.grammar.rules.forEach((rule, idx) => {
        assert(rule.name, `Unit ${unitNum} Grammar Rule ${idx + 1}: Should have name`);
        assert(rule.formula, `Unit ${unitNum} Grammar Rule ${idx + 1}: Should have formula`);
        assert(rule.examples && rule.examples.length > 0, `Unit ${unitNum} Grammar Rule ${idx + 1}: Should have examples`);
      });
    }
  }
}

// ========== EXERCISE TESTS ==========
console.log('\n\n========== TESTING EXERCISES ==========\n');

const exerciseTypes = {
  'multiple-choice': [],
  'fill-blank': [],
  'true-false': [],
  'sentence-rewrite': [],
  'word-order': []
};

for (let unitNum = 1; unitNum <= 5; unitNum++) {
  const unit = UNIT_DATA[unitNum];
  if (!unit || !unit.exercises) continue;

  console.log(`\n--- Unit ${unitNum}: ${unit.exercises.length} exercises ---\n`);

  unit.exercises.forEach((ex, idx) => {
    const exLabel = `Unit ${unitNum} Exercise ${idx + 1} (${ex.type})`;

    // Track exercise types
    if (exerciseTypes[ex.type]) {
      exerciseTypes[ex.type].push({ unit: unitNum, index: idx + 1, exercise: ex });
    }

    // Common checks for all exercise types
    assert(ex.type, `${exLabel}: Should have type`);
    assert(ex.correct, `${exLabel}: Should have correct answer`);
    assert(ex.explanation, `${exLabel}: Should have explanation for self-learners`);
    warn(ex.grammarRule, `${exLabel}: Missing grammar rule reference`);
    warn(ex.tip, `${exLabel}: Missing study tip`);

    // Type-specific checks
    switch (ex.type) {
      case 'multiple-choice':
        assert(ex.question, `${exLabel}: Should have question`);
        assert(ex.questionVi, `${exLabel}: Should have Vietnamese question`);
        assert(ex.options && ex.options.length >= 2, `${exLabel}: Should have at least 2 options`);
        assert(ex.options && ex.options.includes(ex.correct), `${exLabel}: Options should include correct answer`);
        break;

      case 'fill-blank':
        assert(ex.sentence, `${exLabel}: Should have sentence`);
        assert(ex.sentenceVi, `${exLabel}: Should have Vietnamese sentence`);
        assert(ex.sentence && ex.sentence.includes('_____'), `${exLabel}: Sentence should have blank (_____)`);
        break;

      case 'true-false':
        assert(ex.statement, `${exLabel}: Should have statement`);
        assert(ex.statementVi, `${exLabel}: Should have Vietnamese statement`);
        assert(['true', 'false'].includes(ex.correct), `${exLabel}: Correct answer should be 'true' or 'false'`);
        break;

      case 'sentence-rewrite':
        assert(ex.original, `${exLabel}: Should have original sentence`);
        assert(ex.originalVi, `${exLabel}: Should have Vietnamese original`);
        assert(ex.prompt, `${exLabel}: Should have prompt`);
        break;

      case 'word-order':
        assert(ex.words && ex.words.length > 0, `${exLabel}: Should have words array`);
        assert(ex.translation, `${exLabel}: Should have translation`);
        break;
    }

    // Log exercise preview
    const preview = ex.question || ex.sentence || ex.statement || ex.original || '';
    console.log(`  ${idx + 1}. [${ex.type}] ${preview.substring(0, 50)}...`);
    console.log(`     ✓ Explanation: ${ex.explanation ? ex.explanation.substring(0, 40) + '...' : '❌ MISSING'}`);
  });
}

// ========== EXPLANATION QUALITY TESTS ==========
console.log('\n\n========== TESTING EXPLANATION QUALITY ==========\n');

let explanationStats = {
  total: 0,
  withExplanation: 0,
  withGrammarRule: 0,
  withTip: 0,
  withVietnamese: 0
};

for (let unitNum = 1; unitNum <= 5; unitNum++) {
  const unit = UNIT_DATA[unitNum];
  if (!unit || !unit.exercises) continue;

  unit.exercises.forEach(ex => {
    explanationStats.total++;
    if (ex.explanation) explanationStats.withExplanation++;
    if (ex.grammarRule) explanationStats.withGrammarRule++;
    if (ex.tip) explanationStats.withTip++;

    // Check for Vietnamese translation based on type
    const hasVi = ex.questionVi || ex.sentenceVi || ex.statementVi || ex.originalVi || ex.translation;
    if (hasVi) explanationStats.withVietnamese++;
  });
}

console.log('Explanation Coverage:');
console.log(`  Total exercises: ${explanationStats.total}`);
console.log(`  With explanation: ${explanationStats.withExplanation} (${Math.round(explanationStats.withExplanation/explanationStats.total*100)}%)`);
console.log(`  With grammar rule: ${explanationStats.withGrammarRule} (${Math.round(explanationStats.withGrammarRule/explanationStats.total*100)}%)`);
console.log(`  With tip: ${explanationStats.withTip} (${Math.round(explanationStats.withTip/explanationStats.total*100)}%)`);
console.log(`  With Vietnamese: ${explanationStats.withVietnamese} (${Math.round(explanationStats.withVietnamese/explanationStats.total*100)}%)`);

// ========== EXERCISE TYPE DISTRIBUTION ==========
console.log('\n\n========== EXERCISE TYPE DISTRIBUTION ==========\n');

Object.entries(exerciseTypes).forEach(([type, exercises]) => {
  console.log(`${type}: ${exercises.length} exercises`);
  exercises.forEach(e => {
    console.log(`  - Unit ${e.unit}, Exercise ${e.index}`);
  });
});

// ========== ANSWER VALIDATION ==========
console.log('\n\n========== VALIDATING ANSWERS ==========\n');

for (let unitNum = 1; unitNum <= 5; unitNum++) {
  const unit = UNIT_DATA[unitNum];
  if (!unit || !unit.exercises) continue;

  unit.exercises.forEach((ex, idx) => {
    const exLabel = `Unit ${unitNum} Ex ${idx + 1}`;

    // Check for common answer format issues
    if (ex.type === 'multiple-choice') {
      const correctIndex = ex.options.indexOf(ex.correct);
      if (correctIndex === -1) {
        log('fail', `${exLabel}: Correct answer "${ex.correct}" not in options: ${JSON.stringify(ex.options)}`);
        results.failed++;
      } else {
        log('pass', `${exLabel}: Correct answer is option ${String.fromCharCode(65 + correctIndex)} (${ex.correct})`);
      }
    }

    if (ex.type === 'fill-blank') {
      // Check if answer makes sense in context
      const testSentence = ex.sentence.replace('_____', ex.correct);
      log('info', `${exLabel}: "${testSentence}"`);
    }
  });
}

// ========== SUMMARY ==========
console.log('\n\n========== TEST SUMMARY ==========\n');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️ Warnings: ${results.warnings}`);

if (results.errors.length > 0) {
  console.log('\n--- Failed Tests ---');
  results.errors.forEach(err => console.log(`  ❌ ${err}`));
}

console.log('\n--- Recommendations ---');
if (explanationStats.withExplanation < explanationStats.total) {
  console.log(`  • Add explanations to ${explanationStats.total - explanationStats.withExplanation} exercises`);
}
if (explanationStats.withGrammarRule < explanationStats.total) {
  console.log(`  • Add grammar rules to ${explanationStats.total - explanationStats.withGrammarRule} exercises`);
}
if (explanationStats.withTip < explanationStats.total) {
  console.log(`  • Add study tips to ${explanationStats.total - explanationStats.withTip} exercises`);
}
if (explanationStats.withVietnamese < explanationStats.total) {
  console.log(`  • Add Vietnamese translations to ${explanationStats.total - explanationStats.withVietnamese} exercises`);
}

// Exit with error code if tests failed
process.exit(results.failed > 0 ? 1 : 0);
