import { Component } from '@components/core/Component';
import { audioService } from '@services/AudioService';
import type { 
  QuizGeneratorProps, 
  Exercise, 
  ExerciseType, 
  ExerciseResult, 
  QuizResults,
  MultipleChoiceExercise,
  FillInBlanksExercise,
  VocabularyMatchingExercise
} from '@/types';

/**
 * QuizGenerator Component
 * Renders different exercise types and manages quiz flow
 */
export class QuizGenerator extends Component<QuizGeneratorProps> {
  private currentExerciseIndex: number = 0;
  private exerciseResults: ExerciseResult[] = [];
  private startTime = Date.now();
  private currentExerciseStartTime = Date.now();
  private isSubmitted = false;
  private timer: NodeJS.Timeout | null = null;
  private remainingTime = 0;

  constructor(props: QuizGeneratorProps) {
    super(props);
    this.currentExerciseIndex = 0; // Ensure it's explicitly set to 0
    this.remainingTime = (props.timeLimit || 0) * 60 * 1000; // Convert minutes to milliseconds
  }

  protected createElement(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'quiz-generator';
    
    const exercises = this.props.exercises.slice(0, this.props.maxQuestions || this.props.exercises.length);
    
    container.innerHTML = `
      <div class="quiz-generator__header">
        <div class="quiz-progress">
          <div class="quiz-progress__info">
            <span class="current-question">${this.currentExerciseIndex + 1}</span>
            <span class="question-separator">of</span>
            <span class="total-questions">${exercises.length}</span>
          </div>
          <div class="quiz-progress__bar">
            <div class="quiz-progress__fill" style="width: ${((this.currentExerciseIndex + 1) / exercises.length) * 100}%"></div>
          </div>
        </div>
        
        ${this.props.timeLimit ? `
          <div class="quiz-timer">
            <span class="timer-icon">⏱️</span>
            <span class="timer-display">--:--</span>
          </div>
        ` : ''}
      </div>
      
      <div class="quiz-generator__content">
        <div class="exercise-container">
          <!-- Exercise will be rendered here -->
        </div>
      </div>
      
      <div class="quiz-generator__controls">
        <button class="quiz-btn quiz-btn--secondary prev-btn" 
                type="button">
          ← Previous
        </button>
        
        <div class="quiz-controls-center">
          <button class="quiz-btn quiz-btn--outline hint-btn" type="button">
            💡 Hint
          </button>
          <button class="quiz-btn quiz-btn--outline skip-btn" type="button">
            Skip
          </button>
        </div>
        
        <button class="quiz-btn quiz-btn--primary next-btn" type="button">
          Next →
        </button>
      </div>
    `;

    return container;
  }

