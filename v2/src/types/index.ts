// Core Type Definitions for English Learning App V2

export enum ExerciseType {
  // Comprehension Exercises
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_IN_BLANKS = 'fill_in_blanks',
  SHORT_ANSWER = 'short_answer',
  ESSAY = 'essay',
  
  // Vocabulary Exercises
  VOCABULARY_MATCHING = 'vocabulary_matching',
  VOCABULARY_DEFINITION = 'vocabulary_definition',
  VOCABULARY_PRONUNCIATION = 'vocabulary_pronunciation',
  VOCABULARY_USAGE = 'vocabulary_usage',
  WORD_FORMATION = 'word_formation',
  
  // Grammar Exercises
  GRAMMAR_TRANSFORMATION = 'grammar_transformation',
  SENTENCE_REORDER = 'sentence_reorder',
  ERROR_CORRECTION = 'error_correction',
  GAP_FILL_GRAMMAR = 'gap_fill_grammar',
  
  // Listening Exercises
  LISTENING_COMPREHENSION = 'listening_comprehension',
  DICTATION = 'dictation',
  AUDIO_MATCHING = 'audio_matching',
  
  // Speaking Exercises
  PRONUNCIATION_PRACTICE = 'pronunciation_practice',
  DIALOGUE_COMPLETION = 'dialogue_completion',
  ORAL_PRESENTATION = 'oral_presentation',
  
  // Reading Exercises
  READING_COMPREHENSION = 'reading_comprehension',
  PASSAGE_COMPLETION = 'passage_completion',
  INFORMATION_MATCHING = 'information_matching',
  
  // Writing Exercises
  SENTENCE_WRITING = 'sentence_writing',
  PARAGRAPH_WRITING = 'paragraph_writing',
  LETTER_WRITING = 'letter_writing',
  STORY_COMPLETION = 'story_completion',
  
  // Interactive Exercises
  DRAG_AND_DROP = 'drag_and_drop',
  SORTING = 'sorting',
  CROSSWORD = 'crossword',
  WORD_SEARCH = 'word_search',
}

// Lesson types for different grade levels
export enum LessonType {
  // Grades 6-9
  GETTING_STARTED = 'getting_started',
  CLOSER_LOOK_1 = 'closer_look_1',
  CLOSER_LOOK_2 = 'closer_look_2',
  COMMUNICATION = 'communication',
  SKILLS_1 = 'skills_1',
  SKILLS_2 = 'skills_2',
  LOOKING_BACK = 'looking_back',
  
  // Grades 10-12 additional
  LANGUAGE = 'language',
  READING = 'reading',
  LISTENING = 'listening',
  SPEAKING = 'speaking',
  WRITING = 'writing',
  COMMUNICATION_CULTURE = 'communication_culture',
  
  // Review lessons
  LANGUAGE_REVIEW = 'language_review',
  SKILLS_REVIEW = 'skills_review'
}

export enum DifficultyLevel {
  BEGINNER = 1,        // A1 level
  ELEMENTARY = 2,      // A2 level
  INTERMEDIATE = 3,    // B1 level
  UPPER_INTERMEDIATE = 4, // B2 level
  ADVANCED = 5,        // C1 level
  PROFICIENT = 6       // C2 level
}

export type CEFRLevel = 'A1' | 'A1-A2' | 'A2' | 'A2-B1' | 'B1' | 'B1-B2' | 'B2' | 'C1' | 'C2';

export type PartOfSpeech = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'interjection' | 'pronoun';

export type AudioAccent = 'british' | 'american' | 'australian' | 'canadian';

// Curriculum Structure
export interface Curriculum {
  metadata: CurriculumMetadata;
  grades: Grade[];
}

export interface CurriculumMetadata {
  title: string;
  version: string;
  created_date: string;
  language: string;
  publisher: string;
}

export interface Grade {
  level: number;
  cefr_level: CEFRLevel;
  metadata: GradeMetadata;
  units: Unit[];
}

export interface GradeMetadata {
  title: string;
  description: string;
  total_units: number;
  estimated_hours: number;
}

export interface Unit {
  id: string;
  title: string;
  order: number;
  metadata: UnitMetadata;
  vocabulary_bank: VocabularyItem[];
  lessons: Lesson[]; // New: structured lessons
  sections?: Section[]; // Kept for backward compatibility
  assessments: Assessment[];
  review?: ReviewUnit; // Review after every 3 units
}

