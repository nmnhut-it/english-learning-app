/**
 * AudioService - Abstraction for all audio operations
 *
 * Provides TTS, beep sounds, and audio file playback.
 * Can be mocked for testing.
 */

import { EventBus, LectureEvents } from '../utils/EventBus';

export interface AudioServiceConfig {
  ttsRate?: number;
  ttsVietnameseRate?: number;
  beepVolume?: number;
  testMode?: boolean;
}

export interface AudioServiceInterface {
  speakTTS(text: string, lang?: string): Promise<void>;
  playBeep(freq?: number, duration?: number, type?: OscillatorType): Promise<void>;
  playRepeatSignal(): Promise<void>;
  playAudioFile(url: string): Promise<void>;
  cancel(): void;
  setConfig(config: Partial<AudioServiceConfig>): void;
}

export class AudioService implements AudioServiceInterface {
  private config: AudioServiceConfig;
  private audioContext: AudioContext | null = null;
  private eventBus: EventBus | null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(eventBus?: EventBus, config: AudioServiceConfig = {}) {
    this.eventBus = eventBus ?? null;
    this.config = {
      ttsRate: 0.85,
      ttsVietnameseRate: 1,
      beepVolume: 0.3,
      testMode: false,
      ...config,
    };
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setConfig(config: Partial<AudioServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Speak text using TTS
   */
  async speakTTS(text: string, lang: string = 'en-US'): Promise<void> {
    this.eventBus?.emit(LectureEvents.TTS_SPEAK, { text, lang });

    // In test mode, resolve immediately
    if (this.config.testMode) {
      await this.delay(10);
      this.eventBus?.emit(LectureEvents.TTS_END, { text, lang });
      return;
    }

    if (!('speechSynthesis' in window)) {
      this.eventBus?.emit(LectureEvents.TTS_END, { text, lang });
      return;
    }

    return new Promise((resolve) => {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = lang === 'vi-VN' ? this.config.ttsVietnameseRate! : this.config.ttsRate!;

      this.currentUtterance = utterance;

      utterance.onend = () => {
        this.currentUtterance = null;
        this.eventBus?.emit(LectureEvents.TTS_END, { text, lang });
        resolve();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        this.eventBus?.emit(LectureEvents.TTS_END, { text, lang, error: true });
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  }

  /**
   * Play a beep sound
   */
  async playBeep(freq: number = 880, duration: number = 150, type: OscillatorType = 'sine'): Promise<void> {
    this.eventBus?.emit(LectureEvents.BEEP, { freq, duration, type });

    // In test mode, resolve immediately
    if (this.config.testMode) {
      await this.delay(1);
      return;
    }

    return new Promise((resolve) => {
      try {
        const ctx = this.getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = freq;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(this.config.beepVolume!, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

        oscillator.start();
        oscillator.stop(ctx.currentTime + duration / 1000);

        setTimeout(resolve, duration);
      } catch (error) {
        resolve();
      }
    });
  }

  /**
   * Play "repeat after me" double beep signal
   */
  async playRepeatSignal(): Promise<void> {
    await this.playBeep(880, 100);
    await this.delay(80);
    await this.playBeep(1100, 100);
  }

  /**
   * Play an audio file
   */
  async playAudioFile(url: string): Promise<void> {
    this.eventBus?.emit(LectureEvents.AUDIO_PLAY, { url });

    // In test mode, resolve immediately
    if (this.config.testMode) {
      await this.delay(10);
      this.eventBus?.emit(LectureEvents.AUDIO_END, { url });
      return;
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        this.eventBus?.emit(LectureEvents.AUDIO_END, { url });
        resolve();
      };

      audio.onerror = () => {
        this.currentAudio = null;
        reject(new Error(`Failed to load audio: ${url}`));
      };

      audio.play().catch(reject);
    });
  }

  /**
   * Cancel current audio/TTS
   */
  cancel(): void {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    this.currentUtterance = null;

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

/**
 * Mock AudioService for testing - resolves immediately
 */
export class MockAudioService implements AudioServiceInterface {
  public calls: Array<{ method: string; args: unknown[] }> = [];
  private eventBus: EventBus | null;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus ?? null;
  }

  async speakTTS(text: string, lang: string = 'en-US'): Promise<void> {
    this.calls.push({ method: 'speakTTS', args: [text, lang] });
    this.eventBus?.emit(LectureEvents.TTS_SPEAK, { text, lang });
    this.eventBus?.emit(LectureEvents.TTS_END, { text, lang });
  }

  async playBeep(freq?: number, duration?: number, type?: OscillatorType): Promise<void> {
    this.calls.push({ method: 'playBeep', args: [freq, duration, type] });
    this.eventBus?.emit(LectureEvents.BEEP, { freq, duration, type });
  }

  async playRepeatSignal(): Promise<void> {
    this.calls.push({ method: 'playRepeatSignal', args: [] });
  }

  async playAudioFile(url: string): Promise<void> {
    this.calls.push({ method: 'playAudioFile', args: [url] });
    this.eventBus?.emit(LectureEvents.AUDIO_PLAY, { url });
    this.eventBus?.emit(LectureEvents.AUDIO_END, { url });
  }

  cancel(): void {
    this.calls.push({ method: 'cancel', args: [] });
  }

  setConfig(): void {
    // No-op for mock
  }

  clearCalls(): void {
    this.calls = [];
  }
}

// Factory function
export function createAudioService(
  eventBus?: EventBus,
  config?: AudioServiceConfig
): AudioServiceInterface {
  if (config?.testMode) {
    return new MockAudioService(eventBus);
  }
  return new AudioService(eventBus, config);
}
