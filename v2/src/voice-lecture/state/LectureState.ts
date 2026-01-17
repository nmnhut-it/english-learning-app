/**
 * LectureState - Pure state machine for lecture flow
 *
 * Manages state transitions independently of DOM/UI.
 * All state changes emit events for UI updates.
 */

import { EventBus, LectureEvents } from '../utils/EventBus';
import { ParsedChunk } from '../parser/Parser';

export enum LectureStateType {
  IDLE = 'idle',
  NPC_SPEAKING = 'npc_speaking',
  NPC_WAITING = 'npc_waiting',
  TIMER_RUNNING = 'timer_running',
  CONTENT_VIEWING = 'content_viewing',
  VOCAB_ACTIVE = 'vocab_active',
  CHUNK_DONE = 'chunk_done',
  LESSON_COMPLETE = 'lesson_complete',
}

export enum ElementType {
  TS = 'ts',
  VOCAB = 'vocab',
  CONTENT = 'content',
  CHUNK_NAV = 'chunkNav',
  NONE = 'none',
}

export interface ChunkStatus {
  index: number;
  id: string;
  status: 'pending' | 'active' | 'completed';
  currentTSIndex: number;
  totalTS: number;
  playedTS: Set<string>;
}

export interface LectureStateData {
  state: LectureStateType;
  currentChunkIndex: number;
  currentTSId: string | null;
  pendingElementId: string | null;
  pendingElementType: ElementType;
  chunks: ChunkStatus[];
  isLessonComplete: boolean;
}

export interface LectureStateInterface {
  getState(): LectureStateType;
  getData(): LectureStateData;
  getCurrentChunkIndex(): number;
  getChunkStatus(index: number): ChunkStatus | null;

  // State transitions
  setChunks(chunks: ParsedChunk[]): void;
  activateChunk(index: number): void;
  startTS(tsId: string): void;
  endTS(tsId: string): void;
  startTimer(): void;
  endTimer(): void;
  startVocab(vocabId: string): void;
  endVocab(vocabId: string): void;
  unlockChunkNav(): void;
  advanceToNextChunk(): boolean;
  markLessonComplete(): void;

  // Queries
  isChunkComplete(index: number): boolean;
  canAdvance(): boolean;
  getProgress(): { current: number; total: number; percentage: number };

  // For testing
  reset(): void;
  forceState(state: LectureStateType): void;
}

export class LectureState implements LectureStateInterface {
  private state: LectureStateType = LectureStateType.IDLE;
  private currentChunkIndex: number = 0;
  private currentTSId: string | null = null;
  private pendingElementId: string | null = null;
  private pendingElementType: ElementType = ElementType.NONE;
  private chunks: ChunkStatus[] = [];
  private isLessonComplete: boolean = false;

