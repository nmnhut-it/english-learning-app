# TheLostChapter - UI/UX Plan

## Design Philosophy

```
SIMPLICITY > FEATURES
CONTENT > CHROME
USABILITY > AESTHETICS
OFFLINE > ONLINE
```

---

## 1. Design Principles

### 1.1 Core Rules

| Rule | Description |
|------|-------------|
| **One Action** | Each screen has ONE primary action |
| **No Hidden Nav** | No hamburger menus, everything visible |
| **Thumb Zone** | Primary actions in bottom 1/3 of screen |
| **Content First** | UI fades when reading/listening |
| **Obvious States** | Progress always visible: ✓ ● ○ |
| **Forgiving** | Allow retry, undo, no destructive actions |

### 1.2 Mobile-First Breakpoints

```css
/* Mobile first - no media query needed */
/* Tablet */
@media (min-width: 768px) { }
/* Desktop */
@media (min-width: 1024px) { }
```

---

## 2. Color System

### 2.1 CSS Custom Properties

```css
:root {
  /* Light mode (default) */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --bg-elevated: #FFFFFF;

  --text-primary: #1A1A1A;
  --text-secondary: #666666;
  --text-muted: #999999;

  --accent: #2563EB;
  --accent-hover: #1D4ED8;
  --accent-soft: #EFF6FF;

  --success: #16A34A;
  --success-soft: #DCFCE7;
  --error: #DC2626;
  --error-soft: #FEE2E2;

  --highlight: #FEF3C7;
  --border: #E5E5E5;

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}

[data-theme="dark"] {
  --bg-primary: #1A1A1A;
  --bg-secondary: #2D2D2D;
  --bg-elevated: #3D3D3D;

  --text-primary: #F5F5F5;
  --text-secondary: #AAAAAA;
  --text-muted: #777777;

  --accent: #60A5FA;
  --accent-hover: #93C5FD;
  --accent-soft: #1E3A5F;

  --success: #4ADE80;
  --success-soft: #14532D;
  --error: #F87171;
  --error-soft: #7F1D1D;

  --highlight: #78350F;
  --border: #404040;

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.4);
}
```

### 2.2 Color Usage Rules

- `--bg-primary`: Main background
- `--bg-secondary`: Cards, sections
- `--bg-elevated`: Modals, dropdowns
- `--accent`: Buttons, links, active states
- `--highlight`: Current audio sentence ONLY
- `--success/error`: Feedback ONLY (not decoration)

---

## 3. Typography

### 3.1 Font Stack

```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
               'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}
```

### 3.2 Type Scale

```css
:root {
  --text-xs: 0.75rem;    /* 12px - metadata */
  --text-sm: 0.875rem;   /* 14px - secondary */
  --text-base: 1rem;     /* 16px - body */
  --text-lg: 1.125rem;   /* 18px - emphasis */
  --text-xl: 1.25rem;    /* 20px - headings */
  --text-2xl: 1.5rem;    /* 24px - titles */
  --text-3xl: 1.875rem;  /* 30px - hero */
}
```

### 3.3 Line Heights

```css
:root {
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;  /* Reading content */
}
```

### 3.4 Typography Rules

- Body text: `--text-base` with `--leading-relaxed`
- UI text: `--text-sm` with `--leading-normal`
- Never use font-weight below 400
- Maximum 2 font weights per screen (400, 600)

---

## 4. Spacing

### 4.1 Spacing Scale

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### 4.2 Spacing Rules

- Content horizontal padding: `--space-4` (16px)
- Card padding: `--space-4` all sides
- Section gaps: `--space-8` (32px)
- Touch targets: minimum 48px (--space-12)
- Between paragraphs: `--space-4`

---

## 5. Components

### 5.1 Buttons

```css
.btn {
  min-height: 48px;
  padding: var(--space-3) var(--space-6);
  border-radius: 8px;
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-text {
  background: transparent;
  color: var(--accent);
}
```

### 5.2 Cards

```css
.card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
}
```

### 5.3 Progress Indicators

