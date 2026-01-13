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
  const bookPath = join(bookDir, 'book.json');

  // Check book.json exists
  if (!existsSync(bookPath)) {
    errors.push(`book.json not found for ${bookId}`);
    return { valid: false, errors, warnings };
  }

  // Parse book.json
  let book;
  try {
    book = JSON.parse(readFileSync(bookPath, 'utf-8'));
  } catch (e) {
    errors.push(`Invalid JSON in book.json: ${e.message}`);
    return { valid: false, errors, warnings };
  }

  // Required fields
  if (!book.id) errors.push('Missing required field: id');
  if (!book.title) errors.push('Missing required field: title');
  if (!book.chapters || !Array.isArray(book.chapters)) {
    errors.push('Missing or invalid chapters array');
  }

  // Validate chapters exist
  if (book.chapters) {
    for (const chapterId of book.chapters) {
      const chapterPath = join(bookDir, 'chapters', `${chapterId}.json`);
      if (!existsSync(chapterPath)) {
        errors.push(`Chapter file not found: ${chapterId}.json`);
      } else {
        const chapterErrors = validateChapter(bookId, chapterId);
        errors.push(...chapterErrors.errors.map(e => `[${chapterId}] ${e}`));
        warnings.push(...chapterErrors.warnings.map(w => `[${chapterId}] ${w}`));
      }
    }
  }

  // Check media files
  if (book.coverImage) {
    const coverPath = join(CONTENT_DIR, 'media', bookId, 'images', book.coverImage);
    if (!existsSync(coverPath) && !book.coverImage.startsWith('http')) {
      warnings.push(`Cover image not found: ${book.coverImage}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validateChapter(bookId, chapterId) {
  const errors = [];
  const warnings = [];

  const chapterPath = join(CONTENT_DIR, 'books', bookId, 'chapters', `${chapterId}.json`);

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
    const sectionPrefix = `Section ${index + 1}`;

    if (!section.type) {
      errors.push(`${sectionPrefix}: Missing type`);
      return;
    }

    if (!VALID_SECTION_TYPES.includes(section.type)) {
      errors.push(`${sectionPrefix}: Invalid type '${section.type}'`);
      return;
    }

    // Type-specific validation
    switch (section.type) {
      case 'audio':
        if (!section.src) errors.push(`${sectionPrefix}: Audio missing src`);
        validateMediaFile(bookId, 'audio', section.src, errors, warnings, sectionPrefix);
        break;

      case 'image':
        if (!section.src) errors.push(`${sectionPrefix}: Image missing src`);
        if (!section.alt) warnings.push(`${sectionPrefix}: Image missing alt text`);
        validateMediaFile(bookId, 'images', section.src, errors, warnings, sectionPrefix);
        break;

      case 'markdown':
        if (!section.content) errors.push(`${sectionPrefix}: Markdown missing content`);
        break;

      case 'exercise':
        if (!section.exerciseType) {
          errors.push(`${sectionPrefix}: Exercise missing exerciseType`);
        } else if (!VALID_EXERCISE_TYPES.includes(section.exerciseType)) {
          errors.push(`${sectionPrefix}: Invalid exerciseType '${section.exerciseType}'`);
        }
        if (!section.question) errors.push(`${sectionPrefix}: Exercise missing question`);

        // Type-specific exercise validation
        if (section.exerciseType === 'multiple_choice' || section.exerciseType === 'true_false') {
          if (!section.options || !Array.isArray(section.options)) {
            errors.push(`${sectionPrefix}: Exercise missing options array`);
          } else if (typeof section.correct !== 'number' || section.correct >= section.options.length) {
            errors.push(`${sectionPrefix}: Invalid correct answer index`);
          }
        }
        if (section.exerciseType === 'fill_blank' && !section.answer) {
          errors.push(`${sectionPrefix}: Fill blank exercise missing answer`);
        }
        break;

      case 'video':
        if (!section.src) errors.push(`${sectionPrefix}: Video missing src`);
        break;
    }
  });

  return { errors, warnings };
}

function validateMediaFile(bookId, mediaType, filename, errors, warnings, prefix) {
  if (!filename || filename.startsWith('http')) return;

  const mediaPath = join(CONTENT_DIR, 'media', bookId, mediaType, filename);
  if (!existsSync(mediaPath)) {
    warnings.push(`${prefix}: Media file not found: ${filename}`);
  }
}

function validateAll() {
  const booksDir = join(CONTENT_DIR, 'books');
  if (!existsSync(booksDir)) {
    console.log('No books directory found');
    return;
  }

  const books = readdirSync(booksDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  if (books.length === 0) {
    console.log('No books found to validate');
    return;
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const bookId of books) {
    console.log(`\nValidating: ${bookId}`);
    const result = validateBook(bookId);

    if (result.errors.length > 0) {
      console.log('  Errors:');
      result.errors.forEach(e => console.log(`    - ${e}`));
      totalErrors += result.errors.length;
    }

    if (result.warnings.length > 0) {
      console.log('  Warnings:');
      result.warnings.forEach(w => console.log(`    - ${w}`));
      totalWarnings += result.warnings.length;
    }

    if (result.valid && result.warnings.length === 0) {
      console.log('  ✓ Valid');
    }
  }

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Total: ${totalErrors} errors, ${totalWarnings} warnings`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

// Run if called directly
const args = process.argv.slice(2);
if (args.length > 0) {
  const result = validateBook(args[0]);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
} else {
  validateAll();
}
