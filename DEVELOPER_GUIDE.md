# English Learning Platform - Developer Guide

## Overview
A full-stack web application for rendering English learning content from markdown files. Features recursive file browsing, specialized content rendering, vocabulary games, interactive exercises, and text-to-speech functionality.

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
│   │   │   ├── content/   # Content-specific components
│   │   │   │   ├── ExerciseSection.tsx      # ✅ Interactive exercises
│   │   │   │   ├── SkillsSection.tsx        # ✅ 4-skills practice
│   │   │   │   ├── CommunicationSection.tsx # ✅ Dialogues & roleplay
│   │   │   │   ├── VocabularySection.tsx    # Vocabulary cards
│   │   │   │   ├── VocabularyGame.tsx       # Game modes
│   │   │   │   ├── PronunciationSection.tsx # Sound practice
│   │   │   │   └── GettingStarted.tsx       # Intro content
│   │   │   ├── ContentViewer.tsx    # Content router
│   │   │   ├── FileList.tsx         # File browser
│   │   │   ├── Layout.tsx           # App layout
│   │   │   └── TableOfContents.tsx  # Document navigation
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── markdown-files/        # Your lesson content (*.md files)
├── start-app.bat         # Quick start script
├── dev-manager.bat       # Developer tools menu
├── start-app.ps1         # PowerShell starter
└── stop-app.bat          # Stop all servers
```

## Quick Start

### Option 1: Using Batch Scripts (Recommended)
```batch
# Quick start - runs both servers
start-app.bat

