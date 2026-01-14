/**
 * ContentBlock Component - Renders different section types
 */

import { parseMarkdown } from '../utils/markdown.js';
import { createExercise } from './ExerciseBlock.js';

export function createContentBlock(section, { bookId, onAudioPlay, onComplete }) {
  const element = document.createElement('div');
  element.className = `content-section section-${section.type}`;

  let cleanup = null;

  switch (section.type) {
    case 'markdown':
      renderMarkdown(element, section);
      break;
    case 'image':
      renderImage(element, section, bookId);
      break;
    case 'audio':
      cleanup = renderAudio(element, section, bookId, onAudioPlay);
      break;
    case 'exercise':
      cleanup = renderExercise(element, section, onComplete);
      break;
    case 'video':
      renderVideo(element, section);
      break;
    case 'pause':
      renderPause(element, section);
      break;
    default:
      element.innerHTML = `<p>Unknown section type: ${section.type}</p>`;
  }

  return { element, cleanup };
}

function renderMarkdown(element, section) {
  element.innerHTML = parseMarkdown(section.content);
}

function renderImage(element, section, bookId) {
  const src = section.src.startsWith('http')
    ? section.src
    : `/content/media/${bookId}/images/${section.src}`;

  element.innerHTML = `
    <figure>
      <img src="${src}" alt="${section.alt || ''}" loading="lazy">
      ${section.caption ? `<figcaption>${section.caption}</figcaption>` : ''}
    </figure>
  `;
}

function renderAudio(element, section, bookId, onAudioPlay) {
  const src = section.src.startsWith('http')
    ? section.src
    : `/content/media/${bookId}/audio/${section.src}`;

  const audio = new Audio(src);
  let isPlaying = false;

  element.innerHTML = `
    <div class="audio-player">
      <div class="player-controls">
        <button class="btn-play" aria-label="Play">
          <span class="icon-play">&#9654;</span>
          <span class="icon-pause" style="display:none;">&#10074;&#10074;</span>
        </button>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <span class="time-display">0:00 / 0:00</span>
        <button class="btn-speed">1x</button>
      </div>
      ${section.transcript ? `
        <div class="transcript">
          ${formatTranscript(section.transcript, section.timestamps)}
        </div>
      ` : ''}
    </div>
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
  let currentTimestampIndex = -1;

  btnPlay.addEventListener('click', () => {
    if (isPlaying) {
      audio.pause();
    } else {
      if (onAudioPlay) onAudioPlay(audio);
      audio.play();
    }
  });

  audio.addEventListener('play', () => {
    isPlaying = true;
    iconPlay.style.display = 'none';
    iconPause.style.display = 'inline';
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    iconPlay.style.display = 'inline';
    iconPause.style.display = 'none';
  });

  audio.addEventListener('timeupdate', () => {
    const percent = (audio.currentTime / audio.duration) * 100 || 0;
    progressFill.style.width = `${percent}%`;
    timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;

    if (section.timestamps && transcriptEl) {
      const newIndex = findCurrentTimestamp(audio.currentTime, section.timestamps);
      if (newIndex !== currentTimestampIndex) {
        currentTimestampIndex = newIndex;
        highlightTranscript(transcriptEl, newIndex);
      }
    }
  });

  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  });

  btnSpeed.addEventListener('click', () => {
    speedIndex = (speedIndex + 1) % speeds.length;
    audio.playbackRate = speeds[speedIndex];
    btnSpeed.textContent = `${speeds[speedIndex]}x`;
  });

  if (transcriptEl && section.timestamps) {
    transcriptEl.querySelectorAll('.ts-segment').forEach((seg, i) => {
      seg.addEventListener('click', () => {
        audio.currentTime = section.timestamps[i].start;
        if (!isPlaying) audio.play();
      });
    });
  }

  return () => {
    audio.pause();
    audio.src = '';
  };
}

function renderExercise(element, section, onComplete) {
  return createExercise(element, section, onComplete);
}

function renderVideo(element, section) {
  if (section.youtubeId) {
    element.innerHTML = `
      <div class="video-embed">
        <iframe
          src="https://www.youtube.com/embed/${section.youtubeId}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
    `;
  } else if (section.src) {
    element.innerHTML = `
      <video controls>
        <source src="${section.src}" type="video/mp4">
      </video>
    `;
  }
}

function renderPause(element, section) {
  element.innerHTML = `
    <div class="pause-message">
      ${section.message || 'Take a moment to reflect...'}
    </div>
    <button class="btn btn-secondary">Continue</button>
  `;

  element.querySelector('.btn').addEventListener('click', () => {
    element.classList.add('completed');
  });
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTranscript(transcript, timestamps) {
  if (!timestamps?.length) return `<p>${transcript}</p>`;
  return timestamps.map((ts, i) =>
    `<span class="ts-segment" data-index="${i}">${ts.text}</span>`
  ).join(' ');
}

function findCurrentTimestamp(currentTime, timestamps) {
  for (let i = timestamps.length - 1; i >= 0; i--) {
    if (currentTime >= timestamps[i].start) return i;
  }
  return -1;
}

function highlightTranscript(container, index) {
  container.querySelectorAll('.ts-segment').forEach((seg, i) => {
    seg.classList.toggle('active', i === index);
    seg.classList.toggle('past', i < index);
  });
}
