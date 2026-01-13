# TheLostChapter - Development Instructions

## Project Overview
**TheLostChapter** is a minimal, framework-less audiobook platform that serves interactive learning content through GitHub Pages. It combines audio narration, images, markdown text, and interactive exercises into a streamlined learning experience.

## Philosophy
- **Minimal**: No frameworks, just vanilla JavaScript
- **Portable**: Static files served from GitHub
- **Voice-First**: Local TTS with voice cloning for personalized narration
- **Bilingual**: English and Vietnamese content support

## Quick Start

```bash
# Development
cd the-lost-chapter/
npm install
npm run dev           # Start dev server on :3010

# Content Generation
npm run tts:setup     # Setup local TTS environment
npm run tts:generate  # Generate audio from text
npm run build:book    # Build book from chapters

# Deploy
npm run build         # Build for production
npm run deploy        # Deploy to GitHub Pages
```

## Project Structure

```
the-lost-chapter/
├── CLAUDE.md                    # This file - AI development rules
├── src/
│   ├── index.html               # Entry point
│   ├── app.js                   # Main application
│   ├── components/
│   │   ├── BookReader.js        # Main reader component
│   │   ├── AudioPlayer.js       # Audio playback with sync
│   │   ├── ChapterNav.js        # Chapter navigation
│   │   ├── ContentBlock.js      # Renders content sections
│   │   ├── ExerciseBlock.js     # Interactive exercises
│   │   └── ImageViewer.js       # Image display
│   ├── services/
│   │   ├── ContentService.js    # Loads book content
│   │   ├── AudioService.js      # Audio playback control
│   │   ├── ProgressService.js   # Track reading progress
│   │   └── SyncService.js       # Audio-text synchronization
│   ├── utils/
│   │   ├── markdown.js          # Lightweight MD parser
│   │   ├── storage.js           # LocalStorage wrapper
│   │   └── dom.js               # DOM utilities
│   └── styles/
│       ├── main.css             # Core styles
│       ├── reader.css           # Reader component styles
│       └── themes/              # Color themes
│           ├── light.css
│           └── dark.css
├── content/
│   ├── books/                   # Book definitions (JSON/YAML)
│   │   └── sample-book/
│   │       ├── book.json        # Book metadata
│   │       └── chapters/
│   │           ├── ch01.json    # Chapter content
│   │           └── ch02.json
│   └── media/                   # Audio and images
│       └── sample-book/
│           ├── audio/
│           └── images/
├── tools/
│   ├── tts/
│   │   ├── README.md            # TTS setup guide
│   │   ├── generate.py          # Audio generation script
│   │   ├── clone-voice.py       # Voice cloning script
│   │   └── requirements.txt     # Python dependencies
│   ├── book-builder/
│   │   ├── build.js             # Build book from sources
│   │   └── validate.js          # Validate content
│   └── content-converter/
│       └── md-to-book.js        # Convert markdown to book
├── docs/
│   ├── content-schema.md        # Content format specification
│   ├── tts-guide.md            # Voice cloning setup
│   └── exercise-types.md        # Interactive exercise types
└── dist/                        # Built output (gitignored)
```

## Content Schema

### Book Structure (book.json)
```json
{
  "id": "story-001",
  "title": "The Lost Chapter",
  "author": "Your Name",
  "language": "en",
  "coverImage": "cover.jpg",
  "description": "An interactive learning journey",
  "chapters": ["ch01", "ch02", "ch03"]
}
```

### Chapter Structure (ch01.json)
```json
{
  "id": "ch01",
  "title": "The Beginning",
  "sections": [
    {
      "type": "audio",
      "src": "ch01-intro.mp3",
      "transcript": "Once upon a time...",
      "timestamps": [
        { "start": 0, "end": 2.5, "text": "Once upon a time" },
        { "start": 2.5, "end": 5.0, "text": "in a distant land..." }
      ]
    },
    {
      "type": "markdown",
      "content": "## The Journey Begins\n\nThis is where our story starts..."
    },
    {
      "type": "image",
      "src": "scene-01.jpg",
      "alt": "A mysterious forest",
      "caption": "The entrance to the enchanted forest"
    },
    {
      "type": "exercise",
      "exerciseType": "multiple_choice",
      "question": "What did the traveler find?",
      "options": ["A key", "A map", "A sword"],
      "correct": 1,
      "feedback": {
        "correct": "Yes! The map would guide the journey.",
        "incorrect": "Try again. Think about what helps with navigation."
      }
    }
  ]
}
```

### Section Types
| Type | Purpose | Required Fields |
|------|---------|-----------------|
| `audio` | Narration segment | `src`, `transcript` |
| `markdown` | Text content | `content` |
| `image` | Visual element | `src`, `alt` |
| `exercise` | Interactive quiz | `exerciseType`, `question` |
| `video` | Video content | `src` |
| `pause` | Reading break | `duration` |

### Exercise Types
```javascript
const ExerciseTypes = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
  MATCHING: 'matching',
  ORDERING: 'ordering',
  VOCABULARY: 'vocabulary',
  LISTENING: 'listening'
};
```

## TTS Voice Cloning Setup

### Recommended: Coqui XTTS v2
Best open-source option for voice cloning with Vietnamese support.