export interface UnitMetadata {
  description: string;
  learning_objectives: LearningObjective[];
  estimated_duration: number; // minutes
  difficulty_progression: string;
  vocabulary_count: number;
}

export interface LearningObjective {
  id: string;
  type: 'vocabulary' | 'grammar' | 'communication' | 'listening' | 'speaking' | 'reading' | 'writing';
  text: string;
}

// Vocabulary System
export interface VocabularyItem {
  id: string;
  word: string;
  pronunciation: Pronunciation;
  definition: string;
  translation: string;
  examples: Example[];
  collocations: Collocation[];
  synonyms: Synonym[];
  word_family: RelatedWord[];
  usage_notes: string[];
  frequency: 'high' | 'medium' | 'low';
  cefr: CEFRLevel;
  part_of_speech: PartOfSpeech;
}

export interface Pronunciation {
  ipa: string;
  audio_files: AudioFile[];
}

export interface AudioFile {
  accent: AudioAccent;
  file: string;
  duration?: number;
}

export interface Example {
  text: string;
  translation: string;
  difficulty: DifficultyLevel;
}

export interface Collocation {
  phrase: string;
  frequency: 'high' | 'medium' | 'low';
}

export interface Synonym {
  word: string;
  cefr: CEFRLevel;
}

export interface RelatedWord {
  word: string;
  pos: PartOfSpeech;
  cefr: CEFRLevel;
}

// Lesson Structure (New)
export interface Lesson {
  id: string;
  type: LessonType;
  title: string;
  order: number;
  duration: number; // in minutes
  vocabulary_bank: VocabularyItem[];
  exercises: Exercise[];
  metadata: LessonMetadata;
  completed?: boolean;
  progress?: number;
}

export interface LessonMetadata {
  skills_focus?: string[];
  grammar_points?: string[];
  vocabulary_topics?: string[];
  materials_needed?: string;
  estimated_duration: number;
}

// Review unit structure
export interface ReviewUnit {
  id: string;
  title: string;
  appears_after_units: number[];
  language_review: Lesson;
  skills_review: Lesson;
}

// Section and Content Structure (Kept for backward compatibility)
export interface Section {
  id: string;
  title: string;
  order: number;
  type: 'introduction' | 'grammar' | 'vocabulary' | 'skills' | 'culture' | 'project';
  metadata: SectionMetadata;
  learning_content: LearningContent;
  exercises: Exercise[];
  vocabulary_focus: VocabularyReference[];
}

export interface SectionMetadata {
  estimated_duration: number;
  skills_focus: string;
  materials_needed: string;
}

export interface LearningContent {
  dialogues?: Dialogue[];
  reading_passages?: ReadingPassage[];
  audio_content?: AudioContent[];
}

export interface Dialogue {
  id: string;
  type: string;
  metadata: DialogueMetadata;
  exchanges: Exchange[];
  comprehension_questions: Question[];
}

export interface DialogueMetadata {
  title: string;
  context: string;
  setting: string;
  characters: Character[];
  audio_file: string;
  duration: number;
}

export interface Character {
  name: string;
  role: string;
  age_group: string;
}

export interface Exchange {
  id: string;
  speaker: string;
  timestamp: number;
  text: string;
  translation: string;
  pronunciation_guide: string;
  vocabulary_refs: VocabularyReference[];
  grammar_points: GrammarPoint[];
  intonation: IntonationInfo;
}

export interface VocabularyReference {
  id: string;
  emphasis?: boolean;
}

export interface GrammarPoint {
  type: string;
  description: string;
}

export interface IntonationInfo {
  pattern: string;
  emotion: string;
}

// Exercise System
export interface Exercise {
  id: string;
  type: ExerciseType;
  difficulty: DifficultyLevel;
  estimated_time: number;
  points: number;
  metadata: ExerciseMetadata;
  question: Question;
  validation: ValidationRules;
  learning_analytics: AnalyticsConfig;
}

export interface ExerciseMetadata {
  title: string;
  instructions: Instructions;
  prerequisite_vocabulary: VocabularyReference[];
}

