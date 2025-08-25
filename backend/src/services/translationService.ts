import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface TranslationWord {
  word: string;
  meaning: string;
  ipa: string;
  type?: string; // n, v, adj, etc for vocab quiz
}

interface TranslationPhrase {
  phrase: string;
  meaning: string;
  type?: string; // phrase type for vocab quiz
}

interface VocabularyItem {
  word: string;
  type: string;
  meaning: string;
  pronunciation: string;
  irregular?: boolean;
}

interface VocabularyExport {
  metadata: {
    date: string;
    grade: number;
    book: string;
    unit: number;
    lesson: string;
    totalWords: number;
  };
  vocabulary: VocabularyItem[];
}

interface TranslationSentence {
  index: number;
  original: string;
  words: TranslationWord[];
  phrases: TranslationPhrase[];
  translation: string;
}

interface TranslationMetadata {
  timestamp: string;
  book: string;
  grade: number;
  unit: number;
  lesson: string;
  context?: string;
  totalSentences: number;
}

interface TranslationAnalysis {
  metadata: TranslationMetadata;
  originalText: string;
  analysis: TranslationSentence[];
}

interface SavedTranslation extends TranslationAnalysis {
  id: string;
  teacherNotes?: string;
  tags?: string[];
  usageCount?: number;
  lastAccessed?: string;
}

