// Quick test to run in browser console to check vocabulary data

// After loading a file with vocabulary, run this in browser console:

console.log('=== VOCABULARY DATA CHECK ===');

// Find all vocabulary items in the page
const vocabCards = document.querySelectorAll('[class*="MuiGrid-item"]');
console.log(`Found ${vocabCards.length} vocabulary cards`);

// Check React DevTools data (if available)
if (window.$r) {
  console.log('\nReact component data:');
  console.log('Selected component props:', window.$r.props);
}

// Check for empty text in vocabulary cards
const emptyCards = Array.from(vocabCards).filter(card => {
  const text = card.querySelector('[class*="MuiTypography-subtitle1"]');
  return text && text.textContent.trim() === '';
});

if (emptyCards.length > 0) {
  console.log(`\n⚠️ Found ${emptyCards.length} cards with empty text`);
  console.log('This indicates the word field is empty or not being accessed correctly');
}

// Look for console logs
console.log('\n📋 Check console for these logs:');
console.log('- "Vocabulary item:" - shows the raw data');
console.log('- "item.word:" - should have the word value');
console.log('- "Final word:" - what gets displayed');

// Quick fix reminder
console.log('\n💡 Quick Fix:');
console.log('1. Run: convert-vocabulary.bat');
console.log('2. Or change format to: - **word** : (type) /pronunciation/');
