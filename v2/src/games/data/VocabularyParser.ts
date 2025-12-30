/**
 * Parser for extracting vocabulary from markdown files
 * Supports both Grade 6-8 simple format and Grade 9-11 detailed format
 */

import type { VocabularyItem, VocabularySet, PartOfSpeech } from '../types/GameTypes';

export class VocabularyParser {
  /**
   * Parse Grade 6-8 format:
   * "1. word : (pos) meaning /ipa/"
   * Examples:
   *   "1. hobby : (n) sở thích /ˈhɒbi/"
   *   "2. knitting kit : (n) bộ đan len /ˈnɪtɪŋ kɪt/"
   */
  static parseSimpleFormat(line: string): Partial<VocabularyItem> | null {
    // Pattern: number. word : (part_of_speech) meaning /ipa/
    const regex = /^\d+\.\s*(.+?)\s*:\s*\((\w+(?:\.\w+)?)\)\s*(.+?)\s*\/(.+?)\/\s*$/;
    const match = line.trim().match(regex);

    if (!match) return null;

    const [, word, pos, meaning, ipa] = match;

    return {
      word: word.trim(),
      partOfSpeech: this.normalizePartOfSpeech(pos),
      meaning: meaning.trim(),
      pronunciation: {
        ipa: `/${ipa}/`,
      },
    };
  }

  /**
   * Parse Grade 9-11 detailed format:
   * "1. **word** /ipa/ (pos): meaning"
   * Followed by example sentences with Vietnamese translations
   */
  static parseDetailedFormat(block: string): Partial<VocabularyItem> | null {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length === 0) return null;

    // Header pattern: 1. **word** /ipa/ (pos): meaning
    const headerRegex = /^\d+\.\s*\*\*(.+?)\*\*\s*\/(.+?)\/\s*\((.+?)\):\s*(.+)$/;
    const match = lines[0].match(headerRegex);

    if (!match) return null;

    const [, word, ipa, pos, meaning] = match;

    const examples: { english: string; vietnamese?: string }[] = [];

    // Parse example sentences (lines starting with -)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('-')) {
        const exampleText = line.substring(1).trim();

