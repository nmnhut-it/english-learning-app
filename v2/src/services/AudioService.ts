import type { AudioFile, AudioAccent } from '@/types';

/**
 * Audio Service for handling TTS and pronunciation playback
 * Uses Web Audio API for optimal performance and caching
 */
export class AudioService {
  private static instance: AudioService;
  private audioContext: AudioContext | null = null;
  private audioCache: Map<string, AudioBuffer> = new Map();
  private currentPlayback: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isInitialized = false;
  
  // Configuration
  private readonly cacheMaxSize = 100;
  private readonly defaultVolume = 0.8;
  private readonly fadeInDuration = 0.1;
  private readonly fadeOutDuration = 0.2;
  
  // Voice preferences
  private voicePreferences: AudioAccent[] = ['british', 'american', 'australian'];
  private speechSynthesisVoices: SpeechSynthesisVoice[] = [];

  private constructor() {
    this.initializeSpeechSynthesis();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  /**
   * Initialize Audio Context (requires user interaction)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.defaultVolume;
      
      // Resume context if suspended (Chrome autoplay policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.isInitialized = true;
      console.log('AudioService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioService:', error);
      throw error;
    }
  }

  /**
   * Initialize Speech Synthesis
   */
  private initializeSpeechSynthesis(): void {
    if ('speechSynthesis' in window) {
      // Load voices
      speechSynthesis.addEventListener('voiceschanged', () => {
        this.speechSynthesisVoices = speechSynthesis.getVoices();
      });
      
      // Initial load
      this.speechSynthesisVoices = speechSynthesis.getVoices();
    }
  }

  /**
   * Play audio file with caching
   */
  public async playAudio(audioUrl: string, options?: PlaybackOptions): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.audioContext || !this.gainNode) {
      throw new Error('AudioService not properly initialized');
    }

    try {
      // Stop current playback
      if (this.currentPlayback) {
        this.stopCurrentPlayback();
      }

      // Get audio buffer (from cache or load)
      const audioBuffer = await this.getAudioBuffer(audioUrl);
      
      // Create source node
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);
      
      // Apply options
      if (options) {
        this.applyPlaybackOptions(source, options);
      }
      
      // Apply fade-in effect
      this.applyFadeIn();
      
      this.currentPlayback = source;
      
      // Play audio
      source.start(0);
      
      // Handle completion
      source.addEventListener('ended', () => {
        this.currentPlayback = null;
        options?.onEnded?.();
      });
      
      options?.onPlay?.();
      
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Play pronunciation using audio files or TTS fallback
   */
  public async playPronunciation(
    word: string, 
    audioFiles?: AudioFile[], 
    fallbackToTTS = true
  ): Promise<void> {
    // Try to play from audio files first
    if (audioFiles && audioFiles.length > 0) {
      const preferredAudio = this.selectPreferredAudio(audioFiles);
      if (preferredAudio) {
        try {
          await this.playAudio(preferredAudio.file);
          return;
        } catch (error) {
          console.warn('Failed to play audio file, falling back to TTS:', error);
        }
      }
    }
    
    // Fallback to TTS
    if (fallbackToTTS) {
      await this.speakText(word);
    }
  }

