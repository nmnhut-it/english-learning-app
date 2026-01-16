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
Voice lectures are markdown files with custom tags for TTS playback and structured content. Located in `v2/data/voice-lectures/`.

### File Structure
```
v2/data/voice-lectures/
├── g6/unit-07/
│   ├── getting-started.md
│   ├── a-closer-look-1.md
│   ├── a-closer-look-2.md
│   ├── communication.md
│   ├── skills-1.md
│   ├── skills-2.md
│   └── looking-back.md
├── g7/unit-07/...
├── g8/unit-07/...
└── g9/unit-07/...
```

---

## Markdown Schema (MUST follow strictly)

### 1. Document Header
```markdown
# UNIT [number]: [TITLE IN ENGLISH]

## [SECTION NAME] - [Subtitle if any]

<teacher_script pause="0">
Ok lớp [grade], Unit [number] nha - [Topic]. Mở sách trang [page] đi.
</teacher_script>
```

**Section names:**
- `GETTING STARTED`
- `A CLOSER LOOK 1`
- `A CLOSER LOOK 2`
- `COMMUNICATION`
- `SKILLS 1` (Reading + Speaking)
- `SKILLS 2` (Listening + Writing)
- `LOOKING BACK`

---

### 2. Vocabulary Section
Use `<vocabulary>` tag for markdown viewer to render with click-to-pronounce.

```markdown
<vocabulary>
1. **word** : (type) meaning /pronunciation/
2. **phrase** : meaning /pronunciation/
3. **verb - past - pp** : (v) meaning /pronunciation/
</vocabulary>
```

**Format rules:**
- Numbered list (1, 2, 3...)
- `**word**` in bold
- `: ` colon + space separator
- `(type)` word type: (n), (v), (adj), (adv), (phrase)
- `meaning` in Vietnamese
- `/pronunciation/` IPA at end
- Can add notes on next indented line

**Examples:**
```markdown
<vocabulary>
1. **talent show** : (n) chương trình tài năng /ˈtælənt ʃəʊ/
2. **prefer A to B** : thích A hơn B /prɪˈfɜː/
3. **forget - forgot - forgotten** : (v) quên /fəˈɡet/
   irregular verb
</vocabulary>
```

---

### 3. Content Blocks

#### 3.1 Dialogue (Hội thoại)
Use `<dialogue>` tag with bilingual table.

```markdown
<dialogue>
| English | Vietnamese |
|---------|------------|
| **Phong:** What are you watching, Hung? | **Phong:** Bạn đang xem gì, Hùng? |
| **Hung:** The Voice Kids. | **Hùng:** Giọng Hát Việt Nhí. |
</dialogue>
```

Or with separate translation block:
```markdown
<dialogue>
**Phong:** What are you watching, Hung?
**Hung:** The Voice Kids.
**Phong:** That music talent show is very interesting.
</dialogue>

<translation>
**Phong:** Bạn đang xem gì, Hùng?
**Hùng:** Giọng Hát Việt Nhí.
**Phong:** Chương trình tài năng âm nhạc đó rất thú vị.
</translation>
```

#### 3.2 Reading Passage (Đoạn đọc)
Use `<reading>` tag with bilingual table.

```markdown
<reading>
| English | Vietnamese |
|---------|------------|
| The Great Barrier Reef is one of the most beautiful natural wonders. | Rạn san hô Great Barrier là một trong những kỳ quan thiên nhiên đẹp nhất. |
| It is located in Australia. | Nó nằm ở Úc. |
</reading>
```

Or with separate translation:
```markdown
<reading>
The Great Barrier Reef is one of the most beautiful natural wonders of the world. It is located off the coast of Australia. The reef is home to thousands of species of fish and coral.
</reading>

<translation>
Rạn san hô Great Barrier là một trong những kỳ quan thiên nhiên đẹp nhất thế giới. Nó nằm ngoài khơi bờ biển Úc. Rạn san hô là nơi sinh sống của hàng nghìn loài cá và san hô.
</translation>
```

#### 3.3 TV Schedule / Table Content
Use `<content_table>` tag.

```markdown
<content_table>
| Time | Programme | Description |
|------|-----------|-------------|
| 8:00 | Wildlife | Watch animals in Cuc Phuong Forest |
| 9:00 | Comedy | The Fox Teacher |
</content_table>
```

#### 3.4 Translation Block
Use `<translation>` tag for standalone translations (not in tables).

```markdown
<translation>
Phong đang nói chuyện với Hùng về các chương trình TV.
Họ thảo luận về phim hoạt hình và chương trình giáo dục.
</translation>
```

For inline translations, use italics: `*Dịch tiếng Việt*`

---

### 4. Exercise Structure

#### 4.1 Exercise Header Format
```markdown
### Bài [number] trang [page] - [Exercise type in English]
```

