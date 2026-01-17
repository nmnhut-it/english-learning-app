/**
 * VoiceLectureController - Main orchestrator with dependency injection
 *
 * Coordinates all services and modules for the voice lecture system.
 * Designed for testability with all dependencies injectable.
 */

import { EventBus, LectureEvents, getEventBus } from './utils/EventBus';
import { AudioServiceInterface, createAudioService, AudioServiceConfig } from './services/AudioService';
import { TimerServiceInterface, createTimerService, TimerConfig } from './services/TimerService';
import { LectureState, LectureStateInterface, LectureStateType, ElementType } from './state/LectureState';
import { VocabSystemInterface, createVocabSystem, VocabSystemConfig } from './components/VocabSystem';
import {
  parseLesson,
  parseVocabulary,
  renderMarkdown,
  extractTeacherScripts,
  ParsedChunk,
  TeacherScript,
  TextSegment,
  VocabularyWord,
} from './parser/Parser';

export interface VoiceLectureConfig {
  testMode?: boolean;
  timeScale?: number;
  instantTimers?: boolean;
  recordHistory?: boolean;
  audioConfig?: AudioServiceConfig;
  timerConfig?: TimerConfig;
  vocabConfig?: VocabSystemConfig;
}

export interface VoiceLectureControllerInterface {
  // Lifecycle
  init(): void;
  loadContent(markdown: string): void;
  destroy(): void;

  // Navigation
  activateChunk(index: number): void;
  advanceToNextChunk(): void;

  // Teacher Script
  playTeacherScript(tsId: string): void;
  skipCurrentTimer(): void;

  // Vocabulary
  startVocab(vocabId: string): void;
  finishVocab(vocabId: string): void;
  skipVocab(vocabId: string): void; // Skip entire vocab section

  // State access (for testing)
  getState(): LectureStateInterface;
  getEventBus(): EventBus;
  getAudioService(): AudioServiceInterface;
  getTimerService(): TimerServiceInterface;
  getVocabSystem(): VocabSystemInterface;

  // Data access
  getChunks(): ParsedChunk[];
  getTitle(): string;
  getProgress(): { current: number; total: number; percentage: number };

  // Test helpers
  exposeForTesting(): void;
}

export class VoiceLectureController implements VoiceLectureControllerInterface {
  private eventBus: EventBus;
  private audioService: AudioServiceInterface;
  private timerService: TimerServiceInterface;
  private lectureState: LectureState;
  private vocabSystem: VocabSystemInterface;

  private chunks: ParsedChunk[] = [];
  private title: string = '';
  private currentTSElement: HTMLElement | null = null;
  private config: VoiceLectureConfig;

  // DOM references (optional - for UI integration)
  private contentElement: HTMLElement | null = null;
  private domRefs: Map<string, HTMLElement> = new Map();

  constructor(config: VoiceLectureConfig = {}) {
    this.config = {
      testMode: false,
      timeScale: 1,
      instantTimers: false,
      recordHistory: false,
      ...config,
    };

    // Initialize EventBus
    this.eventBus = new EventBus({ recordHistory: this.config.recordHistory });

    // Initialize services with config
    this.audioService = createAudioService(this.eventBus, {
      ...this.config.audioConfig,
      testMode: this.config.testMode,
    });

    this.timerService = createTimerService(this.eventBus, {
      ...this.config.timerConfig,
      timeScale: this.config.timeScale,
      instant: this.config.instantTimers,
    });

    // Initialize state
    this.lectureState = new LectureState(this.eventBus);

    // Initialize vocab system
    this.vocabSystem = createVocabSystem(
      this.audioService,
      this.timerService,
      this.eventBus,
      {
        ...this.config.vocabConfig,
        testMode: this.config.testMode,
      }
    );
  }

  init(): void {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for timer events
    this.eventBus.on(LectureEvents.TIMER_END, () => {
      this.lectureState.endTimer();
      this.playNextTeacherScript();
    });

    this.eventBus.on(LectureEvents.TIMER_SKIP, () => {
      this.lectureState.endTimer();
    });

    // Listen for vocab events
    this.eventBus.on(LectureEvents.VOCAB_COMPLETE, (data: { vocabId: string }) => {
      this.lectureState.endVocab(data.vocabId);
      this.playNextTeacherScript();
    });

    // Listen for TTS events
    this.eventBus.on(LectureEvents.TTS_END, () => {
      // Handle post-TTS logic based on state
      if (this.lectureState.getState() === LectureStateType.NPC_SPEAKING) {
        // Will be handled by TS flow
      }
    });
  }

  loadContent(markdown: string): void {
    const parsed = parseLesson(markdown);
    this.title = parsed.title;
    this.chunks = parsed.chunks;

    this.lectureState.setChunks(this.chunks);

    this.eventBus.emit(LectureEvents.LESSON_LOAD, {
      title: this.title,
      chunkCount: this.chunks.length,
    });
  }

