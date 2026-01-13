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
npm run new:book my-book "My Book Title"
npm run new:chapter my-book ch01 "Chapter One"
npm run validate      # Validate all content

# TTS Voice Cloning
npm run tts:setup     # Install TTS dependencies
npm run tts:clone     # Clone your voice from samples
npm run tts:generate  # Generate audio from text
```

## Project Structure

```
the-lost-chapter/
├── src/
│   ├── components/          # Vanilla JS UI components
│   │   ├── AudioPlayer.js   # Audio playback with transcript sync
│   │   ├── BookReader.js    # Main reading interface
│   │   ├── ContentBlock.js  # Section type renderers
│   │   ├── ExerciseBlock.js # Interactive exercises
│   │   └── Library.js       # Book grid/list view
│   ├── services/
│   │   ├── AudioService.js  # Audio caching & Web Audio API
│   │   ├── ContentService.js # Book/chapter data loading
│   │   └── ProgressService.js # Reading progress tracking
│   ├── utils/
│   │   ├── dom.js           # DOM helpers
│   │   ├── markdown.js      # Lightweight MD parser
│   │   ├── storage.js       # LocalStorage/IndexedDB
│   │   └── theme.js         # Dark/light mode
│   ├── styles/
│   │   ├── main.css         # Core styles + design tokens
│   │   └── reader.css       # Reader-specific styles
│   ├── app.js               # Main application entry
│   └── index.html           # Single HTML entry
├── content/
│   ├── books/               # Book content
│   │   ├── index.json       # Library catalog
│   │   └── {book-id}/
│   │       ├── book.json    # Book metadata
│   │       └── chapters/
│   │           └── ch01.json
│   └── media/
│       └── {book-id}/
│           ├── audio/       # Generated TTS audio
│           └── images/      # Chapter images
├── tools/
│   ├── tts/                 # Voice cloning tools
│   │   ├── clone-voice.py   # Create voice model
│   │   ├── generate.py      # Generate single audio
│   │   ├── batch-generate.py # Batch audio generation
│   │   └── requirements.txt
│   └── book-builder/        # Content scaffolding
│       ├── scaffold.js      # Create books/chapters
│       └── validate.js      # Content validation
├── docs/
│   └── content-schema.md    # Full content specification
├── dist/                    # Build output (git-ignored)
└── package.json
```

## Content Schema

### Book Structure

```json
{
  "id": "my-book",
  "title": "My Book Title",
  "author": "Author Name",
  "language": "en",
  "coverImage": "cover.jpg",
  "description": "Book description",
  "chapters": ["ch01", "ch02"]
}
```

### Chapter Structure

```json
{
  "id": "ch01",
  "title": "Chapter Title",
  "sections": [
    { "type": "markdown", "content": "# Heading\n\nText content..." },
    { "type": "audio", "src": "narration.mp3", "transcript": "..." },
    { "type": "image", "src": "illustration.jpg", "alt": "..." },
    { "type": "exercise", "exerciseType": "multiple_choice", "question": "...", "options": [...] }
  ]
}
```

### Section Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `markdown` | Rich text content | `content` |
| `audio` | Narration with transcript | `src`, optional: `transcript`, `timestamps` |
| `image` | Visual content | `src`, `alt` |
| `exercise` | Interactive quiz | `exerciseType`, `question`, type-specific fields |
| `video` | Video embed | `src` or `youtubeId` |
| `pause` | Reading break | `duration` (ms), optional: `message` |

### Exercise Types

- `multiple_choice` - Single correct answer
- `true_false` - Binary choice
- `fill_blank` - Text input completion
- `matching` - Pair items together
- `ordering` - Sequence arrangement
- `vocabulary` - Word definition practice
- `listening` - Audio comprehension

## TTS Voice Cloning

### Supported Engines

1. **Coqui XTTS v2** (Recommended)
   - Best quality voice cloning
   - Supports English and Vietnamese
   - Requires GPU for fast generation
   - Voice sample: 6-30 seconds of clear audio

2. **Edge TTS** (Fallback)
   - Microsoft's cloud TTS
   - No cloning, preset voices only
   - Fast and free

### Voice Cloning Workflow

```bash
# 1. Prepare voice sample (6-30 seconds, clear audio, .wav format)

