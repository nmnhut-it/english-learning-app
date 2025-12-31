# AI Lesson System - Thiết kế Hệ thống Bài giảng Điện tử Tự động

## 🎯 Mục tiêu Dự án

Biến các file markdown thành **bài giảng điện tử tự động** với:
- **AI Teacher** dẫn dắt bằng giọng nói
- **Gamification** để tăng tương tác
- **Học sinh tự học** qua màn hình TV (không cần giáo viên chuyên môn)
- **Tapescript đầy đủ** cho mọi nội dung audio

---

## 📊 Phân tích Cấu trúc Nội dung (QUAN TRỌNG)

### Có 3 cấu trúc markdown hoàn toàn khác nhau:

### 1. Lớp 6-9 (THCS) - Cấu trúc A

```
unit-XX/
├── getting-started.md      # Dialogue + Vocabulary + Bài tập hiểu
├── a-closer-look-1.md      # Vocabulary chuyên sâu + Grammar cơ bản
├── a-closer-look-2.md      # Grammar nâng cao + Bài tập
├── communication.md        # Mẫu câu giao tiếp
├── skills-1.md             # Reading + Listening
├── skills-2.md             # Speaking + Writing
└── looking-back.md         # Ôn tập tổng hợp
```

**Đặc điểm:**
- Dialogue được dịch hoàn toàn sang tiếng Việt
- Grammar có giải thích chi tiết: Công thức → Ví dụ → Dấu hiệu nhận biết
- Vocabulary format: `word : (part_of_speech) nghĩa_việt /IPA/`
- Bài đọc ngắn (100-200 từ)
- KHÔNG có listening transcript

### 2. Lớp 10-11 (THPT) - Cấu trúc B

```
unit-XX/
├── getting-started.md           # Dialogue + Vocabulary
├── language.md                  # Pronunciation + Vocabulary + Grammar
├── reading.md                   # Bài đọc dài + Exercises
├── speaking.md                  # Speaking practice
├── listening.md                 # Listening với TRANSCRIPT đầy đủ
├── writing.md                   # Writing tasks
├── communication-culture.md     # Culture + Everyday English
└── looking-back.md              # Review
```

**Đặc điểm:**
- CÓ listening transcript đầy đủ
- Dialogue song ngữ (English + Vietnamese dưới mỗi câu)
- Bài đọc dài (300-500 từ)
- Có icons: 💬 📚 ✍️ 🎧 🌍
- Pronunciation section riêng (linking sounds, stress, etc.)

### 3. File nguyên Unit (global-success-X/) - Cấu trúc C

```
global-success-7/
├── unit-01.md    # Toàn bộ unit trong 1 file
├── unit-02.md
└── ...
```

**Đặc điểm:**
- Tất cả sections trong 1 file duy nhất
- Dễ đọc tổng quan
- Phù hợp để tạo lesson plan

### Bảng So sánh Chi tiết

| Đặc điểm | Lớp 6-7 | Lớp 8-9 | Lớp 10-11 |
|----------|---------|---------|-----------|
| **Sections/unit** | 7 | 7 | 8 |
| **Dialogue** | VN dịch đầy đủ | VN dịch đầy đủ | Song ngữ EN-VI |
| **Grammar explain** | Chi tiết (Công thức, VD) | Chi tiết + Rules | Tích hợp Language |
| **Vocabulary/section** | 10-20 từ | 15-25 từ | 20-40 từ |
| **Reading length** | 100-150 từ | 150-200 từ | 300-500 từ |
| **Listening** | Không transcript | Không transcript | CÓ transcript |
| **Pronunciation** | Trong A Closer Look | Trong A Closer Look | Section riêng |
| **Culture** | Không có | Không có | CÓ section riêng |

---

## 📝 25 Dạng Bài tập Được Phát hiện

### Nhóm 1: Comprehension (Hiểu bài)
| # | Dạng | Mô tả | Ví dụ |
|---|------|-------|-------|
| 1 | **True/False** | Câu đúng/sai | `1-T, 2-F, 3-T` |
| 2 | **Multiple Choice** | Chọn A/B/C/D | `1. C, 2. A, 3. B` |
| 3 | **Short Answer** | Trả lời ngắn | `1. They usually go for a bike ride.` |
| 4 | **Matching (1-a)** | Nối cột | `1-c, 2-a, 3-d` |

### Nhóm 2: Vocabulary (Từ vựng)
| # | Dạng | Mô tả | Ví dụ |
|---|------|-------|-------|
| 5 | **Definition Matching** | Nối từ-nghĩa | `weaving : dệt vải - c` |
| 6 | **Fill Blank with Hints** | Điền từ có gợi ý | `folk dance, overlook` |
| 7 | **Word Bank** | Chọn từ trong hộp | `current issues, greenhouse gas` |
| 8 | **Table Classification** | Phân loại vào bảng | `Doing things / Making things` |
| 9 | **Missing Letters** | Điền chữ thiếu | `emiss_on → emission` |
| 10 | **Synonym Matching** | Nối từ đồng nghĩa | `full of = packed with` |

### Nhóm 3: Grammar (Ngữ pháp)
| # | Dạng | Mô tả | Ví dụ |
|---|------|-------|-------|
| 11 | **Verb Form** | Chia động từ | `cycling, reading, playing` |
| 12 | **Error Correction** | Sửa lỗi sai | `stands → stand, leaf → leaves` |
| 13 | **Question Formation** | Đặt câu hỏi | `Do women play...?` |
| 14 | **Sentence Translation** | Dịch câu | `EN → VN hoặc VN → EN` |
| 15 | **Countable/Uncountable** | Phân loại C/U | `water - U, book - C` |
| 16 | **Adverbs of Frequency** | Trạng từ tần suất | `always, rarely, never` |

### Nhóm 4: Pronunciation (Phát âm)
| # | Dạng | Mô tả | Ví dụ |
|---|------|-------|-------|
| 17 | **Sound Classification** | Phân loại âm | `/ə/ vs /ɜː/` |
| 18 | **Stress Identification** | Xác định trọng âm | `**earth**, **warmer**` |
| 19 | **Elision/Linking** | Âm nuốt/nối | `diff(e)rent, cam(e)ras` |

### Nhóm 5: Production (Sản sinh ngôn ngữ)
| # | Dạng | Mô tả | Ví dụ |
|---|------|-------|-------|
| 20 | **Dialogue Completion** | Hoàn thành hội thoại | `A: Where is it? B: ___` |
| 21 | **Speaking Practice** | Luyện nói | Q&A templates |
| 22 | **Written Response** | Viết đoạn văn | `Hi Nam, Let me tell you...` |
| 23 | **Multiple Answer** | Chọn nhiều đáp án | `1. d,c  2. b,c` |