  destroy(): void {
    this.timerService.clear();
    this.vocabSystem.destroyAll();
    this.eventBus.clear();
    this.lectureState.reset();
  }

  // ============ NAVIGATION ============

  activateChunk(index: number): void {
    if (index < 0 || index >= this.chunks.length) return;

    this.lectureState.activateChunk(index);

    // Start first teacher script in chunk
    setTimeout(() => this.playNextTeacherScript(), 500);
  }

  advanceToNextChunk(): void {
    if (!this.lectureState.canAdvance()) return;

    const advanced = this.lectureState.advanceToNextChunk();
    if (advanced) {
      setTimeout(() => this.playNextTeacherScript(), 500);
    }
  }

  // ============ TEACHER SCRIPT ============

  playTeacherScript(tsId: string): void {
    const state = this.lectureState.getState();
    if (state === LectureStateType.NPC_SPEAKING) return;

    this.lectureState.startTS(tsId);

    // Find TS data (from DOM or stored data)
    const tsData = this.getTeacherScriptData(tsId);
    if (!tsData) {
      this.lectureState.endTS(tsId);
      return;
    }

    this.eventBus.emit(LectureEvents.NPC_SHOW, { text: tsData.text });

    // Play audio
    const onAudioEnd = () => {
      this.lectureState.endTS(tsId);

      if (tsData.pause > 0) {
        this.eventBus.emit(LectureEvents.NPC_HIDE, {});
        this.lectureState.startTimer();
        this.timerService.start(`ts-${tsId}`, tsData.pause, () => {
          this.afterTimer();
        });
      } else {
        this.afterSpeaking(tsId);
      }
    };

    if (tsData.href) {
      this.audioService.playAudioFile(tsData.href).then(onAudioEnd).catch(() => {
        // Fallback to TTS if audio file fails
        this.audioService.speakSegments(tsData.segments).then(onAudioEnd);
      });
    } else {
      // Use speakSegments for dual-language TTS support
      this.audioService.speakSegments(tsData.segments).then(onAudioEnd);
    }
  }

  private getTeacherScriptData(tsId: string): TeacherScript | null {
    // Try to get from DOM first
    const el = document.getElementById(tsId);
    if (el) {
      // Parse segments from data attribute if present
      let segments: TextSegment[] = [];
      if (el.dataset.segments) {
        try {
          segments = JSON.parse(el.dataset.segments);
        } catch {
          // Fallback to single segment with default language
          segments = [{ text: el.dataset.text || '', lang: 'vi' }];
        }
      } else {
        // Fallback to single segment with default language
        segments = [{ text: el.dataset.text || '', lang: 'vi' }];
      }

      return {
        id: tsId,
        text: el.dataset.text || '',
        segments,
        pause: parseInt(el.dataset.pause || '0', 10),
        lang: (el.dataset.lang as 'vi' | 'en') || 'vi',
        href: el.dataset.href || null,
        action: el.dataset.action || null,
        type: el.dataset.type || null,
      };
    }

    // Fallback to stored data
    return null;
  }

  private afterSpeaking(tsId: string): void {
    this.eventBus.emit(LectureEvents.NPC_HIDE, {});

    const { element, type } = this.findNextElement(tsId);

    switch (type) {
      case ElementType.TS:
        // Play next TS
        setTimeout(() => this.playTeacherScript(element!.id), 200);
        break;

      case ElementType.VOCAB:
        // Start vocabulary
        const vocabId = element!.id;
        this.lectureState.startVocab(vocabId);
        this.vocabSystem.startFlashcard(vocabId);
        break;

      case ElementType.CONTENT:
        // Scroll to content, then continue
        this.eventBus.emit(LectureEvents.SCROLL_TO, { elementId: element!.id });
        setTimeout(() => this.continueAfterContent(element!.id), 1500);
        break;

      case ElementType.CHUNK_NAV:
      case ElementType.NONE:
        // End of chunk
        this.lectureState.unlockChunkNav();
        break;
    }
  }

  private afterTimer(): void {
    this.lectureState.endTimer();
    this.playNextTeacherScript();
  }

  private continueAfterContent(elementId: string): void {
    const { element, type } = this.findNextElement(elementId);

    switch (type) {
      case ElementType.CONTENT:
        this.eventBus.emit(LectureEvents.SCROLL_TO, { elementId: element!.id });
        setTimeout(() => this.continueAfterContent(element!.id), 1500);
        break;

      case ElementType.TS:
        setTimeout(() => this.playTeacherScript(element!.id), 300);
        break;

      case ElementType.VOCAB:
        const vocabId = element!.id;
        this.lectureState.startVocab(vocabId);
        this.vocabSystem.startFlashcard(vocabId);
        break;

      default:
        this.lectureState.unlockChunkNav();
        break;
    }
  }

