/**
 * Mistake Tracker - Tracks and persists student mistakes with full context
 */

const STORAGE_KEY = 'ioe_mistake_history';

/**
 * Records a mistake with full question context
 * @param {Object} questionData - Full question object
 * @param {string} userAnswer - Student's incorrect answer
 * @param {string} testSetName - Name of test set
 */
export function recordMistake(questionData, userAnswer, testSetName) {
  const mistakes = getAllMistakes();

  const mistakeRecord = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    testSetName,
    questionId: questionData.id,
    questionNumber: questionData.questionNumber || questionData.id,
    questionType: questionData.type,
    questionText: questionData.question,
    options: questionData.options || null,
    correctAnswer: questionData.correctAnswer,
    userAnswer: userAnswer || '',
    explanation: questionData.explanation || ''
  };

  mistakes.push(mistakeRecord);
  saveMistakes(mistakes);

  return mistakeRecord;
}

/**
 * Gets all mistakes from localStorage
 * @returns {Array<Object>} Array of mistake records
 */
export function getAllMistakes() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load mistakes:', error);
    return [];
  }
}

/**
 * Gets mistakes for a specific batch of questions
 * @param {number} startQ - Start question number
 * @param {number} endQ - End question number
 * @param {string} testSetName - Test set name to filter by
 * @returns {Array<Object>} Mistakes in range
 */
export function getBatchMistakes(startQ, endQ, testSetName) {
  const allMistakes = getAllMistakes();

  return allMistakes.filter(mistake =>
    mistake.testSetName === testSetName &&
    mistake.questionNumber >= startQ &&
    mistake.questionNumber <= endQ
  );
}

/**
 * Analyzes pattern of mistakes by question type
 * @param {Array<Object>} mistakes - Array of mistake records
 * @returns {Object} Pattern analysis
 */
export function getPatternAnalysis(mistakes) {
  if (!mistakes || mistakes.length === 0) {
    return null;
  }

  const typeCount = {};

  mistakes.forEach(mistake => {
    const type = mistake.questionType;
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  const mostCommonType = Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    totalMistakes: mistakes.length,
    byType: typeCount,
    mostCommonType: mostCommonType ? mostCommonType[0] : null,
    mostCommonCount: mostCommonType ? mostCommonType[1] : 0
  };
}

/**
 * Gets mistakes for a specific test set
 * @param {string} testSetName - Test set name
 * @returns {Array<Object>} Mistakes for test set
 */
export function getTestSetMistakes(testSetName) {
  const allMistakes = getAllMistakes();
  return allMistakes.filter(m => m.testSetName === testSetName);
}

/**
 * Clears all mistakes from storage
 */
export function clearAllMistakes() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear mistakes:', error);
    return false;
  }
}

/**
 * Saves mistakes to localStorage
 * @param {Array<Object>} mistakes - Mistakes to save
 */
function saveMistakes(mistakes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));
  } catch (error) {
    console.error('Failed to save mistakes:', error);

    if (error.name === 'QuotaExceededError') {
      const halfLength = Math.floor(mistakes.length / 2);
      const recentMistakes = mistakes.slice(-halfLength);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentMistakes));
      console.warn('Storage quota exceeded, kept only recent half of mistakes');
    }
  }
}

/**
 * Gets summary statistics for all mistakes
 * @returns {Object} Summary statistics
 */
export function getMistakeSummary() {
  const mistakes = getAllMistakes();

  if (mistakes.length === 0) {
    return null;
  }

  const testSets = {};
  const questionTypes = {};

  mistakes.forEach(mistake => {
    testSets[mistake.testSetName] = (testSets[mistake.testSetName] || 0) + 1;
    questionTypes[mistake.questionType] = (questionTypes[mistake.questionType] || 0) + 1;
  });

  return {
    totalMistakes: mistakes.length,
    byTestSet: testSets,
    byQuestionType: questionTypes,
    oldestMistake: mistakes[0],
    newestMistake: mistakes[mistakes.length - 1]
  };
}
