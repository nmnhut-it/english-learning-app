# Manual Fix Instructions for Vocabulary Detection

## The Issue
The vocabulary lines are not being detected because of a formatting issue in the code.

## How to Fix

1. Open `backend/src/services/markdownService.ts`

2. Search for this text (around line 430):
   ```
   // Vocabulary items - both numbered and bullet formats
   ```

3. The line right after should look EXACTLY like this:
   ```typescript
         else if (line.match(/^(\d+\.|-)\s*\*\*[^*]+\*\*\s*:/) || line.match(/^\([^)]+\)\s*-/)) {
   ```

4. Make sure:
   - There are exactly 6 spaces before `else if`
   - The regex has `(\d+\.|-)\s*` not `(\d+\.|-\s+`
   - There's a space after `{` and before the closing `}`

5. The full vocabulary detection block should look like:
   ```typescript
         // Vocabulary items - both numbered and bullet formats
         else if (line.match(/^(\d+\.|-)\s*\*\*[^*]+\*\*\s*:/) || line.match(/^\([^)]+\)\s*-/)) {
           flushContent();
           const vocab = this.parseVocabularyLine(line);
           console.log('Parsed vocabulary:', vocab);
           if (vocab) {
             const target = currentSubsection || currentSection;
             if (target) {
               if (!target.content) target.content = [];
               target.content.push(vocab);
             }
           }
         }
   ```

## After Fixing

1. Save the file
2. Restart the backend server:
   ```bash
   cd backend
   npm run dev
   ```
3. Refresh the app
4. Check the console logs for vocabulary detection messages

## Alternative Quick Fix

If the regex is too complex, temporarily replace your vocabulary format in the markdown files:

From:
```
(adj) - surprised - sə'praɪzd
```

To:
```
- **surprised** : (adj) /sə'praɪzd/
```

This format is already supported and will work immediately.
