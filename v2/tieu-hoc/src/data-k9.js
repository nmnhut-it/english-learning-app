/**
 * Data module for K9 - Constants and data loading functionality
 */

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  FILL_BLANK: 'fill-blank',
  WORD_ARRANGEMENT: 'word-arrangement',
  PRONUNCIATION: 'pronunciation',
  ODD_ONE_OUT: 'odd-one-out'
};

export const UI_TEXT = {
  APP_TITLE: 'IOE K9 Quiz',
  SELECT_TEST_TITLE: 'Select a Test Set',
  NEXT_BUTTON: 'Next',
  PREVIOUS_BUTTON: 'Previous',
  SUBMIT_BUTTON: 'Submit',
  RETRY_BUTTON: 'Try Again',
  BACK_TO_MENU: 'Back to Menu',
  CHECK_ANSWER_BUTTON: 'Check Answer',
  CONFIRM_CONTINUE_BUTTON: 'Confirm & Continue',
  CORRECT_FEEDBACK: '✅ Correct!',
  WRONG_FEEDBACK: '❌ Wrong!',
  SCORE_LABEL: 'Score:',
  QUESTION_LABEL: 'Question',
  YOUR_ANSWER_LABEL: 'Your answer:',
  CORRECT_ANSWER_LABEL: 'Correct answer:',
  LOADING: 'Loading questions...',
  ERROR_LOADING: 'Error loading questions. Please refresh the page.'
};

export const SCORE_CONSTANTS = {
  BASE_POINTS: 10,
  STREAK_BONUS_5: 10,
  STREAK_BONUS_10: 20,
  PERFECT_GROUP_BONUS_PERCENT: 10,
  GROUP_SIZE: 10,
  COMBO_MULTIPLIER: 1.5
};

export const TRACKING_CONSTANTS = {
  NOTIFICATION_BATCH_SIZE: 10,
  PHOTO_INTERVAL: 20,
  INCLUDE_EXPLANATIONS: true,
  MAX_MISTAKES_TO_SHOW: 10
};

export const CSS_CLASSES = {
  QUESTION_CONTAINER: 'question-container',
  OPTION_BUTTON: 'option-btn',
  OPTION_SELECTED: 'selected',
  OPTION_CORRECT: 'correct',
  OPTION_INCORRECT: 'incorrect',
  INPUT_FIELD: 'answer-input',
  NAV_BUTTON: 'nav-btn',
  NAV_DISABLED: 'disabled',
  SUBMIT_BUTTON: 'submit-btn',
  SCORE_DISPLAY: 'score-display',
  RESULTS_CONTAINER: 'results-container'
};

export const INDEX_PATH = './output/sets-k9-index.json';

/**
 * Loads the index of all K9 test sets
 * @returns {Promise<Object>} Index data object
 */
export async function loadSetsIndex() {
  const response = await fetch(INDEX_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load sets index: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Loads a specific K9 test set by number
 * @param {number} setNumber - Set number to load
 * @returns {Promise<Object>} Test set data
 */
export async function loadTestSet(setNumber) {
  const setFile = `./output/sets-k9/set-${String(setNumber).padStart(2, '0')}.json`;
  const response = await fetch(setFile);
  if (!response.ok) {
    throw new Error(`Failed to load set ${setNumber}: ${response.statusText}`);
  }
  return await response.json();
}