### Nhóm 6: Listening (Nghe - CẦN BỔ SUNG AUDIO)
| # | Dạng | Mô tả | Trạng thái |
|---|------|-------|------------|
| 24 | **Listen & Complete** | Nghe điền từ | ⚠️ Cần file audio |
| 25 | **Listen & Choose** | Nghe chọn đáp án | ⚠️ Cần file audio |

### ⚠️ Vấn đề cần giải quyết: AUDIO FILES

```
HIỆN TẠI:
- Listening exercises có trong markdown
- NHƯNG không có file audio thực tế
- Chỉ có transcript (lớp 10-11)

GIẢI PHÁP:
1. Tạo audio bằng TTS (Google Cloud / Gemini)
2. Dùng voice native speaker (en-GB, en-US)
3. Lưu cache để không phải tạo lại
```

---

## 🧩 Thiết kế Module theo Section Type

### Mỗi Section = 1 Lesson riêng biệt

```
Unit 1: Hobbies
├── Lesson 1: Getting Started     (~15 phút)
├── Lesson 2: A Closer Look 1     (~20 phút)
├── Lesson 3: A Closer Look 2     (~20 phút)
├── Lesson 4: Communication       (~10 phút)
├── Lesson 5: Skills 1            (~25 phút)
├── Lesson 6: Skills 2            (~25 phút)
└── Lesson 7: Looking Back        (~15 phút)
                                  ≈ 2 tiếng/unit
```

### Section Templates (Mỗi loại có flow riêng)

#### 1. GETTING STARTED Template
```
┌─────────────────────────────────────────────┐
│ Scene 1: INTRO (1 min)                      │
│ - Giới thiệu chủ đề unit                    │
│ - AI Teacher chào, nêu mục tiêu bài học    │
├─────────────────────────────────────────────┤
│ Scene 2-6: VOCABULARY (5 min)               │
│ - Từng từ vựng với hình ảnh                 │
│ - Phát âm + Giải thích nghĩa               │
│ - +5 XP mỗi từ                              │
├─────────────────────────────────────────────┤
│ Scene 7: DIALOGUE (3 min)                   │
│ - Phát dialogue với highlight từ vựng      │
│ - Dịch từng câu (pause để học sinh đọc)    │
├─────────────────────────────────────────────┤
│ Scene 8-10: COMPREHENSION EXERCISES (5 min) │
│ - True/False                                │
│ - Multiple Choice                           │
│ - Matching                                  │
│ - +10 XP mỗi câu đúng                       │
├─────────────────────────────────────────────┤
│ Scene 11: SUMMARY + REWARD (1 min)          │
│ - Tổng kết từ vựng đã học                  │
│ - Badge nếu đạt                             │
└─────────────────────────────────────────────┘
```

#### 2. A CLOSER LOOK 1 Template (Vocabulary Focus)
```
┌─────────────────────────────────────────────┐
│ Scene 1: REVIEW (2 min)                     │
│ - Ôn lại từ Getting Started                 │
│ - Quick quiz 3 câu                          │
├─────────────────────────────────────────────┤
│ Scene 2-8: VOCABULARY DEEP DIVE (8 min)     │
│ - Từ vựng mở rộng theo chủ đề              │
│ - Word families, collocations               │
│ - Pronunciation practice                    │
├─────────────────────────────────────────────┤
│ Scene 9-12: VOCABULARY GAMES (7 min)        │
│ - Matching Game                             │
│ - Fill-in-the-blank                         │
│ - Classification Table                      │
├─────────────────────────────────────────────┤
│ Scene 13: PRONUNCIATION (3 min)             │
│ - Âm đặc biệt trong bài                    │
│ - Listen & Repeat                           │
└─────────────────────────────────────────────┘
```

#### 3. A CLOSER LOOK 2 Template (Grammar Focus)
```
┌─────────────────────────────────────────────┐
│ Scene 1: GRAMMAR INTRO (3 min)              │
│ - Giới thiệu điểm ngữ pháp                 │
│ - Công thức + Ví dụ                         │
├─────────────────────────────────────────────┤
│ Scene 2-4: GRAMMAR EXPLANATION (5 min)      │
│ - Giải thích chi tiết bằng tiếng Việt      │
│ - Dấu hiệu nhận biết                        │
│ - Các trường hợp đặc biệt                  │
├─────────────────────────────────────────────┤
│ Scene 5-10: GRAMMAR EXERCISES (10 min)      │
│ - Verb form exercises                       │
│ - Error correction                          │
│ - Sentence transformation                   │
│ - Question formation                        │
├─────────────────────────────────────────────┤
│ Scene 11: PRACTICE SUMMARY (2 min)          │
│ - Tổng hợp quy tắc                         │
│ - Tips ghi nhớ                              │
└─────────────────────────────────────────────┘
```

#### 4. SKILLS 1 Template (Reading + Listening)
```
┌─────────────────────────────────────────────┐
│ Scene 1: PRE-READING (2 min)                │
│ - Vocabulary preview                        │
│ - Prediction questions                      │
├─────────────────────────────────────────────┤
│ Scene 2-4: READING (8 min)                  │
│ - Đọc bài với highlight từ khó            │
│ - AI Teacher giải thích từng đoạn         │
│ - Pause để học sinh đọc theo               │
├─────────────────────────────────────────────┤
│ Scene 5-7: READING EXERCISES (5 min)        │
│ - True/False                                │
│ - Multiple Choice                           │
│ - Short Answer                              │
├─────────────────────────────────────────────┤
│ Scene 8: LISTENING PREP (2 min)             │
│ - Vocabulary cho listening                  │
│ - Prediction                                │
├─────────────────────────────────────────────┤
│ Scene 9-10: LISTENING (5 min)               │
│ ⚠️ AUDIO GENERATED BY TTS                   │
│ - Play audio (native voice)                 │
│ - Replay option                             │
├─────────────────────────────────────────────┤
│ Scene 11-12: LISTENING EXERCISES (3 min)    │
│ - Listen & Complete                         │
│ - Listen & Choose                           │
└─────────────────────────────────────────────┘
```

