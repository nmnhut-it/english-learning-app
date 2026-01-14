/**
 * AudioPlayer component with sentence sync
 */

import { getAudioUrl } from '../services/ContentService.js';
import { getAudioProgress, setAudioProgress, getSetting } from '../services/ProgressService.js';
import { t } from '../services/I18nService.js';

export function AudioPlayer(props) {
  const { bookId, audioFile, timestamps = [], onSentenceChange } = props;

  const el = document.createElement('div');
  el.className = 'audio-player';

  let audio = null;
  let isPlaying = false;
  let currentSentenceIndex = -1;

  function render() {
    const audioUrl = getAudioUrl(bookId, audioFile);
    const savedProgress = getAudioProgress(bookId, audioFile);
    const speed = getSetting('audioSpeed') || 1.0;

    el.innerHTML = `
      <div class="audio-player__header">
        <span class="audio-player__icon">🔊</span>
        <span class="audio-player__status" data-i18n="listening">${t('listening')}</span>
      </div>

      <div class="audio-player__controls">
        <button class="audio-player__btn audio-player__btn--skip" id="skip-back" aria-label="Back 10s">
          ⏪ -10s
        </button>
        <button class="audio-player__btn audio-player__btn--play" id="play-btn" aria-label="Play/Pause">
          ▶
        </button>
        <button class="audio-player__btn audio-player__btn--skip" id="skip-forward" aria-label="Forward 10s">
          +10s ⏩
        </button>
      </div>

      <div class="audio-player__progress">
        <input type="range" class="audio-player__slider" id="progress-slider" value="0" min="0" max="100" step="0.1">
        <div class="audio-player__times">
          <span id="current-time">0:00</span>
          <span id="total-time">0:00</span>
        </div>
      </div>

      <div class="audio-player__speed">
        <span>${t('speed')}:</span>
        <button class="audio-player__speed-btn ${speed === 0.75 ? 'active' : ''}" data-speed="0.75">0.75x</button>
        <button class="audio-player__speed-btn ${speed === 1.0 ? 'active' : ''}" data-speed="1">1x</button>
        <button class="audio-player__speed-btn ${speed === 1.5 ? 'active' : ''}" data-speed="1.5">1.5x</button>
      </div>

      <audio id="audio-element" src="${audioUrl}" preload="metadata"></audio>
    `;

    audio = el.querySelector('#audio-element');
    audio.playbackRate = speed;

    if (savedProgress > 0) {
      audio.currentTime = savedProgress;
    }

    bindEvents();
  }

  function bindEvents() {
    const playBtn = el.querySelector('#play-btn');
    const slider = el.querySelector('#progress-slider');
    const skipBack = el.querySelector('#skip-back');
    const skipForward = el.querySelector('#skip-forward');

    // Play/Pause
    playBtn.addEventListener('click', togglePlay);

    // Progress slider
    slider.addEventListener('input', (e) => {
      const percent = e.target.value;
      audio.currentTime = (percent / 100) * audio.duration;
    });

    // Skip buttons
    skipBack.addEventListener('click', () => {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
    });

    skipForward.addEventListener('click', () => {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    });

    // Speed buttons
    el.querySelectorAll('.audio-player__speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed);
        audio.playbackRate = speed;

        el.querySelectorAll('.audio-player__speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Save preference
        import('../services/ProgressService.js').then(m => m.setSetting('audioSpeed', speed));
      });
    });

    // Audio events
    audio.addEventListener('loadedmetadata', () => {
      el.querySelector('#total-time').textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', handleTimeUpdate);

    audio.addEventListener('ended', () => {
      isPlaying = false;
      playBtn.textContent = '▶';
      el.classList.remove('audio-player--playing');
    });

    audio.addEventListener('pause', () => {
      // Save progress on pause
      setAudioProgress(bookId, audioFile, audio.currentTime);
    });
  }

  function togglePlay() {
    const playBtn = el.querySelector('#play-btn');

    if (isPlaying) {
      audio.pause();
      playBtn.textContent = '▶';
      el.classList.remove('audio-player--playing');
    } else {
      audio.play();
      playBtn.textContent = '⏸';
      el.classList.add('audio-player--playing');
    }

    isPlaying = !isPlaying;
  }

  function handleTimeUpdate() {
    const currentTime = audio.currentTime;
    const duration = audio.duration || 0;

    // Update time display
    el.querySelector('#current-time').textContent = formatTime(currentTime);

    // Update slider
    const slider = el.querySelector('#progress-slider');
    slider.value = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Find current sentence
    if (timestamps.length > 0) {
      const sentenceIndex = timestamps.findIndex(
        ts => currentTime >= ts.start && currentTime < ts.end
      );

      if (sentenceIndex !== currentSentenceIndex) {
        currentSentenceIndex = sentenceIndex;
        if (onSentenceChange) {
          onSentenceChange(sentenceIndex, timestamps[sentenceIndex]);
        }
      }
    }
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function seekTo(time) {
    if (audio) {
      audio.currentTime = time;
    }
  }

  function play() {
    if (audio && !isPlaying) {
      togglePlay();
    }
  }

  function pause() {
    if (audio && isPlaying) {
      togglePlay();
    }
  }

  // Initialize
  render();

  return {
    el,
    seekTo,
    play,
    pause,
    destroy: () => {
      if (audio) {
        audio.pause();
        setAudioProgress(bookId, audioFile, audio.currentTime);
      }
      el.remove();
    }
  };
}