        // Check if this is a Vietnamese translation (starts with * or ()
        if (exampleText.startsWith('*') || exampleText.startsWith('(')) {
          // Add as Vietnamese translation to previous example
          if (examples.length > 0) {
            examples[examples.length - 1].vietnamese = exampleText
              .replace(/^\*\(/, '')
              .replace(/\)\*$/, '')
              .replace(/^\(/, '')
              .replace(/\)$/, '')
              .trim();
          }
        } else {
          // English example
          examples.push({ english: exampleText });
        }
      }
    }

    // Check for synonyms in meaning (e.g., "tham gia = join = take part in")
    let synonyms: string[] | undefined;
    let cleanMeaning = meaning.trim();

    if (cleanMeaning.includes('=')) {
      const parts = cleanMeaning.split('=').map((p) => p.trim());
      cleanMeaning = parts[0];
      synonyms = parts.slice(1);
    }

    return {
      word: word.trim(),
      partOfSpeech: this.normalizePartOfSpeech(pos),
      meaning: cleanMeaning,
      pronunciation: {
        ipa: `/${ipa}/`,
      },
      examples: examples.length > 0 ? examples : undefined,
      synonyms,
    };
  }

  /**
   * Parse entire markdown file content
   */
  static parseMarkdownFile(
    content: string,
    grade: number,
    unit: number,
    lesson: string
  ): VocabularySet {
    const items: VocabularyItem[] = [];

    // Extract title from content
    const title = this.extractTitle(content, unit);

    // Find vocabulary section(s)
    const vocabSections = this.findVocabularySections(content);

    for (const section of vocabSections) {
      const parsedItems = this.parseVocabularySection(section, grade);

      for (const item of parsedItems) {
        const fullItem: VocabularyItem = {
          ...item,
          id: `g${grade}-u${unit}-${this.slugify(item.word)}`,
          grade,
          unit,
          lesson,
          difficulty: this.calculateDifficulty(grade),
        } as VocabularyItem;

        items.push(fullItem);
      }
    }

    return {
      id: `g${grade}-u${unit}-${lesson}`,
      grade,
      unit,
      lesson,
      title,
      items,
    };
  }

  /**
   * Find all vocabulary sections in content
   */
  private static findVocabularySections(content: string): string[] {
    const sections: string[] = [];

    // Pattern for vocabulary section headers
    const sectionPattern = /\*\*(?:Vocabulary|Từ vựng)[^*]*\*\*/gi;
    const matches = content.matchAll(sectionPattern);

    for (const match of matches) {
      if (match.index === undefined) continue;

      // Find the end of this section (next ** header or end of content)
      const startIdx = match.index + match[0].length;
      const nextSectionMatch = content.substring(startIdx).match(/\n\*\*[^*]+\*\*/);

      const endIdx = nextSectionMatch?.index
        ? startIdx + nextSectionMatch.index
        : content.length;

      const sectionContent = content.substring(startIdx, endIdx);
      sections.push(sectionContent);
    }

    // Also look for "## Từ vựng" sections
    const mdHeaderPattern = /##\s*(?:Vocabulary|Từ vựng)[^\n]*/gi;
    const mdMatches = content.matchAll(mdHeaderPattern);

    for (const match of mdMatches) {
      if (match.index === undefined) continue;

      const startIdx = match.index + match[0].length;
      const nextHeader = content.substring(startIdx).match(/\n##\s/);

      const endIdx = nextHeader?.index
        ? startIdx + nextHeader.index
        : content.length;

      const sectionContent = content.substring(startIdx, endIdx);
      sections.push(sectionContent);
    }

    return sections;
  }

  /**
   * Parse vocabulary items from a section
   */
  private static parseVocabularySection(
    section: string,
    grade: number
  ): Partial<VocabularyItem>[] {
    const items: Partial<VocabularyItem>[] = [];
    const lines = section.split('\n');

    let currentBlock = '';

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if this is a new numbered item
      if (/^\d+\./.test(trimmedLine)) {
        // Process previous block if exists
        if (currentBlock) {
          const item = this.parseVocabularyBlock(currentBlock, grade);
          if (item) items.push(item);
        }
        currentBlock = trimmedLine;
      } else if (trimmedLine.startsWith('-') && currentBlock) {
        // Add to current block (example sentence)
        currentBlock += '\n' + trimmedLine;
      }
    }

    // Process last block
    if (currentBlock) {
      const item = this.parseVocabularyBlock(currentBlock, grade);
      if (item) items.push(item);
    }

    return items;
  }

  /**
   * Parse a single vocabulary block
   */
  private static parseVocabularyBlock(
    block: string,
    grade: number
  ): Partial<VocabularyItem> | null {
    // Try detailed format first (Grade 9-11)
    if (block.includes('**')) {
      return this.parseDetailedFormat(block);
    }

    // Try simple format (Grade 6-8)
    const firstLine = block.split('\n')[0];
    return this.parseSimpleFormat(firstLine);
  }

  /**
   * Extract unit title from content
   */
  private static extractTitle(content: string, unit: number): string {
    // Try to find "UNIT X: Title" or "Unit X: Title"
    const titleMatch = content.match(/\*?\*?UNIT\s*\d+:\s*([^\n*]+)/i);
    if (titleMatch) {
      return titleMatch[1].trim().replace(/\*+$/, '');
    }

    // Try markdown header "# Unit X: Title"
    const mdTitleMatch = content.match(/^#\s*Unit\s*\d+[:\s]+(.+)$/im);
    if (mdTitleMatch) {
      return mdTitleMatch[1].trim();
    }

    return `Unit ${unit}`;
  }

  /**
   * Normalize part of speech to standard format
   */
  private static normalizePartOfSpeech(pos: string): PartOfSpeech {
    const normalized = pos.toLowerCase().trim();

    const mappings: Record<string, PartOfSpeech> = {
      n: 'n',
      noun: 'n',
      v: 'v',
      verb: 'v',
      adj: 'adj',
      adjective: 'adj',
      adv: 'adv',
      adverb: 'adv',
      prep: 'prep',
      preposition: 'prep',
      phr: 'phr',
      phrase: 'phr',
      'n.phr': 'n.phr',
      'v.phr': 'v.phr',
      'adj.phr': 'adj.phr',
      'prep.phr': 'prep.phr',
      'phr.v': 'phr.v',
      'modal verb': 'modal verb',
      interj: 'interj',
      interjection: 'interj',
      conj: 'conj',
      conjunction: 'conj',
      art: 'art',
      article: 'art',
      pron: 'pron',
      pronoun: 'pron',
    };

    return mappings[normalized] || 'n';
  }

  /**
   * Calculate difficulty based on grade level
   */
  private static calculateDifficulty(grade: number): 1 | 2 | 3 {
    if (grade <= 7) return 1;
    if (grade <= 9) return 2;
    return 3;
  }

  /**
   * Create URL-safe slug from text
   */
  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50);
  }
}

/**
 * Helper function to load and parse vocabulary from markdown file path
 */
export async function loadVocabularyFromMarkdown(
  filePath: string,
  grade: number,
  unit: number,
  lesson: string
): Promise<VocabularySet> {
  const response = await fetch(filePath);
  const content = await response.text();
  return VocabularyParser.parseMarkdownFile(content, grade, unit, lesson);
}