#### 5. SKILLS 2 Template (Speaking + Writing)
```
┌─────────────────────────────────────────────┐
│ Scene 1-3: SPEAKING MODEL (5 min)           │
│ - Model dialogue/questions                  │
│ - AI Teacher demo                           │
│ - Pause cho học sinh luyện                 │
├─────────────────────────────────────────────┤
│ Scene 4-6: SPEAKING PRACTICE (8 min)        │
│ - Q&A interactive                           │
│ - Record & playback (optional)              │
│ - Feedback từ AI                           │
├─────────────────────────────────────────────┤
│ Scene 7: WRITING INTRO (3 min)              │
│ - Writing task explanation                  │
│ - Useful phrases                            │
├─────────────────────────────────────────────┤
│ Scene 8-10: WRITING PRACTICE (9 min)        │
│ - Step-by-step guide                        │
│ - Template với blanks                       │
│ - Sample answer để tham khảo               │
└─────────────────────────────────────────────┘
```

#### 6. LOOKING BACK Template (Review)
```
┌─────────────────────────────────────────────┐
│ Scene 1: VOCABULARY REVIEW (5 min)          │
│ - All vocabulary from unit                  │
│ - Flashcard game                            │
│ - Speed quiz                                │
├─────────────────────────────────────────────┤
│ Scene 2-4: GRAMMAR REVIEW (5 min)           │
│ - Key grammar points                        │
│ - Mixed exercises                           │
├─────────────────────────────────────────────┤
│ Scene 5: FINAL QUIZ (5 min)                 │
│ - 10 câu hỏi tổng hợp                      │
│ - Thời gian giới hạn                       │
│ - Bonus XP cho perfect score               │
├─────────────────────────────────────────────┤
│ Scene 6: UNIT COMPLETE (2 min)              │
│ - Certificate/Badge                         │
│ - Stats: Từ vựng, Grammar, Score           │
│ - Recommend next unit                       │
└─────────────────────────────────────────────┘
```

---

## 🔧 UNIVERSAL CONTENT BLOCKS (Quan trọng nhất!)

### Triết lý: AI đọc markdown → Output JSON có cấu trúc

```
┌──────────────────────────────────────────────────────────────────┐
│  MARKDOWN (Không chuẩn hóa)     →    STRUCTURED JSON (Chuẩn hóa) │
│                                                                   │
│  - Mỗi file có format khác      │    - Universal blocks          │
│  - Lớp 6 ≠ Lớp 10              │    - Consistent schema         │
│  - Section khác nhau            │    - Ready for rendering       │
│                                                                   │
│  AI PROCESSOR (Gemini/Claude) làm cầu nối                        │
└──────────────────────────────────────────────────────────────────┘
```

### 8 Content Block Types (Phổ quát cho mọi bài)

```typescript
// Tất cả content được chia thành 8 loại block cơ bản
type ContentBlock =
  | VocabularyBlock      // Từ vựng
  | DialogueBlock        // Hội thoại
  | ExerciseBlock        // Bài tập (25 loại con)
  | GrammarBlock         // Ngữ pháp
  | ReadingBlock         // Bài đọc
  | ListeningBlock       // Bài nghe
  | PronunciationBlock   // Phát âm
  | InstructionBlock;    // Hướng dẫn/Giải thích
```

---

### Block 1: VOCABULARY BLOCK

```typescript
interface VocabularyBlock {
  type: 'vocabulary';
  items: VocabularyItem[];
}

interface VocabularyItem {
  word: string;              // "hobby"
  partOfSpeech: string;      // "n" | "v" | "adj" | "adv" | "phrase"
  pronunciation: string;     // "/ˈhɒbi/"
  meaning: string;           // "sở thích"
  example?: string;          // "My hobby is reading."
  exampleTranslation?: string; // "Sở thích của tôi là đọc sách."
  image?: string;            // URL hoặc placeholder cho AI generate
  audioUrl?: string;         // TTS generated
}

// Ví dụ output từ AI:
{
  "type": "vocabulary",
  "items": [
    {
      "word": "hobby",
      "partOfSpeech": "n",
      "pronunciation": "/ˈhɒbi/",
      "meaning": "sở thích",
      "example": "My hobby is reading books.",
      "exampleTranslation": "Sở thích của tôi là đọc sách."
    },
    {
      "word": "amazing",
      "partOfSpeech": "adj",
      "pronunciation": "/əˈmeɪzɪŋ/",
      "meaning": "tuyệt vời",
      "example": "The view is amazing!",
      "exampleTranslation": "Khung cảnh thật tuyệt vời!"
    }
  ]
}
```

---

### Block 2: DIALOGUE BLOCK

```typescript
interface DialogueBlock {
  type: 'dialogue';
  title?: string;            // "Conversation between Ann and Trang"
  context?: string;          // "At Trang's house"
  lines: DialogueLine[];
  vocabularyHighlights?: string[];  // Từ cần highlight
}

interface DialogueLine {
  speaker: string;           // "Ann" | "Trang" | "Teacher"
  text: string;              // "Your house is very nice, Trang."
  translation?: string;      // "Nhà của bạn rất đẹp, Trang."
  audioUrl?: string;         // TTS generated
  emotion?: string;          // "happy" | "surprised" | "questioning"
}

// Ví dụ:
{
  "type": "dialogue",
  "title": "Talking about hobbies",
  "context": "Ann visits Trang's house",
  "lines": [
    {
      "speaker": "Ann",
      "text": "Your house is very nice, Trang.",
      "translation": "Nhà của bạn rất đẹp, Trang."
    },
    {
      "speaker": "Trang",
      "text": "Thanks! Let's go upstairs. I'll show you my room.",
      "translation": "Cảm ơn! Hãy đi lên lầu. Mình sẽ cho bạn xem phòng của mình."
    }
  ],
  "vocabularyHighlights": ["nice", "upstairs", "room"]
}
```

---

### Block 3: EXERCISE BLOCK (25 sub-types)

