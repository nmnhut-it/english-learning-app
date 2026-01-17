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
Bài 2, chọn đáp án đúng. 1 phút.
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
Ok đáp án. Câu 1 là C, câu 2 là A.
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
<teacher_script pause="[seconds]" lang="[vi|en]" type="[type]" href="[audio_url]">
Script content
</teacher_script>
```

**Attributes:**
| Attribute | Values | Description |
|-----------|--------|-------------|
| `pause` | 0, 30, 45, 60, 120... | Seconds to wait after speaking |
| `lang` | `vi` (default), `en` | Language of script - MUST split by language |
| `type` | `intro`, `instruction`, `answer` | Script type (optional) |
| `href` | URL or path | Pre-generated audio file (optional, for caching/offline) |

---

### 6.1 LANGUAGE SEPARATION (QUAN TRỌNG)

**Problem:** Mixed language scripts sound unnatural when TTS switches mid-sentence.

**Solution:** Split scripts by language. One script = one language only.

```markdown
<!-- ❌ SAI: Mixed language -->
<teacher_script pause="0">
Bài 1 Listen and Read, đọc hội thoại và dịch vô vở nha.
</teacher_script>

<!-- ✅ ĐÚNG: Split by language -->
<teacher_script pause="0" lang="en">
Exercise 1. Listen and Read.
</teacher_script>

<teacher_script pause="0" lang="vi">
Đọc hội thoại rồi dịch vô vở nha.
</teacher_script>
```

**When to use English scripts:**
- Reading exercise instructions aloud: "Listen and repeat"
- Reading English example sentences
- Pronunciation demonstrations

**When to use Vietnamese scripts:**
- Explaining what to do
- Giving time instructions
- Answering/explaining in Vietnamese
- Jokes, encouragement, transitions

**Pattern: English instruction + Vietnamese explanation**
```markdown
<teacher_script pause="0" lang="en">
Exercise 2. Choose the correct answer A, B, or C.
</teacher_script>

<teacher_script pause="60" lang="vi">
Chọn đáp án đúng. 1 phút nha.
</teacher_script>
```

---

### 6.2 SOUTHERN VIETNAMESE PERSONALITY

**Core principle:** Talk like a chill tutor, not a formal teacher.

**Character traits:**
- Relaxed, friendly ("bạn bè" not "thầy trò")
- Light humor when appropriate
- Patient explanations
- Encouraging but not fake

**Southern Vietnamese markers (USE THESE):**
| Marker | Meaning | Example |
|--------|---------|---------|
| `nha` | soft confirmation | "Làm bài đi nha" |
| `hen` | agreement/reminder | "2 phút hen" |
| `đi` | gentle command | "Mở sách đi" |
| `thôi` | let's move on | "Ok thôi, qua bài sau" |
| `nè` | here/look | "Đáp án nè" |
| `á` | emphasis | "Sai rồi á" |
| `nghen` | okay? (checking) | "Hiểu chưa nghen?" |
| `luôn` | immediately/also | "Làm luôn bài 2" |
| `rồi` | done/already | "Xong rồi" |

**Filler words (natural speech):**
- "Ok" - transitions
- "Giờ" - now/next
- "Được rồi" - alright
- "Ủa" - surprise
- "Hả" - what? (when clarifying)

---

### 6.3 HUMOR GUIDELINES

**Philosophy:** Light humor keeps students engaged. Not jokes, but playful observations.

**Types of humor that work:**

**1. Self-deprecating / relatable**
```markdown
<teacher_script pause="0" lang="vi">
Bài này grammar hơi khó, hồi đó thầy cũng sai hoài luôn á.
</teacher_script>
```

**2. Playful exaggeration**
```markdown
<teacher_script pause="0" lang="vi">
Ai mà chọn B là chắc đang ngủ gục rồi nha.
</teacher_script>
```

**3. Pop culture references (age-appropriate)**
```markdown
<teacher_script pause="0" lang="vi">
Từ này giống tên nhân vật trong game đó, nhớ dễ hơn.
</teacher_script>
```

**4. Observational**
```markdown
<teacher_script pause="0" lang="vi">
Mấy đứa hay sai câu này lắm, thầy chấm bài thấy 10 đứa sai 9.
</teacher_script>
```

**5. Gentle teasing about common mistakes**
```markdown
<teacher_script pause="0" lang="vi">
Nhớ S ở cuối nha. Quên S là mất điểm oan uổng lắm đó.
</teacher_script>
```

**DON'T:**
- Forced jokes that interrupt flow
- Puns that don't translate
- Anything that could embarrass students
- Sarcasm (doesn't translate well to audio)

---

### 6.4 SCRIPT PATTERNS BY CONTEXT

**Pattern A: Exercise Introduction**
```markdown
<teacher_script pause="0" lang="en">
Exercise 2. Match the words with their meanings.
</teacher_script>

