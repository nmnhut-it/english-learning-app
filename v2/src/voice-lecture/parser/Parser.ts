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

export interface TextSegment {
  text: string;
  lang: 'vi' | 'en';
}

export interface TeacherScript {
  id: string;
  text: string;
  segments: TextSegment[];
  pause: number;
  lang: 'vi' | 'en';
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
 * Parse inline language tags (<eng>, <vn>) into segments
 */
export function parseTextSegments(text: string, defaultLang: 'vi' | 'en'): TextSegment[] {
  const segments: TextSegment[] = [];
  // Match <eng>...</eng> or <vn>...</vn> tags
  const tagPattern = /<(eng|vn)>([\s\S]*?)<\/\1>/g;

  let lastIndex = 0;
  let match;

  while ((match = tagPattern.exec(text)) !== null) {
    // Add text before this tag (in default language)
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index).trim();
      if (beforeText) {
        segments.push({ text: beforeText, lang: defaultLang });
      }
    }

    // Add the tagged content
    const tagLang = match[1] === 'eng' ? 'en' : 'vi';
    const tagContent = match[2].trim();
    if (tagContent) {
      segments.push({ text: tagContent, lang: tagLang as 'vi' | 'en' });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last tag
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      segments.push({ text: remainingText, lang: defaultLang });
    }
  }

  // If no tags found, return single segment with full text
  if (segments.length === 0 && text.trim()) {
    segments.push({ text: text.trim(), lang: defaultLang });
  }

  return segments;
}

/**
 * Parse teacher script attributes from tag
 */
export function parseTeacherScript(tagContent: string, attrs: string): TeacherScript {
  const id = `ts-${Math.random().toString(36).slice(2, 8)}`;

  const pauseMatch = attrs.match(/pause="(\d+)"/);
  const langMatch = attrs.match(/lang="(vi|en)"/);
  const hrefMatch = attrs.match(/href="([^"]+)"/);
  const actionMatch = attrs.match(/action="(\w+)"/);

  const defaultLang = langMatch ? (langMatch[1] as 'vi' | 'en') : 'vi';
  const segments = parseTextSegments(tagContent.trim(), defaultLang);

  // Plain text without inline tags (for display/backward compatibility)
  const plainText = tagContent
    .replace(/<\/?(?:eng|vn)>/g, '')
    .trim();

  return {
    id,
    text: plainText,
    segments,
    pause: pauseMatch ? parseInt(pauseMatch[1], 10) : 0,
    lang: defaultLang,
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

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr>');

  // Lists - unordered
  html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');

  // Lists - ordered (numbered)
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="numbered">$1</li>');

  // Wrap consecutive list items
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('class="numbered"')) {
      return '<ol>' + match.replace(/ class="numbered"/g, '') + '</ol>';
    }
    return '<ul>' + match + '</ul>';
  });

  // Paragraphs - only double newlines become paragraph breaks
  html = html.split(/\n\n+/).map((block) => {
    block = block.trim();
    if (!block) return '';
    // Don't wrap if already HTML
    if (block.startsWith('<')) return block;
    return `<p>${block}</p>`;
  }).join('\n');

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
 * List of custom tags that need special handling
 */
export const CUSTOM_TAGS = [
  'vocabulary', 'teacher_script', 'dialogue', 'reading', 'translation',
  'grammar', 'task', 'questions', 'answer', 'explanation',
  'pronunciation_theory', 'audio', 'content_table',
];

/**
 * Render full content with custom tags
 *
 * This function properly handles custom tags by:
 * 1. Replacing them with HTML comment placeholders (starts with <)
 * 2. Rendering markdown on the remaining content
 * 3. Restoring the placeholders
 *
 * This prevents the <p><div> nesting issue where renderMarkdown would
 * wrap custom tag content in <p> tags.
 *
 * @param content - Raw markdown content with custom tags
 * @param tagRenderer - Function to render each custom tag
 * @returns Rendered HTML string
 */
export function renderFullContent(
  content: string,
  tagRenderer?: (tag: string, inner: string, attrs: string) => string
): string {
  let html = content;

  // Default tag renderer just wraps in a div
  const defaultTagRenderer = (tag: string, inner: string, attrs: string) => {
    const tagClass = tag.replace(/_/g, '-');

    // Special handling for teacher_script to strip inline language tags
    if (tag === 'teacher_script') {
      const ts = parseTeacherScript(inner, attrs);
      const segmentsJson = JSON.stringify(ts.segments).replace(/"/g, '&quot;');
      return `<div class="${tagClass} ts" id="${ts.id}"
        data-text="${ts.text.replace(/"/g, '&quot;')}"
        data-segments="${segmentsJson}"
        data-pause="${ts.pause}"
        data-lang="${ts.lang}"
        ${ts.action ? `data-action="${ts.action}"` : ''}
        ${ts.href ? `data-href="${ts.href}"` : ''}>\n${ts.text}\n</div>`;
    }

    return `<div class="${tagClass}"${attrs}>\n${renderMarkdown(inner)}\n</div>`;
  };

  const render = tagRenderer || defaultTagRenderer;

  // Replace custom tags with HTML comment placeholders
  // HTML comments start with < so renderMarkdown won't wrap them in <p>
  const tagPlaceholders: Map<string, string> = new Map();
  let placeholderIndex = 0;

  for (const tag of CUSTOM_TAGS) {
    const regex = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'g');
    html = html.replace(regex, (match, attrs, inner) => {
      const placeholder = `<!--TAG_PH_${placeholderIndex++}-->`;
      tagPlaceholders.set(placeholder, render(tag, inner, attrs || ''));
      return placeholder;
    });
  }

  // Process chunk comments
  const chunkPlaceholders: Map<string, string> = new Map();
  let chunkIndex = 0;
  html = html.replace(/<!--\s*chunk:\s*(\w+)\s*-->/g, (match, chunkId) => {
    const placeholder = `<!--CHUNK_PH_${chunkIndex++}-->`;
    chunkPlaceholders.set(placeholder, `<div class="chunk-marker" data-chunk="${chunkId}">chunk: ${chunkId}</div>`);
    return placeholder;
  });

  // Render markdown on content outside tags
  html = renderMarkdown(html);

  // Restore placeholders
  for (const [placeholder, rendered] of tagPlaceholders) {
    html = html.replace(placeholder, rendered);
  }
  for (const [placeholder, rendered] of chunkPlaceholders) {
    html = html.replace(placeholder, rendered);
  }

  return html;
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
