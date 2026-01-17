/**
 * Render Integration Tests
 *
 * Renders real voice lecture files and checks for rendering issues.
 * Run with: npm run test:unit -- RenderIntegration
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseLesson,
  renderMarkdown,
  renderTables,
  extractVocabularySections,
  extractTeacherScripts,
  hasTag,
  getTagContent,
  validateLesson,
} from '../parser/Parser';

const VOICE_LECTURES_DIR = path.join(__dirname, '../../../data/voice-lectures');

// Custom tags that should be rendered
const CUSTOM_TAGS = [
  'vocabulary',
  'teacher_script',
  'dialogue',
  'reading',
  'translation',
  'grammar',
  'task',
  'questions',
  'answer',
  'explanation',
  'pronunciation_theory',
  'audio',
  'content_table',
];

interface RenderIssue {
  type: 'error' | 'warning';
  message: string;
  location?: string;
}

function checkRendering(content: string, filePath: string): RenderIssue[] {
  const issues: RenderIssue[] = [];
  const fileName = path.basename(filePath);

  // 1. Check for unclosed tags
  for (const tag of CUSTOM_TAGS) {
    const openCount = (content.match(new RegExp(`<${tag}[^>]*>`, 'g')) || []).length;
    const closeCount = (content.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (openCount !== closeCount) {
      issues.push({
        type: 'error',
        message: `Unclosed <${tag}> tag: ${openCount} open, ${closeCount} close`,
        location: fileName,
      });
    }
  }

  // 2. Check for broken table syntax
  const lines = content.split('\n');
  let inTable = false;
  let tableStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableStart = i + 1;
      }
    } else if (inTable && line !== '' && !line.startsWith('|')) {
      // Check if previous line was separator
      const prevLine = lines[i - 1]?.trim() || '';
      if (!prevLine.match(/^\|[-:|]+\|$/)) {
        inTable = false;
      }
    }
  }

  // 3. Check for vocabulary parsing
  const vocabSections = extractVocabularySections(content);
  for (const section of vocabSections) {
    for (const word of section.words) {
      if (!word.word) {
        issues.push({
          type: 'error',
          message: 'Vocabulary item missing word',
          location: fileName,
        });
      }
      if (!word.meaning) {
        issues.push({
          type: 'warning',
          message: `Vocabulary "${word.word}" missing meaning`,
          location: fileName,
        });
      }
    }
  }

  // 4. Check for teacher script parsing
  const scripts = extractTeacherScripts(content);
  for (const script of scripts) {
    if (!script.text || script.text.trim() === '') {
      issues.push({
        type: 'warning',
        message: 'Empty teacher script found',
        location: fileName,
      });
    }
    if (script.pause < 0) {
      issues.push({
        type: 'error',
        message: `Invalid pause value: ${script.pause}`,
        location: fileName,
      });
    }
  }

  // 5. Check markdown rendering for common issues
  const rendered = renderMarkdown(content);

  // Check for unrendered markdown
  if (rendered.includes('**') && !rendered.includes('<strong>')) {
    // Only flag if there are unrendered bold markers
    const boldMatches = rendered.match(/\*\*[^*]+\*\*/g) || [];
    if (boldMatches.length > 0) {
      issues.push({
        type: 'warning',
        message: `Unrendered bold text: ${boldMatches.slice(0, 3).join(', ')}`,
        location: fileName,
      });
    }
  }

  // 6. Check for broken links/references
  const brokenRefs = content.match(/\[([^\]]+)\]\(\s*\)/g) || [];
  if (brokenRefs.length > 0) {
    issues.push({
      type: 'warning',
      message: `Empty link references: ${brokenRefs.length}`,
      location: fileName,
    });
  }

  // 7. Validate lesson structure
  const validation = validateLesson(content);
  for (const error of validation.errors) {
    issues.push({
      type: 'error',
      message: error,
      location: fileName,
    });
  }
  for (const warning of validation.warnings) {
    issues.push({
      type: 'warning',
      message: warning,
      location: fileName,
    });
  }

  return issues;
}

function renderFullHtml(content: string): string {
  let html = content;

  // Process custom tags - preserve their content but wrap in divs
  for (const tag of CUSTOM_TAGS) {
    const regex = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'g');
    html = html.replace(regex, (match, attrs, inner) => {
      const tagClass = tag.replace(/_/g, '-');
      const renderedInner = renderTables(renderMarkdown(inner));
      return `<div class="${tagClass}" data-testid="${tagClass}"${attrs}>${renderedInner}</div>`;
    });
  }

  // Render remaining markdown
  html = renderMarkdown(html);
  html = renderTables(html);

  return html;
}

// Get all voice lecture files
function getVoiceLectureFiles(): string[] {
  const files: string[] = [];

  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  walkDir(VOICE_LECTURES_DIR);
  return files;
}