  private eventBus: EventBus | null;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus ?? null;
  }

  // Getters
  getState(): LectureStateType {
    return this.state;
  }

  getData(): LectureStateData {
    return {
      state: this.state,
      currentChunkIndex: this.currentChunkIndex,
      currentTSId: this.currentTSId,
      pendingElementId: this.pendingElementId,
      pendingElementType: this.pendingElementType,
      chunks: this.chunks.map((c) => ({ ...c, playedTS: new Set(c.playedTS) })),
      isLessonComplete: this.isLessonComplete,
    };
  }

  getCurrentChunkIndex(): number {
    return this.currentChunkIndex;
  }

  getChunkStatus(index: number): ChunkStatus | null {
    return this.chunks[index] ?? null;
  }

  // State transitions
  setChunks(chunks: ParsedChunk[]): void {
    this.chunks = chunks.map((chunk, index) => ({
      index,
      id: chunk.id,
      status: 'pending' as const,
      currentTSIndex: 0,
      totalTS: 0, // Will be set when chunk is parsed for TS
      playedTS: new Set<string>(),
    }));

    this.eventBus?.emit(LectureEvents.LESSON_LOAD, {
      chunkCount: chunks.length,
    });
  }

  activateChunk(index: number): void {
    if (index < 0 || index >= this.chunks.length) {
      return;
    }

    // Mark previous chunks as completed
    for (let i = 0; i < index; i++) {
      this.chunks[i].status = 'completed';
    }

    // Mark current as active
    this.chunks[index].status = 'active';
    this.currentChunkIndex = index;
    this.state = LectureStateType.IDLE;

    this.eventBus?.emit(LectureEvents.CHUNK_ACTIVATE, {
      index,
      id: this.chunks[index].id,
    });

    this.eventBus?.emit(LectureEvents.STATE_CHANGE, {
      from: this.state,
      to: LectureStateType.IDLE,
      reason: 'chunk_activate',
    });
  }

  startTS(tsId: string): void {
    const prevState = this.state;
    this.state = LectureStateType.NPC_SPEAKING;
    this.currentTSId = tsId;

    const chunk = this.chunks[this.currentChunkIndex];
    if (chunk) {
      chunk.playedTS.add(tsId);
    }

    this.eventBus?.emit(LectureEvents.TS_START, {
      tsId,
      chunkIndex: this.currentChunkIndex,
    });

    this.eventBus?.emit(LectureEvents.STATE_CHANGE, {
      from: prevState,
      to: this.state,
      reason: 'ts_start',
    });
  }

  endTS(tsId: string): void {
    if (this.currentTSId !== tsId) return;

    const prevState = this.state;
    this.currentTSId = null;

    this.eventBus?.emit(LectureEvents.TS_END, {
      tsId,
      chunkIndex: this.currentChunkIndex,
    });

    // State will be updated by timer/vocab/nav handler
  }

  startTimer(): void {
    const prevState = this.state;
    this.state = LectureStateType.TIMER_RUNNING;

    this.eventBus?.emit(LectureEvents.STATE_CHANGE, {
      from: prevState,
      to: this.state,
      reason: 'timer_start',
    });
  }

  endTimer(): void {
    const prevState = this.state;
    this.state = LectureStateType.IDLE;

    this.eventBus?.emit(LectureEvents.STATE_CHANGE, {
      from: prevState,
      to: this.state,
      reason: 'timer_end',
    });
  }

  startVocab(vocabId: string): void {
    const prevState = this.state;
    this.state = LectureStateType.VOCAB_ACTIVE;
    this.pendingElementId = vocabId;
    this.pendingElementType = ElementType.VOCAB;

    this.eventBus?.emit(LectureEvents.VOCAB_START, {
      vocabId,
      chunkIndex: this.currentChunkIndex,
    });

    this.eventBus?.emit(LectureEvents.STATE_CHANGE, {
      from: prevState,
      to: this.state,
      reason: 'vocab_start',
    });
  }

  endVocab(vocabId: string): void {
    const prevState = this.state;
    this.state = LectureStateType.IDLE;
    this.pendingElementId = null;
    this.pendingElementType = ElementType.NONE;

    this.eventBus?.emit(LectureEvents.VOCAB_COMPLETE, {
      vocabId,
      chunkIndex: this.currentChunkIndex,
    });

    this.eventBus?.emit(LectureEvents.STATE_CHANGE, {
      from: prevState,
      to: this.state,
      reason: 'vocab_end',
    });
  }

  unlockChunkNav(): void {
    const prevState = this.state;
    this.state = LectureStateType.CHUNK_DONE;

    this.eventBus?.emit(LectureEvents.CHUNK_COMPLETE, {
      index: this.currentChunkIndex,
      id: this.chunks[this.currentChunkIndex]?.id,
    });

    this.eventBus?.emit(LectureEvents.STATE_CHANGE, {
      from: prevState,
      to: this.state,
      reason: 'chunk_unlock',
    });
  }

  advanceToNextChunk(): boolean {
    const nextIndex = this.currentChunkIndex + 1;

    if (nextIndex >= this.chunks.length) {
      this.markLessonComplete();
      return false;
    }

    // Mark current as completed
    this.chunks[this.currentChunkIndex].status = 'completed';

    this.eventBus?.emit(LectureEvents.CHUNK_ADVANCE, {
      from: this.currentChunkIndex,
      to: nextIndex,
    });

    this.activateChunk(nextIndex);
    return true;
  }

  markLessonComplete(): void {
    const prevState = this.state;
    this.isLessonComplete = true;
    this.state = LectureStateType.LESSON_COMPLETE;

    // Mark all chunks as completed
    this.chunks.forEach((chunk) => {
      chunk.status = 'completed';
    });

    this.eventBus?.emit(LectureEvents.LESSON_COMPLETE, {
      totalChunks: this.chunks.length,
    });

    this.eventBus?.emit(LectureEvents.STATE_CHANGE, {
      from: prevState,
      to: this.state,
      reason: 'lesson_complete',
    });
  }

  // Queries
  isChunkComplete(index: number): boolean {
    return this.chunks[index]?.status === 'completed';
  }

  canAdvance(): boolean {
    return this.state === LectureStateType.CHUNK_DONE;
  }

  getProgress(): { current: number; total: number; percentage: number } {
    const total = this.chunks.length;
    const current = this.currentChunkIndex + 1;
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return { current, total, percentage };
  }

  // Testing helpers
  reset(): void {
    this.state = LectureStateType.IDLE;
    this.currentChunkIndex = 0;
    this.currentTSId = null;
    this.pendingElementId = null;
    this.pendingElementType = ElementType.NONE;
    this.chunks = [];
    this.isLessonComplete = false;
  }

  forceState(state: LectureStateType): void {
    const prevState = this.state;
    this.state = state;

    this.eventBus?.emit(LectureEvents.STATE_CHANGE, {
      from: prevState,
      to: state,
      reason: 'force',
    });
  }

  // Set pending element (used by orchestrator)
  setPendingElement(id: string | null, type: ElementType): void {
    this.pendingElementId = id;
    this.pendingElementType = type;
  }

  getPendingElement(): { id: string | null; type: ElementType } {
    return {
      id: this.pendingElementId,
      type: this.pendingElementType,
    };
  }
}

// Factory
export function createLectureState(eventBus?: EventBus): LectureStateInterface {
  return new LectureState(eventBus);
}