**Exercise types:** (UPDATE this list when discovering new types)
| English | Vietnamese | `<questions type="">` |
|---------|------------|----------------------|
| Listen and read | Nghe và đọc | `listen_read` |
| Choose the correct answer | Chọn đáp án đúng | `multiple_choice` |
| Match | Nối | `matching` |
| Fill in the blanks | Điền vào chỗ trống | `fill_blanks` |
| True or False | Đúng hay sai | `true_false` |
| Find the words/adjectives | Tìm từ | `find_words` |
| Complete the sentences | Hoàn thành câu | `complete_sentences` |
| Work in pairs/groups | Làm việc theo cặp/nhóm | `speaking` |
| Read and answer | Đọc và trả lời | `read_answer` |
| Listen and tick | Nghe và đánh dấu | `listen_tick` |
| Put in order | Sắp xếp thứ tự | `ordering` |
| Make sentences | Đặt câu | `make_sentences` |
| Role play | Đóng vai | `role_play` |
| Write | Viết | `writing` |

> **NOTE:** When you encounter a NEW exercise type not in this list, ADD it here immediately.

#### 4.2 Complete Exercise Structure
Each exercise MUST have these sections in order:

```markdown
### Bài 2 trang 7 - Choose the correct answer

<teacher_script pause="60">
Bài 2, chọn đáp án đúng. 1 phút nha.
</teacher_script>

<task>
**Đề:** Choose the correct answer A, B, or C.
**Dịch đề:** Chọn đáp án đúng A, B hoặc C.
**Yêu cầu:** Đọc lại hội thoại ở bài 1, chọn đáp án đúng cho mỗi câu hỏi.
**Hướng dẫn:**
- Bước 1: Đọc câu hỏi và các đáp án A, B, C
- Bước 2: Quay lại đọc hội thoại để tìm thông tin
- Bước 3: Chọn đáp án đúng nhất
</task>
```

**Task structure:**
| Field | Description | Example |
|-------|-------------|---------|
| **Đề:** | Original English instruction | Choose the correct answer A, B, or C. |
| **Dịch đề:** | Vietnamese translation | Chọn đáp án đúng A, B hoặc C. |
| **Yêu cầu:** | What student needs to do | Đọc lại hội thoại, chọn đáp án đúng |
| **Hướng dẫn:** | Step-by-step guide (optional) | Bước 1: Đọc câu hỏi... |

<questions>
**1.** Phong and Hung are talking about ________.
- A. The Voice Kids programme
- B. English in a Minute programme
- C. different TV programmes

*Phong và Hùng đang nói về ________.*

**2.** Phong likes _________.
- A. animated films
- B. cartoons
- C. talent shows

*Phong thích _________.*
</questions>

<teacher_script pause="0" type="answer">
Ok đáp án nha. Câu 1 là C, câu 2 là A.
</teacher_script>

<answer>
**Đáp án:** 1.C | 2.A
</answer>

<explanation>
**Giải thích:**
1. C - Tụi nó nói về nhiều chương trình khác nhau (Voice Kids, Lion King, Tom & Jerry), không phải chỉ 1 chương trình.
2. A - Phong nói "I like animated films like The Lion King".
</explanation>
```

---

### 5. Exercise Type Schemas

Each exercise type has its own schema. **UPDATE when discovering new patterns.**

---

#### 5.1 `listen_read` - Listen and read
```markdown
<questions type="listen_read">
<!-- No questions, just content display -->
<!-- Use <dialogue> or <reading> tag for content -->
</questions>
```
**Answer format:** None (comprehension only)

---

#### 5.2 `multiple_choice` - Choose the correct answer
```markdown
<questions type="multiple_choice">
**1.** Question text ________.
- A. Option A
- B. Option B
- C. Option C

*Dịch câu hỏi tiếng Việt.*

**2.** Another question ________.
- A. Option A
- B. Option B
- C. Option C

*Dịch câu hỏi.*
</questions>
```
**Answer format:** `1.A | 2.B | 3.C`

---

#### 5.3 `matching` - Match
```markdown
<questions type="matching">
| | Column A | | Column B |
|---|---------|---|----------|
| 1 | The Voice Kids | a | animated film |
| 2 | The Lion King | b | channel |
| 3 | Tom and Jerry | c | music talent show |
| 4 | VTV7 | d | educational programme |
| 5 | English in a Minute | e | cartoon |
</questions>
```
**Answer format:** `1-c | 2-a | 3-e | 4-b | 5-d`

---

#### 5.4 `fill_blanks` - Fill in the blanks
```markdown
<questions type="fill_blanks">
**Word bank:** *popular / boring / cute / funny / educational*

