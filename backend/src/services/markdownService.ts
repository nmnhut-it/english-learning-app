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
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = data.title || (titleMatch ? titleMatch[1] : item.replace('.md', ''));
        
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

    const flushContent = () => {
      if (currentContent.length > 0) {
        const contentStr = currentContent.join('\n').trim();
        if (contentStr) {
          const target = currentSubsection || currentSection || currentUnit;
          if (target) {
            if (!target.content) target.content = [];
            target.content.push({
              type: 'text',
              value: contentStr
            });
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
            parts: []
          };
        }
      }
      // Check for answer section
      else if ((line.match(/^\*\*(Answer|Đáp án|Sample Answer|Key)s?:\*\*/i) || 
                line.match(/^(Answer|Đáp án|Sample Answer|Key)s?:/i)) && currentExercise) {
        // Flush current part if exists
        if (currentExercisePart && exerciseBuffer.length > 0) {
          currentExercisePart.content = exerciseBuffer.join('\n').trim();
          exerciseBuffer = [];
          currentExercisePart = null;
        }
        
        // Start collecting answer
        currentExercise.answer = '';
        let answerLines: string[] = [];
        let j = index + 1;
        
        while (j < lines.length && 
               !lines[j].match(/^\*\*(Bài|Exercise|Exc?\.?)\s*\d+[:.]\s*/i) &&
               !lines[j].match(/^#{1,3}\s/)) {
          answerLines.push(lines[j]);
          lines[j] = ''; // Clear processed lines
          j++;
        }
        
        currentExercise.answer = answerLines.join('\n').trim();
      }
      // Check for exercise sub-part (a), b), c) or 1., 2., 3.)
      else if (currentExercise && line.match(/^[a-z]\)|^\d+\./)) {
        // Flush previous part if exists
        if (currentExercisePart && exerciseBuffer.length > 0) {
          currentExercisePart.content = exerciseBuffer.join('\n').trim();
          exerciseBuffer = [];
        }
        
        const subPartMatch = line.match(/^([a-z])\)|^(\d+)\./);
        if (subPartMatch) {
          currentExercisePart = {
            label: subPartMatch[1] || subPartMatch[2],
            content: ''
          };
          currentExercise.parts.push(currentExercisePart);
          // Add the rest of the line to buffer
          const restOfLine = line.substring(subPartMatch[0].length).trim();
          if (restOfLine) {
            exerciseBuffer.push(restOfLine);
          }
        }
      }
      // If we're in an exercise, collect content
      else if (currentExercise && !line.match(/^\*\*[^:]+\*\*:/) && !line.match(/^(\d+\.|-\s+\*\*)/)) {
        if (currentExercisePart) {
          exerciseBuffer.push(line);
        } else {
          // This is instruction text before sub-parts
          if (!currentExercise.instruction) {
            currentExercise.instruction = line;
          } else {
            currentExercise.instruction += '\n' + line;
          }
        }
      }
      // Vocabulary items - both numbered and bullet formats
      else if (line.match(/^(\d+\.|-)\s+\*\*[^*]+\*\*\s*:/)) {
        flushContent();
        // Pattern 1: number. **word** : (type) meaning /pronunciation/
        // Pattern 2: - **word** : (type) meaning /pronunciation/
        const numberedMatch = line.match(/^(\d+)\.\s+\*\*([^*]+)\*\*\s*:\s*\(([^)]+)\)\s*([^/]+)\/([^/]+)\//);  
        const bulletMatch = line.match(/^-\s+\*\*([^*]+)\*\*\s*:\s*\(([^)]+)\)\s*([^/]+)\/([^/]+)\//);  
        
        let match = numberedMatch || bulletMatch;
        if (match) {
          const vocab = {
            type: 'vocabulary',
            number: numberedMatch ? match[1] : '',
            english: numberedMatch ? match[2].trim() : match[1].trim(),
            partOfSpeech: numberedMatch ? match[3].trim() : match[2].trim(),
            vietnamese: numberedMatch ? match[4].trim() : match[3].trim(),
            pronunciation: numberedMatch ? match[5].trim() : match[4].trim()
          };
          const target = currentSubsection || currentSection;
          if (target) {
            if (!target.content) target.content = [];
            target.content.push(vocab);
          }
        }
      }
      // Dialogue
      else if (line.match(/^\*\*[^:]+\*\*:/) && !currentExercise) {
        flushContent();
        const match = line.match(/^\*\*([^:]+)\*\*:\s*(.+)/);
        if (match) {
          const dialogue = {
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
        if (line || line === '') {
          currentContent.push(line);
        }
      }
    });

    flushContent();
    flushExercise();
    
    // Sort sections in each unit according to pedagogical order
    sections.forEach(unit => {
      if (unit.sections && unit.sections.length > 0) {
        unit.sections = this.sortSections(unit.sections);
      }
    });
    
    return sections;
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
}
