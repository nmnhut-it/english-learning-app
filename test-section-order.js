// Test script to verify section ordering
const SECTION_ORDER = [
  'GETTING STARTED',
  'A CLOSER LOOK 1',
  'A CLOSER LOOK 2',
  'COMMUNICATION',
  'SKILLS 1',
  'SKILLS 2',
  'LOOKING BACK'
];

// Test data with sections in wrong order
const testSections = [
  { title: 'SKILLS 2 - KỸ NĂNG 2', type: 'skills-2', originalIndex: 0 },
  { title: 'COMMUNICATION - GIAO TIẾP', type: 'communication', originalIndex: 1 },
  { title: 'GETTING STARTED - BẮT ĐẦU', type: 'getting-started', originalIndex: 2 },
  { title: 'A CLOSER LOOK 1 - TÌM HIỂU THÊM 1', type: 'closer-look-1', originalIndex: 3 },
  { title: 'SKILLS 1 - KỸ NĂNG 1', type: 'skills-1', originalIndex: 4 },
  { title: 'A CLOSER LOOK 2 - TÌM HIỂU THÊM 2', type: 'closer-look-2', originalIndex: 5 },
  { title: 'CUSTOM SECTION', type: 'general', originalIndex: 6 },
  { title: 'LOOKING BACK - NHÌN LẠI', type: 'looking-back', originalIndex: 7 }
];

// Sort function
function sortSections(sections) {
  return sections.sort((a, b) => {
    const aIndex = SECTION_ORDER.findIndex(order => 
      a.title.toUpperCase().includes(order)
    );
    const bIndex = SECTION_ORDER.findIndex(order => 
      b.title.toUpperCase().includes(order)
    );
    
    // If both found in order, sort by that
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // If only one found, it comes first
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // Otherwise maintain original order
    return a.originalIndex - b.originalIndex;
  });
}

console.log('Original order:');
testSections.forEach((s, i) => console.log(`${i + 1}. ${s.title}`));

const sorted = sortSections([...testSections]);

console.log('\nSorted order (should match pedagogical sequence):');
sorted.forEach((s, i) => console.log(`${i + 1}. ${s.title}`));

console.log('\nExpected order:');
SECTION_ORDER.forEach((s, i) => console.log(`${i + 1}. ${s}`));
