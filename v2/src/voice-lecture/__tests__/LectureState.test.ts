/**
 * LectureState Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LectureState, LectureStateType, ElementType } from '../state/LectureState';
import { EventBus, LectureEvents } from '../utils/EventBus';

describe('LectureState', () => {
  let state: LectureState;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus({ recordHistory: true });
    state = new LectureState(eventBus);
  });

  describe('initial state', () => {
    it('should start in IDLE state', () => {
      expect(state.getState()).toBe(LectureStateType.IDLE);
    });

    it('should have no chunks initially', () => {
      expect(state.getData().chunks).toHaveLength(0);
    });

    it('should start at chunk index 0', () => {
      expect(state.getCurrentChunkIndex()).toBe(0);
    });
  });

  describe('setChunks', () => {
    it('should set chunks with correct status', () => {
      state.setChunks([
        { id: 'intro', index: 0, title: 'Intro', content: '', rawContent: '' },
        { id: 'vocab', index: 1, title: 'Vocab', content: '', rawContent: '' },
      ]);

      const data = state.getData();
      expect(data.chunks).toHaveLength(2);
      expect(data.chunks[0].status).toBe('pending');
      expect(data.chunks[1].status).toBe('pending');
    });

    it('should emit LESSON_LOAD event', () => {
      state.setChunks([
        { id: 'intro', index: 0, title: 'Intro', content: '', rawContent: '' },
      ]);

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.LESSON_LOAD)).toBe(true);
    });
  });

  describe('activateChunk', () => {
    beforeEach(() => {
      state.setChunks([
        { id: 'chunk0', index: 0, title: '', content: '', rawContent: '' },
        { id: 'chunk1', index: 1, title: '', content: '', rawContent: '' },
        { id: 'chunk2', index: 2, title: '', content: '', rawContent: '' },
      ]);
    });

    it('should set chunk as active', () => {
      state.activateChunk(1);

      const chunk = state.getChunkStatus(1);
      expect(chunk?.status).toBe('active');
    });

    it('should mark previous chunks as completed', () => {
      state.activateChunk(2);

      expect(state.getChunkStatus(0)?.status).toBe('completed');
      expect(state.getChunkStatus(1)?.status).toBe('completed');
      expect(state.getChunkStatus(2)?.status).toBe('active');
    });

    it('should update current chunk index', () => {
      state.activateChunk(1);
      expect(state.getCurrentChunkIndex()).toBe(1);
    });

    it('should emit CHUNK_ACTIVATE event', () => {
      state.activateChunk(1);

      const events = eventBus.getHistory();
      const activateEvent = events.find(e => e.event === LectureEvents.CHUNK_ACTIVATE);
      expect(activateEvent).toBeDefined();
      expect((activateEvent?.data as any).index).toBe(1);
    });

    it('should ignore invalid chunk index', () => {
      state.activateChunk(99);
      expect(state.getCurrentChunkIndex()).toBe(0);
    });
  });

  describe('teacher script flow', () => {
    beforeEach(() => {
      state.setChunks([
        { id: 'chunk0', index: 0, title: '', content: '', rawContent: '' },
      ]);
      state.activateChunk(0);
    });

    it('should transition to NPC_SPEAKING on startTS', () => {
      state.startTS('ts-1');
      expect(state.getState()).toBe(LectureStateType.NPC_SPEAKING);
    });

    it('should track current TS ID', () => {
      state.startTS('ts-1');
      expect(state.getData().currentTSId).toBe('ts-1');
    });

    it('should emit TS_START event', () => {
      state.startTS('ts-1');

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.TS_START)).toBe(true);
    });

    it('should track played TS in chunk', () => {
      state.startTS('ts-1');
      state.startTS('ts-2');

      const chunk = state.getChunkStatus(0);
      expect(chunk?.playedTS.has('ts-1')).toBe(true);
      expect(chunk?.playedTS.has('ts-2')).toBe(true);
    });
  });

  describe('timer flow', () => {
    beforeEach(() => {
      state.setChunks([
        { id: 'chunk0', index: 0, title: '', content: '', rawContent: '' },
      ]);
      state.activateChunk(0);
    });

    it('should transition to TIMER_RUNNING on startTimer', () => {
      state.startTimer();
      expect(state.getState()).toBe(LectureStateType.TIMER_RUNNING);
    });

    it('should transition to IDLE on endTimer', () => {
      state.startTimer();
      state.endTimer();
      expect(state.getState()).toBe(LectureStateType.IDLE);
    });
  });

  describe('vocabulary flow', () => {
    beforeEach(() => {
      state.setChunks([
        { id: 'chunk0', index: 0, title: '', content: '', rawContent: '' },
      ]);
      state.activateChunk(0);
    });

    it('should transition to VOCAB_ACTIVE on startVocab', () => {
      state.startVocab('vocab-1');
      expect(state.getState()).toBe(LectureStateType.VOCAB_ACTIVE);
    });

    it('should emit VOCAB_START event', () => {
      state.startVocab('vocab-1');

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.VOCAB_START)).toBe(true);
    });

    it('should transition to IDLE on endVocab', () => {
      state.startVocab('vocab-1');
      state.endVocab('vocab-1');
      expect(state.getState()).toBe(LectureStateType.IDLE);
    });

    it('should emit VOCAB_COMPLETE event', () => {
      state.startVocab('vocab-1');
      state.endVocab('vocab-1');

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.VOCAB_COMPLETE)).toBe(true);
    });
  });

  describe('chunk navigation', () => {
    beforeEach(() => {
      state.setChunks([
        { id: 'chunk0', index: 0, title: '', content: '', rawContent: '' },
        { id: 'chunk1', index: 1, title: '', content: '', rawContent: '' },
      ]);
      state.activateChunk(0);
    });

    it('should unlock navigation', () => {
      state.unlockChunkNav();
      expect(state.getState()).toBe(LectureStateType.CHUNK_DONE);
    });

    it('should emit CHUNK_COMPLETE event', () => {
      state.unlockChunkNav();

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.CHUNK_COMPLETE)).toBe(true);
    });

    it('should allow advance when chunk done', () => {
      state.unlockChunkNav();
      expect(state.canAdvance()).toBe(true);
    });

    it('should not allow advance when not done', () => {
      expect(state.canAdvance()).toBe(false);
    });

    it('should advance to next chunk', () => {
      state.unlockChunkNav();
      const result = state.advanceToNextChunk();

      expect(result).toBe(true);
      expect(state.getCurrentChunkIndex()).toBe(1);
    });

    it('should return false when no more chunks', () => {
      state.activateChunk(1);
      state.unlockChunkNav();
      const result = state.advanceToNextChunk();

      expect(result).toBe(false);
    });

    it('should mark lesson complete when no more chunks', () => {
      state.activateChunk(1);
      state.unlockChunkNav();
      state.advanceToNextChunk();

      expect(state.getState()).toBe(LectureStateType.LESSON_COMPLETE);
    });
  });

  describe('progress tracking', () => {
    beforeEach(() => {
      state.setChunks([
        { id: 'chunk0', index: 0, title: '', content: '', rawContent: '' },
        { id: 'chunk1', index: 1, title: '', content: '', rawContent: '' },
        { id: 'chunk2', index: 2, title: '', content: '', rawContent: '' },
        { id: 'chunk3', index: 3, title: '', content: '', rawContent: '' },
      ]);
    });

    it('should calculate progress correctly', () => {
      state.activateChunk(0);
      expect(state.getProgress()).toEqual({ current: 1, total: 4, percentage: 25 });

      state.activateChunk(1);
      expect(state.getProgress()).toEqual({ current: 2, total: 4, percentage: 50 });

      state.activateChunk(3);
      expect(state.getProgress()).toEqual({ current: 4, total: 4, percentage: 100 });
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      state.setChunks([
        { id: 'chunk0', index: 0, title: '', content: '', rawContent: '' },
      ]);
      state.activateChunk(0);
      state.startTS('ts-1');

      state.reset();

      expect(state.getState()).toBe(LectureStateType.IDLE);
      expect(state.getCurrentChunkIndex()).toBe(0);
      expect(state.getData().chunks).toHaveLength(0);
      expect(state.getData().currentTSId).toBeNull();
    });
  });

  describe('forceState', () => {
    it('should force state transition', () => {
      state.forceState(LectureStateType.VOCAB_ACTIVE);
      expect(state.getState()).toBe(LectureStateType.VOCAB_ACTIVE);
    });

    it('should emit state change event', () => {
      state.forceState(LectureStateType.TIMER_RUNNING);

      const events = eventBus.getHistory();
      const stateChange = events.find(e => e.event === LectureEvents.STATE_CHANGE);
      expect(stateChange).toBeDefined();
      expect((stateChange?.data as any).reason).toBe('force');
    });
  });
});
