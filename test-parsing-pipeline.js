// Complete test of vocabulary parsing pipeline

console.log("=== VOCABULARY PARSING PIPELINE TEST ===\n");

// Test content that matches the screenshot
const markdownContent = `# UNIT 1: LEISURE TIME - THỜI GIAN RẢNH RỖI

## GETTING STARTED - BẮT ĐẦU

### 📚 Vocabulary - Từ vựng

(adj) - surprised - sə'praɪzd
(n) - knitting kit - 'nɪtɪŋ kɪt
(adj) - keen on - kiːn ɒn`;

// Simulate the backend parsing
console.log("1. BACKEND PARSING SIMULATION\n");

const lines = markdownContent.split('\n');
let currentSection = null;
let currentSubsection = null;
const vocabItems = [];

lines.forEach((line, index) => {
  // Check for subsection
  if (line.match(/^###\s+/)) {
    const title = line.replace(/^###\s+/, '').trim();
    currentSubsection = { title, type: 'vocabulary', content: [] };
    console.log(`Found subsection: "${title}"`);
  }
  
  // Check for vocabulary line
  const parenthesesPattern = /^\([^)]+\)\s*-/;
  if (line.match(parenthesesPattern)) {
    console.log(`\nProcessing line ${index}: "${line}"`);
    
    // Parse the vocabulary
    const newFormatMatch = line.match(/^\(([^)]+)\)\s*-\s*([^-]+)\s*-\s*(.+)$/);
    if (newFormatMatch) {
      const vocabItem = {
        type: 'vocabulary',
        partOfSpeech: newFormatMatch[1].trim(),
        word: newFormatMatch[2].trim(),
        meaning: '',
        pronunciation: newFormatMatch[3].trim()
      };
      
      console.log('Parsed vocabulary:', vocabItem);
      vocabItems.push(vocabItem);
      
      if (currentSubsection) {
        currentSubsection.content.push(vocabItem);
      }
    }
  }
});

console.log("\n2. JSON SERIALIZATION\n");
console.log("What gets sent to frontend:");
console.log(JSON.stringify(vocabItems, null, 2));

console.log("\n3. FRONTEND PROCESSING\n");

// Simulate frontend processing
vocabItems.forEach((item, index) => {
  console.log(`\nItem ${index}:`);
  console.log(`  item.word: "${item.word}"`);
  console.log(`  item.english: "${item.english}"`);
  console.log(`  item.meaning: "${item.meaning}"`);
  console.log(`  item.vietnamese: "${item.vietnamese}"`);
  
  // What the frontend would extract
  const word = item.english || item.word || '';
  const meaning = item.vietnamese || item.meaning || '';
  
  console.log(`  Final word displayed: "${word}"`);
  console.log(`  Final meaning displayed: "${meaning}"`);
  console.log(`  Part of speech chip: "${item.partOfSpeech}"`);
  console.log(`  Pronunciation chip: "/${item.pronunciation}/"`);
});

console.log("\n4. POTENTIAL ISSUES\n");
console.log("- word field is set correctly: ✓");
console.log("- meaning field is empty (expected for this format): ✓");
console.log("- Frontend checks item.english || item.word: ✓");
console.log("- Frontend checks item.vietnamese || item.meaning: ✓");
console.log("\nThe word SHOULD display correctly!");

console.log("\n5. WHAT MIGHT BE WRONG\n");
console.log("- Check if vocabulary items are actually in the content array");
console.log("- Check if the section structure is correct");
console.log("- Check browser console for the actual data received");
console.log("- Check if there's a JSON parsing issue");
