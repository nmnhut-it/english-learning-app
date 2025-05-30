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
    let currentSection: any = null;
    let currentSubsection: any = null;
    let currentContent: string[] = [];
    let sectionIndex = 0;

    const flushContent = () => {
      if (currentContent.length > 0) {
        const contentStr = currentContent.join('\n').trim();
        if (contentStr) {
          const target = currentSubsection || currentSection;
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

    lines.forEach((line, index) => {
      // Main heading
      if (line.match(/^#\s+/)) {
        flushContent();
        const title = line.replace(/^#\s+/, '').trim();
        currentSection = {
          type: 'unit',
          title,
          sections: []
        };
        sections.push(currentSection);
        currentSubsection = null;
      }
      // Section heading
      else if (line.match(/^##\s+/)) {
        flushContent();
        const title = line.replace(/^##\s+/, '').trim();
        currentSubsection = {
          type: this.getSectionType(title),
          title,
          content: [],
          originalIndex: sectionIndex++
        };
        if (currentSection) {
          currentSection.sections.push(currentSubsection);
        }
      }
      // Subsection heading
      else if (line.match(/^###\s+/)) {
        flushContent();
        const title = line.replace(/^###\s+/, '').trim();
        const subsection = {
          type: this.getSubsectionType(title),
          title,
          content: []
        };
        if (currentSubsection) {
          if (!currentSubsection.subsections) currentSubsection.subsections = [];
          currentSubsection.subsections.push(subsection);
        }
      }
      // Vocabulary items
      else if (line.match(/^\d+\.\s+\*\*[^*]+\*\*\s*:/)) {
        flushContent();
        const match = line.match(/^(\d+)\.\s+\*\*([^*]+)\*\*\s*:\s*([^/]+)\/([^/]+)\//);
        if (match) {
          const vocab = {
            type: 'vocabulary',
            number: match[1],
            english: match[2].trim(),
            vietnamese: match[3].trim(),
            pronunciation: match[4].trim()
          };
          const target = currentSubsection || currentSection;
          if (target) {
            if (!target.content) target.content = [];
            target.content.push(vocab);
          }
        }
      }
      // Dialogue
      else if (line.match(/^\*\*[^:]+\*\*:/)) {
        const match = line.match(/^\*\*([^:]+)\*\*:\s*(.+)/);
        if (match) {
          const dialogue = {
            type: 'dialogue',
            speaker: match[1],
            text: match[2]
          };
          const target = currentSubsection || currentSection;
          if (target) {
            if (!target.content) target.content = [];
            target.content.push(dialogue);
          }
        }
      }
      // Regular content
      else {
        currentContent.push(line);
      }
    });

    flushContent();
    
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
    
    return 'general';
  }

  private getSubsectionType(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('vocabulary')) return 'vocabulary';
    if (lower.includes('pronunciation')) return 'pronunciation';
    if (lower.includes('grammar')) return 'grammar';
    if (lower.includes('exercise')) return 'exercises';
    if (lower.includes('reading')) return 'reading';
    if (lower.includes('listening')) return 'listening';
    if (lower.includes('speaking')) return 'speaking';
    if (lower.includes('writing')) return 'writing';
    return 'general';
  }
}
