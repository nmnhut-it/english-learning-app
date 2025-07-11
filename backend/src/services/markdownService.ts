import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export interface MarkdownFile {
  filename: string;
  title: string;
  path: string;
  relativePath: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  title?: string;
  children?: FileTreeNode[];
}

export interface MarkdownContent {
  content: string;
  data: any;
  headings: Heading[];
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

// Enhanced content types
export interface Exercise {
  type: 'exercise';
  number: string;
  title: string;
  instruction?: string;
  parts?: ExercisePart[];
  answer?: string;
  answerTitle?: string;
  options?: string[];
  table?: TableData;
  inAnswerSection?: boolean;
}

export interface ExercisePart {
  label: string;
  content: string;
  subParts?: ExercisePart[];
}

export interface Dialogue {
  type: 'dialogue';
  speaker: string;
  text: string;
  translation?: string;
}

export interface Vocabulary {
  type: 'vocabulary';
  number?: string;
  word: string;
  partOfSpeech?: string;
  meaning: string;
  pronunciation?: string;
}

export interface Grammar {
  type: 'grammar';
  title: string;
  structure?: string[];
  usage?: GrammarUsage[];
  examples?: Example[];
}

export interface TableData {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface GrammarUsage {
  title: string;
  explanation: string;
  examples: Example[];
}

export interface Example {
  english: string;
  vietnamese?: string;
}

// Standard pedagogical section order
const SECTION_ORDER = [
  'GETTING STARTED',
  'A CLOSER LOOK 1',
  'A CLOSER LOOK 2',
  'COMMUNICATION',
  'SKILLS 1',
  'SKILLS 2',
  'LOOKING BACK'
];

export class MarkdownService {
  private markdownDir: string;

  constructor() {
    this.markdownDir = path.join(process.cwd(), '..', 'markdown-files');
  }

  async listFiles(): Promise<FileTreeNode> {
    try {
      return await this.scanDirectory(this.markdownDir, '');
    } catch (error) {
      console.error('Error listing files:', error);
      return { name: 'root', path: '', type: 'folder', children: [] };
    }
  }

  private async scanDirectory(dirPath: string, relativePath: string): Promise<FileTreeNode> {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);
    
    if (!stats.isDirectory()) {
      throw new Error('Not a directory');
    }

    const node: FileTreeNode = {
      name: name === 'markdown-files' ? 'Lessons' : name,
      path: relativePath,
      type: 'folder',
      children: []
    };

    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const itemRelativePath = relativePath ? path.join(relativePath, item) : item;
      const itemStats = await fs.stat(itemPath);
      
