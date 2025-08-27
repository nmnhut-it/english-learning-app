import { contentChecker } from './ContentChecker';
import { aiVocabularyProcessor } from './AIVocabularyProcessor';
import { aiService } from './AIService';
import type { 
      Unit, 
  VocabularyItem, 
  ProcessingResult,
  ContentMetadata,
  BatchProcessingItem,
  BatchProcessingResult,
  Lesson,
  LessonType
} from '@/types';

/**
 * Main Content Processing Workflow
 * Implements check-before-process logic for V2
 */
export class ContentProcessor {
      private static instance: ContentProcessor;
  private activeProcessing: Set<string> = new Set();
  
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ContentProcessor {
        if (!ContentProcessor.instance) {
          ContentProcessor.instance = new ContentProcessor();
    }
    return ContentProcessor.instance;
  }

  /**
   * Main processing entry point - Check disk first, process if needed
   */
  public async processContent(
        sourceContent: string,
    metadata: ContentMetadata
  ): Promise<ContentProcessingResult> {
        const processKey = `${metadata.grade}-${metadata.unitId}`;
    
    // Prevent duplicate processing
    if (this.activeProcessing.has(processKey)) {
          throw new Error('Content is already being processed');
    }
    
    this.activeProcessing.add(processKey);
    const startTime = Date.now();
    
    try {
          console.log(`🔍 Processing workflow started: Grade ${metadata.grade}, Unit ${metadata.unitId}`);
      
      // STEP 1: Check if already processed
      console.log('📂 Checking disk for existing processed content...');
      const existsOnDisk = await contentChecker.isContentProcessed(metadata.grade, metadata.unitId);
      
      if (existsOnDisk) {
            console.log('✅ Found existing content on disk');
        
        // STEP 2: Check if source content changed
        console.log('🔄 Checking if source content has changed...');
        const hasChanged = await contentChecker.hasSourceContentChanged(
              metadata.grade,
          metadata.unitId,
          sourceContent
        );
        
        if (!hasChanged) {
              console.log('💾 Source unchanged, loading from disk');
          
          const xmlPath = `/data/structured/grade-${metadata.grade}/${metadata.unitId}.xml`;
          const processingTime = Date.now() - startTime;
          
          return {
                success: true,
            action: 'loaded_from_disk',
            message: 'Content loaded from disk (no processing needed)',
            xmlPath,
            processingTime,
            fromCache: true,
            vocabularyCount: 0, // Would be loaded from metadata
            metadata
          };
        } else {
              console.log('🔄 Source content changed, reprocessing...');
        }
      } else {
            console.log('🆕 No existing content found, processing needed');
      }
      
      // STEP 3: Process with AI (only if needed)
      console.log('🤖 Starting AI vocabulary processing...');
      
      const aiResult = await aiVocabularyProcessor.processContent(sourceContent, metadata);
      
      // STEP 4: Verify extracted content (strict extraction validation)
      if (aiResult.xmlContent) {
        const verificationResult = await this.verifyExtractedContent(
          sourceContent, 
          aiResult.xmlContent
        );
        
        if (!verificationResult.isValid) {
          console.warn('⚠️ Extracted content verification failed:', verificationResult.errors);
          // Log but don't fail - let teacher review
          aiResult.extractionWarnings = verificationResult.errors;
        } else {
          console.log('✅ Extracted content verified - strict extraction successful');
        }
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
            success: true,
        action: 'processed_with_ai',
        message: 'Content processed with AI and saved',
        xmlPath: aiResult.xmlPath,
        processingTime,
        fromCache: false,
        vocabularyCount: aiResult.vocabularyCount || 0,
        metadata,
        extractionWarnings: aiResult.extractionWarnings
      };
      
    } catch (error) {
          console.error('❌ Content processing failed:', error);
      
      const processingTime = Date.now() - startTime;
      return {
            success: false,
        action: 'failed',
        message: `Processing failed: ${(error as Error).message}`,
        processingTime,
        fromCache: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata
      };
    } finally {
          this.activeProcessing.delete(processKey);
    }
  }