# Or use the developer menu for more options
dev-manager.bat
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend (runs on port 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (runs on port 3000)
cd frontend
npm run dev
```

### Option 3: PowerShell
```powershell
# If you prefer PowerShell
.\start-app.ps1
```

## Development Scripts

### start-app.bat
- Checks Node.js installation
- Auto-installs dependencies if needed
- Starts both servers in separate windows
- Shows server URLs

### dev-manager.bat
Interactive menu with options:
1. Start both servers
2. Start backend only
3. Start frontend only
4. Install/update dependencies
5. Build for production
6. Clean install (remove node_modules)
7. Check port usage
8. Open in VS Code

### stop-app.bat
- Cleanly stops both servers
- Kills processes on ports 3000 and 3001

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

## EXERCISES
Fill in the blanks:
1. I enjoy _____ (read) books in my free time.
Answer: reading

Choose the correct answer:
2. Which activity is NOT a leisure activity?
a) Playing chess
b) Working overtime
c) Watching movies
d) Going hiking
Answer: b) Working overtime

## SKILLS
### Reading
[Reading passages and comprehension questions]

### Listening
[Listening exercises with transcripts]

### Speaking
[Speaking prompts and practice activities]

### Writing
[Writing tasks and examples]

## COMMUNICATION
[Dialogues, useful phrases, and role-play scenarios]
```

## Component Features

### ExerciseSection.tsx ✅
- **Exercise Types**: Fill-in-blanks, multiple choice, true/false, checkbox
- **Features**:
  - Real-time answer checking
  - Progress tracking bar
  - Hints system
  - Score calculation
  - Explanations for answers
  - Reset functionality

### SkillsSection.tsx ✅
- **Four Skill Tabs**: Reading, Listening, Speaking, Writing
- **Features**:
  - Reading: Passages with vocabulary and comprehension
  - Listening: Audio simulation with transcripts
  - Speaking: Topic prompts with useful phrases
  - Writing: Email/letter exercises with samples
  - Task checklists for each skill
  - TTS integration

### CommunicationSection.tsx ✅
- **Three View Modes**: Dialogue, Useful Phrases, Role Play
- **Features**:
  - Character-based conversations
  - Translation toggle
  - Phrase copying
  - Role selection for practice
  - Context tags for phrases
  - Practice tips

### VocabularySection.tsx
- Word cards with pronunciation
- Vietnamese translations
- Text-to-speech
- Integrated vocabulary games

### VocabularyGame.tsx
- Three game modes:
  - IPA to Word
  - Meaning to Word
  - Word to Meaning
- Score tracking
- Timer functionality

## API Endpoints

### Backend API (http://localhost:3001/api)
- `GET /markdown/files` - Returns file tree structure
- `GET /markdown/content?path=filename.md` - Returns parsed content

## Development Tips

### 1. Adding New Content Types
1. Update parser in `markdownService.ts`
2. Create component in `frontend/src/components/content/`
3. Add routing in `ContentViewer.tsx`
4. Define types in `frontend/src/types/index.ts`

### 2. Styling Guidelines
- Use Material-UI components
- Theme configuration in `App.tsx`
- Consistent spacing: `sx={{ mb: 3 }}` between sections
- Responsive design with Grid components

### 3. Best Practices
- Use TypeScript for type safety
- Implement loading states
- Add error boundaries
- Use custom hooks for shared logic
- Keep components focused and modular

### 4. Testing Components
```bash
# Start servers
start-app.bat

# Navigate to http://localhost:3000
# Test features:
# - File navigation
# - Content rendering
# - Exercise interactions
# - Vocabulary games
# - TTS functionality
```

## Common Issues & Solutions

### Port Already in Use
```batch
# Use the stop script
stop-app.bat

# Or check ports manually
dev-manager.bat → Option 7
```

### CORS Errors
- Ensure backend runs on port 3001
- Check CORS configuration in `backend/src/index.ts`

### Dependencies Issues
```batch
# Clean install
dev-manager.bat → Option 6
```

### Build Errors
1. Check Node.js version (14+ required)
2. Clear cache: `npm cache clean --force`
3. Delete `node_modules` and reinstall

## Next Development Steps

### High Priority
1. **Markdown Parser Enhancement**
   - Support for tables
   - Image handling
   - Audio file embedding
   - More exercise formats

2. **User Features**
   - Authentication system
   - Progress tracking
   - Bookmarks
   - User preferences

3. **Content Features**
   - Search functionality
   - PDF export
   - Offline support (PWA)
   - Real audio files for listening

### Medium Priority
1. **UI/UX Improvements**
   - Dark mode
   - Animations/transitions
   - Mobile optimization
   - Keyboard shortcuts

2. **Game Enhancements**
   - More game modes
   - Leaderboards
   - Achievement system
   - Spaced repetition

3. **Backend Features**
   - Database integration
   - User data persistence
   - Analytics
   - Content management API

### Low Priority
1. **Advanced Features**
   - AI-powered exercises
   - Speech recognition
   - Video integration
   - Collaborative features

## Deployment Guide

### Backend Deployment
```bash
# Build
cd backend
npm run build

# Deploy to:
# - Heroku
# - Railway
# - AWS/GCP
# - Vercel
```

### Frontend Deployment
```bash
# Build
cd frontend
npm run build

# Deploy dist/ to:
# - Netlify
# - Vercel
# - GitHub Pages
# - AWS S3
```

### Environment Variables
```env
# Backend (.env)
PORT=3001
NODE_ENV=production

# Frontend (.env)
VITE_API_URL=https://your-backend-url.com/api
```

## Contributing Guidelines

1. **Code Style**
   - Use TypeScript
   - Follow ESLint rules
   - Use meaningful variable names
   - Add comments for complex logic

2. **Git Workflow**
   - Feature branches
   - Descriptive commits
   - Pull requests for review
   - Update documentation

3. **Testing**
   - Test new features thoroughly
   - Check responsive design
   - Verify cross-browser compatibility
   - Test error scenarios

---

## Support & Resources

- **Documentation**: This guide + inline code comments
- **Issues**: Use GitHub issues for bugs/features
- **Stack Overflow**: Tag with `react`, `typescript`, `material-ui`
- **Community**: Join Discord/Slack for discussions

Happy coding! 🚀
