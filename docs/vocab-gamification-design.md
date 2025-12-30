# Vocabulary Gamification System Design

## Overview

Hệ thống gamification để dạy và ôn tập từ vựng tiếng Anh cho chương trình Global Success lớp 6-12.

### Mục tiêu học tập
1. **Nghĩa của từ** - Hiểu và nhớ nghĩa tiếng Việt
2. **Phát âm** - Nghe và nhận biết cách phát âm đúng
3. **Nhớ cách phát âm** - Tự phát âm được từ
4. **Ngữ cảnh** - Sử dụng từ đúng ngữ cảnh

---

## Vocabulary Data Structure

### Parsed from Markdown Files

```typescript
interface VocabularyItem {
  id: string;
  word: string;
  partOfSpeech: 'n' | 'v' | 'adj' | 'adv' | 'prep' | 'phr' | 'n.phr' | 'v.phr' | 'adj.phr';
  pronunciation: {
    ipa: string;           // /ˈhɒbi/
    audioUrl?: string;     // URL to audio file
  };
  meaning: string;         // Vietnamese translation
  examples?: {
    english: string;
    vietnamese?: string;
  }[];
  synonyms?: string[];
  difficulty: 1 | 2 | 3;   // Based on grade level
  grade: number;           // 6-12
  unit: number;
  lesson: string;
}

interface VocabularySet {
  id: string;
  grade: number;
  unit: number;
  lesson: string;
  title: string;
  items: VocabularyItem[];
}
```

### Vocabulary Patterns Found

| Grade | Format | Example |
|-------|--------|---------|
| 6-8 | `word : (pos) meaning /ipa/` | `hobby : (n) sở thích /ˈhɒbi/` |
| 9-11 | `**word** /ipa/ (pos): meaning + examples` | Detailed with sentences |

---

## Game Engine Selection

### Recommended: **Phaser 3**

| Engine | Pros | Cons |
|--------|------|------|
| **Phaser 3** | Web-native, TypeScript support, large community, lightweight (~1MB) | Learning curve |
| Cocos Creator | 2D/3D, cross-platform | Heavy (~10MB), overkill for vocab games |
| PixiJS | Very lightweight, flexible | Need to build game logic from scratch |
| Vanilla Canvas | No dependencies | Too much custom code needed |

**Decision: Phaser 3** - Best balance of features, size, and TypeScript integration.

---

## Game Modes

### 1. LEARN MODE (Học mới)

#### 1.1 Flashcard Carousel
- Swipe through vocabulary cards
- Each card shows: Word → IPA → Meaning → Example
- Auto-play pronunciation on reveal
- Mark as "Known" or "Need Practice"

#### 1.2 Word Introduction Sequence
```
Step 1: Show word + Play audio
Step 2: Show IPA breakdown syllables
Step 3: Show Vietnamese meaning
Step 4: Show example sentence with word highlighted
Step 5: Mini quiz - Match word to meaning
```

### 2. PRACTICE MODE (Luyện tập)

#### 2.1 Meaning Match (Ghép nghĩa)
- **Mechanic**: Drag English word to Vietnamese meaning
- **Visual**: Words float down, catch correct meaning
- **Scoring**: Speed + Accuracy
- **Learning goal**: Nghĩa của từ

```
┌─────────────┐
│   hobby     │ ← Falling word
└─────────────┘
     ↓
┌────────┐ ┌────────┐ ┌────────┐
│sở thích│ │thể thao│ │bạn bè  │ ← Meaning options
└────────┘ └────────┘ └────────┘
```

#### 2.2 Pronunciation Pop (Nghe - Chọn)
- **Mechanic**: Hear audio → Select correct word from 4 options
- **Visual**: Bubbles with words, pop the correct one
- **Scoring**: Streak multiplier
- **Learning goal**: Phát âm

```
🔊 [Play Audio]

    (word1)    (word2)
       ⚪         ⚪

    (word3)    (word4)
       ⚪         ⚪
```

