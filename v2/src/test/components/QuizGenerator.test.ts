import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuizGenerator } from '@components/QuizGenerator/QuizGenerator';
import type { QuizGeneratorProps, Exercise, ExerciseType } from '@/types';

// Mock audio service
vi.mock('@services/AudioService', () => ({
  audioService: {
    stopPlayback: vi.fn(),
  },
}));

describe('QuizGenerator Component', () => {
  let mockExercises: Exercise[];
  let mockProps: QuizGeneratorProps;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    
    mockExercises = [
      {
        id: 'ex1',
        type: 'multiple_choice' as ExerciseType,
        difficulty: 1,
        points: 10,
        question: {
          text: 'What is a hobby?',
          translation: 'Sở thích là gì?'
        },
        options: [
          { id: 'a', text: 'An activity for pleasure', correct: true },
          { id: 'b', text: 'A type of work', correct: false }
        ]
      },
      {
        id: 'ex2',
        type: 'multiple_choice' as ExerciseType,
        difficulty: 2,
        points: 15,
        question: {
          text: 'Which is unusual?',
          translation: 'Cái nào là bất thường?'
        },
        options: [
          { id: 'a', text: 'Reading books', correct: false },
          { id: 'b', text: 'Collecting dollhouses', correct: true }
        ]
      }
    ];

    mockProps = {
      exercises: mockExercises,
      maxQuestions: 5,
      timeLimit: 10, // 10 minutes
      onQuizComplete: vi.fn(),
    };
  });

  describe('Initialization', () => {
    it('should create quiz generator element with correct structure', () => {
      const quiz = new QuizGenerator(mockProps);
      const element = quiz.getElement();
      
      expect(element.className).toBe('quiz-generator');
      expect(element.querySelector('.quiz-generator__header')).toBeTruthy();
      expect(element.querySelector('.quiz-generator__content')).toBeTruthy();
      expect(element.querySelector('.quiz-generator__controls')).toBeTruthy();
    });

    it('should display progress information correctly', () => {
      const quiz = new QuizGenerator(mockProps);
      const element = quiz.getElement();
      
      // Check that progress elements exist
      const currentQuestion = element.querySelector('.current-question');
      const totalQuestions = element.querySelector('.total-questions');
      
      expect(currentQuestion).toBeTruthy();
      expect(totalQuestions).toBeTruthy();
      expect(totalQuestions?.textContent).toBe('2');
      
      const progressBar = element.querySelector('.quiz-progress__fill') as HTMLElement;
      expect(progressBar).toBeTruthy();
    });

    it('should show timer when timeLimit is provided', () => {
      const quiz = new QuizGenerator(mockProps);
      const element = quiz.getElement();
      
      expect(element.querySelector('.quiz-timer')).toBeTruthy();
      expect(element.querySelector('.timer-display')).toBeTruthy();
    });

    it('should not show timer when timeLimit is not provided', () => {
      const propsWithoutTimer = { ...mockProps, timeLimit: undefined };
      const quiz = new QuizGenerator(propsWithoutTimer);
      const element = quiz.getElement();
      
      expect(element.querySelector('.quiz-timer')).toBeFalsy();
    });

    it('should limit questions to maxQuestions', () => {
      const propsWithLimit = { 
        ...mockProps, 
        maxQuestions: 1,
        exercises: [...mockExercises, { ...mockExercises[0], id: 'ex3' }]
      };
      const quiz = new QuizGenerator(propsWithLimit);
      const element = quiz.getElement();
      
      expect(element.querySelector('.total-questions')?.textContent).toBe('1');
    });
  });

  describe('Navigation Controls', () => {
    it('should disable previous button on first question', () => {
      const quiz = new QuizGenerator(mockProps);
      const element = quiz.getElement();
      
      const prevBtn = element.querySelector('.prev-btn') as HTMLButtonElement;
      expect(prevBtn?.disabled).toBe(true);
    });

    it('should show Next button text on non-final questions', () => {
      const quiz = new QuizGenerator(mockProps);
      const element = quiz.getElement();
      
      const nextBtn = element.querySelector('.next-btn') as HTMLButtonElement;
      expect(nextBtn?.textContent?.trim()).toBe('Next →');
    });

    it('should show Submit Quiz text on final question', () => {
      const singleQuestionProps = { 
        ...mockProps, 
        exercises: [mockExercises[0]]
      };
      const quiz = new QuizGenerator(singleQuestionProps);
      const element = quiz.getElement();
      
      const nextBtn = element.querySelector('.next-btn') as HTMLButtonElement;
      expect(nextBtn?.textContent?.trim()).toBe('Submit Quiz');
    });

    it('should have hint and skip buttons', () => {
      const quiz = new QuizGenerator(mockProps);
      const element = quiz.getElement();
      
      expect(element.querySelector('.hint-btn')).toBeTruthy();
      expect(element.querySelector('.skip-btn')).toBeTruthy();
    });
  });

  describe('Exercise Rendering', () => {
    it('should render exercise placeholder', () => {
      const quiz = new QuizGenerator(mockProps);
      const element = quiz.getElement();
      
      const exerciseContainer = element.querySelector('.exercise-container');
      expect(exerciseContainer?.querySelector('.exercise--placeholder')).toBeTruthy();
      expect(exerciseContainer?.innerHTML).toContain('Exercise 1');
      expect(exerciseContainer?.innerHTML).toContain('multiple_choice');
    });

    it('should display exercise metadata', () => {
      const quiz = new QuizGenerator(mockProps);
      const element = quiz.getElement();
      
      const exerciseContainer = element.querySelector('.exercise-container');
      expect(exerciseContainer?.innerHTML).toContain('Level 1');
      expect(exerciseContainer?.innerHTML).toContain('10 points');
    });
  });

  describe('Navigation Functionality', () => {
    it('should navigate to next exercise when next button is clicked', () => {
      const quiz = new QuizGenerator(mockProps);
      quiz.render(container);
      const element = quiz.getElement();
      
      const nextBtn = element.querySelector('.next-btn') as HTMLButtonElement;
      nextBtn.click();
      
      // Should move to exercise 2
      expect(element.querySelector('.current-question')?.textContent).toBe('2');
      
      // Progress bar should update
      const progressBar = element.querySelector('.quiz-progress__fill') as HTMLElement;
      expect(progressBar?.style.width).toBe('100%'); // 2 of 2 questions
      
      // Previous button should be enabled
      const prevBtn = element.querySelector('.prev-btn') as HTMLButtonElement;
      expect(prevBtn?.disabled).toBe(false);
    });

    it('should navigate to previous exercise when previous button is clicked', () => {
      const quiz = new QuizGenerator(mockProps);
      quiz.render(container);
      const element = quiz.getElement();
      
      // Go to second question first
      const nextBtn = element.querySelector('.next-btn') as HTMLButtonElement;
      nextBtn.click();
      
      // Then go back
      const prevBtn = element.querySelector('.prev-btn') as HTMLButtonElement;
      prevBtn.click();
      
      // Should be back to exercise 1
      expect(element.querySelector('.current-question')?.textContent).toBe('1');
      
      // Previous button should be disabled again
      expect(prevBtn?.disabled).toBe(true);
    });

    it('should call onQuizComplete when submit is clicked on final question', () => {
      const singleQuestionProps = { 
        ...mockProps, 
        exercises: [mockExercises[0]]
      };
      const quiz = new QuizGenerator(singleQuestionProps);
      quiz.render(container);
      const element = quiz.getElement();
      
      const nextBtn = element.querySelector('.next-btn') as HTMLButtonElement;
      nextBtn.click();
      
      expect(mockProps.onQuizComplete).toHaveBeenCalled();
    });
  });

  describe('Timer Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start timer and update display', () => {
      const quiz = new QuizGenerator(mockProps);
      quiz.render(container);
      const element = quiz.getElement();
      
      // Fast-forward time
      vi.advanceTimersByTime(1000);
      
      const timerDisplay = element.querySelector('.timer-display');
      expect(timerDisplay?.textContent).toMatch(/\d{2}:\d{2}/);
    });

    it('should add warning class when time is low', () => {
      const quiz = new QuizGenerator(mockProps);
      quiz.render(container);
      const element = quiz.getElement();
      
      // Fast-forward to near the end (less than 1 minute)
      vi.advanceTimersByTime(9 * 60 * 1000 + 1000); // 9 minutes 1 second
      
      const timerDisplay = element.querySelector('.timer-display');
      expect(timerDisplay?.classList.contains('timer--warning')).toBe(true);
    });

    it('should submit quiz when time runs out', () => {
      const quiz = new QuizGenerator(mockProps);
      quiz.render(container);
      
      // Fast-forward past the time limit
      vi.advanceTimersByTime(11 * 60 * 1000); // 11 minutes
      
      expect(mockProps.onQuizComplete).toHaveBeenCalled();
    });
  });

  describe('Progress Saving', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-save progress every 30 seconds', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');
      
      const quiz = new QuizGenerator(mockProps);
      quiz.render(container);
      
      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000);
      
      expect(setItemSpy).toHaveBeenCalled();
      const calls = setItemSpy.mock.calls;
      const progressCall = calls.find(call => call[0].startsWith('quiz_progress_'));
      expect(progressCall).toBeTruthy();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timer on destroy', () => {
      vi.useFakeTimers();
      
      const quiz = new QuizGenerator(mockProps);
      quiz.render(container);
      
      // Destroy the component
      quiz.destroy();
      
      // Timer should be cleaned up - no more timer calls
      const consoleSpy = vi.spyOn(console, 'error');
      vi.advanceTimersByTime(60000);
      
      // Should not throw errors about accessing destroyed component
      expect(consoleSpy).not.toHaveBeenCalled();
      
      vi.useRealTimers();
    });
  });
});