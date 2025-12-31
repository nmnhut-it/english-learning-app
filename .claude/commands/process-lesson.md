# Process Single Lesson

Process a markdown file and convert it to structured JSON using the Universal Content Blocks schema.

## Usage
```
/process-lesson <grade> <unit> <section>
```

Example: `/process-lesson 7 1 getting-started`

## Instructions for Claude

1. **Read the tracking file**:
   ```
   Read: /home/user/english-learning-app/data/lesson-processing/TRACKING.json
   ```

2. **Find the markdown file**:
   - Check paths in order:
     - `markdown-files/g{grade}/unit-{unit:02d}/g{grade}_u{unit:02d}_{section}.md`
     - `markdown-files/formatg{grade}/unit-{unit:02d}/g{grade}_u{unit:02d}_{section}.md`
     - `markdown-files/global-success-{grade}/unit-{unit:02d}.md`

3. **Read the markdown content**

4. **Process with AI** - Extract content into blocks following the schema in `docs/AI-LESSON-SYSTEM-DESIGN.md`:
   - VocabularyBlock: All vocabulary items with word, partOfSpeech, pronunciation, meaning
   - DialogueBlock: Conversations with speaker, text, translation
   - ExerciseBlock: Identify type from 25 types, extract questions/answers
   - GrammarBlock: Formulas, usage, examples
   - ReadingBlock: Passages with vocabulary preview
   - ListeningBlock: Transcripts (mark for audio generation)
   - PronunciationBlock: Focus points and examples
   - InstructionBlock: AI teacher narration

5. **Save the output**:
   ```
   Write to: /home/user/english-learning-app/data/lesson-processing/output/g{grade}/u{unit:02d}/{section}.json
   ```

6. **Update tracking file**:
   - Set lesson status to "completed" or "failed"
   - Update timestamps
   - Add to history

7. **Report results**:
   - Number of vocabulary items extracted
   - Number of exercises found
   - Any issues or warnings

## Output Schema

```typescript
interface LessonData {
  id: string;                  // "g7-u01-getting-started"
  grade: number;
  unit: number;
  unitTitle: string;
  section: string;
  sectionTitle: string;
  sourceFile: string;          // Original markdown path
  processedAt: string;         // ISO timestamp
  estimatedDuration: number;   // Minutes
  blocks: ContentBlock[];
  stats: {
    vocabularyCount: number;
    exerciseCount: number;
    dialogueLines: number;
    hasGrammar: boolean;
    hasReading: boolean;
    hasListening: boolean;
  };
  rewards: {
    xpTotal: number;
    badges?: string[];
  };
}
```

## After Processing

Say: "✅ Processed g{grade}-u{unit}-{section}. Stats: X vocabulary, Y exercises. Run /check-progress to see overall status."