  /**
   * Verify extracted content matches source (strict extraction validation)
   */
  private async verifyExtractedContent(
    sourceContent: string,
    xmlContent: string
  ): Promise<{isValid: boolean; errors: string[]}> {
    const errors: string[] = [];
    
    try {
      // Parse XML to extract text content
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Check vocabulary items
      const vocabularyItems = xmlDoc.querySelectorAll('vocabulary_item word');
      vocabularyItems.forEach(item => {
        const word = item.textContent;
        if (word && !sourceContent.includes(word)) {
          errors.push(`Vocabulary word "${word}" not found in source`);
        }
      });
      
      // Check dialogue content
      const dialogueTurns = xmlDoc.querySelectorAll('turn');
      dialogueTurns.forEach(turn => {
        const text = turn.textContent;
        if (text && text.length > 10 && !sourceContent.includes(text)) {
          errors.push(`Dialogue text not found verbatim in source`);
        }
      });
      
      // Check exercise questions
      const questions = xmlDoc.querySelectorAll('question prompt, instruction');
      questions.forEach(q => {
        const text = q.textContent;
        if (text && text.length > 15 && !sourceContent.includes(text)) {
          errors.push(`Question/instruction not found verbatim in source`);
        }
      });
      
      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('XML verification error:', error);
      return {
        isValid: false,
        errors: ['Failed to parse XML for verification']
      };
    }
  }

  /**
   * Process content for a specific lesson
   */
  public async processLessonContent(
    content: string,
    grade: number,
    unit: number,
    lessonType: LessonType,
    unitTitle: string,
    saveRaw: boolean = true
  ): Promise<ProcessingResult> {
    const processingKey = `${grade}-${unit}-${lessonType}`;
    
    // Check if already processing
    if (this.activeProcessing.has(processingKey)) {
      console.log(`Already processing ${processingKey}`);
      return {
        success: false,
        fromCache: false,
        message: 'Already processing this lesson'
      };
    }

    try {
      this.activeProcessing.add(processingKey);

      // Save raw content first (for reprocessing later)
      if (saveRaw) {
        const rawKey = `raw_content_${grade}_${unit}_${lessonType}`;
        localStorage.setItem(rawKey, JSON.stringify({
          content,
          timestamp: Date.now(),
          grade,
          unit,
          lessonType,
          unitTitle
        }));
      }

      // Try to process with AI if configured
      let processedData;
      if (aiService.isConfigured()) {
        try {
          processedData = await aiService.processContent(content, grade, unit, lessonType);
        } catch (error) {
          console.warn('AI processing failed, using fallback:', error);
          processedData = await this.fallbackProcessing(content, lessonType);
        }
      } else {
        processedData = await this.fallbackProcessing(content, lessonType);
      }

      // Create lesson structure
      const lesson: Lesson = {
        id: lessonType,
        type: lessonType,
        title: this.getLessonTitle(lessonType),
        order: this.getLessonOrder(lessonType),
        duration: 45,
        vocabulary_bank: processedData.vocabulary || [],
        exercises: processedData.exercises || [],
        metadata: {
          estimated_duration: 45,
          skills_focus: this.getSkillsFocus(lessonType),
          grammar_points: processedData.grammar_points || [],
          vocabulary_topics: processedData.vocabulary_topics || []
        }
      };

      // Save processed lesson
      const processedKey = `content/grade-${grade}/unit-${unit.toString().padStart(2, '0')}/${lessonType}`;
      localStorage.setItem(processedKey, JSON.stringify(lesson));

      return {
        success: true,
        fromCache: false,
        processingTime: Date.now(),
        data: lesson
      };

    } finally {
      this.activeProcessing.delete(processingKey);
    }
  }

