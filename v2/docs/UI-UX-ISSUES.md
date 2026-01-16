# UI/UX Issues - Voice Lecture Viewer

## Summary

After reviewing the voice-lecture-viewer.html and testing with actual markdown files, here are the identified issues and their fixes.

---

## 1. Parser Issues

### 1.1 Vocabulary Parser Too Strict
**Issue:** The vocabulary regex only matches the exact format `1. **word** : (type) meaning /pron/`. Lines without all parts fail silently.

**Affected content:**
```markdown
1. **The Voice Kids** : Giong hat Viet nhi
```
This line has no type `(n)` and no pronunciation `/ipa/` - it fails to parse.

**Fix:** Make all parts optional except word and meaning:
```javascript
// Current (too strict):
/^\d+\.\s*\*\*(.+?)\*\*\s*:\s*(?:\(([^)]+)\))?\s*(.+?)(?:\s*\/([^/]+)\/)?$/

// Should handle more variations
```

### 1.2 Table Inside Vocabulary Tag
**Issue:** In `a-closer-look-1.md` line 360-373, a table is incorrectly placed inside `<vocabulary>` tag, causing empty output.

```markdown
<vocabulary>
**Phan biet /θ/ va /ð/:**
| | /θ/ (vo thanh) | /ð/ (huu thanh) |
|---|----------------|-----------------|
</vocabulary>
```

**Fix:** Detect tables inside vocabulary and render them as grammar boxes instead.

### 1.3 Table Renderer Loses Empty Cells
**Issue:** Tables with empty cells like matching tables lose column structure.

```markdown
| | Column A | | Column B |
|---|---------|---|----------|
| 1 | Item | a | Match |
```

When split by `|` and filtered with `.filter(c => c.trim())`, empty cells are removed.

**Fix:** Use `slice(1, -1)` instead of filter to preserve empty cells.

---

## 2. Mobile UX Issues

### 2.1 Touch Targets Too Small
**Issue:** Vocabulary items have `padding: 12px` but no minimum height, making them hard to tap.

**Fix:** Add `min-height: 48px` (iOS Human Interface Guidelines recommend 44pt minimum).

### 2.2 Vocabulary Layout Breaks on Mobile
**Issue:** Flexbox with `gap: 6px` causes meaning to overflow on narrow screens.

**Fix:** Use `flex-wrap: wrap` with meaning taking full width on mobile:
```css
.vocab-meaning { flex: 1 1 100%; margin-top: 4px; }
@media (min-width: 480px) { .vocab-meaning { flex: 1; margin-top: 0; } }
```

### 2.3 TTS Buttons Too Small
**Issue:** TTS buttons have `padding: 12px 20px`, which is borderline for touch.

**Fix:** Increase to `padding: 14px 24px` and add `min-width: 120px`.

### 2.4 No Safe Area Insets
**Issue:** Bottom navigation overlaps with iPhone home indicator.

**Fix:** Add `padding-bottom: env(safe-area-inset-bottom)` to bottom nav.

### 2.5 Table Horizontal Scroll Not Smooth
**Issue:** Tables overflow but scroll feels janky on iOS.

**Fix:** Add `-webkit-overflow-scrolling: touch` to `.table-wrap`.

---

## 3. Visual Design Issues

### 3.1 Vocabulary Pronunciation Not Visible Enough
**Issue:** Pronunciation in italic gray blends with meaning text.

**Fix:** Add subtle background color:
```css
.vocab-pron { background: #fef3c7; padding: 2px 8px; border-radius: 4px; }
```

### 3.2 Type Badge Style
**Issue:** Vocabulary type `(n)` is just gray text, hard to distinguish.

**Fix:** Style as pill/badge:
```css
.vocab-type { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
```

### 3.3 Question Options Need Better States
**Issue:** Question options only have hover state, no clear visual feedback for selection.

**Fix:** Add clear border and background for hover/active states:
```css
.q-option { border: 1px solid var(--border); }
.q-option:hover { border-color: var(--primary); background: #f1f5f9; }
```

### 3.4 Translation Block Needs Visual Distinction
**Issue:** Vietnamese translations can be confused with main content.

**Fix:** Add left border and padding:
```css
.q-translation { border-left: 2px solid var(--border); padding-left: 8px; }
```

---

## 4. UX Flow Issues

### 4.1 Camera Gate Required
**Issue:** Users can't test the app without a camera, which blocks development/testing.

**Current fix:** `?skip=1` parameter exists, but undocumented.

**Better fix:** Add a visible "Skip" button with a note that attendance won't be recorded.

### 4.2 No Progress Save
**Issue:** If the user closes the browser, they lose all progress and start from chunk 0.

**Fix:** Save `currentChunk` to localStorage and restore on load.

### 4.3 No Table of Contents / Jump Navigation
**Issue:** Long lessons have 20+ chunks but no way to jump to a specific section.

**Fix:** Add a collapsible sidebar or modal with section links.

### 4.4 Timer Auto-Starts After TTS
**Issue:** Timer starts automatically after TTS finishes, but user might not be ready.

**Current:** Timer starts immediately after speech ends.

**Fix:** Add a "Start Timer" button instead of auto-starting, or add 3-second delay.

---

## 5. Accessibility Issues

### 5.1 No Keyboard Navigation Inside Chunks
**Issue:** Space/Enter navigates between chunks but can't interact with elements inside.

**Fix:** Add Tab navigation to vocabulary items and buttons.

### 5.2 No Focus Indicators
**Issue:** Interactive elements don't show clear focus states for keyboard users.

**Fix:** Add `:focus-visible` styles with outline.

### 5.3 TTS Button Doesn't Indicate State
**Issue:** When TTS is speaking, only text changes to "Dang noi..." but color stays same.

**Fix:** Add pulsing animation or clear color change to indicate speaking state.

---

## 6. Content Rendering Issues

### 6.1 Code Blocks in Grammar
**Issue:** Code blocks in grammar explanations render with fixed-width font but no syntax highlighting for structure display.

**Example:** Structure diagrams using ASCII art.

**Fix:** Add better pre styling for non-code content or detect and style differently.

### 6.2 Nested Tables
**Issue:** Tables inside answer/explanation boxes look cramped.

**Fix:** Remove table shadows when inside a box, reduce padding.

### 6.3 Long Vocabulary Words Overflow
**Issue:** Multi-word vocabulary items like "English in a Minute on VTV7" can overflow on mobile.

**Fix:** Allow word breaking with `word-break: break-word`.

---

## Priority Fix Order

### Critical (Blocking use)
1. Vocabulary parser - empty items visible
2. Table empty cells - matching exercises broken
3. Mobile touch targets - hard to use on phone

### High (Affects learning experience)
4. Mobile vocabulary layout - cramped
5. TTS button size - hard to tap
6. Progress save - users lose place

### Medium (Polish)
7. Pronunciation visibility
8. Question option states
9. Safe area insets

### Low (Nice to have)
10. Table of contents
11. Keyboard navigation
12. Timer auto-start option

---

## Implementation Notes

### Files to Modify
- `v2/voice-lecture-viewer.html` - Main viewer (all fixes)
- `v2/tests/full-integration-test.html` - Test file (verify fixes)

### Testing Approach
1. Run test file with each markdown file
2. Check all tags render correctly
3. Test on actual mobile device (not just responsive mode)
4. Test with screen reader if possible
