import type { 
  Unit, 
  Grade, 
  Curriculum, 
  VocabularyItem, 
  Exercise, 
  ContentLoadResponse,
  APIResponse 
} from '@/types';

/**
 * Content Service for loading and parsing XML educational content
 * Handles curriculum data, vocabulary, exercises, and assessments
 */
export class ContentService {
  private static instance: ContentService;
  private contentCache: Map<string, any> = new Map();
  private parser: DOMParser;
  
  // Configuration
  private readonly cacheMaxSize = 50;
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes
  private readonly baseDataPath = '/data/structured';

  private constructor() {
    this.parser = new DOMParser();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }

  /**
   * Load full curriculum data
   */
  public async loadCurriculum(): Promise<Curriculum> {
    const cacheKey = 'curriculum';
    const cached = this.getFromCache<Curriculum>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseDataPath}/curriculum.xml`);
      if (!response.ok) {
        throw new Error(`Failed to load curriculum: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const xmlDoc = this.parser.parseFromString(xmlText, 'text/xml');
      
      const curriculum = this.parseCurriculum(xmlDoc);
      this.setCache(cacheKey, curriculum);
      
      return curriculum;
    } catch (error) {
      console.error('Failed to load curriculum:', error);
      throw error;
    }
  }

  /**
   * Load specific grade data
   */
  public async loadGrade(gradeLevel: number): Promise<Grade> {
    const cacheKey = `grade-${gradeLevel}`;
    const cached = this.getFromCache<Grade>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseDataPath}/grade-${gradeLevel}/grade.xml`);
      if (!response.ok) {
        throw new Error(`Failed to load grade ${gradeLevel}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const xmlDoc = this.parser.parseFromString(xmlText, 'text/xml');
      
      const grade = this.parseGrade(xmlDoc);
      this.setCache(cacheKey, grade);
      
      return grade;
    } catch (error) {
      console.error(`Failed to load grade ${gradeLevel}:`, error);
      throw error;
    }
  }

  /**
   * Load specific unit data
   */
  public async loadUnit(gradeLevel: number, unitId: string): Promise<Unit> {
    const cacheKey = `unit-${gradeLevel}-${unitId}`;
    const cached = this.getFromCache<Unit>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseDataPath}/grade-${gradeLevel}/${unitId}.xml`);
      if (!response.ok) {
        throw new Error(`Failed to load unit ${unitId}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const xmlDoc = this.parser.parseFromString(xmlText, 'text/xml');
      
      const unit = this.parseUnit(xmlDoc);
      this.setCache(cacheKey, unit);
      
      return unit;
    } catch (error) {
      console.error(`Failed to load unit ${unitId}:`, error);
      throw error;
    }
  }

  /**
   * Search vocabulary across all units
   */
  public async searchVocabulary(
    query: string, 
    gradeLevel?: number, 
    limit = 20
  ): Promise<VocabularyItem[]> {
    const cacheKey = `vocab-search-${query}-${gradeLevel || 'all'}-${limit}`;
    const cached = this.getFromCache<VocabularyItem[]>(cacheKey);
    if (cached) return cached;

    try {
      // Load relevant grade(s)
      const grades = gradeLevel ? [gradeLevel] : [6, 7, 8, 9, 10, 11, 12];
      const vocabularyItems: VocabularyItem[] = [];

      for (const grade of grades) {
        try {
          const gradeData = await this.loadGrade(grade);
          for (const unit of gradeData.units) {
            const matchingVocab = unit.vocabulary_bank.filter(item =>
              item.word.toLowerCase().includes(query.toLowerCase()) ||
              item.definition.toLowerCase().includes(query.toLowerCase()) ||
              item.translation.toLowerCase().includes(query.toLowerCase())
            );
            vocabularyItems.push(...matchingVocab);
          }
        } catch (error) {
          console.warn(`Failed to search vocabulary in grade ${grade}:`, error);
        }
      }

      // Sort by relevance and limit results
      const results = vocabularyItems
        .sort((a, b) => {
          const aScore = this.calculateRelevanceScore(a, query);
          const bScore = this.calculateRelevanceScore(b, query);
          return bScore - aScore;
        })
        .slice(0, limit);

      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Failed to search vocabulary:', error);
      throw error;
    }
  }

  /**
   * Get exercises by type and difficulty
   */
  public async getExercises(
    gradeLevel: number,
    unitId: string,
    type?: string,
    difficulty?: number
  ): Promise<Exercise[]> {
    const unit = await this.loadUnit(gradeLevel, unitId);
    let exercises: Exercise[] = [];

    // Collect exercises from all sections
    unit.sections.forEach(section => {
      exercises.push(...section.exercises);
    });

    // Filter by type and difficulty
    if (type) {
      exercises = exercises.filter(ex => ex.type === type);
    }
    if (difficulty) {
      exercises = exercises.filter(ex => ex.difficulty === difficulty);
    }

    return exercises;
  }

  /**
   * Get vocabulary for specific unit
   */
  public async getUnitVocabulary(gradeLevel: number, unitId: string): Promise<VocabularyItem[]> {
    const unit = await this.loadUnit(gradeLevel, unitId);
    return unit.vocabulary_bank;
  }

  /**
   * Convert markdown content to structured format
   */
  public async convertMarkdownToXML(markdownContent: string, metadata: any): Promise<string> {
    // This would integrate with AI service to convert markdown to XML
    // For now, return a placeholder
    console.log('Converting markdown to XML:', { markdownContent, metadata });
    throw new Error('Markdown conversion not implemented yet');
  }

  /**
   * Validate XML content against schema
   */
  public validateXMLContent(xmlContent: string): ValidationResult {
    try {
      const xmlDoc = this.parser.parseFromString(xmlContent, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        return {
          valid: false,
          errors: ['XML parsing error: ' + parseError.textContent]
        };
      }

      // Basic structure validation
      const errors: string[] = [];
      const root = xmlDoc.documentElement;

      if (!root) {
        errors.push('No root element found');
      } else {
        // Validate required elements based on root type
        if (root.tagName === 'unit') {
          this.validateUnitStructure(root, errors);
        } else if (root.tagName === 'grade') {
          this.validateGradeStructure(root, errors);
        } else if (root.tagName === 'curriculum') {
          this.validateCurriculumStructure(root, errors);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Validation failed: ' + (error as Error).message]
      };
    }
  }

  // Private parsing methods

  /**
   * Parse full curriculum XML
   */
  private parseCurriculum(xmlDoc: Document): Curriculum {
    const root = xmlDoc.documentElement;
    
    const metadata = {
      title: this.getTextContent(root, 'metadata > title') || '',
      version: this.getTextContent(root, 'metadata > version') || '',
      created_date: this.getTextContent(root, 'metadata > created_date') || '',
      language: this.getTextContent(root, 'metadata > language') || '',
      publisher: this.getTextContent(root, 'metadata > publisher') || ''
    };

    const grades: Grade[] = [];
    const gradeElements = root.querySelectorAll('grades > grade');
    
    gradeElements.forEach(gradeEl => {
      grades.push(this.parseGradeElement(gradeEl));
    });

    return { metadata, grades };
  }

  /**
   * Parse grade XML
   */
  private parseGrade(xmlDoc: Document): Grade {
    const root = xmlDoc.documentElement;
    return this.parseGradeElement(root);
  }

  /**
   * Parse grade element
   */
  private parseGradeElement(gradeEl: Element): Grade {
    const level = parseInt(gradeEl.getAttribute('level') || '0');
    const cefr_level = gradeEl.getAttribute('cefr_level') as any || 'A1';

    const metadata = {
      title: this.getTextContent(gradeEl, 'metadata > title') || '',
      description: this.getTextContent(gradeEl, 'metadata > description') || '',
      total_units: parseInt(this.getTextContent(gradeEl, 'metadata > total_units') || '0'),
      estimated_hours: parseInt(this.getTextContent(gradeEl, 'metadata > estimated_hours') || '0')
    };

    const units: Unit[] = [];
    const unitElements = gradeEl.querySelectorAll('units > unit');
    
    unitElements.forEach(unitEl => {
      units.push(this.parseUnitElement(unitEl));
    });

    return { level, cefr_level, metadata, units };
  }

  /**
   * Parse unit XML
   */
  private parseUnit(xmlDoc: Document): Unit {
    const root = xmlDoc.documentElement;
    return this.parseUnitElement(root);
  }

  /**
   * Parse unit element
   */
  private parseUnitElement(unitEl: Element): Unit {
    const id = unitEl.getAttribute('id') || '';
    const title = unitEl.getAttribute('title') || '';
    const order = parseInt(unitEl.getAttribute('order') || '0');

    const metadata = {
      description: this.getTextContent(unitEl, 'metadata > description') || '',
      learning_objectives: this.parseLearningObjectives(unitEl),
      estimated_duration: parseInt(this.getTextContent(unitEl, 'metadata > estimated_duration') || '0'),
      difficulty_progression: this.getTextContent(unitEl, 'metadata > difficulty_progression') || '',
      vocabulary_count: parseInt(this.getTextContent(unitEl, 'metadata > vocabulary_count') || '0')
    };

    const vocabulary_bank = this.parseVocabularyBank(unitEl);
    const sections = this.parseSections(unitEl);
    const assessments = this.parseAssessments(unitEl);

    return { id, title, order, metadata, vocabulary_bank, sections, assessments };
  }

  /**
   * Parse vocabulary bank
   */
  private parseVocabularyBank(unitEl: Element): VocabularyItem[] {
    const vocabularyItems: VocabularyItem[] = [];
    const vocabElements = unitEl.querySelectorAll('vocabulary_bank > vocabulary_item');

    vocabElements.forEach(vocabEl => {
      vocabularyItems.push(this.parseVocabularyItem(vocabEl));
    });

    return vocabularyItems;
  }

  /**
   * Parse vocabulary item
   */
  private parseVocabularyItem(vocabEl: Element): VocabularyItem {
    const id = vocabEl.getAttribute('id') || '';
    const word = this.getTextContent(vocabEl, 'word') || '';
    const definition = this.getTextContent(vocabEl, 'definition') || '';
    const translation = this.getTextContent(vocabEl, 'translation') || '';
    const frequency = (vocabEl.getAttribute('frequency') as any) || 'medium';
    const cefr = (vocabEl.getAttribute('cefr') as any) || 'A1';
    const part_of_speech = (vocabEl.getAttribute('part_of_speech') as any) || 'noun';

    const pronunciation = {
      ipa: this.getTextContent(vocabEl, 'pronunciation > ipa') || '',
      audio_files: this.parseAudioFiles(vocabEl)
    };

    const examples = this.parseExamples(vocabEl);
    const collocations = this.parseCollocations(vocabEl);
    const synonyms = this.parseSynonyms(vocabEl);
    const word_family = this.parseWordFamily(vocabEl);
    const usage_notes = this.parseUsageNotes(vocabEl);

    return {
      id,
      word,
      pronunciation,
      definition,
      translation,
      examples,
      collocations,
      synonyms,
      word_family,
      usage_notes,
      frequency,
      cefr,
      part_of_speech
    };
  }

  /**
   * Parse sections
   */
  private parseSections(unitEl: Element): any[] {
    const sections: any[] = [];
    const sectionElements = unitEl.querySelectorAll('sections > section');

    sectionElements.forEach(sectionEl => {
      sections.push(this.parseSectionElement(sectionEl));
    });

    return sections;
  }

  /**
   * Parse section element
   */
  private parseSectionElement(sectionEl: Element): any {
    const id = sectionEl.getAttribute('id') || '';
    const title = sectionEl.getAttribute('title') || '';
    const order = parseInt(sectionEl.getAttribute('order') || '0');
    const type = sectionEl.getAttribute('type') || 'introduction';

    const metadata = {
      estimated_duration: parseInt(this.getTextContent(sectionEl, 'metadata > estimated_duration') || '0'),
      skills_focus: this.getTextContent(sectionEl, 'metadata > skills_focus') || '',
      materials_needed: this.getTextContent(sectionEl, 'metadata > materials_needed') || ''
    };

    const learning_content = this.parseLearningContent(sectionEl);
    const exercises = this.parseExercises(sectionEl);
    const vocabulary_focus = this.parseVocabularyReferences(sectionEl);

    return {
      id,
      title,
      order,
      type,
      metadata,
      learning_content,
      exercises,
      vocabulary_focus
    };
  }

  /**
   * Parse exercises
   */
  private parseExercises(parentEl: Element): Exercise[] {
    const exercises: Exercise[] = [];
    const exerciseElements = parentEl.querySelectorAll('exercises > exercise');

    exerciseElements.forEach(exerciseEl => {
      exercises.push(this.parseExerciseElement(exerciseEl));
    });

    return exercises;
  }

  /**
   * Parse exercise element
   */
  private parseExerciseElement(exerciseEl: Element): Exercise {
    const id = exerciseEl.getAttribute('id') || '';
    const type = (exerciseEl.getAttribute('type') as any) || 'multiple_choice';
    const difficulty = parseInt(exerciseEl.getAttribute('difficulty') || '1') as any;
    const estimated_time = parseInt(exerciseEl.getAttribute('estimated_time') || '0');
    const points = parseInt(exerciseEl.getAttribute('points') || '0');

    const metadata = {
      title: this.getTextContent(exerciseEl, 'metadata > title') || '',
      instructions: {
        text: this.getTextContent(exerciseEl, 'metadata > instructions > text') || '',
        translation: this.getTextContent(exerciseEl, 'metadata > instructions > translation') || ''
      },
      prerequisite_vocabulary: this.parseVocabularyReferences(exerciseEl)
    };

    const question = {
      text: this.getTextContent(exerciseEl, 'question > text') || '',
      translation: this.getTextContent(exerciseEl, 'question > translation') || '',
      audio_cue: this.getTextContent(exerciseEl, 'question > audio_cue') || undefined
    };

    const validation = {
      case_sensitive: this.getBooleanAttribute(exerciseEl, 'validation', 'case_sensitive', false),
      ignore_articles: this.getBooleanAttribute(exerciseEl, 'validation', 'ignore_articles', true),
      accept_contractions: this.getBooleanAttribute(exerciseEl, 'validation', 'accept_contractions', true)
    };

    const learning_analytics = {
      track_metrics: this.getTextContent(exerciseEl, 'learning_analytics > track_metrics')?.split(',') || [],
      difficulty_adjustment: this.getBooleanAttribute(exerciseEl, 'learning_analytics', 'difficulty_adjustment', false)
    };

    return {
      id,
      type,
      difficulty,
      estimated_time,
      points,
      metadata,
      question,
      validation,
      learning_analytics
    };
  }

  // Utility methods for parsing

  private getTextContent(parent: Element, selector: string): string | null {
    const element = parent.querySelector(selector);
    return element?.textContent?.trim() || null;
  }

  private getBooleanAttribute(parent: Element, section: string, attr: string, defaultValue: boolean): boolean {
    const sectionEl = parent.querySelector(section);
    if (!sectionEl) return defaultValue;
    const value = sectionEl.getAttribute(attr);
    return value === 'true';
  }

  private parseAudioFiles(vocabEl: Element): any[] {
    const audioFiles: any[] = [];
    const audioElements = vocabEl.querySelectorAll('pronunciation > audio_files > audio');

    audioElements.forEach(audioEl => {
      audioFiles.push({
        accent: audioEl.getAttribute('accent') || 'british',
        file: audioEl.getAttribute('file') || '',
        duration: parseFloat(audioEl.getAttribute('duration') || '0')
      });
    });

    return audioFiles;
  }

  private parseExamples(vocabEl: Element): any[] {
    const examples: any[] = [];
    const exampleElements = vocabEl.querySelectorAll('examples > example');

    exampleElements.forEach(exampleEl => {
      examples.push({
        text: exampleEl.querySelector('text')?.textContent || '',
        translation: exampleEl.querySelector('translation')?.textContent || '',
        difficulty: parseInt(exampleEl.getAttribute('difficulty') || '1')
      });
    });

    return examples;
  }

  private parseCollocations(vocabEl: Element): any[] {
    const collocations: any[] = [];
    const collocationElements = vocabEl.querySelectorAll('collocations > collocation');

    collocationElements.forEach(collEl => {
      collocations.push({
        phrase: collEl.textContent || '',
        frequency: collEl.getAttribute('frequency') || 'medium'
      });
    });

    return collocations;
  }

  private parseSynonyms(vocabEl: Element): any[] {
    const synonyms: any[] = [];
    const synonymElements = vocabEl.querySelectorAll('synonyms > synonym');

    synonymElements.forEach(synEl => {
      synonyms.push({
        word: synEl.textContent || '',
        cefr: synEl.getAttribute('cefr') || 'A1'
      });
    });

    return synonyms;
  }

  private parseWordFamily(vocabEl: Element): any[] {
    const wordFamily: any[] = [];
    const familyElements = vocabEl.querySelectorAll('word_family > related');

    familyElements.forEach(relEl => {
      wordFamily.push({
        word: relEl.getAttribute('word') || '',
        pos: relEl.getAttribute('pos') || 'noun',
        cefr: relEl.getAttribute('cefr') || 'A1'
      });
    });

    return wordFamily;
  }

  private parseUsageNotes(vocabEl: Element): string[] {
    const notes: string[] = [];
    const noteElements = vocabEl.querySelectorAll('usage_notes > note');

    noteElements.forEach(noteEl => {
      notes.push(noteEl.textContent || '');
    });

    return notes;
  }

  private parseLearningObjectives(unitEl: Element): any[] {
    const objectives: any[] = [];
    const objElements = unitEl.querySelectorAll('metadata > learning_objectives > objective');

    objElements.forEach(objEl => {
      objectives.push({
        id: objEl.getAttribute('id') || '',
        type: objEl.getAttribute('type') || 'vocabulary',
        text: objEl.textContent || ''
      });
    });

    return objectives;
  }

  private parseLearningContent(sectionEl: Element): any {
    // Simplified parsing - would include dialogues, reading passages, etc.
    return {
      dialogues: [],
      reading_passages: [],
      audio_content: []
    };
  }

  private parseAssessments(unitEl: Element): any[] {
    // Simplified parsing - would include full assessment structure
    return [];
  }

  private parseVocabularyReferences(parentEl: Element): any[] {
    const refs: any[] = [];
    const refElements = parentEl.querySelectorAll('vocabulary_focus > ref, vocabulary_refs > ref');

    refElements.forEach(refEl => {
      refs.push({
        id: refEl.getAttribute('id') || '',
        emphasis: refEl.getAttribute('emphasis') === 'true'
      });
    });

    return refs;
  }

  // Validation methods

  private validateUnitStructure(unitEl: Element, errors: string[]): void {
    if (!unitEl.getAttribute('id')) errors.push('Unit missing id attribute');
    if (!unitEl.getAttribute('title')) errors.push('Unit missing title attribute');
    if (!unitEl.querySelector('vocabulary_bank')) errors.push('Unit missing vocabulary_bank');
    if (!unitEl.querySelector('sections')) errors.push('Unit missing sections');
  }

  private validateGradeStructure(gradeEl: Element, errors: string[]): void {
    if (!gradeEl.getAttribute('level')) errors.push('Grade missing level attribute');
    if (!gradeEl.getAttribute('cefr_level')) errors.push('Grade missing cefr_level attribute');
    if (!gradeEl.querySelector('units')) errors.push('Grade missing units');
  }

  private validateCurriculumStructure(curriculumEl: Element, errors: string[]): void {
    if (!curriculumEl.querySelector('metadata')) errors.push('Curriculum missing metadata');
    if (!curriculumEl.querySelector('grades')) errors.push('Curriculum missing grades');
  }

  // Cache methods

  private getFromCache<T>(key: string): T | null {
    const cached = this.contentCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    // Implement LRU eviction
    if (this.contentCache.size >= this.cacheMaxSize) {
      const firstKey = this.contentCache.keys().next().value;
      if (firstKey) {
        this.contentCache.delete(firstKey);
      }
    }

    this.contentCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private calculateRelevanceScore(item: VocabularyItem, query: string): number {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    
    if (item.word.toLowerCase() === lowerQuery) score += 10;
    else if (item.word.toLowerCase().startsWith(lowerQuery)) score += 7;
    else if (item.word.toLowerCase().includes(lowerQuery)) score += 5;
    
    if (item.definition.toLowerCase().includes(lowerQuery)) score += 3;
    if (item.translation.toLowerCase().includes(lowerQuery)) score += 3;
    
    return score;
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.contentCache.clear();
  }
}

// Supporting interfaces
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Export singleton instance
export const contentService = ContentService.getInstance();