```
Status Icons:
  ○ = Not started (empty circle)
  ● = In progress (filled circle)
  ✓ = Completed (checkmark)

Progress Bar:
  ━━━━━●━━━━━━━ (thin line with dot)
```

### 5.4 Icons

Minimal icon set (use emoji or simple SVG):
- Navigation: ← → ≡
- Player: ▶ ⏸ ⏪ ⏩
- Status: ✓ ✗ ○ ●
- Actions: 📥 🔊 ❓
- Theme: ☀️ 🌙

---

## 6. Layout

### 6.1 Screen Structure

```
┌─────────────────────────┐
│ HEADER (48-56px)        │  Fixed top
├─────────────────────────┤
│                         │
│ CONTENT                 │  Scrollable
│ (padding: 16px)         │
│                         │
├─────────────────────────┤
│ FOOTER NAV (optional)   │  Fixed bottom
└─────────────────────────┘
```

### 6.2 Content Width

```css
.container {
  max-width: 640px;  /* Optimal reading width */
  margin: 0 auto;
  padding: 0 var(--space-4);
}
```

### 6.3 Safe Areas (iOS)

```css
:root {
  --safe-top: env(safe-area-inset-top);
  --safe-bottom: env(safe-area-inset-bottom);
}

.header {
  padding-top: var(--safe-top);
}

.footer {
  padding-bottom: var(--safe-bottom);
}
```

---

## 7. Screens

### 7.1 Library (Home)

```
PURPOSE: Browse and select books
PRIMARY ACTION: Tap book to open
SECONDARY: Settings access

LAYOUT:
- Header: Logo + theme toggle + language
- Content: Book cards grid (1 col mobile, 2 col tablet)
- Each card: Cover + Title + Progress + Continue button
```

### 7.2 Book Detail

```
PURPOSE: View book info, select chapter
PRIMARY ACTION: Continue reading
SECONDARY: Chapter selection

LAYOUT:
- Header: Back + Book title
- Cover image (centered, max 200px)
- Title, author, description
- Big "Continue" button
- Chapter list with status icons
- Download for offline button
```

### 7.3 Chapter Reader

```
PURPOSE: Read/listen to content
PRIMARY ACTION: Consume content
SECONDARY: Navigate chapters

LAYOUT:
- Header: Back + Chapter title + menu
- Content sections (scroll):
  - Markdown (rendered)
  - Images (full width, caption)
  - Audio player (sticky when playing)
  - Exercises (inline)
- Footer: Prev/Next chapter nav
```

### 7.4 Audio Player States

```
COLLAPSED (in-page):
┌─────────────────────────────┐
│ 🔊 ▶  ━━━●━━━━━━━  1:23    │
└─────────────────────────────┘

EXPANDED (when playing):
┌─────────────────────────────┐
│ 🔊 ĐANG NGHE                │
│                             │
│   ━━━━━━●━━━━━━━━━━━━━━━    │
│   1:23              3:45    │
│                             │
│    ⏪    advancement advancement    ⏩         │
│   -10s   ▶/⏸   +10s        │
│                             │
│  Speed: 0.75x [1x] 1.5x     │
│                             │
│ ┌─────────────────────────┐ │
│ │ Past sentence (dimmed)  │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │▓▓ CURRENT SENTENCE ▓▓▓▓▓│ │ ← highlight
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Upcoming sentence       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 7.5 Exercise

```
PURPOSE: Test comprehension
LAYOUT:
- Question text
- Options (full width, large tap targets)
- Submit button
- Feedback (inline, not modal)
```

---

## 8. Interactions

### 8.1 Transitions

```css
:root {
  --transition-fast: 0.1s ease;
  --transition-normal: 0.15s ease;
  --transition-slow: 0.3s ease;
}

