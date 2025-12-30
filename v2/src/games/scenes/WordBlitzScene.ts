/**
 * Word Blitz Game Scene
 * Timed challenge - match as many word-meaning pairs as possible
 */

import Phaser from 'phaser';
import { BaseScene, BaseSceneData } from './BaseScene';
import type { VocabularyItem } from '../types/GameTypes';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  COLOR_STRINGS,
  TEXT_STYLES,
} from '../config/GameConfig';

interface BlitzCard {
  container: Phaser.GameObjects.Container;
  item: VocabularyItem;
  type: 'word' | 'meaning';
  selected: boolean;
  matched: boolean;
}

export class WordBlitzScene extends BaseScene {
  private cards: BlitzCard[] = [];
  private selectedCard: BlitzCard | null = null;
  private timerText!: Phaser.GameObjects.Text;
  private timeRemaining: number = 60;
  private timerEvent!: Phaser.Time.TimerEvent;
  private matchedPairs: number = 0;
  private totalPairs: number = 0;
  private isPlaying: boolean = false;

  constructor() {
    super('WordBlitzScene');
  }

  protected getWordsForSession(): VocabularyItem[] {
    // Use 8 words for 16 cards (4x4 grid)
    const shuffled = this.shuffle([...this.vocabularySet.items]);
    return shuffled.slice(0, 8);
  }

  create(): void {
    super.create();

    // Title
    this.add.text(GAME_WIDTH / 2, 90, 'Word Blitz!', TEXT_STYLES.subtitle as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);

    // Timer display
    this.timerText = this.add.text(GAME_WIDTH / 2, 130, '60', {
      ...TEXT_STYLES.timer,
      color: COLOR_STRINGS.GOLD,
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);

    // Create card grid
    this.createCardGrid();

    // Start countdown
    this.startTimer();
  }

  private createCardGrid(): void {
    this.totalPairs = this.currentWords.length;
    this.matchedPairs = 0;

    // Create pairs of cards (word and meaning)
    const cardData: { item: VocabularyItem; type: 'word' | 'meaning' }[] = [];

    this.currentWords.forEach((word) => {
      cardData.push({ item: word, type: 'word' });
      cardData.push({ item: word, type: 'meaning' });
    });

    // Shuffle cards
    const shuffledCards = this.shuffle(cardData);

    // Grid layout (4 columns)
    const cols = 4;
    const rows = Math.ceil(shuffledCards.length / cols);
    const cardWidth = 170;
    const cardHeight = 80;
    const startX = (GAME_WIDTH - (cols * cardWidth + (cols - 1) * 10)) / 2 + cardWidth / 2;
    const startY = 200;
    const gapX = cardWidth + 10;
    const gapY = cardHeight + 10;

    shuffledCards.forEach((data, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * gapX;
      const y = startY + row * gapY;

      const card = this.createBlitzCard(x, y, data.item, data.type, cardWidth, cardHeight);
      this.cards.push(card);
    });

    this.isPlaying = true;
  }

  private createBlitzCard(
    x: number,
    y: number,
    item: VocabularyItem,
    type: 'word' | 'meaning',
    width: number,
    height: number
  ): BlitzCard {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.rectangle(0, 0, width, height, COLORS.BG_CARD)
      .setStrokeStyle(2, type === 'word' ? COLORS.PRIMARY : COLORS.SECONDARY);

    // Text
    const displayText = type === 'word' ? item.word : item.meaning;
    const truncated = displayText.length > 18 ? displayText.substring(0, 15) + '...' : displayText;

    const label = this.add.text(0, 0, truncated, {
      ...TEXT_STYLES.body,
      fontSize: displayText.length > 12 ? '12px' : '14px',
      wordWrap: { width: width - 20 },
      align: 'center',
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    const blitzCard: BlitzCard = {
      container,
      item,
      type,
      selected: false,
      matched: false,
    };

    container.setData('blitzCard', blitzCard);
    container.setData('bg', bg);

    container.on('pointerdown', () => {
      if (this.isPlaying) {
        this.handleCardClick(blitzCard);
      }
    });

    // Initial animation
    container.setAlpha(0);
    container.setScale(0.8);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 200,
      delay: 50 * (this.cards.length),
      ease: 'Back.easeOut',
    });

    return blitzCard;
  }

  private handleCardClick(card: BlitzCard): void {
    if (card.matched) return;

    this.audio.playSoundEffect('click');

    const bg = card.container.getData('bg') as Phaser.GameObjects.Rectangle;

    if (this.selectedCard === null) {
      // First selection
      this.selectedCard = card;
      card.selected = true;
      bg.setFillStyle(COLORS.PRIMARY);
    } else if (this.selectedCard === card) {
      // Deselect
      this.selectedCard = null;
      card.selected = false;
      bg.setFillStyle(COLORS.BG_CARD);
    } else {
      // Second selection - check for match
      const firstCard = this.selectedCard;
      const secondCard = card;

      // Must be different types and same word
      if (
        firstCard.item.id === secondCard.item.id &&
        firstCard.type !== secondCard.type
      ) {
        // Match!
        this.handleMatch(firstCard, secondCard);
      } else {
        // No match
        this.handleNoMatch(firstCard, secondCard);
      }

      this.selectedCard = null;
    }
  }

  private handleMatch(card1: BlitzCard, card2: BlitzCard): void {
    card1.matched = true;
    card2.matched = true;

    const bg1 = card1.container.getData('bg') as Phaser.GameObjects.Rectangle;
    const bg2 = card2.container.getData('bg') as Phaser.GameObjects.Rectangle;

    bg1.setFillStyle(COLORS.CORRECT);
    bg2.setFillStyle(COLORS.CORRECT);

    this.matchedPairs++;
    this.handleCorrectAnswer(card1.item.id, 0);

    // Pop animation
    this.tweens.add({
      targets: [card1.container, card2.container],
      scale: 1.1,
      duration: 100,
      yoyo: true,
    });

    // Fade out matched cards
    this.time.delayedCall(300, () => {
      this.tweens.add({
        targets: [card1.container, card2.container],
        alpha: 0.3,
        duration: 200,
      });
    });

    // Check for completion
    if (this.matchedPairs >= this.totalPairs) {
      this.handleWin();
    }
  }

  private handleNoMatch(card1: BlitzCard, card2: BlitzCard): void {
    const bg1 = card1.container.getData('bg') as Phaser.GameObjects.Rectangle;
    const bg2 = card2.container.getData('bg') as Phaser.GameObjects.Rectangle;

    bg1.setFillStyle(COLORS.INCORRECT);
    bg2.setFillStyle(COLORS.INCORRECT);

    this.audio.playSoundEffect('incorrect');

    // Shake animation
    this.tweens.add({
      targets: [card1.container, card2.container],
      x: '+=10',
      duration: 50,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        bg1.setFillStyle(COLORS.BG_CARD);
        bg2.setFillStyle(COLORS.BG_CARD);
        card1.selected = false;
        card2.selected = false;
      },
    });
  }

