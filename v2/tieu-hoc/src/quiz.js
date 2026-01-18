/**
 * Quiz module - Core quiz logic and state management
 */

import { QUESTION_TYPES, SCORE_CONSTANTS } from './data.js';
import { shouldCapturePhoto, capturePhoto, isCameraActive } from './camera.js';
import { sendPhotoToTelegram, formatPhotoCaption } from './telegram-sender.js';

export class QuizState {
  constructor(questions, onBackToMenu = null, testSetName = 'Unknown', studentName = null) {
    this.questions = questions;
    this.currentIndex = 0;
    this.answers = new Map();
    this.wordArrangements = new Map();
    this.explanationVisible = new Map();
    this.answerChecked = new Map();
    this.wrongAnswerConfirmed = new Map();
    this.isSubmitted = false;
    this.onBackToMenu = onBackToMenu;
    this.testSetName = testSetName;
    this.studentName = studentName;
    this.photoCapturePending = false;

    // Score and streak tracking
    this.totalScore = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.groupScores = new Map();
    this.lastGroupMilestone = 0;
    this.scoreHistory = [];

    // Courage point system for re-answers
    this.couragePoints = 0;
    this.reAnsweredQuestions = new Set();
    this.couragePointHistory = [];
  }

  /**
   * Gets the current question
   * @returns {Object} Current question object
   */
  getCurrentQuestion() {
    return this.questions[this.currentIndex];
  }

  /**
   * Gets total number of questions
   * @returns {number} Total questions
   */
  getTotalQuestions() {
    return this.questions.length;
  }

  /**
   * Checks if there is a next question
   * @returns {boolean} True if next question exists
   */
  hasNext() {
    return this.currentIndex < this.questions.length - 1;
  }

  /**
   * Checks if there is a previous question
   * @returns {boolean} True if previous question exists
   */
  hasPrevious() {
    return this.currentIndex > 0;
  }

  /**
   * Moves to next question
   */
  async goToNext() {
    if (this.hasNext()) {
      this.currentIndex++;
      await this.checkAndCapturePhoto();
    }
  }

  /**
   * Checks if photo should be captured and captures it
   */
  async checkAndCapturePhoto() {
    const questionNumber = this.currentIndex + 1;

    if (shouldCapturePhoto(questionNumber) && isCameraActive()) {
      this.photoCapturePending = true;

      try {
        const photoBlob = await capturePhoto();
        const progressScore = this.calculateProgressScore(questionNumber);
        const questionRange = this.getQuestionRange(questionNumber);
        const scoreData = {
          totalScore: this.totalScore,
          currentStreak: this.currentStreak,
          maxStreak: this.maxStreak
        };

        const startQ = Math.max(1, questionNumber - 19);
        const mistakes = this.scoreHistory
          .filter(h => !h.isCorrect && h.questionNumber >= startQ && h.questionNumber <= questionNumber)
          .map(h => ({
            questionNumber: h.questionNumber,
            questionType: h.questionData?.type,
            userAnswer: h.userAnswer,
            correctAnswer: h.questionData?.correctAnswer
          }));

        const studentName = this.studentName || 'Unknown Student';

        const caption = formatPhotoCaption(
          questionNumber,
          this.testSetName,
          progressScore,
          questionRange,
          scoreData,
          studentName,
          mistakes
        );

        await sendPhotoToTelegram(photoBlob, caption);
        console.log(`Photo sent for question ${questionNumber}`);
      } catch (error) {
        console.error('Failed to capture/send photo:', error);
      } finally {
        this.photoCapturePending = false;
      }
    }
  }

  /**
   * Gets the question range that student has completed
   * @param {number} upToQuestion - Current question number
   * @returns {string} Question range string (e.g., "1-20")
   */
  getQuestionRange(upToQuestion) {
    const startQuestion = Math.max(1, Math.floor((upToQuestion - 1) / 20) * 20 + 1);
    const endQuestion = Math.min(upToQuestion, this.questions.length);
    return `${startQuestion}-${endQuestion}`;
  }

  /**
   * Calculates score up to current question
   * @param {number} upToQuestion - Calculate score up to this question number
   * @returns {Object} Progress score object
   */
  calculateProgressScore(upToQuestion) {
    let correctCount = 0;
    let answeredCount = 0;

    for (let i = 0; i < upToQuestion && i < this.questions.length; i++) {
      const question = this.questions[i];
      const userAnswer = this.answers.get(question.id) || this.wordArrangements.get(question.id);

      if (userAnswer) {
        answeredCount++;
        const normalizedUserAnswer = Array.isArray(userAnswer)
          ? this.normalizeAnswer(userAnswer.join(' '))
          : this.normalizeAnswer(userAnswer);

        if (normalizedUserAnswer === this.normalizeAnswer(question.correctAnswer)) {
          correctCount++;
        }
      }
    }

    return {
      correct: correctCount,
      answered: answeredCount,
      total: upToQuestion,
      percentage: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    };
  }

