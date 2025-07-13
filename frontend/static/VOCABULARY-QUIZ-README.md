# Vocabulary Quiz Tool with Gemini AI

A TV-optimized vocabulary quiz application with Gemini AI integration for automatic format standardization.

## Features

- **AI-Powered Processing**: Use Gemini AI to automatically standardize any vocabulary format
- **TV Optimized**: Large text (1.6rem), compact spacing for maximum card visibility
- **Multiple Quiz Modes**:
  - Meaning → Word (show meaning, guess word)
  - Word → Meaning (show word, guess meaning)
  - Mixed (random combination)
- **Teacher Controls**:
  - SPACEBAR: Toggle answers
  - ESC: Back to setup
  - F: Toggle fullscreen
  - H: Hide/show keyboard shortcuts panel
- **Responsive Design**: 
  - Mobile: 1 card per row
  - 1200px+: 3 cards per row
  - 1800px+: 4 cards per row
  - 2200px+: 5 cards per row
  - 2600px+: 6 cards per row

## Gemini AI Integration

- **Automatic Format Detection**: Paste vocabulary in any format
- **Standardization**: AI converts to consistent 3-line format (word, IPA, meaning)
- **British English IPA**: Ensures consistent pronunciation notation
- **API Key Storage**: Securely saves your key in browser localStorage
- **Fallback**: Manual parsing if AI is unavailable

## Optimizations for Classroom Use

- **Large Text**: Words and meanings are displayed in 1.6rem font size for visibility from distance
- **High Contrast**: Bold fonts (800 weight) for better readability
- **Compact Layout**: Reduced padding and spacing to show more cards on screen
- **Minimal Header**: Small header to maximize content area
- **Hideable Controls**: Press H to hide the keyboard shortcuts panel for even more space

## Getting Started

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Enter your API key in the yellow box (it will be saved securely)
3. Paste vocabulary in any format
4. Choose a quiz mode
5. Press F for fullscreen (recommended for TV/projector)

## Supported Vocabulary Formats

The quiz tool can parse vocabulary in multiple formats:

### 1. Multi-line Format (Default)
```
bustling (adj)
/ˈbʌslɪŋ/
hối hả, nhộn nhịp, náo nhiệt
```

### 2. Tab-separated
```
word[TAB]meaning
word[TAB]/IPA/[TAB]meaning
```

### 3. Comma-separated
```
word, meaning
word, /IPA/, meaning
```

### 4. Dash/Hyphen/Colon separated
```
word - meaning
word : meaning
```

### 5. Semicolon separated
```
word; meaning
word; /IPA/; meaning
```

## Access

The quiz tool is available at:
- Port 3001: `http://localhost:3001/vocabulary-quiz`
- Port 3002: `http://localhost:3002/vocabulary-quiz`

## Usage

1. Paste or type your vocabulary in any supported format
2. Choose a quiz mode:
   - **Meaning → Word**: Students see the meaning and must recall the word
   - **Word → Meaning**: Students see the word and must recall the meaning
   - **Mixed**: Randomly switches between both modes
3. Use keyboard shortcuts or buttons to control the quiz
4. Press F for fullscreen mode (recommended for TV/projector use)

## Technical Details

- Pure HTML/CSS/JavaScript (no dependencies)
- Responsive grid layout (2 cards per row on large screens, 1 on mobile)
- IPA pronunciation support (optional)
- Automatic text parsing with multiple format detection