export interface Instructions {
  text: string;
  translation: string;
}

export interface Question {
  text: string;
  translation: string;
  audio_cue?: string;
}

export interface ValidationRules {
  case_sensitive: boolean;
  ignore_articles: boolean;
  accept_contractions: boolean;
}

export interface AnalyticsConfig {
  track_metrics: string[];
  difficulty_adjustment: boolean;
}

// Exercise Types - Multiple Choice
export interface MultipleChoiceExercise extends Exercise {
  type: ExerciseType.MULTIPLE_CHOICE;
  options: Option[];
  feedback: Feedback;
}

export interface Option {
  id: string;
  text: string;
  translation?: string;
  correct: boolean;
  points: number;
  explanation?: string;
}

export interface Feedback {
  correct: FeedbackMessage;
  incorrect: FeedbackMessage;
}

export interface FeedbackMessage {
  text: string;
  translation: string;
  next_steps?: string;
  hint?: string;
}

// Exercise Types - Fill in Blanks
export interface FillInBlanksExercise extends Exercise {
  type: ExerciseType.FILL_IN_BLANKS;
  content: FillInBlanksContent;
}

export interface FillInBlanksContent {
  sentences: Sentence[];
  word_bank?: WordBank;
}

export interface Sentence {
  id: string;
  text: string;
  translation: string;
  blanks: Blank[];
}

export interface Blank {
  position: number;
  id: string;
  answers: Answer[];
  hints: Hint[];
  vocabulary_ref?: string;
}

export interface Answer {
  text: string;
  primary: boolean;
  alternative?: boolean;
  points: number;
}

export interface Hint {
  level: number;
  text: string;
}

export interface WordBank {
  mode: 'required' | 'optional';
  shuffle: boolean;
  words: string[];
}

// Exercise Types - Vocabulary Matching
export interface VocabularyMatchingExercise extends Exercise {
  type: ExerciseType.VOCABULARY_MATCHING;
  word_pairs: WordPair[];
}

export interface WordPair {
  id: string;
  word: VocabularyReference;
  definition: string;
  translation: string;
}

// Assessment System
export interface Assessment {
  id: string;
  type: 'unit_test' | 'quiz' | 'final_exam';
  mode: 'formative' | 'summative';
  metadata: AssessmentMetadata;
  test_sections: TestSection[];
  grading_criteria: GradingCriterion[];
  feedback_rules: FeedbackRule[];
}

export interface AssessmentMetadata {
  title: string;
  description: string;
  duration: number;
  total_points: number;
  passing_score: number;
  attempts_allowed: number;
  randomize_questions: boolean;
}

export interface TestSection {
  id: string;
  title: string;
  points: number;
  time_limit: number;
  instructions: Instructions;
  exercise_refs: ExerciseReference[];
}

export interface ExerciseReference {
  id: string;
  weight: number;
}

export interface GradingCriterion {
  category: string;
  weight: number;
}

export interface FeedbackRule {
  score_range: string;
  message: string;
  recommendation: string;
}

// Audio and Media
export interface MediaAssets {
  audio_files: MediaFile[];
  image_files: MediaFile[];
  video_files: MediaFile[];
}

export interface MediaFile {
  id: string;
  path: string;
  duration?: number;
  format?: string;
  bitrate?: string;
  speakers?: number;
  transcript_available?: boolean;
  alt_text?: string;
  width?: number;
  height?: number;
  quality?: string;
  subtitles_available?: boolean;
}

// User Progress and Analytics
export interface UserProgress {
  user_id: string;
  grade: number;
  current_unit: string;
  current_section: string;
  completed_exercises: string[];
  vocabulary_learned: string[];
  quiz_scores: QuizScore[];
  learning_streak: number;
  total_time_spent: number;
  last_activity: string;
}

export interface QuizScore {
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  completed_at: string;
  time_taken: number;
}

// Component Props Types
export interface ComponentProps {
  className?: string;
  id?: string;
}

export interface MarkdownViewerProps extends ComponentProps {
  content: string;
  onVocabularyClick: (word: VocabularyItem) => void;
  highlightVocabulary: boolean;
  currentUnit?: Unit;
}

