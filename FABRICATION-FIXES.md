# Fabrication Issues - Fix Guide

Generated: 2026-02-19

## Reference Sources

When fixing fabrication issues, use these sources in order of preference:

1. **loigiaihay.com** - `loigiaihay.com/grade{N}/unit-{NN}/{section}.md`
2. **markdown-files** - `markdown-files/g{N}/unit-{NN}/g{N}_u{NN}_{section}.md`
3. **ground-truth** - `ground-truth/g{N}/g{N}_part_{N}.md`

---

## Wrong Answers (Quick Fixes)

These require verifying against source and updating the `<answer>` block.

### Grade 7

| File | Issue | How to Fix |
|------|-------|------------|
| unit-01/a-closer-look-2 | bai3_q4: "goes" → "go" | Check source for correct verb form |

### Grade 8

| File | Issue | How to Fix |
|------|-------|------------|
| unit-01/a-closer-look-1 | bai1_q2: "b" → "c", bai1_q4: "c" → "a" | Verify matching answers against source |
| unit-01/a-closer-look-2 | bai2_q4: "A" → "B", bai2_q5: "C" → "A" | Check grammar exercise answers |
| unit-02/a-closer-look-1 | bai2_q1: "b" → "c" | Verify vocabulary matching |
| unit-02/communication | bai3_q3: "Hollum" → "H", bai3_q5: "Hollum" → "H" | Check reading comprehension answers |
| unit-03/skills-2 | bai2_q1: "A" → "C" | Verify listening answers |
| unit-03/looking-back | bai2_q6: "bullying" → "bullies" | Check word form exercise |
| unit-04/getting-started | bai2_q2: "B" → "C" | Verify dialogue comprehension |
| unit-05/a-closer-look-2 | bai2_q4: "a" → "C", bai4_q5: "an" → "the" | Check article usage exercise |

### Grade 9

| File | Issue | How to Fix |
|------|-------|------------|
| unit-02/a-closer-look-1 | bai2_q1: "B" → "A", bai2_q2: "A" → "C", more | Verify vocabulary matching |
| unit-03/getting-started | bai2_q3: "T" → "F", bai2_q4: "F" → "T" | Check T/F answers against dialogue |
| unit-03/looking-back | bai2_q5: "B" → "D" | Verify grammar exercise |
| unit-04/getting-started | bai4_q3: "e" → "monument" | Check matching exercise format |
| unit-05/a-closer-look-1 | bai2_q4: "e" → "embarrassing", bai3_q1: wrong | Verify vocabulary/grammar |
| unit-06/skills-1 | bai2_q3: "C" → "B" | Check reading comprehension |

---

## Fabricated Content (Require Rewrite)

These files have fabricated dialogue, reading passages, or exercises that don't match the textbook. They require comparing against source and rewriting the content.

### Grade 6

| File | What's Fabricated | Reference |
|------|-------------------|-----------|
| unit-10/communication | Fabricated example content | loigiaihay.com/grade6/unit-10/communication.md |
| unit-11/skills-1 | Fabricated interview "Making Our School Greener" | Check actual textbook reading passage |
| unit-12/skills-2 | Fabricated dialogue with "Dr Adams" | Check actual listening/reading content |

### Grade 7

| File | What's Fabricated | Reference |
|------|-------------------|-----------|
| unit-09/communication | Fabricated content about festival symbols | loigiaihay.com/grade7/unit-09/communication.md |
| unit-10/communication | Fabricated example content | Check textbook exercises |
| unit-12/skills-1 | Fabricated content about activities | Check actual reading passage |

### Grade 8

| File | What's Fabricated | Reference |
|------|-------------------|-----------|
| unit-02/communication | Fabricated content about Hanoi | loigiaihay.com/grade8/unit-02/communication.md |
| unit-03/communication | Fabricated content with "Ann" | Check textbook dialogue |
| unit-05/communication | Fabricated content "Mua Lan and Shishi-mai" | Check actual comparison content |
| unit-07/communication | Fabricated Earth Day content | loigiaihay.com/grade8/unit-07/communication.md |

### Grade 9

| File | What's Fabricated | Reference |
|------|-------------------|-----------|
| unit-01/communication | Fabricated content about city centre | loigiaihay.com/grade9/unit-01/communication.md |

---

## How to Fix Fabricated Content

### Step 1: Read the Source
```bash
# Find source files
ls loigiaihay.com/grade{N}/unit-{NN}/
ls markdown-files/g{N}/unit-{NN}/
```

### Step 2: Compare Content
- Check dialogue matches textbook exactly
- Verify all exercises (Bài 1, 2, 3...) match source
- Confirm answer keys are correct

### Step 3: Rewrite Voice Lecture
1. Keep the voice lecture structure (chunks, teacher_script tags)
2. Replace fabricated dialogue/reading with textbook content
3. Update questions to match textbook
4. Update answers to match source answer key
5. Update explanations to reference correct content

### Step 4: Verify
```bash
node check-fabrication.js --grade {N}
```

---

## Files Already Fixed

- [x] G8 unit-07/skills-1 - Fixed Bài 3 questions 3-5, added option C
- [x] G9 unit-12/getting-started - Complete rewrite (was fabricated Mi+Advisor dialogue)

---

## Priority Order

1. **HIGH**: Wrong answers - Students get wrong info
2. **HIGH**: Fabricated dialogues/readings - Content doesn't match textbook
3. **MEDIUM**: Fabricated examples - May confuse students
4. **LOW**: Missing audio references - Infrastructure issue

---

## Verification Commands

```bash
# Run fabrication check for specific grade
node check-fabrication.js --grade 6
node check-fabrication.js --grade 7
node check-fabrication.js --grade 8
node check-fabrication.js --grade 9

# Generate updated checklist
node generate-checklist.js
```
