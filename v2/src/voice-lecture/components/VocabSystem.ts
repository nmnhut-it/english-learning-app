/**
 * VocabSystem - Interactive vocabulary learning system
 *
 * Manages the multi-phase vocabulary learning flow:
 * 1. Flashcard - Learn words with TTS
 * 2. Quiz - Test understanding
 * 3. Writing - Write words to notebook
 * 4. Game - Matching game
 * 5. Complete - Summary
 */

import { EventBus, LectureEvents } from '../utils/EventBus';
import { AudioServiceInterface } from '../services/AudioService';
import { TimerServiceInterface } from '../services/TimerService';
import { VocabularyWord } from '../parser/Parser';

export type VocabPhase = 'flashcard' | 'quiz' | 'writing' | 'game' | 'complete';

export interface VocabInstance {
  id: string;
  words: VocabularyWord[];
  phase: VocabPhase;
  currentWordIndex: number;
  quizAnswers: boolean[];
  gameMatched: number;
  gameSelected: { word: string; type: 'word' | 'meaning' } | null;
  isActive: boolean;
  isComplete: boolean;
}

export interface VocabSystemConfig {
  secondsPerWordWriting?: number;
  flashcardRepeats?: number;
  testMode?: boolean;
}

export interface VocabSystemInterface {
  // Instance management
  createInstance(id: string, words: VocabularyWord[]): VocabInstance;
  getInstance(id: string): VocabInstance | null;
  getAllInstances(): Map<string, VocabInstance>;

  // Phase control
  startFlashcard(id: string): Promise<void>;
  startQuiz(id: string): void;
  startWriting(id: string): void;
  startGame(id: string): void;
  completeVocab(id: string): void;

  // Interactions
  handleQuizAnswer(id: string, selectedAnswer: string, correctAnswer: string): Promise<boolean>;
  handleGameSelection(id: string, word: string, type: 'word' | 'meaning'): Promise<'match' | 'wrong' | 'selected' | 'switched'>;
  skipWritingTimer(id: string): void;

  // Queries
  getCurrentPhase(id: string): VocabPhase | null;
  getQuizQuestion(id: string): { word: VocabularyWord; type: 'meaning' | 'spelling' | 'type'; options: string[] } | null;

  // Cleanup
  destroy(id: string): void;
  destroyAll(): void;
}

export class VocabSystem implements VocabSystemInterface {
  private instances: Map<string, VocabInstance> = new Map();
  private eventBus: EventBus | null;
  private audioService: AudioServiceInterface;
  private timerService: TimerServiceInterface;
  private config: VocabSystemConfig;

  constructor(
    audioService: AudioServiceInterface,
    timerService: TimerServiceInterface,
    eventBus?: EventBus,
    config: VocabSystemConfig = {}
  ) {
    this.audioService = audioService;
    this.timerService = timerService;
    this.eventBus = eventBus ?? null;
    this.config = {
      secondsPerWordWriting: 30,
      flashcardRepeats: 3,
      testMode: false,
      ...config,
    };
  }

  createInstance(id: string, words: VocabularyWord[]): VocabInstance {
    const instance: VocabInstance = {
      id,
      words,
      phase: 'flashcard',
      currentWordIndex: 0,
      quizAnswers: [],
      gameMatched: 0,
      gameSelected: null,
      isActive: false,
      isComplete: false,
    };

    this.instances.set(id, instance);
    return instance;
  }

  getInstance(id: string): VocabInstance | null {
    return this.instances.get(id) ?? null;
  }

  getAllInstances(): Map<string, VocabInstance> {
    return new Map(this.instances);
  }

  // ============ FLASHCARD PHASE ============
  // NEW PATTERN: word (1x) → meaning (1x) → word (3x) → meaning (1x)
  // This saves time and helps students memorize better

  async startFlashcard(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) return;

    instance.isActive = true;
    instance.phase = 'flashcard';
    instance.currentWordIndex = 0;

    this.eventBus?.emit(LectureEvents.VOCAB_PHASE_CHANGE, {
      id,
      phase: 'flashcard',
      wordIndex: 0,
    });

    // Announce start
    await this.audioService.speakTTS('Nghe thầy đọc rồi đọc theo nha!', 'vi-VN');
    await this.delay(300);

