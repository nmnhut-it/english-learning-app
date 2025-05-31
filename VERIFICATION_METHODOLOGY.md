# Content Verification Methodology Guide

## Overview
This document outlines the systematic approach for verifying and improving English learning app content to ensure accuracy, authenticity, and alignment with official educational sources.

## Objectives
1. Verify all exercises are authentic and not "cooked up"
2. Ensure content matches official Global Success textbook materials
3. Integrate ground truth vocabulary and answers from real teaching experience
4. Maintain consistency across all units and grades

## Directory Structure
```
english-learning-app/
├── markdown-files/
│   ├── global-success-7/
│   ├── global-success-8/
│   └── global-success-9/
├── ground-truth/
│   ├── g7/
│   ├── g8/
│   └── g9/
└── verifier-progress.md
```

## Step-by-Step Verification Process

### Step 1: Initial Assessment
1. Open the unit file from `markdown-files/global-success-X/unit-XX.md`
2. Open the corresponding ground truth file from `ground-truth/gX/gX_part_X.md`
3. Create a side-by-side comparison

### Step 2: Online Source Verification
1. **Primary Sources to Check:**
   - VietJack: Search for "VietJack tiếng anh [grade] global success unit [number]"
   - LoiGiaiHay: Search for "loigiaihay tiếng anh [grade] unit [number] global success"

2. **What to Verify:**
   - Exercise questions match exactly
   - Answer keys are correct
   - No fabricated or modified content
   - Vocabulary lists are complete

### Step 3: Content Comparison Checklist

#### Vocabulary Section
- [ ] All vocabulary from ground truth is included
- [ ] Pronunciations (IPA) are present and accurate
- [ ] Vietnamese translations are correct
- [ ] Word types (n, v, adj, etc.) are specified
- [ ] Additional context words from ground truth are added

#### Grammar Section
- [ ] Grammar rules match official curriculum
- [ ] Examples are authentic
- [ ] Special notes from ground truth are incorporated
- [ ] Verb patterns and exceptions are detailed

#### Exercises Section
- [ ] Questions match official sources exactly
- [ ] Answer keys are verified
- [ ] Instructions are clear and accurate
- [ ] No "cooked up" exercises exist

#### Pronunciation Section
- [ ] Sound patterns are explained clearly
- [ ] Examples are appropriate
- [ ] Practice exercises are authentic

### Step 4: Integration Process

1. **Create a verified copy:**
   ```
   unit-XX-verified.md
   ```

2. **Merge content systematically:**
   - Start with the original markdown file structure
   - Add missing vocabulary from ground truth
   - Enhance grammar explanations with ground truth notes
   - Verify each exercise against online sources
   - Add any missing exercises or content

3. **Format consistently:**
   - Use emoji headers (📚, 📖, ✍️, 💬, 🗣️)
   - Maintain bilingual format (English / Vietnamese)
   - Keep pronunciation in IPA format
   - Use tables for organized content

### Step 5: Quality Assurance

1. **Cross-reference check:**
   - Every exercise appears in at least one official source
   - Vocabulary matches syllabus requirements
   - Grammar points align with curriculum

2. **Completeness check:**
   - All sections present (Getting Started, Closer Look 1&2, Communication, Skills 1&2, Looking Back)
   - All vocabulary from ground truth incorporated
   - All answer keys provided

3. **Accuracy check:**
   - No spelling errors
   - Correct Vietnamese translations
   - Accurate IPA pronunciations

### Step 6: Documentation

1. **Update verifier-progress.md:**
   - Mark unit as completed
   - List specific changes made
   - Note any issues found
   - Record verification sources used

2. **Create change log entry:**
   ```markdown
   ### Unit X Verification Summary
   - Compared with ground truth
   - Verified against [sources]
   - Added [X] vocabulary items
   - Enhanced [sections]
   - No fabricated content found / Found and corrected [issues]
   ```

### Step 7: File Management

1. **Replace original with verified version:**
   ```bash
   move unit-XX-verified.md → unit-XX.md
   ```

2. **Backup original if needed**

## Common Issues and Solutions

### Issue 1: Missing Vocabulary
**Solution:** Add all vocabulary from ground truth, maintaining alphabetical or thematic order

### Issue 2: Incomplete Grammar Explanations
**Solution:** Enhance with detailed rules and exceptions from ground truth

### Issue 3: Exercise Discrepancies
**Solution:** Always defer to official sources (VietJack/LoiGiaiHay)

### Issue 4: Answer Key Conflicts
**Solution:** Verify with multiple sources, use most common/official answer

## Search Strategies

### Effective Search Queries:
1. `"tiếng anh 7 global success unit 1" site:vietjack.com`
2. `"getting started trang 8 9" global success grade 7`
3. `"bài tập tiếng anh 7 unit 1 hobbies" đáp án`

### Red Flags for Fabricated Content:
- Exercises not found in any official source
- Unusual vocabulary not in curriculum
- Grammar points beyond grade level
- Inconsistent answer patterns

## Tools and Resources

### Required Tools:
- Text editor with side-by-side view
- Web browser for source verification
- File comparison tool (optional)

### Trusted Sources:
1. VietJack.com - Official textbook solutions
2. LoiGiaiHay.com - Verified exercise answers
3. Official Global Success teacher guides
4. Ground truth files from experienced teachers

## Best Practices

1. **Always verify before changing** - Don't assume content is wrong
2. **Preserve authentic content** - Never modify official exercises
3. **Document everything** - Keep detailed logs of changes
4. **Work systematically** - Complete one unit fully before moving to next
5. **Double-check** - Verify changes against multiple sources

## Progress Tracking Template

```markdown
## Grade [X] Progress

### Units to Verify
- [ ] Unit 1 - [Status]
- [ ] Unit 2 - [Status]
...

### Verification Log
Date: [Date]
Unit: [Number]
Changes Made:
1. Added [X] vocabulary items
2. Enhanced [section]
3. Verified all exercises authentic
Sources Used: [List sources]
```

## Quality Metrics

### Verification Complete When:
- ✅ All vocabulary from ground truth integrated
- ✅ All exercises verified against official sources
- ✅ Grammar explanations comprehensive
- ✅ No fabricated content remains
- ✅ Progress log updated

## Troubleshooting

### Can't Find Exercise in Sources:
1. Try alternative search terms
2. Check similar units for patterns
3. Consult additional sources
4. Flag for review if still uncertain

### Conflicting Information:
1. Prioritize official textbook
2. Check most recent edition
3. Note discrepancy in progress log
4. Use most educationally sound option

## Conclusion

This methodology ensures systematic, thorough verification of educational content. By following these steps, any team member can continue the verification work with confidence that the content will be accurate, authentic, and valuable for students.

Remember: The goal is not to create new content, but to verify and enhance existing content with real teaching experience while maintaining strict adherence to official curriculum standards.