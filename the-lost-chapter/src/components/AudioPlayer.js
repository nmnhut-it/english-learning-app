/**
 * AudioPlayer Component - Fixed bottom audio controls
 */

export function createAudioPlayer(container, { src, timestamps = [], onTimeUpdate }) {
  const state = {
    playing: false,
    currentTime: 0,
    duration: 0,
    speed: 1
  };

  const audio = new Audio(src);
  audio.preload = 'metadata';

  function render() {
    container.innerHTML = `
      <div class="audio-controls">
        <button class="audio-skip-btn" data-action="back">&#9668;&#9668;</button>
        <button class="audio-play-btn" data-action="play">&#9654;</button>
        <button class="audio-skip-btn" data-action="forward">&#9658;&#9658;</button>
      </div>
      <div class="audio-progress-container">
        <div class="audio-progress">
          <div class="audio-progress-bar"></div>
        </div>
        <div class="audio-times">
          <span class="audio-current">0:00</span>
          <span class="audio-duration">0:00</span>
        </div>
      </div>
      <div class="audio-speed">
        <button class="audio-speed-btn ${state.speed === 0.75 ? 'active' : ''}" data-speed="0.75">0.75x</button>
        <button class="audio-speed-btn ${state.speed === 1 ? 'active' : ''}" data-speed="1">1x</button>
        <button class="audio-speed-btn ${state.speed === 1.25 ? 'active' : ''}" data-speed="1.25">1.25x</button>
        <button class="audio-speed-btn ${state.speed === 1.5 ? 'active' : ''}" data-speed="1.5">1.5x</button>
      </div>
    `;
    container.style.display = 'flex';
    bindEvents();
  }

  function bindEvents() {
    // Play/pause
    container.querySelector('[data-action="play"]').addEventListener('click', toggle);

    // Skip buttons
    container.querySelector('[data-action="back"]').addEventListener('click', () => skip(-10));
    container.querySelector('[data-action="forward"]').addEventListener('click', () => skip(10));

    // Progress bar click
    container.querySelector('.audio-progress').addEventListener('click', seekTo);

    // Speed buttons
    container.querySelectorAll('.audio-speed-btn').forEach(btn => {
      btn.addEventListener('click', () => setSpeed(parseFloat(btn.dataset.speed)));
    });

    // Audio events
    audio.addEventListener('loadedmetadata', () => {
      state.duration = audio.duration;
      updateDisplay();
    });

    audio.addEventListener('timeupdate', () => {
      state.currentTime = audio.currentTime;
      updateDisplay();
      onTimeUpdate?.(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      state.playing = false;
      updatePlayButton();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
  }

  function toggle() {
    if (state.playing) {
      pause();
    } else {
      play();
    }
  }

  function play() {
    audio.play();
    state.playing = true;
    updatePlayButton();
  }

  function pause() {
    audio.pause();
    state.playing = false;
    updatePlayButton();
  }

  function skip(seconds) {
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, state.duration));
  }

  function seekTo(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * state.duration;
  }

  function setSpeed(speed) {
    state.speed = speed;
    audio.playbackRate = speed;
    container.querySelectorAll('.audio-speed-btn').forEach(btn => {
      btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
    });
  }

  function updateDisplay() {
    const progress = (state.currentTime / state.duration) * 100 || 0;
    container.querySelector('.audio-progress-bar').style.width = `${progress}%`;
    container.querySelector('.audio-current').textContent = formatTime(state.currentTime);
    container.querySelector('.audio-duration').textContent = formatTime(state.duration);
  }

  function updatePlayButton() {
    const btn = container.querySelector('[data-action="play"]');
    btn.innerHTML = state.playing ? '&#10074;&#10074;' : '&#9654;';
  }

  function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function handleKeyboard(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        toggle();
        break;
      case 'ArrowLeft':
        skip(-5);
        break;
      case 'ArrowRight':
        skip(5);
        break;
    }
  }

  function loadAndPlay(newSrc) {
    audio.src = newSrc;
    audio.load();
    play();
  }

  function destroy() {
    audio.pause();
    audio.src = '';
    document.removeEventListener('keydown', handleKeyboard);
    container.innerHTML = '';
  }

  render();

  return {
    play,
    pause,
    toggle,
    skip,
    seek: (time) => { audio.currentTime = time; },
    loadAndPlay,
    destroy,
    get currentTime() { return audio.currentTime; },
    get duration() { return state.duration; },
    get playing() { return state.playing; }
  };
}
