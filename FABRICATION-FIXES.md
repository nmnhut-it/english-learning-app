# Fabrication Issues - Fix Guide

Generated: 2026-02-20

## Reference Sources

When fixing fabrication issues, use these sources in order of preference:

1. **loigiaihay.com** - `loigiaihay.com/grade{N}/unit-{NN}/{section}.md`
2. **markdown-files** - `markdown-files/g{N}/unit-{NN}/g{N}_u{NN}_{section}.md`
3. **ground-truth** - `ground-truth/g{N}/g{N}_part_{N}.md`

---

## Missing MP3 (~80 files)

Audio URLs from source files that are not included in voice lectures.

**See:** [MISSING-AUDIO-LINKS.md](MISSING-AUDIO-LINKS.md) for complete list with:
- Full audio URLs
- Target voice lecture paths
- Ready-to-insert HTML tags

**Status:** Use another Claude Code instance to insert audio tags

---

## Wrong Answers

All wrong answer issues have been fixed except one potential false positive.

| Grade | File | Issue | Status |
|-------|------|-------|--------|
| G6 | unit-09/looking-back | bai1_q2: "A" → "C" | ⚠️ FALSE POSITIVE (order difference) |
| G7 | unit-01/a-closer-look-2 | bai3_q4: "goes" → "go" | ✅ FIXED |
| G8 | unit-01/a-closer-look-1 | bai1_q2, bai1_q4 | ✅ FIXED |
| G8 | unit-01/a-closer-look-2 | bai2_q4, bai2_q5 | ✅ FIXED |
| G8 | unit-02/a-closer-look-1 | bai2_q1 | ✅ FIXED |
| G8 | unit-02/communication | bai3_q3, bai3_q5 | ✅ FIXED |
| G8 | unit-03/skills-2 | bai2_q1 | ✅ FIXED |
| G8 | unit-03/looking-back | bai2_q6 | ✅ FIXED |
| G8 | unit-04/getting-started | bai2_q2 | ✅ FIXED |
| G8 | unit-05/a-closer-look-2 | bai2_q4, bai4_q5 | ✅ FIXED |
| G9 | unit-02/a-closer-look-1 | bai2_q1-q3 | ✅ FIXED |
| G9 | unit-03/getting-started | bai2_q3, bai2_q4 | ✅ FIXED |
| G9 | unit-03/looking-back | bai2_q5 | ✅ FIXED |
| G9 | unit-04/getting-started | bai4_q3 | ✅ FIXED |
| G9 | unit-05/a-closer-look-1 | bai2_q4, bai3_q1 | ✅ FIXED |
| G9 | unit-06/skills-1 | bai2_q3 | ✅ FIXED |

---

## Fabricated Content

### Verified FALSE POSITIVES (No fix needed)

| Grade | File | Reason |
|-------|------|--------|
| G6 | unit-10/communication | ✅ Matches source |
| G6 | unit-12/skills-2 | ✅ Matches source |
| G7 | unit-10/communication | ✅ Matches source |
| G7 | unit-12/skills-1 | ✅ Matches source |

### REAL Fabrications (Need rewrite)

| Grade | File | What's Fabricated | Reference |
|-------|------|-------------------|-----------|
| G6 | unit-11/skills-1 | "Making Our School Greener" interview | Check textbook reading |
| G7 | unit-09/communication | Festival symbols content | loigiaihay.com/grade7/unit-09/communication.md |
| G8 | unit-02/communication | Hanoi visitor content | loigiaihay.com/grade8/unit-02/communication.md |
| G8 | unit-03/getting-started | Track 13 audio reference issue | Check textbook |
| G8 | unit-03/communication | "Social media popular among teens" | loigiaihay.com/grade8/unit-03/communication.md |
| G8 | unit-04/getting-started | Track 20 audio reference issue | Check textbook |
| G8 | unit-04/communication | Track 23 audio reference issue | Check textbook |
| G8 | unit-05/communication | Shishi-mai/lion dance content | loigiaihay.com/grade8/unit-05/communication.md |
| G9 | unit-01/communication | "Binh from HCMC" content | loigiaihay.com/grade9/unit-01/communication.md |

---

## STRICT Unmatched (~150 items)

Most are **false positives** from:
- Different question phrasing (same meaning)
- Exercise instructions not in source
- Partial sentence matching issues

**Action:** Review individually - most are NOT fabrications.

---

## Files Already Fixed

### Content Rewrites
- [x] G8 unit-07/skills-1 - Fixed Bài 3 questions 3-5, added option C
- [x] G9 unit-12/getting-started - Complete rewrite (was fabricated Mi+Advisor dialogue)

### Wrong Answers Fixed (by parallel agent)
- [x] G7 unit-01/a-closer-look-2
- [x] G8 unit-01/a-closer-look-1, a-closer-look-2
- [x] G8 unit-02/a-closer-look-1, communication
- [x] G8 unit-03/skills-2, looking-back
- [x] G8 unit-04/getting-started
- [x] G8 unit-05/a-closer-look-2
- [x] G9 unit-02/a-closer-look-1
- [x] G9 unit-03/getting-started, looking-back
- [x] G9 unit-04/getting-started
- [x] G9 unit-05/a-closer-look-1
- [x] G9 unit-06/skills-1

---

## How to Fix

### Wrong Answers
1. Read source file from loigiaihay.com or markdown-files
2. Compare answer keys
3. Update `<answer>` block in voice lecture
4. Run `node check-fabrication.js --grade {N}` to verify

### Fabricated Content
1. Read source file for correct dialogue/reading
2. Replace fabricated content with textbook content
3. Update questions, answers, and explanations
4. Keep voice lecture structure (chunks, teacher_script tags)
5. Verify with fabrication check

---

## Verification Commands

```bash
node check-fabrication.js --grade 6
node check-fabrication.js --grade 7
node check-fabrication.js --grade 8
node check-fabrication.js --grade 9
node generate-checklist.js
```
