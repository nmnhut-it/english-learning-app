/**
 * TimerService Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TimerService, InstantTimerService } from '../services/TimerService';
import { EventBus, LectureEvents } from '../utils/EventBus';

describe('TimerService', () => {
  let timerService: TimerService;
  let eventBus: EventBus;

  beforeEach(() => {
    vi.useFakeTimers();
    eventBus = new EventBus({ recordHistory: true });
    timerService = new TimerService(eventBus);
  });

  afterEach(() => {
    timerService.clear();
    vi.useRealTimers();
  });

  describe('formatTime', () => {
    it('should format seconds only', () => {
      expect(timerService.formatTime(30)).toBe('30s');
      expect(timerService.formatTime(5)).toBe('5s');
    });

    it('should format minutes and seconds', () => {
      expect(timerService.formatTime(60)).toBe('1:00');
      expect(timerService.formatTime(90)).toBe('1:30');
      expect(timerService.formatTime(125)).toBe('2:05');
    });
  });

  describe('start', () => {
    it('should call callback when timer completes', () => {
      const callback = vi.fn();
      timerService.start('timer-1', 5, callback);

      vi.advanceTimersByTime(5000);

      expect(callback).toHaveBeenCalled();
    });

    it('should emit TIMER_START event', () => {
      timerService.start('timer-1', 10, vi.fn());

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.TIMER_START)).toBe(true);
    });

    it('should emit TIMER_TICK events', () => {
      timerService.start('timer-1', 3, vi.fn());

      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(1000);

      const events = eventBus.getHistory();
      const ticks = events.filter(e => e.event === LectureEvents.TIMER_TICK);
      expect(ticks.length).toBe(2);
    });

    it('should emit TIMER_END when complete', () => {
      timerService.start('timer-1', 2, vi.fn());

      vi.advanceTimersByTime(2000);

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.TIMER_END)).toBe(true);
    });

    it('should stop previous timer with same ID', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      timerService.start('timer-1', 10, callback1);
      timerService.start('timer-1', 5, callback2);

      vi.advanceTimersByTime(5000);

      expect(callback2).toHaveBeenCalled();
      expect(callback1).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop timer without callback', () => {
      const callback = vi.fn();
      timerService.start('timer-1', 5, callback);
      timerService.stop('timer-1');

      vi.advanceTimersByTime(10000);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('skip', () => {
    it('should stop timer and call callback immediately', () => {
      const callback = vi.fn();
      timerService.start('timer-1', 60, callback);
      timerService.skip('timer-1');

      expect(callback).toHaveBeenCalled();
    });

    it('should emit TIMER_SKIP event', () => {
      timerService.start('timer-1', 60, vi.fn());
      timerService.skip('timer-1');

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.TIMER_SKIP)).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('should return remaining seconds', () => {
      timerService.start('timer-1', 10, vi.fn());

      vi.advanceTimersByTime(3000);

      expect(timerService.getRemaining('timer-1')).toBe(7);
    });

    it('should return 0 for non-existent timer', () => {
      expect(timerService.getRemaining('unknown')).toBe(0);
    });
  });

  describe('isRunning', () => {
    it('should return true for running timer', () => {
      timerService.start('timer-1', 10, vi.fn());
      expect(timerService.isRunning('timer-1')).toBe(true);
    });

    it('should return false after timer completes', () => {
      timerService.start('timer-1', 2, vi.fn());
      vi.advanceTimersByTime(2000);
      expect(timerService.isRunning('timer-1')).toBe(false);
    });

    it('should return false for stopped timer', () => {
      timerService.start('timer-1', 10, vi.fn());
      timerService.stop('timer-1');
      expect(timerService.isRunning('timer-1')).toBe(false);
    });
  });

  describe('pause/resume', () => {
    it('should pause timer', () => {
      const callback = vi.fn();
      timerService.start('timer-1', 5, callback);

      vi.advanceTimersByTime(2000);
      timerService.pause('timer-1');
      vi.advanceTimersByTime(5000);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should resume timer', () => {
      const callback = vi.fn();
      timerService.start('timer-1', 5, callback);

      vi.advanceTimersByTime(2000);
      timerService.pause('timer-1');
      vi.advanceTimersByTime(2000);
      timerService.resume('timer-1');
      vi.advanceTimersByTime(3000);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('timeScale', () => {
    it('should default to 1x', () => {
      expect(timerService.getTimeScale()).toBe(1);
    });

    it('should allow setting time scale', () => {
      timerService.setTimeScale(10);
      expect(timerService.getTimeScale()).toBe(10);
    });

    it('should not allow scale below 0.1', () => {
      timerService.setTimeScale(0.01);
      expect(timerService.getTimeScale()).toBe(0.1);
    });
  });

  describe('getAllTimers', () => {
    it('should return all active timers', () => {
      timerService.start('timer-1', 10, vi.fn());
      timerService.start('timer-2', 20, vi.fn());

      const timers = timerService.getAllTimers();
      expect(timers.size).toBe(2);
      expect(timers.has('timer-1')).toBe(true);
      expect(timers.has('timer-2')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should stop all timers', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      timerService.start('timer-1', 10, cb1);
      timerService.start('timer-2', 10, cb2);
      timerService.clear();

      vi.advanceTimersByTime(20000);

      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).not.toHaveBeenCalled();
    });
  });
});

describe('InstantTimerService', () => {
  let timerService: InstantTimerService;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus({ recordHistory: true });
    timerService = new InstantTimerService(eventBus);
  });

  it('should complete immediately', async () => {
    const callback = vi.fn();
    timerService.start('timer-1', 60, callback);

    // Wait for next tick
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(callback).toHaveBeenCalled();
  });

  it('should emit TIMER_END immediately', async () => {
    timerService.start('timer-1', 60, vi.fn());

    await new Promise(resolve => setTimeout(resolve, 10));

    const events = eventBus.getHistory();
    expect(events.some(e => e.event === LectureEvents.TIMER_END)).toBe(true);
  });

  it('should track calls', () => {
    timerService.start('t1', 10, vi.fn());
    timerService.start('t2', 20, vi.fn());
    timerService.skip('t1');

    expect(timerService.calls).toHaveLength(3);
    expect(timerService.calls[0].method).toBe('start');
    expect(timerService.calls[2].method).toBe('skip');
  });

  it('should return Infinity for timeScale', () => {
    expect(timerService.getTimeScale()).toBe(Infinity);
  });

  it('should format time correctly', () => {
    expect(timerService.formatTime(90)).toBe('1:30');
  });
});
