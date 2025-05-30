const fs = require('fs');
const path = require('path');

// Test the markdown parsing locally
async function testMarkdownParsing() {
  const markdownPath = path.join(__dirname, 'markdown-files', 'unit1-hobbies.md');
  const content = fs.readFileSync(markdownPath, 'utf-8');
  
  // Standard pedagogical section order
  const SECTION_ORDER = [
    'GETTING STARTED',
    'A CLOSER LOOK 1',
    'A CLOSER LOOK 2',
    'COMMUNICATION',
    'SKILLS 1',
    'SKILLS 2',
    'LOOKING BACK'
  ];
  
  function getSectionType(title) {
    const upper = title.toUpperCase();
    
    if (upper.includes('GETTING STARTED')) return 'getting-started';
    if (upper.includes('A CLOSER LOOK 1')) return 'closer-look-1';
    if (upper.includes('A CLOSER LOOK 2')) return 'closer-look-2';
    if (upper.includes('COMMUNICATION')) return 'communication';
    if (upper.includes('SKILLS 1')) return 'skills-1';
    if (upper.includes('SKILLS 2')) return 'skills-2';
    if (upper.includes('LOOKING BACK')) return 'looking-back';
    
    return 'general';
  }
  
  function sortSections(sections) {
    return sections.sort((a, b) => {
      const aIndex = SECTION_ORDER.findIndex(order => 
        a.title.toUpperCase().includes(order)
      );
      const bIndex = SECTION_ORDER.findIndex(order => 
        b.title.toUpperCase().includes(order)
      );
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      return a.originalIndex - b.originalIndex;
    });
  }
  
  // Extract sections
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let sectionIndex = 0;
  
  lines.forEach(line => {
    if (line.match(/^##\s+/) && !line.match(/^###/)) {
      const title = line.replace(/^##\s+/, '').trim();
      currentSection = {
        type: getSectionType(title),
        title,
        originalIndex: sectionIndex++
      };
      sections.push(currentSection);
    }
  });
  
  console.log('\\nOriginal section order:');
  sections.forEach((s, i) => {
    console.log(`${i + 1}. ${s.title} (type: ${s.type})`);
  });
  
  const sortedSections = sortSections([...sections]);
  
  console.log('\\nSorted section order (pedagogical sequence):');
  sortedSections.forEach((s, i) => {
    console.log(`${i + 1}. ${s.title} (type: ${s.type})`);
  });
  
  console.log('\\nExpected order:');
  SECTION_ORDER.forEach((s, i) => {
    console.log(`${i + 1}. ${s}`);
  });
  
  // Check subsections
  console.log('\\n\\nSubsections found:');
  let currentSectionName = '';
  lines.forEach(line => {
    if (line.match(/^##\s+/) && !line.match(/^###/)) {
      currentSectionName = line.replace(/^##\s+/, '').trim();
    } else if (line.match(/^###\s+/)) {
      const subsectionTitle = line.replace(/^###\s+/, '').trim();
      console.log(`  ${currentSectionName} -> ${subsectionTitle}`);
    }
  });
}

testMarkdownParsing();
