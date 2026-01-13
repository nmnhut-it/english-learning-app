#!/usr/bin/env node
/**
 * Scaffold Generator for TheLostChapter
 * Creates new book or chapter templates.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '../../content');

function createBook(bookId, title = 'New Book', author = 'Unknown') {
  const bookDir = join(CONTENT_DIR, 'books', bookId);
  const chaptersDir = join(bookDir, 'chapters');
  const mediaDir = join(CONTENT_DIR, 'media', bookId);

  if (existsSync(bookDir)) {
    console.error(`Error: Book '${bookId}' already exists`);
    process.exit(1);
  }

  // Create directories
  mkdirSync(chaptersDir, { recursive: true });
  mkdirSync(join(mediaDir, 'audio'), { recursive: true });
  mkdirSync(join(mediaDir, 'images'), { recursive: true });

  // Create book.json
  const book = {
    id: bookId,
    title: title,
    author: author,
    language: 'en',
    coverImage: 'cover.jpg',
    description: 'Book description here.',
    chapters: ['ch01']
  };

  writeFileSync(join(bookDir, 'book.json'), JSON.stringify(book, null, 2));

  // Create first chapter
  createChapter(bookId, 'ch01', 'Chapter 1');

  console.log(`✓ Created book: ${bookId}`);
  console.log(`  - ${bookDir}/book.json`);
  console.log(`  - ${chaptersDir}/ch01.json`);
  console.log(`  - ${mediaDir}/audio/`);
  console.log(`  - ${mediaDir}/images/`);
  console.log(`\nNext steps:`);
  console.log(`  1. Add cover image to media/${bookId}/images/cover.jpg`);
  console.log(`  2. Edit content/books/${bookId}/book.json`);
  console.log(`  3. Edit content/books/${bookId}/chapters/ch01.json`);
}

function createChapter(bookId, chapterId, title = 'New Chapter') {
  const bookDir = join(CONTENT_DIR, 'books', bookId);
  const chaptersDir = join(bookDir, 'chapters');

  if (!existsSync(bookDir)) {
    console.error(`Error: Book '${bookId}' does not exist`);
    process.exit(1);
  }

  const chapterPath = join(chaptersDir, `${chapterId}.json`);
  if (existsSync(chapterPath)) {
    console.error(`Error: Chapter '${chapterId}' already exists`);
    process.exit(1);
  }

  const chapter = {
    id: chapterId,
    title: title,
    sections: [
      {
        type: 'markdown',
        content: `# ${title}\n\nChapter content here.`
      },
      {
        type: 'audio',
        src: `${chapterId}-narration.mp3`,
        transcript: 'Audio transcript here.',
        timestamps: []
      },
      {
        type: 'exercise',
        exerciseType: 'multiple_choice',
        question: 'Sample question?',
        options: ['Option A', 'Option B', 'Option C'],
        correct: 0,
        feedback: {
          correct: 'Correct!',
          incorrect: 'Try again.'
        }
      }
    ]
  };

  writeFileSync(chapterPath, JSON.stringify(chapter, null, 2));

  // Update book.json to include new chapter
  const bookPath = join(bookDir, 'book.json');
  const book = JSON.parse(readFileSync(bookPath, 'utf-8'));
  if (!book.chapters.includes(chapterId)) {
    book.chapters.push(chapterId);
    writeFileSync(bookPath, JSON.stringify(book, null, 2));
  }

  console.log(`✓ Created chapter: ${chapterId}`);
  console.log(`  - ${chapterPath}`);
}

// Parse arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'book') {
  const bookId = args[1] || `book-${Date.now()}`;
  const title = args[2] || 'New Book';
  const author = args[3] || 'Unknown';
  createBook(bookId, title, author);
} else if (command === 'chapter') {
  const bookId = args[1];
  const chapterId = args[2] || `ch${String(Date.now()).slice(-2)}`;
  const title = args[3] || 'New Chapter';

  if (!bookId) {
    console.error('Usage: scaffold.js chapter <book-id> [chapter-id] [title]');
    process.exit(1);
  }

  createChapter(bookId, chapterId, title);
} else {
  console.log(`
TheLostChapter Scaffold Generator

Usage:
  node scaffold.js book [book-id] [title] [author]
  node scaffold.js chapter <book-id> [chapter-id] [title]

Examples:
  node scaffold.js book my-story "My Story" "John Doe"
  node scaffold.js chapter my-story ch02 "The Journey Continues"
  `);
}
