# Claude Development Instructions

## Project Overview
English Learning App V2 - Framework-less vanilla TypeScript application for Global Success curriculum grades 6-12.

## Key Commands for Development

### Build & Development
```bash
# V2 Development (when implemented)
cd v2/
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run type-check   # TypeScript validation
```

### Content Processing
```bash
# Content conversion tools
npm run convert-markdown     # Convert existing MD to XML
npm run validate-xml        # Validate XML against schema
npm run import-loigiahay    # Import from loigiahay content
```

### Testing
```bash
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e         # End-to-end tests
```

## Project Structure

```
english-learning-app/
├── v2/                          # V2 Implementation (vanilla TS)
│   ├── src/
│   │   ├── components/          # Vanilla TS components
│   │   │   ├── core/           # Base component classes
│   │   │   ├── MarkdownViewer/ # Content display
│   │   │   ├── VocabularyCard/ # Vocabulary interaction
│   │   │   ├── QuizGenerator/  # Quiz creation
│   │   │   └── AudioPlayer/    # TTS and audio
│   │   ├── services/           # Data services
│   │   ├── utils/              # Utilities
│   │   └── types/              # TypeScript definitions
│   ├── data/structured/        # XML content files
│   └── tools/content-converter/ # Migration tools
├── docs/                       # Documentation
│   ├── exercise-types.md       # Exercise definitions & enums
│   ├── xml-schema.md          # Complete XML schema
│   └── api-specification.md    # API documentation
├── frontend/ (current)         # Existing React app
├── backend/ (current)          # Existing Node.js API
├── markdown-files/             # Current content library
└── v2.md                      # Complete V2 architecture plan
```

## Exercise Types & XML Structure

### Exercise Type Enum
```typescript
enum ExerciseType {
  // Comprehension
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_IN_BLANKS = 'fill_in_blanks',
  
  // Vocabulary  
  VOCABULARY_MATCHING = 'vocabulary_matching',
  VOCABULARY_DEFINITION = 'vocabulary_definition',
  PRONUNCIATION_PRACTICE = 'pronunciation_practice',
  
  // Grammar
  GRAMMAR_TRANSFORMATION = 'grammar_transformation',
  SENTENCE_REORDER = 'sentence_reorder',
  ERROR_CORRECTION = 'error_correction',
  
  // Interactive
  LISTENING_COMPREHENSION = 'listening_comprehension',
  DRAG_AND_DROP = 'drag_and_drop',
  // ... see docs/exercise-types.md for complete list
}
```

### XML Schema Structure
```xml
<unit id="unit-01" title="Hobbies" order="1">
  <vocabulary_bank>
    <vocabulary_item id="hobby" cefr="A1">
      <word>hobby</word>
      <pronunciation>/ˈhɒbi/</pronunciation>
      <audio_files>
        <audio accent="british" file="hobby_uk.mp3"/>
      </audio_files>
      <definition>an activity for pleasure</definition>
      <translation lang="vi">sở thích</translation>
    </vocabulary_item>
  </vocabulary_bank>
  
  <sections>
    <section id="getting-started">
      <exercises>
        <exercise id="ex001" type="multiple_choice" difficulty="2">
          <question>
            <text>What are they talking about?</text>
            <translation>Họ đang nói về điều gì?</translation>
          </question>
          <options>
            <option correct="true">Hobbies</option>
            <option>School subjects</option>
          </options>
        </exercise>
      </exercises>
    </section>
  </sections>
</unit>
```

## Content Processing Workflow

### 1. Manual Content Import
```typescript
// Process loigiahay or manual notes
interface ContentProcessingRequest {
  sourceContent: string;
  contentType: 'loigiahay' | 'manual_notes' | 'textbook';
  grade: number;
  unit: number;
}

// AI service converts to structured XML
class AIContentService {
  async processContent(request: ContentProcessingRequest): Promise<XMLContent> {
    // Claude/Gemini integration for structured output
  }
}
```

### 2. XML Validation
- Schema validation against docs/xml-schema.md
- Business rule validation (vocabulary references, difficulty progression)
- Content quality checks (translations, audio file existence)

### 3. Component Rendering
```typescript
// Each exercise type maps to specific component
const ExerciseComponents = {
  [ExerciseType.MULTIPLE_CHOICE]: 'MultipleChoiceComponent',
  [ExerciseType.VOCABULARY_MATCHING]: 'VocabularyMatchingComponent',
  // ... see docs/exercise-types.md for mappings
};
```

## Development Guidelines

### Component Architecture
```typescript
// Base component class for vanilla TS
abstract class Component<T = {}> {
  protected element: HTMLElement;
  protected props: T;
  
  constructor(props: T) {
    this.props = props;
    this.element = this.createElement();
    this.bindEvents();
  }
  
  abstract createElement(): HTMLElement;
  abstract bindEvents(): void;
}

// Example implementation
class VocabularyCard extends Component<VocabularyCardProps> {
  createElement(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'vocabulary-card';
    // Vanilla DOM manipulation
    return card;
  }
}
```

