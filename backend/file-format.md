# File Format Definitions

This document defines the markdown structure for different types of data that can be formatted and saved.

## 1. General Vocabulary Format (G7 Style)

```markdown
**UNIT [NUMBER]: [UNIT NAME]**

**[SECTION NAME]**

1. word : (type) meaning /pronunciation/
2. word : (type) meaning /pronunciation/
3. word : (type) meaning /pronunciation/

[Vietnamese translations and dialogue if present]

**Bài [number] trang [page]**
[Exercise content and answers]

| Category 1 | Category 2 | Category 3 |
| :---- | :---- | :---- |
| Items | Items | Items |
```

## 2. Reading Passage Format

```markdown
# [Title]

**Type**: reading_passage
**Source**: [website_name]
**URL**: [original_url]
**Date**: [ISO_DATE]

## Passage

[Original text content]

## Vocabulary Extracted

**[word]**: meaning

## Questions (if available)

1. [Question]
   - A) [Option A]
   - B) [Option B]
   - C) [Option C]
   - D) [Option D]
   - **Answer**: [Correct Answer]
```

## 3. Grammar Rules Format

```markdown
# [Grammar Topic]

**Type**: grammar
**Source**: [website_name]
**URL**: [original_url]
**Date**: [ISO_DATE]

## Rule

[Grammar rule explanation]

## Examples

1. [Example sentence]
2. [Example sentence]

## Exceptions

- [Exception 1]
- [Exception 2]
```

## 4. Dialogue/Conversation Format

```markdown
# [Dialogue Title]

**Type**: dialogue
**Source**: [website_name]
**URL**: [original_url]
**Date**: [ISO_DATE]

## Context
[Situation/Context]

## Dialogue

**A**: [Speaker A's line]
**B**: [Speaker B's line]

## Key Phrases

- **[phrase]**: meaning
```

## 5. Idioms/Phrases Format

```markdown
# Idioms & Phrases

**Type**: idioms
**Source**: [website_name]
**URL**: [original_url]
**Date**: [ISO_DATE]

## [Category/Topic]

**[idiom/phrase]**: meaning
- Example: [example sentence]
```

## 6. Exercise/Practice Format

```markdown
# [Exercise Title]

**Type**: exercise
**Source**: [website_name]
**URL**: [original_url]
**Date**: [ISO_DATE]
**Subject**: [Subject]
**Level**: [Grade/Level]

## Instructions
[Exercise instructions]

## Questions

### Question 1
[Question text]
- A) [Option A]
- B) [Option B]
- C) [Option C]
- D) [Option D]

**Answer**: [Correct option]
**Explanation**: [Optional explanation]

### Question 2
[Fill-in-the-blank or open-ended question]

**Answer**: [Answer text]
```

## 7. Study Unit/Lesson Format

```markdown
# [Unit/Lesson Title]

**Type**: study_unit
**Source**: [website_name]
**URL**: [original_url]
**Date**: [ISO_DATE]
**Grade**: [Grade level]
**Unit**: [Unit number]

## Learning Objectives
- [Objective 1]
- [Objective 2]

## Content Sections

### [Section Name]
[Section content]

### Vocabulary
[Vocabulary items]

### Grammar Points
[Grammar explanations]

### Exercises
[Practice questions]
```

## 8. Mixed Content Format

```markdown
# [Page Title]

**Type**: mixed_content
**Source**: [website_name]
**URL**: [original_url]
**Date**: [ISO_DATE]

## Navigation/Menu
[Navigation structure if present]

## Main Content
[Mixed content elements]

## Related Items
[Related links or content]
```

## Type Detection Rules

The system will automatically detect the data type based on these patterns:
- Contains words with pronunciations → vocabulary
- Contains long text paragraphs → reading_passage
- Contains grammar explanations → grammar
- Contains speaker labels (A:, B:) → dialogue
- Contains idioms/phrases without pronunciations → idioms
- Contains numbered questions with options → exercise
- Contains unit/lesson structure → study_unit
- Contains mixed elements → mixed_content

## File Naming Convention

Files will be saved as:
- `/markdown-files/formatted-data/[date]/[type]-[timestamp].md`

Example:
- `/markdown-files/formatted-data/2024-01-15/vocabulary-1705315200000.md`

## Dynamic Type Addition

When new patterns are detected that don't match existing types, the system will:
1. Create a new type definition based on the detected structure
2. Append it to this file
3. Use a generic template that can be refined later

## Metadata Format

All files should start with metadata in this format:
```
**Type**: [type_name]
**Source**: [source_name]
**URL**: [source_url]
**Date**: [ISO_date]
[Additional metadata fields as needed]
```