  protected bindEvents(): void {
    // Initialize after element is created - ensure properties are properly set
    this.currentExerciseIndex = 0; // Explicitly initialize properties
    this.exerciseResults = [];
    this.isSubmitted = false;
    
    this.updateNavigationButtons(); // Update buttons first
    this.renderCurrentExercise();   // Then render exercise (which also calls updateProgressBar)
    this.startTimer();              // Finally start timer
    
    const prevBtn = this.querySelector('.prev-btn');
    const nextBtn = this.querySelector('.next-btn');
    const hintBtn = this.querySelector('.hint-btn');
    const skipBtn = this.querySelector('.skip-btn');

    // Navigation controls
    prevBtn?.addEventListener('click', () => this.previousExercise());
    nextBtn?.addEventListener('click', () => this.nextExercise());
    hintBtn?.addEventListener('click', () => this.showHint());
    skipBtn?.addEventListener('click', () => this.skipExercise());

    // Keyboard shortcuts
    this.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            this.previousExercise();
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.nextExercise();
            break;
          case 'h':
            e.preventDefault();
            this.showHint();
            break;
          case 's':
            e.preventDefault();
            this.skipExercise();
            break;
        }
      }
    });

    // Auto-save progress
    setInterval(() => {
      this.saveProgress();
    }, 30000); // Save every 30 seconds
  }

  /**
   * Render the current exercise based on its type
   */
  private renderCurrentExercise(): void {
    const container = this.querySelector('.exercise-container');
    if (!container) return;

    const exercises = this.props.exercises.slice(0, this.props.maxQuestions || this.props.exercises.length);
    const exercise = exercises[this.currentExerciseIndex];
    
    if (!exercise) return;

    this.currentExerciseStartTime = Date.now();

    // Clear previous exercise
    container.innerHTML = '';

    // For now, render a simple placeholder
    container.innerHTML = `
      <div class="exercise exercise--placeholder">
        <div class="exercise__header">
          <h2 class="exercise__title">Exercise ${this.currentExerciseIndex + 1}</h2>
          <div class="exercise__meta">
            <span class="exercise__type">Quiz Question</span>
            <span class="exercise__difficulty">Level ${exercise.difficulty || 1}</span>
            <span class="exercise__points">${exercise.points || 10} points</span>
          </div>
        </div>
        
        <div class="exercise__content">
          <p>This is a placeholder for the quiz exercise.</p>
          <p>Exercise type: ${exercise.type}</p>
        </div>
      </div>
    `;

    // Update progress bar
    this.updateProgressBar();
  }

  /**
   * Navigation methods
   */
  private async nextExercise(): Promise<void> {
    const exercises = this.props.exercises.slice(0, this.props.maxQuestions || this.props.exercises.length);
    const isLastExercise = this.currentExerciseIndex >= exercises.length - 1;

    if (isLastExercise) {
      await this.submitQuiz();
    } else {
      // Record current exercise result
      this.recordCurrentExerciseResult();
      
      // Move to next exercise
      this.currentExerciseIndex++;
      this.renderCurrentExercise();
      this.updateNavigationButtons();
      
      // Scroll to top
      this.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private previousExercise(): void {
    if (this.currentExerciseIndex > 0) {
      this.recordCurrentExerciseResult();
      this.currentExerciseIndex--;
      this.renderCurrentExercise();
      this.updateNavigationButtons();
      this.element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private showHint(): void {
    // Implementation for showing hints
    const exercise = this.props.exercises[this.currentExerciseIndex];
    if (exercise) {
      // Show hint modal or inline hint
      console.log('Showing hint for exercise:', exercise.id);
    }
  }

  private skipExercise(): void {
    this.recordCurrentExerciseResult(true);
    this.nextExercise();
  }

  /**
   * Quiz submission and results
   */
  private async submitQuiz(): Promise<void> {
    if (this.isSubmitted) return;
    
    this.isSubmitted = true;
    this.recordCurrentExerciseResult();
    this.stopTimer();
    
    const totalTime = Date.now() - this.startTime;
    const results = this.calculateResults(totalTime);
    
    // Save final results
    this.saveResults(results);
    
    // Call completion callback
    this.props.onQuizComplete?.(results);
    
    // Emit completion event
    this.eventBus.emit('quiz-complete', results);
  }

  /**
   * Utility methods
   */
  private recordCurrentExerciseResult(skipped = false): void {
    const exercises = this.props.exercises.slice(0, this.props.maxQuestions || this.props.exercises.length);
    const exercise = exercises[this.currentExerciseIndex];
    
    if (!exercise) return;

    const timeSpent = Date.now() - this.currentExerciseStartTime;
    const userAnswer = this.getUserAnswer(exercise);
    const correctAnswer = this.getCorrectAnswer(exercise);
    const isCorrect = !skipped && this.isAnswerCorrect(userAnswer, correctAnswer, exercise);

    const result: ExerciseResult = {
      exerciseId: exercise.id,
      correct: isCorrect,
      userAnswer,
      correctAnswer,
      timeSpent,
      hintsUsed: 0 // Would track this in implementation
    };

    // Update existing result or add new one
    const existingIndex = this.exerciseResults.findIndex(r => r.exerciseId === exercise.id);
    if (existingIndex >= 0) {
      this.exerciseResults[existingIndex] = result;
    } else {
      this.exerciseResults.push(result);
    }
  }

  private calculateResults(totalTime: number): QuizResults {
    const correctAnswers = this.exerciseResults.filter(r => r.correct).length;
    const totalQuestions = this.exerciseResults.length;
    const maxScore = this.props.exercises.reduce((sum, ex) => sum + (ex.points || 10), 0);
    const score = this.exerciseResults.reduce((sum, result) => {
      const exercise = this.props.exercises.find(ex => ex.id === result.exerciseId);
      return sum + (result.correct ? (exercise?.points || 10) : 0);
    }, 0);

    return {
      score,
      maxScore,
      percentage: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
      timeSpent: totalTime,
      correctAnswers,
      totalQuestions,
      exerciseResults: this.exerciseResults
    };
  }

  private updateProgressBar(): void {
    const progressFill = this.querySelector('.quiz-progress__fill') as HTMLElement;
    const currentQuestion = this.querySelector('.current-question');
    
    if (progressFill && currentQuestion) {
      const exercises = this.props.exercises.slice(0, this.props.maxQuestions || this.props.exercises.length);
      const progress = ((this.currentExerciseIndex + 1) / exercises.length) * 100;
      
      progressFill.style.width = `${progress}%`;
      currentQuestion.textContent = (this.currentExerciseIndex + 1).toString();
    }
  }

  private updateNavigationButtons(): void {
    const prevBtn = this.querySelector('.prev-btn') as HTMLButtonElement;
    const nextBtn = this.querySelector('.next-btn') as HTMLButtonElement;
    
    if (prevBtn) {
      prevBtn.disabled = this.currentExerciseIndex === 0;
    }
    
    if (nextBtn) {
      const exercises = this.props.exercises.slice(0, this.props.maxQuestions || this.props.exercises.length);
      const isLastExercise = this.currentExerciseIndex >= exercises.length - 1;
      nextBtn.textContent = isLastExercise ? 'Submit Quiz' : 'Next →';
    }
  }

  private startTimer(): void {
    if (!this.props.timeLimit) return;
    
    this.timer = setInterval(() => {
      this.remainingTime -= 1000;
      this.updateTimerDisplay();
      
      if (this.remainingTime <= 0) {
        this.submitQuiz();
      }
    }, 1000);
    
    this.updateTimerDisplay();
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private updateTimerDisplay(): void {
    const timerDisplay = this.querySelector('.timer-display');
    if (timerDisplay && this.props.timeLimit) {
      const minutes = Math.floor(this.remainingTime / 60000);
      const seconds = Math.floor((this.remainingTime % 60000) / 1000);
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Warning styles
      if (this.remainingTime < 60000) { // Less than 1 minute
        timerDisplay.classList.add('timer--warning');
      }
      if (this.remainingTime < 30000) { // Less than 30 seconds
        timerDisplay.classList.add('timer--danger');
      }
    }
  }

  // Helper methods for specific exercise types
  private getUserAnswer(exercise: Exercise): string | string[] {
    // Implementation to extract user's answer based on exercise type
    return '';
  }

  private getCorrectAnswer(exercise: Exercise): string | string[] {
    // Implementation to get correct answer based on exercise type
    return '';
  }

  private isAnswerCorrect(userAnswer: string | string[], correctAnswer: string | string[], exercise: Exercise): boolean {
    // Implementation for answer validation
    return false;
  }

  private saveProgress(): void {
    // Implementation for saving progress to localStorage
    const progressKey = `quiz_progress_${Date.now()}`;
    const progressData = {
      currentIndex: this.currentExerciseIndex,
      results: this.exerciseResults,
      timestamp: Date.now()
    };
    localStorage.setItem(progressKey, JSON.stringify(progressData));
  }

  private saveResults(results: QuizResults): void {
    // Implementation for saving final results
    const resultsKey = `quiz_results_${Date.now()}`;
    localStorage.setItem(resultsKey, JSON.stringify(results));
  }

  /**
   * Cleanup on destroy
   */
  protected onDestroy(): void {
    this.stopTimer();
    audioService.stopPlayback();
  }
}

// Export factory function for easy instantiation
export const createQuizGenerator = (props: QuizGeneratorProps): QuizGenerator => {
  return new QuizGenerator(props);
};