  /**
   * Fallback processing without AI
   */
  private async fallbackProcessing(content: string, lessonType: LessonType): Promise<any> {
    // Simple extraction based on lesson type
    const vocabulary = this.extractVocabularySimple(content);
    const exercises = this.extractExercisesSimple(content);
    
    return {
      vocabulary,
      exercises,
      grammar_points: [],
      vocabulary_topics: []
    };
  }

  /**
   * Simple vocabulary extraction
   */
  private extractVocabularySimple(content: string): VocabularyItem[] {
    const vocabulary: VocabularyItem[] = [];
    
    // Look for bold words as potential vocabulary
    const boldPattern = /\*\*([\w\s]+)\*\*/g;
    const matches = content.matchAll(boldPattern);
    
    for (const match of matches) {
      vocabulary.push({
        id: match[1].toLowerCase().replace(/\s+/g, '-'),
        word: match[1],
        pronunciation: {
          ipa: '',
          audio_files: []
        },
        definition: '',
        translation: '',
        examples: [],
        collocations: [],
        synonyms: [],
        word_family: [],
        usage_notes: [],
        frequency: 'medium',
        cefr: 'A2',
        part_of_speech: 'noun'
      });
    }
    
    return vocabulary;
  }

  /**
   * Simple exercise extraction
   */
  private extractExercisesSimple(content: string): any[] {
    const exercises = [];
    
    // Look for numbered questions
    const questionPattern = /(\d+)\.\s+([^\n]+)/g;
    const matches = content.matchAll(questionPattern);
    
    let index = 0;
    for (const match of matches) {
      exercises.push({
        id: `ex-${index++}`,
        type: 'short_answer',
        question: {
          text: match[2],
          translation: ''
        },
        difficulty: 2
      });
    }
    
    return exercises;
  }

  /**
   * Get lesson title
   */
  private getLessonTitle(lessonType: string): string {
    const titles: Record<string, string> = {
      'getting_started': 'Getting Started',
      'closer_look_1': 'A Closer Look 1',
      'closer_look_2': 'A Closer Look 2',
      'communication': 'Communication',
      'skills_1': 'Skills 1',
      'skills_2': 'Skills 2',
      'looking_back': 'Looking Back',
      'language': 'Language',
      'reading': 'Reading',
      'listening': 'Listening',
      'speaking': 'Speaking',
      'writing': 'Writing',
      'communication_culture': 'Communication & Culture'
    };
    return titles[lessonType] || lessonType;
  }

  /**
   * Get lesson order
   */
  private getLessonOrder(lessonType: string): number {
    const order: Record<string, number> = {
      'getting_started': 1,
      'closer_look_1': 2,
      'closer_look_2': 3,
      'communication': 4,
      'skills_1': 5,
      'skills_2': 6,
      'looking_back': 7,
      'language': 2,
      'reading': 3,
      'listening': 4,
      'speaking': 5,
      'writing': 6,
      'communication_culture': 7
    };
    return order[lessonType] || 999;
  }

  /**
   * Get skills focus
   */
  private getSkillsFocus(lessonType: string): string[] {
    const skillsMap: Record<string, string[]> = {
      'getting_started': ['listening', 'speaking', 'vocabulary'],
      'closer_look_1': ['vocabulary', 'pronunciation'],
      'closer_look_2': ['grammar'],
      'communication': ['speaking', 'listening'],
      'skills_1': ['reading', 'speaking'],
      'skills_2': ['listening', 'writing'],
      'looking_back': ['review', 'consolidation'],
      'language': ['grammar', 'vocabulary'],
      'reading': ['reading'],
      'listening': ['listening'],
      'speaking': ['speaking'],
      'writing': ['writing'],
      'communication_culture': ['communication', 'culture']
    };
    return skillsMap[lessonType] || [];
  }

