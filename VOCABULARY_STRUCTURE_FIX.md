# Fix for Vocabulary Not Showing

## The Problem
The vocabulary is being parsed correctly but not displayed because it needs to be in a subsection with type 'vocabulary'.

## Solution

Make sure your markdown file structure looks like this:

```markdown
# UNIT 1: LEISURE TIME

## GETTING STARTED

### 📚 Vocabulary - Từ vựng

(adj) - surprised - sə'praɪzd
(n) - knitting kit - 'nɪtɪŋ kɪt
(adj) - keen on - kiːn ɒn
```

The key requirements:
1. Use `###` (three hashes) for the vocabulary heading
2. Include either:
   - The 📚 emoji, OR
   - The word "Vocabulary" (case insensitive), OR  
   - The word "Từ vựng"

## Quick Test

Create this test file as `test-vocab.md` in your markdown-files folder:

```markdown
# Test Unit

## GETTING STARTED

### 📚 Vocabulary

- **happy** : (adj) vui vẻ /ˈhæpi/
- **sad** : (adj) buồn /sæd/
(n) - test word - test pronunciation
```

If this works but your file doesn't, check:
1. The heading level (must be ###)
2. No extra spaces before vocabulary lines
3. The section structure matches the above

## Debug Steps

1. Check browser console for these logs:
   - "VocabularySection render:"
   - "section.content:"
   - "vocabItems after filter:"

2. In backend console, look for:
   - "Subsection: 📚 Vocabulary - Từ vựng (X items)"
   - "Contains X vocabulary items"

The vocabulary IS being parsed - it just needs the right markdown structure!