**1.** This programme is very _______. Everyone watches it.
**2.** I don't like this film. It's _______.
**3.** Look at that cat! It's so _______.
</questions>
```
**Answer format:** `1. popular | 2. boring | 3. cute`

---

#### 5.5 `true_false` - True or False
```markdown
<questions type="true_false">
**1.** Tom likes watching cartoons. _____

*Tom thích xem phim hoạt hình.*

**2.** Lan goes to school by bus. _____

*Lan đi học bằng xe buýt.*

**3.** The conversation is about food. _____

*Cuộc hội thoại nói về thức ăn.*
</questions>
```
**Answer format:** `1. T | 2. F | 3. F`

---

#### 5.6 `find_words` - Find words/adjectives
```markdown
<questions type="find_words">
**Find the adjectives that describe:**

1. The Voice Kids → _______
2. Animated films → _______
3. Jerry the mouse → _______
4. Programmes on VTV7 → _______
</questions>
```
**Answer format:**
```
1. The Voice Kids → **interesting**
2. Animated films → **wonderful**
```

---

#### 5.7 `complete_sentences` - Complete the sentences
```markdown
<questions type="complete_sentences">
**Complete with the correct form of the verb:**

**1.** She _______ (watch) TV every evening.
**2.** They _______ (not like) horror films.
**3.** _______ he _______ (prefer) comedies?
</questions>
```
**Answer format:** `1. watches | 2. don't like | 3. Does... prefer`

---

#### 5.8 `speaking` - Work in pairs/groups
```markdown
<questions type="speaking">
**Situation:** Interview your partner about their favourite TV programme.

**Câu hỏi gợi ý:**
- What's your favourite TV programme?
- What channel is it on?
- When do you watch it?
- Why do you like it?

**Cấu trúc câu trả lời:**
- My favourite programme is...
- It's on channel...
- I watch it at/on...
- I like it because...

**Mẫu báo cáo:**

| English | Vietnamese |
|---------|------------|
| In our group, Mai likes sports programmes on TV. | Trong nhóm, Mai thích chương trình thể thao trên TV. |
| She watches them on VTV3 every weekend. | Cô ấy xem trên VTV3 mỗi cuối tuần. |
</questions>
```
**Answer format:** Sample answers provided

---

#### 5.9 `read_answer` - Read and answer questions
```markdown
<questions type="read_answer">
**Read the passage and answer the questions:**

**1.** What is the passage about?
→ _______________________

*Đoạn văn nói về gì?*

**2.** Where is the Great Barrier Reef?
→ _______________________

*Rạn san hô Great Barrier ở đâu?*

**3.** Why is it famous?
→ _______________________

*Tại sao nó nổi tiếng?*
</questions>
```
**Answer format:** Full sentence answers

---

#### 5.10 `listen_tick` - Listen and tick
```markdown
<questions type="listen_tick">
**Listen and tick (✓) the correct box:**

| Programme | Mai | Phong | Hùng |
|-----------|-----|-------|------|
| Cartoons | | | |
| News | | | |
| Sports | | | |
| Music shows | | | |
</questions>
```
**Answer format:** Table with ✓ marks

---

#### 5.11 `ordering` - Put in order
```markdown
<questions type="ordering">
**Put the sentences in the correct order:**

___ He watches The Voice Kids.
___ Phong turns on the TV.
___ The programme ends at 9 pm.
___ Phong has dinner with his family.
___ He goes to bed.
</questions>
```
**Answer format:** `1-b | 2-a | 3-d | 4-c | 5-e` or `2 → 1 → 4 → 3 → 5`

---

#### 5.12 `make_sentences` - Make sentences
```markdown
<questions type="make_sentences">
**Make sentences from the cues:**

**1.** I / like / watch / cartoon / evening
→ _______________________

**2.** She / prefer / comedy / horror film
→ _______________________

**3.** What / programme / you / watch / last night?
→ _______________________
</questions>
```
**Answer format:** Full sentences
```
1. I like watching cartoons in the evening.
2. She prefers comedy to horror films.
3. What programme did you watch last night?
```

---

#### 5.13 `role_play` - Role play
```markdown
<questions type="role_play">
**Role play the conversation:**

**Situation:** You meet a friend. Talk about your favourite TV programmes.

**Role A:** Ask about favourite programmes
**Role B:** Answer and ask back

**Useful expressions:**
- What's your favourite...?
- I really like...
- How about you?
- Me too! / Really? I prefer...

**Sample dialogue:**

| A | B |
|---|---|
| Hi! What's your favourite TV programme? | Hi! I really like The Voice Kids. |
| Oh, that's a talent show, right? | Yes! The singers are amazing. How about you? |
| I prefer cartoons like Tom and Jerry. | Really? That's funny! |
</questions>
```
**Answer format:** Sample dialogue provided

