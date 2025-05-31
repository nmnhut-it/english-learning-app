// Test script to verify vocabulary parsing

const testLines = [
  "(adj) - surprised - sə'praɪzd",
  "(n) - knitting kit - 'nɪtɪŋ kɪt",
  "(adj) - keen on - kiːn ɒn",
  "1. **word** : (n) meaning /pronunciation/",
  "- **test** : (adj) definition"
];

// New regex pattern to match the format: (type) - word - pronunciation
const newFormatRegex = /^\(([^)]+)\)\s*-\s*([^-]+)\s*-\s*(.+)$/;

// Test each line
testLines.forEach(line => {
  const match = line.match(newFormatRegex);
  if (match) {
    console.log(`Line: "${line}"`);
    console.log(`  Part of speech: ${match[1].trim()}`);
    console.log(`  Word: ${match[2].trim()}`);
    console.log(`  Pronunciation: ${match[3].trim()}`);
    console.log('---');
  } else {
    console.log(`No match for: "${line}"`);
  }
});

// Test the detection pattern
const detectionRegex = /^\([^)]+\)\s*-/;
testLines.forEach(line => {
  if (line.match(detectionRegex)) {
    console.log(`Detection pattern matches: "${line}"`);
  }
});