  /**
   * Reprocess raw content
   */
  public async reprocessRawContent(
    grade: number,
    unit: number,
    lessonType: string
  ): Promise<ProcessingResult> {
    const rawKey = `raw_content_${grade}_${unit}_${lessonType}`;
    const rawData = localStorage.getItem(rawKey);
    
    if (!rawData) {
      return {
        success: false,
        fromCache: false,
        message: 'No raw content found for reprocessing'
      };
    }
    
    const { content, unitTitle } = JSON.parse(rawData);
    return this.processLessonContent(
      content,
      grade,
      unit,
      lessonType as LessonType,
      unitTitle,
      false // Don't save raw again
    );
  }

  /**
   * Process content from loigiahay source
   */
  public async processLoigiahayContent(
        rawContent: string,
    grade: number,
    unitNumber: number,
    title?: string
  ): Promise<ContentProcessingResult> {
        const unitId = `unit-${String(unitNumber).padStart(2, '0')}`;
    
    const metadata: ContentMetadata = {
          grade,
      unitId,
      title: title || `Unit ${unitNumber}`,
      source: 'loigiahay',
      originalUrl: 'https://loigiahay.com' // Would include actual URL
    };
    
    console.log('📚 Processing loigiahay content:', {
          grade,
      unitId,
      contentLength: rawContent.length
    });
    
    return this.processContent(rawContent, metadata);
  }

  /**
   * Process your manual notes
   */
  public async processManualNotes(
        notes: string,
    grade: number,
    unitNumber: number,
    title?: string
  ): Promise<ContentProcessingResult> {
        const unitId = `unit-${String(unitNumber).padStart(2, '0')}`;
    
    const metadata: ContentMetadata = {
          grade,
      unitId,
      title: title || `Unit ${unitNumber} - Manual Notes`,
      source: 'manual_notes'
    };
    
    console.log('📝 Processing manual notes:', {
          grade,
      unitId,
      contentLength: notes.length
    });
    
    return this.processContent(notes, metadata);
  }

  /**
   * Process textbook content
   */
  public async processTextbookContent(
        textbookContent: string,
    grade: number,
    unitNumber: number,
    title?: string
  ): Promise<ContentProcessingResult> {
        const unitId = `unit-${String(unitNumber).padStart(2, '0')}`;
    
    const metadata: ContentMetadata = {
          grade,
      unitId,
      title: title || `Unit ${unitNumber}`,
      source: 'textbook'
    };
    
    console.log('📖 Processing textbook content:', {
          grade,
      unitId,
      contentLength: textbookContent.length
    });
    
    return this.processContent(textbookContent, metadata);
  }

