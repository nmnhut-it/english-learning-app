# Claude Development Instructions

## Project Overview
English Learning App V2 - Vanilla TypeScript for Global Success curriculum grades 6-12.

## Commands
```bash
cd v2/ && npm run dev      # Frontend http://localhost:3003
cd v2-backend/ && npm run dev  # Backend http://localhost:5002
```

## Voice Lecture System

Voice lectures: `v2/data/voice-lectures/g{6-9}/unit-{01-12}/{section}.md`

Sections: `getting-started`, `a-closer-look-1`, `a-closer-look-2`, `communication`, `skills-1`, `skills-2`, `looking-back`

---

## Markdown Schema

### Document Header
```markdown
# UNIT [number]: [TITLE]
## [SECTION NAME] - [Subtitle]
```

### Vocabulary Section

```markdown
<teacher_script pause="0">
Các em mở sách ra, Unit [X], bài <eng>[Section Name]</eng>, ghi tựa bài. Sau đó bấm nút "Bắt đầu" bên dưới để học từ vựng. Máy sẽ đọc và các em đọc theo. Sau đó các em làm bài trắc nghiệm từ vựng rồi ghi từ vựng vô tập.
</teacher_script>

<vocabulary>
1. **word** : (type) meaning /pronunciation/
2. **phrase** : meaning /pronunciation/
</vocabulary>
```

### Content Tags
| Tag | Purpose |
|-----|---------|
| `<vocabulary>` | Click-to-pronounce word list |
| `<dialogue>` | Conversation (bilingual table) |
| `<reading>` | Reading passage / Tapescript |
| `<translation>` | Vietnamese translation |
| `<task>` | Exercise instructions |
| `<questions type="">` | Exercise questions |
| `<answer>` | Correct answers |
| `<explanation>` | Answer explanations |
| `<teacher_script>` | TTS script |
| `<grammar>` | Grammar rules |

### Exercise Types
`multiple_choice`, `matching`, `fill_blanks`, `true_false`, `complete_sentences`, `speaking`, `writing`, `listen_tick`, `ordering`

### Exercise Structure
```markdown
### Bài [N] trang [page] - [Type]

<teacher_script pause="60">
Bài [N], [instruction]. [time] nha.
</teacher_script>

<task>
**Đề:** [English instruction]
**Dịch đề:** [Vietnamese]
</task>

<questions type="multiple_choice">
**1.** Question ________.
- A. Option A
- B. Option B
*Vietnamese translation*
</questions>

<teacher_script pause="0">
Ok đáp án nè.
</teacher_script>

<answer>
**Đáp án:** 1.A | 2.B
</answer>
```

---

## Teacher Script

### Attributes
| Attr | Values | Description |
|------|--------|-------------|
| `pause` | 0-600 | Seconds to wait (0 = wait for click) |
| `action` | record/photo | Show action button |

### Inline Language Tags
Use `<eng>` for English words in Vietnamese text:
```markdown
<teacher_script pause="0">
Bài 1 <eng>Listen and read</eng> nha. Đọc hội thoại.
</teacher_script>
```

### Southern Vietnamese Style
- Use: nha, hen, đi, thôi, nè, á, nghen, luôn
- Casual, friendly tone like a tutor
- Light humor when appropriate

**DO:** "Ok lớp 6, Unit 7 nha. Mở sách trang 6 đi."
**DON'T:** "Chào các em! Hôm nay chúng ta sẽ học Unit 7."

---

## Chunk Pattern

Each chunk: teacher_script (intro) → content → teacher_script (instruction)

```markdown
<!-- chunk: vocabulary -->
<teacher_script pause="0">
Các em mở sách ra, Unit 7, bài <eng>Getting Started</eng>, ghi tựa bài. Sau đó bấm nút "Bắt đầu" bên dưới để học từ vựng. Máy sẽ đọc và các em đọc theo. Sau đó các em làm bài trắc nghiệm từ vựng rồi ghi từ vựng vô tập.
</teacher_script>

<vocabulary>
1. **traffic** : (n) giao thông /ˈtræfɪk/
</vocabulary>

<!-- chunk: dialogue -->
<teacher_script pause="0">
Đây là hội thoại bài 1. Đọc và dịch.
</teacher_script>

<dialogue>
| English | Vietnamese |
|---------|------------|
| **A:** Hello! | **A:** Xin chào! |
</dialogue>

<teacher_script pause="180">
Dịch hội thoại vô vở. 3 phút.
</teacher_script>
```

---

## Section Workflows

### GETTING STARTED
intro → vocabulary (with quiz) → dialogue → translation → exercises → end

### A CLOSER LOOK 1
vocabulary → exercises → pronunciation theory → pronunciation practice

### A CLOSER LOOK 2 (Grammar)
- Split each concept into separate chunks
- Explain each answer individually
- Use memory tricks (AND=+, BUT=↔, SO=→)

### SKILLS 1 (Reading + Speaking)
vocabulary → reading → translation → exercises → speaking + record

### SKILLS 2 (Listening + Writing)
vocabulary → tapescript → listening exercises → writing + photo

---

## Best Practices

1. **Teacher script reads along with displayed content** - student sees AND hears
2. **Split complex info** - one concept per teacher_script
3. **Explain each answer** - not just "1.A, 2.B, 3.C"
4. **Appropriate pause times:**
   - Intro: 0 (wait for click)
   - Short note: 30s
   - Exercise: 45-60s
   - Translation: 180s
   - Writing: 300-600s

---

