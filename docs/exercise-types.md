# Exercise Types Documentation

## Overview
This document defines all exercise types supported by the V2 English Learning App, their XML structure, rendering requirements, and interaction patterns.

## Exercise Type Enum

```typescript
enum ExerciseType {
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
```

## Exercise Difficulty Levels

```typescript
enum DifficultyLevel {
  BEGINNER = 1,        // A1 level
  ELEMENTARY = 2,      // A2 level
  INTERMEDIATE = 3,    // B1 level
  UPPER_INTERMEDIATE = 4, // B2 level
  ADVANCED = 5,        // C1 level
  PROFICIENT = 6       // C2 level
}
```

## Exercise Definitions

### 1. Multiple Choice (`multiple_choice`)

**Description:** Traditional multiple choice questions with one correct answer.

**XML Structure:**
```xml
<exercise id="mc001" type="multiple_choice" difficulty="2">
  <question>
    <text>What are Trang and Ann talking about?</text>
    <translation>Trang và Ann đang nói về điều gì?</translation>
  </question>
  <options>
    <option id="a" correct="true">Hobbies</option>
    <option id="b">School subjects</option>
    <option id="c">Leisure time</option>
    <option id="d">Weekend plans</option>
  </options>
  <feedback>
    <correct>Excellent! The conversation focuses on their hobbies and interests.</correct>
    <incorrect>Review the dialogue again. Pay attention to what they discuss about their activities.</incorrect>
  </feedback>
  <vocabulary_focus>
    <ref id="hobby"/>
    <ref id="dollhouse"/>
  </vocabulary_focus>
</exercise>
```

**Rendering Requirements:**
- Display question text with translation toggle
- Show options as radio buttons or clickable cards
- Highlight correct/incorrect answers on submission
- Show appropriate feedback message
- Track vocabulary words referenced

---

### 2. Fill in the Blanks (`fill_in_blanks`)

**Description:** Complete sentences or passages by filling in missing words.

**XML Structure:**
```xml
<exercise id="fib001" type="fill_in_blanks" difficulty="2">
  <question>
    <text>Complete the sentences with the correct words</text>
    <translation>Hoàn thành câu với những từ đúng</translation>
  </question>
  <sentences>
    <sentence>
      <text>My _______ is building dollhouses.</text>
      <translation>Sở thích của tôi là xây dựng nhà búp bê.</translation>
      <blank position="1" answer="hobby" alternatives="hobbies,interest"/>
      <vocabulary_refs>
        <ref id="hobby"/>
        <ref id="build"/>
        <ref id="dollhouse"/>
      </vocabulary_refs>
    </sentence>
    <sentence>
      <text>She needs some _______ and glue to build it.</text>
      <translation>Cô ấy cần một ít bìa cứng và keo để xây dựng nó.</translation>
      <blank position="1" answer="cardboard" alternatives="paper"/>
    </sentence>
  </sentences>
  <word_bank>
    <word>hobby</word>
    <word>cardboard</word>
    <word>creativity</word>
    <word>unusual</word>
  </word_bank>
</exercise>
```

**Rendering Requirements:**
- Show sentences with input fields for blanks
- Optional word bank for drag-and-drop or selection
- Accept alternative answers if specified
- Provide immediate feedback on each blank

---

### 3. Vocabulary Matching (`vocabulary_matching`)

**Description:** Match vocabulary words with their definitions or translations.

**XML Structure:**
```xml
<exercise id="vm001" type="vocabulary_matching" difficulty="2">
  <question>
    <text>Match the vocabulary words with their meanings</text>
    <translation>Nối các từ vựng với ý nghĩa của chúng</translation>
  </question>
  <word_pairs>
    <pair id="1">
      <word ref_id="creativity"/>
      <definition>the ability to produce original ideas</definition>
      <translation>khả năng tạo ra những ý tưởng độc đáo</translation>
    </pair>
    <pair id="2">
      <word ref_id="unusual"/>
      <definition>not common or ordinary</definition>
      <translation>không phổ biến hoặc bình thường</translation>
    </pair>
    <pair id="3">
      <word ref_id="common"/>
      <definition>occurring frequently</definition>
      <translation>xảy ra thường xuyên</translation>
    </pair>
  </word_pairs>
  <feedback>
    <general>Practice these vocabulary words by using them in sentences.</general>
  </feedback>
</exercise>
```

**Rendering Requirements:**
- Two columns: words and definitions
- Drag-and-drop or click-to-connect interface
- Visual connections between matched pairs
- Shuffle order for each attempt

---

### 4. True/False (`true_false`)

**Description:** Determine whether statements are true or false based on content.

**XML Structure:**
```xml
<exercise id="tf001" type="true_false" difficulty="1">
  <question>
    <text>Read the conversation and mark T (True) or F (False)</text>
    <translation>Đọc bài hội thoại và đánh dấu Đúng (T) hay Sai (F)</translation>
  </question>
  <statements>
    <statement id="1" correct="false">
      <text>Trang needs help with building dollhouses.</text>
      <translation>Trang cần giúp đỡ để xây nhà búp bê.</translation>
      <explanation>Trang can build dollhouses herself and doesn't need help.</explanation>
    </statement>
    <statement id="2" correct="true">
      <text>Ann goes to a horse riding club every Sunday.</text>
      <translation>Ann đi câu lạc bộ cưỡi ngựa mỗi Chủ Nhật.</translation>
      <explanation>Ann mentions she goes to the Riders' Club every Sunday.</explanation>
    </statement>
  </statements>
</exercise>
```

