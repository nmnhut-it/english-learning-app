#!/usr/bin/env node
/**
 * Convert dialogue format from table to linear
 *
 * Table format:
 *   <dialogue>
 *   | English | Vietnamese |
 *   |---------|------------|
 *   | **Speaker:** text | **Speaker:** dịch |
 *   </dialogue>
 *
 * Linear format:
 *   <dialogue>
 *   **Speaker:** text
 *   </dialogue>
 *
 *   <translation>
 *   **Speaker:** dịch
 *   </translation>
 *
 * Usage:
 *   node convert-dialogue-format.js --grade 6
 *   node convert-dialogue-format.js --all
 *   node convert-dialogue-format.js --all --dry-run
 */

const fs = require('fs');
const path = require('path');

// Constants
const VOICE_LECTURES_DIR = 'v2/data/voice-lectures';
const GRADES = [6, 7, 8, 9, 10, 11];
const TABLE_HEADER_PATTERN = /\|\s*English\s*\|\s*Vietnamese\s*\|/i;
const TABLE_SEPARATOR_PATTERN = /\|\s*[-]+\s*\|\s*[-]+\s*\|/;

/**
 * Check if dialogue content is in table format
 */
function isTableFormat(content) {
  return TABLE_HEADER_PATTERN.test(content);
}

/**
 * Parse a table row and extract English + Vietnamese parts
 * Row format: | **Speaker:** English text | **Speaker:** Vietnamese text |
 */
function parseTableRow(row) {
  // Remove leading/trailing pipes and split
  const trimmed = row.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return null;
  }

  // Split by | and get middle parts
  const parts = trimmed.split('|').slice(1, -1);
  if (parts.length !== 2) {
    return null;
  }

  const english = parts[0].trim();
  const vietnamese = parts[1].trim();

  // Skip header and separator rows
  if (english.toLowerCase() === 'english' || english.match(/^[-]+$/)) {
    return null;
  }

  // Skip empty rows or separator markers
  if (english === '***' || english === '---') {
    return { english: '', vietnamese: '', isSeparator: true };
  }

  return { english, vietnamese, isSeparator: false };
}

/**
 * Convert table-format dialogue to linear format
 * Returns { dialogue, translation } strings
 */
function convertTableToLinear(dialogueContent) {
  const lines = dialogueContent.split('\n');
  const englishLines = [];
  const vietnameseLines = [];

  for (const line of lines) {
    const parsed = parseTableRow(line);
    if (parsed === null) continue;

    if (parsed.isSeparator) {
      // Preserve separators in output
      englishLines.push('');
      vietnameseLines.push('');
    } else if (parsed.english && parsed.vietnamese) {
      englishLines.push(parsed.english);
      vietnameseLines.push(parsed.vietnamese);
    }
  }

  if (englishLines.length === 0) {
    return null;
  }

  return {
    dialogue: englishLines.join('\n'),
    translation: vietnameseLines.join('\n')
  };
}

/**
 * Process a single file and convert table dialogues to linear
 */
function processFile(filePath, dryRun = false) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let conversions = 0;

  // Find all <dialogue>...</dialogue> blocks
  const dialogueRegex = /<dialogue>([\s\S]*?)<\/dialogue>/g;

  content = content.replace(dialogueRegex, (match, dialogueContent) => {
    // Check if this is table format
    if (!isTableFormat(dialogueContent)) {
      return match; // Already linear format, keep as-is
    }

    const converted = convertTableToLinear(dialogueContent);
    if (!converted) {
      console.warn(`  Warning: Could not parse table in ${filePath}`);
      return match;
    }

    modified = true;
    conversions++;

    // Build new linear format with separate translation block
    const newContent = `<dialogue>\n${converted.dialogue}\n</dialogue>\n\n<translation>\n${converted.translation}\n</translation>`;

    return newContent;
  });

  if (modified && !dryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return { modified, conversions };
}

/**
 * Recursively get all .md files in a directory
 */
function getAllMdFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...getAllMdFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Get all voice lecture files for a grade
 */
function getFilesForGrade(grade) {
  const gradeDir = path.join(VOICE_LECTURES_DIR, `g${grade}`);
  return getAllMdFiles(gradeDir);
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const gradeArg = args.find(a => a.startsWith('--grade'));
  const allGrades = args.includes('--all');

  if (!gradeArg && !allGrades) {
    console.log('Usage:');
    console.log('  node convert-dialogue-format.js --grade <N>   Convert specific grade');
    console.log('  node convert-dialogue-format.js --all         Convert all grades');
    console.log('  node convert-dialogue-format.js --all --dry-run  Preview changes');
    process.exit(1);
  }

  // Determine which grades to process
  let gradesToProcess = [];
  if (allGrades) {
    gradesToProcess = GRADES;
  } else {
    const grade = parseInt(gradeArg.split('=')[1] || args[args.indexOf('--grade') + 1]);
    if (!GRADES.includes(grade)) {
      console.error(`Invalid grade: ${grade}. Must be one of: ${GRADES.join(', ')}`);
      process.exit(1);
    }
    gradesToProcess = [grade];
  }

  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'CONVERT'}`);
  console.log(`Grades: ${gradesToProcess.join(', ')}\n`);

  let totalFiles = 0;
  let totalModified = 0;
  let totalConversions = 0;

  for (const grade of gradesToProcess) {
    const files = getFilesForGrade(grade);
    console.log(`Grade ${grade}: ${files.length} files`);

    for (const file of files) {
      totalFiles++;
      const { modified, conversions } = processFile(file, dryRun);

      if (modified) {
        totalModified++;
        totalConversions += conversions;
        const relPath = path.relative('.', file);
        console.log(`  ${dryRun ? '[WOULD CONVERT]' : '[CONVERTED]'} ${relPath} (${conversions} dialogues)`);
      }
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Files ${dryRun ? 'to be modified' : 'modified'}: ${totalModified}`);
  console.log(`Dialogues ${dryRun ? 'to be converted' : 'converted'}: ${totalConversions}`);
}

main();
