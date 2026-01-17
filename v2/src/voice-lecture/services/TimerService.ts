/**
 * TimerService - Abstraction for timer operations
 *
 * Supports time scaling for testing (e.g., 10x speed)
 * and provides injectable time source for unit tests.
 */

import { EventBus, LectureEvents } from '../utils/EventBus';

export interface TimerConfig {
  timeScale?: number; // 1 = normal, 10 = 10x faster
  minTickInterval?: number; // Minimum ms between ticks (for very high timeScale)
}

export interface TimerInstance {
  id: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
}

export interface TimerServiceInterface {
  start(id: string, seconds: number, onComplete: () => void): void;
  stop(id: string): void;
  skip(id: string): void;
  pause(id: string): void;
  resume(id: string): void;
  getRemaining(id: string): number;
  isRunning(id: string): boolean;
  formatTime(seconds: number): string;
  setTimeScale(scale: number): void;
  getTimeScale(): number;
  getAllTimers(): Map<string, TimerInstance>;
  clear(): void;
}

export class TimerService implements TimerServiceInterface {
  private timers: Map<string, {
    interval: ReturnType<typeof setInterval> | null;
    remaining: number;
    total: number;
    onComplete: () => void;
    isPaused: boolean;
  }> = new Map();

  private eventBus: EventBus | null;
  private config: TimerConfig;

  constructor(eventBus?: EventBus, config: TimerConfig = {}) {
    this.eventBus = eventBus ?? null;
    this.config = {
      timeScale: 1,
      minTickInterval: 50,
      ...config,
    };
  }

  setTimeScale(scale: number): void {
    this.config.timeScale = Math.max(0.1, scale);
  }

  getTimeScale(): number {
    return this.config.timeScale!;
  }

  /**
   * Start a new timer
   */
  start(id: string, seconds: number, onComplete: () => void): void {
    // Stop existing timer if any
    this.stop(id);

    const scaledInterval = Math.max(
      this.config.minTickInterval!,
      1000 / this.config.timeScale!
    );

    const timer = {
      interval: null as ReturnType<typeof setInterval> | null,
      remaining: seconds,
      total: seconds,
      onComplete,
      isPaused: false,
    };

    this.timers.set(id, timer);

    this.eventBus?.emit(LectureEvents.TIMER_START, {
      id,
      seconds,
      timeScale: this.config.timeScale,
    });

    timer.interval = setInterval(() => {
      if (timer.isPaused) return;

      timer.remaining--;

      this.eventBus?.emit(LectureEvents.TIMER_TICK, {
        id,
        remaining: timer.remaining,
        total: timer.total,
      });

      if (timer.remaining <= 0) {
        this.stop(id);
        this.eventBus?.emit(LectureEvents.TIMER_END, { id });
        onComplete();
      }
    }, scaledInterval);
  }

  /**
   * Stop a timer without triggering callback
   */
  stop(id: string): void {
    const timer = this.timers.get(id);
    if (timer?.interval) {
      clearInterval(timer.interval);
      timer.interval = null;
    }
    this.timers.delete(id);
  }

  /**
   * Skip a timer - stops and triggers callback immediately
   */
  skip(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      const callback = timer.onComplete;
      this.stop(id);
      this.eventBus?.emit(LectureEvents.TIMER_SKIP, { id });
      callback();
    }
  }

  /**
   * Pause a timer
   */
  pause(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      timer.isPaused = true;
    }
  }

  /**
   * Resume a paused timer
   */
  resume(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      timer.isPaused = false;
    }
  }

  /**
   * Get remaining seconds for a timer
   */
  getRemaining(id: string): number {
    return this.timers.get(id)?.remaining ?? 0;
  }

  /**
   * Check if a timer is running
   */
  isRunning(id: string): boolean {
    const timer = this.timers.get(id);
    return timer?.interval !== null && !timer?.isPaused;
  }

  /**
   * Format seconds to display string
   */
  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${seconds}s`;
  }

  /**
   * Get all active timers (for testing/inspection)
   */
  getAllTimers(): Map<string, TimerInstance> {
    const result = new Map<string, TimerInstance>();
    this.timers.forEach((timer, id) => {
      result.set(id, {
        id,
        totalSeconds: timer.total,
        remainingSeconds: timer.remaining,
        isRunning: timer.interval !== null,
        isPaused: timer.isPaused,
      });
    });
    return result;
  }

  /**
   * Clear all timers
   */
  clear(): void {
    this.timers.forEach((timer) => {
      if (timer.interval) {
        clearInterval(timer.interval);
      }
    });
    this.timers.clear();
  }
}

/**
 * Instant TimerService for testing - completes immediately
 */
export class InstantTimerService implements TimerServiceInterface {
  private completedTimers: Set<string> = new Set();
  public calls: Array<{ method: string; args: unknown[] }> = [];
  private eventBus: EventBus | null;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus ?? null;
  }

  start(id: string, seconds: number, onComplete: () => void): void {
    this.calls.push({ method: 'start', args: [id, seconds] });
    this.eventBus?.emit(LectureEvents.TIMER_START, { id, seconds, instant: true });

    // Complete immediately in next tick
    setTimeout(() => {
      this.completedTimers.add(id);
      this.eventBus?.emit(LectureEvents.TIMER_END, { id, instant: true });
      onComplete();
    }, 0);
  }

  stop(id: string): void {
    this.calls.push({ method: 'stop', args: [id] });
  }

  skip(id: string): void {
    this.calls.push({ method: 'skip', args: [id] });
  }

  pause(id: string): void {
    this.calls.push({ method: 'pause', args: [id] });
  }

  resume(id: string): void {
    this.calls.push({ method: 'resume', args: [id] });
  }

  getRemaining(): number {
    return 0;
  }

  isRunning(): boolean {
    return false;
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${seconds}s`;
  }

  setTimeScale(): void {
    // No-op for instant
  }

  getTimeScale(): number {
    return Infinity;
  }

  getAllTimers(): Map<string, TimerInstance> {
    return new Map();
  }

  clear(): void {
    this.completedTimers.clear();
    this.calls = [];
  }
}

// Factory function
export function createTimerService(
  eventBus?: EventBus,
  config?: TimerConfig & { instant?: boolean }
): TimerServiceInterface {
  if (config?.instant) {
    return new InstantTimerService(eventBus);
  }
  return new TimerService(eventBus, config);
}