<teacher_script pause="45" lang="vi">
Nối từ với nghĩa. Có 5 từ, 45 giây nha.
</teacher_script>
```

**Pattern B: Answer Reveal (with personality)**
```markdown
<teacher_script pause="0" lang="vi">
Ok đáp án nè.
</teacher_script>

<answer>
**Đáp án:** 1-c | 2-a | 3-e
</answer>

<teacher_script pause="0" lang="vi">
Câu 1 là C. Ai chọn A là bị lừa rồi đó, đề bẫy chỗ này.
</teacher_script>

<teacher_script pause="0" lang="vi">
Câu 2 là A. Dễ nhất, ai sai câu này thì đọc lại bài đi nha.
</teacher_script>
```

**Pattern C: Grammar Explanation (chunked + humorous)**
```markdown
<teacher_script pause="0" lang="vi">
Ok giờ qua phần grammar. Hôm nay học "should" với "shouldn't".
</teacher_script>

<teacher_script pause="0" lang="vi">
Should là nên. Shouldn't là không nên. Dễ hơn mấy cái khác nhiều.
</teacher_script>

<teacher_script pause="0" lang="en">
You should study. You shouldn't play games.
</teacher_script>

<teacher_script pause="0" lang="vi">
Bạn nên học bài. Bạn không nên chơi game.
Thầy nói vậy chứ thầy cũng chơi game hoài luôn.
</teacher_script>
```

**Pattern D: Encouragement after difficult section**
```markdown
<teacher_script pause="0" lang="vi">
Ok xong phần khó nhất rồi. Phần sau dễ hơn nhiều, yên tâm.
</teacher_script>
```

**Pattern E: Transition between sections**
```markdown
<teacher_script pause="0" lang="vi">
Được rồi, hết vocabulary. Giờ qua phần pronunciation nha.
Phần này vui hơn, được nói nhiều.
</teacher_script>
```

---

### 6.5 TONE BY GRADE LEVEL

| Grade | Tone | Example |
|-------|------|---------|
| **G6** | Playful, simple words | "Dễ không? Dễ quá mà!" |
| **G7** | Friendly, slightly more mature | "Bài này hơi khó hơn lớp 6, nhưng logic giống nhau thôi" |
| **G8** | Casual but focused | "Tập trung nha, grammar unit này quan trọng cho thi" |
| **G9** | Supportive, exam-aware | "Dạng bài này hay ra thi, nhớ kỹ pattern nha" |

**Grade-specific phrases:**

**G6:**
- "Ai giỏi quá ta" (when correct)
- "Thử lại đi, gần đúng rồi"
- "Dễ ẹt mà"

**G7-G8:**
- "Câu này hay bị sai lắm nha"
- "Trick question đó, cẩn thận"
- "Pattern này nhớ kỹ đi"

**G9:**
- "Dạng đề thi hay ra"
- "Cái này cần cho high school"
- "Quan trọng nha, đừng skip"

---

### 6.6 AUDIO WORKFLOW

1. First time: TTS generates audio from script text
   - Vietnamese scripts → Vietnamese TTS voice
   - English scripts → English TTS voice (native accent)
2. Save audio to `v2/data/audio/g6/unit-07/script-001.mp3`
3. Update `href` attribute for future playback (faster, offline-capable)

**TTS Voice Selection:**
| `lang` | Voice | Notes |
|--------|-------|-------|
| `vi` | Southern Vietnamese male/female | Natural, not robotic |
| `en` | British or American | Match textbook accent |

---

### 6.7 STYLE COMPARISON

**❌ DON'T (Formal/Cringe):**
```
"Chào các em! Hôm nay chúng ta sẽ học Unit 7."
"Các em hãy làm bài tập số 2."
"Bây giờ cô sẽ chữa bài cho các em."
"Các em có hiểu không ạ?"
```

**✅ DO (Natural/Southern):**
```
"Ok lớp 6, Unit 7 nha - Television. Mở sách trang 6 đi."
"Bài 2, chọn đáp án đúng. 1 phút nha."
"Đáp án nè."
"Hiểu chưa? Chưa hiểu thì hỏi thầy."
```

**✅ DO (With humor):**
```
"Unit 7 - Television. Coi TV thì ai cũng thích rồi, học cũng dễ thôi."
"Bài 2 này dễ lắm, ai sai là đang ngủ gục đó nha."
"Đáp án nè. Mấy đứa làm đúng hết chưa? Chắc có đứa sai câu 3."
```

---

### 7. Complete File Example

```markdown
# UNIT 7: TELEVISION