```typescript
interface ExerciseBlock {
  type: 'exercise';
  exerciseType: ExerciseType;  // 1 trong 25 loại
  instruction: string;         // "Read and write T or F"
  instructionVi?: string;      // "Đọc và viết Đúng hoặc Sai"
  questions: Question[];
  timeLimit?: number;          // Giây (optional)
  points?: number;             // XP cho bài này
}

// 25 Exercise Types
type ExerciseType =
  // Comprehension
  | 'true_false'
  | 'multiple_choice'
  | 'short_answer'
  | 'matching'
  // Vocabulary
  | 'definition_matching'
  | 'fill_blank_hints'
  | 'word_bank'
  | 'table_classification'
  | 'missing_letters'
  | 'synonym_matching'
  // Grammar
  | 'verb_form'
  | 'error_correction'
  | 'question_formation'
  | 'sentence_translation'
  | 'countable_uncountable'
  | 'adverbs_frequency'
  | 'sentence_reorder'
  // Pronunciation
  | 'sound_classification'
  | 'stress_identification'
  | 'elision_linking'
  // Production
  | 'dialogue_completion'
  | 'speaking_practice'
  | 'written_response'
  | 'multiple_answer'
  // Listening
  | 'listen_complete'
  | 'listen_choose';

// Question structure varies by type
interface Question {
  id: number;
  // For true_false, multiple_choice
  questionText?: string;
  questionTextVi?: string;
  options?: Option[];
  correctAnswer: string | string[] | boolean;

  // For matching
  leftItems?: string[];
  rightItems?: string[];
  correctPairs?: [number, string][];  // [[1, 'a'], [2, 'c']]

  // For fill_blank
  sentence?: string;
  blanks?: string[];  // Đáp án cho các chỗ trống

  // For table_classification
  categories?: string[];
  itemsToClassify?: string[];
  correctClassification?: {[category: string]: string[]};

  explanation?: string;  // Giải thích đáp án (cho grammar)
  explanationVi?: string;
}

// Ví dụ TRUE/FALSE:
{
  "type": "exercise",
  "exerciseType": "true_false",
  "instruction": "Read the conversation and write T (True) or F (False)",
  "instructionVi": "Đọc bài hội thoại và viết Đúng (T) hoặc Sai (F)",
  "questions": [
    {
      "id": 1,
      "questionText": "Trang needs help with building dollhouses.",
      "questionTextVi": "Trang cần sự giúp đỡ để làm nhà búp bê.",
      "correctAnswer": false
    },
    {
      "id": 2,
      "questionText": "Trang uses glue and cardboard to build her dollhouse.",
      "correctAnswer": true
    }
  ],
  "points": 50
}

// Ví dụ MATCHING:
{
  "type": "exercise",
  "exerciseType": "matching",
  "instruction": "Match the words with their meanings",
  "questions": [
    {
      "id": 1,
      "leftItems": ["hobby", "amazing", "build", "cardboard"],
      "rightItems": ["a. tuyệt vời", "b. xây dựng", "c. sở thích", "d. bìa cứng"],
      "correctPairs": [[1, "c"], [2, "a"], [3, "b"], [4, "d"]]
    }
  ]
}

// Ví dụ TABLE CLASSIFICATION:
{
  "type": "exercise",
  "exerciseType": "table_classification",
  "instruction": "Put the hobbies in the correct categories",
  "questions": [
    {
      "id": 1,
      "categories": ["Doing things", "Making things", "Collecting things"],
      "itemsToClassify": ["gardening", "building dollhouses", "collecting stamps", "riding a bike", "making models"],
      "correctClassification": {
        "Doing things": ["gardening", "riding a bike"],
        "Making things": ["building dollhouses", "making models"],
        "Collecting things": ["collecting stamps"]
      }
    }
  ]
}

// Ví dụ VERB FORM (Grammar):
{
  "type": "exercise",
  "exerciseType": "verb_form",
  "instruction": "Complete the sentences with the correct form of the verbs",
  "questions": [
    {
      "id": 1,
      "sentence": "I enjoy (read) _____ books in my free time.",
      "blanks": ["reading"],
      "explanation": "Sau 'enjoy' dùng V-ing",
      "explanationVi": "Sau động từ 'enjoy' phải dùng động từ dạng V-ing"
    }
  ]
}
```

---

### Block 4: GRAMMAR BLOCK

```typescript
interface GrammarBlock {
  type: 'grammar';
  topic: string;               // "Present Simple Tense"
  topicVi: string;             // "Thì hiện tại đơn"

  // Công thức
  formula: {
    affirmative: string;       // "S + V(s/es) + O"
    negative: string;          // "S + do/does + not + V + O"
    question: string;          // "Do/Does + S + V + O?"
  };

  // Cách dùng
  usage: UsagePoint[];

  // Dấu hiệu nhận biết
  signalWords: string[];       // ["always", "usually", "every day"]

  // Ví dụ
  examples: GrammarExample[];

  // Tips ghi nhớ
  tips?: string[];
}

interface UsagePoint {
  description: string;         // "Diễn tả thói quen, hành động lặp lại"
  descriptionVi: string;       // "Dùng để diễn tả thói quen..."
  example: string;
  exampleTranslation: string;
}

interface GrammarExample {
  english: string;
  vietnamese: string;
  highlight?: string[];        // Phần cần highlight
}

// Ví dụ:
{
  "type": "grammar",
  "topic": "Present Simple Tense",
  "topicVi": "Thì hiện tại đơn",
  "formula": {
    "affirmative": "S + V(s/es) + O",
    "negative": "S + do/does + not + V(nguyên thể) + O",
    "question": "Do/Does + S + V(nguyên thể) + O?"
  },
  "usage": [
    {
      "description": "Express habits and repeated actions",
      "descriptionVi": "Diễn tả thói quen, hành động lặp lại thường xuyên",
      "example": "I go to school every day.",
      "exampleTranslation": "Tôi đi học mỗi ngày."
    },
    {
      "description": "Express general truths",
      "descriptionVi": "Diễn tả sự thật hiển nhiên, chân lý",
      "example": "The sun rises in the east.",
      "exampleTranslation": "Mặt trời mọc ở hướng đông."
    }
  ],
  "signalWords": ["always", "usually", "often", "sometimes", "rarely", "never", "every day", "every week"],
  "examples": [
    {
      "english": "She plays tennis every Sunday.",
      "vietnamese": "Cô ấy chơi tennis mỗi Chủ nhật.",
      "highlight": ["plays", "every Sunday"]
    }
  ],
  "tips": [
    "He/She/It + V-s/es",
    "Động từ tận cùng -o, -s, -x, -ch, -sh → thêm -es"
  ]
}
```

---

### Block 5: READING BLOCK

```typescript
interface ReadingBlock {
  type: 'reading';
  title?: string;
  content: string;             // Full text
  contentWithHighlights?: HighlightedText[];  // Text với từ được highlight
  vocabularyPreview?: VocabularyItem[];       // Từ vựng trước khi đọc
  translation?: string;        // Bản dịch (optional)
  wordCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface HighlightedText {
  text: string;
  isHighlighted: boolean;
  vocabularyRef?: string;      // Reference to vocabulary item
}
```

