/**
 * Voice Lecture Module - Main Entry Point
 *
 * Testable, modular voice lecture system with dependency injection.
 */

// Core controller
export {
  VoiceLectureController,
  createVoiceLectureController,
  createTestController,
  type VoiceLectureConfig,
  type VoiceLectureControllerInterface,
} from './VoiceLectureController';

// Event system
export {
  EventBus,
  getEventBus,
  resetEventBus,
  LectureEvents,
  type EventBusInterface,
  type LectureEventName,
} from './utils/EventBus';

// Services
export {
  AudioService,
  MockAudioService,
  createAudioService,
  type AudioServiceInterface,
  type AudioServiceConfig,
} from './services/AudioService';

export {
  TimerService,
  InstantTimerService,
  createTimerService,
  type TimerServiceInterface,
  type TimerConfig,
  type TimerInstance,
} from './services/TimerService';

// State
export {
  LectureState,
  createLectureState,
  LectureStateType,
  ElementType,
  type LectureStateInterface,
  type LectureStateData,
  type ChunkStatus,
} from './state/LectureState';

// Vocabulary
export {
  VocabSystem,
  createVocabSystem,
  type VocabSystemInterface,
  type VocabSystemConfig,
  type VocabInstance,
  type VocabPhase,
} from './components/VocabSystem';

// Parser
export {
  parseLesson,
  parseChunks,
  parseVocabulary,
  parseTeacherScript,
  parseTitle,
  renderMarkdown,
  renderTables,
  renderFullContent,
  CUSTOM_TAGS,
  extractVocabularySections,
  extractTeacherScripts,
  validateLesson,
  hasTag,
  getTagContent,
  type ParsedLesson,
  type ParsedChunk,
  type VocabularyWord,
  type TeacherScript,
  type ValidationResult,
} from './parser/Parser';