### CSS Architecture
```css
/* CSS Custom Properties for theming */
:root {
  --primary-color: #2563eb;
  --success-color: #10b981;
  --error-color: #ef4444;
  /* ... see v2.md for complete design system */
}

/* Component-scoped styles */
.vocabulary-card {
  /* Modular CSS without frameworks */
}
```

### Audio Integration
```typescript
class AudioService {
  private audioContext: AudioContext;
  private audioCache: Map<string, AudioBuffer>;
  
  // Web Audio API for pronunciation
  async playPronunciation(audioUrl: string): Promise<void> {
    // Implementation with caching
  }
}
```

## Key Features Implementation

### 1. Markdown Viewer
- Lightweight markdown parsing
- Vocabulary word highlighting and click handling
- Content navigation between sections

### 2. Click-to-Pronounce Vocabulary
- Web Audio API integration
- Multiple accent support (British, American, Australian)
- Visual feedback for pronunciation

### 3. Quiz Generation
- Select vocabulary/content to create quizzes
- Multiple exercise types from enum
- Progress tracking and analytics

### 4. Recent Lessons Feature
- LocalStorage for progress tracking
- Last week's content review
- Spaced repetition recommendations

## AI Processing - Check Before Process

### Smart Content Workflow
```typescript
// V2 Check-before-process logic
const result = await contentProcessor.processLoigiahayContent(
  `[paste your loigiahay content]`,
  7, // grade
  1, // unit
  'Hobbies'
);

// Processing steps:
// 1. Check: /data/structured/grade-7/unit-01.xml exists?
// 2. Hash compare: Content changed since last processing?
// 3. Load from disk (instant) OR Process with AI (2 mins)
// 4. Save to disk for future instant access
```

### AI Vocabulary Extraction Only
```typescript
class AIVocabularyProcessor {
  // Extracts vocabulary using Claude/Gemini
  async extractVocabularyWithAI(content: string): Promise<VocabularyItem[]>
  
  // Preserves your existing structure (exercises, dialogues)
  async restructureExistingContent(sourceContent: string): Promise<Unit>
}
```

### Content Sources
- **Loigiahay**: Raw web content → AI extracts vocabulary
- **Manual Notes**: Your teaching notes → Structured vocabulary  
- **Textbook**: Digital content → Enhanced with vocabulary data

### Teacher Dashboard Default
V2 opens to teacher dashboard by default - focused on content management and quiz creation for classroom use.

## Performance Targets
- Bundle size: < 200KB gzipped
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Audio response time: < 500ms

## Quality Assurance

### Content Validation
- XML schema compliance
- Vocabulary reference integrity
- Audio file availability
- Translation completeness
- Difficulty progression logic

### Testing Strategy
- Unit tests for components and services
- Integration tests for content processing
- E2E tests for user workflows
- Performance testing for audio/content loading

## Migration Strategy

### Phase 1: Foundation
- Set up vanilla TS project structure
- Implement base component architecture
- Create XML schema and validation tools

### Phase 2: Content Processing  
- Build AI content processing service
- Create markdown-to-XML conversion tools
- Migrate sample content for testing

### Phase 3: Core Features
- Implement markdown viewer with vocabulary highlighting
- Build click-to-pronounce functionality
- Create quiz generation system

### Phase 4: Polish & Deploy
- Responsive design and mobile optimization
- Performance optimization
- User testing and feedback integration

## Deployment Configuration

```typescript
// Vite configuration for vanilla TS
export default defineConfig({
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          audio: ['./src/services/AudioService'],
          content: ['./src/services/ContentService'],
        }
      }
    }
  },
  // ... see v2.md for complete config
});
```

## Documentation References

- **v2.md**: Complete V2 architecture and implementation plan
- **docs/exercise-types.md**: All exercise types, XML structure, and rendering requirements  
- **docs/xml-schema.md**: Complete XML schema with validation rules and TypeScript interfaces
- **docs/api-specification.md**: API endpoints and service documentation (to be created)

## Quick Start Commands

```bash
# Read the complete architecture plan
cat v2.md
cat STATUS.md  # Current development status

# Review exercise types and XML structure  
cat docs/exercise-types.md
cat docs/xml-schema.md

# Start V2 Frontend (currently running)
cd v2/
npm run dev          # Running on http://localhost:3003

# Start V2 Backend (currently running)  
cd v2-backend/
npm run dev          # Running on http://localhost:5002

# Test backend health
curl http://localhost:5002/health
curl http://localhost:5002/api/status/health

# Test content processing
curl -X POST http://localhost:5002/api/process/complete \
  -H "Content-Type: application/json" \
  -d '{"sourceContent":"**test** content","grade":7,"unit":4,"unitTitle":"Test","lessonType":"getting_started"}'

# Process existing content (when content converter implemented)
npm run convert-content -- --source markdown-files/global-success-7/unit-01.md --output data/structured/grade-7/unit-01.xml

# Validate XML content (when validator implemented)  
npm run validate -- data/structured/grade-7/unit-01.xml
```

## Current Development Status