## Explanation Standards

### Format Template
```markdown
<explanation>
**1. A** - [Rule name]: "[quote from text]" → [reasoning]
**2. B** - [Rule name]: [explanation with Vietnamese translation]
</explanation>
```

### Requirements
- **Bold answer first** - Use `**1. A**` not plain "1. A"
- **Name the rule** - "ngôi thứ 3 số ít", "quá khứ tiếp diễn", "mệnh đề quan hệ"
- **Show transformation** - Use arrows: → (result), ↔ (contrast), = (equivalent)
- **Address common traps** - Use CAPS: "KHÔNG dùng", "CHỦ NGỮ GIỐNG NHAU"
- **Vietnamese translation** - Include full translation of example sentences

### Example (Good)
```markdown
<explanation>
**1. was working** - Quá khứ tiếp diễn: Khi Kim đến (QKĐ), Tâm ĐANG LÀM (QKTD) → hành động đang xảy ra bị ngắt.
**2. was visiting** - Quá khứ tiếp diễn với "while": Trong khi ĐANG THĂM → hành động kéo dài làm nền.
</explanation>
```

### Example (Bad - Avoid)
```markdown
<answer>
**Đáp án:** 1.A | 2.B | 3.C | 4.D
</answer>
<!-- No explanation of WHY each answer is correct -->
```

---

## Grammar Section Standards

### Universal Template
```markdown
<grammar>
## Vietnamese Name (English Name)

**Công thức:**
- (+) S + [affirmative formula]
- (-) S + [negative formula]
- (?) [Question formula]

**Dùng khi nào:**
1. [Use case]: Example. *(Vietnamese translation.)*
2. [Use case]: Example. *(Vietnamese translation.)*

**Dấu hiệu:** [signal words]

**Lưu ý/Mẹo:** [irregular cases or memory tricks]
</grammar>
```

### Required Elements
| Element | Purpose | Required For |
|---------|---------|--------------|
| **Công thức** (+/-/?) | Shows sentence patterns | All tenses |
| **Dùng khi nào** | Numbered use cases with examples | All grammar |
| **Dấu hiệu** | Signal words for recognition | Tenses only |
| **Lưu ý/Mẹo** | Irregular forms, memory tricks | When applicable |

### Memory Anchors
Use visual/numeric anchors to aid memorization:
- Frequency adverbs: `always=100%, usually=80%, sometimes=50%, rarely=20%, never=0%`
- Connectors: `AND=+ (thêm), BUT=↔ (tương phản), SO=→ (kết quả), OR=| (lựa chọn)`
- Participles: `V-ing=chủ động (tự làm), V-ed/V3=bị động (bị/được làm)`

### Table Format (G8+)
For connectors and complex comparisons:
```markdown
| Từ nối | Nghĩa | Chức năng | Dấu câu |
|--------|-------|-----------|---------|
| **and** | và | thêm thông tin | , (phẩy) |
| **but** | nhưng | tương phản | , (phẩy) |
| **however** | tuy nhiên | tương phản | ; (chấm phẩy) |
```

---

## Teacher Script Standards

### Pause Time Reference
| pause | Use Case | Example |
|-------|----------|---------|
| 0 | Instructions, explanations (click to proceed) | "Ok đáp án nè." |
| 30 | Listen/repeat, short note-taking | "Ghi công thức vô tập đi." |
| 45-60 | Short exercises (matching, MC, fill blanks) | "Bài 2, làm trong 1 phút nha." |
| 90-120 | Labeling diagrams, moderate exercises | "Hoàn thành sơ đồ. 2 phút." |
| 180 | Dialogue/reading translation | "Dịch hội thoại vô vở. 3 phút." |
| 300-600 | Writing tasks, photo submission | "Viết đoạn văn. 5 phút." |

### Standard Reusable Scripts
```markdown
<!-- Vocabulary intro (all sections) -->
<teacher_script pause="0">
Các em mở sách ra, bài <eng>[Section]</eng>, ghi tựa bài. Sau đó bấm nút "Bắt đầu" bên dưới để học từ vựng. Máy sẽ đọc và các em đọc theo. Sau đó các em làm bài trắc nghiệm từ vựng rồi ghi từ vựng vô tập.
</teacher_script>

<!-- Before showing answer -->
<teacher_script pause="0">
Ok đáp án nè.
</teacher_script>

<!-- Section ending -->
<teacher_script pause="0">
Bài <eng>[Section]</eng> Unit [X] xong rồi nha. Nhớ [2-3 key points]. Ôn bài hen!
</teacher_script>
```

### Script Writing Rules
1. **Action verb first** - "Mở sách", "Ghi vô tập", "Nghe và đọc theo"
2. **1-4 sentences max** - Split longer instructions across multiple scripts
3. **Specific references** - "Bài 2 trang 15" not "bài tiếp theo"
4. **`<eng>` for English terms** - Section names, grammar terms, key vocabulary

### Tone Markers
| Use These | Avoid These |
|-----------|-------------|
| nha, hen, đi, nè, nghen, á, luôn, thôi | Chào các em, Hôm nay chúng ta sẽ học |
| Ok lớp 6, Unit 7 nha | Xin chào! Bài học hôm nay... |
| Đáp án nè | Đây là đáp án đúng |

---

## Checklist
- [ ] Each chunk has teacher_script before AND after
- [ ] Grammar split into small concepts
- [ ] Answers explained individually
- [ ] Natural Southern Vietnamese tone
- [ ] Translations for dialogue/reading
