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

## Unit Structure & Section Order

### ⚠️ IMPORTANT: Standard Unit Structure
Each unit in the English textbook follows a **standard pedagogical sequence** that must be preserved:

1. **GETTING STARTED** - Introduction to the topic
2. **A CLOSER LOOK 1** - Vocabulary & Pronunciation
3. **A CLOSER LOOK 2** - Grammar
4. **COMMUNICATION** - Speaking practice
5. **SKILLS 1** - Reading & Speaking
6. **SKILLS 2** - Listening & Writing  
7. **LOOKING BACK** - Review & Project

**The parser should reorder sections to match this sequence regardless of their order in the markdown file.**

### Section Ordering Implementation

```typescript
// Define the standard section order
const SECTION_ORDER = [
  'GETTING STARTED',
  'A CLOSER LOOK 1',
  'A CLOSER LOOK 2', 
  'COMMUNICATION',
  'SKILLS 1',
  'SKILLS 2',
  'LOOKING BACK'
];

// Function to sort sections according to standard order
const sortSections = (sections: Section[]): Section[] => {
  return sections.sort((a, b) => {
    const aIndex = SECTION_ORDER.findIndex(order => 
      a.title.toUpperCase().includes(order)
    );
    const bIndex = SECTION_ORDER.findIndex(order => 
      b.title.toUpperCase().includes(order)
    );
    
    // If both found in order, sort by that
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // If only one found, it comes first
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // Otherwise maintain original order
    return a.originalIndex - b.originalIndex;
  });
};
```

## Understanding the Markdown Format

### Real-World Markdown Structure
The markdown files use a flexible format that includes:

