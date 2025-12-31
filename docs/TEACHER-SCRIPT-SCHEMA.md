# AI Teacher Script Schema

## Triết lý

Giáo viên ảo phải **giảng thật**, không phải nói suông. Mỗi câu phải giúp học sinh hiểu bài hơn.

❌ **KHÔNG:**
```
"Chào các em! Hôm nay chúng ta học về Environmental Protection. Let's go!"
"Great job! You've completed the lesson!"
```

✅ **ĐÚNG:**
```
"Bài này có điểm ngữ pháp quan trọng: sau before, after, when - động từ
KHÔNG BAO GIỜ dùng 'will'. Ví dụ: 'Before I leave' chứ không phải
'Before I will leave'. Đây là lỗi rất phổ biến trong bài thi."
```

---

## TeacherScript Block Types

```typescript
type TeacherScriptType =
  | 'lesson_intro'      // Giới thiệu bài - nói về mục tiêu học
  | 'concept_explain'   // Giải thích khái niệm (grammar, vocabulary group)
  | 'pre_exercise'      // Hướng dẫn trước khi làm bài
  | 'post_exercise'     // Phân tích sau bài tập
  | 'error_warn'        // Cảnh báo lỗi phổ biến
  | 'tip'               // Mẹo ghi nhớ
  | 'summary'           // Tổng kết điểm chính
  | 'transition';       // Chuyển tiếp giữa các phần
```

---

## 1. LESSON_INTRO - Giới thiệu bài học

Mục đích: Nói cho học sinh biết **sẽ học được gì**, **tại sao quan trọng**

```typescript
interface LessonIntroScript {
  type: 'lesson_intro';

  // Giáo viên nói gì (tiếng Việt)
  script: string;

  // Audio file (TTS generated)
  audioFile?: string;

  // Mục tiêu học tập - hiển thị trên màn hình
  objectives: string[];

  // Thời lượng (giây)
  duration: number;
}

// Ví dụ:
{
  "type": "lesson_intro",
  "script": "Bài Skills 1 hôm nay có 2 phần chính. Phần Reading, các em sẽ đọc về vườn quốc gia Côn Đảo - một trong 34 vườn quốc gia của Việt Nam. Phần Listening, các em sẽ nghe về ô nhiễm nước và cách giảm thiểu. Quan trọng nhất là học cách tìm thông tin chính trong bài đọc và bài nghe.",
  "objectives": [
    "Đọc hiểu bài về National Parks",
    "Nghe hiểu về Water Pollution",
    "Học từ vựng: ecosystem, endangered, pollution"
  ],
  "duration": 25
}
```

---

## 2. CONCEPT_EXPLAIN - Giải thích khái niệm

Mục đích: Giảng **chi tiết** một điểm ngữ pháp hoặc nhóm từ vựng

```typescript
interface ConceptExplainScript {
  type: 'concept_explain';

  // Tên khái niệm
  concept: string;
  conceptVi: string;

  // Script giảng
  script: string;

  // Công thức/quy tắc (nếu là grammar)
  formula?: string;

  // Ví dụ minh họa
  examples: {
    english: string;
    vietnamese: string;
    highlight?: string[];  // Phần cần highlight
  }[];

  // Visual aid type
  visualAid?: 'timeline' | 'table' | 'diagram' | 'comparison';

  audioFile?: string;
  duration: number;
}

// Ví dụ Grammar:
{
  "type": "concept_explain",
  "concept": "Adverbial Clauses of Time",
  "conceptVi": "Mệnh đề trạng ngữ chỉ thời gian",
  "script": "Khi nối 2 câu bằng before, after, when, while, until, as soon as - các em nhớ quy tắc vàng này: Mệnh đề sau các từ này KHÔNG ĐƯỢC dùng thì tương lai. Nghĩa là không có 'will'. Ví dụ: 'I will call you before I leave' - đúng. 'I will call you before I will leave' - SAI. Tại sao? Vì 'before I leave' đã ngầm chỉ tương lai rồi, không cần thêm 'will' nữa.",
  "formula": "Main clause (will + V) + before/after/when + clause (V present)",
  "examples": [
    {
      "english": "I will call you before I leave.",
      "vietnamese": "Tôi sẽ gọi bạn trước khi tôi đi.",
      "highlight": ["will call", "leave"]
    },
    {
      "english": "As soon as I arrive, I will text you.",
      "vietnamese": "Ngay khi tôi đến, tôi sẽ nhắn tin cho bạn.",
      "highlight": ["arrive", "will text"]
    }
  ],
  "visualAid": "timeline",
  "duration": 45
}

// Ví dụ Vocabulary Group:
{
  "type": "concept_explain",
  "concept": "Environmental Vocabulary",
  "conceptVi": "Từ vựng về môi trường",
  "script": "Nhóm từ về môi trường có nhiều từ ghép. 'Eco-' nghĩa là sinh thái: ecosystem - hệ sinh thái. 'En-' + 'danger' = endangered - bị đe dọa, có nguy cơ tuyệt chủng. Các em để ý: endangered species - loài có nguy cơ tuyệt chủng. Wildlife - đời sống hoang dã, gồm wild + life.",
  "examples": [
    {
      "english": "The ecosystem here is very diverse.",
      "vietnamese": "Hệ sinh thái ở đây rất đa dạng."
    },
    {
      "english": "Dugongs are endangered species.",
      "vietnamese": "Bò biển là loài có nguy cơ tuyệt chủng."
    }
  ],
  "visualAid": "diagram",
  "duration": 35
}
```