---

#### 5.14 `writing` - Write
```markdown
<questions type="writing">
**Write a paragraph (50-70 words) about your favourite TV programme.**

**Outline:**
1. What is your favourite programme?
2. What channel is it on?
3. When do you watch it?
4. Why do you like it?

**Useful vocabulary:**
- favourite, interesting, educational, funny
- I like... because...
- It's on channel...
- I watch it every...

**Sample:**

| English | Vietnamese |
|---------|------------|
| My favourite TV programme is The Voice Kids. It's a music talent show on VTV3. I watch it every Saturday evening with my family. I like it because the singers are very talented and the songs are beautiful. | Chương trình TV yêu thích của tôi là Giọng Hát Việt Nhí. Đó là chương trình tài năng âm nhạc trên VTV3. Tôi xem nó vào tối thứ Bảy hàng tuần với gia đình. Tôi thích nó vì các ca sĩ rất tài năng và các bài hát rất hay. |
</questions>
```
**Answer format:** Sample paragraph with translation

---

### 6. Teacher Script Format

```markdown
<teacher_script pause="[seconds]" type="[type]" href="[audio_url]">
Script content - natural Southern Vietnamese
</teacher_script>
```

**Attributes:**
| Attribute | Values | Description |
|-----------|--------|-------------|
| `pause` | 0, 30, 45, 60, 120... | Seconds to wait after speaking |
| `type` | `intro`, `instruction`, `answer` | Script type (optional) |
| `href` | URL or path | Pre-generated audio file (optional, for caching/offline) |

**Audio workflow:**
1. First time: TTS generates audio from script text
2. Save audio to `v2/data/audio/g6/unit-07/script-001.mp3`
3. Update `href` attribute for future playback (faster, offline-capable)

**Style Guide - DO:**
- Natural Southern Vietnamese: "nha", "đi", "thôi", "ok"
- Short, concise instructions
- Talk like a friend

**Style Guide - DON'T:**
- Formal: "các em hãy", "chúng ta sẽ"
- Cringe: "Chào các em! Hôm nay..."
- Long explanations

**Examples:**
```
❌ "Chào các em! Hôm nay chúng ta sẽ học Unit 7."
✅ "Ok lớp 6, Unit 7 nha - Television. Mở sách trang 6 đi."

❌ "Các em hãy làm bài tập số 2."
✅ "Bài 2, chọn đáp án đúng. 1 phút nha."

❌ "Bây giờ cô sẽ chữa bài cho các em."
✅ "Ok đáp án nha."
```

---

### 7. Complete File Example

```markdown
# UNIT 7: TELEVISION

## GETTING STARTED - What's on today?

<teacher_script pause="0">
Ok lớp 6, Unit 7 nha - Television. Mở sách trang 6 tập 2 đi.
</teacher_script>

---

<vocabulary>
1. **talent show** : (n) chương trình tài năng /ˈtælənt ʃəʊ/
2. **programme** : (n) chương trình /ˈprəʊɡræm/
3. **animated film** : (n) phim hoạt hình /ˈænɪmeɪtɪd fɪlm/
</vocabulary>

<teacher_script pause="0">
Từ vựng click vô nghe phát âm, ghi vô vở rồi qua bài 1 nha.
</teacher_script>

---

### Bài 1 trang 6 - Listen and read

<teacher_script pause="0">
Bài 1, nghe và đọc hội thoại.
</teacher_script>

<task>
**Đề:** Listen and read.
**Dịch đề:** Nghe và đọc.
**Yêu cầu:** Nghe audio và đọc theo đoạn hội thoại.
</task>

<dialogue>
| English | Vietnamese |
|---------|------------|
| **Phong:** What are you watching, Hung? | **Phong:** Bạn đang xem gì, Hùng? |
| **Hung:** The Voice Kids. | **Hùng:** Giọng Hát Việt Nhí. |
</dialogue>

---

### Bài 2 trang 7 - Choose the correct answer

<teacher_script pause="60">
Bài 2, chọn đáp án đúng. 1 phút nha.
</teacher_script>

<task>
**Đề:** Choose the correct answer A, B, or C.
**Dịch đề:** Chọn đáp án đúng A, B hoặc C.
**Yêu cầu:** Đọc lại hội thoại, chọn đáp án đúng.
</task>

<questions type="multiple_choice">
**1.** Phong and Hung are talking about ________.
- A. The Voice Kids programme
- B. English in a Minute programme
- C. different TV programmes

*Phong và Hùng đang nói về ________.*
</questions>

<teacher_script pause="0" type="answer">
Ok đáp án nha. Câu 1 là C.
</teacher_script>

<answer>
**Đáp án:** 1.C
</answer>

<explanation>
**Giải thích:**
1. C - Tụi nó nói về nhiều chương trình khác nhau.
</explanation>

---

<teacher_script pause="0">
Ok hết Getting Started. Về học từ vựng, mai qua A Closer Look 1 nha.
</teacher_script>
```

