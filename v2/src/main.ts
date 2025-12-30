/**
 * Main entry point for the Vocabulary Gamification System
 */

import { VocabGame } from './games/engine/GameManager';
import { VocabularyParser } from './games/data/VocabularyParser';
import { ProgressTracker } from './games/data/ProgressTracker';
import type { VocabularySet, VocabularyItem } from './games/types/GameTypes';

// Sample vocabulary for testing
const sampleVocabulary: VocabularySet = {
  id: 'g8-u1-getting-started',
  grade: 8,
  unit: 1,
  lesson: 'Getting Started',
  title: 'Unit 1: Leisure Time',
  items: [
    {
      id: 'g8-u1-surprised',
      word: 'surprised',
      partOfSpeech: 'adj',
      pronunciation: { ipa: '/səˈpraɪzd/' },
      meaning: 'ngạc nhiên',
      difficulty: 2,
      grade: 8,
      unit: 1,
      lesson: 'Getting Started',
    },
    {
      id: 'g8-u1-knitting-kit',
      word: 'knitting kit',
      partOfSpeech: 'n',
      pronunciation: { ipa: '/ˈnɪtɪŋ kɪt/' },
      meaning: 'bộ đan len',
      difficulty: 2,
      grade: 8,
      unit: 1,
      lesson: 'Getting Started',
    },
    {
      id: 'g8-u1-keen-on',
      word: 'keen on',
      partOfSpeech: 'adj',
      pronunciation: { ipa: '/kiːn ɒn/' },
      meaning: 'thích',
      examples: [{ english: "I'm keen on playing football." }],
      difficulty: 2,
      grade: 8,
      unit: 1,
      lesson: 'Getting Started',
    },
    {
      id: 'g8-u1-diy-activities',
      word: 'DIY activities',
      partOfSpeech: 'n',
      pronunciation: { ipa: '/ˌdiː.aɪˈwaɪ ækˈtɪvɪtiz/' },
      meaning: 'các hoạt động tự làm',
      difficulty: 2,
      grade: 8,
      unit: 1,
      lesson: 'Getting Started',
    },
    {
      id: 'g8-u1-leisure-time',
      word: 'leisure time',
      partOfSpeech: 'n',
      pronunciation: { ipa: '/ˈlɛʒə taɪm/' },
      meaning: 'thời gian rảnh',
      difficulty: 2,
      grade: 8,
      unit: 1,
      lesson: 'Getting Started',
    },
    {
      id: 'g8-u1-hang-out',
      word: 'hang out with friends',
      partOfSpeech: 'v',
      pronunciation: { ipa: '/hæŋ aʊt wɪð frɛndz/' },
      meaning: 'đi chơi với bạn bè',
      difficulty: 2,
      grade: 8,
      unit: 1,
      lesson: 'Getting Started',
    },
    {
      id: 'g8-u1-go-cycling',
      word: 'go cycling',
      partOfSpeech: 'v',
      pronunciation: { ipa: '/ɡəʊ ˈsaɪklɪŋ/' },
      meaning: 'đi xe đạp',
      difficulty: 2,
      grade: 8,
      unit: 1,
      lesson: 'Getting Started',
    },
    {
      id: 'g8-u1-surfing-net',
      word: 'surfing the net',
      partOfSpeech: 'n',
      pronunciation: { ipa: '/ˈsɜːfɪŋ ðə nɛt/' },
      meaning: 'lướt web',
      difficulty: 2,
      grade: 8,
      unit: 1,
      lesson: 'Getting Started',
    },
  ],
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');

  if (!container) {
    console.error('Game container not found');
    return;
  }

  // Create game instance
  const game = new VocabGame({
    container: 'game-container',
    vocabularySet: sampleVocabulary,
    onComplete: (results) => {
      console.log('Game completed:', results);
    },
    onError: (error) => {
      console.error('Game error:', error);
    },
  });

  // Start the game
  game.start();

  // Expose for debugging
  (window as any).vocabGame = game;
  (window as any).VocabularyParser = VocabularyParser;
  (window as any).ProgressTracker = ProgressTracker;
});

// Export for module usage
export { VocabGame, VocabularyParser, ProgressTracker };
export type { VocabularySet, VocabularyItem };
