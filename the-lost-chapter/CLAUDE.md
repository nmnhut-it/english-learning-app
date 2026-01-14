# TheLostChapter - Development Instructions

## Project Overview

**TheLostChapter** is a minimal, framework-less audiobook platform that serves interactive learning content through GitHub Pages. It combines audio narration with voice cloning, images, markdown text, and interactive exercises into a streamlined learning experience.

## Philosophy

```
SIMPLICITY > FEATURES
CONTENT > CHROME
USABILITY > AESTHETICS
OFFLINE > ONLINE
```

- **Minimal**: No frameworks, just vanilla JavaScript
- **Portable**: Static files served from GitHub Pages
- **Voice-First**: Local TTS with voice cloning for personalized narration
- **Bilingual**: Vietnamese (default) and English UI support
- **Mobile-First**: Designed for phones, scales to desktop
- **Offline-Ready**: Works without internet after first load

---

## Quick Start

```bash
# Development
cd the-lost-chapter/
python -m http.server 3010     # Simple dev server
# OR
npx serve . -p 3010

# Content Generation (via Colab notebook)
# See tools/tts/TheLostChapter_TTS.ipynb
```

---

## Project Structure

```
the-lost-chapter/
├── index.html              # Single page app entry
├── css/
│   └── style.css           # All styles (< 10KB)
├── js/
│   ├── app.js              # Main entry, router
│   ├── components/
│   │   ├── Header.js       # Top bar
│   │   ├── Library.js      # Book grid
│   │   ├── BookDetail.js   # Book info + chapters
│   │   ├── ChapterReader.js # Reading experience
│   │   ├── AudioPlayer.js  # Synced audio player
│   │   ├── Exercise.js     # Quiz components
│   │   └── Settings.js     # Preferences
│   ├── services/
│   │   ├── ContentService.js   # Fetch book/chapter JSON
│   │   ├── ProgressService.js  # localStorage progress
│   │   ├── OfflineService.js   # Service worker control
│   │   └── I18nService.js      # Translations
│   └── utils/
│       ├── markdown.js     # MD parser (or marked.js)
│       └── router.js       # Hash-based routing
├── sw.js                   # Service worker
├── manifest.json           # PWA manifest
├── content/                # Book content (from CMS)
│   └── books/
│       ├── index.json
│       └── {book-id}/
│           ├── book.json
│           ├── audio/*.wav
│           └── chapters/*.json
├── voices/                 # Voice profiles (from CMS)
│   └── *.pt
├── tools/
│   └── tts/
│       └── TheLostChapter_TTS.ipynb  # Colab CMS
└── docs/
    ├── UI_PLAN.md          # Complete UI specification
    └── content-schema.md   # Content format docs
```

---

## Design System

### Colors (CSS Custom Properties)

```css
:root {
  /* Light mode */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --accent: #2563EB;
  --success: #16A34A;
  --error: #DC2626;
  --highlight: #FEF3C7;    /* Audio sync highlight */
  --border: #E5E5E5;
}

[data-theme="dark"] {
  --bg-primary: #1A1A1A;
  --bg-secondary: #2D2D2D;
  --text-primary: #F5F5F5;
  --text-secondary: #AAAAAA;
  --accent: #60A5FA;
  --success: #4ADE80;
  --error: #F87171;
  --highlight: #78350F;
  --border: #404040;
}
```

### Typography

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px - body */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px - headings */
  --text-2xl: 1.5rem;      /* 24px - titles */
  --leading-relaxed: 1.75; /* Reading content */
}
```

### Spacing

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px - default */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
}
```

### Key Rules

| Rule | Value |
|------|-------|
| Touch targets | min 48px |
| Content max-width | 640px |
| Content padding | 16px |
| Border radius | 8px (buttons), 12px (cards) |

---

## Component Pattern

All components follow this structure:

```javascript
// js/components/MyComponent.js
export function MyComponent(props) {
  const el = document.createElement('div');
  el.className = 'my-component';

  // Render
  function render() {
    el.innerHTML = `
      <h2>${props.title}</h2>
      <button class="btn btn-primary">Action</button>
    `;
    bindEvents();
  }

  // Events
  function bindEvents() {
    el.querySelector('.btn').addEventListener('click', handleClick);
  }

  function handleClick() {
    // ...
  }

  // Public API
  function update(newProps) {
    Object.assign(props, newProps);
    render();
  }

  function destroy() {
    el.remove();
  }

  // Initialize
  render();

  return { el, update, destroy };
}
```

---

## Routing

Hash-based routing for GitHub Pages compatibility:

```javascript
// Routes
#/                  → Library
#/book/{id}         → BookDetail
#/book/{id}/{ch}    → ChapterReader
#/settings          → Settings
```

---

## Content Schema

### Book (book.json)

```json
{
  "id": "my-book",
  "title": "Book Title",
  "author": "Author",
  "language": "vi",
  "description": "Description",
  "coverImage": "cover.jpg",
  "chapters": ["ch01", "ch02"]
}
```

### Chapter (chapters/ch01.json)

