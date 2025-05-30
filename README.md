# English Learning Platform

A modern web application for interactive English learning using markdown-based lessons.

## Quick Start

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start development (2 terminals)
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

## Features

- 📁 **Recursive File Browser** - Organize lessons in folders
- 🎮 **Vocabulary Games** - 3 interactive game modes
- 🔊 **Text-to-Speech** - Practice pronunciation
- 📚 **Smart Content Rendering** - Different components for different content types
- 🎯 **Interactive Exercises** - Practice what you learn
- 📱 **Responsive Design** - Works on all devices

## Adding Content

Place your markdown files in the `markdown-files` folder:

```
markdown-files/
├── beginner/
│   └── unit1-leisure-time.md
└── intermediate/
    └── unit1-technology.md
```

## For Developers

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for detailed documentation.

## License

MIT
