/**
 * Audio Manager
 * Handles TTS and sound effects
 */

const AudioManager = {
  synth: window.speechSynthesis,
  isMuted: false,
  volume: 1.0,

  // Play word pronunciation
  playWord(word) {
    if (this.isMuted) return;

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = this.volume;

    // Try to find a good English voice
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(v =>
      v.lang.startsWith('en-') &&
      (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Samantha'))
    ) || voices.find(v => v.lang.startsWith('en-'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    this.synth.speak(utterance);
  },

  // Play sound effect using Web Audio API
  playEffect(type) {
    if (this.isMuted) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const settings = this.getEffectSettings(type);

      oscillator.type = settings.waveType;
      oscillator.frequency.setValueAtTime(settings.frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + settings.duration);

      oscillator.start();
      oscillator.stop(ctx.currentTime + settings.duration);
    } catch (e) {
      console.warn('Could not play sound effect:', e);
    }
  },

  getEffectSettings(type) {
    const effects = {
      correct: { frequency: 880, duration: 0.15, waveType: 'sine' },
      incorrect: { frequency: 220, duration: 0.3, waveType: 'sawtooth' },
      click: { frequency: 440, duration: 0.05, waveType: 'square' },
      complete: { frequency: 523, duration: 0.5, waveType: 'sine' },
      streak: { frequency: 1000, duration: 0.2, waveType: 'sine' },
    };
    return effects[type] || effects.click;
  },

  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.synth.cancel();
    }
  },

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  },
};

// Load voices when available
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = () => {
    speechSynthesis.getVoices();
  };
}