---

### Block 6: LISTENING BLOCK

```typescript
interface ListeningBlock {
  type: 'listening';
  title?: string;
  transcript: string;          // Full transcript
  transcriptLines?: TranscriptLine[];  // Chia theo speaker
  audioUrl?: string;           // TTS generated
  duration?: number;           // Seconds
  vocabularyPreview?: VocabularyItem[];
  difficulty: 'easy' | 'medium' | 'hard';
}

interface TranscriptLine {
  speaker?: string;
  text: string;
  startTime?: number;          // For sync with audio
  endTime?: number;
}

// ⚠️ QUAN TRỌNG: Audio sẽ được generate từ transcript bằng TTS
```

---

### Block 7: PRONUNCIATION BLOCK

```typescript
interface PronunciationBlock {
  type: 'pronunciation';
  focus: string;               // "Linking sounds" | "Word stress" | "/ə/ vs /ɜː/"
  focusVi: string;
  explanation: string;
  explanationVi: string;
  examples: PronunciationExample[];
  practiceWords?: string[];
}

interface PronunciationExample {
  text: string;                // "live‿in the city"
  ipa?: string;                // Phonetic transcription
  audioUrl?: string;
  notes?: string;              // "The /v/ links to /ɪ/"
}
```

---

### Block 8: INSTRUCTION BLOCK

```typescript
interface InstructionBlock {
  type: 'instruction';
  title?: string;
  content: string;             // AI Teacher nói gì
  contentVi: string;           // Bản tiếng Việt
  visualType?: 'text' | 'image' | 'video' | 'animation';
  duration?: number;           // Seconds to display
}
```

---

## 📄 Complete Lesson Schema

```typescript
interface LessonData {
  // Metadata
  id: string;                  // "g7-u01-getting-started"
  grade: number;               // 7
  unit: number;                // 1
  unitTitle: string;           // "Hobbies"
  section: SectionType;        // "getting_started"
  sectionTitle: string;        // "Getting Started"

  // Timing
  estimatedDuration: number;   // Minutes

  // Content - Mảng các blocks theo thứ tự
  blocks: ContentBlock[];

  // Gamification
  rewards: {
    xpTotal: number;
    badges?: string[];
    achievements?: string[];
  };
}

type SectionType =
  | 'getting_started'
  | 'a_closer_look_1'
  | 'a_closer_look_2'
  | 'communication'
  | 'skills_1'
  | 'skills_2'
  | 'looking_back'
  // Grade 10-11 specific
  | 'language'
  | 'reading'
  | 'speaking'
  | 'listening'
  | 'writing'
  | 'communication_culture';
```

---

## 🤖 AI Processing Prompt Template

```markdown
# TASK: Convert Markdown to Structured Lesson Data

You are an English teaching content processor. Given a markdown file from
the Global Success English textbook, extract and structure the content
into JSON format.

## INPUT:
{markdown_content}

## METADATA:
- Grade: {grade}
- Unit: {unit}
- Section: {section}

## OUTPUT FORMAT:
Return a JSON object following the LessonData schema with these blocks:
- VocabularyBlock: Extract ALL vocabulary with word, part of speech, IPA, meaning
- DialogueBlock: Extract conversations with speaker, text, translation
- ExerciseBlock: Identify exercise type from 25 types, extract questions/answers
- GrammarBlock: Extract formulas, usage, examples, signal words
- ReadingBlock: Extract reading passages
- ListeningBlock: Extract transcripts (will generate audio later)
- PronunciationBlock: Extract pronunciation focus points
- InstructionBlock: Add AI teacher instructions between blocks

## RULES:
1. Preserve ALL content - don't skip any vocabulary or exercises
2. Identify correct exercise type from the 25 defined types
3. Include Vietnamese translations where available
4. Mark which vocabulary words should be highlighted in dialogues
5. Add estimated duration for each section
6. Calculate total XP based on: 5 XP/vocabulary + 10 XP/exercise question

## EXAMPLE OUTPUT:
{example_json}
```

---

## 🏗️ Kiến trúc Tổng quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AI LESSON PLAYER                             │
│  (Web app chạy trên TV/Browser - Giống Coursera/Khan Academy)       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │   Avatar    │  │   Lesson    │  │  Exercise   │  │ Gamification│  │
│  │  AI Teacher │  │   Content   │  │  Interactive │  │   System   │  │
│  │  (TTS/Video)│  │  (Slides)   │  │   Zone      │  │  (XP/Badges)│  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                       LESSON SCRIPT ENGINE                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Markdown → Lesson Script (JSON) → TTS Audio + Visual Slides  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    CONTENT PROCESSING PIPELINE                       │
├─────────────────────────────────────────────────────────────────────┤
│  1. Markdown Files (Grade 6-12)                                     │
│       ↓                                                              │
│  2. AI Processing (Gemini API)                                      │
│       - Tạo script giảng bài                                        │
│       - Tạo câu hỏi tương tác                                       │
│       - Tạo tapescript cho TTS                                      │
│       ↓                                                              │
│  3. Lesson Package (JSON + Audio + Assets)                          │
│       ↓                                                              │
│  4. Cached & Ready to Play                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📚 Cấu trúc Lesson Package

### Mỗi bài học được đóng gói thành JSON:

