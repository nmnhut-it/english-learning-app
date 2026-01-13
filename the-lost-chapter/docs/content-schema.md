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

### Chapter Structure (ch01.json)

```json
{
  "id": "string",           // Must match filename (without .json)
  "title": "string",        // Chapter title
  "sections": [Section]     // Array of content sections
}
```

## Section Types

### Audio Section

Narrated audio with optional text sync.

```json
{
  "type": "audio",
  "src": "string",          // Audio filename or URL
  "transcript": "string",   // Full text transcript
  "timestamps": [           // Optional: word/sentence timing
    {
      "start": 0.0,         // Start time in seconds
      "end": 2.5,           // End time in seconds
      "text": "string"      // Text segment
    }
  ],
  "language": "string"      // Optional: override book language
}
```

### Markdown Section

Rich text content using Markdown.

```json
{
  "type": "markdown",
  "content": "string"        // Markdown-formatted text
}
```

**Supported Markdown:**
- Headers: `#`, `##`, `###`
- Bold: `**text**` or `__text__`
- Italic: `*text*` or `_text_`
- Links: `[text](url)`
- Images: `![alt](url)`
- Lists: `- item` or `1. item`
- Blockquotes: `> quote`
- Code: `` `inline` `` or ``` ```block``` ```
- Tables: `| col | col |`
- Horizontal rules: `---`

### Image Section

Display images with captions.

```json
{
  "type": "image",
  "src": "string",          // Image filename or URL
  "alt": "string",          // Alt text for accessibility
  "caption": "string"       // Optional: image caption
}
```

### Exercise Section

Interactive exercises with feedback.

```json
{
  "type": "exercise",
  "exerciseType": "string", // See Exercise Types below
  "question": "string",     // Question text
  "options": ["string"],    // Answer options (for choice types)
  "correct": 0,             // Correct answer index or value
  "answer": "string",       // For fill_blank: expected answer
  "feedback": {
    "correct": "string",    // Feedback for correct answer
    "incorrect": "string"   // Feedback for wrong answer
  },
  "hints": ["string"]       // Optional: progressive hints
}
```

### Video Section

Embedded video content.

```json
{
  "type": "video",
  "src": "string",          // Video filename or URL
  "caption": "string",      // Optional: video caption
  "poster": "string"        // Optional: poster image
}
```

### Pause Section

Reading break/reflection point.

```json
{
  "type": "pause",
  "message": "string",      // Prompt or instruction
  "duration": 30            // Optional: suggested duration in seconds
}
```

## Exercise Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `multiple_choice` | Select one option | `options`, `correct` (index) |
| `true_false` | True/False question | `correct` (0=True, 1=False) |
| `fill_blank` | Type the answer | `answer` |
| `matching` | Match pairs | `pairs` |
| `ordering` | Order items correctly | `items`, `correct` (ordered indices) |
| `vocabulary` | Word definition quiz | `options`, `correct` |
| `listening` | Audio comprehension | `audio`, `options`, `correct` |

### Multiple Choice Example

```json
{
  "type": "exercise",
  "exerciseType": "multiple_choice",
  "question": "What color is the sky?",
  "options": ["Red", "Blue", "Green", "Yellow"],
  "correct": 1,
  "feedback": {
    "correct": "That's right! The sky appears blue.",
    "incorrect": "Think about what you see when you look up on a clear day."
  }
}
```

### Fill Blank Example

```json
{
  "type": "exercise",
  "exerciseType": "fill_blank",
  "question": "The sun rises in the _____.",
  "answer": "east",
  "feedback": {
    "correct": "Correct! The sun rises in the east.",
    "incorrect": "Think about which direction the sun comes from in the morning."
  }
}
```

### Matching Example

```json
{
  "type": "exercise",
  "exerciseType": "matching",
  "question": "Match the words with their meanings:",
  "pairs": [
    { "left": "ancient", "right": "very old" },
    { "left": "whisper", "right": "speak softly" },
    { "left": "sparkle", "right": "shine brightly" }
  ],
  "feedback": {
    "correct": "All matches are correct!",
    "incorrect": "Some matches are incorrect. Try again."
  }
}
```

## File Organization

```
content/
├── books/
│   └── {book-id}/
│       ├── book.json           # Book metadata
│       └── chapters/
│           ├── ch01.json       # Chapter 1 content
│           ├── ch02.json       # Chapter 2 content
│           └── ...
└── media/
    └── {book-id}/
        ├── audio/
        │   ├── ch01-intro.mp3
        │   └── ch02-narration.mp3
        └── images/
            ├── cover.jpg
            └── scene-forest.jpg
```

## Bilingual Content

For bilingual books (e.g., English with Vietnamese translations):

```json
{
  "type": "markdown",
  "content": "## Vocabulary\n\n| English | Vietnamese |\n|---------|------------|\n| adventure | cuộc phiêu lưu |\n| journey | hành trình |"
}
```

For audio with multiple language narrations:

```json
{
  "type": "audio",
  "src": "intro-en.mp3",
  "language": "en",
  "transcript": "Once upon a time..."
},
{
  "type": "audio",
  "src": "intro-vi.mp3",
  "language": "vi",
  "transcript": "Ngày xửa ngày xưa..."
}
```

## Validation Rules

1. **Book ID** must match folder name
2. **Chapter IDs** must match filenames (without .json)
3. **All chapters** listed in book.json must exist
4. **Media files** referenced must exist in media folder
5. **Exercise `correct`** index must be valid for options array
6. **Timestamps** must be in ascending order and not overlap

## TypeScript Interfaces

```typescript
interface Book {
  id: string;
  title: string;
  author: string;
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
  | AudioSection
  | MarkdownSection
  | ImageSection
  | ExerciseSection
  | VideoSection
  | PauseSection;

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

interface MarkdownSection {
  type: 'markdown';
  content: string;
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
  options?: string[];
  correct?: number;
  answer?: string;
  pairs?: { left: string; right: string }[];
  feedback?: {
    correct: string;
    incorrect: string;
  };
  hints?: string[];
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
  src: string;
  caption?: string;
  poster?: string;
}

interface PauseSection {
  type: 'pause';
  message?: string;
  duration?: number;
}
```