#### 2.3 Spell & Speak (Đánh vần)
- **Mechanic**: Hear word → Type/arrange letters
- **Visual**: Letter tiles like Scrabble
- **Bonus**: Record and compare pronunciation
- **Learning goal**: Nhớ cách phát âm

```
🔊 "hobby"

[ h ][ o ][ b ][ b ][ y ][ s ][ i ][ e ]
           ↓
    [ _ ][ _ ][ _ ][ _ ][ _ ]
```

#### 2.4 Context Fill (Điền từ vào ngữ cảnh)
- **Mechanic**: Sentence with blank → Choose correct word
- **Visual**: Story-like progression
- **Scoring**: Context bonus for related words
- **Learning goal**: Ngữ cảnh

```
"My _______ is playing football."

  ┌────────┐  ┌────────┐  ┌────────┐
  │ hobby  │  │ friend │  │ school │
  └────────┘  └────────┘  └────────┘
```

#### 2.5 Word Blitz (Thử thách tốc độ)
- **Mechanic**: Match as many word-meaning pairs in 60 seconds
- **Visual**: Grid of cards, memory game style
- **Scoring**: Time bonus, combo streaks
- **Learning goal**: Reinforcement

### 3. REVIEW MODE (Ôn tập)

#### 3.1 Spaced Repetition Quiz
- Algorithm tracks word mastery
- Resurface words at optimal intervals
- Mix old + new vocabulary

```typescript
interface WordProgress {
  wordId: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: Date;
  nextReview: Date;
  masteryLevel: 0 | 1 | 2 | 3 | 4 | 5;
}
```

#### 3.2 Boss Battle (Thử thách tổng hợp)
- End-of-unit challenge
- Mix all 4 learning objectives
- Unlock achievements/badges
- Leaderboard for class competition

### 4. COMPETITIVE MODE (Thi đấu)

#### 4.1 VocabHoot Live
- Real-time multiplayer (like Kahoot)
- Teacher hosts, students join
- Time-based scoring
- Class leaderboard

#### 4.2 Daily Challenge
- Same word set for all students
- Compare scores globally/class
- Streak rewards

---

## Technical Architecture

### Project Structure

```
v2/src/games/
├── engine/
│   ├── GameManager.ts      # Phaser game initialization
│   ├── SceneManager.ts     # Scene transitions
│   └── AudioManager.ts     # Sound effects + TTS
├── scenes/
│   ├── BootScene.ts        # Asset loading
│   ├── MenuScene.ts        # Game mode selection
│   ├── LearnScene.ts       # Flashcard learning
│   ├── MeaningMatchScene.ts
│   ├── PronunciationScene.ts
│   ├── SpellScene.ts
│   ├── ContextFillScene.ts
│   ├── BlitzScene.ts
│   └── BossScene.ts
├── components/
│   ├── WordCard.ts         # Reusable word display
│   ├── ScoreBoard.ts       # Score/streak display
│   ├── Timer.ts            # Countdown timer
│   ├── ProgressBar.ts      # Progress indicator
│   └── AudioButton.ts      # Play pronunciation
├── data/
│   ├── VocabularyParser.ts # Parse MD to VocabularyItem
│   ├── ProgressTracker.ts  # Spaced repetition logic
│   └── LeaderboardService.ts
├── types/
│   └── GameTypes.ts
└── config/
    └── GameConfig.ts       # Phaser config, difficulty settings
```

### Phaser Configuration

```typescript
// v2/src/games/config/GameConfig.ts
import Phaser from 'phaser';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 200 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MenuScene,
    LearnScene,
    MeaningMatchScene,
    PronunciationScene,
    SpellScene,
    ContextFillScene,
    BlitzScene,
    BossScene,
  ],
};
```

### Vocabulary Parser

