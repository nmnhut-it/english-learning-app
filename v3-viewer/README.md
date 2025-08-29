# V3 Lightweight Markdown Viewer

A fast, lightweight markdown viewer with folder history tracking for English learning materials.

## Features

✅ **Core Features**
- Browse nested markdown files in `./markdown-files`
- Toggle between raw markdown and rendered HTML
- Direct URLs for sharing specific lessons
- Fast server-side rendering with caching

✅ **Folder History**
- Track last accessed file in each folder
- Smart folder previews showing recent activity
- Resume exactly where you left off
- Recent files dashboard

✅ **Search & Navigation**
- Quick search across all files (Press `/`)
- Table of contents auto-generation
- Breadcrumb navigation
- Keyboard shortcuts (`r` = raw, `v` = rendered)

✅ **Mobile Responsive**
- Responsive design for all devices
- Touch-friendly navigation
- Collapsible sidebar for mobile

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:3004
```

## Keyboard Shortcuts

- `/` - Open search modal
- `r` - Switch to raw markdown view
- `v` - Switch to rendered HTML view
- `Escape` - Close modals

## Project Structure

```
v3-viewer/
├── server.js          # Express server with routes
├── views/             # EJS templates
│   ├── layout.ejs     # Main layout template
│   ├── index.ejs      # File browser homepage
│   └── viewer.ejs     # Markdown viewer page
├── public/            # Static assets
│   ├── app.js         # Frontend JavaScript
│   └── styles.css     # Responsive CSS
└── package.json       # Dependencies & scripts
```

## API Endpoints

- `GET /` - File browser homepage
- `GET /view/:filepath` - View markdown file (rendered)
- `GET /raw/:filepath` - View raw markdown
- `GET /api/files` - JSON file tree
- `POST /api/history` - Update access history

## History System

The viewer automatically tracks:
- Last accessed file per folder
- Access timestamps 
- Visit counts
- Recent files list (last 5)

All history is stored in browser localStorage and persists across sessions.

## Performance

- Server-side markdown rendering
- Minimal JavaScript bundle (~15KB)
- Fast file system operations
- Responsive UI with smooth transitions
- Mobile-optimized layout

## Educational Content Support

Perfect for browsing:
- Grade-level lessons (g6, g7, g8, g9, g10, g11)
- Unit-based curriculum
- Vocabulary exercises
- Grammar lessons
- Skills practice materials

Ready to use with your existing `./markdown-files` directory structure!