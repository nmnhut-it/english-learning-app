/**
 * Parser Module - Pure functions for parsing voice lecture markdown
 *
 * All functions are pure and side-effect free, making them easily unit testable.
 */

export interface VocabularyWord {
  word: string;
  type: string | null;
  pronunciation: string | null;
  meaning: string;
}

export interface TeacherScript {
  id: string;
  text: string;
  pause: number;
  href: string | null;
  action: string | null;
}

export interface ParsedChunk {
  id: string;
  index: number;
  title: string;
  content: string;
  rawContent: string;
}

export interface ParsedLesson {
  title: string;
  chunks: ParsedChunk[];
}

/**
 * Parse lesson title from markdown
 */
export function parseTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Voice Lecture';
}

/**
 * Split markdown into chunks based on <!-- chunk: --> comments
 */
export function parseChunks(markdown: string): ParsedChunk[] {
  const parts = markdown.split(/(?=<!--\s*chunk:)/);

  return parts
    .map((part, index) => {
      const nameMatch = part.match(/<!--\s*chunk:\s*(\w+)/);
      const h3Match = part.match(/^###\s+(.+)$/m);

      const rawContent = part
        .replace(/<!--\s*chunk:.*?-->/gs, '')
        .replace(/\n---\n/g, '\n')
        .replace(/^---$/gm, '')
        .trim();

      return {
        id: nameMatch ? nameMatch[1] : `chunk-${index}`,
        index,
        title: h3Match ? h3Match[1] : (nameMatch ? nameMatch[1] : ''),
        content: rawContent,
        rawContent: part,
      };
    })
    .filter((chunk) => chunk.content.length > 20);
}

/**
 * Parse vocabulary from <vocabulary> tag content
 */
export function parseVocabulary(content: string): VocabularyWord[] {
  const words: VocabularyWord[] = [];

  content
    .trim()
    .split(/\r?\n/)
    .forEach((line) => {
      // Match: 1. **word** : (type) meaning /pronunciation/
      const baseMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*\s*:\s*(.+)$/);

      if (baseMatch) {
        const word = baseMatch[1].trim();
        let rest = baseMatch[2].trim();

        // Extract type: (n), (v), (adj), etc.
        let type: string | null = null;
        const typeMatch = rest.match(/^\(([^)]+)\)\s*/);
        if (typeMatch) {
          type = typeMatch[1];
          rest = rest.slice(typeMatch[0].length);
        }

        // Extract pronunciation: /.../ at end
        let pronunciation: string | null = null;
        const pronMatch = rest.match(/\s*\/([^/]+)\/$/);
        if (pronMatch) {
          pronunciation = pronMatch[1];
          rest = rest.slice(0, -pronMatch[0].length);
        }

        const meaning = rest.trim();

        if (word && meaning) {
          words.push({ word, type, pronunciation, meaning });
        }
      }
    });

  return words;
}

/**
 * Parse teacher script attributes from tag
 */
export function parseTeacherScript(tagContent: string, attrs: string): TeacherScript {
  const id = `ts-${Math.random().toString(36).slice(2, 8)}`;

  const pauseMatch = attrs.match(/pause="(\d+)"/);
  const hrefMatch = attrs.match(/href="([^"]+)"/);
  const actionMatch = attrs.match(/action="(\w+)"/);

  return {
    id,
    text: tagContent.trim(),
    pause: pauseMatch ? parseInt(pauseMatch[1], 10) : 0,
    href: hrefMatch ? hrefMatch[1] : null,
    action: actionMatch ? actionMatch[1] : null,
  };
}

/**
 * Parse a full lesson
 */
export function parseLesson(markdown: string): ParsedLesson {
  return {
    title: parseTitle(markdown),
    chunks: parseChunks(markdown),
  };
}

/**
 * Render basic markdown to HTML (headings, bold, italic, lists)
 */
export function renderMarkdown(markdown: string): string {
  let html = markdown;

  // Headings
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Tables
  html = renderTables(html);

  // Lists
  html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  return html;
}

/**
 * Render markdown tables to HTML
 */
export function renderTables(markdown: string): string {
  const tableRegex = /^(\|[^\n]+\|[ \t]*\n?)+/gm;
  const matches: Array<{ str: string; idx: number }> = [];

  let match;
  while ((match = tableRegex.exec(markdown)) !== null) {
    matches.push({ str: match[0], idx: match.index });
  }

  // Replace from end to preserve indices
  let result = markdown;
  for (let i = matches.length - 1; i >= 0; i--) {
    const { str: tableStr, idx } = matches[i];
    const lines = tableStr
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l);

    // Filter out separator rows (|---|---|)
    const dataRows = lines.filter((line) => !/^\|[\s\-:|]+\|$/.test(line));

    if (dataRows.length > 0) {
      let table = '<div class="table-wrap"><table>';

      dataRows.forEach((row, rowIndex) => {
        const parts = row.split('|');
        const cells = parts.slice(1, parts.length - 1);
        const tag = rowIndex === 0 ? 'th' : 'td';

        table += '<tr>' + cells.map((c) => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
      });

      table += '</table></div>';
      result = result.substring(0, idx) + table + result.substring(idx + tableStr.length);
    }
  }

  return result;
}

/**
 * Extract all vocabulary sections from content
 */
export function extractVocabularySections(
  content: string
): Array<{ id: string; words: VocabularyWord[] }> {
  const sections: Array<{ id: string; words: VocabularyWord[] }> = [];
  const regex = /<vocabulary>([\s\S]*?)<\/vocabulary>/gi;

  let match;
  while ((match = regex.exec(content)) !== null) {
    const id = `vocab-${Math.random().toString(36).slice(2, 8)}`;
    const words = parseVocabulary(match[1]);
    if (words.length > 0) {
      sections.push({ id, words });
    }
  }

  return sections;
}

/**
 * Extract all teacher scripts from content
 */
export function extractTeacherScripts(content: string): TeacherScript[] {
  const scripts: TeacherScript[] = [];
  const regex = /<teacher_script([^>]*)>([\s\S]*?)<\/teacher_script>/gi;

  let match;
  while ((match = regex.exec(content)) !== null) {
    scripts.push(parseTeacherScript(match[2], match[1]));
  }

  return scripts;
}

/**
 * Check if content has specific custom tag
 */
export function hasTag(content: string, tagName: string): boolean {
  const regex = new RegExp(`<${tagName}[^>]*>`, 'i');
  return regex.test(content);
}

/**
 * Get tag content
 */
export function getTagContent(content: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = content.match(regex);
  return match ? match[1] : null;
}

/**
 * Validate lesson structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateLesson(markdown: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for title
  if (!parseTitle(markdown) || parseTitle(markdown) === 'Voice Lecture') {
    warnings.push('Missing or default lesson title');
  }

  // Check for chunks
  const chunks = parseChunks(markdown);
  if (chunks.length === 0) {
    errors.push('No chunks found in lesson');
  }

  // Check each chunk
  chunks.forEach((chunk, index) => {
    // Check for teacher scripts
    const scripts = extractTeacherScripts(chunk.content);
    if (scripts.length === 0) {
      warnings.push(`Chunk ${index} (${chunk.id}) has no teacher scripts`);
    }

    // Check vocabulary parsing
    const vocabSections = extractVocabularySections(chunk.content);
    vocabSections.forEach((section) => {
      if (section.words.some((w) => !w.meaning)) {
        errors.push(`Vocabulary section ${section.id} has words without meanings`);
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