export interface VocabularyCardProps extends ComponentProps {
  word: VocabularyItem;
  showTranslation: boolean;
  onPronounce: (audioUrl: string) => void;
  onSelect: (word: VocabularyItem) => void;
  selected?: boolean;
}

export interface QuizGeneratorProps extends ComponentProps {
  exercises: Exercise[];
  onQuizComplete: (results: QuizResults) => void;
  maxQuestions?: number;
  timeLimit?: number;
}

export interface QuizResults {
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  correctAnswers: number;
  totalQuestions: number;
  exerciseResults: ExerciseResult[];
}

export interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  timeSpent: number;
  hintsUsed: number;
}

export interface AudioPlayerProps extends ComponentProps {
  audioUrl: string;
  autoPlay?: boolean;
  loop?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export interface RecentLessonsProps extends ComponentProps {
  recentLessons: RecentLesson[];
  onLessonSelect: (lesson: RecentLesson) => void;
}

// Content Adder Form Interface
export interface ContentAdderForm {
  grade: number; // 6-12
  unit: number; // 1-12
  unitTitle: string;
  lesson: LessonType;
  content: string;
  source: 'loigiahay' | 'manual' | 'textbook';
  autoProcess: boolean;
}

export interface ContentAdderProps extends ComponentProps {
  onContentSave: (content: ContentAdderForm) => void;
  onCancel: () => void;
}

export interface RecentLesson {
  id: string;
  title: string;
  grade: number;
  unit: string;
  section: string;
  lastAccessed: string;
  progress: number;
  vocabularyCount: number;
  exercisesCompleted: number;
  totalExercises: number;
}

// Event System
export interface EventBusEvents {
  'vocabulary-click': VocabularyItem;
  'pronunciation-play': string;
  'exercise-complete': ExerciseResult;
  'quiz-start': string;
  'quiz-complete': QuizResults;
  'section-change': string;
  'content-load': Unit;
  'error': Error;
}

export type EventCallback<T> = (data: T) => void;

// Storage and Caching
export interface StorageItem<T> {
  data: T;
  timestamp: number;
  expiry?: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  strategy?: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ContentLoadResponse extends APIResponse<Unit> {
  data: Unit;
}

export interface VocabularySearchResponse extends APIResponse<VocabularyItem[]> {
  data: VocabularyItem[];
  total: number;
  page: number;
  pageSize: number;
}

// Reading Passage
export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  translation: string;
  difficulty: DifficultyLevel;
  topic: string;
  vocabulary_focus: VocabularyReference[];
  comprehension_questions: Question[];
}

// Audio Content
export interface AudioContent {
  id: string;
  title: string;
  audio_file: string;
  transcript: string;
  duration: number;
  speakers: Character[];
  vocabulary_focus: VocabularyReference[];
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Global Constants
export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg'] as const;
export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'svg'] as const;
export const SUPPORTED_VIDEO_FORMATS = ['mp4', 'webm'] as const;

export const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A1-A2', 'A2', 'A2-B1', 'B1', 'B1-B2', 'B2', 'C1', 'C2'];

export const GRADE_LEVELS = [6, 7, 8, 9, 10, 11, 12] as const;

export const EXERCISE_TYPE_CATEGORIES = {
  comprehension: [ExerciseType.MULTIPLE_CHOICE, ExerciseType.TRUE_FALSE, ExerciseType.READING_COMPREHENSION],
  vocabulary: [ExerciseType.VOCABULARY_MATCHING, ExerciseType.VOCABULARY_DEFINITION, ExerciseType.WORD_FORMATION],
  grammar: [ExerciseType.GRAMMAR_TRANSFORMATION, ExerciseType.ERROR_CORRECTION, ExerciseType.GAP_FILL_GRAMMAR],
  listening: [ExerciseType.LISTENING_COMPREHENSION, ExerciseType.DICTATION, ExerciseType.AUDIO_MATCHING],
  speaking: [ExerciseType.PRONUNCIATION_PRACTICE, ExerciseType.DIALOGUE_COMPLETION],
  writing: [ExerciseType.SENTENCE_WRITING, ExerciseType.PARAGRAPH_WRITING, ExerciseType.ESSAY],
  interactive: [ExerciseType.DRAG_AND_DROP, ExerciseType.SORTING, ExerciseType.CROSSWORD]
} as const;