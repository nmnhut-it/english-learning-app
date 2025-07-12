# Vocabulary Processing Tool

A simple, unified tool for processing English vocabulary with Vietnamese translations using Google's Gemini API.

## Features

- ✅ **Simple format**: `**word**: (type) meaning /pronunciation/`
- ✅ **Context support**: Add optional context that appears as a heading
- ✅ **Dual output**: Automatically saves both `.md` and `.json` files
- ✅ **Grade support**: Grades 1-12
- ✅ **Clean UI**: Minimal interface with markdown preview
- ✅ **Auto-save**: Files automatically saved to organized folders

## How to Use

### 1. Access the Tool

With the backend running, go to:
```
http://localhost:3001/vocabulary
```

Or open directly: `frontend/vocabulary-tool.html`

### 2. Fill the Form

- **API Key**: Your Gemini API key (saved in browser)
- **Words**: One word/phrase per line
- **Context**: Optional context (becomes a heading in the file)
- **Grade**: Select 1-12
- **Unit**: Unit number
- **Book**: Textbook series (default: Global Success)

### 3. Process

Click "Process Vocabulary" and the tool will:
1. Call Gemini API to get translations and pronunciations
2. Save a markdown file
3. Save a JSON file
4. Show preview of the results

## Output Format

### Markdown File
```markdown
# Từ vựng

## Unit 1: Hobbies

**hobby**: (n) sở thích /ˈhɒbi/
**beautiful**: (adj) đẹp /ˈbjuːtɪfʊl/
**run - ran - run**: (v) chạy /rʌn - ræn - rʌn/

---
```

### JSON File
```json
{
  "metadata": {
    "grade": 7,
    "unit": 1,
    "book": "global-success",
    "context": "Unit 1: Hobbies",
    "createdAt": "2024-01-20T10:30:45.123Z",
    "totalWords": 3
  },
  "vocabulary": [
    {
      "word": "hobby",
      "type": "n",
      "meaning": "sở thích",
      "pronunciation": "ˈhɒbi",
      "irregular": false
    }
  ]
}
```

## File Structure

Files are saved to:
```
markdown-files/
└── [book]-[grade]/
    └── vocabulary/
        ├── unit-[XX]-vocab-[timestamp].md
        └── unit-[XX]-vocab-[timestamp].json
```

Example: `markdown-files/global-success-7/vocabulary/unit-01-vocab-2024-01-20T10-30-45.md`

## API Endpoint

```
POST http://localhost:3001/api/vocabulary/process

Body:
{
  "apiKey": "your-gemini-api-key",
  "words": "word1\nword2\nword3",
  "context": "Optional context",
  "grade": "7",
  "unit": "1",
  "book": "global-success"
}
```

## Requirements

- Backend server running (`npm run dev` in backend folder)
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Markdown files directory structure in place
