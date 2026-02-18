# Voice Lecture Review Guide (Using loigiaihay.com Source)

## File Locations

| Type | Path Pattern |
|------|--------------|
| Source (loigiaihay.com) | `loigiaihay.com/grade{N}/unit-{NN}/{section}.md` |
| Voice Lecture | `v2/data/voice-lectures/g{N}/unit-{NN}/{section}.md` |

**Sections:** `getting-started`, `a-closer-look-1`, `a-closer-look-2`, `communication`, `skills-1`, `skills-2`, `looking-back`

## Review Checklist

### 1. Dialogue Accuracy
- [ ] Check speaker names match source (e.g., "Mark and Trang" not just "Trang")
- [ ] Use `<dialogue>` tag with bilingual table format:
```markdown
<dialogue>
| English | Vietnamese |
|---------|------------|
| **Speaker:** English text | **Speaker:** Vietnamese text |
</dialogue>
```
- [ ] English text must match source exactly
- [ ] Vietnamese translation should be accurate

### 2. Exercise Answers
- [ ] Answers match source exactly (singular/plural forms matter)
- [ ] Example: "folk dances" not "folk dance" if source says plural
- [ ] Check all blanks filled correctly

### 3. Content Separation
- [ ] Each section file contains ONLY that section's content
- [ ] Getting Started should NOT include A Closer Look 1 content
- [ ] Check for `<!-- chunk: closer_look_1 -->` or similar misplaced content

### 4. Vocabulary
- [ ] All vocabulary from source is included
- [ ] Pronunciation (IPA) matches source
- [ ] Word types (n, v, adj) are correct

### 5. Quiz/Matching Answers
- [ ] Answer keys match source (1-e, 2-a, etc.)
- [ ] Explanations are accurate

## Common Issues & Fixes

| Issue | Example | Fix |
|-------|---------|-----|
| Wrong speaker | "Trang: Good afternoon" | "Mark and Trang: Good afternoon" |
| Missing bilingual format | Vietnamese only | Add `<dialogue>` table with both languages |
| Singular/plural mismatch | "folk dance" | "folk dances" (match source) |
| Content from other section | A Closer Look 1 in Getting Started | Remove and keep in separate file |
| Missing English dialogue | Only Vietnamese shown | Add English column in dialogue table |

## Quick Review Process

1. **Open both files side by side:**
   - Source: `loigiaihay.com/grade7/unit-09/getting-started.md`
   - Voice: `v2/data/voice-lectures/g7/unit-09/getting-started.md`

2. **Compare dialogue:**
   - Source has: `**Mark and Trang:** Good afternoon, Ms Hoa.`
   - Voice should have bilingual table with exact English

3. **Compare answers:**
   - Source: `1. folk dances`
   - Voice must match exactly

4. **Check section boundaries:**
   - If voice file has content beyond page 93 (for Getting Started), it's likely misplaced

## Example Fix Commands

```markdown
# Fix dialogue format
Replace Vietnamese-only dialogue with:
<dialogue>
| English | Vietnamese |
|---------|------------|
| **Mark and Trang:** Good afternoon, Ms Hoa. | **Mark va Trang:** Chao buoi chieu, co Hoa. |
</dialogue>

# Fix answer
Replace: **folk dance**
With: **folk dances**

# Remove misplaced content
Delete everything from `<!-- chunk: closer_look_1 -->` to end
Add proper ending chunk
```

## Section Page Numbers (G7)

| Section | Pages |
|---------|-------|
| Getting Started | 92-93 |
| A Closer Look 1 | 94 |
| A Closer Look 2 | 95 |
| Communication | 96 |
| Skills 1 | 97 |
| Skills 2 | 98 |
| Looking Back | 99 |

Content mentioning pages outside the section's range is likely misplaced.