## GETTING STARTED - What's on today?

<teacher_script pause="0" lang="vi">
Ok lớp 6, Unit 7 nha. Television - Truyền hình.
Coi TV thì ai cũng thích rồi, unit này dễ thôi.
</teacher_script>

<teacher_script pause="0" lang="vi">
Mở sách trang 6 tập 2 đi.
</teacher_script>

---

<vocabulary>
1. **talent show** : (n) chương trình tài năng /ˈtælənt ʃəʊ/
2. **programme** : (n) chương trình /ˈprəʊɡræm/
3. **animated film** : (n) phim hoạt hình /ˈænɪmeɪtɪd fɪlm/
</vocabulary>

<teacher_script pause="0" lang="vi">
Đây là từ vựng unit này. Bấm vô từ để nghe phát âm nha.
</teacher_script>

<teacher_script pause="120" lang="vi">
Ghi từ vựng vô vở đi. 2 phút hen.
</teacher_script>

---

### Bài 1 trang 6 - Listen and read

<teacher_script pause="0" lang="en">
Exercise 1. Listen and read.
</teacher_script>

<teacher_script pause="0" lang="vi">
Nghe và đọc hội thoại. Đây là Phong với Hùng nói chuyện về các chương trình TV.
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

<teacher_script pause="180" lang="vi">
Đọc hội thoại rồi dịch vô vở đi. 3 phút nha.
</teacher_script>

---

### Bài 2 trang 7 - Choose the correct answer

<teacher_script pause="0" lang="en">
Exercise 2. Choose the correct answer A, B, or C.
</teacher_script>

<teacher_script pause="60" lang="vi">
Chọn đáp án đúng. Đọc lại hội thoại bài 1 rồi trả lời nha.
1 phút thôi, bài này dễ mà.
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

<teacher_script pause="0" lang="vi">
Ok đáp án nè.
</teacher_script>

<answer>
**Đáp án:** 1.C
</answer>

<teacher_script pause="0" lang="vi">
Câu 1 là C. Tụi nó nói về nhiều chương trình khác nhau, không phải chỉ một chương trình thôi.
Ai chọn A là bị lừa rồi đó, đề hỏi "talking about" chứ không phải "watching".
</teacher_script>

<explanation>
**Giải thích:**
1. C - Tụi nó nói về nhiều chương trình khác nhau (The Voice Kids, The Lion King, Tom & Jerry...).
</explanation>

<teacher_script pause="30" lang="vi">
Sửa bài nếu sai nha. 30 giây.
</teacher_script>

---