      if (itemStats.isDirectory()) {
        const childNode = await this.scanDirectory(itemPath, itemRelativePath);
        node.children!.push(childNode);
      } else if (item.endsWith('.md')) {
        const content = await fs.readFile(itemPath, 'utf-8');
        const { data } = matter(content);
        
        // Extract title from content if not in frontmatter
        // Look for the first # heading (main title) at the start of the content
        const lines = content.split('\n');
        let title = data.title;
        
        if (!title) {
          // Find the first non-empty line that starts with #
          for (const line of lines) {
            const match = line.match(/^#\s+(.+)$/);
            if (match) {
              title = match[1].trim();
              break;
            }
          }
        }
        
        // Fallback to filename if no title found
        if (!title) {
          title = item.replace('.md', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        
        node.children!.push({
          name: item,
          path: itemRelativePath,
          type: 'file',
          title
        });
      }
    }
    
    // Sort: folders first, then files
    node.children!.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    return node;
  }

  async getContent(relativePath: string): Promise<MarkdownContent | null> {
    try {
      const filePath = path.join(this.markdownDir, relativePath);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const { content, data } = matter(fileContent);
      
      // Extract headings for navigation
      const headings = this.extractHeadings(content);
      
      // Parse content into structured format
      const structuredContent = this.parseContent(content);
      
      console.log('\n=== BEFORE JSON.stringify ===');
      console.log('Sample vocabulary item:', JSON.stringify(structuredContent[0]?.sections?.[0]?.subsections?.[0]?.content?.[0], null, 2));
      
      return {
        content: JSON.stringify(structuredContent),
        data,
        headings
      };
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  private extractHeadings(content: string): Heading[] {
    const headings: Heading[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        headings.push({ id, text, level });
      }
    });
    
    return headings;
  }

  private sortSections(sections: any[]): any[] {
    return sections.sort((a, b) => {
      const aIndex = SECTION_ORDER.findIndex(order => 
        a.title.toUpperCase().includes(order)
      );
      const bIndex = SECTION_ORDER.findIndex(order => 
        b.title.toUpperCase().includes(order)
      );
      
      // If both found in order, sort by that
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one found, it comes first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // Otherwise maintain original order
      return a.originalIndex - b.originalIndex;
    });
  }

  private parseContent(content: string): any {
    const sections: any[] = [];
    const lines = content.split('\n');
    let currentUnit: any = null;
    let currentSection: any = null;
    let currentSubsection: any = null;
    let currentContent: string[] = [];
    let sectionIndex = 0;
    let currentExercise: any = null;
    let currentExercisePart: any = null;
    let exerciseBuffer: string[] = [];
    
    console.log('\n=== STARTING CONTENT PARSING ===');
    console.log(`Total lines to parse: ${lines.length}`);

    const flushContent = () => {
      if (currentContent.length > 0) {
        const contentStr = currentContent.join('\n').trim();
        if (contentStr) {
          const target = currentSubsection || currentSection || currentUnit;
          if (target) {
            if (!target.content) target.content = [];
            // Parse the content for various types
            const parsedContent = this.parseTextContent(contentStr);
            target.content.push(...parsedContent);
          }
        }
        currentContent = [];
      }
    };

    const flushExercise = () => {
      if (currentExercise) {
        // Flush any remaining part
        if (currentExercisePart && exerciseBuffer.length > 0) {
          currentExercisePart.content = exerciseBuffer.join('\n').trim();
          exerciseBuffer = [];
        }
        
        const target = currentSubsection || currentSection;
        if (target) {
          if (!target.content) target.content = [];
          target.content.push(currentExercise);
        }
        currentExercise = null;
        currentExercisePart = null;
      }
    };

    lines.forEach((line, index) => {
      // Debug logging for vocabulary section
      if (currentSubsection?.type === 'vocabulary' || currentSection?.title?.toLowerCase().includes('vocabulary')) {
        console.log(`\n[Line ${index}] Processing in vocabulary section: "${line.substring(0, 50)}${line.length > 50 ? '...' : ''}"`);
      }
      
      // Main heading
      if (line.match(/^#\s+/)) {
        flushContent();
        flushExercise();
        const title = line.replace(/^#\s+/, '').trim();
        currentUnit = {
          type: 'unit',
          title,
          sections: []
        };
        sections.push(currentUnit);
        currentSection = null;
        currentSubsection = null;
      }
      // Section heading
      else if (line.match(/^##\s+/)) {
        flushContent();
        flushExercise();
        const title = line.replace(/^##\s+/, '').trim();
        currentSection = {
          type: this.getSectionType(title),
          title,
          content: [],
          subsections: [],
          originalIndex: sectionIndex++
        };
        if (currentUnit) {
          currentUnit.sections.push(currentSection);
        }
        currentSubsection = null;
      }
      // Subsection heading
      else if (line.match(/^###\s+/)) {
        flushContent();
        flushExercise();
        const title = line.replace(/^###\s+/, '').trim();
        currentSubsection = {
          type: this.getSubsectionType(title),
          title,
          content: []
        };
        if (currentSection) {
          if (!currentSection.subsections) currentSection.subsections = [];
          currentSection.subsections.push(currentSubsection);
        }
      }
      // Check for exercise start
      else if (line.match(/^\*\*(Bài|Exercise|Exc?\.?)\s*\d+[:.]\s*/i)) {
        flushContent();
        flushExercise();
        
        // Match pattern: **Bài 1: Title here** or **Exercise 2: Something**
        const match = line.match(/^\*\*(Bài|Exercise|Exc?\.?)?\s*(\d+)[:.]\s*(.+?)\*\*/i);
        if (match) {
          currentExercise = {
            type: 'exercise',
            number: match[2],
            title: match[3].trim(),
            instruction: '',
            parts: [],
            answer: ''
          };
          
          // Check if next line is instruction in parentheses
          if (index + 1 < lines.length && lines[index + 1].match(/^\(.+\)$/)) {
            currentExercise.instruction = lines[index + 1].slice(1, -1);
            lines[index + 1] = ''; // Clear the line
          }
        }
      }
      // Check for answer section
      else if (currentExercise) {
        const answerMatch = line.match(/^\*\*(Answer|Answers|Đáp án|Sample Answer|Suggested Answer|Key|Solution|Gợi ý)s?:\*\*/i) ||
                           line.match(/^(Answer|Answers|Đáp án|Sample Answer|Suggested Answer|Key|Solution|Gợi ý)s?:/i);
        if (answerMatch) {
          // Flush current part if exists
          if (currentExercisePart && exerciseBuffer.length > 0) {
            currentExercisePart.content = exerciseBuffer.join('\n').trim();
            exerciseBuffer = [];
            currentExercisePart = null;
          }
          
          // Capture the answer section title
          const answerTitle = answerMatch[1] + (answerMatch[0].includes('s:') ? 's' : '');
          currentExercise.answerTitle = answerTitle;
          
          // Mark that we're in answer mode
          currentExercise.inAnswerSection = true;
          currentExercise.answer = '';
        }
        // Check for exercise sub-part (a), b), c) or 1., 2., 3.)
        else if (!currentExercise.inAnswerSection && line.match(/^[a-zA-Z][\).]|^\d+[\).]/)) {
          // Flush previous part if exists
          if (currentExercisePart && exerciseBuffer.length > 0) {
            currentExercisePart.content = exerciseBuffer.join('\n').trim();
            exerciseBuffer = [];
          }
          
          const subPartMatch = line.match(/^([a-zA-Z])[\).](.*)/) || line.match(/^(\d+)[\).](.*)/);
          if (subPartMatch) {
            currentExercisePart = {
              label: subPartMatch[1],
              content: ''
            };
            currentExercise.parts.push(currentExercisePart);
            // Add the rest of the line to buffer
            const restOfLine = subPartMatch[2].trim();
            if (restOfLine) {
              exerciseBuffer.push(restOfLine);
            }
          }
        }
        // If we're in an exercise, collect content
        else if (!line.match(/^\*\*[^:]+\*\*:/) && !line.match(/^(\d+\.|-)\s+\*\*/)) {
          if (currentExercise.inAnswerSection) {
            // We're collecting answer content
            currentExercise.answer += (currentExercise.answer ? '\n' : '') + line;
          } else if (currentExercisePart) {
            exerciseBuffer.push(line);
          } else {
            // This is instruction text before sub-parts
            if (line.trim()) {
              currentExercise.instruction += (currentExercise.instruction ? '\n' : '') + line;
            }
          }
        } else {
          // This might be the start of a new content type, flush exercise
          flushExercise();
          currentContent.push(line);
        }
      }
      // Table detection
      else if (line.includes('|') && lines[index + 1]?.includes('---')) {
        flushContent();
        const table = this.parseTable(lines, index);
        const target = currentSubsection || currentSection;
        if (target) {
          if (!target.content) target.content = [];
          target.content.push(table.data);
        }
        // Skip the lines we've processed
        lines.splice(index + 1, table.endIndex - index);
      }
      // Vocabulary items - support multiple formats
      else if (this.isVocabularyLine(line)) {
        flushContent();
        const vocab = this.parseVocabularyLine(line);
        console.log('Parsed vocabulary:', vocab);
        if (vocab) {
          const target = currentSubsection || currentSection;
          if (target) {
            if (!target.content) target.content = [];
            target.content.push(vocab);
            console.log(`Added vocabulary to ${target.title}:`, vocab);
            console.log('Target content now has:', target.content.length, 'items');
          } else {
            console.log('WARNING: No target section for vocabulary!');
          }
        } else {
          console.log('WARNING: Failed to parse vocabulary line!');
        }
      }
      // Dialogue
      else if (line.match(/^\*\*[^:]+\*\*:/) && !currentExercise) {
        flushContent();
        const match = line.match(/^\*\*([^:]+)\*\*:\s*(.+)/);
        if (match) {
          const dialogue: Dialogue = {
            type: 'dialogue',
            speaker: match[1],
            text: match[2],
            translation: ''
          };
          
          // Check if next line is an italicized translation
          if (index + 1 < lines.length) {
            const nextLine = lines[index + 1];
            if (nextLine.trim().startsWith('*') && nextLine.trim().endsWith('*') && !nextLine.trim().startsWith('**')) {
              dialogue.translation = nextLine.trim().slice(1, -1);
              lines[index + 1] = ''; // Clear the translation line so it's not processed again
            }
          }
          
          const target = currentSubsection || currentSection;
          if (target) {
            if (!target.content) target.content = [];
            target.content.push(dialogue);
          }
        }
      }
      // Regular content
      else {
        // Skip empty lines that were cleared (translations)
        if (line !== '') {
          currentContent.push(line);
        }
      }
    });

    flushContent();
    flushExercise();
    
    // Sort sections in each unit according to pedagogical order
    sections.forEach((unit: any) => {
      if (unit.sections && unit.sections.length > 0) {
        unit.sections = this.sortSections(unit.sections);
      }
    });
    
    console.log('\n=== PARSE CONTENT COMPLETE ===');
    console.log('Total units:', sections.length);
    sections.forEach((unit: any) => {
      console.log(`\nUnit: ${unit.title}`);
      unit.sections.forEach((section: any) => {
        console.log(`  Section: ${section.title}`);
        if (section.subsections) {
          section.subsections.forEach((sub: any) => {
            console.log(`    Subsection: ${sub.title} (${sub.content.length} items)`);
            const vocabCount = sub.content.filter((item: any) => item.type === 'vocabulary').length;
            if (vocabCount > 0) {
              console.log(`      - Contains ${vocabCount} vocabulary items`);
            }
          });
        }
      });
    });
    
    return sections;
  }

  async getRawContent(relativePath: string): Promise<string | null> {
    try {
      const filePath = path.join(this.markdownDir, relativePath);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const { content } = matter(fileContent);
      return content;
    } catch (error) {
      console.error('Error reading raw file:', error);
      return null;
    }
  }

  private isVocabularyLine(line: string): boolean {
    // Check for various vocabulary patterns
    return !!(
      line.match(/^(\d+\.|-)\s*\*\*[^*]+\*\*\s*:/) || // Numbered or bullet with bold
      line.match(/^\d+\.\s+\w+:\s*\([^)]+\)/) || // New format: 1. word: (type) meaning /pron/
      line.match(/^\([^)]+\)\s*-\s*[^-]+\s*-/) // Format: (type) - word - pronunciation
    );
  }

  private parseVocabularyLine(line: string): Vocabulary | null {
    console.log('\n--- parseVocabularyLine called ---');
    console.log(`Input line: "${line}"`);
    
    // Pattern 1: New format from g6_part_2.md: "1. word: (type) meaning /pronunciation/"
    const newNumberedMatch = line.match(/^(\d+)\.\s+([^:]+):\s*\(([^)]+)\)\s*([^/]+?)(?:\s*\/([^/]+)\/)?$/);
    console.log('Testing new numbered format regex:', newNumberedMatch);
    if (newNumberedMatch) {
      const result: Vocabulary = {
        type: 'vocabulary' as const,
        number: newNumberedMatch[1],
        word: newNumberedMatch[2].trim(),
        partOfSpeech: newNumberedMatch[3].trim(),
        meaning: newNumberedMatch[4].trim(),
        pronunciation: newNumberedMatch[5]?.trim()
      };
      console.log('Matched new numbered format:', result);
      return result;
    }
    
    // Pattern 2: Old numbered format with bold: "1. **word** : (type) meaning /pronunciation/"
    const numberedBoldMatch = line.match(/^(\d+)\.\s+\*\*([^*]+)\*\*\s*:\s*(?:\(([^)]+)\)\s*)?([^/]+)(?:\/([^/]+)\/)?/);
    console.log('Testing numbered bold format regex:', numberedBoldMatch);
    if (numberedBoldMatch) {
      const result: Vocabulary = {
        type: 'vocabulary' as const,
        number: numberedBoldMatch[1],
        word: numberedBoldMatch[2].trim(),
        partOfSpeech: numberedBoldMatch[3]?.trim(),
        meaning: numberedBoldMatch[4].trim(),
        pronunciation: numberedBoldMatch[5]?.trim()
      };
      console.log('Matched numbered bold format:', result);
      return result;
    }
    