---

### 8. Content Sources
- **Original markdown**: `markdown-files/formatg6/`, `markdown-files/g7/`, etc.
- **VietJack/LoiGiaiHay**: Supplement explanations and missing content
- **Combine**: Vocabulary from original + explanations from external sources

### 9. Tag Summary for Markdown Viewer

| Tag | Purpose | Render As |
|-----|---------|-----------|
| `<vocabulary>` | Word list | Click-to-pronounce cards |
| `<dialogue>` | Conversation | Bilingual table with audio |
| `<reading>` | Reading passage | Bilingual paragraph |
| `<content_table>` | Tables (schedules, etc.) | Formatted table |
| `<translation>` | Vietnamese translation block | Styled translation box |
| `<task>` | Exercise instructions | Task box |
| `<questions type="">` | Questions/items | Interactive questions |
| `<answer>` | Correct answers | Answer reveal (hidden initially) |
| `<explanation>` | Explanations | Collapsible section |
| `<teacher_script>` | TTS script | Audio playback + timer |
| `<pronunciation_theory>` | Lý thuyết phát âm | Styled box with diagrams |
| `<audio>` | Audio file từ sách | Audio player với controls |

**Attributes summary:**
| Tag | Attributes |
|-----|------------|
| `<questions>` | `type="multiple_choice\|matching\|fill_blanks\|pronunciation\|..."` |
| `<teacher_script>` | `pause="60"`, `type="answer"`, `action="record"`, `href="audio/file.mp3"` |
| `<audio>` | `src="path/to/file.mp3"` hoặc `src="<!-- TODO: audio_id -->"` |

### 10. Schema Maintenance

> **IMPORTANT:** This schema is a living document. When processing new lessons:
> 1. If you find a NEW exercise type → ADD to Exercise types table (section 4.1)
> 2. If you find a NEW content pattern → ADD new tag definition
> 3. Keep examples updated with real content from lessons

---

## Pronunciation Teaching Pattern

### Cấu trúc bài Pronunciation (A Closer Look 1)

Mỗi Unit có phần Pronunciation trong A Closer Look 1. Cấu trúc:

| # | Chunk | Nội dung | Tag |
|---|-------|----------|-----|
| 1 | intro | Giới thiệu âm học hôm nay | `<teacher_script>` |
| 2 | theory | Lý thuyết phát âm (vị trí lưỡi, cách thực hiện) | `<pronunciation_theory>` |
| 3 | audio_example | Audio mẫu từ sách (nếu có) | `<audio>` |
| 4 | summary | Bảng tóm tắt phân biệt âm | `<vocabulary>` |
| 5 | exercise | Bài tập Listen and repeat | `<questions type="pronunciation">` + `<audio>` |
| 6 | record | Ghi âm đọc lại gửi thầy | `action="record"` |
| 7 | tongue_twister | Câu luyện phát âm khó (nếu có) | `<questions type="pronunciation">` |

### Tag `<pronunciation_theory>`

Dùng để hiển thị lý thuyết phát âm với diagram:

```markdown
<pronunciation_theory>
## Âm /θ/ và /ð/ - Cách phát âm

### Vị trí miệng và lưỡi
```
     Răng trên
        ↓
    ════════════
       ↑ đầu lưỡi đặt giữa 2 hàm răng
    ════════════
        ↑
     Răng dưới
```

### Bước thực hiện:
1. **Đặt lưỡi**: Đưa đầu lưỡi ra giữa 2 hàm răng
2. **Thổi hơi**: Đẩy hơi qua khe giữa lưỡi và răng trên
3. **Phân biệt**:
   - **/θ/** = KHÔNG rung cổ họng (vô thanh)
   - **/ð/** = RUNG cổ họng (hữu thanh)

### Mẹo nhớ:
| Âm | Rung cổ? | Ví dụ | Mẹo |
|----|----------|-------|-----|
| /θ/ | ❌ Không | think, thank | Đặt tay lên cổ, không rung |
| /ð/ | ✅ Có | this, that | Đặt tay lên cổ, cảm nhận rung |

### Lỗi thường gặp:
- ❌ Đọc /θ/ thành /t/ hoặc /s/
- ❌ Đọc /ð/ thành /d/ hoặc /z/
- ✅ Nhớ: LƯỠI PHẢI CHẠM RĂNG!
</pronunciation_theory>
```

### Tag `<audio>` - Audio từ sách

Dùng cho audio bài nghe từ sách giáo khoa:

