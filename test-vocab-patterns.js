// Test vocabulary patterns detection

const vocabLines = [
  "(adj) - surprised - sə'praɪzd",
  "(n) - knitting kit - 'nɪtɪŋ kɪt",
  "(adj) - keen on - kiːn ɒn",
  "1. **gate** : (n) cổng /ɡeɪt/",
  "- **hobby** : (n) sở thích /ˈhɒbi/",
  "normal text line",
  "- **building** : tòa nhà"
];

// Detection patterns
const numberedBulletPattern = /^(\d+\.|-)\s*\*\*[^*]+\*\*\s*:/;
const parenthesesPattern = /^\([^)]+\)\s*-/;

console.log("=== TESTING DETECTION PATTERNS ===\n");

vocabLines.forEach((line, i) => {
  console.log(`Line ${i}: "${line}"`);
  console.log(`  Numbered/Bullet match: ${numberedBulletPattern.test(line)}`);
  console.log(`  Parentheses match: ${parenthesesPattern.test(line)}`);
  console.log(`  Would be detected: ${numberedBulletPattern.test(line) || parenthesesPattern.test(line)}`);
  console.log();
});

// Parse patterns
console.log("\n=== TESTING PARSE PATTERNS ===\n");

const newFormatRegex = /^\(([^)]+)\)\s*-\s*([^-]+)\s*-\s*(.+)$/;
const numberedRegex = /^(\d+)\.\s+\*\*([^*]+)\*\*\s*:\s*(?:\(([^)]+)\)\s*)?([^/]+)(?:\/([^/]+)\/)?/;
const bulletRegex = /^-\s+\*\*([^*]+)\*\*\s*:\s*(?:\(([^)]+)\)\s*)?([^/]+)(?:\/([^/]+)\/)?/;

vocabLines.forEach((line, i) => {
  console.log(`Line ${i}: "${line}"`);
  
  const newMatch = line.match(newFormatRegex);
  if (newMatch) {
    console.log("  NEW FORMAT MATCH:");
    console.log(`    Part of speech: ${newMatch[1]}`);
    console.log(`    Word: ${newMatch[2].trim()}`);
    console.log(`    Pronunciation: ${newMatch[3].trim()}`);
  }
  
  const numberedMatch = line.match(numberedRegex);
  if (numberedMatch) {
    console.log("  NUMBERED FORMAT MATCH:");
    console.log(`    Number: ${numberedMatch[1]}`);
    console.log(`    Word: ${numberedMatch[2]}`);
    console.log(`    Part of speech: ${numberedMatch[3] || 'none'}`);
    console.log(`    Meaning: ${numberedMatch[4]}`);
    console.log(`    Pronunciation: ${numberedMatch[5] || 'none'}`);
  }
  
  const bulletMatch = line.match(bulletRegex);
  if (bulletMatch) {
    console.log("  BULLET FORMAT MATCH:");
    console.log(`    Word: ${bulletMatch[1]}`);
    console.log(`    Part of speech: ${bulletMatch[2] || 'none'}`);
    console.log(`    Meaning: ${bulletMatch[3]}`);
    console.log(`    Pronunciation: ${bulletMatch[4] || 'none'}`);
  }
  
  if (!newMatch && !numberedMatch && !bulletMatch) {
    console.log("  No match");
  }
  console.log();
});
