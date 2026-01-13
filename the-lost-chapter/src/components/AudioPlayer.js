/**
 * AudioPlayer Component - Audio playback with transcript sync
 */

export function createAudioPlayer(container, { src, transcript, timestamps, onTimeUpdate }) {
  const audio = new Audio(src);
  let isPlaying = false;
  let currentTimestampIndex = -1;

  const element = document.createElement('div');
  element.className = 'audio-player';
  element.innerHTML = `
    <div class="player-controls">
      <button class="btn-play" aria-label="Play">
        <span class="icon-play">&#9654;</span>
        <span class="icon-pause" style="display:none;">&#10074;&#10074;</span>
      </button>
      <div class="progress-bar">
        <div class="progress-fill"></div>
        <div class="progress-handle"></div>
      </div>
      <span class="time-display">0:00 / 0:00</span>
      <button class="btn-speed" aria-label="Playback speed">1x</button>
    </div>
    ${transcript ? `<div class="transcript">${formatTranscript(transcript, timestamps)}</div>` : ''}
  `;

  const btnPlay = element.querySelector('.btn-play');
  const iconPlay = element.querySelector('.icon-play');
  const iconPause = element.querySelector('.icon-pause');
  const progressBar = element.querySelector('.progress-bar');
  const progressFill = element.querySelector('.progress-fill');
  const timeDisplay = element.querySelector('.time-display');
  const btnSpeed = element.querySelector('.btn-speed');
  const transcriptEl = element.querySelector('.transcript');

  const speeds = [0.75, 1, 1.25, 1.5, 2];
  let speedIndex = 1;

  // Play/Pause toggle
  btnPlay.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  });

  audio.addEventListener('play', () => {
    isPlaying = true;
    iconPlay.style.display = 'none';
    iconPause.style.display = 'inline';
    element.classList.add('playing');
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    iconPlay.style.display = 'inline';
    iconPause.style.display = 'none';
    element.classList.remove('playing');
  });

  // Progress updates
  audio.addEventListener('timeupdate', () => {
    const percent = (audio.currentTime / audio.duration) * 100 || 0;
    progressFill.style.width = `${percent}%`;
    timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;

    // Highlight current transcript segment
    if (timestamps && transcriptEl) {
      const newIndex = findCurrentTimestamp(audio.currentTime, timestamps);
      if (newIndex !== currentTimestampIndex) {
        currentTimestampIndex = newIndex;
        highlightTranscript(transcriptEl, newIndex);
      }
    }

    if (onTimeUpdate) {
      onTimeUpdate(audio.currentTime, audio.duration);
    }
  });

  // Seek on progress bar click
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  });

  // Speed control
  btnSpeed.addEventListener('click', () => {
    speedIndex = (speedIndex + 1) % speeds.length;
    audio.playbackRate = speeds[speedIndex];
    btnSpeed.textContent = `${speeds[speedIndex]}x`;
  });

  // Click transcript to seek
  if (transcriptEl && timestamps) {
    transcriptEl.querySelectorAll('.ts-segment').forEach((seg, i) => {
      seg.addEventListener('click', () => {
        audio.currentTime = timestamps[i].start;
        if (!isPlaying) audio.play();
      });
    });
  }

  container.appendChild(element);

  return {
    element,
    audio,
    play: () => audio.play(),
    pause: () => audio.pause(),
    seek: (time) => { audio.currentTime = time; },
    setVolume: (vol) => { audio.volume = Math.max(0, Math.min(1, vol)); },
    destroy: () => {
      audio.pause();
      audio.src = '';
      element.remove();
    }
  };
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTranscript(transcript, timestamps) {
  if (!timestamps || !timestamps.length) {
    return `<p>${transcript}</p>`;
  }
  return timestamps.map((ts, i) =>
    `<span class="ts-segment" data-index="${i}">${ts.text}</span>`
  ).join(' ');
}

function findCurrentTimestamp(currentTime, timestamps) {
  for (let i = timestamps.length - 1; i >= 0; i--) {
    if (currentTime >= timestamps[i].start) {
      return i;
    }
  }
  return -1;
}

function highlightTranscript(container, index) {
  container.querySelectorAll('.ts-segment').forEach((seg, i) => {
    seg.classList.toggle('active', i === index);
    seg.classList.toggle('past', i < index);
  });
}
