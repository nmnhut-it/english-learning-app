/**
 * Parser Unit Tests
 *
 * Tests for pure parsing functions - no DOM or browser required.
 */

import { describe, it, expect } from 'vitest';
import {
  parseTitle,
  parseChunks,
  parseVocabulary,
  parseTeacherScript,
  parseLesson,
  renderMarkdown,
  renderTables,
  extractVocabularySections,
  extractTeacherScripts,
  validateLesson,
  hasTag,
  getTagContent,
} from '../parser/Parser';

describe('Parser Module', () => {
  describe('parseTitle', () => {
    it('should parse title from markdown', () => {
      const md = '# UNIT 7: TELEVISION\n\nSome content';
      expect(parseTitle(md)).toBe('UNIT 7: TELEVISION');
    });

    it('should return default title if none found', () => {
      const md = 'Some content without heading';
      expect(parseTitle(md)).toBe('Voice Lecture');
    });

    it('should handle multiple headings - take first', () => {
      const md = '# First Title\n\n# Second Title';
      expect(parseTitle(md)).toBe('First Title');
    });
  });

  describe('parseChunks', () => {
    it('should split content into chunks', () => {
      const md = `<!-- chunk: intro -->
Some intro content here

<!-- chunk: vocabulary -->
Vocabulary section here`;

      const chunks = parseChunks(md);
      expect(chunks).toHaveLength(2);
      expect(chunks[0].id).toBe('intro');
      expect(chunks[1].id).toBe('vocabulary');
    });

    it('should extract chunk titles from h3', () => {
      const md = `<!-- chunk: exercise_1 -->
### Bài 1 trang 6 - Listen and read

Exercise content here`;

      const chunks = parseChunks(md);
      expect(chunks[0].title).toBe('Bài 1 trang 6 - Listen and read');
    });

    it('should filter out tiny chunks', () => {
      const md = `<!-- chunk: tiny -->
Hi

<!-- chunk: proper -->
This is a proper chunk with enough content to be meaningful`;

      const chunks = parseChunks(md);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].id).toBe('proper');
    });

    it('should handle content without chunk comments', () => {
      const md = `# Some Title

This is content without explicit chunks but long enough to count.`;

      const chunks = parseChunks(md);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('parseVocabulary', () => {
    it('should parse vocabulary with all fields', () => {
      const content = `
1. **talent show** : (n) chương trình tài năng /ˈtælənt ʃəʊ/
2. **prefer A to B** : thích A hơn B /prɪˈfɜː/
3. **forget - forgot - forgotten** : (v) quên /fəˈɡet/
`;

      const words = parseVocabulary(content);

      expect(words).toHaveLength(3);

      expect(words[0]).toEqual({
        word: 'talent show',
        type: 'n',
        pronunciation: 'ˈtælənt ʃəʊ',
        meaning: 'chương trình tài năng',
      });

      expect(words[1]).toEqual({
        word: 'prefer A to B',
        type: null,
        pronunciation: 'prɪˈfɜː',
        meaning: 'thích A hơn B',
      });

      expect(words[2]).toEqual({
        word: 'forget - forgot - forgotten',
        type: 'v',
        pronunciation: 'fəˈɡet',
        meaning: 'quên',
      });
    });

    it('should handle vocabulary without pronunciation', () => {
      const content = `1. **hello** : (n) xin chào`;

      const words = parseVocabulary(content);
      expect(words[0].pronunciation).toBeNull();
      expect(words[0].meaning).toBe('xin chào');
    });

    it('should handle vocabulary without type', () => {
      const content = `1. **goodbye** : tạm biệt /ɡʊdˈbaɪ/`;

      const words = parseVocabulary(content);
      expect(words[0].type).toBeNull();
    });

    it('should skip malformed lines', () => {
      const content = `
1. **valid** : (n) meaning /pron/
This is not a valid line
2. **also valid** : (v) another meaning /pron2/
`;

      const words = parseVocabulary(content);
      expect(words).toHaveLength(2);
    });
  });

  describe('parseTeacherScript', () => {
    it('should parse all attributes', () => {
      const attrs = 'pause="60" href="audio/file.mp3" action="record"';
      const text = 'Ok lớp 6, bài 1 nha.';

      const ts = parseTeacherScript(text, attrs);

      expect(ts.text).toBe('Ok lớp 6, bài 1 nha.');
      expect(ts.pause).toBe(60);
      expect(ts.href).toBe('audio/file.mp3');
      expect(ts.action).toBe('record');
      expect(ts.id).toMatch(/^ts-/);
    });

    it('should use defaults for missing attributes', () => {
      const ts = parseTeacherScript('Simple text', '');

      expect(ts.pause).toBe(0);
      expect(ts.href).toBeNull();
      expect(ts.action).toBeNull();
    });
  });

  describe('parseLesson', () => {
    it('should return complete lesson structure', () => {
      const md = `# Unit 7: Television

<!-- chunk: intro -->
Introduction content that is long enough

<!-- chunk: vocabulary -->
### Vocabulary Section
Word list content that is also long enough`;

      const lesson = parseLesson(md);

      expect(lesson.title).toBe('Unit 7: Television');
      expect(lesson.chunks).toHaveLength(2);
    });
  });

  describe('renderMarkdown', () => {
    it('should render headings', () => {
      expect(renderMarkdown('# H1')).toContain('<h1>H1</h1>');
      expect(renderMarkdown('## H2')).toContain('<h2>H2</h2>');
      expect(renderMarkdown('### H3')).toContain('<h3>H3</h3>');
    });

    it('should render bold and italic', () => {
      expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
      expect(renderMarkdown('*italic*')).toContain('<em>italic</em>');
    });

    it('should render lists', () => {
      const md = '- item 1\n- item 2';
      const html = renderMarkdown(md);
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>item 1</li>');
      expect(html).toContain('<li>item 2</li>');
    });
  });

  describe('renderTables', () => {
    it('should convert markdown tables to HTML', () => {
      const md = `| English | Vietnamese |
|---------|------------|
| Hello | Xin chào |
| Goodbye | Tạm biệt |`;

      const html = renderTables(md);

      expect(html).toContain('<table>');
      expect(html).toContain('<th>English</th>');
      expect(html).toContain('<td>Hello</td>');
      expect(html).toContain('<td>Xin chào</td>');
    });

    it('should handle tables with different number of columns', () => {
      const md = `| A | B | C |
|---|---|---|
| 1 | 2 | 3 |`;

      const html = renderTables(md);
      expect(html).toContain('<th>A</th>');
      expect(html).toContain('<th>B</th>');
      expect(html).toContain('<th>C</th>');
    });
  });

  describe('extractVocabularySections', () => {
    it('should find all vocabulary tags', () => {
      const content = `
<vocabulary>
1. **word1** : (n) meaning1 /pron1/
</vocabulary>

Some content

<vocabulary>
1. **word2** : (v) meaning2 /pron2/
</vocabulary>
`;

      const sections = extractVocabularySections(content);
      expect(sections).toHaveLength(2);
      expect(sections[0].words[0].word).toBe('word1');
      expect(sections[1].words[0].word).toBe('word2');
    });

    it('should generate unique IDs', () => {
      const content = `
<vocabulary>
1. **word1** : meaning1 /pron/
</vocabulary>
<vocabulary>
1. **word2** : meaning2 /pron/
</vocabulary>
`;

      const sections = extractVocabularySections(content);
      expect(sections[0].id).not.toBe(sections[1].id);
    });
  });

  describe('extractTeacherScripts', () => {
    it('should find all teacher scripts', () => {
      const content = `
<teacher_script pause="0">
First script
</teacher_script>

<teacher_script pause="60" action="record">
Second script
</teacher_script>
`;

      const scripts = extractTeacherScripts(content);
      expect(scripts).toHaveLength(2);
      expect(scripts[0].text).toBe('First script');
      expect(scripts[1].pause).toBe(60);
      expect(scripts[1].action).toBe('record');
    });
  });

  describe('hasTag', () => {
    it('should detect existing tags', () => {
      expect(hasTag('<vocabulary>content</vocabulary>', 'vocabulary')).toBe(true);
      expect(hasTag('<teacher_script pause="0">text</teacher_script>', 'teacher_script')).toBe(true);
    });

    it('should return false for missing tags', () => {
      expect(hasTag('no tags here', 'vocabulary')).toBe(false);
    });
  });

  describe('getTagContent', () => {
    it('should extract tag content', () => {
      const content = '<vocabulary>word list here</vocabulary>';
      expect(getTagContent(content, 'vocabulary')).toBe('word list here');
    });

    it('should return null for missing tag', () => {
      expect(getTagContent('no tag', 'vocabulary')).toBeNull();
    });

    it('should handle multiline content', () => {
      const content = `<task>
**Đề:** Do something
**Dịch:** Làm gì đó
</task>`;

      const extracted = getTagContent(content, 'task');
      expect(extracted).toContain('**Đề:** Do something');
      expect(extracted).toContain('**Dịch:** Làm gì đó');
    });
  });

  describe('validateLesson', () => {
    it('should pass valid lesson', () => {
      const md = `# Unit 7: Television

<!-- chunk: intro -->
<teacher_script pause="0">
Intro text
</teacher_script>

More content here that is long enough

<!-- chunk: vocab -->
<teacher_script pause="0">
Vocab intro
</teacher_script>
<vocabulary>
1. **word** : (n) meaning /pron/
</vocabulary>

More vocab content here`;

      const result = validateLesson(md);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should error on empty lesson', () => {
      const result = validateLesson('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn on missing teacher scripts', () => {
      const md = `# Unit 7

<!-- chunk: no_ts -->
This chunk has no teacher script but enough content to count`;

      const result = validateLesson(md);
      expect(result.warnings.some((w) => w.includes('no teacher scripts'))).toBe(true);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty vocabulary tags', () => {
    const content = '<vocabulary></vocabulary>';
    const sections = extractVocabularySections(content);
    expect(sections).toHaveLength(0);
  });

  it('should handle special characters in vocabulary', () => {
    const content = `1. **it's** : (phrase) nó là /ɪts/`;
    const words = parseVocabulary(content);
    expect(words[0].word).toBe("it's");
  });

  it('should handle Vietnamese in teacher scripts', () => {
    const ts = parseTeacherScript('Ok lớp 6, đọc theo nha!', 'pause="30"');
    expect(ts.text).toBe('Ok lớp 6, đọc theo nha!');
  });

  it('should preserve content between custom tags', () => {
    const md = `
<dialogue>
**Phong:** Hello
**Hung:** Hi
</dialogue>

Regular paragraph

<translation>
Dịch nghĩa
</translation>
`;

    // Both tags should be preserved in output
    expect(hasTag(md, 'dialogue')).toBe(true);
    expect(hasTag(md, 'translation')).toBe(true);
  });
});
