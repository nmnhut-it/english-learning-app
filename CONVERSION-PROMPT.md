# Voice Lecture Conversion Prompts

Use these prompts when converting source files to voice lectures OR verifying existing conversions.

---

## PROMPT 1: Conversion (Source → Voice Lecture)

```
Convert this source file to voice lecture format following STRICT accuracy rules.

**Source file:** loigiaihay.com/grade{G}/unit-{UU}/{section}.md
**Output file:** v2/data/voice-lectures/g{G}/unit-{UU}/{section}.md
**Schema reference:** CLAUDE.md in project root

## CRITICAL ANTI-FABRICATION RULES

1. **COPY exercises VERBATIM** - Every question, every option (A/B/C), every sentence must be copied exactly from source. Do NOT rephrase.

2. **COPY answers EXACTLY** - Use the source's "Lời giải chi tiết" section. Include the exact quote that proves each answer.

3. **PRESERVE character names** - Use ONLY names from the source dialogue. Never invent names like "Mi", "Tom", "Amy".

4. **MATCH exercise format** - If source says "match", use matching. If source says "T/F", use true_false. Never substitute formats.

5. **COUNT exercises** - Source has Bài 1-N, output must have Bài 1-N. Do NOT skip any exercise.

6. **NO source = NO file** - If source file doesn't exist, do NOT create voice lecture for that section.

7. **COPY vocabulary from source** - Only include words listed in source's vocabulary section. Do NOT add plausible-sounding extras.

8. **COPY audio URLs exactly** - URLs like img.loigiaihay.com must be preserved exactly.

## OUTPUT STRUCTURE

<!-- chunk: intro -->
<teacher_script pause="0">
Ok lớp {G}, Unit {U} nha. Mở sách trang {page} đi. [Topic intro in Southern Vietnamese style]
</teacher_script>

<!-- chunk: vocabulary -->
<vocabulary>
[COPY from source vocabulary section - format: N. **word** : (type) meaning /IPA/]
</vocabulary>

<!-- chunk: dialogue (if exists) -->
<dialogue>
| English | Vietnamese |
|---------|------------|
[COPY each line from source dialogue - add Vietnamese translation]
</dialogue>

<!-- chunk: exercise-N -->
### Bài {N} trang {page} - {Type}

<task>
**Đề:** [COPY English instruction VERBATIM from source]
**Dịch đề:** [Vietnamese translation]
</task>

<questions type="{type}">
[COPY questions EXACTLY from source with Vietnamese translations]
</questions>

<teacher_script pause="{time}">
[Instruction]. {time/60} phút nha.
</teacher_script>

<answer>
**Đáp án:** [COPY from source "Lời giải chi tiết"]
</answer>

<explanation>
[COPY explanations from source - cite exact quotes: "Trong bài có câu: ..."]
</explanation>

## SECTION-SPECIFIC PATTERNS

**getting-started:** intro → vocabulary → dialogue → exercises 1-5 → end
**a-closer-look-1:** intro → vocabulary → exercises → pronunciation theory → pronunciation practice → end
**a-closer-look-2:** intro → grammar explanation → exercises → end
**communication:** intro → everyday english dialogue → exercises → end
**skills-1:** intro → vocabulary → reading passage → comprehension exercises → speaking → end
**skills-2:** intro → tapescript → listening exercises → writing (action="photo") → end
**looking-back:** intro → vocabulary review exercises → grammar review exercises → end

## TEACHER SCRIPT STYLE (Southern Vietnamese)

- Use: nha, hen, đi, thôi, nè, á, nghen, luôn
- Casual, friendly tone
- Example: "Ok đáp án nè. Câu 1 chọn A vì trong bài có câu '...' nha."

## VERIFICATION CHECKLIST (before submitting)

□ All exercise numbers match source (Bài 1, 2, 3... same count)
□ All character names match source exactly
□ All questions copied verbatim (not paraphrased)
□ All answer options (A/B/C) match source exactly
□ All answers cite specific quotes from dialogue/reading
□ No invented vocabulary, dialogues, or exercises
□ Audio URLs preserved from source
```

---

## PROMPT 2: Verification (Check Existing Files)

```
Verify this voice lecture file against its source for fabrication.

**Source file:** loigiaihay.com/grade{G}/unit-{UU}/{section}.md
**Voice lecture:** v2/data/voice-lectures/g{G}/unit-{UU}/{section}.md

## CHECK EACH ITEM:

### 1. Character Names
- List all character names in SOURCE dialogue
- List all character names in VOICE LECTURE dialogue
- VERDICT: MATCH or MISMATCH (list wrong names)

### 2. Exercise Count
- Count exercises in SOURCE (Bài 1, 2, 3...)
- Count exercises in VOICE LECTURE
- VERDICT: MATCH or MISSING (list missing exercise numbers)

### 3. Exercise Format
For each exercise, compare:
- SOURCE format (matching/fill_blanks/T-F/MCQ/etc)
- VOICE LECTURE format
- VERDICT per exercise: MATCH or WRONG FORMAT

### 4. Questions & Options
For each exercise with questions:
- Compare question text word-for-word
- Compare options (A/B/C) word-for-word
- VERDICT: MATCH or FABRICATED (quote the differences)

### 5. Answers
For each exercise:
- SOURCE answer from "Lời giải chi tiết"
- VOICE LECTURE answer
- VERDICT: MATCH or WRONG

### 6. Vocabulary (if applicable)
- List vocabulary in SOURCE
- List vocabulary in VOICE LECTURE
- VERDICT: MATCH or EXTRA/MISSING items

### 7. Dialogue/Reading Text (if applicable)
- Compare line by line
- VERDICT: MATCH or DIFFERENT

## FINAL REPORT

| Check | Status |
|-------|--------|
| Character names | ? |
| Exercise count | ? |
| Exercise formats | ? |
| Questions/options | ? |
| Answers | ? |
| Vocabulary | ? |
| Dialogue/reading | ? |

**Overall:** CLEAN / ISSUES FOUND

**Issues to fix:**
1. [list each issue with file location]
```

---

## Quick Reference: What to Copy vs What to Write

| Element | Action |
|---------|--------|
| Dialogue lines | COPY exactly |
| Exercise instructions | COPY exactly |
| Questions & options | COPY exactly |
| Answers | COPY from "Lời giải chi tiết" |
| Vocabulary words | COPY from source vocab section |
| Audio URLs | COPY exactly |
| Teacher scripts | WRITE (Southern Vietnamese style) |
| Chunk structure | WRITE (follow schema) |
| Vietnamese translations | WRITE (translate accurately) |

---

## File Locations

- **Source files:** `loigiaihay.com/grade{G}/unit-{UU}/*.md`
- **Output files:** `v2/data/voice-lectures/g{G}/unit-{UU}/*.md`
- **Schema reference:** `CLAUDE.md` (project root)
- **Clean example:** `v2/data/voice-lectures/g7/unit-10/` (verified accurate)