```typescript
// v2/src/games/data/VocabularyParser.ts

export class VocabularyParser {
  /**
   * Parse Grade 6-8 format:
   * "1. word : (pos) meaning /ipa/"
   */
  static parseSimpleFormat(line: string): VocabularyItem | null {
    const regex = /^\d+\.\s*(.+?)\s*:\s*\((\w+(?:\.\w+)?)\)\s*(.+?)\s*\/(.+?)\/\s*$/;
    const match = line.match(regex);

    if (!match) return null;

    return {
      word: match[1].trim(),
      partOfSpeech: match[2] as any,
      meaning: match[3].trim(),
      pronunciation: {
        ipa: `/${match[4]}/`,
      },
    };
  }

  /**
   * Parse Grade 9-11 format:
   * "1. **word** /ipa/ (pos): meaning"
   */
  static parseDetailedFormat(block: string): VocabularyItem | null {
    const headerRegex = /^\d+\.\s*\*\*(.+?)\*\*\s*\/(.+?)\/\s*\((.+?)\):\s*(.+)$/m;
    const match = block.match(headerRegex);

    if (!match) return null;

    const examples: { english: string; vietnamese?: string }[] = [];
    const exampleRegex = /^\s*-\s*(.+)$/gm;
    let exMatch;

    while ((exMatch = exampleRegex.exec(block)) !== null) {
      const line = exMatch[1];
      if (line.startsWith('*') || line.startsWith('(')) {
        // Vietnamese translation
        if (examples.length > 0) {
          examples[examples.length - 1].vietnamese = line.replace(/[*()]/g, '').trim();
        }
      } else {
        examples.push({ english: line.trim() });
      }
    }

    return {
      word: match[1].trim(),
      pronunciation: { ipa: `/${match[2]}/` },
      partOfSpeech: match[3] as any,
      meaning: match[4].trim(),
      examples,
    };
  }

  /**
   * Parse entire MD file
   */
  static parseMarkdownFile(content: string, grade: number, unit: number, lesson: string): VocabularySet {
    const items: VocabularyItem[] = [];

    // Find vocabulary section
    const vocabSectionRegex = /\*\*(?:Vocabulary|Từ vựng).*?\*\*\s*([\s\S]*?)(?=\n\*\*|$)/i;
    const sectionMatch = content.match(vocabSectionRegex);

    if (sectionMatch) {
      const vocabContent = sectionMatch[1];
      const lines = vocabContent.split('\n');

      for (const line of lines) {
        const item = grade <= 8
          ? this.parseSimpleFormat(line)
          : this.parseDetailedFormat(line);

        if (item) {
          item.id = `${grade}-${unit}-${this.slugify(item.word)}`;
          item.grade = grade;
          item.unit = unit;
          item.lesson = lesson;
          item.difficulty = grade <= 7 ? 1 : grade <= 9 ? 2 : 3;
          items.push(item);
        }
      }
    }

    return {
      id: `${grade}-${unit}-${lesson}`,
      grade,
      unit,
      lesson,
      title: this.extractTitle(content),
      items,
    };
  }

  private static slugify(text: string): string {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  private static extractTitle(content: string): string {
    const titleMatch = content.match(/\*\*UNIT\s*\d+:\s*(.+?)\*\*/i);
    return titleMatch ? titleMatch[1].trim() : 'Vocabulary';
  }
}
```

### Spaced Repetition Algorithm