<teacher_script pause="0" lang="vi">
Ok hết Getting Started rồi. Về nhà học từ vựng nha, mai qua A Closer Look 1.
Unit này vui lắm, có phần nói về phim hoạt hình.
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
| `<reading>` | Reading passage / **Tapescript** | Bilingual table |
| `<content_table>` | Tables (schedules, etc.) | Formatted table |
| `<translation>` | Vietnamese translation block | Styled translation box |
| `<task>` | Exercise instructions | Task box |
| `<questions type="">` | Questions/items | Interactive questions |
| `<answer>` | Correct answers | Answer reveal (hidden initially) |
| `<explanation>` | Explanations | Collapsible section |
| `<teacher_script>` | TTS script | Audio playback + timer |
| `<pronunciation_theory>` | Lý thuyết phát âm | Styled box with diagrams |
| `<grammar>` | Grammar rules/tables | Styled grammar box |
| `<audio>` | Audio file từ sách | Audio player với controls |

**Attributes summary:**
| Tag | Attributes |
|-----|------------|
| `<questions>` | `type="multiple_choice\|matching\|fill_blanks\|pronunciation\|listen_tick\|..."` |
| `<teacher_script>` | `pause="60"`, `lang="vi\|en"`, `type="answer"`, `action="record"`, `href="audio/file.mp3"` |
| `<audio>` | `src="path/to/file.mp3"` hoặc `src="<!-- TODO: audio_id -->"` |

> **IMPORTANT:** Always use `lang` attribute to separate Vietnamese and English scripts. One script = one language only. See section 6.1 for details.

**Note về `<reading>` cho Tapescript:**
- Dùng `<reading>` với bilingual table cho tapescript bài nghe
- Cho học sinh đọc trước khi nghe audio
- Nguồn: VietJack, LoiGiaiHay có phần "Nội dung bài nghe"

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
Ok đây là từ vựng Unit 7. Click vô từ để nghe phát âm.
</teacher_script>

<vocabulary>
1. **traffic** : (n) giao thông /ˈtræfɪk/
2. **cycle** : (v) đạp xe /ˈsaɪkl/
</vocabulary>

<teacher_script pause="120">
Ghi từ vựng vô vở đi. 2 phút.
</teacher_script>

<!-- CHUNK: record vocabulary -->
<teacher_script pause="0" action="record">
Bấm nút Ghi âm để đọc lại và gửi cho thầy sửa.
</teacher_script>

<teacher_script pause="0">
Xong rồi thì bấm tiếp tục.
</teacher_script>

<!-- CHUNK: dialogue -->
<teacher_script pause="0">
Đây là hội thoại bài 1. Đọc và dịch ra tiếng Việt.
</teacher_script>

<dialogue>
**Lan:** Hello, Mark. How are you?
**Mark:** I'm fine, thanks.
</dialogue>

<teacher_script pause="180">
Dịch hội thoại vô vở đi. 3 phút.
</teacher_script>

<!-- CHUNK: translation -->
<teacher_script pause="0">
Ok đây là bản dịch. So sánh với bài dịch của mình.
</teacher_script>

<translation>
**Lan:** Chào Mark. Bạn khỏe không?
**Mark:** Tôi khỏe, cảm ơn.
</translation>

<teacher_script pause="60">
Sửa bài dịch nếu sai. 1 phút.
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

### 📐 A CLOSER LOOK 2 (Grammar)

**QUAN TRỌNG:** Phần Grammar cần giảng giải CHI TIẾT, ÔN TỒN, NHỎ NHẸ.

#### Nguyên tắc dạy Grammar:

1. **Chia nhỏ từng khái niệm** - Không dồn hết vào 1 chunk
2. **Giải thích từng phần một** - Mỗi teacher_script chỉ nói 1-2 câu
3. **Giọng ôn tồn, nhỏ nhẹ** - Như đang nói chuyện với học sinh
4. **Cho ví dụ cụ thể** - Sau mỗi khái niệm
5. **Thêm mẹo nhớ** - Dùng ký hiệu, hình ảnh dễ nhớ

#### Cấu trúc Grammar Chunks:

| Phase | Chunks | Mô tả |
|-------|--------|-------|
| **Giới thiệu** | overview | Nói hôm nay học gì, có bao nhiêu phần |
| **Lý thuyết** | grammar_concept_1, grammar_concept_2... | Mỗi khái niệm nhỏ = 1 chunk riêng |
| **Tóm tắt** | grammar_summary | Bảng tóm tắt tất cả |
| **Bài tập** | exercise_N | Làm bài |
| **Đáp án** | answer_N | Giải thích TỪNG CÂU |

