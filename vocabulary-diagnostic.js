// Diagnostic script to test vocabulary parsing end-to-end

console.log("=== VOCABULARY DIAGNOSTIC TEST ===\n");

// 1. Test regex patterns
console.log("1. REGEX PATTERN TESTS\n");

const testLine = "(adj) - surprised - sə'praɪzd";
console.log(`Test line: "${testLine}"`);

// Detection patterns
const pattern1 = /^(\d+\.|-)\s*\*\*[^*]+\*\*\s*:/;
const pattern2 = /^\([^)]+\)\s*-/;

console.log(`Pattern 1 matches: ${pattern1.test(testLine)}`);
console.log(`Pattern 2 matches: ${pattern2.test(testLine)}`);

// Parse pattern
const parsePattern = /^\(([^)]+)\)\s*-\s*([^-]+)\s*-\s*(.+)$/;
const match = testLine.match(parsePattern);

if (match) {
  console.log("\nParsed successfully:");
  console.log(`  Part of speech: "${match[1]}"`);
  console.log(`  Word: "${match[2].trim()}"`);
  console.log(`  Pronunciation: "${match[3].trim()}"`);
}

// 2. Test what the backend would create
console.log("\n2. BACKEND VOCABULARY OBJECT\n");

const vocabObject = {
  type: 'vocabulary',
  partOfSpeech: match[1].trim(),
  word: match[2].trim(),
  meaning: '',
  pronunciation: match[3].trim()
};

console.log(JSON.stringify(vocabObject, null, 2));

// 3. Test what the frontend would see
console.log("\n3. FRONTEND PROCESSING\n");

const item = vocabObject;
console.log(`item.word: "${item.word}"`);
console.log(`item.english: "${item.english}"`);
console.log(`item.meaning: "${item.meaning}"`);
console.log(`item.vietnamese: "${item.vietnamese}"`);

const displayWord = item.english || item.word || '';
const displayMeaning = item.vietnamese || item.meaning || '';

console.log(`\nFinal display word: "${displayWord}"`);
console.log(`Final display meaning: "${displayMeaning}"`);

// 4. Common issues
console.log("\n4. TROUBLESHOOTING\n");

if (displayWord === '') {
  console.log("❌ Word would not display!");
  console.log("   Check: Is 'word' field being set in backend?");
  console.log("   Check: Is vocabulary in the correct subsection?");
} else {
  console.log("✓ Word should display correctly");
}

console.log("\n5. WHAT TO CHECK IN BROWSER\n");
console.log("1. Open DevTools Console (F12)");
console.log("2. Look for 'Vocabulary item:' logs");
console.log("3. Check if item.word has a value");
console.log("4. Check Network tab > API response > content field");

console.log("\n6. MARKDOWN STRUCTURE CHECK\n");
console.log("Required structure:");
console.log("## GETTING STARTED");
console.log("### 📚 Vocabulary     <- Must be 3 hashes!");
console.log("(adj) - word - pron   <- No leading spaces!");