    // Pattern 3: Bullet format with bold: "- **word** : (type) meaning /pronunciation/"
    const bulletMatch = line.match(/^-\s+\*\*([^*]+)\*\*\s*:\s*(?:\(([^)]+)\)\s*)?([^/]+)(?:\/([^/]+)\/)?/);
    console.log('Testing bullet format regex:', bulletMatch);
    if (bulletMatch) {
      const result: Vocabulary = {
        type: 'vocabulary' as const,
        word: bulletMatch[1].trim(),
        partOfSpeech: bulletMatch[2]?.trim(),
        meaning: bulletMatch[3].trim(),
        pronunciation: bulletMatch[4]?.trim()
      };
      console.log('Matched bullet format:', result);
      return result;
    }
    
    // Pattern 4: Alternative format: "(type) - word - pronunciation"
    const altFormatMatch = line.match(/^\(([^)]+)\)\s*-\s*([^-]+)\s*-\s*(.+)$/);
    console.log('Testing alternative format regex:', altFormatMatch);
    if (altFormatMatch) {
      const result: Vocabulary = {
        type: 'vocabulary' as const,
        partOfSpeech: altFormatMatch[1].trim(),
        word: altFormatMatch[2].trim(),
        meaning: '', // No meaning in this format
        pronunciation: altFormatMatch[3].trim()
      };
      console.log('Matched alternative format:', result);
      return result;
    }
    
