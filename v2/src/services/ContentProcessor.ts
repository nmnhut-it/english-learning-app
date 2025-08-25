import { contentChecker } from './ContentChecker';
import { aiVocabularyProcessor } from './AIVocabularyProcessor';
import type { 
      Unit, 
  VocabularyItem, 
  ProcessingResult,
  ContentMetadata,
  BatchProcessingItem,
  BatchProcessingResult 
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
      const processingTime = Date.now() - startTime;
      
      return {
            success: true,
        action: 'processed_with_ai',
        message: 'Content processed with AI and saved',
        xmlPath: aiResult.xmlPath,
        processingTime,
        fromCache: false,
        vocabularyCount: aiResult.vocabularyCount || 0,
        metadata
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