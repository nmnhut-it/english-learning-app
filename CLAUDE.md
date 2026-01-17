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

## Checklist
- [ ] Each chunk has teacher_script before AND after
- [ ] Grammar split into small concepts
- [ ] Answers explained individually
- [ ] Natural Southern Vietnamese tone
- [ ] Translations for dialogue/reading
