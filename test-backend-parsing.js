// Test script to verify backend vocabulary parsing
// Run with: node test-backend-parsing.js

const testContent = `# Test Unit

## GETTING STARTED

### 📚 Vocabulary - Từ vựng

(adj) - surprised - sə'praɪzd
(n) - knitting kit - 'nɪtɪŋ kɪt
- **hobby** : (n) sở thích /ˈhɒbi/
1. **gate** : (n) cổng /ɡeɪt/
`;

// Test the detection patterns
const lines = testContent.split('\n');
const detectionPattern1 = /^(\d+\.|-)\s*\*\*[^*]+\*\*\s*:/;
const detectionPattern2 = /^\([^)]+\)\s*-/;

console.log('Testing vocabulary detection on each line:\n');

lines.forEach((line, i) => {
  const match1 = detectionPattern1.test(line);
  const match2 = detectionPattern2.test(line);
  
  if (match1 || match2) {
    console.log(`Line ${i}: "${line}"`);
    console.log(`  ✓ MATCHED (pattern ${match1 ? '1' : '2'})`);
    
    // Test parsing
    const newFormatMatch = line.match(/^\(([^)]+)\)\s*-\s*([^-]+)\s*-\s*(.+)$/);
    const numberedMatch = line.match(/^(\d+)\.\s+\*\*([^*]+)\*\*\s*:\s*(?:\(([^)]+)\)\s*)?([^/]+)(?:\/([^/]+)\/)?/);
    const bulletMatch = line.match(/^-\s+\*\*([^*]+)\*\*\s*:\s*(?:\(([^)]+)\)\s*)?([^/]+)(?:\/([^/]+)\/)?/);
    
    if (newFormatMatch) {
      console.log(`  Parsed: word="${newFormatMatch[2].trim()}", type="${newFormatMatch[1]}", pron="${newFormatMatch[3].trim()}"`);
    } else if (numberedMatch) {
      console.log(`  Parsed: word="${numberedMatch[2]}", type="${numberedMatch[3] || ''}", meaning="${numberedMatch[4]}"`);
    } else if (bulletMatch) {
      console.log(`  Parsed: word="${bulletMatch[1]}", type="${bulletMatch[2] || ''}", meaning="${bulletMatch[3]}"`);
    }
    console.log();
  }
});

console.log('\nIf vocabulary lines are matched above, the patterns are working correctly.');
console.log('The issue may be in the markdown file formatting or the backend code structure.');
