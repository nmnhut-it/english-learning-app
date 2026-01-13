/**
 * Library Component - Book grid display
 */

import { ProgressService } from '../services/ProgressService.js';

export function createLibrary(container, books) {
  container.innerHTML = '';
  container.className = 'library';

  const header = document.createElement('div');
  header.className = 'library-header';
  header.innerHTML = `
    <h1>Your Library</h1>
    <p>Select a book to continue reading</p>
  `;

  if (books.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <p>No books in your library yet.</p>
      <p>Add books to the <code>content/books/</code> folder to get started.</p>
    `;
    container.append(header, empty);
    return { destroy: () => {} };
  }

  const grid = document.createElement('div');
  grid.className = 'book-grid';

  books.forEach(book => {
    const card = createBookCard(book);
    grid.appendChild(card);
  });

  container.append(header, grid);

  return {
    destroy: () => {
      container.innerHTML = '';
    }
  };
}

function createBookCard(book) {
  const progress = ProgressService.getProgress(book.id);
  const progressPercent = calculateProgress(book, progress);

  const card = document.createElement('a');
  card.href = `#/book/${book.id}`;
  card.className = 'book-card';

  const coverContent = book.coverImage
    ? `<img src="${book.coverImage}" alt="${book.title}">`
    : book.title.charAt(0).toUpperCase();

  card.innerHTML = `
    <div class="book-cover">${coverContent}</div>
    <div class="book-info">
      <div class="book-title">${book.title}</div>
      <div class="book-author">${book.author || 'Unknown'}</div>
      ${progressPercent > 0 ? `
        <div class="book-progress">
          <div class="book-progress-bar" style="width: ${progressPercent}%"></div>
        </div>
      ` : ''}
    </div>
  `;

  return card;
}

function calculateProgress(book, progress) {
  if (!progress || !book.chapters) return 0;
  const chapterIndex = book.chapters.indexOf(progress.chapterId);
  if (chapterIndex < 0) return 0;
  return Math.round((chapterIndex / book.chapters.length) * 100);
}