/* Use sparingly */
.btn { transition: all var(--transition-normal); }
.card { transition: transform var(--transition-normal); }
```

### 8.2 Touch Feedback

```css
.btn:active,
.card:active {
  transform: scale(0.98);
}
```

### 8.3 Gestures

| Gesture | Action |
|---------|--------|
| Swipe right from edge | Go back |
| Swipe left/right on reader | Prev/Next chapter |
| Long press sentence | Copy text |
| Pull down on library | Refresh |

---

## 9. Accessibility

### 9.1 Requirements

- Color contrast: WCAG AA minimum (4.5:1)
- Touch targets: 48px minimum
- Focus states: Visible outline
- Screen reader: Proper ARIA labels
- Reduced motion: Respect `prefers-reduced-motion`

### 9.2 Focus Styles

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

---

## 10. Offline Support

### 10.1 Service Worker Strategy

```
CACHE FIRST:
- App shell (HTML, CSS, JS)
- Downloaded book content
- Audio files (when downloaded)

NETWORK FIRST:
- Book index (check for updates)
- New content

STALE WHILE REVALIDATE:
- Book covers
```

### 10.2 UI States

```
ONLINE + NOT DOWNLOADED:
  "📥 Download for offline"

DOWNLOADING:
  "⏳ Downloading... 45%"
  [progress bar]

DOWNLOADED:
  "✓ Available offline • 12 MB"

OFFLINE MODE:
  [Banner] "📴 You're offline"
  Downloaded books: normal
  Not downloaded: grayed + "Needs internet"
```

---

## 11. Internationalization

### 11.1 Supported Languages

- Vietnamese (vi) - Default
- English (en)

### 11.2 Implementation

```javascript
const i18n = {
  vi: {
    library: 'Thư viện',
    continue: 'Tiếp tục',
    chapter: 'Chương',
    download: 'Tải xuống',
    offline: 'Đang offline',
    // ...
  },
  en: {
    library: 'Library',
    continue: 'Continue',
    chapter: 'Chapter',
    download: 'Download',
    offline: 'You\'re offline',
    // ...
  }
};
```

### 11.3 Rules

- Store preference in localStorage
- Default to Vietnamese
- UI strings only (not content)
- RTL not needed (VI and EN are LTR)

---

## 12. File Structure

```
the-lost-chapter/
├── index.html              # Single page app
├── css/
│   └── style.css           # All styles (< 10KB)
├── js/
│   ├── app.js              # Main entry, router
│   ├── components/
│   │   ├── Header.js
│   │   ├── Library.js
│   │   ├── BookDetail.js
│   │   ├── ChapterReader.js
│   │   ├── AudioPlayer.js
│   │   ├── Exercise.js
│   │   └── Settings.js
│   ├── services/
│   │   ├── ContentService.js   # Fetch content
│   │   ├── ProgressService.js  # localStorage
│   │   ├── OfflineService.js   # Service worker
│   │   └── I18nService.js      # Translations
│   └── utils/
│       ├── markdown.js         # MD parser (or use marked.js)
│       └── router.js           # Simple hash router
├── sw.js                   # Service worker
├── manifest.json           # PWA manifest
└── content/                # Book content (from CMS)
```

---

## 13. Performance Budget

| Metric | Target |
|--------|--------|
| HTML | < 5KB |
| CSS | < 10KB |
| JS (app) | < 30KB |
| JS (libs) | < 20KB (marked.js) |
| **Total** | **< 65KB** gzipped |
| First Paint | < 1s |
| TTI | < 2s |
| Audio start | < 500ms |

---

## 14. Development Rules

### 14.1 CSS Rules

- Mobile-first media queries
- Use CSS custom properties for ALL colors
- No !important
- BEM-like naming: `.component`, `.component__element`, `.component--modifier`
- Max specificity: 2 classes

### 14.2 JS Rules

- Vanilla JS only (no frameworks)
- ES Modules
- No build step required (for simplicity)
- Async/await for data fetching
- Event delegation for lists

### 14.3 HTML Rules

- Semantic elements: `<header>`, `<main>`, `<article>`, `<nav>`
- Proper heading hierarchy
- Alt text for images
- ARIA labels where needed

---

## 15. Testing Checklist

Before shipping each screen:

- [ ] Works on mobile (375px width)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1024px+)
- [ ] Dark mode looks correct
- [ ] Offline mode works
- [ ] Touch targets are 48px+
- [ ] Focus states visible
- [ ] No console errors
- [ ] Loads under 2s on 3G