---

## 3. PRE_EXERCISE - Hướng dẫn trước bài tập

Mục đích: Cho học sinh **chiến thuật** làm bài, không chỉ nói "hãy làm bài"

```typescript
interface PreExerciseScript {
  type: 'pre_exercise';

  // Loại bài tập
  exerciseType: string;

  // Hướng dẫn chiến thuật
  script: string;

  // Các bước cụ thể
  steps?: string[];

  // Từ khóa cần chú ý
  keywordsToWatch?: string[];

  // Thời gian đề xuất
  suggestedTime?: number;

  audioFile?: string;
  duration: number;
}

// Ví dụ Listening:
{
  "type": "pre_exercise",
  "exerciseType": "listening_fill_blank",
  "script": "Bài nghe này có 4 chỗ trống cần điền. Trước khi nghe, các em đọc qua 4 câu trước đã. Gạch chân từ khóa xung quanh chỗ trống. Ví dụ câu 1: 'It makes water unsafe for ___ and other uses' - từ khóa là 'unsafe', 'other uses'. Khi nghe, tập trung vào phần này.",
  "steps": [
    "Đọc 4 câu, gạch chân từ khóa",
    "Đoán loại từ cần điền (noun? verb? adj?)",
    "Nghe lần 1: điền được gì thì điền",
    "Nghe lần 2: kiểm tra và hoàn thành"
  ],
  "keywordsToWatch": ["unsafe", "other uses", "flow into", "harmful"],
  "suggestedTime": 180,
  "duration": 30
}

// Ví dụ Reading:
{
  "type": "pre_exercise",
  "exerciseType": "multiple_choice_reading",
  "script": "Bài đọc về vườn quốc gia Côn Đảo. Có 5 câu hỏi trắc nghiệm. Mẹo: đọc câu hỏi TRƯỚC, gạch chân từ khóa, rồi mới đọc bài. Câu hỏi 'Which is NOT true' - phải kiểm tra từng đáp án với bài đọc, loại dần.",
  "steps": [
    "Đọc 5 câu hỏi trước",
    "Gạch chân từ khóa trong câu hỏi",
    "Đọc lướt bài tìm thông tin",
    "Câu 'NOT true' - kiểm tra từng option"
  ],
  "duration": 25
}
```

---

## 4. POST_EXERCISE - Phân tích sau bài tập

Mục đích: Giải thích **tại sao** đáp án đúng/sai

```typescript
interface PostExerciseScript {
  type: 'post_exercise';

  // Phân tích kết quả
  script: string;

  // Giải thích từng câu (nếu cần)
  explanations?: {
    questionId: number;
    correctAnswer: string;
    explanation: string;
  }[];

  // Lỗi phổ biến
  commonMistakes?: string[];

  audioFile?: string;
  duration: number;
}

// Ví dụ:
{
  "type": "post_exercise",
  "script": "Câu 5 nhiều em chọn sai. Câu hỏi là 'Which is NOT true'. Đáp án C nói 'sứ mệnh của Côn Đảo là giúp các vườn quốc gia khác' - bài đọc KHÔNG hề nói điều này. Bài chỉ nói Côn Đảo bảo vệ loài nguy cấp và nâng cao ý thức người dân. Nhớ: với câu 'NOT true', phải tìm thông tin KHÔNG có trong bài.",
  "explanations": [
    {
      "questionId": 5,
      "correctAnswer": "C",
      "explanation": "Bài đọc không đề cập việc Côn Đảo giúp các vườn quốc gia khác"
    }
  ],
  "commonMistakes": [
    "Chọn đáp án 'nghe đúng' mà không kiểm tra trong bài",
    "Không phân biệt 'true' và 'NOT true'"
  ],
  "duration": 30
}
```