1. **Section Headers** (## or ###):
   ```markdown
   ## GETTING STARTED - BẮT ĐẦU
   ## A CLOSER LOOK 1 - TÌM HIỂU THÊM 1
   ## COMMUNICATION - GIAO TIẾP
   ## SKILLS 1 - KỸ NĂNG 1
   ```

2. **Subsection Headers with Emojis**:
   ```markdown
   ### 📚 Vocabulary - Từ vựng
   ### 💬 Content - Nội dung
   ### ✍️ Exercises - Bài tập
   ### 🗣️ Pronunciation - Phát âm
   ### 📖 Grammar - Ngữ pháp
   ```

3. **Vocabulary Formats** (multiple patterns):
   ```markdown
   # Numbered format
   1. **word/phrase** : (type) translation /pronunciation/
   2. **come back** : (v) trở về /kʌm bæk/
   
   # Bullet point format
   - **event** : (n) sự kiện, biến cố /ɪˈvent/
   - **community** : (n) cộng đồng /kəˈmjuːnɪti/
   ```

4. **Dialogue Format**:
   ```markdown
   **Speaker Name:** English text
   Vietnamese translation

   **Tom:** Hi, Trang. What brings you here?
   Chào Trang. Bạn đến đây làm gì?
   ```

5. **Exercise Formats**:
   ```markdown
   ### ✍️ Bài 1: Listen and read
   ### ✍️ Bài 2: Match the words
   ### ✍️ Bài 3: Complete the sentences
   
   **Answers:** 1-a, 2-b, 3-c
   ```

## Parser Implementation Strategy

### 1. Section Detection and Classification
```typescript
interface ParsedSection {
  title: string;
  type: 'getting-started' | 'closer-look-1' | 'closer-look-2' | 
        'communication' | 'skills-1' | 'skills-2' | 'looking-back';
  originalIndex: number;  // Track original position
  subsections: Subsection[];
  content: ContentItem[];
}

const detectSectionType = (heading: string): string => {
  const upper = heading.toUpperCase();
  
  if (upper.includes('GETTING STARTED')) return 'getting-started';
  if (upper.includes('A CLOSER LOOK 1')) return 'closer-look-1';
  if (upper.includes('A CLOSER LOOK 2')) return 'closer-look-2';
  if (upper.includes('COMMUNICATION')) return 'communication';
  if (upper.includes('SKILLS 1')) return 'skills-1';
  if (upper.includes('SKILLS 2')) return 'skills-2';
  if (upper.includes('LOOKING BACK')) return 'looking-back';
  
  return 'unknown';
};
```

### 2. Subsection Detection Within Main Sections
```typescript
const detectSubsectionType = (heading: string): string => {
  // Check for emoji indicators first
  if (heading.includes('📚')) return 'vocabulary';
  if (heading.includes('💬')) return 'content';
  if (heading.includes('✍️')) return 'exercises';
  if (heading.includes('🗣️')) return 'pronunciation';
  if (heading.includes('📖')) return 'grammar';
  if (heading.includes('👂')) return 'listening';
  
  // Fallback to text patterns
  const lower = heading.toLowerCase();
  if (lower.includes('vocabulary')) return 'vocabulary';
  if (lower.includes('content')) return 'content';
  if (lower.includes('exercise') || lower.includes('bài')) return 'exercises';
  if (lower.includes('pronunciation')) return 'pronunciation';
  if (lower.includes('grammar')) return 'grammar';
  if (lower.includes('listening')) return 'listening';
  if (lower.includes('reading')) return 'reading';
  if (lower.includes('writing')) return 'writing';
  if (lower.includes('speaking')) return 'speaking';
  
  return 'generic';
};
```

### 3. Complete Parser Flow
```typescript
const parseMarkdownFile = (content: string): Unit => {
  const lines = content.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let currentSubsection: Subsection | null = null;
  
  lines.forEach((line, index) => {
    // Check for main section headers (##)
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace('## ', '').trim(),
        type: detectSectionType(line),
        originalIndex: sections.length,
        subsections: [],
        content: []
      };
      currentSubsection = null;
    }
    // Check for subsection headers (###)
    else if (line.startsWith('### ') && currentSection) {
      if (currentSubsection) {
        currentSection.subsections.push(currentSubsection);
      }
      currentSubsection = {
        title: line.replace('### ', '').trim(),
        type: detectSubsectionType(line),
        content: []
      };
    }
    // Add content to current subsection or section
    else if (line.trim()) {
      const parsedContent = parseContentLine(line);
      if (currentSubsection) {
        currentSubsection.content.push(parsedContent);
      } else if (currentSection) {
        currentSection.content.push(parsedContent);
      }
    }
  });
  
  // Don't forget the last section
  if (currentSection) {
    if (currentSubsection) {
      currentSection.subsections.push(currentSubsection);
    }
    sections.push(currentSection);
  }
  
  // Sort sections according to standard order
  const sortedSections = sortSections(sections);
  
  return {
    title: extractUnitTitle(content),
    sections: sortedSections
  };
};
```

## Component Routing Based on Section Type

### ContentViewer.tsx Updates
```typescript
const ContentViewer: React.FC<ContentViewerProps> = ({ content }) => {
  const renderSection = (section: ParsedSection) => {
    switch (section.type) {
      case 'getting-started':
        return <GettingStarted key={section.title} section={section} />;
        
      case 'closer-look-1':
        // This section typically has vocabulary and pronunciation subsections
        return (
          <Box key={section.title}>
            {section.subsections.map(subsection => {
              if (subsection.type === 'vocabulary') {
                return <VocabularySection key={subsection.title} section={subsection} />;
              }
              if (subsection.type === 'pronunciation') {
                return <PronunciationSection key={subsection.title} section={subsection} />;
              }
              return <GenericSection key={subsection.title} section={subsection} />;
            })}
          </Box>
        );
        
      case 'closer-look-2':
        // Grammar section with exercises
        return <GrammarSection key={section.title} section={section} />;
        
      case 'communication':
        return <CommunicationSection key={section.title} section={section} />;
        
      case 'skills-1':
      case 'skills-2':
        return <SkillsSection key={section.title} section={section} />;
        
      case 'looking-back':
        return <ReviewSection key={section.title} section={section} />;
        
      default:
        return <GenericSection key={section.title} section={section} />;
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {content.map((unit) => (
        <Box key={unit.title}>
          <Typography variant="h2" sx={{ mb: 4 }}>
            {unit.title}
          </Typography>
          {/* Sections are now in pedagogical order */}
          {unit.sections.map(renderSection)}
        </Box>
      ))}
    </Box>
  );
};
```

## Handling Various Content Types

### 1. Vocabulary Items
```typescript
const parseVocabularyItem = (line: string): VocabularyItem => {
  // Pattern 1: Numbered format - 1. **word** : (type) meaning /pronunciation/
  const numberedPattern = /^\d+\.\s*\*\*([^*]+)\*\*\s*:\s*\(([^)]+)\)\s*([^/]+)\s*\/([^/]+)\//;
  
  // Pattern 2: Bullet format - - **word** : (type) meaning /pronunciation/
  const bulletPattern = /^-\s*\*\*([^*]+)\*\*\s*:\s*\(([^)]+)\)\s*([^/]+)\s*\/([^/]+)\//;
  
  let match = line.match(numberedPattern);
  let number = '';
  
  if (match) {
    number = match[0].split('.')[0];
  } else {
    match = line.match(bulletPattern);
  }
  
  if (match) {
    return {
      type: 'vocabulary',
      number: number,
      english: match[1].trim(),
      partOfSpeech: match[2].trim(),
      vietnamese: match[3].trim(),
      pronunciation: match[4].trim()
    };
  }
  
  return { type: 'vocabulary', english: line, vietnamese: '', pronunciation: '' };
};
```

### 2. Dialogue Lines
```typescript
const parseDialogueLine = (line: string): DialogueItem => {
  // Pattern: **Speaker:** Text
  const pattern = /^\*\*([^:]+):\*\*\s*(.+)/;
  const match = line.match(pattern);
  
  if (match) {
    return {
      type: 'dialogue',
      speaker: match[1].trim(),
      text: match[2].trim()
    };
  }
  
  return { type: 'dialogue', speaker: '', text: line };
};
```

### 3. Exercise Parsing
```typescript
const parseExercise = (content: string[]): Exercise => {
  const exercise: Exercise = {
    type: 'generic',
    number: '',
    title: '',
    instructions: '',
    content: [],
    answers: []
  };
  
  // Extract exercise number and title
  const titleMatch = content[0].match(/Bài (\d+):\s*(.+)/);
  if (titleMatch) {
    exercise.number = titleMatch[1];
    exercise.title = titleMatch[2];
  }
  
  // Detect exercise type from content
  const fullText = content.join(' ').toLowerCase();
  if (fullText.includes('fill in') || fullText.includes('complete')) {
    exercise.type = 'fill-blank';
  } else if (fullText.includes('choose') || fullText.includes('circle')) {
    exercise.type = 'multiple-choice';
  } else if (fullText.includes('true or false')) {
    exercise.type = 'true-false';
  } else if (fullText.includes('match')) {
    exercise.type = 'matching';
  }
  
  // Find answers
  const answerIndex = content.findIndex(line => 
    line.includes('**Answer') || line.includes('**Đáp án')
  );
  
  if (answerIndex !== -1) {
    exercise.answers = parseAnswers(content[answerIndex]);
  }
  
  return exercise;
};
```

## Table of Contents Generation

The Table of Contents should reflect the standard unit structure:

```typescript
const generateTableOfContents = (unit: Unit): Heading[] => {
  const headings: Heading[] = [];
  
  // Add unit title
  headings.push({
    id: slugify(unit.title),
    text: unit.title,
    level: 1
  });
  
  // Add sections in pedagogical order
  unit.sections.forEach(section => {
    headings.push({
      id: slugify(section.title),
      text: section.title,
      level: 2
    });
    
    // Add subsections
    section.subsections?.forEach(subsection => {
      headings.push({
        id: slugify(subsection.title),
        text: subsection.title,
        level: 3
      });
    });
  });
  
  return headings;
};
```

## Best Practices

### 1. **Maintain Pedagogical Flow**
- Always sort sections according to the standard unit structure
- Preserve subsection order within each main section
- Ensure smooth navigation between sections

### 2. **Handle Missing Sections**
- Not all units may have all 7 sections
- Parser should handle missing sections gracefully
- Don't create empty sections

### 3. **Flexible Content Parsing**
- Support variations in formatting
- Handle mixed English/Vietnamese content
- Preserve all content even if it doesn't match patterns

### 4. **Error Handling**
```typescript
try {
  const sortedSections = sortSections(sections);
  // Validate that we have at least Getting Started
  if (!sortedSections.find(s => s.type === 'getting-started')) {
    console.warn('Unit missing Getting Started section');
  }
} catch (error) {
  console.error('Error sorting sections:', error);
  // Return unsorted sections as fallback
  return sections;
}
```

## Testing Section Order

```typescript
describe('Section Ordering', () => {
  test('sections are reordered to standard sequence', () => {
    const input = [
      { title: 'SKILLS 1', type: 'skills-1' },
      { title: 'GETTING STARTED', type: 'getting-started' },
      { title: 'A CLOSER LOOK 1', type: 'closer-look-1' }
    ];
    
    const sorted = sortSections(input);
    
    expect(sorted.map(s => s.type)).toEqual([
      'getting-started',
      'closer-look-1',
      'skills-1'
    ]);
  });
  
  test('unknown sections maintain relative order', () => {
    const input = [
      { title: 'CUSTOM SECTION', type: 'unknown', originalIndex: 0 },
      { title: 'GETTING STARTED', type: 'getting-started', originalIndex: 1 },
      { title: 'ANOTHER CUSTOM', type: 'unknown', originalIndex: 2 }
    ];
    
    const sorted = sortSections(input);
    
    // Getting Started should be first, custom sections maintain order
    expect(sorted[0].type).toBe('getting-started');
    expect(sorted[1].title).toBe('CUSTOM SECTION');
    expect(sorted[2].title).toBe('ANOTHER CUSTOM');
  });
});
```

## Layout Design - Maximizing Content Space

### 1. **Compact Header**
```typescript
// In Layout.tsx - Minimize header height
const Layout: React.FC = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" sx={{ 
        height: 56, // Compact height
        boxShadow: 1 // Minimal shadow
      }}>
        <Toolbar variant="dense"> {/* Use dense variant */}
          <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
            English Learning Platform
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 2 }}> {/* Reduced padding */}
        {children}
      </Box>
    </Box>
  );
};
```

### 2. **Sidebar Optimization**
```typescript
// Make sidebar collapsible or use drawer on mobile
const [sidebarOpen, setSidebarOpen] = useState(true);
const isMobile = useMediaQuery(theme.breakpoints.down('md'));

const sidebarWidth = sidebarOpen ? 280 : 60; // Collapsible width

<Drawer
  variant={isMobile ? 'temporary' : 'permanent'}
  open={sidebarOpen}
  sx={{
    width: sidebarWidth,
    '& .MuiDrawer-paper': {
      width: sidebarWidth,
      transition: 'width 0.3s',
      overflowX: 'hidden'
    }
  }}
>
```

### 3. **Content Area Maximization**
```typescript
// In App.tsx - Full width content with responsive margins
const contentMaxWidth = {
  xs: '100%',   // Mobile: full width
  sm: '100%',   // Tablet: full width
  md: 1200,     // Desktop: reasonable max width
  lg: 1400,     // Large screens
  xl: 1600      // Extra large screens
};

<Container maxWidth={false} sx={{
  px: { xs: 1, sm: 2, md: 3 }, // Responsive padding
  py: { xs: 1, sm: 2 },
  maxWidth: contentMaxWidth
}}>
```

### 4. **Section Card Optimization**
```typescript
// Reduce spacing between sections
const SectionCard: React.FC = ({ children, title }) => (
  <Card sx={{ 
    mb: 2, // Reduced margin (was 3)
    boxShadow: 1 // Lighter shadow
  }}>
    <CardContent sx={{ 
      p: { xs: 1.5, sm: 2 }, // Responsive padding
      '&:last-child': { pb: 2 } // Override MUI's last-child padding
    }}>
      {/* Collapsible header to save space */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 1 // Reduced margin
      }}>
        <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          {title}
        </Typography>
        <IconButton size="small">
          <ExpandLessIcon />
        </IconButton>
      </Box>
      {children}
    </CardContent>
  </Card>
);
```

### 5. **Vocabulary Display Optimization**
```typescript
// Compact vocabulary cards
const VocabularyItem: React.FC = ({ item }) => (
  <Card variant="outlined" sx={{ 
    p: 1.5, // Compact padding
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 0.5
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="subtitle1" sx={{ 
        fontWeight: 600,
        fontSize: { xs: '0.95rem', sm: '1rem' }
      }}>
        {item.english}
      </Typography>
      <IconButton size="small" sx={{ p: 0.5 }}>
        <VolumeUpIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
      {item.vietnamese}
    </Typography>
    <Chip 
      label={item.pronunciation} 
      size="small" 
      variant="outlined"
      sx={{ fontSize: '0.75rem', height: 24 }}
    />
  </Card>
);
```

### 6. **Responsive Grid Layout**
```typescript
// Use more columns on larger screens
<Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
  {vocabItems.map((item, index) => (
    <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={index}>
      <VocabularyItem item={item} />
    </Grid>
  ))}
</Grid>
```

### 7. **Table of Contents - Floating/Sticky**
```typescript
// Make TOC sticky and collapsible
const TableOfContents: React.FC = ({ headings }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <Box sx={{
      position: 'sticky',
      top: 70,
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto',
      transition: 'all 0.3s',
      width: collapsed ? 50 : 250,
      backgroundColor: 'background.paper',
      borderRadius: 1,
      boxShadow: 1
    }}>
      {/* TOC content */}
    </Box>
  );
};
```

### 8. **Mobile Optimizations**
```typescript
// Hide less important elements on mobile
const isMobile = useMediaQuery('(max-width:600px)');

// Simplified mobile layout
if (isMobile) {
  return (
    <Box sx={{ p: 1 }}>
      {/* Simplified mobile-first content */}
      <SwipeableViews>
        {/* Swipeable sections */}
      </SwipeableViews>
    </Box>
  );
}
```

### 9. **Performance Optimizations**
```typescript
// Lazy load heavy components
const VocabularyGame = lazy(() => import('./components/content/VocabularyGame'));
const SkillsSection = lazy(() => import('./components/content/SkillsSection'));

// Virtual scrolling for long lists
import { FixedSizeList } from 'react-window';

const VirtualizedVocabList = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={80}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <VocabularyItem item={items[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

### 10. **CSS Optimizations**
```css
/* Global styles for maximum content */
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

/* Reduce default MUI spacing */
.MuiCardContent-root {
  padding: 12px;
}

/* Compact typography */
.MuiTypography-h5 {
  font-size: 1.25rem;
}

/* Hide scrollbars but keep functionality */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
```

## Summary

The key implementation points:

1. **Parse sections from markdown** preserving original order
2. **Identify section types** based on headers
3. **Reorder sections** according to the standard pedagogical sequence
4. **Route to appropriate components** based on section type
5. **Handle subsections** within main sections appropriately

This ensures a consistent learning experience where students always encounter content in the optimal order: Introduction → Vocabulary & Pronunciation → Grammar → Communication → Skills Practice → Review.
