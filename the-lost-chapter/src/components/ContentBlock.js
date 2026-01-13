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
      renderVideo(element, section, bookId);
      break;
    case 'pause':
      renderPause(element, section);
      break;
    default:
      element.innerHTML = `<p>Unknown section type: ${section.type}</p>`;
  }

  return {
    element,
    highlightAtTime: section.type === 'audio' ? (time) => highlightTranscript(element, section, time) : null,
    destroy: () => cleanup?.()
  };
}

function renderMarkdown(element, section) {
  element.innerHTML = parseMarkdown(section.content);
}

function renderImage(element, section, bookId) {
  const src = section.src.startsWith('http')
    ? section.src
    : `./content/media/${bookId}/images/${section.src}`;

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
    : `./content/media/${bookId}/audio/${section.src}`;

  // Render transcript with clickable words
  let transcriptHtml = section.transcript || '';
  if (section.timestamps?.length) {
    transcriptHtml = section.timestamps
      .map((ts, i) => `<span class="word" data-start="${ts.start}" data-end="${ts.end}">${ts.text}</span>`)
      .join(' ');
  }

  element.innerHTML = `
    <div class="audio-transcript">${transcriptHtml}</div>
    <div class="audio-inline-player">
      <button class="btn btn-secondary audio-section-play">&#9654; Play Section</button>
    </div>
  `;

  const playBtn = element.querySelector('.audio-section-play');
  playBtn.addEventListener('click', () => onAudioPlay?.(src));

  // Click on word to seek
  element.querySelectorAll('.word').forEach(word => {
    word.addEventListener('click', () => {
      onAudioPlay?.(src);
      // Would need to communicate seek time to main player
    });
  });

  return () => {
    playBtn.removeEventListener('click', () => {});
  };
}

function highlightTranscript(element, section, time) {
  if (!section.timestamps?.length) return;

  element.querySelectorAll('.word').forEach(word => {
    const start = parseFloat(word.dataset.start);
    const end = parseFloat(word.dataset.end);
    word.classList.toggle('active', time >= start && time < end);
  });
}

function renderExercise(element, section, onComplete) {
  const exercise = createExercise(element, section, onComplete);
  return () => exercise.destroy?.();
}

function renderVideo(element, section, bookId) {
  const src = section.src.startsWith('http')
    ? section.src
    : `./content/media/${bookId}/video/${section.src}`;

  element.innerHTML = `
    <video controls preload="metadata">
      <source src="${src}" type="video/mp4">
      Your browser does not support video.
    </video>
    ${section.caption ? `<p class="video-caption">${section.caption}</p>` : ''}
  `;
}

function renderPause(element, section) {
  element.innerHTML = `
    <div class="reading-pause">
      <p>${section.message || 'Take a moment to reflect...'}</p>
      ${section.duration ? `<p class="pause-duration">Suggested: ${section.duration} seconds</p>` : ''}
    </div>
  `;
}