### ✅ WORKING (84 tests passing)
- **Core Architecture**: Component system, event bus, navigation
- **Teacher Dashboard**: Grades/units grid, recent activity, settings
- **Backend API**: Content processing, check-before-process logic
- **File Operations**: XML files saving to `/v2/data/structured/`
- **CORS Resolution**: Frontend→Backend communication working

### ⏳ FINAL INTEGRATION (95% complete)
- **Gemini AI**: API key loaded, health check passes, needs route initialization fix
- **ContentAdder**: Modal opens, form validation working, needs end-to-end test
- **Frontend-Backend**: Proxy configured, API calls routed, needs final verification

### 🎯 READY FOR USE
- Check-before-process: First time = AI process, subsequent = instant load
- Content structure: Proper XML with vocabulary extraction
- Teacher workflow: Add Content → Process → Save to disk → Available in dashboard

---

## Voice Lecture System

### Overview
Voice lectures are markdown files with `<teacher_script>` tags for TTS playback. Located in `v2/data/voice-lectures/`.

### File Structure
```
v2/data/voice-lectures/
├── g6/unit-07/getting-started.md
├── g7/unit-07/getting-started.md
├── g8/unit-07/getting-started.md
└── g9/unit-07/getting-started.md
```

### Vocabulary Format (MUST follow this format)
```markdown
**Vocabulary**

1. **word** : (type) meaning /pronunciation/
2. **phrase** : meaning /pronunciation/
3. **verb - past - pp** : meaning /pronunciation/
```

**Rules:**
- Use numbered list, NOT tables
- Format: `**word** : (type) meaning /pronunciation/`
- Type in parentheses: (n), (v), (adj), (adv), (phrase)
- Pronunciation at the end with slashes
- Can add notes on next line (indented)

### Teacher Script Format
```markdown
<teacher_script pause="0">
Script content here - natural Southern Vietnamese
</teacher_script>

<teacher_script pause="60">
Bài 2, làm trong 1 phút nha.
</teacher_script>

<teacher_script pause="0" type="answer">
Đáp án nha. Câu 1 là A...
</teacher_script>
```

**Attributes:**
- `pause`: seconds to wait after speaking (0, 30, 45, 60, 120...)
- `type`: optional, use `type="answer"` for answer scripts

### Exercise Structure (MUST include all sections)

Each exercise MUST have:
1. **Đề bài** (Question/Task)
2. **Dịch đề** (Vietnamese translation of the question)
3. **Yêu cầu** (What students need to do)
4. **Đáp án** (Answers)
5. **Giải thích** (Explanation for each answer)

**Example:**
```markdown
### Bài 2 trang 7 - Choose the correct answer

<teacher_script pause="60">
Bài 2, chọn đáp án đúng. 1 phút nha.
</teacher_script>

**Đề:** Choose the correct answer A, B, or C.

**Dịch đề:** Chọn đáp án đúng A, B hoặc C.

**Yêu cầu:** Đọc hội thoại ở bài 1, chọn đáp án đúng cho mỗi câu.

**1.** Phong and Hung are talking about ________.
- A. The Voice Kids programme
- B. English in a Minute programme
- C. different TV programmes

**2.** Phong likes _________.
- A. animated films
- B. cartoons
- C. talent shows

<teacher_script pause="0" type="answer">
Ok đáp án nha. Câu 1 là C, câu 2 là A.
</teacher_script>

**Đáp án:** 1.C | 2.A

**Giải thích:**
1. C - Tụi nó nói về nhiều chương trình khác nhau (Voice Kids, Lion King, Tom & Jerry, English in a Minute), không phải chỉ 1 chương trình.
2. A - Phong nói "I like animated films like The Lion King".
```

### Voice Script Style Guide

**DO:**
- Natural Southern Vietnamese dialect
- Short, concise instructions
- Use: "nha", "đi", "thôi", "ok"
- Talk like a friend, not formal teacher

**DON'T:**
- Long explanations in scripts
- Formal language like "các em hãy", "chúng ta sẽ"
- Read vocabulary one by one (students click to hear)
- Cringe phrases like "Chào các em! Hôm nay chúng ta..."

**Examples:**
```
❌ "Chào các em! Hôm nay chúng ta sẽ học Unit 7 về Television."
✅ "Ok lớp 6, Unit 7 nha - Television. Mở sách trang 6 đi."

❌ "Các em hãy làm bài tập số 2, các em có 1 phút để hoàn thành."
✅ "Bài 2, chọn đáp án đúng. 1 phút nha."

❌ "Bây giờ cô sẽ chữa bài cho các em."
✅ "Ok đáp án nha."
```

### Content Sources
- **Original markdown**: `markdown-files/formatg6/`, `markdown-files/g7/`, etc.
- **VietJack**: Supplement explanations and missing exercises
- **Combine**: Use vocabulary from original, add explanations from VietJack

### Lesson Types
Each unit has these lessons:
- getting-started
- a-closer-look-1
- a-closer-look-2
- communication
- skills-1
- skills-2
- looking-back