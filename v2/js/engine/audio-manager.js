/**
 * Audio Manager
 * Handles TTS and sound effects for classroom activities
 */

const AudioManager = {
  synth: window.speechSynthesis,
  isMuted: false,
  volume: 1.0,
  audioContext: null,

  // Get or create audio context
  getContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  },

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

    // Check for complex effects first
    if (this.complexEffects[type]) {
      this.complexEffects[type].call(this);
      return;
    }

    try {
      const ctx = this.getContext();
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
      tick: { frequency: 1200, duration: 0.03, waveType: 'square' },
      warning: { frequency: 600, duration: 0.1, waveType: 'triangle' },
    };
    return effects[type] || effects.click;
  },

  // Complex multi-note effects for classroom
  complexEffects: {
    // Applause/cheer sound simulation
    applause() {
      const ctx = this.getContext();
      const duration = 2.0;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < bufferSize; i++) {
          // Create clapping noise with rhythm
          const t = i / ctx.sampleRate;
          const envelope = Math.sin(t * Math.PI / duration) * (1 - t / duration);
          const clap = (Math.random() * 2 - 1) * Math.pow(Math.sin(t * 15), 4);
          data[i] = clap * envelope * 0.3;
        }
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      gainNode.gain.value = this.volume * 0.5;
      source.start();
    },

    // Countdown tick (3, 2, 1)
    countdown() {
      const ctx = this.getContext();
      const notes = [523, 523, 784]; // C5, C5, G5 (higher for GO!)
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }, i * 1000);
      });
    },

    // Time's up alarm
    timesUp() {
      const ctx = this.getContext();
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 800;
          osc.type = 'square';
          gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        }, i * 250);
      }
    },

    // Victory fanfare
    fanfare() {
      const ctx = this.getContext();
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'triangle';
          const duration = i === notes.length - 1 ? 0.5 : 0.15;
          gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        }, i * 150);
      });
    },

    // Drum roll for suspense
    drumroll() {
      const ctx = this.getContext();
      const duration = 1.5;
      for (let i = 0; i < 30; i++) {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 150 + Math.random() * 50;
          osc.type = 'triangle';
          const vol = (i / 30) * this.volume * 0.3;
          gain.gain.setValueAtTime(vol, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
          osc.start();
          osc.stop(ctx.currentTime + 0.05);
        }, i * (duration * 1000 / 30));
      }
    },

    // Start game horn
    gameStart() {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.2);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    },

    // Buzzer for wrong answer
    buzzer() {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 150;
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    },
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