---

## 5. ERROR_WARN - Cảnh báo lỗi phổ biến

Mục đích: Nhắc học sinh **tránh lỗi** trước khi mắc phải

```typescript
interface ErrorWarnScript {
  type: 'error_warn';

  // Loại lỗi
  errorType: string;

  // Mô tả lỗi
  script: string;

  // Ví dụ sai vs đúng
  wrongVsRight: {
    wrong: string;
    right: string;
    explanation: string;
  }[];

  audioFile?: string;
  duration: number;
}

// Ví dụ:
{
  "type": "error_warn",
  "errorType": "Future tense after time conjunctions",
  "script": "LỖI PHỔ BIẾN: Dùng 'will' sau before, after, when. Đây là lỗi CỰC KỲ phổ biến trong bài thi. Các em nhớ: mệnh đề thời gian dùng thì HIỆN TẠI để chỉ tương lai.",
  "wrongVsRight": [
    {
      "wrong": "I will go before you will finish.",
      "right": "I will go before you finish.",
      "explanation": "Sau 'before' không dùng 'will'"
    },
    {
      "wrong": "When I will see him, I will tell him.",
      "right": "When I see him, I will tell him.",
      "explanation": "Sau 'when' không dùng 'will'"
    }
  ],
  "duration": 35
}
```

---

## 6. TIP - Mẹo ghi nhớ

Mục đích: Cho học sinh **mẹo** để nhớ lâu

```typescript
interface TipScript {
  type: 'tip';

  // Mẹo
  script: string;

  // Loại mẹo
  tipType: 'memory_trick' | 'exam_strategy' | 'pronunciation' | 'spelling';

  // Visual (nếu có)
  visual?: string;

  audioFile?: string;
  duration: number;
}

// Ví dụ:
{
  "type": "tip",
  "tipType": "memory_trick",
  "script": "Mẹo nhớ: 'BAWWU' - Before, After, When, While, Until - 5 từ này đều KHÔNG đi với 'will' ở mệnh đề sau. Nghĩ: 'BAWWU không thích Will' - Will bị cấm vào nhà BAWWU!",
  "visual": "BAWWU 🚫 will",
  "duration": 20
}

// Ví dụ pronunciation:
{
  "type": "tip",
  "tipType": "pronunciation",
  "script": "Từ 'endangered' có 4 âm tiết: en-DAN-gered. Nhấn âm thứ 2: DAN. Nhiều em đọc sai thành en-dan-GE-red. Sai! Nhớ: enDANgered - nhấn DAN.",
  "duration": 15
}
```

---

## 7. SUMMARY - Tổng kết

Mục đích: Nhắc lại **điểm chính**, không phải khen ngợi

```typescript
interface SummaryScript {
  type: 'summary';

  // Tổng kết
  script: string;

  // Điểm chính cần nhớ
  keyPoints: string[];

  // Từ vựng quan trọng nhất
  keyVocabulary?: string[];

  // Grammar rules
  keyGrammar?: string[];

  audioFile?: string;
  duration: number;
}

// Ví dụ:
{
  "type": "summary",
  "script": "Bài hôm nay có 3 điểm cần nhớ. Một: từ vựng môi trường - ecosystem, endangered species, wildlife. Hai: quy tắc vàng về mệnh đề thời gian - sau before, after, when, while, until KHÔNG dùng 'will'. Ba: kỹ năng đọc - đọc câu hỏi trước, gạch chân từ khóa.",
  "keyPoints": [
    "Từ vựng: ecosystem, endangered, wildlife, pollution",
    "Grammar: before/after/when/while/until + present (không will)",
    "Kỹ năng: Đọc câu hỏi trước → gạch chân từ khóa → tìm trong bài"
  ],
  "keyVocabulary": ["ecosystem", "endangered species", "wildlife", "water pollution"],
  "keyGrammar": ["Time clause + present tense (not future)"],
  "duration": 40
}
```

---

## 8. TRANSITION - Chuyển tiếp