#### Ví dụ: Dạy WH-Questions

**❌ SAI - Dồn hết vào 1 chunk:**
```markdown
<teacher_script pause="0">
What hỏi cái gì, Where hỏi ở đâu, When hỏi khi nào, Who hỏi ai, Why hỏi tại sao...
</teacher_script>
```

**✅ ĐÚNG - Chia nhỏ từng từ hỏi:**
```markdown
<!-- chunk: grammar_what -->
<teacher_script pause="0">
Đầu tiên là WHAT - nghĩa là "cái gì".
</teacher_script>

<grammar>
### WHAT - Cái gì
**Dùng để hỏi:** Sự vật, hoạt động
**Ví dụ:** What are you watching? → I'm watching cartoons.
</grammar>

<teacher_script pause="0">
Nếu câu trả lời là một sự vật hay hoạt động, thì dùng What để hỏi.
</teacher_script>

<teacher_script pause="30">
Ghi vô vở: WHAT = cái gì, hỏi về sự vật.
</teacher_script>

---

<!-- chunk: grammar_where -->
<teacher_script pause="0">
Tiếp theo là WHERE - nghĩa là "ở đâu".
</teacher_script>
...
```

#### Ví dụ: Giải thích đáp án bài tập

**❌ SAI - Nói đáp án một lần:**
```markdown
<teacher_script pause="0">
Ok đáp án. 1-c, 2-a, 3-e, 4-b, 5-d.
</teacher_script>
```

**✅ ĐÚNG - Giải thích từng câu:**
```markdown
<teacher_script pause="0">
Ok đáp án.
</teacher_script>

<answer>
**Đáp án:** 1-c | 2-a | 3-e | 4-b | 5-d
</answer>

<teacher_script pause="0">
Giải thích từng câu.
</teacher_script>

<teacher_script pause="0">
Câu 1 dùng AND: "I like animal programmes, and my brother likes them, too."
</teacher_script>

<teacher_script pause="0">
Cả hai cùng thích - 2 ý cùng chiều, nên dùng AND.
</teacher_script>

<teacher_script pause="0">
Câu 2 dùng SO: "I'll get up early, so I can be at the stadium on time."
</teacher_script>

<teacher_script pause="0">
Dậy sớm là nguyên nhân, đến kịp giờ là kết quả, nên dùng SO.
</teacher_script>
...
```

#### Mẹo nhớ Grammar (dùng ký hiệu)

Khi dạy grammar, thêm mẹo nhớ bằng ký hiệu:

| Grammar Point | Mẹo nhớ | Ví dụ script |
|---------------|---------|--------------|
| **and** | + (cộng thêm) | "AND giống như phép cộng: ý 1 + ý 2" |
| **but** | ↔ (đối lập) | "BUT là 2 ý ngược nhau" |
| **so** | → (kết quả) | "SO là mũi tên: nguyên nhân → kết quả" |
| **because** | ← (lý do) | "BECAUSE giải thích lý do" |

```markdown
<teacher_script pause="0">
Mẹo nhớ nha: AND là cộng, BUT là đối, SO là kết quả.
</teacher_script>
```

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
| 2 | **tapescript** | "Đây là nội dung bài nghe" | `<reading>` bilingual table | "1 phút đọc hiểu" |
| 3 | exercise_1 | "Bài 1, nghe và tick/match" | `<questions type="listen_tick">` + `<audio>` | "1 phút làm bài" |
| 4 | answer_1 | "Đáp án nha" | `<answer>` | "30 giây sửa" |
| 5 | exercise_2 | "Bài 2, True/False" | `<questions type="true_false">` + `<audio>` | "45 giây làm bài" |
| 6 | answer_2 | "Đáp án + giải thích từng câu" | `<answer>` | "30 giây sửa" |
| 7 | writing | "Phần Writing. Viết theo hướng dẫn" | `<task>` | "5-10 phút viết" |
| 8 | photo | "Chụp bài gửi cho thầy" | Photo button | "Xong bấm tiếp" |
| 9 | sample | "Bài mẫu nè. So sánh" | `<reading>` bilingual table | "1 phút đọc" |