  /**
   * Moves to previous question
   */
  goToPrevious() {
    if (this.hasPrevious()) {
      this.currentIndex--;
    }
  }

  /**
   * Jumps to specific question by index
   * @param {number} index - Question index (0-based)
   */
  goToQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
    }
  }

  /**
   * Gets set of question indices that have been answered
   * @returns {Set<number>} Set of answered question indices
   */
  getAnsweredQuestions() {
    const answeredSet = new Set();

    this.questions.forEach((question, index) => {
      const hasRegularAnswer = this.answers.has(question.id);
      const hasWordArrangement = this.wordArrangements.has(question.id) &&
                                 this.wordArrangements.get(question.id).length > 0;

      if (hasRegularAnswer || hasWordArrangement) {
        answeredSet.add(index);
      }
    });

    return answeredSet;
  }

  /**
   * Sets answer for current question
   * @param {string} answer - User's answer
   */
  setAnswer(answer) {
    const question = this.getCurrentQuestion();
    if (question.type === QUESTION_TYPES.WORD_ARRANGEMENT) {
      return;
    }
    this.answers.set(question.id, answer.trim());
  }

  /**
   * Gets answer for current question
   * @returns {string|undefined} User's answer or undefined
   */
  getAnswer() {
    const question = this.getCurrentQuestion();
    const questionId = question.id;

    if (question.type === QUESTION_TYPES.WORD_ARRANGEMENT) {
      const words = this.wordArrangements.get(questionId) || [];
      return words.join(' ');
    }

    return this.answers.get(questionId);
  }

  /**
   * Gets word arrangement answer as array
   * @returns {string[]} Array of selected words in order
   */
  getWordArrangementAnswer() {
    const questionId = this.getCurrentQuestion().id;
    return this.wordArrangements.get(questionId) || [];
  }

  /**
   * Adds word to arrangement
   * @param {string} word - Word to add
   */
  addWordToArrangement(word) {
    const questionId = this.getCurrentQuestion().id;
    const currentWords = this.wordArrangements.get(questionId) || [];
    this.wordArrangements.set(questionId, [...currentWords, word]);
  }

  /**
   * Removes word from arrangement
   * @param {string} word - Word to remove
   */
  removeWordFromArrangement(word) {
    const questionId = this.getCurrentQuestion().id;
    const currentWords = this.wordArrangements.get(questionId) || [];
    const index = currentWords.indexOf(word);
    if (index > -1) {
      const newWords = [...currentWords];
      newWords.splice(index, 1);
      this.wordArrangements.set(questionId, newWords);
    }
  }

  /**
   * Toggles explanation visibility for current question
   */
  toggleExplanation() {
    const questionId = this.getCurrentQuestion().id;
    const current = this.explanationVisible.get(questionId) || false;
    this.explanationVisible.set(questionId, !current);
  }

  /**
   * Checks if explanation is visible for current question
   * @returns {boolean} True if explanation is visible
   */
  isExplanationVisible() {
    const questionId = this.getCurrentQuestion().id;
    return this.explanationVisible.get(questionId) || false;
  }

  /**
   * Checks current answer and marks it as checked
   */
  checkCurrentAnswer() {
    const questionId = this.getCurrentQuestion().id;
    this.answerChecked.set(questionId, true);
  }

  /**
   * Checks if current question has been re-answered
   * @returns {boolean} True if question has been re-answered
   */
  hasBeenReAnswered() {
    const questionId = this.getCurrentQuestion().id;
    return this.reAnsweredQuestions.has(questionId);
  }

  /**
   * Marks current question as re-answered
   */
  markAsReAnswered() {
    const questionId = this.getCurrentQuestion().id;
    this.reAnsweredQuestions.add(questionId);
  }

  /**
   * Gets total courage points
   * @returns {number} Total courage points
   */
  getCouragePoints() {
    return this.couragePoints;
  }

  /**
   * Gets courage point history
   * @returns {Array<Object>} Array of courage point entries
   */
  getCouragePointHistory() {
    return this.couragePointHistory;
  }

  /**
   * Checks if user can re-answer current question
   * @returns {boolean} True if can re-answer
   */
  canReAnswer() {
    const hasAnswer = this.getAnswer() !== undefined && this.getAnswer() !== '';
    const isChecked = this.isCurrentAnswerChecked();
    return hasAnswer && isChecked;
  }

  /**
   * Updates score and streak based on answer correctness
   * Also handles courage points for re-answers
   * @param {boolean} isCorrect - Whether answer was correct
   * @param {boolean} isReAnswer - Whether this is a re-answer
   * @returns {Object} Score details with points earned and streak info
   */
  updateScore(isCorrect, isReAnswer = false) {
    let pointsEarned = 0;
    let streakBonus = 0;
    let groupBonus = 0;
    let couragePointsEarned = 0;

    if (isCorrect) {
      if (isReAnswer) {
        // For re-answers, award courage points instead of regular points
        couragePointsEarned = SCORE_CONSTANTS.COURAGE_POINTS_PER_CORRECT;
        this.couragePoints += couragePointsEarned;

        // Record courage point history
        this.couragePointHistory.push({
          questionNumber: this.currentIndex + 1,
          questionData: this.getCurrentQuestion(),
          userAnswer: this.getAnswer(),
          couragePointsEarned,
          totalCouragePoints: this.couragePoints
        });
      } else {
        // Regular first-time answer scoring
        pointsEarned = SCORE_CONSTANTS.BASE_POINTS;

        // Update streak
        this.currentStreak++;
        if (this.currentStreak > this.maxStreak) {
          this.maxStreak = this.currentStreak;
        }

        // Streak bonuses
        if (this.currentStreak === 10) {
          streakBonus = SCORE_CONSTANTS.STREAK_BONUS_10;
        } else if (this.currentStreak === 5) {
          streakBonus = SCORE_CONSTANTS.STREAK_BONUS_5;
        }

        pointsEarned += streakBonus;
      }
    } else {
      // Reset streak on wrong answer (only for first-time answers)
      if (!isReAnswer) {
        this.currentStreak = 0;
      }
    }

    if (!isReAnswer) {
      this.totalScore += pointsEarned;
    }

    // Record score history with full question data
    this.scoreHistory.push({
      questionNumber: this.currentIndex + 1,
      questionData: this.getCurrentQuestion(),
      userAnswer: this.getAnswer(),
      isCorrect,
      pointsEarned,
      streakBonus,
      totalScore: this.totalScore,
      currentStreak: this.currentStreak,
      isReAnswer,
      couragePointsEarned
    });

    return {
      pointsEarned,
      streakBonus,
      groupBonus,
      totalScore: this.totalScore,
      currentStreak: this.currentStreak,
      couragePointsEarned,
      totalCouragePoints: this.couragePoints
    };
  }

  /**
   * Gets current question group number (1-10, 11-20, etc.)
   * @returns {number} Group number (1, 2, 3, etc.)
   */
  getCurrentGroup() {
    return Math.floor(this.currentIndex / SCORE_CONSTANTS.GROUP_SIZE) + 1;
  }

  /**
   * Gets starting question number for a group
   * @param {number} groupNumber - Group number
   * @returns {number} Starting question number (1-based)
   */
  getGroupStartQuestion(groupNumber) {
    return (groupNumber - 1) * SCORE_CONSTANTS.GROUP_SIZE + 1;
  }

  /**
   * Gets ending question number for a group
   * @param {number} groupNumber - Group number
   * @returns {number} Ending question number (1-based)
   */
  getGroupEndQuestion(groupNumber) {
    return Math.min(groupNumber * SCORE_CONSTANTS.GROUP_SIZE, this.questions.length);
  }

  /**
   * Checks if current question is the last in its group
   * @returns {boolean} True if last question in group
   */
  isLastQuestionInGroup() {
    const questionNumber = this.currentIndex + 1;
    return questionNumber % SCORE_CONSTANTS.GROUP_SIZE === 0 || questionNumber === this.questions.length;
  }

  /**
   * Gets score summary for a specific group
   * @param {number} groupNumber - Group number
   * @returns {Object} Group score summary
   */
  getGroupScore(groupNumber) {
    const startQ = this.getGroupStartQuestion(groupNumber);
    const endQ = this.getGroupEndQuestion(groupNumber);

    let correct = 0;
    let total = 0;
    let points = 0;

    for (let i = startQ - 1; i < endQ; i++) {
      if (i >= this.questions.length) break;

      const question = this.questions[i];
      const scoreEntry = this.scoreHistory.find(h => h.questionNumber === i + 1);

      if (scoreEntry) {
        total++;
        if (scoreEntry.isCorrect) {
          correct++;
          points += scoreEntry.pointsEarned;
        }
      }
    }

    const isPerfect = correct === total && total > 0;
    const bonus = isPerfect ? Math.floor(points * SCORE_CONSTANTS.PERFECT_GROUP_BONUS_PERCENT / 100) : 0;

    return {
      groupNumber,
      startQuestion: startQ,
      endQuestion: endQ,
      correct,
      total,
      points,
      bonus,
      isPerfect
    };
  }

  /**
   * Checks if a group milestone should be celebrated
   * @returns {Object|null} Group score if milestone reached, null otherwise
   */
  checkGroupMilestone() {
    const questionNumber = this.currentIndex + 1;
    const currentGroup = this.getCurrentGroup();

    if (this.isLastQuestionInGroup() && currentGroup > this.lastGroupMilestone) {
      this.lastGroupMilestone = currentGroup;
      return this.getGroupScore(currentGroup);
    }

    return null;
  }

  /**
   * Gets total score
   * @returns {number} Total score
   */
  getTotalScore() {
    return this.totalScore;
  }

  /**
   * Gets current streak
   * @returns {number} Current streak count
   */
  getCurrentStreak() {
    return this.currentStreak;
  }

  /**
   * Gets max streak achieved
   * @returns {number} Max streak count
   */
  getMaxStreak() {
    return this.maxStreak;
  }

  /**
   * Gets all group scores for completed groups
   * @returns {Array<Object>} Array of group score objects
   */
  getAllGroupScores() {
    const groups = [];
    const totalGroups = Math.ceil(this.questions.length / SCORE_CONSTANTS.GROUP_SIZE);

    for (let i = 1; i <= totalGroups; i++) {
      const groupScore = this.getGroupScore(i);
      if (groupScore.total > 0) {
        groups.push(groupScore);
      }
    }

    return groups;
  }

  /**
   * Checks if current answer has been checked
   * @returns {boolean} True if answer has been checked
   */
  isCurrentAnswerChecked() {
    const questionId = this.getCurrentQuestion().id;
    return this.answerChecked.get(questionId) || false;
  }

  /**
   * Confirms wrong answer to allow navigation
   */
  confirmWrongAnswer() {
    const questionId = this.getCurrentQuestion().id;
    this.wrongAnswerConfirmed.set(questionId, true);
  }

  /**
   * Checks if wrong answer has been confirmed
   * @returns {boolean} True if confirmed
   */
  isWrongAnswerConfirmed() {
    const questionId = this.getCurrentQuestion().id;
    return this.wrongAnswerConfirmed.get(questionId) || false;
  }

  /**
   * Checks if user can proceed to next question
   * @returns {boolean} True if can proceed
   */
  canProceedToNext() {
    if (!this.hasNext()) return false;

    const hasAnswer = this.getAnswer() !== undefined && this.getAnswer() !== '';
    if (!hasAnswer) return false;

    const isChecked = this.isCurrentAnswerChecked();
    if (!isChecked) return false;

    const isCorrect = this.isCurrentAnswerCorrect();
    if (isCorrect) return true;

    return this.isWrongAnswerConfirmed();
  }

  /**
   * Checks if current answer is correct
   * @returns {boolean} True if answer is correct
   */
  isCurrentAnswerCorrect() {
    const question = this.getCurrentQuestion();
    const userAnswer = this.getAnswer();
    if (!userAnswer) return false;

    return this.normalizeAnswer(userAnswer) === this.normalizeAnswer(question.correctAnswer);
  }

  /**
   * Normalizes answer for comparison
   * @param {string} answer - Answer to normalize
   * @returns {string} Normalized answer
   */
  normalizeAnswer(answer) {
    return answer.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Calculates score - checks both regular answers and word arrangements
   * @returns {Object} Score object with correct count and percentage
   */
  calculateScore() {
    let correctCount = 0;

    this.questions.forEach(question => {
      let userAnswer = this.answers.get(question.id);

      // Check word arrangements if no regular answer
      if (!userAnswer && this.wordArrangements.has(question.id)) {
        const words = this.wordArrangements.get(question.id);
        if (words && words.length > 0) {
          userAnswer = words.join(' ');
        }
      }

      if (userAnswer && this.normalizeAnswer(userAnswer) === this.normalizeAnswer(question.correctAnswer)) {
        correctCount++;
      }
    });

    return {
      correct: correctCount,
      total: this.questions.length,
      percentage: Math.round((correctCount / this.questions.length) * 100)
    };
  }

  /**
   * Submits the quiz
   */
  submit() {
    this.isSubmitted = true;
  }

  /**
   * Resets the quiz to initial state
   */
  reset() {
    this.currentIndex = 0;
    this.answers.clear();
    this.wordArrangements.clear();
    this.explanationVisible.clear();
    this.answerChecked.clear();
    this.wrongAnswerConfirmed.clear();
    this.isSubmitted = false;

    // Reset score and streak
    this.totalScore = 0;
    this.currentStreak = 0;
    this.maxStreak = 0;
    this.groupScores.clear();
    this.lastGroupMilestone = 0;
    this.scoreHistory = [];

    // Reset courage point system
    this.couragePoints = 0;
    this.reAnsweredQuestions.clear();
    this.couragePointHistory = [];
  }
}