```typescript
interface LessonPackage {
  id: string;                    // "grade7-unit1-getting-started"
  grade: number;
  unit: number;
  section: string;               // "getting-started" | "a-closer-look-1" | ...
  title: string;
  duration: number;              // Ước tính thời gian (phút)

  // Script bài giảng - QUAN TRỌNG NHẤT
  script: LessonScript;

  // Vocabulary
  vocabulary: VocabularyItem[];

  // Exercises cho tương tác
  exercises: Exercise[];

  // Gamification
  rewards: LessonRewards;
}

interface LessonScript {
  // Danh sách các "cảnh" trong bài giảng
  scenes: Scene[];
}

interface Scene {
  id: string;
  type: SceneType;

  // Nội dung hiển thị (slides)
  visual: VisualContent;

  // Script để đọc (TTS)
  narration: Narration;

  // Thời điểm pause để tương tác
  interactionPoint?: InteractionPoint;

  // Thời lượng (giây)
  duration: number;
}

type SceneType =
  | 'intro'              // Giới thiệu bài học
  | 'vocabulary_intro'   // Giới thiệu từ vựng
  | 'vocabulary_practice'// Luyện phát âm từ vựng
  | 'dialogue'           // Hội thoại mẫu
  | 'grammar_explain'    // Giải thích ngữ pháp
  | 'exercise'           // Bài tập tương tác
  | 'game'               // Mini-game
  | 'summary'            // Tổng kết
  | 'reward';            // Thưởng điểm/badges

interface Narration {
  // Script tiếng Việt (AI teacher nói)
  vietnamese: string;

  // Script tiếng Anh (khi cần đọc mẫu)
  english?: string;

  // Audio file path (pre-generated)
  audioUrl?: string;

  // TTS config
  ttsConfig: {
    voice: 'vi-VN-female' | 'vi-VN-male' | 'en-US-female' | 'en-GB-male';
    speed: number;      // 0.8 - 1.2
    pitch: number;
  };
}

interface VisualContent {
  // Layout của slide
  layout: 'full-text' | 'split' | 'vocabulary-card' | 'dialogue' | 'exercise';

  // Nội dung chính
  mainContent: string | VocabularyItem | DialogueLine[];

  // Hình ảnh minh họa
  images?: string[];

  // Animation type
  animation?: 'fade' | 'slide' | 'bounce' | 'highlight';

  // Highlighted text (từ vựng cần nhấn mạnh)
  highlights?: {word: string, color: string}[];
}
```

---

## 🎬 Lesson Flow - Quy trình một bài học

### Ví dụ: Grade 7 - Unit 1 - Getting Started

```
┌────────────────────────────────────────────────────────────────────┐
│  SCENE 1: INTRO (30s)                                              │
│  ───────────────────                                               │
│  Visual: Unit title "HOBBIES" với hình ảnh các hoạt động           │
│  AI Teacher: "Chào các em! Hôm nay chúng ta sẽ học về chủ đề       │
│              Hobbies - Sở thích. Các em có sở thích gì không?"     │
│                                                                     │
│  🎮 Gamification: +10 XP cho việc bắt đầu bài học                   │
└────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────┐
│  SCENE 2-11: VOCABULARY INTRODUCTION (5 min)                       │
│  ────────────────────────────────────────────                       │
│  Mỗi từ vựng = 1 scene (30s/từ × 10 từ)                            │
│                                                                     │
│  Visual: Vocabulary Card với hình ảnh                               │
│  ┌─────────────────────────────────────┐                           │
│  │  🖼️ [Hình người đang vẽ]             │                           │
│  │                                     │                           │
│  │  DRAWING                            │                           │
│  │  /ˈdrɔːɪŋ/                          │                           │
│  │  (n) vẽ tranh                       │                           │
│  │                                     │                           │
│  │  🔊 [Phát âm]  ⭐ [Thêm yêu thích]   │                           │
│  └─────────────────────────────────────┘                           │
│                                                                     │
│  AI Teacher: "Từ tiếp theo là DRAWING - có nghĩa là vẽ tranh.      │
│              Các em nghe cô phát âm nhé: DRAWING. Đọc theo cô nào!" │
│                                                                     │
│  🎮 Interaction: Học sinh nhấn nút để nghe lại, đọc theo           │
│  🎮 +5 XP mỗi từ hoàn thành                                        │
└────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────┐
│  SCENE 12: VOCABULARY GAME (2 min)                                 │
│  ─────────────────────────────────                                  │
│  Visual: Matching Game                                              │
│  ┌─────────────────────────────────────┐                           │
│  │  Nối từ với nghĩa đúng:              │                           │
│  │                                     │                           │
│  │  [drawing]        [sưu tầm tem]     │                           │
│  │  [gardening]      [vẽ tranh]        │                           │
│  │  [stamp]          [làm vườn]        │                           │
│  │  [collecting]                       │                           │
│  │                                     │                           │
│  │  ⏱️ 60 giây   🎯 4/4                │                           │
│  └─────────────────────────────────────┘                           │
│                                                                     │
│  AI Teacher: "Bây giờ, các em hãy nối từ với nghĩa đúng nhé!       │
│              Các em có 60 giây. Bắt đầu!"                          │
│                                                                     │
│  🎮 +20 XP nếu đúng hết, +5 XP bonus nếu < 30s                     │
└────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────┐
│  SCENE 13-15: DIALOGUE (3 min)                                     │
│  ─────────────────────────────                                      │
│  Visual: Conversation với 2 nhân vật                               │
│  ┌─────────────────────────────────────┐                           │
│  │  👧 Trang              👩 Ann        │                           │
│  │                                     │                           │
│  │  💬 "What's your hobby, Ann?"       │                           │
│  │     (Sở thích của bạn là gì, Ann?)  │                           │
│  │                                     │                           │
│  │         💬 "I like drawing."        │                           │
│  │            (Mình thích vẽ tranh.)   │                           │
│  └─────────────────────────────────────┘                           │
│                                                                     │
│  AI Teacher: "Bây giờ chúng ta nghe đoạn hội thoại giữa Trang     │
│              và Ann. Các em chú ý cách họ hỏi về sở thích nhé."    │
│                                                                     │
│  Audio: Phát dialogue với giọng native                             │
│  🎮 +10 XP hoàn thành nghe                                         │
└────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────┐
│  SCENE 16-18: EXERCISES (3 min)                                    │
│  ──────────────────────────────                                     │
│  True/False Questions                                               │
│  ┌─────────────────────────────────────┐                           │
│  │  "Trang likes building dollhouses"  │                           │
│  │                                     │                           │
│  │     [TRUE]        [FALSE]           │                           │
│  │                                     │                           │
│  │  Tiến độ: ██████░░░░ 3/5            │                           │
│  └─────────────────────────────────────┘                           │
│                                                                     │
│  AI Teacher: "Câu 1: Trang thích làm nhà búp bê - Đúng hay Sai?"   │
│                                                                     │
│  🎮 +10 XP mỗi câu đúng                                            │
│  🎮 Streak bonus: 3 câu liên tiếp = +15 XP                         │
└────────────────────────────────────────────────────────────────────┘
                                  ↓
┌────────────────────────────────────────────────────────────────────┐
│  SCENE 19: SUMMARY & REWARDS (1 min)                               │
│  ───────────────────────────────────                                │
│  Visual: Progress Summary                                           │
│  ┌─────────────────────────────────────┐                           │
│  │  🎉 HOÀN THÀNH BÀI HỌC!              │                           │
│  │                                     │                           │
│  │  📚 Từ vựng mới: 10 từ              │                           │
│  │  ✅ Bài tập: 5/5 (100%)              │                           │
│  │  ⭐ XP kiếm được: 125 điểm           │                           │
│  │                                     │                           │
│  │  🏆 Badge mới: "Vocabulary Master"  │                           │
│  │                                     │                           │
│  │  [TIẾP TỤC] [XEM LẠI] [VỀ MENU]    │                           │
│  └─────────────────────────────────────┘                           │
│                                                                     │
│  AI Teacher: "Tuyệt vời! Các em đã hoàn thành bài học. Hôm nay    │
│              các em học được 10 từ vựng mới về sở thích. Hẹn gặp   │
│              lại các em trong bài học tiếp theo!"                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🎮 Gamification System

### XP & Levels
```typescript
interface GamificationSystem {
  // Experience Points
  xp: {
    lessonComplete: 50,
    vocabularyLearned: 5,      // Per word
    exerciseCorrect: 10,
    streakBonus: 15,           // 3+ correct in a row
    speedBonus: 5,             // Complete quickly
    perfectScore: 25,          // 100% accuracy
  };