#### Tapescript Pattern (QUAN TRỌNG cho Listening)

Mỗi bài Listening PHẢI có tapescript để học sinh đọc trước/sau khi nghe:

```markdown
<!-- chunk: tapescript -->
<teacher_script pause="0">
Đây là nội dung bài nghe. Đọc trước để hiểu.
</teacher_script>

<reading>
| English | Vietnamese |
|---------|------------|
| Here are some interesting TV programmes for you. | Đây là một số chương trình TV thú vị dành cho bạn. |
| Green Summer, a music programme, is on channel 1. | Mùa Hè Xanh, một chương trình âm nhạc, chiếu trên kênh 1. |
| It starts at eight o'clock. | Nó bắt đầu lúc 8 giờ. |
</reading>

<teacher_script pause="60">
Đọc hiểu bài nghe. 1 phút.
</teacher_script>
```

**Nguồn tapescript:**
- VietJack: Có phần "Nội dung bài nghe" hoặc "Bài nghe"
- LoiGiaiHay: Tương tự
- Nếu không có, dùng audio transcript từ sách giáo viên

**Audio placeholder:**
```markdown
<audio src="<!-- TODO: g6_u07_skills2_listening.mp3 -->">
**Audio:** Listen to the passage about TV programmes
</audio>
```

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
Đây là từ vựng. Click vô từ để nghe phát âm.
</teacher_script>

<vocabulary>
1. **traffic** : (n) giao thông /ˈtræfɪk/
2. **cycle** : (v) đạp xe /ˈsaɪkl/
</vocabulary>

<teacher_script pause="120">
Ghi từ vựng vô vở đi. 2 phút.
</teacher_script>

---

<!-- chunk: record_vocabulary -->
<teacher_script pause="0" action="record">
Bấm nút Ghi âm để đọc lại và gửi cho thầy sửa.
</teacher_script>

<teacher_script pause="0">
Record xong bấm tiếp tục.
</teacher_script>

---

<!-- chunk: dialogue -->
<teacher_script pause="0">
Đây là hội thoại bài 1. Đọc và dịch ra tiếng Việt.
</teacher_script>

<dialogue>
**Lan:** Hello, Mark. How are you?
**Mark:** I'm fine, thanks. And you?
</dialogue>

<teacher_script pause="180">
Dịch hội thoại vô vở đi. 3 phút.
</teacher_script>

---

<!-- chunk: translation -->
<teacher_script pause="0">
Ok đây là bản dịch. So sánh với bài của mình.
</teacher_script>

<translation>
**Lan:** Chào Mark. Bạn khỏe không?
**Mark:** Tôi khỏe, cảm ơn. Còn bạn?
</translation>

<teacher_script pause="60">
Sửa bài dịch nếu sai. 1 phút.
</teacher_script>

---

<!-- chunk: exercise_2 -->
<teacher_script pause="0">
Bài 2. Chọn đáp án đúng A, B hoặc C.
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
Làm bài đi. 1 phút.
</teacher_script>

---

<!-- chunk: answer_2 -->
<teacher_script pause="0">
Ok đáp án. Câu 1 là A - by bike.
</teacher_script>

<answer>
**Đáp án:** 1.A
</answer>

<explanation>
**Giải thích:**
1. A - Lan nói "Yes" khi hỏi "do you often cycle to school?"
</explanation>

<teacher_script pause="30">
Sửa bài nếu sai. 30 giây.
</teacher_script>

---

<!-- chunk: end -->
<teacher_script pause="0">
Ok hết Getting Started rồi. Về nhà học từ vựng, bài sau A Closer Look 1.
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

---

## Best Practices (Kinh nghiệm)

### 0. Teacher Script đọc song song với nội dung hiển thị

**Nguyên tắc quan trọng nhất:** Teacher script phải ĐỌC cùng lúc với content đang hiển thị trên màn hình.

