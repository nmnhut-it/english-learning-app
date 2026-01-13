#!/usr/bin/env node
/**
 * Content Validator for TheLostChapter
 * Validates book and chapter JSON files against schema.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '../../content');

const VALID_SECTION_TYPES = ['audio', 'markdown', 'image', 'exercise', 'video', 'pause'];
const VALID_EXERCISE_TYPES = ['multiple_choice', 'true_false', 'fill_blank', 'matching', 'ordering', 'vocabulary', 'listening'];

function validateBook(bookId) {
  const errors = [];
  const warnings = [];
  const bookDir = join(CONTENT_DIR, 'books', bookId);

  // Check book.json exists
  const bookJsonPath = join(bookDir, 'book.json');
  if (!existsSync(bookJsonPath)) {
    errors.push(`Missing book.json for ${bookId}`);
    return { errors, warnings };
  }

  let book;
  try {
    book = JSON.parse(readFileSync(bookJsonPath, 'utf-8'));
  } catch (e) {
    errors.push(`Invalid JSON in book.json: ${e.message}`);
    return { errors, warnings };
  }

  // Required fields
  if (!book.id) errors.push('Missing required field: id');
  if (!book.title) errors.push('Missing required field: title');
  if (!book.chapters || !Array.isArray(book.chapters)) {
    errors.push('Missing or invalid chapters array');
  }

  // Validate each chapter
  if (book.chapters) {
    for (const chapterId of book.chapters) {
      const chapterResult = validateChapter(bookId, chapterId);
      errors.push(...chapterResult.errors.map(e => `[${chapterId}] ${e}`));
      warnings.push(...chapterResult.warnings.map(w => `[${chapterId}] ${w}`));
    }
  }

  // Check cover image
  if (book.coverImage) {
    const coverPath = join(CONTENT_DIR, 'media', bookId, 'images', book.coverImage);
    if (!existsSync(coverPath)) {
      warnings.push(`Cover image not found: ${book.coverImage}`);
    }
  }

  return { errors, warnings };
}

function validateChapter(bookId, chapterId) {
  const errors = [];
  const warnings = [];

  const chapterPath = join(CONTENT_DIR, 'books', bookId, 'chapters', `${chapterId}.json`);

  if (!existsSync(chapterPath)) {
    errors.push(`Chapter file not found: ${chapterId}.json`);
    return { errors, warnings };
  }

  let chapter;
  try {
    chapter = JSON.parse(readFileSync(chapterPath, 'utf-8'));
  } catch (e) {
    errors.push(`Invalid JSON: ${e.message}`);
    return { errors, warnings };
  }

  // Required fields
  if (!chapter.id) errors.push('Missing required field: id');
  if (!chapter.title) errors.push('Missing required field: title');
  if (!chapter.sections || !Array.isArray(chapter.sections)) {
    errors.push('Missing or invalid sections array');
    return { errors, warnings };
  }

  // Validate sections
  chapter.sections.forEach((section, index) => {
    const sectionErrors = validateSection(section, bookId, index);
    errors.push(...sectionErrors.errors);
    warnings.push(...sectionErrors.warnings);
  });

  return { errors, warnings };
}

function validateSection(section, bookId, index) {
  const errors = [];
  const warnings = [];
  const prefix = `Section ${index}`;

  if (!section.type) {
    errors.push(`${prefix}: Missing type`);
    return { errors, warnings };
  }

  if (!VALID_SECTION_TYPES.includes(section.type)) {
    errors.push(`${prefix}: Invalid type '${section.type}'`);
    return { errors, warnings };
  }

  switch (section.type) {
    case 'markdown':
      if (!section.content) {
        errors.push(`${prefix}: Markdown section missing content`);
      }
      break;

    case 'audio':
      if (!section.src) {
        errors.push(`${prefix}: Audio section missing src`);
      } else if (!section.src.startsWith('http')) {
        const audioPath = join(CONTENT_DIR, 'media', bookId, 'audio', section.src);
        if (!existsSync(audioPath)) {
          warnings.push(`${prefix}: Audio file not found: ${section.src}`);
        }
      }
      if (!section.transcript) {
        warnings.push(`${prefix}: Audio section missing transcript`);
      }
      break;

    case 'image':
      if (!section.src) {
        errors.push(`${prefix}: Image section missing src`);
      } else if (!section.src.startsWith('http')) {
        const imagePath = join(CONTENT_DIR, 'media', bookId, 'images', section.src);
        if (!existsSync(imagePath)) {
          warnings.push(`${prefix}: Image file not found: ${section.src}`);
        }
      }
      if (!section.alt) {
        warnings.push(`${prefix}: Image section missing alt text`);
      }
      break;

    case 'exercise':
      if (!section.exerciseType) {
        errors.push(`${prefix}: Exercise missing exerciseType`);
      } else if (!VALID_EXERCISE_TYPES.includes(section.exerciseType)) {
        errors.push(`${prefix}: Invalid exerciseType '${section.exerciseType}'`);
      }
      if (!section.question) {
        errors.push(`${prefix}: Exercise missing question`);
      }
      validateExercise(section, prefix, errors, warnings);
      break;

    case 'video':
      if (!section.src && !section.youtubeId) {
        errors.push(`${prefix}: Video section missing src or youtubeId`);
      }
      break;

    case 'pause':
      // Optional fields, no required validation
      break;
  }

  return { errors, warnings };
}

function validateExercise(exercise, prefix, errors, warnings) {
  switch (exercise.exerciseType) {
    case 'multiple_choice':
    case 'true_false':
      if (!exercise.options || !Array.isArray(exercise.options)) {
        errors.push(`${prefix}: Missing options array`);
      } else if (exercise.correctIndex === undefined) {
        // Check if any option is marked correct
        const hasCorrect = exercise.options.some(o =>
          typeof o === 'object' ? o.correct : false
        );
        if (!hasCorrect) {
          errors.push(`${prefix}: No correct answer specified`);
        }
      }
      break;

    case 'fill_blank':
      if (!exercise.answer) {
        errors.push(`${prefix}: Fill blank missing answer`);
      }
      break;

    case 'matching':
      if (!exercise.pairs || !Array.isArray(exercise.pairs)) {
        errors.push(`${prefix}: Matching missing pairs array`);
      }
      break;

    case 'ordering':
      if (!exercise.items || !Array.isArray(exercise.items)) {
        errors.push(`${prefix}: Ordering missing items array`);
      }
      break;
  }
}

function main() {
  const args = process.argv.slice(2);
  let bookIds = [];

  if (args.length > 0) {
    bookIds = args;
  } else {
    // Validate all books
    const booksDir = join(CONTENT_DIR, 'books');
    if (existsSync(booksDir)) {
      bookIds = readdirSync(booksDir).filter(f => {
        const bookPath = join(booksDir, f, 'book.json');
        return existsSync(bookPath);
      });
    }
  }

  if (bookIds.length === 0) {
    console.log('No books found to validate.');
    return;
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  console.log('Validating TheLostChapter content...\n');

  for (const bookId of bookIds) {
    console.log(`Book: ${bookId}`);
    const { errors, warnings } = validateBook(bookId);

    if (errors.length === 0 && warnings.length === 0) {
      console.log('  ✓ Valid\n');
    } else {
      errors.forEach(e => console.log(`  ✗ ERROR: ${e}`));
      warnings.forEach(w => console.log(`  ⚠ WARNING: ${w}`));
      console.log();
    }

    totalErrors += errors.length;
    totalWarnings += warnings.length;
  }

  console.log('---');
  console.log(`Total: ${totalErrors} errors, ${totalWarnings} warnings`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
