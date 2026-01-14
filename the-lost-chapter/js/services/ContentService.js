/**
 * Content fetching service
 */

const CONTENT_BASE = './content/books';
let booksCache = null;
const bookCache = new Map();
const chapterCache = new Map();

export async function getBooks() {
  if (booksCache) return booksCache;

  try {
    const response = await fetch(`${CONTENT_BASE}/index.json`);
    if (!response.ok) throw new Error('Failed to fetch books');

    const data = await response.json();
    booksCache = data.books || [];
    return booksCache;
  } catch (error) {
    console.error('Error fetching books:', error);
    return [];
  }
}

export async function getBook(bookId) {
  if (bookCache.has(bookId)) {
    return bookCache.get(bookId);
  }

  try {
    const response = await fetch(`${CONTENT_BASE}/${bookId}/book.json`);
    if (!response.ok) throw new Error(`Failed to fetch book: ${bookId}`);

    const book = await response.json();
    bookCache.set(bookId, book);
    return book;
  } catch (error) {
    console.error('Error fetching book:', error);
    return null;
  }
}

export async function getChapter(bookId, chapterId) {
  const cacheKey = `${bookId}/${chapterId}`;

  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey);
  }

  try {
    const response = await fetch(`${CONTENT_BASE}/${bookId}/chapters/${chapterId}.json`);
    if (!response.ok) throw new Error(`Failed to fetch chapter: ${chapterId}`);

    const chapter = await response.json();
    chapterCache.set(cacheKey, chapter);
    return chapter;
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return null;
  }
}

export function getAudioUrl(bookId, audioFile) {
  return `${CONTENT_BASE}/${bookId}/audio/${audioFile}`;
}

export function getCoverUrl(bookId, coverImage) {
  if (!coverImage) return null;
  if (coverImage.startsWith('http')) return coverImage;
  return `${CONTENT_BASE}/${bookId}/${coverImage}`;
}

export function clearCache() {
  booksCache = null;
  bookCache.clear();
  chapterCache.clear();
}
