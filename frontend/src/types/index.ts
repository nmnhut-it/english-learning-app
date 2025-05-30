export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  title?: string;
  children?: FileTreeNode[];
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface VocabularyItem {
  type: 'vocabulary';
  number: string;
  english: string;
  vietnamese: string;
  pronunciation: string;
}

export interface DialogueItem {
  type: 'dialogue';
  speaker: string;
  text: string;
}

export interface TextContent {
  type: 'text';
  value: string;
}

export type ContentItem = VocabularyItem | DialogueItem | TextContent;

export interface Section {
  type: string;
  title: string;
  content: ContentItem[];
  subsections?: Section[];
}

export interface Unit {
  type: 'unit';
  title: string;
  sections: Section[];
}

export interface GameMode {
  id: 'ipa-to-word' | 'meaning-to-word' | 'word-to-meaning';
  name: string;
  description: string;
}
