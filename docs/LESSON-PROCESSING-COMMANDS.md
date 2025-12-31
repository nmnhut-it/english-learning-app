# 🤖 Lesson Processing Command System

Hệ thống tự động chuyển đổi markdown → structured JSON sử dụng AI.

## 🚀 Quick Start

```bash
# 1. Quét tất cả content có sẵn
/scan-content

# 2. Xem tiến độ
/check-progress

# 3. Xử lý bài tiếp theo
/process-next

# 4. Hoặc xử lý bài cụ thể
/process-lesson 7 1 getting-started
```

---

## 📋 Available Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/scan-content` | Quét tất cả markdown, cập nhật tracking | `/scan-content` |
| `/check-progress` | Xem tiến độ xử lý | `/check-progress 7` |
| `/process-lesson` | Xử lý 1 bài cụ thể | `/process-lesson 7 1 getting-started` |
| `/process-next` | Xử lý bài tiếp theo trong queue | `/process-next 5` |
| `/retry-failed` | Xử lý lại các bài lỗi | `/retry-failed` |
| `/view-lesson` | Xem kết quả bài đã xử lý | `/view-lesson 7 1 getting-started` |

---

## 📂 File Structure

```
english-learning-app/
├── .claude/
│   └── commands/
│       ├── process-lesson.md     # Xử lý 1 bài
│       ├── scan-content.md       # Quét content
│       ├── check-progress.md     # Xem tiến độ
│       ├── process-next.md       # Xử lý bài tiếp
│       ├── retry-failed.md       # Xử lý lại lỗi
│       └── view-lesson.md        # Xem bài đã xử lý
│
├── data/
│   └── lesson-processing/
│       ├── TRACKING.json         # File tracking chính
│       └── output/
│           ├── g6/
│           │   ├── u01/
│           │   │   ├── getting-started.json
│           │   │   ├── a-closer-look-1.json
│           │   │   └── ...
│           │   └── u02/
│           ├── g7/
│           ├── g8/
│           ├── g9/
│           ├── g10/
│           └── g11/
│
├── markdown-files/               # Input (existing)
│   ├── formatg6/
│   ├── g7/
│   ├── g8/
│   ├── g9/
│   ├── g10/
│   └── g11/
│
└── docs/
    ├── AI-LESSON-SYSTEM-DESIGN.md   # Schema & design
    └── LESSON-PROCESSING-COMMANDS.md # This file
```

---

## 🔄 Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    LESSON PROCESSING WORKFLOW               │
└─────────────────────────────────────────────────────────────┘

Step 1: SCAN
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│ /scan-content │ → │ Find all .md    │ → │ Update       │
│             │     │ files           │     │ TRACKING.json│
└─────────────┘     └─────────────────┘     └──────────────┘

Step 2: PROCESS
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│ /process-next│ → │ AI extracts     │ → │ Save .json   │
│             │     │ content blocks  │     │ output       │
└─────────────┘     └─────────────────┘     └──────────────┘
                            ↓
                    Update TRACKING.json

Step 3: VERIFY
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│/check-progress│→ │ Show stats      │ → │ Identify     │
│             │     │ per grade/unit  │     │ failures     │
└─────────────┘     └─────────────────┘     └──────────────┘

