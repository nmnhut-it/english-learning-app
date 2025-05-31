// Script to verify markdown structure for vocabulary
// Run this to check if your markdown has the correct structure

const fs = require('fs');
const path = require('path');

// Adjust this path to your markdown file
const filePath = './markdown-files/your-file.md';

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  console.log('=== MARKDOWN STRUCTURE CHECK ===\n');
  
  let inVocabSection = false;
  let vocabHeadingFound = false;
  let vocabLevel = 0;
  
  lines.forEach((line, i) => {
    // Check for vocabulary heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];
      
      console.log(`Line ${i}: ${headingMatch[1]} ${title}`);
      
      if (title.includes('📚') || title.toLowerCase().includes('vocabulary') || title.includes('Từ vựng')) {
        vocabHeadingFound = true;
        vocabLevel = level;
        inVocabSection = true;
        console.log(`  ✓ VOCABULARY SECTION FOUND (level ${level})`);
        
        if (level !== 3) {
          console.log(`  ⚠️ WARNING: Should use ### (3 hashes) for subsection, but found ${headingMatch[1]}`);
        }
      } else if (level <= vocabLevel) {
        inVocabSection = false;
      }
    }
    
    // Check for vocabulary items when in vocab section
    if (inVocabSection && !line.match(/^#/)) {
      const isVocabLine = 
        line.match(/^\([^)]+\)\s*-/) || 
        line.match(/^(\d+\.|-)\s*\*\*[^*]+\*\*\s*:/);
        
      if (isVocabLine) {
        console.log(`Line ${i}: "${line.substring(0, 50)}..."`);
        console.log(`  ✓ Vocabulary line detected`);
      } else if (line.trim() && !line.match(/^(This|##)/)) {
        console.log(`Line ${i}: "${line.substring(0, 50)}..."`);
        console.log(`  ? Possible vocabulary line not matching patterns`);
      }
    }
  });
  
  console.log('\n=== SUMMARY ===');
  if (!vocabHeadingFound) {
    console.log('❌ No vocabulary heading found');
    console.log('   Need: ### 📚 Vocabulary OR ### Vocabulary OR ### Từ vựng');
  } else {
    console.log('✓ Vocabulary section found');
  }
  
} catch (error) {
  console.error('Error reading file:', error.message);
  console.log('\nUsage: Update the filePath variable to point to your markdown file');
}