  /**
   * Text-to-Speech using Speech Synthesis API
   */
  public async speakText(text: string, options?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech Synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      const voice = this.selectPreferredVoice(options?.accent, options?.gender);
      if (voice) {
        utterance.voice = voice;
      }
      
      // Set options
      utterance.rate = options?.rate || 0.9;
      utterance.pitch = options?.pitch || 1;
      utterance.volume = options?.volume || this.defaultVolume;
      
      // Event handlers
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
      utterance.onstart = () => options?.onStart?.();
      
      // Speak
      speechSynthesis.speak(utterance);
    });
  }

  /**
   * Stop current audio playback
   */
  public stopPlayback(): void {
    this.stopCurrentPlayback();
    
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  /**
   * Pause current audio playback
   */
  public pausePlayback(): void {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  /**
   * Resume current audio playback
   */
  public resumePlayback(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Set master volume
   */
  public setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get current volume
   */
  public getVolume(): number {
    return this.gainNode?.gain.value || 0;
  }

  /**
   * Set voice preferences
   */
  public setVoicePreferences(accents: AudioAccent[]): void {
    this.voicePreferences = [...accents];
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.speechSynthesisVoices;
  }

  /**
   * Clear audio cache
   */
  public clearCache(): void {
    this.audioCache.clear();
  }

  /**
   * Get cache size
   */
  public getCacheSize(): number {
    return this.audioCache.size;
  }

  /**
   * Private method to get audio buffer with caching
   */
  private async getAudioBuffer(audioUrl: string): Promise<AudioBuffer> {
    // Check cache first
    if (this.audioCache.has(audioUrl)) {
      return this.audioCache.get(audioUrl)!;
    }

    // Fetch and decode audio
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);

    // Cache with size limit
    this.cacheAudioBuffer(audioUrl, audioBuffer);

    return audioBuffer;
  }

  /**
   * Cache audio buffer with LRU eviction
   */
  private cacheAudioBuffer(url: string, buffer: AudioBuffer): void {
    // Remove oldest if at capacity
    if (this.audioCache.size >= this.cacheMaxSize) {
      const firstKey = this.audioCache.keys().next().value;
      if (firstKey) {
        this.audioCache.delete(firstKey);
      }
    }
    
    this.audioCache.set(url, buffer);
  }

  /**
   * Select preferred audio file based on accent preferences
   */
  private selectPreferredAudio(audioFiles: AudioFile[]): AudioFile | null {
    for (const accent of this.voicePreferences) {
      const audio = audioFiles.find(file => file.accent === accent);
      if (audio) return audio;
    }
    
    // Return first available if no preferred accent found
    return audioFiles[0] || null;
  }

  /**
   * Select preferred TTS voice
   */
  private selectPreferredVoice(accent?: AudioAccent, gender?: 'male' | 'female'): SpeechSynthesisVoice | null {
    const voices = this.speechSynthesisVoices.filter(voice => voice.lang.startsWith('en'));
    
    if (accent) {
      const accentMap: Record<AudioAccent, string[]> = {
        british: ['en-GB'],
        american: ['en-US'],
        australian: ['en-AU'],
        canadian: ['en-CA']
      };
      
      const targetLangs = accentMap[accent];
      const accentVoices = voices.filter(voice => 
        targetLangs.some(lang => voice.lang.startsWith(lang))
      );
      
      if (accentVoices.length > 0) {
        if (gender) {
          const genderVoices = accentVoices.filter(voice => 
            voice.name.toLowerCase().includes(gender)
          );
          if (genderVoices.length > 0) {
            return genderVoices[0];
          }
        }
        return accentVoices[0];
      }
    }
    
    // Fallback to any English voice
    return voices[0] || null;
  }

  /**
   * Apply playback options to audio source
   */
  private applyPlaybackOptions(source: AudioBufferSourceNode, options: PlaybackOptions): void {
    if (options.playbackRate) {
      source.playbackRate.value = options.playbackRate;
    }
    
    if (options.loop) {
      source.loop = true;
    }
  }

  /**
   * Apply fade-in effect
   */
  private applyFadeIn(): void {
    if (this.gainNode && this.audioContext) {
      const currentTime = this.audioContext.currentTime;
      this.gainNode.gain.setValueAtTime(0, currentTime);
      this.gainNode.gain.linearRampToValueAtTime(
        this.defaultVolume, 
        currentTime + this.fadeInDuration
      );
    }
  }

  /**
   * Stop current playback with fade-out
   */
  private stopCurrentPlayback(): void {
    if (this.currentPlayback && this.gainNode && this.audioContext) {
      const currentTime = this.audioContext.currentTime;
      
      // Apply fade-out
      this.gainNode.gain.linearRampToValueAtTime(
        0, 
        currentTime + this.fadeOutDuration
      );
      
      // Stop after fade-out
      setTimeout(() => {
        if (this.currentPlayback) {
          this.currentPlayback.stop();
          this.currentPlayback = null;
        }
        
        // Restore volume
        if (this.gainNode) {
          this.gainNode.gain.value = this.defaultVolume;
        }
      }, this.fadeOutDuration * 1000);
    }
  }

  /**
   * Destroy service and clean up resources
   */
  public destroy(): void {
    this.stopPlayback();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.clearCache();
    this.isInitialized = false;
  }
}

// Supporting interfaces
interface PlaybackOptions {
  playbackRate?: number;
  loop?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

interface TTSOptions {
  accent?: AudioAccent;
  gender?: 'male' | 'female';
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
}

// Export singleton instance
export const audioService = AudioService.getInstance();