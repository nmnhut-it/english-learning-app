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
    description: 'Book description goes here.',
    chapters: ['ch01']
  };

  writeFileSync(
    join(bookDir, 'book.json'),
    JSON.stringify(book, null, 2)
  );

  // Create first chapter
  createChapter(bookId, 'ch01', 'Chapter 1', false);

  // Update library index
  updateLibraryIndex(book);

  console.log(`\nCreated book: ${bookId}`);
  console.log(`  Location: ${bookDir}`);
  console.log(`  Media: ${mediaDir}`);
  console.log('\nNext steps:');
  console.log(`  1. Add cover image to: ${join(mediaDir, 'images', 'cover.jpg')}`);
  console.log(`  2. Edit chapter content in: ${join(chaptersDir, 'ch01.json')}`);
  console.log(`  3. Run: npm run validate ${bookId}`);
}

function createChapter(bookId, chapterId, title = 'New Chapter', updateBook = true) {
  const bookDir = join(CONTENT_DIR, 'books', bookId);
  const chaptersDir = join(bookDir, 'chapters');
  const chapterPath = join(chaptersDir, `${chapterId}.json`);

  if (!existsSync(bookDir)) {
    console.error(`Error: Book '${bookId}' does not exist`);
    process.exit(1);
  }

  if (existsSync(chapterPath)) {
    console.error(`Error: Chapter '${chapterId}' already exists`);
    process.exit(1);
  }

  // Create chapter template
  const chapter = {
    id: chapterId,
    title: title,
    sections: [
      {
        type: 'markdown',
        content: `# ${title}\n\nIntroduction text goes here.`
      },
      {
        type: 'audio',
        src: `${chapterId}-narration.mp3`,
        transcript: 'Narration text goes here.',
        timestamps: []
      },
      {
        type: 'exercise',
        exerciseType: 'multiple_choice',
        question: 'Sample question?',
        options: [
          { text: 'Option A', correct: true },
          { text: 'Option B', correct: false },
          { text: 'Option C', correct: false }
        ],
        correctFeedback: 'Well done!',
        incorrectFeedback: 'Try again.'
      }
    ]
  };

  writeFileSync(chapterPath, JSON.stringify(chapter, null, 2));

  // Update book.json if requested
  if (updateBook) {
    const bookPath = join(bookDir, 'book.json');
    const book = JSON.parse(readFileSync(bookPath, 'utf-8'));

    if (!book.chapters.includes(chapterId)) {
      book.chapters.push(chapterId);
      writeFileSync(bookPath, JSON.stringify(book, null, 2));
    }
  }

  console.log(`\nCreated chapter: ${chapterId}`);
  console.log(`  Location: ${chapterPath}`);
  console.log('\nNext steps:');
  console.log(`  1. Edit chapter content`);
  console.log(`  2. Generate audio: npm run tts:batch -- --book ${bookId} --chapter ${chapterId}`);
}

function updateLibraryIndex(book) {
  const indexPath = join(CONTENT_DIR, 'books', 'index.json');

  let index = { books: [] };
  if (existsSync(indexPath)) {
    index = JSON.parse(readFileSync(indexPath, 'utf-8'));
  }

  // Check if book already in index
  const existing = index.books.findIndex(b => b.id === book.id);
  const entry = {
    id: book.id,
    title: book.title,
    author: book.author,
    language: book.language,
    coverImage: book.coverImage,
    description: book.description
  };

  if (existing >= 0) {
    index.books[existing] = entry;
  } else {
    index.books.push(entry);
  }

  writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage:');
    console.log('  Create book:    node scaffold.js book <book-id> [title] [author]');
    console.log('  Create chapter: node scaffold.js chapter <book-id> <chapter-id> [title]');
    console.log('');
    console.log('Examples:');
    console.log('  node scaffold.js book my-story "My Amazing Story" "John Doe"');
    console.log('  node scaffold.js chapter my-story ch02 "The Adventure Begins"');
    process.exit(0);
  }

  const type = args[0];

  switch (type) {
    case 'book':
      createBook(args[1], args[2], args[3]);
      break;
    case 'chapter':
      if (args.length < 3) {
        console.error('Error: chapter requires book-id and chapter-id');
        process.exit(1);
      }
      createChapter(args[1], args[2], args[3]);
      break;
    default:
      console.error(`Unknown type: ${type}`);
      process.exit(1);
  }
}

main();