# 2. Clone the voice
python tools/tts/clone-voice.py \
  --sample my-voice-sample.wav \
  --name my-voice \
  --lang en  # or 'vi' for Vietnamese

# 3. Generate audio
python tools/tts/generate.py \
  --text "Hello, this is my audiobook" \
  --voice my-voice \
  --lang en \
  --output content/media/my-book/audio/ch01-intro.mp3

# 4. Batch generate from chapter
python tools/tts/batch-generate.py \
  --book my-book \
  --chapter ch01 \
  --voice my-voice
```

### Audio Timestamps

For transcript synchronization, generate timestamps:

```json
{
  "type": "audio",
  "src": "narration.mp3",
  "transcript": "Full transcript text...",
  "timestamps": [
    { "start": 0.0, "end": 3.5, "text": "First sentence." },
    { "start": 3.5, "end": 7.0, "text": "Second sentence." }
  ]
}
```

## Development Guidelines

### Component Pattern

```javascript
// Components are pure functions that return DOM elements
export function createComponent(container, props) {
  const element = document.createElement('div');
  element.className = 'my-component';

  // Build DOM
  element.innerHTML = `...`;

  // Bind events
  element.querySelector('.btn').addEventListener('click', handleClick);

  // Append to container
  container.appendChild(element);

  // Return control interface
  return {
    element,
    update: (newProps) => { /* re-render logic */ },
    destroy: () => element.remove()
  };
}
```

### CSS Architecture

- Use CSS custom properties for theming
- Component styles are scoped by class prefix
- Mobile-first responsive design
- Dark mode via `[data-theme="dark"]` selector

### File Naming

- Components: `PascalCase.js`
- Services: `PascalCase.js`
- Utilities: `camelCase.js`
- Content: `kebab-case.json`
- Audio: `chapter-id-section-name.mp3`

## Deployment

### GitHub Pages

```bash
# Build and deploy
npm run build
npm run deploy  # Uses gh-pages

# Or manual
git subtree push --prefix the-lost-chapter/dist origin gh-pages
```

### Content URL Configuration

For GitHub Pages, set the content base URL:

```javascript
// vite.config.js
export default defineConfig({
  define: {
    'import.meta.env.VITE_CONTENT_URL': JSON.stringify(
      'https://username.github.io/repo-name'
    )
  }
});
```

## Extension Points

### Adding New Section Types

1. Add type to `VALID_SECTION_TYPES` in `tools/book-builder/validate.js`
2. Add renderer in `src/components/ContentBlock.js`
3. Add styles in `src/styles/reader.css`
4. Document in `docs/content-schema.md`

### Adding New Exercise Types

1. Add type to exercise types in validator
2. Add handler in `src/components/ExerciseBlock.js`
3. Define scoring logic
4. Add sample to documentation

### Custom Themes

Create new theme in `src/styles/themes/`:

```css
/* themes/sepia.css */
[data-theme="sepia"] {
  --bg-primary: #f4ecd8;
  --text-primary: #5c4b37;
  /* ... */
}
```

## Performance Targets

- First Contentful Paint: < 1s
- Bundle size: < 100KB gzipped
- Audio load time: < 500ms (cached)
- Offline-capable via Service Worker

## Quality Checklist

Before committing content:

- [ ] Run `npm run validate` - all checks pass
- [ ] Audio files exist for all `audio` sections
- [ ] Images are optimized (< 500KB each)
- [ ] Transcripts match audio content
- [ ] Exercises have correct answers defined
- [ ] Book appears in library index