**Rendering Requirements:**
- List statements with True/False toggle buttons
- Show explanations after submission
- Color-code correct/incorrect responses

---

### 5. Listening Comprehension (`listening_comprehension`)

**Description:** Answer questions based on audio content.

**XML Structure:**
```xml
<exercise id="lc001" type="listening_comprehension" difficulty="3">
  <audio>
    <file format="mp3">audio/unit01/dialogue01.mp3</file>
    <transcript>
      <text>Ann: Your house is very nice, Trang...</text>
      <translation>Ann: Nhà của bạn rất đẹp, Trang...</translation>
    </transcript>
    <playback_controls allow_repeat="true" show_transcript="false"/>
  </audio>
  <questions>
    <question type="multiple_choice">
      <text>What does Ann compliment Trang about?</text>
      <options>
        <option correct="true">Her house</option>
        <option>Her dollhouse</option>
        <option>Her room</option>
      </options>
    </question>
    <question type="short_answer">
      <text>What is Trang's hobby?</text>
      <answer>building dollhouses</answer>
      <alternatives>making dollhouses,creating dollhouses</alternatives>
    </question>
  </questions>
</exercise>
```

**Rendering Requirements:**
- Audio player with play/pause/repeat controls
- Optional transcript toggle
- Questions appear after audio interaction
- Track listening attempts and time

---

### 6. Grammar Transformation (`grammar_transformation`)

**Description:** Transform sentences according to grammar rules.

**XML Structure:**
```xml
<exercise id="gt001" type="grammar_transformation" difficulty="4">
  <grammar_point>
    <topic>Present Simple to Present Continuous</topic>
    <explanation>Transform the sentences from present simple to present continuous.</explanation>
  </grammar_point>
  <transformations>
    <transformation>
      <original>She plays guitar every day.</original>
      <instruction>Change to present continuous (now)</instruction>
      <answer>She is playing guitar now.</answer>
      <alternatives>She's playing guitar now.</alternatives>
      <pattern>Subject + is/are + verb-ing + complement</pattern>
    </transformation>
  </transformations>
</exercise>
```

**Rendering Requirements:**
- Show original sentence clearly
- Provide transformation instruction
- Accept multiple correct forms
- Show grammar pattern after answer

---

### 7. Pronunciation Practice (`pronunciation_practice`)

**Description:** Practice pronunciation with audio feedback.

**XML Structure:**
```xml
<exercise id="pp001" type="pronunciation_practice" difficulty="2">
  <words>
    <word id="creativity">
      <text>creativity</text>
      <phonetic>/ˌkriːeɪˈtɪvɪti/</phonetic>
      <audio_model>audio/pronunciation/creativity_model.mp3</audio_model>
      <syllables>
        <syllable stress="0">cre</syllable>
        <syllable stress="0">a</syllable>
        <syllable stress="1">tiv</syllable>
        <syllable stress="0">i</syllable>
        <syllable stress="0">ty</syllable>
      </syllables>
      <common_errors>
        <error>Misplacing stress on first syllable</error>
        <error>Pronouncing /eɪ/ as /e/</error>
      </common_errors>
    </word>
  </words>
  <recording_settings>
    <duration_limit>5</duration_limit>
    <attempts_allowed>3</attempts_allowed>
    <feedback_type>visual_waveform</feedback_type>
  </recording_settings>
</exercise>
```

**Rendering Requirements:**
- Audio playback for model pronunciation
- Recording capability with visual feedback
- Phonetic transcription display
- Syllable stress indicators

---

## Component Mapping

Each exercise type maps to specific UI components:

```typescript
const ExerciseComponents = {
  [ExerciseType.MULTIPLE_CHOICE]: 'MultipleChoiceComponent',
  [ExerciseType.TRUE_FALSE]: 'TrueFalseComponent',
  [ExerciseType.FILL_IN_BLANKS]: 'FillInBlanksComponent',
  [ExerciseType.VOCABULARY_MATCHING]: 'VocabularyMatchingComponent',
  [ExerciseType.LISTENING_COMPREHENSION]: 'ListeningComprehensionComponent',
  [ExerciseType.GRAMMAR_TRANSFORMATION]: 'GrammarTransformationComponent',
  [ExerciseType.PRONUNCIATION_PRACTICE]: 'PronunciationPracticeComponent',
  // ... more mappings
};
```

## Validation Rules

### Common Validation
- All exercises must have `id`, `type`, and `difficulty`
- Questions must have both `text` and `translation`
- Feedback messages should be appropriate for difficulty level

### Type-Specific Validation
- **Multiple Choice**: 2-6 options, exactly one correct
- **Fill in Blanks**: At least one blank per sentence
- **Vocabulary Matching**: Equal number of words and definitions
- **Listening**: Audio file must exist and be accessible

## Accessibility Requirements

- All exercises support keyboard navigation
- Screen reader compatible with proper ARIA labels
- High contrast mode support
- Text scaling up to 200% without loss of functionality
- Audio controls accessible via keyboard

## Performance Considerations

- Lazy load audio files on demand
- Cache exercise definitions in localStorage
- Debounce user input for real-time feedback
- Optimize large vocabulary matching exercises

## Future Exercise Types

Planned for future versions:
- Interactive dialogues with branching
- Collaborative group exercises
- Video-based comprehension
- Augmented reality vocabulary
- AI-powered conversation practice