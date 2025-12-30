/**
 * Vocabulary Data
 * Integrates with extracted vocabulary data
 */

// Build vocabulary sets from extracted data
function buildVocabularySets() {
  const sets = {};

  // Check if EXTRACTED_VOCABULARY is available
  if (typeof EXTRACTED_VOCABULARY !== 'undefined') {
    for (const [key, vocabSet] of Object.entries(EXTRACTED_VOCABULARY)) {
      // Filter out sets with null units or too few items
      if (vocabSet.items && vocabSet.items.length >= 5) {
        // Add unique IDs to items
        const itemsWithIds = vocabSet.items.map((item, index) => ({
          ...item,
          id: item.id || `${key}-${index}`,
        }));

        sets[key] = {
          ...vocabSet,
          items: itemsWithIds,
        };
      }
    }
  }

  // Fallback sample data if no extracted vocabulary
  if (Object.keys(sets).length === 0) {
    sets['sample'] = {
      id: 'sample',
      grade: 8,
      unit: 1,
      title: 'Sample Vocabulary',
      items: [
        { id: 'sample-1', word: 'hello', pos: 'interj', ipa: '/həˈləʊ/', meaning: 'xin chào' },
        { id: 'sample-2', word: 'world', pos: 'n', ipa: '/wɜːld/', meaning: 'thế giới' },
        { id: 'sample-3', word: 'learn', pos: 'v', ipa: '/lɜːn/', meaning: 'học' },
        { id: 'sample-4', word: 'vocabulary', pos: 'n', ipa: '/vəˈkæbjʊləri/', meaning: 'từ vựng' },
        { id: 'sample-5', word: 'practice', pos: 'v', ipa: '/ˈpræktɪs/', meaning: 'luyện tập' },
      ],
    };
  }

  return sets;
}

// Initialize vocabulary sets
const VOCABULARY_SETS = buildVocabularySets();

// Current vocabulary set - default to first available
let currentVocabSet = Object.values(VOCABULARY_SETS)[0];

/**
 * Set current vocabulary set by ID
 */
function setCurrentVocabSet(setId) {
  if (VOCABULARY_SETS[setId]) {
    currentVocabSet = VOCABULARY_SETS[setId];
    return true;
  }
  return false;
}

/**
 * Get current vocabulary set
 */
function getCurrentVocabSet() {
  return currentVocabSet;
}

/**
 * Get all vocabulary sets
 */
function getAllVocabSets() {
  return Object.values(VOCABULARY_SETS);
}

/**
 * Get vocabulary sets by grade
 */
function getVocabSetsByGrade(grade) {
  return Object.values(VOCABULARY_SETS).filter(set => set.grade === grade);
}

/**
 * Search vocabulary across all sets
 */
function searchVocabulary(query) {
  const results = [];
  const lowerQuery = query.toLowerCase();

  for (const set of Object.values(VOCABULARY_SETS)) {
    for (const item of set.items) {
      if (
        item.word.toLowerCase().includes(lowerQuery) ||
        item.meaning.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          ...item,
          setId: set.id,
          setTitle: set.title,
        });
      }
    }
  }

  return results;
}

/**
 * Get random vocabulary items from current set
 */
function getRandomWords(count = 10) {
  const items = [...currentVocabSet.items];
  const shuffled = items.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, items.length));
}

// Log vocabulary stats on load
console.log(`📚 Loaded ${Object.keys(VOCABULARY_SETS).length} vocabulary sets`);
console.log(`📝 Total vocabulary items: ${Object.values(VOCABULARY_SETS).reduce((sum, set) => sum + set.items.length, 0)}`);
