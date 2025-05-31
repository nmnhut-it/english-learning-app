// Test the exact vocabulary format from the screenshot

const testLines = [
  "(adj) - surprised - sə'praɪzd",
  "(n) - knitting kit - 'nɪtɪŋ kɪt",
  "(adj) - keen on - kiːn ɒn"
];

// The regex patterns from the backend
const detectionPattern1 = /^(\d+\.|-)\s*\*\*[^*]+\*\*\s*:/;
const detectionPattern2 = /^\([^)]+\)\s*-/;
const newFormatRegex = /^\(([^)]+)\)\s*-\s*([^-]+)\s*-\s*(.+)$/;

console.log("Testing exact format from screenshot:\n");

testLines.forEach((line, i) => {
  console.log(`\nLine ${i}: "${line}"`);
  console.log(`Length: ${line.length} chars`);
  
  // Check if line would be detected
  const detected1 = detectionPattern1.test(line);
  const detected2 = detectionPattern2.test(line);
  console.log(`Detection pattern 1 match: ${detected1}`);
  console.log(`Detection pattern 2 match: ${detected2}`);
  console.log(`Would be detected: ${detected1 || detected2}`);
  
  // Try parsing
  const match = line.match(newFormatRegex);
  if (match) {
    console.log("\nParsed successfully:");
    console.log(`  Part of speech: "${match[1]}"`);
    console.log(`  Word: "${match[2].trim()}"`);
    console.log(`  Pronunciation: "${match[3].trim()}"`);
    
    // Show what would be created
    const vocabItem = {
      type: 'vocabulary',
      partOfSpeech: match[1].trim(),
      word: match[2].trim(),
      meaning: '', // No meaning in this format
      pronunciation: match[3].trim()
    };
    console.log("\nVocabulary object:");
    console.log(JSON.stringify(vocabItem, null, 2));
  } else {
    console.log("ERROR: Failed to parse!");
  }
});

// Test if there might be hidden characters
console.log("\n\nChecking for hidden characters:");
testLines.forEach((line, i) => {
  console.log(`\nLine ${i}:`);
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const code = line.charCodeAt(j);
    if (code < 32 || code > 126) {
      console.log(`  Position ${j}: Non-printable character (code ${code})`);
    }
  }
});