Step 4: FIX (if needed)
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│ /retry-failed│ → │ Reprocess       │ → │ Update       │
│             │     │ failed lessons  │     │ tracking     │
└─────────────┘     └─────────────────┘     └──────────────┘
```

---

## 📊 TRACKING.json Structure

```json
{
  "meta": {
    "lastUpdated": "2024-12-31T10:30:00Z",
    "totalLessons": 267,
    "processedLessons": 120,
    "pendingLessons": 145,
    "failedLessons": 2
  },
  "grades": {
    "7": {
      "status": "in_progress",
      "totalUnits": 12,
      "completedUnits": 5,
      "units": {
        "1": {
          "title": "Hobbies",
          "status": "completed",
          "sections": {
            "getting-started": {
              "status": "completed",
              "sourceFile": "markdown-files/g7/unit-01/g7_u01_getting-started.md",
              "outputFile": "data/lesson-processing/output/g7/u01/getting-started.json",
              "processedAt": "2024-12-31T10:15:00Z",
              "stats": {
                "vocabularyCount": 18,
                "exerciseCount": 4,
                "xpTotal": 130
              }
            },
            "a-closer-look-1": {
              "status": "pending",
              "sourceFile": "markdown-files/g7/unit-01/g7_u01_a-closer-look-1.md",
              "outputFile": null
            }
          }
        }
      }
    }
  },
  "processingQueue": [
    "g7-u01-a-closer-look-1",
    "g7-u01-a-closer-look-2",
    "g7-u01-communication"
  ],
  "history": [
    {
      "lessonId": "g7-u01-getting-started",
      "action": "completed",
      "timestamp": "2024-12-31T10:15:00Z",
      "duration": 2.3
    }
  ]
}
```

---

## 🎯 Output JSON Structure

Each processed lesson produces a JSON file following the `LessonData` schema:

```json
{
  "id": "g7-u01-getting-started",
  "grade": 7,
  "unit": 1,
  "unitTitle": "Hobbies",
  "section": "getting_started",
  "sectionTitle": "Getting Started",
  "sourceFile": "markdown-files/g7/unit-01/g7_u01_getting-started.md",
  "processedAt": "2024-12-31T10:15:00Z",
  "estimatedDuration": 15,

  "blocks": [
    {
      "type": "instruction",
      "content": "Welcome to Unit 1: Hobbies!",
      "contentVi": "Chào mừng đến với Bài 1: Sở thích!"
    },
    {
      "type": "vocabulary",
      "items": [
        {
          "word": "hobby",
          "partOfSpeech": "n",
          "pronunciation": "/ˈhɒbi/",
          "meaning": "sở thích"
        }
      ]
    },
    {
      "type": "dialogue",
      "lines": [
        {
          "speaker": "Ann",
          "text": "Your house is very nice, Trang.",
          "translation": "Nhà của bạn rất đẹp, Trang."
        }
      ]
    },
    {
      "type": "exercise",
      "exerciseType": "true_false",
      "instruction": "Read and write T or F",
      "questions": [...]
    }
  ],

  "stats": {
    "vocabularyCount": 18,
    "exerciseCount": 4,
    "dialogueLines": 10,
    "hasGrammar": false,
    "hasReading": false,
    "hasListening": false
  },

  "rewards": {
    "xpTotal": 130,
    "badges": ["vocabulary_starter"]
  }
}
```

---

## ⚡ Tips & Best Practices

### 1. Chạy lần đầu
```bash
/scan-content          # Quét tất cả
/check-progress        # Xem có bao nhiêu bài
/process-next 3        # Thử 3 bài trước
/check-progress        # Xem kết quả
```

### 2. Xử lý theo grade
```bash
# Xử lý hết Grade 7 trước
/process-lesson 7 1 getting-started
/process-lesson 7 1 a-closer-look-1
# ... hoặc
/process-next          # Tự động theo thứ tự
```

### 3. Xử lý batch
```bash
/process-next 10       # Xử lý 10 bài liên tiếp
/process-next all      # Xử lý TẤT CẢ (cẩn thận!)
```

### 4. Khi có lỗi
```bash
/check-progress        # Xem bài nào lỗi
/retry-failed          # Thử lại
# Hoặc xử lý manual
/process-lesson 9 3 skills-1
```

---

## 🔧 Troubleshooting

### "Lesson not found"
- Kiểm tra đường dẫn file markdown
- Chạy `/scan-content` để cập nhật

### "Parse error"
- Markdown format không đúng
- Cần kiểm tra và sửa file nguồn

### "Missing vocabulary section"
- Bài không có phần từ vựng
- AI sẽ tạo block trống

---

## 📈 Progress Tracking

Mỗi lần chạy command, hệ thống sẽ:
1. ✅ Cập nhật `TRACKING.json`
2. ✅ Log vào `history`
3. ✅ Hiển thị tiến độ

Bạn có thể xem progress bất kỳ lúc nào với `/check-progress`.

---

## 🚀 Next Steps After Processing

Sau khi xử lý xong tất cả lessons:

1. **Generate Audio** (upcoming command)
   ```bash
   /generate-audio 7 1 getting-started
   ```

2. **Build Lesson Player**
   - Web app đọc JSON và render bài học

3. **Export for Production**
   ```bash
   /export-lessons
   ```
