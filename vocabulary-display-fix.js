// Temporary fix for vocabulary display issue
// Add this to VocabularySection.tsx if words still don't show

// Replace the vocabItems filter with this:
const vocabItems = section.content
  .filter((item: any) => item.type === 'vocabulary')
  .map((item: any) => {
    // Handle potential data access issues
    if (typeof item === 'string') {
      try {
        return JSON.parse(item);
      } catch {
        console.error('Failed to parse vocabulary item:', item);
        return null;
      }
    }
    
    // Ensure all fields are accessible
    const vocabItem = {
      type: item.type || 'vocabulary',
      number: item.number || '',
      word: item.word || item.english || '',
      english: item.english || item.word || '',
      partOfSpeech: item.partOfSpeech || '',
      meaning: item.meaning || item.vietnamese || '',
      vietnamese: item.vietnamese || item.meaning || '',
      pronunciation: item.pronunciation || ''
    };
    
    console.log('Normalized vocab item:', vocabItem);
    return vocabItem;
  })
  .filter(item => item !== null);

// Then use:
const word = item.word || item.english || '';
const meaning = item.meaning || item.vietnamese || '';
