# English Learning Platform - Developer Guide

## Overview
A full-stack web application for rendering English learning content from markdown files. Features recursive file browsing, specialized content rendering, vocabulary games, and text-to-speech functionality.

## Tech Stack
- **Backend**: Node.js, TypeScript, Express
- **Frontend**: React, TypeScript, Material-UI, Vite
- **Key Libraries**: 
  - Backend: express, cors, marked, gray-matter
  - Frontend: axios, @mui/material, react-markdown

## Project Structure
```
english-learning-app/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── routes/         # API routes
│   │   └── services/       # Business logic
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React application
│   ├── src/
│   │   ├── App.tsx        # Main app component
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── markdown-files/        # Your lesson content (*.md files)
```

## Getting Started

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Start Development Servers
```bash
# Terminal 1 - Backend (runs on port 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (runs on port 3000)
cd frontend
npm run dev
```

### 3. Add Your Content
Place markdown files in the `markdown-files` directory. Supports nested folders:
```
markdown-files/
├── beginner/
│   ├── unit1-leisure.md
│   └── unit2-countryside.md
└── advanced/
    └── grammar-focus.md
```

## Markdown Format

The parser recognizes this structure:

```markdown
# UNIT 1: LEISURE TIME

## GETTING STARTED

### 📚 Vocabulary
1. **surprised** : (adj) ngạc nhiên /səˈpraɪzd/
2. **knitting kit** : (n) bộ dụng cụ đan len /ˈnɪtɪŋ kɪt/

### 💬 Content
**Tom**: Hi, Trang. What brings you here?
**Trang**: Oh, hello Tom. I'm looking for a knitting kit.

## A CLOSER LOOK 1

### 🗣️ Pronunciation
**/br/**: bread, bring, brown
**/pr/**: practice, present, pressure
```

## Key Features to Implement/Enhance

### 1. Complete Missing Components
The following components need implementation:
- `ExerciseSection.tsx` - Interactive exercises with answer checking
- `SkillsSection.tsx` - Tabbed interface for Reading/Listening/Speaking/Writing
- `CommunicationSection.tsx` - Role-play dialogues and phrase practice

### 2. Vocabulary Game Enhancements
Current game has 3 modes. Consider adding:
- Multiple choice questions
- Spelling practice
- Time-based challenges
- Progress tracking/statistics

### 3. Content Parser Improvements
The markdown parser (`markdownService.ts`) could be enhanced to support:
- Tables
- Images
- Audio file links
- Embedded videos
- More exercise types

### 4. Additional Features to Consider
- User authentication
- Progress tracking
- Bookmark functionality
- Search within lessons
- Export to PDF
- Mobile responsive improvements
- Dark mode
- Offline support (PWA)

## API Endpoints

### Backend API (http://localhost:3001/api)
- `GET /markdown/files` - Returns file tree structure
- `GET /markdown/content?path=filename.md` - Returns parsed content

## Component Architecture

### Main Components
1. **App.tsx** - Main container, manages state
2. **FileList.tsx** - Recursive file browser with folder support
3. **ContentViewer.tsx** - Routes content to appropriate components
4. **TableOfContents.tsx** - Navigation within documents

### Content Components
Each handles specific content types:
- **VocabularySection** - Word cards with TTS and games
- **GettingStarted** - Dialogues and intro content
- **PronunciationSection** - Sound patterns practice
- **VocabularyGame** - Interactive vocabulary practice

## Development Tips

1. **Adding New Content Types**: 
   - Update parser in `markdownService.ts`
   - Create new component in `frontend/src/components/content/`
   - Add routing logic in `ContentViewer.tsx`

2. **Styling**: Uses Material-UI theme. Modify in `App.tsx`

3. **Text-to-Speech**: Hook available at `useTextToSpeech.ts`

4. **TypeScript Types**: All defined in `frontend/src/types/index.ts`

## Common Issues

1. **CORS errors**: Ensure backend is running on port 3001
2. **File not found**: Check markdown-files path in `markdownService.ts`
3. **Build errors**: Delete node_modules and reinstall

## Next Steps for New Developers

1. Complete the unfinished components (Exercise, Skills, Communication sections)
2. Add error handling and loading states
3. Implement unit tests
4. Add user preferences (font size, theme)
5. Create more game modes
6. Add animation/transitions for better UX

## Deployment Notes
- Backend: Can deploy to services like Heroku, Railway, or Vercel
- Frontend: Can deploy to Netlify, Vercel, or GitHub Pages
- Update API_URL in frontend when deploying

---

Feel free to extend and improve! The architecture is modular and designed for easy enhancement.