    // Play through all words with new pattern
    for (let wordIndex = 0; wordIndex < instance.words.length; wordIndex++) {
      instance.currentWordIndex = wordIndex;

      this.eventBus?.emit(LectureEvents.VOCAB_WORD_CHANGE, {
        id,
        wordIndex,
        word: instance.words[wordIndex],
        phase: 'flashcard',
      });

      await this.playFlashcardWord(instance, wordIndex);

      if (wordIndex < instance.words.length - 1) {
        await this.delay(500);
      }
    }

    // Transition to WRITING (copy) phase FIRST, then quiz after
    await this.audioService.speakTTS('Xong phần học từ.', 'vi-VN');
    await this.delay(500);

    this.startWriting(id);
  }

  /**
   * NEW TTS PATTERN for each vocabulary word:
   * 1. Read English word (1x)
   * 2. Read Vietnamese meaning (1x)
   * 3. Read English word (3x) - for repetition practice
   * 4. Read Vietnamese meaning (1x) - final reinforcement
   */
  private async playFlashcardWord(instance: VocabInstance, wordIndex: number): Promise<void> {
    const word = instance.words[wordIndex];

    // Step 1: Read English word once
    await this.audioService.speakTTS(word.word, 'en-US');
    this.eventBus?.emit('vocab:flashcard:read', {
      id: instance.id,
      wordIndex,
      step: 'word_first',
      lang: 'en',
    });
    await this.delay(400);

    // Step 2: Read Vietnamese meaning once
    await this.audioService.speakTTS(word.meaning, 'vi-VN');
    this.eventBus?.emit('vocab:flashcard:read', {
      id: instance.id,
      wordIndex,
      step: 'meaning_first',
      lang: 'vi',
    });
    await this.delay(400);

    // Step 3: Read English word 3 times (for student to repeat)
    for (let i = 0; i < 3; i++) {
      await this.audioService.playRepeatSignal();
      await this.delay(200);
      await this.audioService.speakTTS(word.word, 'en-US');

      this.eventBus?.emit('vocab:flashcard:repeat', {
        id: instance.id,
        wordIndex,
        repeatIndex: i,
        lang: 'en',
      });

      await this.delay(600); // Time for student to repeat
    }

    // Step 4: Read Vietnamese meaning once (final)
    await this.delay(300);
    await this.audioService.speakTTS(word.meaning, 'vi-VN');
    this.eventBus?.emit('vocab:flashcard:read', {
      id: instance.id,
      wordIndex,
      step: 'meaning_final',
      lang: 'vi',
    });

    await this.delay(500);
  }

  // ============ QUIZ PHASE ============

  startQuiz(id: string): void {
    const instance = this.instances.get(id);
    if (!instance) return;

    instance.phase = 'quiz';
    instance.currentWordIndex = 0;
    instance.quizAnswers = [];

    this.eventBus?.emit(LectureEvents.VOCAB_PHASE_CHANGE, {
      id,
      phase: 'quiz',
      wordIndex: 0,
    });
  }

  getQuizQuestion(id: string): { word: VocabularyWord; type: 'meaning' | 'spelling' | 'type'; options: string[] } | null {
    const instance = this.instances.get(id);
    if (!instance || instance.phase !== 'quiz') return null;

    const word = instance.words[instance.currentWordIndex];
    if (!word) return null;

    // Determine question type
    const types: Array<'meaning' | 'spelling' | 'type'> = word.type
      ? ['meaning', 'spelling', 'type']
      : ['meaning', 'spelling'];

    const questionType = this.config.testMode
      ? types[0] // Deterministic for tests
      : types[Math.floor(Math.random() * types.length)];

    // Generate options
    let correctAnswer: string;
    let wrongAnswers: string[];

    if (questionType === 'meaning') {
      correctAnswer = word.meaning;
      wrongAnswers = instance.words
        .filter((_, i) => i !== instance.currentWordIndex)
        .map((w) => w.meaning);
    } else if (questionType === 'spelling') {
      correctAnswer = word.word;
      wrongAnswers = instance.words
        .filter((_, i) => i !== instance.currentWordIndex)
        .map((w) => w.word);
    } else {
      correctAnswer = word.type!;
      wrongAnswers = ['n', 'v', 'adj', 'adv', 'phrase'].filter((t) => t !== word.type);
    }

    // Shuffle and limit to 4 options
    const shuffled = this.shuffle([...wrongAnswers]);
    const options = this.shuffle([correctAnswer, ...shuffled.slice(0, 3)]);

    return { word, type: questionType, options };
  }

  async handleQuizAnswer(id: string, selectedAnswer: string, correctAnswer: string): Promise<boolean> {
    const instance = this.instances.get(id);
    if (!instance) return false;

    const isCorrect = selectedAnswer === correctAnswer;
    instance.quizAnswers.push(isCorrect);

    if (isCorrect) {
      // Play praise sound: "Giỏi lắm!"
      await this.audioService.playBeep(880, 150);
      await this.audioService.playBeep(1100, 200);
      await this.audioService.speakTTS('Giỏi lắm!', 'vi-VN');
    } else {
      // Play try again sound
      await this.audioService.playBeep(300, 300);
      await this.audioService.speakTTS('Thử lại nha. Đáp án đúng là', 'vi-VN');

      // Determine if correct answer is English
      const isEnglish = instance.words.some((w) => w.word === correctAnswer);
      await this.audioService.speakTTS(correctAnswer, isEnglish ? 'en-US' : 'vi-VN');
    }

    this.eventBus?.emit('vocab:quiz:answer', {
      id,
      wordIndex: instance.currentWordIndex,
      isCorrect,
      selectedAnswer,
      correctAnswer,
    });

    // Move to next question or phase
    instance.currentWordIndex++;

    if (instance.currentWordIndex >= instance.words.length) {
      // Done with quiz - check score
      const correctCount = instance.quizAnswers.filter(Boolean).length;
      const totalCount = instance.quizAnswers.length;

      await this.delay(1000);

      if (correctCount === totalCount) {
        // Perfect score - "Xuất sắc!"
        await this.audioService.speakTTS('Xuất sắc! Làm tốt lắm!', 'vi-VN');
      } else if (correctCount >= totalCount * 0.7) {
        // Good score
        await this.audioService.speakTTS(`Giỏi lắm! ${correctCount} trên ${totalCount} câu đúng.`, 'vi-VN');
      } else {
        // Need more practice
        await this.audioService.speakTTS(`${correctCount} trên ${totalCount} câu đúng. Cố gắng thêm nha!`, 'vi-VN');
      }

      await this.delay(1500);
      this.startGame(id);
    } else {
      this.eventBus?.emit(LectureEvents.VOCAB_WORD_CHANGE, {
        id,
        wordIndex: instance.currentWordIndex,
        word: instance.words[instance.currentWordIndex],
        phase: 'quiz',
      });
    }

    return isCorrect;
  }

  // ============ WRITING PHASE ============
  // NEW WORKFLOW: Student copies vocabulary FIRST, then quiz

  startWriting(id: string): void {
    const instance = this.instances.get(id);
    if (!instance) return;

    instance.phase = 'writing';

    this.eventBus?.emit(LectureEvents.VOCAB_PHASE_CHANGE, {
      id,
      phase: 'writing',
    });

    const totalSeconds = instance.words.length * this.config.secondsPerWordWriting!;
    const timerId = `vocab-writing-${id}`;

    // After writing timer ends, transition to QUIZ (not game)
    this.timerService.start(timerId, totalSeconds, () => {
      this.transitionToQuizAfterWriting(id);
    });

    const minutes = Math.ceil(totalSeconds / 60);
    // Instruction: "Copy vocabulary into your notebook for teacher"
    this.audioService.speakTTS(`Ok, giờ các em chép từ vựng vào tập cho thầy nha. ${minutes} phút.`, 'vi-VN');
  }

  /**
   * Transition from writing to quiz phase
   * Announces quiz start with encouraging message
   */
  private async transitionToQuizAfterWriting(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) return;

    await this.audioService.speakTTS('Chép xong chưa? Giờ làm quiz kiểm tra xem nhớ được bao nhiêu từ nha.', 'vi-VN');
    await this.delay(500);

    this.startQuiz(id);
  }

  skipWritingTimer(id: string): void {
    const instance = this.instances.get(id);
    if (!instance || instance.phase !== 'writing') return;

    const timerId = `vocab-writing-${id}`;
    this.timerService.skip(timerId);
  }

  // ============ GAME PHASE ============

  startGame(id: string): void {
    const instance = this.instances.get(id);
    if (!instance) return;

    instance.phase = 'game';
    instance.gameMatched = 0;
    instance.gameSelected = null;

    this.eventBus?.emit(LectureEvents.VOCAB_PHASE_CHANGE, {
      id,
      phase: 'game',
      shuffledWords: this.config.testMode ? instance.words : this.shuffle([...instance.words]),
      shuffledMeanings: this.config.testMode ? instance.words : this.shuffle([...instance.words]),
    });

    this.audioService.speakTTS('Chơi game nối từ nha. Chọn từ tiếng Anh rồi chọn nghĩa tiếng Việt.', 'vi-VN');
  }

  async handleGameSelection(
    id: string,
    word: string,
    type: 'word' | 'meaning'
  ): Promise<'match' | 'wrong' | 'selected' | 'switched'> {
    const instance = this.instances.get(id);
    if (!instance || instance.phase !== 'game') return 'wrong';

    await this.audioService.playBeep(500, 50);

    if (!instance.gameSelected) {
      // First selection
      instance.gameSelected = { word, type };

      this.eventBus?.emit('vocab:game:select', { id, word, type });
      return 'selected';
    }

    if (instance.gameSelected.type === type) {
      // Same column - switch selection
      instance.gameSelected = { word, type };

      this.eventBus?.emit('vocab:game:switch', { id, word, type });
      return 'switched';
    }

    // Different columns - check match
    // Find the vocabulary item for the selected word
    const selectedWord = instance.gameSelected.type === 'word'
      ? instance.gameSelected.word
      : word;

    const vocabItem = instance.words.find((w) => w.word === selectedWord);

    if (!vocabItem) {
      instance.gameSelected = null;
      return 'wrong';
    }

    // Check if the meaning matches
    const selectedMeaning = instance.gameSelected.type === 'meaning'
      ? instance.gameSelected.word
      : word;

    if (vocabItem.meaning === selectedMeaning) {
      // Match!
      instance.gameMatched++;
      instance.gameSelected = null;

      await this.audioService.playBeep(660, 100);
      await this.audioService.playBeep(880, 100);
      await this.audioService.playBeep(1100, 150);

      this.eventBus?.emit('vocab:game:match', {
        id,
        word: vocabItem.word,
        meaning: vocabItem.meaning,
        totalMatched: instance.gameMatched,
      });

      if (instance.gameMatched === instance.words.length) {
        // Game complete!
        await this.delay(500);
        await this.audioService.speakTTS('Xuất sắc! Nối đúng hết rồi!', 'vi-VN');
        await this.delay(1000);
        this.completeVocab(id);
      }

      return 'match';
    } else {
      // Wrong match
      await this.audioService.playBeep(300, 200);

      this.eventBus?.emit('vocab:game:wrong', { id });

      instance.gameSelected = null;
      return 'wrong';
    }
  }

  // ============ COMPLETE PHASE ============

  completeVocab(id: string): void {
    const instance = this.instances.get(id);
    if (!instance) return;

    instance.phase = 'complete';
    instance.isComplete = true;
    instance.isActive = false;

    this.eventBus?.emit(LectureEvents.VOCAB_PHASE_CHANGE, {
      id,
      phase: 'complete',
    });

    this.audioService.speakTTS('Hoàn thành từ vựng rồi! Giỏi lắm!', 'vi-VN');
  }

  getCurrentPhase(id: string): VocabPhase | null {
    return this.instances.get(id)?.phase ?? null;
  }

  // ============ CLEANUP ============

  destroy(id: string): void {
    const instance = this.instances.get(id);
    if (instance) {
      this.timerService.stop(`vocab-writing-${id}`);
    }
    this.instances.delete(id);
  }

  destroyAll(): void {
    this.instances.forEach((_, id) => this.destroy(id));
  }

  // ============ UTILITIES ============

  private delay(ms: number): Promise<void> {
    if (this.config.testMode) {
      return Promise.resolve();
    }
    return new Promise((r) => setTimeout(r, ms));
  }

  private shuffle<T>(array: T[]): T[] {
    if (this.config.testMode) {
      return array; // Deterministic for tests
    }

    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Factory
export function createVocabSystem(
  audioService: AudioServiceInterface,
  timerService: TimerServiceInterface,
  eventBus?: EventBus,
  config?: VocabSystemConfig
): VocabSystemInterface {
  return new VocabSystem(audioService, timerService, eventBus, config);
}