```markdown
<audio src="<!-- TODO: g6_u07_acl1_exercise4.mp3 -->">
**Bài 4 Audio:** Listen and repeat
</audio>
```

**Lưu ý:**
- `src` có thể là URL hoặc placeholder `<!-- TODO: audio_id -->`
- Placeholder để điền URL sau khi có file audio
- Audio thường có từ VietJack hoặc nguồn khác

### Danh sách âm theo Unit (Lớp 6)

| Unit | Sounds | Notes |
|------|--------|-------|
| Unit 1 | /s/ và /ʃ/ | sea vs she |
| Unit 2 | /z/ và /ʒ/ | zoo vs television |
| Unit 3 | /b/ và /p/ | buy vs pie |
| Unit 4 | /i:/ và /ɪ/ | sheep vs ship |
| Unit 5 | /t/ và /d/ | ten vs den |
| Unit 6 | /ɒ/ và /əʊ/ | hot vs home |
| Unit 7 | /θ/ và /ð/ | think vs this |
| Unit 8 | /e/ và /eɪ/ | bed vs bay |
| ... | ... | ... |

> **NOTE:** Cập nhật bảng này khi làm các unit khác

---

## Student Submission (Gửi bài cho thầy)

Web app có tích hợp gửi bài để thầy sửa:

### Tính năng
- **Ghi âm** → Đọc lại và gửi cho thầy sửa
- **Chụp ảnh** → Chụp bài làm gửi cho thầy sửa

### UI Components
```
┌────────────────────────────────────┐
│ 🎤 Ghi âm  │  📸 Chụp ảnh  │  ✅ Xong │
└────────────────────────────────────┘
```

### Teacher Script Actions
| Action | UI hiển thị | Chức năng |
|--------|-------------|-----------|
| `action="record"` | Nút Ghi âm | Gửi voice cho thầy sửa |
| `action="photo"` | Nút Chụp ảnh | Gửi ảnh cho thầy sửa |

---

## Chunk Pattern (QUAN TRỌNG)

Mỗi chunk phải có **teacher_script TRƯỚC** và **SAU** để hướng dẫn học sinh:

```markdown
<!-- CHUNK: vocabulary -->

<teacher_script pause="0">
[TRƯỚC] Giới thiệu chunk này là gì, học sinh cần xem gì
</teacher_script>

<vocabulary>
... nội dung ...
</vocabulary>

<teacher_script pause="120">
[SAU] Học sinh cần làm gì với chunk này, bao lâu
</teacher_script>
```

### Ví dụ cụ thể

```markdown
<!-- CHUNK: vocabulary -->
<teacher_script pause="0">
Ok đây là từ vựng Unit 7 nha. Click vô từ để nghe phát âm.
</teacher_script>

<vocabulary>
1. **traffic** : (n) giao thông /ˈtræfɪk/
2. **cycle** : (v) đạp xe /ˈsaɪkl/
</vocabulary>

<teacher_script pause="120">
Ghi từ vựng vô vở đi. 2 phút nha.
</teacher_script>

<!-- CHUNK: record vocabulary -->
<teacher_script pause="0" action="record">
Bấm nút Ghi âm để đọc lại và gửi cho thầy sửa nha.
</teacher_script>

<teacher_script pause="0">
Xong rồi thì bấm tiếp tục nha.
</teacher_script>

<!-- CHUNK: dialogue -->
<teacher_script pause="0">
Đây là hội thoại bài 1. Đọc và dịch ra tiếng Việt nha.
</teacher_script>

<dialogue>
**Lan:** Hello, Mark. How are you?
**Mark:** I'm fine, thanks.
</dialogue>

<teacher_script pause="180">
Dịch hội thoại vô vở đi. 3 phút nha.
</teacher_script>

<!-- CHUNK: translation -->
<teacher_script pause="0">
Ok đây là bản dịch. So sánh với bài dịch của mình nha.
</teacher_script>

<translation>
**Lan:** Chào Mark. Bạn khỏe không?
**Mark:** Tôi khỏe, cảm ơn.
</translation>

<teacher_script pause="60">
Sửa bài dịch nếu sai. 1 phút nha.
</teacher_script>
```

---

## Teaching Workflow - Lesson-Specific

**Pattern cho MỖI CHUNK:**
```
1. teacher_script (TRƯỚC) - giới thiệu, nói học sinh xem cái gì
2. content - nội dung hiển thị
3. teacher_script (SAU) - nói làm gì, bao lâu, hoặc action
```

---

### 📖 GETTING STARTED

**Chunks theo thứ tự:**