```bash
# Setup (one-time)
cd tools/tts/
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Clone your voice (needs 6+ seconds of clean audio)
python clone-voice.py --sample your-voice.wav --output voices/my-voice/

# Generate audio
python generate.py \
  --text "Your text here" \
  --voice voices/my-voice/ \
  --lang en \
  --output output.mp3
```

### Alternative TTS Options
| Engine | Pros | Cons |
|--------|------|------|
| **XTTS v2** | Best cloning, multi-lang | Requires GPU |
| **OpenVoice** | Fast cloning | Less natural |
| **StyleTTS 2** | Very natural | English only |
| **Edge TTS** | Free, no setup | No cloning |

## Component Architecture

### Base Pattern
```javascript
// Minimal component pattern - no classes needed for simple cases
export function createAudioPlayer(container, options = {}) {
  const state = {
    playing: false,
    currentTime: 0,
    duration: 0
  };

  const elements = {
    audio: document.createElement('audio'),
    playBtn: document.createElement('button'),
    progress: document.createElement('div')
  };

  function render() {
    container.innerHTML = '';
    container.className = 'audio-player';
    // Build DOM...
  }

  function bindEvents() {
    elements.playBtn.addEventListener('click', toggle);
    elements.audio.addEventListener('timeupdate', updateProgress);
  }

  function toggle() {
    state.playing ? pause() : play();
  }

  // Public API
  return {
    play: () => elements.audio.play(),
    pause: () => elements.audio.pause(),
    seek: (time) => elements.audio.currentTime = time,
    destroy: () => container.innerHTML = ''
  };
}
```

### For Complex Components
```javascript
// Class-based only when state management is complex
export class BookReader {
  constructor(container, bookId) {
    this.container = container;
    this.bookId = bookId;
    this.state = { chapter: 0, section: 0 };
    this.init();
  }

  async init() {
    this.book = await ContentService.loadBook(this.bookId);
    this.render();
  }

  // ...
}
```

## CSS Architecture

### Design Tokens
```css
:root {
  /* Colors */
  --bg-primary: #faf9f7;
  --bg-secondary: #f0eeeb;
  --text-primary: #1a1a1a;
  --text-secondary: #666;
  --accent: #d97706;
  --accent-light: #fef3c7;

  /* Typography */
  --font-body: 'Georgia', serif;
  --font-ui: system-ui, sans-serif;
  --font-size-base: 18px;
  --line-height: 1.7;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
  --space-xl: 4rem;

  /* Reader specific */
  --content-width: 680px;
  --audio-player-height: 80px;
}
```

### Mobile-First
```css
.reader {
  padding: var(--space-md);
  max-width: var(--content-width);
  margin: 0 auto;
}

@media (min-width: 768px) {
  .reader {
    padding: var(--space-lg);
  }
}
```

## GitHub Serving Strategy

### Repository Structure for Deployment
```
the-lost-chapter/
├── dist/                    # Deployed to gh-pages
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── content/
│       └── books/
│           └── [book-id]/
│               ├── book.json
│               ├── chapters/
│               └── media/
```

### Content URLs
```javascript
const GITHUB_RAW = 'https://raw.githubusercontent.com/[user]/[repo]/main';
const GITHUB_PAGES = 'https://[user].github.io/[repo]';

// Development: local files
// Production: GitHub raw/pages URLs
const BASE_URL = import.meta.env.DEV ? '' : GITHUB_PAGES;
```

## Development Rules

### DO
- Keep components under 200 lines
- Use semantic HTML5 elements
- Provide loading states for async content
- Cache audio files in IndexedDB for offline
- Support keyboard navigation
- Include Vietnamese translations where needed

### DON'T
- Add npm dependencies unless absolutely necessary
- Create deep component hierarchies
- Use CSS frameworks
- Implement features not requested
- Over-engineer simple functionality

### Code Style
```javascript
// Prefer named exports
export function loadBook(id) { }

// Use modern JS features
const items = chapters?.map(ch => ch.title) ?? [];

// Descriptive names
function calculateReadingProgress(book, currentChapter, currentSection) { }

// Early returns
function getChapter(id) {
  if (!id) return null;
  if (!this.book) return null;
  return this.book.chapters.find(ch => ch.id === id);
}
```

## Testing

```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests
npm run test:content      # Validate content files
```

### Content Validation
```javascript
// Validates book.json and all chapters
validateBook('sample-book').then(result => {
  if (!result.valid) {
    console.error(result.errors);
  }
});
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Bundle size | < 50KB gzipped |
| First paint | < 1s |
| Audio start | < 500ms |
| Chapter load | < 300ms |

## Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production

# Content
npm run new:book         # Create new book scaffold
npm run new:chapter      # Add chapter to book
npm run validate         # Validate all content

# TTS
npm run tts:setup        # Install TTS dependencies
npm run tts:clone        # Clone voice from sample
npm run tts:generate     # Generate audio files
npm run tts:batch        # Batch generate for book

# Deployment
npm run deploy           # Build and deploy to gh-pages
```

## Extending This Project

When adding new features:
1. Update this CLAUDE.md with new patterns/rules
2. Add types to `docs/content-schema.md`
3. Keep backward compatibility with existing content
4. Document any new npm dependencies and why they're needed
