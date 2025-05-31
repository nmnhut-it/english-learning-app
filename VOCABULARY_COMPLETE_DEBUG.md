# Complete Vocabulary Debugging Guide

## How Vocabulary Should Work

1. **Markdown Structure** (required):
   ```markdown
   ## GETTING STARTED
   ### 📚 Vocabulary - Từ vựng
   (adj) - surprised - sə'praɪzd
   ```

2. **Backend Processing**:
   - Detects section "GETTING STARTED" → type: 'getting-started'
   - Detects subsection "📚 Vocabulary" → type: 'vocabulary'
   - Parses vocabulary lines into the subsection's content array

3. **Frontend Display**:
   - `GettingStarted` component finds subsection with type='vocabulary'
   - Passes that subsection to `VocabularySection` component
   - `VocabularySection` displays the vocabulary items

## What to Check

### 1. Backend Console (when loading file):
Look for these messages:
```
=== STARTING CONTENT PARSING ===
Unit: UNIT 1: LEISURE TIME
  Section: GETTING STARTED
    Subsection: 📚 Vocabulary - Từ vựng (3 items)
      - Contains 3 vocabulary items
```

### 2. Browser Console:
Look for these messages:
```
=== GettingStarted Component ===
Subsections: [...]
  Subsection 0: type='vocabulary', title='📚 Vocabulary - Từ vựng', content items=3
Found vocabSubsection: {...}

VocabularySection render:
  vocabItems length: 3
```

### 3. Common Issues:

**Issue 1: No vocabulary subsection found**
- Check: Is the vocabulary heading using `###` (3 hashes)?
- Check: Does it contain 📚, "Vocabulary", or "Từ vựng"?

**Issue 2: Vocabulary subsection exists but no items**
- Check: Are vocabulary lines indented with spaces?
- Check: Are there blank lines between heading and vocabulary?

**Issue 3: Items exist but words are blank**
- This is the parsing issue we've been fixing
- The regex patterns are correct now

## Test File
Save this as `vocabulary-test.md`:

```markdown
# VOCABULARY TEST UNIT

## GETTING STARTED - BẮT ĐẦU

### 📚 Vocabulary - Từ vựng

- **happy** : (adj) vui vẻ /ˈhæpi/
- **book** : (n) sách /bʊk/
(adj) - excited - ɪkˈsaɪtɪd
1. **house** : (n) nhà /haʊs/

### 💬 Content

This is some content.

### ✍️ Exercises

**Exercise 1:** Do something
```

Load this file and check all console logs to see where the issue occurs.

## Quick Fixes

1. **Convert format** (if structure is correct but parsing fails):
   ```bash
   convert-vocabulary.bat
   ```

2. **Fix structure** (if subsection is missing):
   - Ensure `###` for vocabulary heading
   - Include 📚 emoji or "Vocabulary" word
   - No extra indentation on vocabulary lines

3. **Manual check**:
   - Open browser DevTools (F12)
   - Go to Network tab
   - Reload the page
   - Find the API call to `/api/markdown/content`
   - Check the Response to see the actual JSON structure

The vocabulary feature DOES work - we just need to ensure the markdown structure matches what the components expect!
