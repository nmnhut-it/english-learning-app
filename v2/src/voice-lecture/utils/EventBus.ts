/**
 * EventBus - Decoupled event system for voice lecture components
 *
 * Enables loose coupling between modules and makes testing easier
 * by allowing event interception and verification.
 */

export type EventCallback<T = unknown> = (data: T) => void;

export interface EventBusInterface {
  on<T = unknown>(event: string, callback: EventCallback<T>): () => void;
  off(event: string, callback: EventCallback): void;
  emit<T = unknown>(event: string, data?: T): void;
  once<T = unknown>(event: string, callback: EventCallback<T>): () => void;
  clear(): void;
  getHistory(): Array<{ event: string; data: unknown; timestamp: number }>;
}

export class EventBus implements EventBusInterface {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private history: Array<{ event: string; data: unknown; timestamp: number }> = [];
  private recordHistory: boolean;

  constructor(options: { recordHistory?: boolean } = {}) {
    this.recordHistory = options.recordHistory ?? false;
  }

  /**
   * Subscribe to an event
   * @returns Unsubscribe function
   */
  on<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => this.off(event, callback as EventCallback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T = unknown>(event: string, data?: T): void {
    if (this.recordHistory) {
      this.history.push({ event, data, timestamp: Date.now() });
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`EventBus: Error in listener for "${event}"`, error);
        }
      });
    }

    // Also dispatch to window for Playwright access
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`lecture:${event}`, { detail: data }));
    }
  }

  /**
   * Subscribe to an event once
   */
  once<T = unknown>(event: string, callback: EventCallback<T>): () => void {
    const wrapper: EventCallback<T> = (data) => {
      this.off(event, wrapper as EventCallback);
      callback(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
    this.history = [];
  }

  /**
   * Get event history (for testing)
   */
  getHistory(): Array<{ event: string; data: unknown; timestamp: number }> {
    return [...this.history];
  }

  /**
   * Enable/disable history recording
   */
  setRecordHistory(enabled: boolean): void {
    this.recordHistory = enabled;
    if (!enabled) {
      this.history = [];
    }
  }
}

// Singleton instance for global use
let globalEventBus: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus;
}

export function resetEventBus(): void {
  if (globalEventBus) {
    globalEventBus.clear();
  }
  globalEventBus = null;
}

// Event type definitions for type safety
export const LectureEvents = {
  // Chunk navigation
  CHUNK_ACTIVATE: 'chunk:activate',
  CHUNK_COMPLETE: 'chunk:complete',
  CHUNK_ADVANCE: 'chunk:advance',

  // Teacher script
  TS_START: 'ts:start',
  TS_END: 'ts:end',
  TS_AUDIO_START: 'ts:audio:start',
  TS_AUDIO_END: 'ts:audio:end',

  // Timer
  TIMER_START: 'timer:start',
  TIMER_TICK: 'timer:tick',
  TIMER_END: 'timer:end',
  TIMER_SKIP: 'timer:skip',

  // Vocabulary
  VOCAB_START: 'vocab:start',
  VOCAB_PHASE_CHANGE: 'vocab:phase',
  VOCAB_WORD_CHANGE: 'vocab:word',
  VOCAB_COMPLETE: 'vocab:complete',
  VOCAB_SKIP: 'vocab:skip',

  // Audio/TTS
  TTS_SPEAK: 'tts:speak',
  TTS_END: 'tts:end',
  AUDIO_PLAY: 'audio:play',
  AUDIO_END: 'audio:end',
  BEEP: 'audio:beep',

  // UI
  NPC_SHOW: 'npc:show',
  NPC_HIDE: 'npc:hide',
  SCROLL_TO: 'ui:scroll',

  // Lesson lifecycle
  LESSON_LOAD: 'lesson:load',
  LESSON_START: 'lesson:start',
  LESSON_COMPLETE: 'lesson:complete',

  // State changes
  STATE_CHANGE: 'state:change',
} as const;

export type LectureEventName = typeof LectureEvents[keyof typeof LectureEvents];
