# Plain Mode Features for English Learning App

## Overview
The Plain Mode in the English Learning App provides a distraction-free reading experience for markdown content with enhanced navigation and accessibility features.

## Features

### 1. **Reading Controls**
- **Font Size Adjustment**: Increase/decrease text size for comfortable reading
  - Keyboard shortcuts: `Ctrl/Cmd +` to increase, `Ctrl/Cmd -` to decrease
  - Range: 12px to 32px

- **Translation Toggle**: Show/hide Vietnamese translations
  - Hides italicized translations when disabled
  - Useful for English immersion practice

### 2. **Navigation**
- **Table of Contents (TOC)**
  - Accessible via menu icon or `Ctrl/Cmd + M`
  - Hierarchical structure with collapsible sections
  - Click any heading to jump directly to that section
  - Smooth scrolling animation

- **Reading Progress Bar**
  - Visual indicator at the top showing reading progress
  - Helps track position in long documents

- **Scroll to Top Button**
  - Appears when scrolled down more than 300px
  - Quick return to document beginning

### 3. **Search Functionality**
- **In-Document Search**
  - Keyboard shortcut: `Ctrl/Cmd + F`
  - Real-time search results
  - Shows count of matches found
  - `Escape` key to close search

### 4. **Print Support**
- **Print-Optimized Layout**
  - Keyboard shortcut: `Ctrl/Cmd + P`
  - Removes UI elements for clean printing
  - Proper page breaks and margins
  - Optimized font sizes for paper

### 5. **Keyboard Shortcuts Summary**
| Action | Shortcut |
|--------|----------|
| Open Search | `Ctrl/Cmd + F` |
| Print | `Ctrl/Cmd + P` |
| Increase Font | `Ctrl/Cmd + (+/=)` |
| Decrease Font | `Ctrl/Cmd + -` |
| Close Search | `Escape` |
| Navigate Sections | Click in TOC |

## Technical Implementation

### State Management
- Uses React hooks for state management
- Memoized content processing for performance
- Efficient scroll tracking with refs

### Styling
- Material-UI components for consistent design
- Responsive layout for various screen sizes
- Custom print styles for optimal output

### Accessibility
- Keyboard navigation support
- ARIA labels on interactive elements
- Clear visual feedback for all actions
- Semantic HTML structure

## Future Enhancements
1. **Advanced Search**
   - Highlight matches in text
   - Navigate between search results
   - Regular expression support

2. **Reading Features**
   - Reading time estimation
   - Bookmarking sections
   - Note-taking capability

3. **Export Options**
   - Save as PDF
   - Export with/without translations
   - Custom formatting options

4. **Personalization**
   - Save reading preferences
   - Theme customization
   - Reading history

## Usage Tips
1. Use keyboard shortcuts for faster navigation
2. Hide translations to test comprehension
3. Use TOC for quick section access
4. Adjust font size based on device/preference
5. Print documents for offline study

## Development Notes
- Component location: `/frontend/src/components/PlainMarkdownViewer.tsx`
- Print styles: `/frontend/src/styles/print.css`
- Backend endpoint: `/api/markdown/raw`
- Supports standard markdown with GFM extensions
