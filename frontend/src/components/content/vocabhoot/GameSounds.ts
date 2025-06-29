// Sound manager for VocabHoot
import correctSound from '../../../sound/correct.mp3';
import wrongSound from '../../../sound/wrong.mp3';
import tickSound from '../../../sound/tick.mp3';
import tinkSound from '../../../sound/tink.mp3';
import gameStartSound from '../../../sound/game-start.mp3';
import gameOverSound from '../../../sound/game-over.mp3';
import timeWarningSound from '../../../sound/time-warning.mp3';

class GameSounds {
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private enabled: boolean = true;

  constructor() {
    // Initialize all sounds
    this.sounds = {
      correct: new Audio(correctSound),
      wrong: new Audio(wrongSound),
      tick: new Audio(tickSound),
      tink: new Audio(tinkSound),
      gameStart: new Audio(gameStartSound),
      gameOver: new Audio(gameOverSound),
      timeWarning: new Audio(timeWarningSound),
    };

    // Set volumes
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0.5;
    });

    // Special settings
    this.sounds.tick.volume = 0.3;
    this.sounds.timeWarning.volume = 0.6;
  }

  play(soundName: keyof typeof this.sounds) {
    if (!this.enabled) return;
    
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.log('Sound play failed:', e));
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  stopAll() {
    Object.values(this.sounds).forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
  }
}

export default GameSounds;