| # | Chunk | Trước (giới thiệu) | Content | Sau (hướng dẫn) |
|---|-------|-------------------|---------|-----------------|
| 1 | intro | "Unit X nha - [Topic]" | - | "Mở sách trang Y đi" |
| 2 | vocabulary | "Đây là từ vựng. Click nghe phát âm" | `<vocabulary>` | "Ghi vô vở. 2 phút" |
| 3 | record_vocab | "Đọc từ vựng và record" | Record button | "Xong bấm tiếp" |
| 4 | dialogue | "Đây là hội thoại. Đọc và dịch" | `<dialogue>` | "Dịch vô vở. 3 phút" |
| 5 | translation | "Đây là bản dịch. So sánh" | `<translation>` | "Sửa nếu sai. 1 phút" |
| 6 | record_dialogue | "Đọc hội thoại và record" | Record button | "Xong bấm tiếp" |
| 7 | exercise_N | "Bài N, [loại bài]" | `<task>` + `<questions>` | "[Thời gian] nha" |
| 8 | answer_N | "Ok đáp án nha" | `<answer>` + `<explanation>` | "Sửa bài. 30 giây" |
| 9 | end | "Hết [Section]. Về học từ vựng" | - | - |

---

### 🔍 A CLOSER LOOK 1

| # | Chunk | Trước | Content | Sau |
|---|-------|-------|---------|-----|
| 1 | intro | "A Closer Look 1 nha" | - | - |
| 2 | vocabulary | "Từ vựng mới nè" | `<vocabulary>` | "Ghi vô vở. 2 phút" |
| 3 | record_vocab | "Record từ vựng" | Record button | "Xong bấm tiếp" |
| 4 | vocab_game | "Chơi game từ vựng" | Game component | "Xong bấm tiếp" |
| 5-N | exercises | ... | ... | ... |
| P | pronunciation | "Phần phát âm. Nghe và lặp lại" | `<pronunciation>` | "Record phát âm" |

---

### 📐 A CLOSER LOOK 2

| # | Chunk | Trước | Content | Sau |
|---|-------|-------|---------|-----|
| 1 | intro | "A Closer Look 2 - Grammar nha" | - | - |
| 2 | grammar | "Đây là công thức ngữ pháp" | `<grammar>` | "Ghi công thức. 3 phút" |
| 3-N | exercises | "Bài N, [loại]" | `<task>` + `<questions>` | "[time]" |
| A-N | answers | "Đáp án nha" | `<answer>` + `<explanation>` | "Sửa bài" |

---

### 💬 COMMUNICATION

| # | Chunk | Trước | Content | Sau |
|---|-------|-------|---------|-----|
| 1 | expressions | "Các cụm từ giao tiếp" | `<vocabulary>` | "Ghi vô vở. 1.5 phút" |
| 2 | model | "Hội thoại mẫu nè" | `<dialogue>` | "Đọc hiểu" |
| 3 | practice | "Viết hội thoại của mình" | `<task>` | "5 phút viết" |
| 4 | photo | "Chụp bài gửi cho thầy" | Photo button | "Xong bấm tiếp" |
| 5 | record | "Record hội thoại của mình" | Record button | "Xong bấm tiếp" |

---

### 📚 SKILLS 1 (Reading + Speaking)

| # | Chunk | Trước | Content | Sau |
|---|-------|-------|---------|-----|
| 1 | vocabulary | "Từ vựng bài đọc" | `<vocabulary>` | "1.5 phút" |
| 2 | reading | "Đọc bài và dịch" | `<reading>` | "5 phút dịch" |
| 3 | translation | "Bản dịch nè. So sánh" | `<translation>` | "1 phút sửa" |
| 4-N | exercises | ... | ... | ... |
| S | speaking | "Phần Speaking. Trả lời câu hỏi" | `<questions type="speaking">` | - |
| R | record | "Record câu trả lời" | Record button | "Xong bấm tiếp" |

---

### 🎧 SKILLS 2 (Listening + Writing)

| # | Chunk | Trước | Content | Sau |
|---|-------|-------|---------|-----|
| 1 | vocabulary | "Từ vựng bài nghe" | `<vocabulary>` | "1.5 phút" |
| 2 | pre_listen | "Đọc câu hỏi trước khi nghe" | `<questions>` | "1 phút đọc" |
| 3 | listen_1 | "Nghe lần 1" | `<audio>` | - |
| 4 | listen_2 | "Nghe lần 2 và trả lời" | `<audio>` | "1 phút làm bài" |
| 5 | answer | "Đáp án nha" | `<answer>` | "30 giây sửa" |
| 6 | writing | "Phần Writing. Viết theo hướng dẫn" | `<task>` | "10 phút viết" |
| 7 | photo | "Chụp bài gửi cho thầy" | Photo button | "Xong bấm tiếp" |
| 8 | sample | "Bài mẫu nè. So sánh" | Sample writing | "1 phút đọc" |

---

### 🔄 LOOKING BACK