  playNextTeacherScript(): void {
    const chunkIndex = this.lectureState.getCurrentChunkIndex();
    const chunkEl = document.getElementById(`chunk-${chunkIndex}`);
    if (!chunkEl) {
      this.lectureState.unlockChunkNav();
      return;
    }

    const nextTS = chunkEl.querySelector('.ts:not(.played)') as HTMLElement;
    if (nextTS) {
      setTimeout(() => this.playTeacherScript(nextTS.id), 300);
    } else {
      this.lectureState.unlockChunkNav();
    }
  }

  private findNextElement(currentId: string): { element: HTMLElement | null; type: ElementType } {
    const current = document.getElementById(currentId);
    if (!current) return { element: null, type: ElementType.NONE };

    let next = current.nextElementSibling as HTMLElement | null;

    // Skip utility elements
    while (next && this.isSkippableElement(next)) {
      next = next.nextElementSibling as HTMLElement | null;
    }

    if (!next) return { element: null, type: ElementType.NONE };

    // Determine type
    let type = ElementType.CONTENT;
    if (next.classList.contains('ts')) type = ElementType.TS;
    else if (next.classList.contains('vocab-interactive')) type = ElementType.VOCAB;
    else if (next.classList.contains('chunk-nav')) type = ElementType.CHUNK_NAV;

    return { element: next, type };
  }

  private isSkippableElement(el: HTMLElement): boolean {
    if (el.classList.contains('timer')) return true;
    if (el.classList.contains('action-row')) return true;
    if (el.id?.includes('-player')) return true;
    if (el.id?.includes('-photo')) return true;
    if (el.classList.contains('ts-continue')) return true;
    if (el.classList.contains('content-done')) return true;
    if (el.tagName === 'HR') return true;
    if (/^H[1-6]$/.test(el.tagName)) return true;
    if (el.classList.contains('task-box')) return true;
    if (el.classList.contains('vocab-interactive') && el.classList.contains('vocab-completed')) return true;
    return false;
  }

  skipCurrentTimer(): void {
    const state = this.lectureState.getState();
    if (state === LectureStateType.TIMER_RUNNING) {
      // Find current timer ID
      const chunkIndex = this.lectureState.getCurrentChunkIndex();
      const data = this.lectureState.getData();
      const tsId = data.currentTSId;
      if (tsId) {
        this.timerService.skip(`ts-${tsId}`);
      }
    }
  }

  // ============ VOCABULARY ============

  startVocab(vocabId: string): void {
    this.lectureState.startVocab(vocabId);
    this.vocabSystem.startFlashcard(vocabId);
  }

  finishVocab(vocabId: string): void {
    this.vocabSystem.completeVocab(vocabId);
    // State update will be handled by event listener
  }

  skipVocab(vocabId: string): void {
    this.vocabSystem.skipVocab(vocabId);
    // State update will be handled by event listener
  }

  // ============ STATE ACCESS ============

  getState(): LectureStateInterface {
    return this.lectureState;
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getAudioService(): AudioServiceInterface {
    return this.audioService;
  }

  getTimerService(): TimerServiceInterface {
    return this.timerService;
  }

  getVocabSystem(): VocabSystemInterface {
    return this.vocabSystem;
  }

  getChunks(): ParsedChunk[] {
    return this.chunks;
  }

  getTitle(): string {
    return this.title;
  }

  getProgress(): { current: number; total: number; percentage: number } {
    return this.lectureState.getProgress();
  }

  // ============ TEST HELPERS ============

  exposeForTesting(): void {
    if (typeof window !== 'undefined') {
      (window as any).__voiceLecture = {
        getState: () => this.lectureState.getData(),
        getProgress: () => this.getProgress(),
        getChunks: () => this.chunks.map((c, i) => ({ index: i, id: c.id, title: c.title })),
        getEventHistory: () => this.eventBus.getHistory(),

        // Control methods
        skipCurrentTimer: () => this.skipCurrentTimer(),
        advanceToNextChunk: () => this.advanceToNextChunk(),
        activateChunk: (index: number) => this.activateChunk(index),
        finishVocab: (vocabId: string) => this.finishVocab(vocabId),
        skipVocab: (vocabId: string) => this.skipVocab(vocabId),

        // Service access
        getTimerScale: () => this.timerService.getTimeScale(),
        setTimerScale: (scale: number) => this.timerService.setTimeScale(scale),

        // Event listening helpers
        waitForEvent: (eventName: string, timeout = 5000) => {
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${eventName}`)), timeout);
            this.eventBus.once(eventName, (data) => {
              clearTimeout(timer);
              resolve(data);
            });
          });
        },
      };
    }
  }
}

// ============ FACTORY ============

export function createVoiceLectureController(config?: VoiceLectureConfig): VoiceLectureControllerInterface {
  const controller = new VoiceLectureController(config);
  controller.init();
  return controller;
}

// ============ QUICK SETUP FOR TEST MODE ============

export function createTestController(): VoiceLectureControllerInterface {
  return createVoiceLectureController({
    testMode: true,
    instantTimers: true,
    recordHistory: true,
    timeScale: 1000,
  });
}