interface TranslationQuery {
  grade?: number;
  book?: string;
  unit?: number;
  lesson?: string;
  searchText?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export class TranslationService {
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'translation-database');
    this.ensureDbStructure();
  }

  private ensureDbStructure(): void {
    if (!fs.existsSync(this.dbPath)) {
      fs.mkdirSync(this.dbPath, { recursive: true });
    }
  }

  private getTranslationPath(grade: number, book: string, unit: number, lesson: string): string {
    const bookSafe = book.toLowerCase().replace(/\s+/g, '-');
    const lessonSafe = lesson.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
    return path.join(
      this.dbPath,
      `grade-${grade}`,
      bookSafe,
      `unit-${String(unit).padStart(2, '0')}`,
      lessonSafe
    );
  }

  private ensurePath(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private getTranslationsFile(grade: number, book: string, unit: number, lesson: string): string {
    const dirPath = this.getTranslationPath(grade, book, unit, lesson);
    this.ensurePath(dirPath);
    return path.join(dirPath, 'translations.json');
  }

  private readTranslations(filePath: string): SavedTranslation[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading translations:', error);
      return [];
    }
  }

  private writeTranslations(filePath: string, translations: SavedTranslation[]): void {
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf-8');
  }

  private extractVocabulary(translation: TranslationAnalysis): VocabularyExport {
    const vocabulary: VocabularyItem[] = [];
    const seenWords = new Set<string>();

    // Extract words from all sentences
    translation.analysis.forEach(sentence => {
      // Add individual words
      sentence.words.forEach(word => {
        const key = word.word.toLowerCase();
        if (!seenWords.has(key)) {
          seenWords.add(key);
          vocabulary.push({
            word: word.word,
            type: word.type || 'n',
            meaning: word.meaning,
            pronunciation: word.ipa.replace(/\//g, ''),
            irregular: false
          });
        }
      });

      // Add phrases as vocabulary items
      sentence.phrases.forEach(phrase => {
        const key = phrase.phrase.toLowerCase();
        if (!seenWords.has(key)) {
          seenWords.add(key);
          vocabulary.push({
            word: phrase.phrase,
            type: phrase.type || 'phrase',
            meaning: phrase.meaning,
            pronunciation: '',
            irregular: false
          });
        }
      });
    });

    return {
      metadata: {
        date: new Date().toISOString().split('T')[0],
        grade: translation.metadata.grade,
        book: translation.metadata.book,
        unit: translation.metadata.unit,
        lesson: translation.metadata.lesson,
        totalWords: vocabulary.length
      },
      vocabulary
    };
  }

  private saveVocabularyExport(vocabExport: VocabularyExport): void {
    const { date, grade, book, unit, lesson } = vocabExport.metadata;
    
    // Save by date
    const datePath = path.join(
      this.dbPath,
      'vocabulary-exports',
      date
    );
    this.ensurePath(datePath);
    
    const dateFilename = `grade-${grade}-unit-${unit}-${lesson.toLowerCase().replace(/\s+/g, '-')}.json`;
    const dateFilePath = path.join(datePath, dateFilename);
    fs.writeFileSync(dateFilePath, JSON.stringify(vocabExport, null, 2), 'utf-8');

    // Also save/update combined vocabulary for the lesson
    const lessonPath = path.join(
      this.dbPath,
      'vocabulary-exports',
      'by-lesson',
      `grade-${grade}`,
      book.toLowerCase().replace(/\s+/g, '-'),
      `unit-${String(unit).padStart(2, '0')}`
    );
    this.ensurePath(lessonPath);
    
    const lessonFilename = `${lesson.toLowerCase().replace(/\s+/g, '-')}-vocabulary.json`;
    const lessonFilePath = path.join(lessonPath, lessonFilename);
    
    // Merge with existing vocabulary if file exists
    let combinedVocab: VocabularyItem[] = vocabExport.vocabulary;
    if (fs.existsSync(lessonFilePath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(lessonFilePath, 'utf-8'));
        const existingWords = new Set(existing.vocabulary.map((v: VocabularyItem) => v.word.toLowerCase()));
        
        // Add new words that don't exist
        vocabExport.vocabulary.forEach(item => {
          if (!existingWords.has(item.word.toLowerCase())) {
            existing.vocabulary.push(item);
          }
        });
        combinedVocab = existing.vocabulary;
      } catch (e) {
        console.error('Error merging vocabulary:', e);
      }
    }

    const combinedExport = {
      ...vocabExport,
      vocabulary: combinedVocab,
      metadata: {
        ...vocabExport.metadata,
        lastUpdated: new Date().toISOString()
      }
    };
    
    fs.writeFileSync(lessonFilePath, JSON.stringify(combinedExport, null, 2), 'utf-8');
  }

  async saveTranslation(translation: TranslationAnalysis): Promise<SavedTranslation> {
    const { grade, book, unit, lesson } = translation.metadata;
    const filePath = this.getTranslationsFile(grade, book, unit, lesson);
    
    const savedTranslation: SavedTranslation = {
      ...translation,
      id: uuidv4(),
      usageCount: 0,
      lastAccessed: new Date().toISOString()
    };

    const translations = this.readTranslations(filePath);
    translations.push(savedTranslation);
    this.writeTranslations(filePath, translations);

    // Also save a copy with timestamp for history
    const historyPath = path.join(
      this.getTranslationPath(grade, book, unit, lesson),
      'history'
    );
    this.ensurePath(historyPath);
    const historyFile = path.join(
      historyPath,
      `translation_${Date.now()}_${savedTranslation.id}.json`
    );
    fs.writeFileSync(historyFile, JSON.stringify(savedTranslation, null, 2), 'utf-8');

    // AUTO-EXTRACT AND SAVE VOCABULARY
    const vocabularyExport = this.extractVocabulary(translation);
    this.saveVocabularyExport(vocabularyExport);
    console.log(`✅ Auto-exported ${vocabularyExport.vocabulary.length} vocabulary items`);

    return savedTranslation;
  }

  async getTranslation(id: string, grade: number, book: string, unit: number, lesson: string): Promise<SavedTranslation | null> {
    const filePath = this.getTranslationsFile(grade, book, unit, lesson);
    const translations = this.readTranslations(filePath);
    
    const translation = translations.find(t => t.id === id);
    if (translation) {
      // Update usage count and last accessed
      translation.usageCount = (translation.usageCount || 0) + 1;
      translation.lastAccessed = new Date().toISOString();
      this.writeTranslations(filePath, translations);
    }
    
    return translation || null;
  }

  async getTranslationsByLesson(grade: number, book: string, unit: number, lesson: string): Promise<SavedTranslation[]> {
    const filePath = this.getTranslationsFile(grade, book, unit, lesson);
    return this.readTranslations(filePath);
  }

  async searchTranslations(query: TranslationQuery): Promise<SavedTranslation[]> {
    const results: SavedTranslation[] = [];
    
    // Build search path pattern
    const searchPaths: string[] = [];
    
    if (query.grade && query.book && query.unit && query.lesson) {
      // Specific path
      searchPaths.push(this.getTranslationPath(query.grade, query.book, query.unit, query.lesson));
    } else if (query.grade && query.book && query.unit) {
      // All lessons in a unit
      const unitPath = path.join(
        this.dbPath,
        `grade-${query.grade}`,
        query.book.toLowerCase().replace(/\s+/g, '-'),
        `unit-${String(query.unit).padStart(2, '0')}`
      );
      if (fs.existsSync(unitPath)) {
        const lessons = fs.readdirSync(unitPath);
        lessons.forEach(lesson => {
          searchPaths.push(path.join(unitPath, lesson));
        });
      }
    } else if (query.grade && query.book) {
      // All units in a book
      const bookPath = path.join(
        this.dbPath,
        `grade-${query.grade}`,
        query.book.toLowerCase().replace(/\s+/g, '-')
      );
      if (fs.existsSync(bookPath)) {
        const units = fs.readdirSync(bookPath);
        units.forEach(unit => {
          const unitPath = path.join(bookPath, unit);
          if (fs.existsSync(unitPath) && fs.statSync(unitPath).isDirectory()) {
            const lessons = fs.readdirSync(unitPath);
            lessons.forEach(lesson => {
              searchPaths.push(path.join(unitPath, lesson));
            });
          }
        });
      }
    } else if (query.grade) {
      // All books in a grade
      const gradePath = path.join(this.dbPath, `grade-${query.grade}`);
      if (fs.existsSync(gradePath)) {
        const books = fs.readdirSync(gradePath);
        books.forEach(book => {
          const bookPath = path.join(gradePath, book);
          if (fs.existsSync(bookPath) && fs.statSync(bookPath).isDirectory()) {
            const units = fs.readdirSync(bookPath);
            units.forEach(unit => {
              const unitPath = path.join(bookPath, unit);
              if (fs.existsSync(unitPath) && fs.statSync(unitPath).isDirectory()) {
                const lessons = fs.readdirSync(unitPath);
                lessons.forEach(lesson => {
                  searchPaths.push(path.join(unitPath, lesson));
                });
              }
            });
          }
        });
      }
    } else {
      // Search all
      this.getAllTranslationPaths(this.dbPath, searchPaths);
    }

    // Read and filter translations
    searchPaths.forEach(dirPath => {
      const filePath = path.join(dirPath, 'translations.json');
      if (fs.existsSync(filePath)) {
        const translations = this.readTranslations(filePath);
        
        translations.forEach(translation => {
          let matches = true;

          // Filter by search text
          if (query.searchText) {
            const searchLower = query.searchText.toLowerCase();
            matches = matches && !!(
              translation.originalText.toLowerCase().includes(searchLower) ||
              translation.analysis.some(s => 
                s.original.toLowerCase().includes(searchLower) ||
                s.translation.toLowerCase().includes(searchLower)
              ) ||
              (translation.metadata.context && translation.metadata.context.toLowerCase().includes(searchLower)) ||
              (translation.teacherNotes && translation.teacherNotes.toLowerCase().includes(searchLower))
            );
          }

          // Filter by tags
          if (query.tags && query.tags.length > 0) {
            matches = matches && query.tags.every(tag => 
              translation.tags && translation.tags.includes(tag)
            );
          }

          // Filter by date range
          if (query.dateFrom) {
            matches = matches && new Date(translation.metadata.timestamp) >= new Date(query.dateFrom);
          }
          if (query.dateTo) {
            matches = matches && new Date(translation.metadata.timestamp) <= new Date(query.dateTo);
          }

          if (matches) {
            results.push(translation);
          }
        });
      }
    });

    // Sort by timestamp (newest first)
    results.sort((a, b) => 
      new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime()
    );

    return results;
  }

  private getAllTranslationPaths(dir: string, paths: string[], level: number = 0): void {
    if (level > 3) return; // Max depth for grade/book/unit/lesson structure

    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        if (fs.statSync(itemPath).isDirectory()) {
          if (level === 3) {
            // This should be a lesson directory
            paths.push(itemPath);
          } else {
            this.getAllTranslationPaths(itemPath, paths, level + 1);
          }
        }
      });
    }
  }

  async updateTranslation(
    id: string, 
    grade: number, 
    book: string, 
    unit: number, 
    lesson: string,
    updates: Partial<SavedTranslation>
  ): Promise<SavedTranslation | null> {
    const filePath = this.getTranslationsFile(grade, book, unit, lesson);
    const translations = this.readTranslations(filePath);
    
    const index = translations.findIndex(t => t.id === id);
    if (index === -1) {
      return null;
    }

    // Update allowed fields
    if (updates.teacherNotes !== undefined) {
      translations[index].teacherNotes = updates.teacherNotes;
    }
    if (updates.tags !== undefined) {
      translations[index].tags = updates.tags;
    }

    this.writeTranslations(filePath, translations);
    return translations[index];
  }

  async deleteTranslation(id: string, grade: number, book: string, unit: number, lesson: string): Promise<boolean> {
    const filePath = this.getTranslationsFile(grade, book, unit, lesson);
    const translations = this.readTranslations(filePath);
    
    const filteredTranslations = translations.filter(t => t.id !== id);
    
    if (filteredTranslations.length === translations.length) {
      return false; // Translation not found
    }

    this.writeTranslations(filePath, filteredTranslations);
    return true;
  }

  async getVocabularyByDate(date: string): Promise<VocabularyExport[]> {
    const datePath = path.join(this.dbPath, 'vocabulary-exports', date);
    
    if (!fs.existsSync(datePath)) {
      return [];
    }

    const files = fs.readdirSync(datePath);
    const vocabularyExports: VocabularyExport[] = [];

    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(path.join(datePath, file), 'utf-8');
          vocabularyExports.push(JSON.parse(content));
        } catch (e) {
          console.error(`Error reading vocabulary file ${file}:`, e);
        }
      }
    });

    return vocabularyExports;
  }

  async getVocabularyToday(): Promise<VocabularyExport[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getVocabularyByDate(today);
  }

  async getVocabularyLastWeek(): Promise<VocabularyExport[]> {
    const vocabularyExports: VocabularyExport[] = [];
    const today = new Date();
    
    // Get vocabulary from last 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayVocab = await this.getVocabularyByDate(dateStr);
      vocabularyExports.push(...dayVocab);
    }

    return vocabularyExports;
  }

  async getVocabularyByDateAndGrade(date: string, grade: number): Promise<VocabularyExport[]> {
    const datePath = path.join(this.dbPath, 'vocabulary-exports', date);
    
    if (!fs.existsSync(datePath)) {
      return [];
    }

    const files = fs.readdirSync(datePath);
    const vocabularyExports: VocabularyExport[] = [];

    files.forEach(file => {
      if (file.endsWith('.json') && file.includes(`grade-${grade}-`)) {
        try {
          const content = fs.readFileSync(path.join(datePath, file), 'utf-8');
          const vocabData = JSON.parse(content);
          // Double check the grade matches
          if (vocabData.metadata && vocabData.metadata.grade === grade) {
            vocabularyExports.push(vocabData);
          }
        } catch (e) {
          console.error(`Error reading vocabulary file ${file}:`, e);
        }
      }
    });

    return vocabularyExports;
  }

  async getVocabularyThisWeekByGrade(grade: number): Promise<VocabularyExport[]> {
    const vocabularyExports: VocabularyExport[] = [];
    const today = new Date();
    
    // Get vocabulary from last 7 days for specific grade
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayVocab = await this.getVocabularyByDateAndGrade(dateStr, grade);
      vocabularyExports.push(...dayVocab);
    }

    return vocabularyExports;
  }

  async getVocabularyThisMonthByGrade(grade: number): Promise<VocabularyExport[]> {
    const vocabularyExports: VocabularyExport[] = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Get all days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date <= today) {
        const dateStr = date.toISOString().split('T')[0];
        const dayVocab = await this.getVocabularyByDateAndGrade(dateStr, grade);
        vocabularyExports.push(...dayVocab);
      }
    }

    return vocabularyExports;
  }

  async getVocabularyByDateRange(startDate: string, endDate: string, grade?: number): Promise<VocabularyExport[]> {
    const vocabularyExports: VocabularyExport[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      
      if (grade) {
        const dayVocab = await this.getVocabularyByDateAndGrade(dateStr, grade);
        vocabularyExports.push(...dayVocab);
      } else {
        const dayVocab = await this.getVocabularyByDate(dateStr);
        vocabularyExports.push(...dayVocab);
      }
    }

    return vocabularyExports;
  }

  async getVocabularyByLesson(grade: number, book: string, unit: number, lesson: string): Promise<VocabularyExport | null> {
    const lessonPath = path.join(
      this.dbPath,
      'vocabulary-exports',
      'by-lesson',
      `grade-${grade}`,
      book.toLowerCase().replace(/\s+/g, '-'),
      `unit-${String(unit).padStart(2, '0')}`,
      `${lesson.toLowerCase().replace(/\s+/g, '-')}-vocabulary.json`
    );

    if (!fs.existsSync(lessonPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(lessonPath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading lesson vocabulary:', e);
      return null;
    }
  }

  async getStatistics(): Promise<any> {
    const stats = {
      totalTranslations: 0,
      byGrade: {} as Record<number, number>,
      byBook: {} as Record<string, number>,
      byUnit: {} as Record<string, number>,
      recentTranslations: [] as any[],
      mostUsed: [] as any[]
    };

    const allTranslations: SavedTranslation[] = [];
    const searchPaths: string[] = [];
    this.getAllTranslationPaths(this.dbPath, searchPaths);

    searchPaths.forEach(dirPath => {
      const filePath = path.join(dirPath, 'translations.json');
      if (fs.existsSync(filePath)) {
        const translations = this.readTranslations(filePath);
        allTranslations.push(...translations);
      }
    });

    // Calculate statistics
    stats.totalTranslations = allTranslations.length;

    allTranslations.forEach(t => {
      // By grade
      stats.byGrade[t.metadata.grade] = (stats.byGrade[t.metadata.grade] || 0) + 1;
      
      // By book
      stats.byBook[t.metadata.book] = (stats.byBook[t.metadata.book] || 0) + 1;
      
      // By unit
      const unitKey = `Grade ${t.metadata.grade} - Unit ${t.metadata.unit}`;
      stats.byUnit[unitKey] = (stats.byUnit[unitKey] || 0) + 1;
    });

    // Recent translations (last 10)
    stats.recentTranslations = allTranslations
      .sort((a, b) => new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime())
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        grade: t.metadata.grade,
        book: t.metadata.book,
        unit: t.metadata.unit,
        lesson: t.metadata.lesson,
        timestamp: t.metadata.timestamp,
        preview: t.originalText.substring(0, 100) + '...'
      }));

    // Most used translations (top 10)
    stats.mostUsed = allTranslations
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        grade: t.metadata.grade,
        book: t.metadata.book,
        unit: t.metadata.unit,
        lesson: t.metadata.lesson,
        usageCount: t.usageCount || 0,
        preview: t.originalText.substring(0, 100) + '...'
      }));

    return stats;
  }
}

export default new TranslationService();