  /**
   * Bulk process entire grade level
   */
  public async processEntireGrade(
        gradeData: GradeContentInput[]
  ): Promise<GradeProcessingResult> {
        console.log(`📚 Starting bulk processing for ${gradeData.length} units`);
    
    const results: ContentProcessingResult[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const unitData of gradeData) {
          try {
            const result = await this.processContent(unitData.content, unitData.metadata);
        results.push(result);
        
        if (result.success) {
              if (result.fromCache) {
                skippedCount++;
          } else {
                processedCount++;
          }
        } else {
              errorCount++;
        }
        
        // Progress logging
        console.log(`📊 Progress: ${results.length}/${gradeData.length} units checked`);
        
      } catch (error) {
            console.error(`Failed to process unit ${unitData.metadata.unitId}:`, error);
        errorCount++;
        
        results.push({
              success: false,
          action: 'failed',
          message: `Processing failed: ${(error as Error).message}`,
          processingTime: 0,
          fromCache: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          metadata: unitData.metadata
        });
      }
      
      // Small delay between units
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return {
          grade: gradeData[0]?.metadata.grade || 0,
      totalUnits: gradeData.length,
      processedCount,
      skippedCount,
      errorCount,
      results,
      totalTime: results.reduce((sum, r) => sum + (r.processingTime || 0), 0)
    };
  }

  /**
   * Get processing recommendations
   */
  public async getProcessingRecommendations(grade?: number): Promise<ProcessingRecommendation[]> {
        const recommendations = await contentChecker.getProcessingRecommendations(grade);
    
    // Add AI-specific recommendations
    const queue = await contentChecker.getProcessingQueue(grade);
    
    if (queue.length > 0) {
          const totalTime = queue.reduce((sum, item) => sum + item.estimatedProcessingTime, 0);
      
      if (totalTime > 600) { // More than 10 minutes
        recommendations.push({
              type: 'efficiency',
          message: 'Consider processing during off-peak hours',
          action: 'schedule_processing',
          details: [`Estimated processing time: ${Math.round(totalTime / 60)} minutes`]
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Validate all processed content
   */
  public async validateAllContent(grade?: number): Promise<ValidationSummary> {
        const grades = grade ? [grade] : [6, 7, 8, 9, 10, 11, 12];
    const validationResults: ContentValidationResult[] = [];
    
    for (const gradeLevel of grades) {
          const gradeStatus = await contentChecker.getGradeProcessingStatus(gradeLevel);
      
      for (const unit of gradeStatus.units) {
            if (unit.processed) {
              try {
                const validation = await contentChecker.validateProcessedContent(
                  gradeLevel, 
              unit.unitId
            );
            
            validationResults.push({
                  grade: gradeLevel,
              unitId: unit.unitId,
              valid: validation.valid,
              errors: validation.errors,
              vocabularyCount: validation.vocabularyCount || 0,
              exerciseCount: validation.exerciseCount || 0
            });
          } catch (error) {
                validationResults.push({
                  grade: gradeLevel,
              unitId: unit.unitId,
              valid: false,
              errors: [`Validation failed: ${(error as Error).message}`],
              vocabularyCount: 0,
              exerciseCount: 0
            });
          }
        }
      }
    }
    
    const validCount = validationResults.filter(r => r.valid).length;
    const invalidCount = validationResults.length - validCount;
    
    return {
          totalValidated: validationResults.length,
      validCount,
      invalidCount,
      results: validationResults,
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Get processing statistics
   */
  public getProcessingStats(): ProcessingStats {
        const activeJobs = aiVocabularyProcessor.getActiveJobs();
    
    return {
          activeJobs: activeJobs.length,
      cacheStats: contentChecker.getCacheStats(),
      queueSize: this.activeProcessing.size,
      uptime: Date.now() // Would track actual uptime
    };
  }

  /**
   * Emergency stop all processing
   */
  public stopAllProcessing(): void {
        console.log('🛑 Emergency stop: Cancelling all active processing');
    
    const activeJobs = aiVocabularyProcessor.getActiveJobs();
    activeJobs.forEach(job => {
          aiVocabularyProcessor.cancelJob(job.id);
    });
    
    this.activeProcessing.clear();
    
    console.log(`Cancelled ${activeJobs.length} active jobs`);
  }
}

// Supporting interfaces
export interface ContentProcessingResult extends ProcessingResult {
      action: 'loaded_from_disk' | 'processed_with_ai' | 'failed';
  metadata: ContentMetadata;
  extractionWarnings?: string[];
}

export interface GradeContentInput {
      content: string;
  metadata: ContentMetadata;
}

export interface GradeProcessingResult {
      grade: number;
  totalUnits: number;
  processedCount: number;
  skippedCount: number;
  errorCount: number;
  results: ContentProcessingResult[];
  totalTime: number;
}

export interface ProcessingRecommendation {
      type: 'info' | 'warning' | 'urgent' | 'efficiency';
  message: string;
  action: 'none' | 'process_high_priority' | 'batch_process' | 'schedule_processing';
  details?: string[];
}

export interface ContentValidationResult {
      grade: number;
  unitId: string;
  valid: boolean;
  errors: string[];
  vocabularyCount: number;
  exerciseCount: number;
}

export interface ValidationSummary {
      totalValidated: number;
  validCount: number;
  invalidCount: number;
  results: ContentValidationResult[];
  validatedAt: string;
}

export interface ProcessingStats {
      activeJobs: number;
  cacheStats: any;
  queueSize: number;
  uptime: number;
}

// Export singleton instance
export const contentProcessor = ContentProcessor.getInstance();