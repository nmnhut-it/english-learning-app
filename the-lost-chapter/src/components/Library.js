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
      <p>No books found.</p>
      <p>Add books to the <code>content/books/</code> folder to get started.</p>
    `;
    container.appendChild(header);
    container.appendChild(empty);
    return { element: container, destroy: () => {} };
  }

  const grid = document.createElement('div');
  grid.className = 'book-grid';

  books.forEach(book => {
    const progress = ProgressService.getProgress(book.id);
    const card = createBookCard(book, progress);
    grid.appendChild(card);
  });

  container.appendChild(header);
  container.appendChild(grid);

  return {
    element: container,
    destroy: () => {}
  };
}

function createBookCard(book, progress) {
  const card = document.createElement('a');
  card.className = 'book-card';
  card.href = `#/book/${book.id}`;

  const coverSrc = book.coverImage
    ? `/content/media/${book.id}/images/${book.coverImage}`
    : null;

  card.innerHTML = `
    <div class="book-cover">
      ${coverSrc ? `<img src="${coverSrc}" alt="${book.title}" loading="lazy">` : '&#128214;'}
    </div>
    <div class="book-info">
      <div class="book-title">${book.title}</div>
      <div class="book-author">${book.author || 'Unknown'}</div>
      ${progress ? `
        <div class="book-progress">
          <div class="book-progress-fill" style="width: ${progress.percent || 0}%"></div>
        </div>
      ` : ''}
    </div>
  `;

  return card;
}
