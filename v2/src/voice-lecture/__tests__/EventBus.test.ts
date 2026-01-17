/**
 * EventBus Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus, LectureEvents } from '../utils/EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('on/emit', () => {
    it('should call listener when event is emitted', () => {
      const callback = vi.fn();
      eventBus.on('test', callback);
      eventBus.emit('test', { data: 'hello' });

      expect(callback).toHaveBeenCalledWith({ data: 'hello' });
    });

    it('should support multiple listeners for same event', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('test', callback1);
      eventBus.on('test', callback2);
      eventBus.emit('test', 'data');

      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });

    it('should not call listeners for different events', () => {
      const callback = vi.fn();
      eventBus.on('event1', callback);
      eventBus.emit('event2', 'data');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove listener', () => {
      const callback = vi.fn();
      eventBus.on('test', callback);
      eventBus.off('test', callback);
      eventBus.emit('test', 'data');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function from on()', () => {
      const callback = vi.fn();
      const unsubscribe = eventBus.on('test', callback);

      unsubscribe();
      eventBus.emit('test', 'data');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should call listener only once', () => {
      const callback = vi.fn();
      eventBus.once('test', callback);

      eventBus.emit('test', 'first');
      eventBus.emit('test', 'second');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
    });
  });

  describe('clear', () => {
    it('should remove all listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      eventBus.on('event1', callback1);
      eventBus.on('event2', callback2);
      eventBus.clear();

      eventBus.emit('event1', 'data');
      eventBus.emit('event2', 'data');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('history recording', () => {
    it('should not record history by default', () => {
      eventBus.emit('test', 'data');
      expect(eventBus.getHistory()).toHaveLength(0);
    });

    it('should record history when enabled', () => {
      const bus = new EventBus({ recordHistory: true });
      bus.emit('test', { value: 123 });

      const history = bus.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].event).toBe('test');
      expect(history[0].data).toEqual({ value: 123 });
      expect(history[0].timestamp).toBeDefined();
    });

    it('should record multiple events', () => {
      const bus = new EventBus({ recordHistory: true });
      bus.emit('event1', 'a');
      bus.emit('event2', 'b');
      bus.emit('event1', 'c');

      expect(bus.getHistory()).toHaveLength(3);
    });
  });

  describe('error handling', () => {
    it('should not throw if listener throws', () => {
      const badCallback = () => { throw new Error('oops'); };
      const goodCallback = vi.fn();

      eventBus.on('test', badCallback);
      eventBus.on('test', goodCallback);

      expect(() => eventBus.emit('test', 'data')).not.toThrow();
      expect(goodCallback).toHaveBeenCalled();
    });
  });

  describe('LectureEvents constants', () => {
    it('should have all expected event names', () => {
      expect(LectureEvents.CHUNK_ACTIVATE).toBe('chunk:activate');
      expect(LectureEvents.TS_START).toBe('ts:start');
      expect(LectureEvents.TIMER_START).toBe('timer:start');
      expect(LectureEvents.VOCAB_START).toBe('vocab:start');
      expect(LectureEvents.LESSON_COMPLETE).toBe('lesson:complete');
    });
  });
});