```typescript
// v2/src/games/data/ProgressTracker.ts

export class ProgressTracker {
  private storage: Storage;
  private readonly STORAGE_KEY = 'vocab_progress';

  constructor() {
    this.storage = localStorage;
  }

  getProgress(wordId: string): WordProgress {
    const all = this.getAllProgress();
    return all[wordId] || this.createNewProgress(wordId);
  }

  recordAnswer(wordId: string, correct: boolean): void {
    const progress = this.getProgress(wordId);

    if (correct) {
      progress.correctCount++;
      progress.masteryLevel = Math.min(5, progress.masteryLevel + 1);
      progress.nextReview = this.calculateNextReview(progress.masteryLevel);
    } else {
      progress.incorrectCount++;
      progress.masteryLevel = Math.max(0, progress.masteryLevel - 1);
      progress.nextReview = new Date(); // Review immediately
    }

    progress.lastReviewed = new Date();
    this.saveProgress(wordId, progress);
  }

  getWordsForReview(vocabularySet: VocabularySet): VocabularyItem[] {
    const now = new Date();
    const dueWords: VocabularyItem[] = [];
    const newWords: VocabularyItem[] = [];

    for (const item of vocabularySet.items) {
      const progress = this.getProgress(item.id);

      if (progress.masteryLevel === 0 && progress.correctCount === 0) {
        newWords.push(item);
      } else if (new Date(progress.nextReview) <= now) {
        dueWords.push(item);
      }
    }

    // Mix: 70% due words, 30% new words
    const reviewCount = Math.min(20, dueWords.length + newWords.length);
    const dueCount = Math.ceil(reviewCount * 0.7);
    const newCount = reviewCount - dueCount;

    return [
      ...this.shuffle(dueWords).slice(0, dueCount),
      ...this.shuffle(newWords).slice(0, newCount),
    ];
  }

  private calculateNextReview(masteryLevel: number): Date {
    // Fibonacci-like intervals: 1, 1, 2, 3, 5, 8 days
    const intervals = [0, 1, 1, 2, 3, 5, 8];
    const days = intervals[masteryLevel] || 8;
    const next = new Date();
    next.setDate(next.getDate() + days);
    return next;
  }

  private createNewProgress(wordId: string): WordProgress {
    return {
      wordId,
      correctCount: 0,
      incorrectCount: 0,
      lastReviewed: new Date(0),
      nextReview: new Date(),
      masteryLevel: 0,
    };
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getAllProgress(): Record<string, WordProgress> {
    const data = this.storage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }

  private saveProgress(wordId: string, progress: WordProgress): void {
    const all = this.getAllProgress();
    all[wordId] = progress;
    this.storage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  }
}
```

---

## Visual Design

### Color Palette

```css
:root {
  /* Primary */
  --game-primary: #6366f1;      /* Indigo - main actions */
  --game-secondary: #8b5cf6;    /* Purple - secondary */

  /* Feedback */
  --game-correct: #10b981;      /* Green - correct answer */
  --game-incorrect: #ef4444;    /* Red - wrong answer */
  --game-warning: #f59e0b;      /* Amber - time warning */

  /* Background */
  --game-bg-dark: #1a1a2e;      /* Dark blue - main bg */
  --game-bg-card: #16213e;      /* Slightly lighter - cards */

  /* Text */
  --game-text: #e2e8f0;         /* Light gray - main text */
  --game-text-muted: #94a3b8;   /* Muted - secondary text */

  /* Accents */
  --game-gold: #fbbf24;         /* Gold - achievements */
  --game-streak: #f97316;       /* Orange - streaks */
}
```

### UI Components

```
┌──────────────────────────────────────┐
│  ⭐ 150pts    🔥 5 streak    ⏱️ 45s  │  ← Top bar
├──────────────────────────────────────┤
│                                      │
│         ┌─────────────────┐          │
│         │                 │          │
│         │     hobby       │          │  ← Main game area
│         │    /ˈhɒbi/      │          │
│         │   🔊 [Play]     │          │
│         │                 │          │
│         └─────────────────┘          │
│                                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  │
│  │sở thích│  │thể thao│  │bạn bè  │  │  ← Answer options
│  └────────┘  └────────┘  └────────┘  │
│                                      │
├──────────────────────────────────────┤
│  ████████████░░░░░░░░  12/20 words   │  ← Progress bar
└──────────────────────────────────────┘
```

---

## Gamification Elements

### Points System

| Action | Points |
|--------|--------|
| Correct answer | +10 |
| Correct answer (first try) | +15 |
| Fast answer (< 3s) | +5 bonus |
| Streak bonus (5+) | x1.5 multiplier |
| Complete lesson | +50 |
| Perfect lesson (no mistakes) | +100 |

### Achievements

