# Debugging Guide for Vocabulary Not Showing

## Summary
The regex patterns are working correctly. The issue is likely one of:

1. **Vocabulary lines are being captured as regular content** instead of being detected as vocabulary
2. **The vocabulary subsection isn't properly created** before the vocabulary lines are processed
3. **Whitespace or special characters** in the markdown file are interfering with pattern matching

## How to Debug

### 1. Check the backend logs after restarting:
```bash
cd backend
npm run dev
```

Look for these log messages:
- `=== STARTING CONTENT PARSING ===`
- `[Line X] Processing in vocabulary section:`
- `=== VOCABULARY LINE DETECTED ===`
- `--- parseVocabularyLine called ---`

### 2. Check your markdown file format:

Make sure vocabulary lines have NO extra spaces at the beginning:
```markdown
### 📚 Vocabulary - Từ vựng

(adj) - surprised - sə'praɪzd
(n) - knitting kit - 'nɪtɪŋ kɪt
```

NOT:
```markdown
### 📚 Vocabulary - Từ vựng

  (adj) - surprised - sə'praɪzd  
  (n) - knitting kit - 'nɪtɪŋ kɪt
```

### 3. Temporary workaround:
Convert your vocabulary to a supported format:

```markdown
- **surprised** : (adj) /sə'praɪzd/
- **knitting kit** : (n) /'nɪtɪŋ kɪt/
- **keen on** : (adj) /kiːn ɒn/
```

### 4. Manual fix for the detection regex:

In `backend/src/services/markdownService.ts`, find the line (around line 429):
```typescript
else if (line.match(/^(\d+\.|-)\s*\*\*[^*]+\*\*\s*:/) || line.match(/^\([^)]+\)\s*-/)) {
```

Make sure it looks exactly like this (no extra characters or spaces).

### 5. Check if vocabulary is inside the right section:

The vocabulary needs to be under a section with:
- Title containing "Vocabulary" or "Từ vựng"
- Or title containing the 📚 emoji

Example structure:
```markdown
## GETTING STARTED

### 📚 Vocabulary - Từ vựng

(adj) - surprised - sə'praɪzd
```

## Test Results

The patterns successfully match:
- ✅ `(adj) - surprised - sə'praɪzd` → New format
- ✅ `1. **gate** : (n) cổng /ɡeɪt/` → Numbered format
- ✅ `- **hobby** : (n) sở thích /ˈhɒbi/` → Bullet format

All regex patterns are working correctly!