**Tại sao:**
- Học sinh vừa NHÌN vừa NGHE → tiếp thu tốt hơn
- Giống như giáo viên đứng trước bảng giảng bài
- Không bị lạc giữa audio và visual

**Pattern:**
```markdown
<grammar>
### WHAT - Cái gì

**Dùng để hỏi:** Sự vật, hoạt động

**Ví dụ:**
- **What** are you watching? → I'm watching cartoons.
  *(Bạn đang xem **gì**? → Tôi đang xem phim hoạt hình.)*
</grammar>

<teacher_script pause="0">
WHAT - nghĩa là "cái gì".
Dùng để hỏi về sự vật, hoạt động.
Ví dụ: What are you watching? - Bạn đang xem gì?
Trả lời: I'm watching cartoons - Tôi đang xem phim hoạt hình.
</teacher_script>
```

**Lưu ý:**
- Teacher script PHẢI đọc lại nội dung đang hiển thị
- Có thể thêm giải thích, nhưng core content phải khớp với màn hình
- Học sinh nhìn bảng + nghe thầy đọc = hiểu nhanh hơn

**Ví dụ với bảng từ vựng:**
```markdown
<vocabulary>
1. **talent show** : (n) chương trình tài năng /ˈtælənt ʃəʊ/
2. **programme** : (n) chương trình /ˈprəʊɡræm/
</vocabulary>

<teacher_script pause="0">
Từ 1: talent show - chương trình tài năng.
Từ 2: programme - chương trình.
Click vô từ để nghe phát âm.
</teacher_script>
```

---

### 1. Nguyên tắc "Chia nhỏ để trị"

**Vấn đề:** Khi dồn nhiều thông tin vào 1 teacher_script, học sinh bị overwhelm.

**Giải pháp:** Mỗi teacher_script chỉ nói 1-2 câu, 1 ý duy nhất.

```markdown
<!-- ❌ SAI: Quá nhiều thông tin -->
<teacher_script pause="0">
Wh-questions gồm What hỏi cái gì, Where hỏi ở đâu, When hỏi khi nào, Who hỏi ai, Why hỏi tại sao, How often hỏi tần suất, How many hỏi số lượng, How long hỏi bao lâu.
</teacher_script>

<!-- ✅ ĐÚNG: Chia nhỏ từng khái niệm -->
<teacher_script pause="0">
Đầu tiên là WHAT - nghĩa là "cái gì".
</teacher_script>

<teacher_script pause="0">
Nếu câu trả lời là một sự vật hay hoạt động, thì dùng What để hỏi.
</teacher_script>
```

### 2. Giọng điệu ôn tồn, nhỏ nhẹ

**Đặc điểm:**
- Nói chậm, rõ ràng
- Không vội vàng, không áp lực
- Như đang giải thích cho 1 học sinh riêng

**Từ ngữ nên dùng:**
- "nha" (cuối câu)
- "đi" (khi yêu cầu làm gì)
- "ok" (khi chuyển phần)
- "giờ..." (khi bắt đầu phần mới)

**Ví dụ:**
```markdown
<teacher_script pause="0">
Tiếp theo là WHERE - nghĩa là "ở đâu".
</teacher_script>

<teacher_script pause="0">
Nếu câu trả lời là một nơi chốn, một địa điểm, thì dùng Where để hỏi.
</teacher_script>

<teacher_script pause="30">
Ghi vô vở: WHERE = ở đâu, hỏi về nơi chốn.
</teacher_script>
```

### 3. Giải thích đáp án từng câu

**Vấn đề:** Nói đáp án một lèo, học sinh không hiểu tại sao.

**Giải pháp:** Mỗi câu trả lời = 1-2 teacher_script giải thích.

```markdown
<teacher_script pause="0">
Ok đáp án.
</teacher_script>

<answer>
**Đáp án:** 1. so | 2. but | 3. so
</answer>

<teacher_script pause="0">
Giải thích từng câu.
</teacher_script>

<teacher_script pause="0">
Câu 1: "I'm tired, SO I'll go to bed early."
</teacher_script>

<teacher_script pause="0">
Mệt là nguyên nhân, đi ngủ sớm là kết quả. Nên dùng SO.
</teacher_script>

<teacher_script pause="0">
Câu 2: "My sister is good at school, BUT I'm not."
</teacher_script>

<teacher_script pause="0">
Em giỏi, tôi không giỏi - 2 ý đối lập. Nên dùng BUT.
</teacher_script>
```

