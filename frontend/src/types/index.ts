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
  number?: string;
  english?: string;
  word?: string;
  partOfSpeech?: string;
  vietnamese?: string;
  meaning?: string;
  pronunciation?: string;
}

export interface DialogueItem {
  type: 'dialogue';
  speaker: string;
  text: string;
  translation?: string;
}

export interface TextContent {
  type: 'text';
  value: string;
}

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
  answer?: string;
  subParts?: ExercisePart[];
}

export interface TableData {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface Grammar {
  type: 'grammar';
  title: string;
  structure?: string[];
  usage?: GrammarUsage[];
  examples?: Example[];
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

export type ContentItem = VocabularyItem | DialogueItem | TextContent | Exercise | TableData | Grammar;

export interface Section {
  type: string;
  title: string;
  content: ContentItem[];
  subsections?: Section[];
  originalIndex?: number;
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