  // Levels
  levels: [
    { level: 1, xpRequired: 0, title: "Người mới bắt đầu" },
    { level: 2, xpRequired: 100, title: "Học sinh siêng năng" },
    { level: 3, xpRequired: 300, title: "Nhà vô địch từ vựng" },
    { level: 4, xpRequired: 600, title: "Thạc sĩ tiếng Anh" },
    { level: 5, xpRequired: 1000, title: "Giáo sư ngôn ngữ" },
    // ...
  ];

  // Daily Streaks
  streaks: {
    dailyGoal: 1,              // 1 lesson/day
    streakBonus: 20,           // XP per day in streak
    weeklyBonus: 100,          // 7-day streak
  };

  // Badges/Achievements
  badges: [
    { id: "first_lesson", name: "Bước đầu tiên", condition: "Complete first lesson" },
    { id: "vocab_10", name: "Vocabulary Starter", condition: "Learn 10 words" },
    { id: "vocab_100", name: "Vocabulary Master", condition: "Learn 100 words" },
    { id: "perfect_5", name: "Hoàn hảo", condition: "5 perfect scores in a row" },
    { id: "speed_demon", name: "Nhanh như chớp", condition: "Complete exercise in < 30s" },
    { id: "unit_complete", name: "Unit Champion", condition: "Complete entire unit" },
    // ...
  ];
}
```

### Leaderboard (Optional - Class Competition)
```typescript
interface Leaderboard {
  // Có thể dùng cho lớp học
  classId: string;
  students: {
    name: string;
    avatar: string;
    xp: number;
    level: number;
    streak: number;
  }[];
}
```

---

## 🔊 Text-to-Speech Integration

### Google Cloud TTS / Gemini API

```typescript
interface TTSService {
  // Voices available
  voices: {
    // Vietnamese teacher
    teacher_vi: {
      languageCode: "vi-VN",
      name: "vi-VN-Standard-A",  // Female
      ssmlGender: "FEMALE",
    },

    // English native speakers
    native_uk: {
      languageCode: "en-GB",
      name: "en-GB-Standard-A",
      ssmlGender: "FEMALE",
    },
    native_us: {
      languageCode: "en-US",
      name: "en-US-Standard-B",
      ssmlGender: "MALE",
    },

    // Student voices for dialogue
    student_1: {
      languageCode: "en-GB",
      name: "en-GB-Standard-C",  // Young female
    },
    student_2: {
      languageCode: "en-GB",
      name: "en-GB-Standard-D",  // Young male
    },
  };

  // Generate audio
  async generateAudio(text: string, voice: VoiceConfig): Promise<AudioBuffer>;

  // Generate entire lesson audio
  async generateLessonAudio(script: LessonScript): Promise<AudioPackage>;
}
```

### Tapescript Structure
```typescript
interface Tapescript {
  lessonId: string;

  // Full text của mọi thứ được nói
  segments: {
    sceneId: string;
    timestamp: number;        // Start time in seconds
    speaker: 'teacher' | 'native' | 'student1' | 'student2';
    language: 'vi' | 'en';
    text: string;
    duration: number;
  }[];

  // Total duration
  totalDuration: number;

  // Generated audio files
  audioFiles: {
    combined: string;         // Full lesson audio
    byScene: {[sceneId: string]: string};  // Individual scene audio
  };
}
```

---

## 🖥️ UI Components

### Main Lesson Player
```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │                    MAIN CONTENT AREA                        │   │
│  │              (Slides, Vocabulary, Exercises)                │   │
│  │                                                             │   │
│  │                         70% height                          │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ⏮️  ⏸️  ⏭️   ████████████░░░░░░░░ 3:45 / 10:00            │   │
│  │                    PLAYBACK CONTROLS                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  📚 Vocabulary  │  │  ⭐ XP: 125     │  │  🔥 Streak: 3   │    │
│  │     10/10       │  │  Level 2        │  │                 │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### TV Mode (Optimized for Large Screen)
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │                                                              │  │
│  │                    LARGE CONTENT                             │  │
│  │                  (Easy to read from far)                     │  │
│  │                                                              │  │
│  │                    Font size: 32px+                          │  │
│  │                    High contrast colors                      │  │
│  │                                                              │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │   [A] Play/Pause    [B] Repeat    [C] Next    [D] Menu     │    │
│  │                  REMOTE CONTROL HINTS                       │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  🔥 Streak: 5 days  │  ⭐ XP: 1,250  │  🏆 Level 3: Vocabulary Pro  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Content Processing Pipeline

### Step 1: AI Lesson Generation

```typescript
interface LessonGenerationRequest {
  markdownContent: string;
  grade: number;
  unit: number;
  section: string;
  targetAudience: 'elementary' | 'middle' | 'high';
}

// Prompt cho Gemini/Claude
const LESSON_GENERATION_PROMPT = `
Bạn là một giáo viên tiếng Anh giỏi, thân thiện với học sinh.
Dựa trên nội dung markdown sau, hãy tạo script bài giảng với:

1. INTRO (30s): Chào học sinh, giới thiệu chủ đề
2. VOCABULARY: Giải thích từng từ vựng một cách dễ hiểu
   - Nói nghĩa tiếng Việt
   - Cho ví dụ dễ hiểu
   - Nhắc học sinh đọc theo
3. DIALOGUE: Giải thích ngữ cảnh hội thoại
4. EXERCISES: Hướng dẫn làm bài tập
5. SUMMARY: Tổng kết bài học

Output format: JSON theo LessonScript schema