  private startTimer(): void {
    this.timeRemaining = 60;
    this.updateTimerDisplay();

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeRemaining--;
        this.updateTimerDisplay();

        if (this.timeRemaining <= 0) {
          this.handleTimeout();
        }
      },
      loop: true,
    });
  }

  private updateTimerDisplay(): void {
    this.timerText.setText(this.timeRemaining.toString());

    // Warning color
    if (this.timeRemaining <= 10) {
      this.timerText.setStyle({ color: COLOR_STRINGS.INCORRECT });

      // Pulse animation
      this.tweens.add({
        targets: this.timerText,
        scale: { from: 1.2, to: 1 },
        duration: 200,
      });
    } else if (this.timeRemaining <= 30) {
      this.timerText.setStyle({ color: COLOR_STRINGS.WARNING });
    }
  }

  private handleWin(): void {
    this.isPlaying = false;
    this.timerEvent.destroy();

    // Bonus points for time remaining
    const timeBonus = this.timeRemaining * 5;
    this.score += timeBonus;
    this.progress.addPoints(timeBonus);

    this.audio.playSoundEffect('levelup');

    // Show win message
    this.showBlitzResults('🎉 Complete!', `Time bonus: +${timeBonus}`);
  }

  private handleTimeout(): void {
    this.isPlaying = false;
    this.timerEvent.destroy();

    this.audio.playSoundEffect('incorrect');

    // Show timeout message
    this.showBlitzResults("⏰ Time's up!", `Matched: ${this.matchedPairs}/${this.totalPairs}`);
  }

  private showBlitzResults(title: string, subtitle: string): void {
    // Overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
    );

    // Results card
    const card = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      350,
      250,
      COLORS.BG_CARD
    ).setStrokeStyle(4, COLORS.PRIMARY);

    // Title
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, title, TEXT_STYLES.title as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, subtitle, TEXT_STYLES.body as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);

    // Score
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, `Score: ${this.score}`, TEXT_STYLES.score as Phaser.Types.GameObjects.Text.TextStyle)
      .setOrigin(0.5);

    // Continue button
    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 'Continue', () => {
      this.completeGame();
    });
  }
}
