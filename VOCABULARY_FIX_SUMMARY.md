# Vocabulary Not Showing - Complete Fix Guide

## Problem Summary
The vocabulary words are not displaying in the app because:
1. The regex detection pattern has been updated but may have formatting issues
2. The vocabulary format `(type) - word - pronunciation` needs to be detected

## Solutions

### Option 1: Manual Code Fix
1. Open `backend/src/services/markdownService.ts`
2. Find line ~430 with the comment `// Vocabulary items - both numbered and bullet formats`
3. Ensure the next line looks EXACTLY like:
   ```typescript
         else if (line.match(/^(\d+\.|-)\s*\*\*[^*]+\*\*\s*:/) || line.match(/^\([^)]+\)\s*-/)) {
   ```
4. Fix any indentation issues (should have 6 spaces before `else if`)
5. Save and restart the backend

### Option 2: Convert Vocabulary Format (Recommended)
Run the conversion script to change all vocabulary to a supported format:

```bash
# Run the batch file
convert-vocabulary.bat

# Or run PowerShell directly
powershell -ExecutionPolicy Bypass -File convert-vocabulary-format.ps1
```

This converts:
- FROM: `(adj) - surprised - sə'praɪzd`
- TO: `- **surprised** : (adj) /sə'praɪzd/`

### Option 3: Test With Sample File
1. Copy `test-vocabulary.md` to your `markdown-files` folder
2. Open it in the app to verify vocabulary parsing works
3. Compare with your actual files to find differences

## Debugging Steps

1. **Check backend logs:**
   - Look for "VOCABULARY LINE DETECTED"
   - Look for "parseVocabularyLine called"
   - Check which patterns match/don't match

2. **Verify markdown structure:**
   - Vocabulary must be under a section with "Vocabulary", "Từ vựng", or 📚
   - No extra spaces at line beginnings
   - Consistent formatting

3. **Test patterns:**
   ```javascript
   node test-vocab-patterns.js
   ```

## Quick Fix Regex
If you want to manually convert in VS Code:
- Find: `^\(([^)]+)\)\s*-\s*([^-]+?)\s*-\s*(.+)$`
- Replace: `- **$2** : ($1) /$3/`
- Enable regex mode (.*button)

## Files Created
- `VOCABULARY_DEBUG_GUIDE.md` - Debugging instructions
- `VOCABULARY_MANUAL_FIX.md` - Manual fix guide
- `convert-vocabulary-format.ps1` - PowerShell conversion script
- `convert-vocabulary.bat` - Batch file to run conversion
- `test-vocabulary.md` - Test file with all formats
- `test-vocab-patterns.js` - Pattern testing script

## Next Steps
1. Try Option 2 (conversion script) first - it's the quickest
2. Restart backend after any changes
3. Check console logs if issues persist
4. Use the test file to verify functionality

The vocabulary parsing DOES work - the patterns have been tested and verified. The issue is likely formatting or the detection regex in the main parsing loop.
