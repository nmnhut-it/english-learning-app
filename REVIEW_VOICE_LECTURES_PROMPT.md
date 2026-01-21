# Prompt: Review and Update Voice Lectures for Unit X Grade Y

## Task
Review and update voice-lecture files for **Grade [X] Unit [Y]** to ensure they match the source content exactly and meet all checklist requirements.

## Source Files Location
- **loigiaihay.com source**: `/loigiaihay.com/grade[X]/unit-[YY]/*.md`
- **Ground-truth (vocab + answers)**: `/ground-truth/g[X]/g[X]_part_[Y].md`
- **Voice-lecture files**: `/v2/data/voice-lectures/g[X]/unit-[YY]/*.md`

## Files to Review (7 files per unit)
1. `getting-started.md`
2. `a-closer-look-1.md`
3. `a-closer-look-2.md`
4. `communication.md`
5. `skills-1.md`
6. `skills-2.md`
7. `looking-back.md`

---

## Checklist for Each File

### 1. Exercises Match Source Exactly (Word-for-Word)
- [ ] All questions match loigiaihay.com source **exactly** (not shortened/abbreviated)
- [ ] All answer options (A, B, C, D) match source exactly
- [ ] Word banks match source exactly
- [ ] Tables and matching exercises match source format

### 2. Answers Are Correct
- [ ] All answers match loigiaihay.com source
- [ ] Check ground-truth file (`g[X]_part_[Y].md`) for verified answers
- [ ] Explanations are accurate

### 3. Translations Included
- [ ] Full dialogue with bilingual table (English | Vietnamese)
- [ ] Reading passages with Vietnamese translation
- [ ] Questions have Vietnamese translations
- [ ] Answers have Vietnamese translations where applicable

### 4. Vocabulary Section
- [ ] Vocabulary matches ground-truth file format: `word : (type) meaning /IPA/`
- [ ] All words from the unit are included
- [ ] IPA pronunciation is correct

### 5. Teacher Scripts (Southern Vietnamese Style)
- [ ] Each chunk has teacher_script **BEFORE** content (introduction)
- [ ] Each chunk has teacher_script **AFTER** content (instruction/explanation)
- [ ] Uses casual Southern Vietnamese particles: nha, hen, đi, thôi, nè, á, nghen, luôn
- [ ] Explains each answer individually (not just "1.A, 2.B, 3.C")
- [ ] Appropriate pause times (0 for click, 30-60 for exercises, 180 for translation, 300+ for writing)

### 6. Section-Specific Requirements

#### GETTING STARTED
- [ ] Intro with vocabulary quiz
- [ ] Full dialogue in bilingual table format
- [ ] Translation instruction (3 minutes)
- [ ] All exercises with full sentences

#### A CLOSER LOOK 1
- [ ] Vocabulary section
- [ ] Full exercise sentences (not abbreviated)
- [ ] Pronunciation theory section
- [ ] Pronunciation practice with audio

#### A CLOSER LOOK 2 (Grammar)
- [ ] Grammar theory box with rules and examples
- [ ] Grammar split into small concepts
- [ ] Memory tricks where applicable
- [ ] Full sentences in all exercises

#### COMMUNICATION
- [ ] Everyday English dialogue (bilingual)
- [ ] Full situations/prompts
- [ ] Full reading passages with translations
- [ ] Speaking sample answers

#### SKILLS 1 (Reading + Speaking)
- [ ] Vocabulary section
- [ ] Full reading passage (bilingual table)
- [ ] All exercises (Bài 1-5 typically)
- [ ] Full interview dialogue sample
- [ ] Record action for speaking

#### SKILLS 2 (Listening + Writing)
- [ ] Vocabulary section
- [ ] Full tapescript with translation
- [ ] All listening exercises
- [ ] Full writing prompt with clues
- [ ] Sample writing answer with translation
- [ ] Photo action for writing

#### LOOKING BACK
- [ ] Full questions (not abbreviated)
- [ ] Grammar review theory if applicable
- [ ] All exercises match source
- [ ] Unit summary in end teacher_script

---

## Review Process