```json
{
  "id": "ch01",
  "title": "Chapter Title",
  "sections": [
    { "type": "markdown", "content": "# Heading\n\nText..." },
    {
      "type": "audio",
      "src": "ch01-intro.wav",
      "transcript": "Full text...",
      "timestamps": [
        { "start": 0.0, "end": 3.5, "text": "First sentence." }
      ]
    },
    { "type": "image", "src": "image.jpg", "alt": "Description", "caption": "Caption" },
    {
      "type": "exercise",
      "exerciseType": "multiple_choice",
      "question": "Question?",
      "options": [
        { "text": "Option A", "correct": false },
        { "text": "Option B", "correct": true }
      ],
      "correctFeedback": "Correct!",
      "incorrectFeedback": "Try again."
    }
  ]
}
```

---

## Progress Storage

```javascript
// localStorage structure
{
  "tlc_progress": {
    "my-book": {
      "lastChapter": "ch03",
      "audioProgress": { "ch01-intro": 45.2 },
      "completedChapters": ["ch01", "ch02"],
      "exercises": { "ex01": true }
    }
  },
  "tlc_settings": {
    "theme": "dark",
    "lang": "vi",
    "audioSpeed": 1.0,
    "autoPlay": true
  }
}
```

---

## Offline Strategy

### Service Worker Caching

```javascript
// Cache priorities
CACHE_FIRST:   ['/', '/css/', '/js/', '/manifest.json']
NETWORK_FIRST: ['/content/books/index.json']
STALE_REVALIDATE: ['/content/books/*/book.json']

// User-triggered (download button)
ON_DEMAND:     ['/content/books/*/chapters/*.json', '/content/books/*/audio/*.wav']
```

### UI States

| State | Display |
|-------|---------|
| Online, not downloaded | "📥 Download for offline" |
| Downloading | "⏳ Downloading... 45%" |
| Downloaded | "✓ Available offline" |
| Offline mode | Banner: "📴 You're offline" |

---

## i18n

```javascript
// js/services/I18nService.js
const translations = {
  vi: {
    library: 'Thư viện',
    continue: 'Tiếp tục',
    chapter: 'Chương',
    download: 'Tải xuống',
    offline: 'Đang offline',
    correct: 'Đúng rồi!',
    incorrect: 'Chưa đúng',
    tryAgain: 'Thử lại',
    next: 'Tiếp theo',
    previous: 'Quay lại',
    settings: 'Cài đặt',
    darkMode: 'Chế độ tối',
    language: 'Ngôn ngữ',
    speed: 'Tốc độ'
  },
  en: {
    library: 'Library',
    continue: 'Continue',
    chapter: 'Chapter',
    download: 'Download',
    offline: "You're offline",
    correct: 'Correct!',
    incorrect: 'Not quite',
    tryAgain: 'Try again',
    next: 'Next',
    previous: 'Previous',
    settings: 'Settings',
    darkMode: 'Dark mode',
    language: 'Language',
    speed: 'Speed'
  }
};
```

---

## Audio Player Sync

```javascript
// Sentence highlighting during playback
audio.ontimeupdate = () => {
  const currentTime = audio.currentTime;
  const currentSentence = timestamps.find(
    t => currentTime >= t.start && currentTime < t.end
  );

  if (currentSentence) {
    // Remove previous highlight
    el.querySelectorAll('.sentence--active').forEach(
      s => s.classList.remove('sentence--active')
    );
    // Add current highlight
    const sentenceEl = el.querySelector(`[data-start="${currentSentence.start}"]`);
    sentenceEl?.classList.add('sentence--active');
    // Auto-scroll to sentence
    sentenceEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};
```

---

## CSS Naming

BEM-like convention:

```css
.component { }              /* Block */
.component__element { }     /* Element */
.component--modifier { }    /* Modifier */

/* Examples */
.book-card { }
.book-card__cover { }
.book-card__title { }
.book-card--featured { }

.btn { }
.btn--primary { }
.btn--secondary { }

.audio-player { }
.audio-player__progress { }
.audio-player--expanded { }
```

---

## Performance Budget

| Asset | Target |
|-------|--------|
| HTML | < 5KB |
| CSS | < 10KB |
| JS (app) | < 30KB |
| JS (libs) | < 20KB |
| **Total** | **< 65KB gzipped** |
| First Paint | < 1s |
| TTI | < 2s |

---

## Development Checklist

Before committing:

- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1024px+)
- [ ] Dark mode correct
- [ ] Offline mode works
- [ ] Touch targets 48px+
- [ ] Focus states visible
- [ ] No console errors
- [ ] Vietnamese text displays correctly

---

## CMS Workflow

Content is created via Colab notebook:

1. Open `tools/tts/TheLostChapter_TTS.ipynb` in Google Colab
2. Setup: Install deps, clone repo, load voice profile
3. Create: Generate audio, build chapters
4. Publish: Commit & push to GitHub

Voice profiles are saved in `voices/` for consistent TTS across sessions.

---

## Deployment

GitHub Pages serves from repository root:

```
https://username.github.io/english-learning-app/the-lost-chapter/
```

No build step required - files served directly.

---

## Extension Points

### Adding Section Types

1. Add renderer in `ChapterReader.js`
2. Add styles in `style.css`
3. Update content schema docs

### Adding Exercise Types

1. Add handler in `Exercise.js`
2. Define validation in ContentService
3. Add to CMS notebook if needed

### Custom Themes

```css
[data-theme="sepia"] {
  --bg-primary: #f4ecd8;
  --text-primary: #5c4b37;
  /* ... */
}
```
