# English Learning Platform - Presentation Mode

## Overview
The platform has been redesigned as a **classroom presentation tool** optimized for TV/projector display with large, readable text and teacher-friendly features.

## Key Features

### 1. **Presentation Layout**
- Minimal header with file navigation
- Maximum content area with large text
- Footer with quick section navigation
- Clean, slide-like appearance

### 2. **Large Typography**
- **Vocabulary**: 32pt+ font size in single-line format
- All text proportionally larger for TV viewing
- Optimized readability from distance

### 3. **Vocabulary Display**
- **List View**: All vocabulary items in single-line format
  ```
  house (n) - nhà - /haʊs/
  ```
- **One-by-One View**: Focus on individual words with navigation
- Hide/show Vietnamese translations
- Audio pronunciation support

### 4. **Exercise Features**
- Parses "**Bài 1:**", "**Bài 2:**" as separate exercises
- **Hide/Show Answers** button for teaching
- Expandable/collapsible exercises
- Large, readable text throughout

### 5. **Section Navigation**
- Previous/Next section buttons in header
- Number indicators (1/7)
- Quick jump buttons in footer
- Keyboard shortcuts:
  - `Arrow Left/Right`: Navigate sections
  - `Space`: Pronounce current vocabulary
  - `F11`: Fullscreen mode

### 6. **Markdown Support**
- Proper line breaks and spacing
- Tables with clean formatting
- Lists and nested content
- Bold, italic, and other formatting

### 7. **Skills Sections**
- Skills 1: Reading & Speaking
- Skills 2: Listening & Writing
- Clear labels and organization

## Installation

1. Install new dependencies:
   ```bash
   cd english-learning-app
   install-presentation-deps.bat
   ```

2. Start the application:
   ```bash
   start-app.bat
   ```

## Usage Tips

### For Teachers:
1. Press `F11` for fullscreen presentation
2. Use arrow keys to navigate between sections
3. Click "Hide/Show Answer" to control when students see answers
4. Use "One by One" mode for vocabulary drilling
5. Space bar pronounces vocabulary words

### File Organization:
The system recognizes the pattern:
- Unit 1, 2, 3
- Review 1
- Unit 4, 5, 6  
- Review 2
- etc.

### Responsive Design:
- Works on tablets and mobile devices
- Scales appropriately for different screen sizes
- Optimized for 1080p and 4K displays

## Troubleshooting

If sections aren't displaying:
1. Check that your markdown follows the expected format
2. Ensure section headers use `##` (not `#` or `###`)
3. Verify "LOOKING BACK" sections are properly titled

If vocabulary isn't displaying correctly:
1. Use either format:
   - `1. **word** : (type) meaning /pronunciation/`
   - `- **word** : (type) meaning /pronunciation/`
2. Ensure proper spacing around colons and slashes

## Keyboard Shortcuts

- `F11`: Toggle fullscreen
- `←/→`: Navigate sections
- `Space`: Pronounce vocabulary (in vocabulary view)
- `Esc`: Exit fullscreen

## Best Practices

1. **Before Class**:
   - Test on your display device
   - Pre-load the unit you'll teach
   - Check audio is working

2. **During Class**:
   - Use fullscreen mode
   - Hide answers initially for exercises
   - Use one-by-one mode for vocabulary introduction
   - Let students read aloud before playing audio

3. **Display Settings**:
   - Ensure display scaling is appropriate
   - Adjust browser zoom if needed (Ctrl +/-)
   - Use high contrast mode if available

The platform is designed to make English lessons more engaging and easier to present in a classroom setting!