| # | Chunk | Trước | Content | Sau |
|---|-------|-------|---------|-----|
| 1 | vocab_review | "Ôn từ vựng Unit này" | `<vocabulary>` | "1 phút xem lại" |
| 2 | vocab_game | "Chơi game ôn từ vựng" | Game component | "Xong bấm tiếp" |
| 3-N | exercises | ... | ... | ... |
| E | end | "Hết Unit X rồi" | - | "Ôn lại từ vựng + ngữ pháp nha" |

---

## Chunk Navigation

Học sinh bấm **Space/Enter** để chuyển chunk tiếp theo.

### Chunk Structure trong Markdown

```markdown
<!-- chunk: [chunk_id] -->
<teacher_script pause="0">
[Giới thiệu chunk]
</teacher_script>

[Content tags: vocabulary, dialogue, reading, questions, etc.]

<teacher_script pause="[seconds]" action="[action]">
[Hướng dẫn làm gì]
</teacher_script>
```

### Ví dụ File Hoàn Chỉnh

```markdown
# UNIT 7: TRAFFIC

## GETTING STARTED - A surprise guest

<!-- chunk: intro -->
<teacher_script pause="0">
Ok lớp 7, Unit 7 nha - Traffic. Giao thông.
</teacher_script>

<teacher_script pause="0">
Mở sách trang 72 đi.
</teacher_script>

---

<!-- chunk: vocabulary -->
<teacher_script pause="0">
Đây là từ vựng. Click vô từ để nghe phát âm nha.
</teacher_script>

<vocabulary>
1. **traffic** : (n) giao thông /ˈtræfɪk/
2. **cycle** : (v) đạp xe /ˈsaɪkl/
</vocabulary>

<teacher_script pause="120">
Ghi từ vựng vô vở đi. 2 phút nha.
</teacher_script>

---

<!-- chunk: record_vocabulary -->
<teacher_script pause="0" action="record">
Bấm nút Ghi âm để đọc lại và gửi cho thầy sửa nha.
</teacher_script>

<teacher_script pause="0">
Record xong bấm tiếp tục nha.
</teacher_script>

---

<!-- chunk: dialogue -->
<teacher_script pause="0">
Đây là hội thoại bài 1 nha. Đọc và dịch ra tiếng Việt.
</teacher_script>

<dialogue>
**Lan:** Hello, Mark. How are you?
**Mark:** I'm fine, thanks. And you?
</dialogue>

<teacher_script pause="180">
Dịch hội thoại vô vở đi. 3 phút nha.
</teacher_script>

---

<!-- chunk: translation -->
<teacher_script pause="0">
Ok đây là bản dịch. So sánh với bài của mình nha.
</teacher_script>

<translation>
**Lan:** Chào Mark. Bạn khỏe không?
**Mark:** Tôi khỏe, cảm ơn. Còn bạn?
</translation>

<teacher_script pause="60">
Sửa bài dịch nếu sai. 1 phút nha.
</teacher_script>

---

<!-- chunk: exercise_2 -->
<teacher_script pause="0">
Bài 2 nha. Chọn đáp án đúng A, B hoặc C.
</teacher_script>

<task>
**Đề:** Choose the correct answer A, B, or C.
**Dịch đề:** Chọn đáp án đúng A, B hoặc C.
</task>

<questions type="multiple_choice">
**1.** How does Lan usually go to school?
- A. By bike
- B. By motorbike
- C. By bus
</questions>

<teacher_script pause="60">
Làm bài đi. 1 phút nha.
</teacher_script>

---

<!-- chunk: answer_2 -->
<teacher_script pause="0">
Ok đáp án nha. Câu 1 là A - by bike.
</teacher_script>

<answer>
**Đáp án:** 1.A
</answer>

<explanation>
**Giải thích:**
1. A - Lan nói "Yes" khi hỏi "do you often cycle to school?"
</explanation>

<teacher_script pause="30">
Sửa bài nếu sai. 30 giây nha.
</teacher_script>

---

<!-- chunk: end -->
<teacher_script pause="0">
Ok hết Getting Started rồi. Về nhà học từ vựng, bài sau A Closer Look 1 nha.
</teacher_script>
```

---

## Teacher Script Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `pause` | 0-600 | Giây chờ sau khi nói (0 = chờ student bấm tiếp) |
| `type` | intro/instruction/answer | Loại script (optional) |
| `action` | record/photo/game | Hiển thị nút tương ứng |
| `href` | URL | File audio đã tạo sẵn (optional) |

---

## Audio Placeholders (Listening)

Bài nghe từ VietJack dùng placeholder:
```markdown
<audio src="<!-- TODO: vietjack_g6_u07_skills2_track01 -->" />
```

Tạo file `v2/data/voice-lectures/TODO-audio.md` để điền URL sau.