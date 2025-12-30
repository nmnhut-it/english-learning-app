/**
 * Meaning Match Scene - Match words to their meanings
 */

class MeaningMatchScene extends Phaser.Scene {
  constructor() {
    super('MeaningMatchScene');
    this.score = 0;
    this.lives = 3;
    this.currentRound = 0;
    this.totalRounds = 10;
    this.words = [];
    this.selectedWord = null;
    this.selectedMeaning = null;
    this.matchedPairs = new Set();
  }

  create() {
    const vocabSet = getCurrentVocabSet();
    this.words = this.shuffleArray([...vocabSet.items]).slice(0, 20);
    this.currentRound = 0;
    this.score = 0;
    this.lives = 3;
    this.matchedPairs = new Set();

    // Top bar
    this.createTopBar();

    // Instructions
    this.add.text(GAME_WIDTH / 2, 85, 'Match words with their meanings!', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Show first round
    this.showRound();
  }

  createTopBar() {
    this.add.rectangle(GAME_WIDTH / 2, 30, GAME_WIDTH, 60, COLORS.BG_CARD);

    // Back button
    const backBtn = this.add.text(30, 30, '← Back', {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });

    // Title
    this.add.text(GAME_WIDTH / 2, 30, '🎯 Meaning Match', {
      fontSize: '20px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Score and lives
    this.scoreText = this.add.text(GAME_WIDTH - 120, 30, `⭐ ${this.score}`, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
    }).setOrigin(1, 0.5);

    this.livesText = this.add.text(GAME_WIDTH - 30, 30, `❤️ ${this.lives}`, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.INCORRECT,
    }).setOrigin(1, 0.5);
  }

  showRound() {
    // Clear previous round
    if (this.roundContainer) {
      this.roundContainer.destroy();
    }

    if (this.currentRound >= this.totalRounds || this.lives <= 0) {
      this.completeGame();
      return;
    }

    // Get 4 words for this round
    const startIdx = this.currentRound * 2;
    const roundWords = this.words.slice(startIdx, startIdx + 4);

    if (roundWords.length < 4) {
      this.completeGame();
      return;
    }

    this.roundContainer = this.add.container(0, 0);
    this.matchedPairs = new Set();
    this.selectedWord = null;
    this.selectedMeaning = null;

    // Shuffle meanings separately
    const shuffledMeanings = this.shuffleArray([...roundWords]);

    // Create word cards (left side)
    this.wordCards = [];
    roundWords.forEach((word, i) => {
      const card = this.createCard(150, 150 + i * 100, word.word, 'word', i);
      this.wordCards.push(card);
      this.roundContainer.add(card);
    });

    // Create meaning cards (right side)
    this.meaningCards = [];
    shuffledMeanings.forEach((word, i) => {
      const card = this.createCard(550, 150 + i * 100, word.meaning, 'meaning', roundWords.indexOf(word));
      this.meaningCards.push(card);
      this.roundContainer.add(card);
    });

    // Round indicator
    const roundText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30,
      `Round ${this.currentRound + 1}/${this.totalRounds}`, {
      fontSize: '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);
    this.roundContainer.add(roundText);
  }

  createCard(x, y, text, type, matchId) {
    const container = this.add.container(x, y);
    const width = 280;
    const height = 70;

    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(2, type === 'word' ? COLORS.PRIMARY : COLORS.SECONDARY);

    const displayText = this.add.text(0, 0, text, {
      fontSize: type === 'word' ? '18px' : '14px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: type === 'word' ? 'bold' : 'normal',
      wordWrap: { width: width - 20 },
      align: 'center',
    }).setOrigin(0.5);

    container.add([bg, displayText]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.matchId = matchId;
    container.cardType = type;
    container.cardBg = bg;
    container.isMatched = false;

    container.on('pointerdown', () => this.handleCardClick(container));

    container.on('pointerover', () => {
      if (!container.isMatched) {
        bg.setFillStyle(COLORS.BG_LIGHT);
      }
    });

    container.on('pointerout', () => {
      if (!container.isMatched && !container.isSelected) {
        bg.setFillStyle(COLORS.BG_CARD);
      }
    });

    return container;
  }

  handleCardClick(card) {
    if (card.isMatched) return;

    AudioManager.playEffect('click');

    if (card.cardType === 'word') {
      // Deselect previous word
      if (this.selectedWord) {
        this.selectedWord.cardBg.setFillStyle(COLORS.BG_CARD);
        this.selectedWord.isSelected = false;
      }
      this.selectedWord = card;
      card.cardBg.setFillStyle(COLORS.PRIMARY);
      card.isSelected = true;

      // Play pronunciation
      const wordData = this.words.find((w, i) => i === card.matchId ||
        this.words.slice(this.currentRound * 2, this.currentRound * 2 + 4).indexOf(w) === card.matchId);
      if (wordData) {
        AudioManager.playWord(wordData.word);
      }
    } else {
      // Deselect previous meaning
      if (this.selectedMeaning) {
        this.selectedMeaning.cardBg.setFillStyle(COLORS.BG_CARD);
        this.selectedMeaning.isSelected = false;
      }
      this.selectedMeaning = card;
      card.cardBg.setFillStyle(COLORS.SECONDARY);
      card.isSelected = true;
    }

    // Check for match
    if (this.selectedWord && this.selectedMeaning) {
      this.checkMatch();
    }
  }

  checkMatch() {
    const isMatch = this.selectedWord.matchId === this.selectedMeaning.matchId;

    if (isMatch) {
      // Correct match
      AudioManager.playEffect('correct');
      this.score += POINTS.CORRECT_FIRST_TRY;
      this.scoreText.setText(`⭐ ${this.score}`);

      // Mark as matched
      this.selectedWord.isMatched = true;
      this.selectedMeaning.isMatched = true;
      this.selectedWord.cardBg.setFillStyle(COLORS.CORRECT);
      this.selectedMeaning.cardBg.setFillStyle(COLORS.CORRECT);
      this.selectedWord.cardBg.setStrokeStyle(2, COLORS.CORRECT);
      this.selectedMeaning.cardBg.setStrokeStyle(2, COLORS.CORRECT);

      this.matchedPairs.add(this.selectedWord.matchId);

      // Record progress
      const startIdx = this.currentRound * 2;
      const wordData = this.words[startIdx + this.selectedWord.matchId];
      if (wordData) {
        ProgressTracker.recordAnswer(wordData.id || wordData.word, true);
      }

      // Check if round complete
      if (this.matchedPairs.size >= 4) {
        this.time.delayedCall(500, () => {
          this.currentRound++;
          this.showRound();
        });
      }
    } else {
      // Wrong match
      AudioManager.playEffect('incorrect');
      this.lives--;
      this.livesText.setText(`❤️ ${this.lives}`);

      // Flash red
      this.selectedWord.cardBg.setFillStyle(COLORS.INCORRECT);
      this.selectedMeaning.cardBg.setFillStyle(COLORS.INCORRECT);

      this.time.delayedCall(300, () => {
        if (!this.selectedWord.isMatched) {
          this.selectedWord.cardBg.setFillStyle(COLORS.BG_CARD);
          this.selectedWord.isSelected = false;
        }
        if (!this.selectedMeaning.isMatched) {
          this.selectedMeaning.cardBg.setFillStyle(COLORS.BG_CARD);
          this.selectedMeaning.isSelected = false;
        }
        this.selectedWord = null;
        this.selectedMeaning = null;

        if (this.lives <= 0) {
          this.completeGame();
        }
      });
      return;
    }

    this.selectedWord = null;
    this.selectedMeaning = null;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  completeGame() {
    ProgressTracker.addPoints(this.score);
    AudioManager.playEffect('complete');

    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8);

    const isWin = this.lives > 0;
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, isWin ? '🎉 Complete!' : '💔 Game Over', {
      fontSize: '36px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `Score: ${this.score}`, {
      fontSize: '24px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.GOLD,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, `Rounds completed: ${this.currentRound}/${this.totalRounds}`, {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: COLOR_STRINGS.TEXT_MUTED,
    }).setOrigin(0.5);

    // Continue button
    const btn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
    const btnBg = this.add.rectangle(0, 0, 150, 50, COLORS.PRIMARY).setStrokeStyle(2, 0xffffff, 0.2);
    const btnText = this.add.text(0, 0, 'Continue', {
      fontSize: '18px',
      fontFamily: 'Segoe UI, system-ui',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.add([btnBg, btnText]);
    btn.setSize(150, 50);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      AudioManager.playEffect('click');
      this.scene.start('MenuScene');
    });
  }
}
