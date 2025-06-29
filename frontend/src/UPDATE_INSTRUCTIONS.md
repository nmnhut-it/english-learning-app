# Plain Mode Update Instructions

## Overview
The plain mode has been optimized for:
1. **Lightweight rendering** - Uses virtual scrolling to handle large files efficiently
2. **Dynamic loading** - Content is loaded in chunks as you scroll
3. **Large text sizes** - Minimum 28px for all text, default 32px

## Key Changes

### 1. PlainMarkdownViewer.tsx
- Implemented virtual scrolling using `react-window`
- Content is split into chunks (50 lines each)
- Only visible chunks are rendered (with 3 chunks overscan)
- Font sizes: Min 28px, Default 32px, Max 48px
- Removed heavy animations and effects
- Lightweight markdown rendering without MUI Typography components

### 2. plain-mode-enhancements.css
- Removed all GPU-intensive effects (blur, backdrop-filter, animations)
- Simplified styling with basic colors and borders
- Ensured minimum 28px font size throughout
- Removed complex gradients and shadows
- Added performance optimizations (will-change, contain)

## Installation Required

```bash
npm install react-window
# or
yarn add react-window
```

## How to Apply Changes

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install react-window
   ```

2. **Replace PlainMarkdownViewer.tsx**:
   - Copy the new optimized version from the artifact above
   - Replace the existing file at `src/components/PlainMarkdownViewer.tsx`

3. **Replace plain-mode-enhancements.css**:
   - Copy the new optimized CSS from the artifact above
   - Replace the existing file at `src/styles/plain-mode-enhancements.css`

## Features

### Virtual Scrolling
- Large files are split into manageable chunks
- Only visible content is rendered
- Smooth scrolling with dynamic height calculation

### Font Size Controls
- Ctrl + Plus: Increase font size
- Ctrl + Minus: Decrease font size
- Font size indicator shows current size
- Sizes range from 28px to 48px

### Performance Optimizations
- No backdrop filters or blurs
- No animations (except simple hover states)
- Minimal box shadows
- Optimized text rendering
- Layout containment for virtual scroll items

### Accessibility
- Large clickable areas (48px minimum)
- High contrast mode support
- Clear focus indicators
- Keyboard navigation preserved

## Testing

1. Load a large markdown file (1000+ lines)
2. Verify smooth scrolling
3. Test font size controls
4. Check memory usage in DevTools
5. Monitor GPU usage

## Notes

- The virtual scrolling may show a brief loading state when jumping to distant sections
- Search now reports "chunks found" instead of individual matches
- Table of Contents navigation scrolls to the chunk containing the heading
- Print functionality exports the entire document (not just visible chunks)