| Achievement | Condition | Badge |
|-------------|-----------|-------|
| First Steps | Complete 1 lesson | 🌱 |
| Word Warrior | Learn 100 words | ⚔️ |
| Pronunciation Pro | 50 correct pronunciation matches | 🎤 |
| Speed Demon | Complete blitz in < 30s | ⚡ |
| Perfect Week | 7-day streak | 🔥 |
| Unit Master | Master all words in unit | 👑 |
| Grade Champion | Complete all units in grade | 🏆 |

### Streaks

```typescript
interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
  weeklyActivity: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}
```

---

## Audio Integration

### Text-to-Speech

```typescript
// v2/src/games/engine/AudioManager.ts

export class AudioManager {
  private synth: SpeechSynthesis;
  private audioContext: AudioContext;
  private audioCache: Map<string, AudioBuffer> = new Map();

  constructor() {
    this.synth = window.speechSynthesis;
    this.audioContext = new AudioContext();
  }

  async playPronunciation(word: string, audioUrl?: string): Promise<void> {
    if (audioUrl) {
      await this.playAudioFile(audioUrl);
    } else {
      await this.playTTS(word);
    }
  }

  private async playAudioFile(url: string): Promise<void> {
    let buffer = this.audioCache.get(url);

    if (!buffer) {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      buffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioCache.set(url, buffer);
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start();
  }

  private playTTS(text: string): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => resolve();
      this.synth.speak(utterance);
    });
  }

  playSoundEffect(effect: 'correct' | 'incorrect' | 'levelup' | 'click'): void {
    // Play short sound effects
    const sounds = {
      correct: '/audio/effects/correct.mp3',
      incorrect: '/audio/effects/incorrect.mp3',
      levelup: '/audio/effects/levelup.mp3',
      click: '/audio/effects/click.mp3',
    };
    // ... play sound
  }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Phaser 3 in v2 project
- [ ] Create VocabularyParser to extract words from MD files
- [ ] Build basic game structure (scenes, components)
- [ ] Implement AudioManager with TTS

### Phase 2: Core Games (Week 3-4)
- [ ] Flashcard learning scene
- [ ] Meaning Match game
- [ ] Pronunciation Pop game
- [ ] Spell & Speak game

### Phase 3: Advanced Features (Week 5-6)
- [ ] Context Fill game
- [ ] Word Blitz timed challenge
- [ ] Spaced Repetition system
- [ ] Progress tracking & storage

### Phase 4: Gamification (Week 7-8)
- [ ] Points and scoring system
- [ ] Achievements and badges
- [ ] Streak tracking
- [ ] Boss Battle mode

### Phase 5: Multiplayer & Polish (Week 9-10)
- [ ] VocabHoot live game (optional)
- [ ] Leaderboards
- [ ] Mobile responsive
- [ ] Performance optimization

---

## Integration with V2

### Entry Points

```typescript
// v2/src/main.ts
import { VocabGame } from './games/engine/GameManager';

// Launch game from teacher dashboard or lesson view
const game = new VocabGame({
  container: 'game-container',
  vocabularySet: currentLessonVocab,
  mode: 'practice', // 'learn' | 'practice' | 'review' | 'compete'
  onComplete: (results) => {
    // Save progress, show summary
  },
});

game.start();
```

### Teacher Dashboard Integration

```typescript
// Teacher can:
// 1. Select vocabulary from lesson
// 2. Choose game mode
// 3. Launch for individual practice
// 4. Host live VocabHoot for class
// 5. View class progress/leaderboard
```

---

## Summary

Hệ thống gamification này sẽ giúp học sinh:

1. **Học từ mới** qua Flashcard + Introduction sequence
2. **Nhớ nghĩa** qua Meaning Match + Word Blitz
3. **Nghe phát âm** qua Pronunciation Pop
4. **Nhớ cách viết/phát âm** qua Spell & Speak
5. **Sử dụng trong ngữ cảnh** qua Context Fill
6. **Ôn tập hiệu quả** qua Spaced Repetition
7. **Cạnh tranh vui vẻ** qua VocabHoot + Leaderboard

Sử dụng **Phaser 3** làm game engine vì nhẹ, hỗ trợ TypeScript tốt, và phù hợp với 2D game mechanics.