### Step 1: Read Source Files
```
Read these files first:
1. /loigiaihay.com/grade[X]/unit-[YY]/[section].md
2. /ground-truth/g[X]/g[X]_part_[Y].md
3. /v2/data/voice-lectures/g[X]/unit-[YY]/[section].md
```

### Step 2: Compare and Identify Issues
For each exercise, check:
- Does the question text match exactly?
- Are answer options complete?
- Is there Vietnamese translation?
- Is the answer correct?

### Step 3: Update Voice-Lecture File
Fix any issues found:
- Replace shortened questions with full sentences from source
- Add missing Vietnamese translations
- Fix incorrect answers
- Add missing teacher_scripts
- Convert to proper format (bilingual tables, etc.)

### Step 4: Verify Teacher Scripts
Ensure each chunk follows this pattern:
```markdown
<!-- chunk: [name] -->
<teacher_script pause="0">
[Introduction in Southern Vietnamese style]
</teacher_script>

[Content: vocabulary/dialogue/reading/questions/etc.]

<teacher_script pause="[X]">
[Instructions or answer explanations]
</teacher_script>
```

---

## Example Comparison

### Source (loigiaihay.com):
```
1. If you are travelling abroad for the first time, it's better to look for a good travel _______ to arrange everything for you.
A. budget    B. agency    C. tourism    D. homestay
```

### ❌ Wrong (abbreviated):
```
**1.** If travelling abroad for first time, look for a good travel _______.
A. budget | B. agency | C. tourism | D. homestay
```

### ✅ Correct (matches source exactly):
```markdown
**1.** If you are travelling abroad for the first time, it's better to look for a good travel _______ to arrange everything for you.
- A. budget
- B. agency
- C. tourism
- D. homestay
*Nếu bạn đi du lịch nước ngoài lần đầu tiên, tốt hơn hết là bạn nên tìm một công ty du lịch tốt để sắp xếp mọi thứ cho bạn.*
```

---

## Common Issues to Fix

1. **Shortened questions** → Replace with full sentences from source
2. **Missing translations** → Add Vietnamese in italics below English
3. **Wrong answers** → Check ground-truth file for correct answers
4. **Missing vocabulary** → Copy from ground-truth file with IPA
5. **Missing exercises** → Add missing Bài numbers from source
6. **Teacher script not explaining answers** → Add individual answer explanations
7. **Formal Vietnamese** → Convert to Southern casual style (nha, đi, hen, etc.)
8. **Missing bilingual dialogue** → Convert to table format with both languages
9. **Missing tapescript** → Add from source with translation

---

## After Completing Review

1. Commit changes with descriptive message
2. Push to branch
3. Report summary of changes made

---

## Quick Reference: Folder Structure

```
/home/user/english-learning-app/
├── loigiaihay.com/
│   ├── grade6/unit-01/ ... unit-12/
│   ├── grade7/unit-01/ ... unit-12/
│   ├── grade8/unit-01/ ... unit-12/
│   ├── grade9/unit-01/ ... unit-12/
│   ├── grade10/unit-01/ ... unit-10/
│   ├── grade11/unit-01/ ... unit-10/
│   └── grade12/unit-01/ ... unit-10/
│
├── ground-truth/
│   ├── g6/g6_part_1.md ... g6_part_12.md
│   ├── g7/g7_part_1.md ... g7_part_12.md
│   ├── g8/g8_part_1.md ... g8_part_12.md
│   └── g9/g9_part_1.md ... g9_part_12.md (and more)
│
└── v2/data/voice-lectures/
    ├── g6/unit-01/ ... unit-12/
    ├── g7/unit-01/ ... unit-12/
    ├── g8/unit-01/ ... unit-12/
    └── g9/unit-01/ ... unit-12/
```

---

## Usage Example

To review Grade 7 Unit 5:
1. Read `/loigiaihay.com/grade7/unit-05/*.md` for source content
2. Read `/ground-truth/g7/g7_part_5.md` for vocabulary and answers
3. Compare with `/v2/data/voice-lectures/g7/unit-05/*.md`
4. Fix any discrepancies following the checklist above