### 4. Mẹo nhớ bằng ký hiệu

**Tại sao:** Học sinh lớp 6-7 nhớ hình ảnh tốt hơn chữ.

**Cách làm:**
| Khái niệm | Ký hiệu | Script mẫu |
|-----------|---------|------------|
| and (bổ sung) | + | "AND giống phép cộng: A + B" |
| but (đối lập) | ↔ | "BUT là 2 ý ngược nhau: A ↔ B" |
| so (kết quả) | → | "SO là mũi tên: nguyên nhân → kết quả" |
| because (lý do) | ← | "BECAUSE giải thích ngược lại" |

```markdown
<teacher_script pause="0">
Mẹo nhớ nha: AND là cộng, BUT là đối, SO là kết quả.
</teacher_script>
```

### 5. Pause time phù hợp

| Hoạt động | Pause | Lý do |
|-----------|-------|-------|
| Giới thiệu | 0 | Chờ student bấm tiếp |
| Ghi vở ngắn | 30 | 1 dòng |
| Ghi bảng/công thức | 45-60 | Nhiều nội dung |
| Làm bài tập ngắn | 45-60 | 3-5 câu |
| Làm bài tập dài | 90-120 | 5+ câu |
| Dịch hội thoại | 180 | Cần suy nghĩ |
| Viết bài | 300-600 | Cần thời gian |

### 6. Flow của mỗi Section

```
┌─────────────────────────────────────────────────────────┐
│ 1. INTRO                                                │
│    - Nói tên section                                    │
│    - Nói mở sách trang mấy                              │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. VOCABULARY (nếu có)                                  │
│    - Giới thiệu từ vựng                                 │
│    - Cho thời gian ghi                                  │
│    - Record nếu cần                                     │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. CONTENT (dialogue/reading/grammar)                   │
│    - Giới thiệu nội dung                                │
│    - Hiển thị content                                   │
│    - Hướng dẫn làm gì                                   │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. EXERCISES (loop)                                     │
│    For each exercise:                                   │
│    - Giới thiệu bài                                     │
│    - Cho thời gian làm                                  │
│    - Nói đáp án                                         │
│    - Giải thích từng câu                                │
│    - Cho thời gian sửa                                  │
└────────────────────────┬────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. END                                                  │
│    - Tóm tắt đã học gì                                  │
│    - Dặn dò về nhà                                      │
│    - Preview bài sau                                    │
└─────────────────────────────────────────────────────────┘
```

### 7. Khi nào dùng `pause="0"`

Dùng `pause="0"` khi:
- Chưa yêu cầu học sinh làm gì (chỉ giới thiệu)
- Nhiều script liên tiếp giải thích 1 vấn đề
- Cuối section (chờ student bấm tiếp)

**Ví dụ chuỗi script giải thích:**
```markdown
<teacher_script pause="0">
Giờ qua phần Conjunctions.
</teacher_script>

<teacher_script pause="0">
Conjunctions là liên từ - dùng để nối 2 câu lại với nhau.
</teacher_script>

<teacher_script pause="0">
Có 3 liên từ cần học: and, but, so.
</teacher_script>

<teacher_script pause="0">
Giờ đi qua từng liên từ một.
</teacher_script>
```

---

## Checklist trước khi submit

- [ ] Mỗi chunk có teacher_script TRƯỚC và SAU
- [ ] Grammar được chia nhỏ từng khái niệm
- [ ] Đáp án được giải thích từng câu
- [ ] Có mẹo nhớ cho các điểm ngữ pháp quan trọng
- [ ] Giọng điệu tự nhiên, không formal
- [ ] Pause time phù hợp với hoạt động
- [ ] Có translation cho dialogue/reading
- [ ] Audio placeholder cho bài nghe