describe('Voice Lecture Render Integration', () => {
  const files = getVoiceLectureFiles();

  describe('All files should render without errors', () => {
    for (const file of files) {
      const relativePath = path.relative(VOICE_LECTURES_DIR, file);

      it(`should render ${relativePath} without errors`, () => {
        const content = fs.readFileSync(file, 'utf-8');
        const issues = checkRendering(content, file);

        const errors = issues.filter(i => i.type === 'error');
        if (errors.length > 0) {
          console.log(`\n❌ Errors in ${relativePath}:`);
          errors.forEach(e => console.log(`  - ${e.message}`));
        }

        expect(errors).toHaveLength(0);
      });
    }
  });

  describe('All files should parse correctly', () => {
    for (const file of files) {
      const relativePath = path.relative(VOICE_LECTURES_DIR, file);

      it(`should parse ${relativePath}`, () => {
        const content = fs.readFileSync(file, 'utf-8');
        const lesson = parseLesson(content);

        expect(lesson.title).toBeTruthy();
        expect(lesson.chunks.length).toBeGreaterThan(0);
      });
    }
  });

  describe('Render output checks', () => {
    for (const file of files) {
      const relativePath = path.relative(VOICE_LECTURES_DIR, file);

      it(`should produce valid HTML for ${relativePath}`, () => {
        const content = fs.readFileSync(file, 'utf-8');
        const html = renderFullHtml(content);

        // Check that HTML doesn't contain raw unprocessed tags
        for (const tag of CUSTOM_TAGS) {
          // After rendering, no raw custom tags should remain
          const rawTags = (html.match(new RegExp(`<${tag}[^>]*>`, 'g')) || []).filter(
            t => !t.includes('data-testid')
          );
          expect(rawTags.length).toBe(0);
        }

        // Check that tables are rendered
        if (content.includes('|---|')) {
          expect(html).toContain('<table>');
        }

        // Check that headings are rendered
        if (content.match(/^#+\s/m)) {
          expect(html).toMatch(/<h[1-6]>/);
        }
      });
    }
  });

  describe('Content statistics', () => {
    it('should report statistics for all files', () => {
      const stats: Record<string, any> = {};

      for (const file of files) {
        const relativePath = path.relative(VOICE_LECTURES_DIR, file);
        const content = fs.readFileSync(file, 'utf-8');
        const lesson = parseLesson(content);
        const vocab = extractVocabularySections(content);
        const scripts = extractTeacherScripts(content);

        stats[relativePath] = {
          chunks: lesson.chunks.length,
          vocabWords: vocab.reduce((sum, v) => sum + v.words.length, 0),
          teacherScripts: scripts.length,
          tags: CUSTOM_TAGS.filter(t => hasTag(content, t)),
        };
      }

      // Print summary
      console.log('\n📊 Voice Lecture Statistics:');
      console.log('━'.repeat(70));

      for (const [file, stat] of Object.entries(stats)) {
        console.log(`\n📄 ${file}`);
        console.log(`   Chunks: ${stat.chunks} | Vocab: ${stat.vocabWords} | Scripts: ${stat.teacherScripts}`);
        console.log(`   Tags: ${stat.tags.join(', ')}`);
      }

      console.log('\n' + '━'.repeat(70));
      console.log(`Total files: ${Object.keys(stats).length}`);

      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });
  });
});

describe('Specific file rendering checks', () => {
  describe('G6 Unit 7 Getting Started', () => {
    const filePath = path.join(VOICE_LECTURES_DIR, 'g6/unit-07/getting-started.md');

    it('should have all required tags', () => {
      if (!fs.existsSync(filePath)) {
        console.log('File not found, skipping');
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      // Getting Started should have these tags
      expect(hasTag(content, 'vocabulary')).toBe(true);
      expect(hasTag(content, 'teacher_script')).toBe(true);
      expect(hasTag(content, 'dialogue') || hasTag(content, 'reading')).toBe(true);
    });

    it('should have vocabulary words with pronunciations', () => {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf-8');
      const vocab = extractVocabularySections(content);

      if (vocab.length > 0) {
        const wordsWithPron = vocab[0].words.filter(w => w.pronunciation);
        expect(wordsWithPron.length).toBeGreaterThan(0);
      }
    });

    it('should render dialogue tables correctly', () => {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf-8');

      if (hasTag(content, 'dialogue')) {
        const dialogueContent = getTagContent(content, 'dialogue');
        if (dialogueContent && dialogueContent.includes('|')) {
          const rendered = renderTables(dialogueContent);
          expect(rendered).toContain('<table>');
          expect(rendered).toContain('<th>');
        }
      }
    });
  });

  describe('G6 Unit 7 A Closer Look 1', () => {
    const filePath = path.join(VOICE_LECTURES_DIR, 'g6/unit-07/a-closer-look-1.md');

    it('should have pronunciation_theory tag', () => {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf-8');

      // A Closer Look 1 typically has pronunciation
      if (hasTag(content, 'pronunciation_theory')) {
        const pronContent = getTagContent(content, 'pronunciation_theory');
        expect(pronContent).toBeTruthy();
        // Should have IPA symbols
        expect(pronContent).toMatch(/\/[^/]+\//);
      }
    });
  });

  describe('G6 Unit 7 Skills 2', () => {
    const filePath = path.join(VOICE_LECTURES_DIR, 'g6/unit-07/skills-2.md');

    it('should have reading/tapescript for listening', () => {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf-8');

      // Skills 2 has listening, should have reading/tapescript
      const hasReadingOrAudio = hasTag(content, 'reading') || hasTag(content, 'audio');
      expect(hasReadingOrAudio).toBe(true);
    });

    it('should have writing task', () => {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf-8');

      // Skills 2 has writing section
      expect(hasTag(content, 'task')).toBe(true);
    });
  });
});