Nội dung markdown:
{content}
`;

async function generateLessonScript(
  request: LessonGenerationRequest
): Promise<LessonScript> {
  const response = await geminiAPI.generateContent({
    model: "gemini-1.5-pro",
    prompt: LESSON_GENERATION_PROMPT.replace('{content}', request.markdownContent),
    responseFormat: { type: "json_object" }
  });

  return JSON.parse(response.text);
}
```

### Step 2: Audio Generation

```typescript
async function generateLessonAudio(script: LessonScript): Promise<AudioPackage> {
  const audioSegments: AudioSegment[] = [];

  for (const scene of script.scenes) {
    // Generate Vietnamese teacher narration
    if (scene.narration.vietnamese) {
      const audio = await ttsService.generateAudio(
        scene.narration.vietnamese,
        TTSVoices.teacher_vi
      );
      audioSegments.push({
        sceneId: scene.id,
        type: 'narration',
        audio
      });
    }

    // Generate English pronunciation
    if (scene.narration.english) {
      const audio = await ttsService.generateAudio(
        scene.narration.english,
        TTSVoices.native_uk
      );
      audioSegments.push({
        sceneId: scene.id,
        type: 'pronunciation',
        audio
      });
    }
  }

  return combineAudioSegments(audioSegments);
}
```

### Step 3: Package & Cache

```typescript
interface LessonPackageManager {
  // Check if lesson already processed
  async checkExists(lessonId: string): Promise<boolean>;

  // Get cached lesson
  async getLesson(lessonId: string): Promise<LessonPackage>;

  // Process and save new lesson
  async processAndSave(markdown: string, metadata: LessonMetadata): Promise<LessonPackage>;

  // Storage locations
  storage: {
    scripts: '/data/lessons/{grade}/{unit}/{section}/script.json',
    audio: '/data/lessons/{grade}/{unit}/{section}/audio/',
    tapescript: '/data/lessons/{grade}/{unit}/{section}/tapescript.txt',
  };
}
```

---

## 📁 Proposed Directory Structure

```
v2/
├── src/
│   ├── components/
│   │   ├── LessonPlayer/           # Main lesson playback
│   │   │   ├── LessonPlayer.ts
│   │   │   ├── SceneRenderer.ts
│   │   │   ├── PlaybackControls.ts
│   │   │   └── styles.css
│   │   ├── VocabularyScene/        # Vocabulary card display
│   │   ├── DialogueScene/          # Dialogue playback
│   │   ├── ExerciseScene/          # Interactive exercises
│   │   ├── GameScene/              # Mini-games
│   │   │   ├── MatchingGame.ts
│   │   │   ├── FillBlankGame.ts
│   │   │   └── PronunciationGame.ts
│   │   └── Gamification/           # XP, badges, progress
│   │       ├── XPCounter.ts
│   │       ├── BadgePopup.ts
│   │       ├── StreakTracker.ts
│   │       └── LevelProgress.ts
│   │
│   ├── services/
│   │   ├── LessonService.ts        # Lesson management
│   │   ├── AIScriptGenerator.ts    # Gemini integration
│   │   ├── TTSService.ts           # Text-to-speech
│   │   ├── AudioService.ts         # Audio playback
│   │   ├── GamificationService.ts  # XP, levels, badges
│   │   └── ProgressService.ts      # Student progress
│   │
│   ├── types/
│   │   ├── Lesson.ts
│   │   ├── Scene.ts
│   │   ├── Gamification.ts
│   │   └── Progress.ts
│   │
│   └── pages/
│       ├── Home.ts                 # Grade/Unit selection
│       ├── LessonView.ts           # Lesson playback
│       └── Progress.ts             # Student dashboard
│
├── data/
│   └── lessons/                    # Generated lesson packages
│       ├── grade-7/
│       │   ├── unit-01/
│       │   │   ├── getting-started/
│       │   │   │   ├── script.json
│       │   │   │   ├── audio/
│       │   │   │   │   ├── combined.mp3
│       │   │   │   │   ├── scene-01.mp3
│       │   │   │   │   └── ...
│       │   │   │   └── tapescript.txt
│       │   │   ├── a-closer-look-1/
│       │   │   └── ...
│       │   └── ...
│       └── ...
│
└── tools/
    └── lesson-generator/           # CLI tool để generate lessons
        ├── generate.ts
        └── batch-process.ts
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Lesson Player component với scene navigation
- [ ] Basic scene types (intro, vocabulary, summary)
- [ ] Audio playback service
- [ ] Local storage for progress

### Phase 2: AI Integration (Week 2-3)
- [ ] Gemini API integration for script generation
- [ ] Google Cloud TTS integration
- [ ] Lesson package generation pipeline
- [ ] Tapescript generation

### Phase 3: Interactive Content (Week 3-4)
- [ ] Exercise scenes (True/False, Multiple Choice)
- [ ] Vocabulary games (Matching, Fill-blank)
- [ ] Pronunciation practice with feedback
- [ ] Dialogue playback with highlighting

### Phase 4: Gamification (Week 4-5)
- [ ] XP and level system
- [ ] Badges and achievements
- [ ] Streak tracking
- [ ] Progress dashboard

### Phase 5: TV Mode & Polish (Week 5-6)
- [ ] Large screen optimization
- [ ] Remote control support
- [ ] Offline capability
- [ ] Performance optimization

---

## 💰 API Costs Estimation

### Google Cloud TTS
- ~$16 per 1 million characters
- Average lesson: ~3,000 characters = ~$0.05/lesson
- 258 lessons × $0.05 = ~$13 total for all content

### Gemini API
- Input: $0.0025 per 1K tokens
- Output: $0.01 per 1K tokens
- Average lesson generation: ~2K tokens = ~$0.025/lesson
- 258 lessons × $0.025 = ~$6.50 total

### Total estimated cost: ~$20-30 one-time for all content

---

## 🎯 Key Success Metrics

1. **Engagement**: Average session duration > 10 minutes
2. **Completion**: > 70% lesson completion rate
3. **Retention**: Daily active users / Weekly active users > 40%
4. **Learning**: Pre/post vocabulary test improvement > 30%

---

## 📝 Next Steps

1. **Confirm design** - Bạn review và cho feedback
2. **Create prototype** - Build basic lesson player
3. **Test with 1 lesson** - Grade 7 Unit 1 Getting Started
4. **Iterate** - Improve based on testing
5. **Scale** - Process all lessons

---

Bạn muốn tôi bắt đầu implement phase nào trước?