Mục đích: Kết nối các phần, **ngắn gọn** và có ý nghĩa

```typescript
interface TransitionScript {
  type: 'transition';

  // Từ phần nào sang phần nào
  from: string;
  to: string;

  // Script ngắn gọn
  script: string;

  audioFile?: string;
  duration: number;  // Usually 5-10 seconds
}

// Ví dụ:
{
  "type": "transition",
  "from": "vocabulary",
  "to": "reading",
  "script": "Vừa học 17 từ mới. Giờ xem các từ này xuất hiện trong bài đọc như thế nào.",
  "duration": 8
}
```

---

## Complete Lesson Block Structure

```typescript
// Thay thế InstructionBlock cũ bằng TeacherScript
type ContentBlock =
  | VocabularyBlock
  | DialogueBlock
  | ExerciseBlock
  | GrammarBlock
  | ReadingBlock
  | ListeningBlock
  | PronunciationBlock
  | TeacherScript;  // Thay cho InstructionBlock

type TeacherScript =
  | LessonIntroScript
  | ConceptExplainScript
  | PreExerciseScript
  | PostExerciseScript
  | ErrorWarnScript
  | TipScript
  | SummaryScript
  | TransitionScript;
```

---

## Ví dụ Complete Lesson Flow

```json
{
  "blocks": [
    {
      "type": "lesson_intro",
      "script": "Bài A Closer Look 2 tập trung vào ngữ pháp: cách dùng mệnh đề trạng ngữ chỉ thời gian. Đây là điểm ngữ pháp quan trọng, thường xuất hiện trong bài thi.",
      "objectives": ["Hiểu mệnh đề trạng ngữ thời gian", "Dùng before, after, when, while, until đúng cách"]
    },

    {
      "type": "concept_explain",
      "concept": "Adverbial Clauses of Time",
      "script": "Mệnh đề trạng ngữ thời gian bắt đầu bằng before, after, when, while, until, as soon as. Quy tắc vàng: mệnh đề này dùng thì HIỆN TẠI để chỉ tương lai, KHÔNG dùng 'will'...",
      "examples": [...]
    },

    {
      "type": "error_warn",
      "script": "LỖI PHỔ BIẾN: 'I will call you before I will leave' - SAI! Phải là 'before I leave'...",
      "wrongVsRight": [...]
    },

    {
      "type": "pre_exercise",
      "exerciseType": "sentence_combining",
      "script": "Bài tập này yêu cầu nối 2 câu thành 1 câu dùng từ trong ngoặc. Nhớ: câu có 'will' là mệnh đề chính, câu còn lại là mệnh đề thời gian - dùng thì hiện tại.",
      "steps": ["Xác định câu nào có 'will'", "Câu còn lại chuyển về hiện tại", "Nối bằng từ trong ngoặc"]
    },

    {
      "type": "exercise",
      "exerciseType": "sentence_combining",
      "questions": [...]
    },

    {
      "type": "post_exercise",
      "script": "Câu 4 nhiều em sai vì dùng 'while' - nhưng 2 hành động không xảy ra song song. 'After they destroyed the forest, there were not many animals' - dùng 'after' vì hành động phá rừng xong rồi mới thấy động vật ít đi.",
      "explanations": [...]
    },

    {
      "type": "tip",
      "tipType": "memory_trick",
      "script": "Mẹo nhớ: BAWWU không thích Will! Before, After, When, While, Until - 5 từ này cấm 'will' phía sau."
    },

    {
      "type": "summary",
      "script": "Nhớ 1 điều duy nhất: sau before, after, when, while, until - dùng thì HIỆN TẠI, không dùng 'will'. Đơn giản vậy thôi.",
      "keyPoints": ["Time clause + present (không will)"]
    }
  ]
}
```

---

## Audio Generation Guidelines

### Giọng đọc
- **Giáo viên giảng bài**: Giọng nữ Việt Nam, tốc độ 0.9x, rõ ràng
- **Đọc tiếng Anh**: Giọng native UK/US, tốc độ 0.85x
- **Nhấn mạnh**: Tăng volume hoặc pause trước/sau keyword

### Script writing rules
1. Dùng ngôn ngữ đơn giản, như đang nói chuyện
2. Câu ngắn (dưới 20 từ)
3. Pause tự nhiên: dùng dấu "..." hoặc "—"
4. Nhấn mạnh bằng CHỮ HOA khi viết script
5. Không dùng emoji trong script (emoji chỉ dùng cho visual)