    console.log('No vocabulary pattern matched');
    return null;
  }

  private parseTable(lines: string[], startIndex: number): { data: TableData, endIndex: number } {
    const table: TableData = {
      type: 'table',
      headers: [],
      rows: []
    };
    
    let currentIndex = startIndex;
    
    // Parse headers
    if (lines[currentIndex]?.includes('|')) {
      table.headers = lines[currentIndex]
        .split('|')
        .map(h => h.trim())
        .filter(h => h);
      currentIndex++;
    }
    
    // Skip separator line
    if (lines[currentIndex]?.includes('---')) {
      currentIndex++;
    }
    
    // Parse rows
    while (currentIndex < lines.length && lines[currentIndex]?.includes('|')) {
      const row = lines[currentIndex]
        .split('|')
        .map(c => c.trim())
        .filter(c => c);
      table.rows.push(row);
      currentIndex++;
    }
    
    return { data: table, endIndex: currentIndex - 1 };
  }

  private parseTextContent(text: string): any[] {
    // This method can be enhanced to detect and parse
    // grammar structures, lists, and other content types
    // within regular text blocks
    return [{
      type: 'text',
      value: text
    }];
  }

  private getSectionType(title: string): string {
    const upper = title.toUpperCase();
    
    if (upper.includes('GETTING STARTED')) return 'getting-started';
    if (upper.includes('A CLOSER LOOK 1')) return 'closer-look-1';
    if (upper.includes('A CLOSER LOOK 2')) return 'closer-look-2';
    if (upper.includes('COMMUNICATION')) return 'communication';
    if (upper.includes('SKILLS 1')) return 'skills-1';
    if (upper.includes('SKILLS 2')) return 'skills-2';
    if (upper.includes('LOOKING BACK')) return 'looking-back';
    
    // Fallback patterns
    const lower = title.toLowerCase();
    if (lower.includes('closer look') && lower.includes('1')) return 'closer-look-1';
    if (lower.includes('closer look') && lower.includes('2')) return 'closer-look-2';
    if (lower.includes('skills') && lower.includes('1')) return 'skills-1';
    if (lower.includes('skills') && lower.includes('2')) return 'skills-2';
    if (lower.includes('looking back') || lower.includes('ôn tập')) return 'looking-back';
    
    return 'general';
  }

  private getSubsectionType(title: string): string {
    // Check for emoji indicators first
    if (title.includes('📚') || title.includes('Vocabulary') || title.includes('Từ vựng')) return 'vocabulary';
    if (title.includes('💬') || title.includes('Content') || title.includes('Nội dung')) return 'content';
    if (title.includes('✍️') || title.includes('Exercise') || title.includes('Bài tập')) return 'exercises';
    if (title.includes('🗣️') || title.includes('Pronunciation') || title.includes('Phát âm')) return 'pronunciation';
    if (title.includes('📖') || title.includes('Grammar') || title.includes('Ngữ pháp')) return 'grammar';
    if (title.includes('👂') || title.includes('Listening') || title.includes('Nghe')) return 'listening';
    if (title.includes('Activities') || title.includes('Hoạt động')) return 'activities';
    
    // Fallback to text patterns
    const lower = title.toLowerCase();
    if (lower.includes('vocabulary')) return 'vocabulary';
    if (lower.includes('content')) return 'content';
    if (lower.includes('exercise') || lower.includes('bài')) return 'exercises';
    if (lower.includes('pronunciation')) return 'pronunciation';
    if (lower.includes('grammar')) return 'grammar';
    if (lower.includes('listening')) return 'listening';
    if (lower.includes('reading')) return 'reading';
    if (lower.includes('speaking')) return 'speaking';
    if (lower.includes('writing')) return 'writing';
    
    return 'general';
  }

  private isNewSection(line: string): boolean {
    return !!(
      line.match(/^#{1,3}\s/) ||
      line.match(/^\*\*(Bài|Exercise|Exc?\.?)\s*\d+[:.]\s*/i)
    );
  }
}