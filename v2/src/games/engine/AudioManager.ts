/**
 * Audio Manager for vocabulary games
 * Handles pronunciation playback and sound effects
 */

type SoundEffect = 'correct' | 'incorrect' | 'levelup' | 'click' | 'streak' | 'complete';

export class AudioManager {
  private synth: SpeechSynthesis;
  private audioContext: AudioContext | null = null;
  private audioCache: Map<string, AudioBuffer> = new Map();
  private soundEffects: Map<SoundEffect, string> = new Map();
  private isMuted: boolean = false;
  private volume: number = 1.0;

  constructor() {
    this.synth = window.speechSynthesis;
    this.initSoundEffects();
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Play pronunciation of a word
   */
  async playPronunciation(word: string, audioUrl?: string): Promise<void> {
    if (this.isMuted) return;

    this.init();

    if (audioUrl) {
      try {
        await this.playAudioFile(audioUrl);
      } catch (error) {
        console.warn('Failed to play audio file, falling back to TTS:', error);
        await this.playTTS(word);
      }
    } else {
      await this.playTTS(word);
    }
  }

  /**
   * Play sound effect
   */
  playSoundEffect(effect: SoundEffect): void {
    if (this.isMuted) return;

    this.init();

    // Using Web Audio API to generate simple tones for sound effects
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different frequencies and durations for different effects
    const effectSettings = this.getEffectSettings(effect);

    oscillator.type = effectSettings.waveType;
    oscillator.frequency.setValueAtTime(effectSettings.frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + effectSettings.duration);

    oscillator.start();
    oscillator.stop(ctx.currentTime + effectSettings.duration);
  }

  /**
   * Play audio file from URL
   */
  private async playAudioFile(url: string): Promise<void> {
    if (!this.audioContext) return;

    let buffer = this.audioCache.get(url);

    if (!buffer) {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      buffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioCache.set(url, buffer);
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    gainNode.gain.value = this.volume;

    source.start();

    return new Promise((resolve) => {
      source.onended = () => resolve();
    });
  }

  /**
   * Play text-to-speech
   */
  private playTTS(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // Slightly slower for learning
      utterance.pitch = 1.0;
      utterance.volume = this.volume;

      // Try to use a good English voice
      const voices = this.synth.getVoices();
      const englishVoice = voices.find(
        (voice) =>
          voice.lang.startsWith('en-') &&
          (voice.name.includes('Google') ||
            voice.name.includes('Microsoft') ||
            voice.name.includes('Samantha') ||
            voice.name.includes('Daniel'))
      ) || voices.find((voice) => voice.lang.startsWith('en-'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);

      this.synth.speak(utterance);
    });
  }

  /**
   * Get sound effect settings
   */
  private getEffectSettings(effect: SoundEffect): {
    frequency: number;
    duration: number;
    waveType: OscillatorType;
  } {
    const settings: Record<SoundEffect, { frequency: number; duration: number; waveType: OscillatorType }> = {
      correct: { frequency: 880, duration: 0.15, waveType: 'sine' },
      incorrect: { frequency: 220, duration: 0.3, waveType: 'sawtooth' },
      levelup: { frequency: 660, duration: 0.4, waveType: 'sine' },
      click: { frequency: 440, duration: 0.05, waveType: 'square' },
      streak: { frequency: 1000, duration: 0.2, waveType: 'sine' },
      complete: { frequency: 523, duration: 0.5, waveType: 'sine' },
    };

    return settings[effect];
  }

  /**
   * Initialize sound effect URLs (for future use with actual audio files)
   */
  private initSoundEffects(): void {
    this.soundEffects.set('correct', '/audio/effects/correct.mp3');
    this.soundEffects.set('incorrect', '/audio/effects/incorrect.mp3');
    this.soundEffects.set('levelup', '/audio/effects/levelup.mp3');
    this.soundEffects.set('click', '/audio/effects/click.mp3');
    this.soundEffects.set('streak', '/audio/effects/streak.mp3');
    this.soundEffects.set('complete', '/audio/effects/complete.mp3');
  }

  /**
   * Preload audio files for better performance
   */
  async preloadAudio(urls: string[]): Promise<void> {
    this.init();
    if (!this.audioContext) return;

    const promises = urls.map(async (url) => {
      if (this.audioCache.has(url)) return;

      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.audioCache.set(url, buffer);
      } catch (error) {
        console.warn(`Failed to preload audio: ${url}`, error);
      }
    });

    await Promise.all(promises);
  }

  // ==================== Controls ====================

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.synth.cancel();
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  /**
   * Stop all audio
   */
  stopAll(): void {
    this.synth.cancel();
    // Note: AudioBufferSourceNodes cannot be stopped after creation,
    // they will finish playing their current sound
  }

  /**
   * Resume audio context if suspended (for autoplay policy)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

// Singleton instance
let audioManagerInstance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}
