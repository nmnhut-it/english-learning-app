# TheLostChapter - Content Schema

Complete specification for book and chapter content format.

## Book Structure

### book.json

```json
{
  "id": "string",           // Unique book identifier (matches folder name)
  "title": "string",        // Display title
  "author": "string",       // Author name(s)
  "language": "string",     // Primary language: "en", "vi", etc.
  "coverImage": "string",   // Cover image filename (in media/{bookId}/images/)
  "description": "string",  // Book description/summary
  "chapters": ["string"],   // Ordered array of chapter IDs
  "tags": ["string"],       // Optional: categorization tags
  "difficulty": "string"    // Optional: "beginner", "intermediate", "advanced"
}
```

### Chapter JSON

Located at: `content/books/{bookId}/chapters/{chapterId}.json`

```json
{
  "id": "string",           // Chapter identifier
  "title": "string",        // Chapter title
  "sections": [Section]     // Ordered array of content sections
}
```

## Section Types

### Markdown Section

Renders rich text content.

```json
{
  "type": "markdown",
  "content": "# Heading\n\nParagraph with **bold** and *italic* text."
}
```

Supported markdown:
- Headings (#, ##, ###)
- Bold (**text**)
- Italic (*text*)
- Links ([text](url))
- Blockquotes (> text)
- Unordered lists (- item)
- Ordered lists (1. item)
- Inline code (`code`)
- Code blocks (```language\ncode```)

### Audio Section

Narration with optional transcript synchronization.

```json
{
  "type": "audio",
  "src": "filename.mp3",           // File in media/{bookId}/audio/
  "transcript": "Full text...",    // Optional: transcript text
  "timestamps": [                  // Optional: for transcript sync
    { "start": 0.0, "end": 3.5, "text": "First sentence." },
    { "start": 3.5, "end": 7.0, "text": "Second sentence." }
  ],
  "language": "en"                 // Optional: override book language
}
```

### Image Section

Visual content with accessibility support.

```json
{
  "type": "image",
  "src": "filename.jpg",           // File in media/{bookId}/images/ or URL
  "alt": "Image description",      // Required: accessibility text
  "caption": "Optional caption"    // Optional: visible caption
}
```

### Exercise Section

Interactive quiz elements.

```json
{
  "type": "exercise",
  "exerciseType": "string",        // See exercise types below
  "question": "string",            // Question text
  "correctFeedback": "string",     // Optional: shown on correct answer
  "incorrectFeedback": "string",   // Optional: shown on wrong answer
  // Additional fields per exercise type
}
```

### Video Section

Video content embedding.

```json
{
  "type": "video",
  "src": "filename.mp4",           // Local video file
  // OR
  "youtubeId": "dQw4w9WgXcQ"      // YouTube video ID
}
```

### Pause Section

Reading break with optional message.

```json
{
  "type": "pause",
  "duration": 3000,                // Optional: suggested pause in ms
  "message": "Take a moment..."   // Optional: display message
}
```

## Exercise Types

### multiple_choice

Single correct answer selection.

```json
{
  "type": "exercise",
  "exerciseType": "multiple_choice",
  "question": "What color is the sky?",
  "options": [
    { "text": "Blue", "correct": true },
    { "text": "Green", "correct": false },
    { "text": "Red", "correct": false }
  ]
}
```

Alternative format with correctIndex:

```json
{
  "exerciseType": "multiple_choice",
  "question": "...",
  "options": ["Blue", "Green", "Red"],
  "correctIndex": 0
}
```

### true_false

Binary choice question.

```json
{
  "exerciseType": "true_false",
  "question": "The Earth is round.",
  "options": [
    { "text": "True", "correct": true },
    { "text": "False", "correct": false }
  ]
}
```

### fill_blank

Text input completion.

```json
{
  "exerciseType": "fill_blank",
  "question": "The capital of France is _______.",
  "answer": "Paris",
  "caseSensitive": false,          // Optional: default false
  "acceptableAnswers": ["Paris"]   // Optional: alternative correct answers
}
```

### matching

Pair items together.

```json
{
  "exerciseType": "matching",
  "question": "Match the capitals to their countries:",
  "pairs": [
    { "left": "France", "right": "Paris" },
    { "left": "Japan", "right": "Tokyo" },
    { "left": "Italy", "right": "Rome" }
  ]
}
```

### ordering

Arrange items in correct sequence.

```json
{
  "exerciseType": "ordering",
  "question": "Put these in chronological order:",
  "items": [
    "Wake up",
    "Eat breakfast",
    "Go to work",
    "Return home"
  ]
}
```

### vocabulary

Word definition practice (for language learning).

```json
{
  "exerciseType": "vocabulary",
  "question": "What does 'ephemeral' mean?",
  "word": "ephemeral",
  "definition": "lasting for a very short time",
  "options": [
    { "text": "lasting forever", "correct": false },
    { "text": "lasting for a very short time", "correct": true },
    { "text": "very large", "correct": false }
  ]
}
```

### listening

Audio-based comprehension.

```json
{
  "exerciseType": "listening",
  "question": "Listen and answer: What did the speaker mention?",
  "audioSrc": "listening-exercise.mp3",
  "options": [
    { "text": "Option A", "correct": false },
    { "text": "Option B", "correct": true }
  ]
}
```

## Media Organization

```
content/
├── books/
│   ├── index.json              # Library catalog
│   └── {book-id}/
│       ├── book.json           # Book metadata
│       └── chapters/
│           ├── ch01.json
│           └── ch02.json
└── media/
    └── {book-id}/
        ├── audio/
        │   ├── ch01-intro.mp3
        │   └── ch01-narration.mp3
        └── images/
            ├── cover.jpg
            └── chapter-image.jpg
```

## Library Index

`content/books/index.json`:

```json
{
  "books": [
    {
      "id": "book-1",
      "title": "Book Title",
      "author": "Author Name",
      "language": "en",
      "coverImage": "cover.jpg",
      "description": "Book description"
    }
  ]
}
```

## Validation Rules

1. **Required Fields**
   - book.json: id, title, chapters
   - chapter.json: id, title, sections
   - Each section: type + type-specific required fields

2. **File References**
   - Audio src must exist in media/{bookId}/audio/
   - Image src must exist in media/{bookId}/images/
   - External URLs (http/https) are allowed

3. **Exercise Validation**
   - multiple_choice: must have options with exactly one correct
   - fill_blank: must have answer field
   - matching: must have pairs array
   - ordering: must have items array

4. **Best Practices**
   - Include alt text for all images
   - Include transcripts for all audio
   - Provide feedback text for exercises
   - Use timestamps for audio sync

## TypeScript Interfaces

```typescript
interface Book {
  id: string;
  title: string;
  author?: string;
  language: string;
  coverImage?: string;
  description?: string;
  chapters: string[];
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface Chapter {
  id: string;
  title: string;
  sections: Section[];
}

type Section =
  | MarkdownSection
  | AudioSection
  | ImageSection
  | ExerciseSection
  | VideoSection
  | PauseSection;

interface MarkdownSection {
  type: 'markdown';
  content: string;
}

interface AudioSection {
  type: 'audio';
  src: string;
  transcript?: string;
  timestamps?: Timestamp[];
  language?: string;
}

interface Timestamp {
  start: number;
  end: number;
  text: string;
}

interface ImageSection {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

interface ExerciseSection {
  type: 'exercise';
  exerciseType: ExerciseType;
  question: string;
  correctFeedback?: string;
  incorrectFeedback?: string;
  // Type-specific fields...
}

type ExerciseType =
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'vocabulary'
  | 'listening';

interface VideoSection {
  type: 'video';
  src?: string;
  youtubeId?: string;
}

interface PauseSection {
  type: 'pause';
  duration?: number;
  message?: string;
}
```
