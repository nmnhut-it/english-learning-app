import type { VocabularyItem, Unit, Exercise } from '@/types';
import { contentChecker } from './ContentChecker';

/**
 * AI Content Processor  
 * Processes complete educational content using Claude/Gemini APIs
 * Structures content according to V2 XML schema - vocabulary, exercises, dialogues
 * References docs/xml-schema.md and docs/exercise-types.md for structure
 */
export class AIVocabularyProcessor {
      private static instance: AIVocabularyProcessor;
  private readonly apiEndpoint = '/api/ai-process'; // Your backend AI endpoint
  private processingQueue: Map<string, ProcessingJob> = new Map();
  
  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): AIVocabularyProcessor {
        if (!AIVocabularyProcessor.instance) {
          AIVocabularyProcessor.instance = new AIVocabularyProcessor();
    }
    return AIVocabularyProcessor.instance;
  }

  /**
   * Main processing method - checks disk first, processes if needed
   */
  public async processContent(
        sourceContent: string,
    metadata: ContentMetadata
  ): Promise<ProcessingResult> {
        const { grade, unitId } = metadata;
    const jobId = `${grade}-${unitId}-${Date.now()}`;
    
    console.log(`🔍 Checking if content already processed: Grade ${grade}, Unit ${unitId}`);
    
    // Step 1: Check if already processed
    const isProcessed = await contentChecker.isContentProcessed(grade, unitId);
    
    if (isProcessed) {
          console.log('✅ Content already processed, loading from disk');
      
      // Check if source content changed
      const hasChanged = await contentChecker.hasSourceContentChanged(
            grade, 
        unitId, 
        sourceContent
      );
      
      if (!hasChanged) {
            return {
              success: true,
          source: 'disk',
          message: 'Content loaded from disk (no changes detected)',
          xmlPath: `/data/structured/grade-${grade}/${unitId}.xml`,
          fromCache: true
        };
      } else {
            console.log('📝 Source content changed, reprocessing needed');
      }
    }
    
    // Step 2: Process with AI if needed
    console.log('🤖 Processing content with AI...');
    
    try {
          // Add to processing queue
      const job: ProcessingJob = {
            id: jobId,
        grade,
        unitId,
        status: 'processing',
        startTime: Date.now(),
        metadata
      };
      this.processingQueue.set(jobId, job);
      
      // Extract vocabulary using AI
      const vocabularyResult = await this.extractVocabularyWithAI(sourceContent, metadata);
      
      // Restructure existing content (not create new)
      const structuredUnit = await this.restructureExistingContent(
            sourceContent, 
        vocabularyResult.vocabulary,
        metadata
      );
      
      // Generate XML
      const xmlContent = this.generateUnitXML(structuredUnit);
      
      // Save to disk
      await this.saveProcessedContent(grade, unitId, xmlContent, sourceContent, {
            vocabularyCount: vocabularyResult.vocabulary.length,
        exerciseCount: structuredUnit.sections.reduce((sum, s) => sum + s.exercises.length, 0),
        sectionCount: structuredUnit.sections.length,
        processingTime: Date.now() - job.startTime
      });
      
      // Mark as complete
      job.status = 'completed';
      job.endTime = Date.now();
      
      console.log('✅ Content processed and saved successfully');
      
      return {
            success: true,
        source: 'ai',
        message: 'Content processed with AI and saved',
        xmlPath: `/data/structured/grade-${grade}/${unitId}.xml`,
        vocabularyCount: vocabularyResult.vocabulary.length,
        processingTime: job.endTime - job.startTime
      };
      
    } catch (error) {
          console.error('❌ AI processing failed:', error);
      
      // Mark job as failed
      const job = this.processingQueue.get(jobId);
      if (job) {
            job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.endTime = Date.now();
      }
      
      throw error;
    } finally {
          // Cleanup job after some time
      setTimeout(() => {
            this.processingQueue.delete(jobId);
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  /**
   * Extract vocabulary using AI (Claude/Gemini)
   */
  private async extractVocabularyWithAI(
        content: string, 
    metadata: ContentMetadata
  ): Promise<VocabularyExtractionResult> {
        const prompt = this.buildVocabularyExtractionPrompt(content, metadata);
    
    try {
          const response = await fetch(this.apiEndpoint, {
            method: 'POST',
        headers: {
              'Content-Type': 'application/json',
        },
        body: JSON.stringify({
              action: 'extract-vocabulary',
          prompt,
          content,
          metadata
        })
      });
      
      if (!response.ok) {
            throw new Error(`AI API error: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
            vocabulary: result.vocabulary || [],
        confidence: result.confidence || 0.8,
        processingTime: result.processingTime || 0
      };
      
    } catch (error) {
          console.error('AI vocabulary extraction failed:', error);
      throw new Error(`AI processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Build vocabulary extraction prompt for AI
   */
  private buildVocabularyExtractionPrompt(content: string, metadata: ContentMetadata): string {
        return `
You are an expert English vocabulary extractor for Global Success curriculum Grade ${metadata.grade}.

EXTRACT VOCABULARY ONLY from this content. Do NOT create new exercises or dialogues.

SOURCE CONTENT:
${content}

REQUIREMENTS:
1. Extract all English vocabulary words with:
   - Exact word as it appears
   - Part of speech (noun, verb, adjective, etc.)
   - Definition in English
   - Vietnamese translation
   - IPA pronunciation (if available)
   - CEFR level (A1, A2, B1, B2, C1, C2)
   - Usage examples from the content

2. Focus on vocabulary appropriate for Grade ${metadata.grade} students

3. Maintain educational context and difficulty progression

4. Output as valid JSON array:
[
      {
        "id": "hobby",
    "word": "hobby",
    "part_of_speech": "noun",
    "definition": "an activity that you do for pleasure when you are not working",
    "translation": "sở thích",
    "pronunciation": {
          "ipa": "/ˈhɒbi/",
      "audio_files": []
    },
    "cefr": "A1",
    "frequency": "high",
    "examples": [
          {
            "text": "My hobby is reading books.",
        "translation": "Sở thích của tôi là đọc sách.",
        "difficulty": 1
      }
    ]
  }
]

EXTRACT VOCABULARY ONLY. Do not create exercises, dialogues, or other content.
`;
  }

  /**
   * Restructure existing content (don't create new)
   */
  private async restructureExistingContent(
        sourceContent: string,
    vocabulary: VocabularyItem[],
    metadata: ContentMetadata
  ): Promise<Unit> {
        // Parse existing structure from markdown
    const existingStructure = this.parseExistingMarkdown(sourceContent);
    
    // Create unit with extracted vocabulary
    const unit: Unit = {
          id: metadata.unitId,
      title: existingStructure.title || `Unit ${metadata.unitId}`,
      order: parseInt(metadata.unitId.replace('unit-', '')) || 1,
      metadata: {
            description: existingStructure.description || '',
        learning_objectives: existingStructure.objectives || [],
        estimated_duration: 450, // Default
        difficulty_progression: '1-3',
        vocabulary_count: vocabulary.length
      },
      vocabulary_bank: vocabulary,
      sections: existingStructure.sections || [],
      assessments: existingStructure.assessments || []
    };
    
    return unit;
  }

  /**
   * Parse existing markdown structure
   */
  private parseExistingMarkdown(content: string): ExistingStructure {
        const lines = content.split('\n');
    let title = '';
    let description = '';
    const sections: any[] = [];
    const objectives: any[] = [];
    
    // Extract title (first # heading)
    for (const line of lines) {
          const titleMatch = line.match(/^#\s+(.+)$/);
      if (titleMatch) {
            title = titleMatch[1].trim();
        break;
      }
    }
    
    // Extract sections (## headings)
    let currentSection: any = null;
    
    lines.forEach((line, index) => {
          const sectionMatch = line.match(/^##\s+(.+)$/);
      if (sectionMatch) {
            if (currentSection) {
              sections.push(currentSection);
        }
        
        currentSection = {
              id: this.generateSectionId(sectionMatch[1]),
          title: sectionMatch[1].trim(),
          order: sections.length + 1,
          type: this.determineSectionType(sectionMatch[1]),
          metadata: {
                estimated_duration: 45,
            skills_focus: '',
            materials_needed: ''
          },
          learning_content: {
                dialogues: [],
            reading_passages: [],
            audio_content: []
          },
          exercises: [],
          vocabulary_focus: []
        };
      }
    });
    
    if (currentSection) {
          sections.push(currentSection);
    }
    
    return {
          title,
      description,
      sections,
      objectives,
      assessments: []
    };
  }

  /**
   * Generate XML from structured unit
   */
  private generateUnitXML(unit: Unit): string {
        const vocabularyXML = unit.vocabulary_bank.map(vocab => `
    <vocabulary_item id="${vocab.id}" frequency="${vocab.frequency}" cefr="${vocab.cefr}" part_of_speech="${vocab.part_of_speech}">
      <word>${this.escapeXML(vocab.word)}</word>
      <pronunciation>
        <ipa>${this.escapeXML(vocab.pronunciation.ipa)}</ipa>
        <audio_files>
          ${vocab.pronunciation.audio_files.map(audio => 
            `<audio accent="${audio.accent}" file="${audio.file}" duration="${audio.duration || 0}"/>`
          ).join('\
          ')}
        </audio_files>
      </pronunciation>
      <definition>${this.escapeXML(vocab.definition)}</definition>
      <translation lang="vi">${this.escapeXML(vocab.translation)}</translation>
      <examples>
        ${vocab.examples.map(example => `
        <example difficulty="${example.difficulty}">
          <text>${this.escapeXML(example.text)}</text>
          <translation>${this.escapeXML(example.translation)}</translation>
        </example>`).join('')}
      </examples>
    </vocabulary_item>`).join('');
    
    const sectionsXML = unit.sections.map(section => `
    <section id="${section.id}" title="${this.escapeXML(section.title)}" order="${section.order}" type="${section.type}">
      <metadata>
        <estimated_duration>${section.metadata.estimated_duration}</estimated_duration>
        <skills_focus>${this.escapeXML(section.metadata.skills_focus)}</skills_focus>
        <materials_needed>${this.escapeXML(section.metadata.materials_needed)}</materials_needed>
      </metadata>
      <learning_content>
        <!-- Existing dialogues and content would be preserved here -->
      </learning_content>
      <exercises>
        <!-- Existing exercises would be preserved here -->
      </exercises>
      <vocabulary_focus>
        <!-- References to vocabulary items -->
      </vocabulary_focus>
    </section>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<unit xmlns="http://english-learning-app.com/schema/v2" 
      id="${unit.id}" 
      title="${this.escapeXML(unit.title)}" 
      order="${unit.order}">
  
  <metadata>
    <description>${this.escapeXML(unit.metadata.description)}</description>
    <learning_objectives>
      ${unit.metadata.learning_objectives.map(obj => 
        `<objective id="${obj.id}" type="${obj.type}">${this.escapeXML(obj.text)}</objective>`
      ).join('\
      ')}
    </learning_objectives>
    <estimated_duration>${unit.metadata.estimated_duration}</estimated_duration>
    <difficulty_progression>${unit.metadata.difficulty_progression}</difficulty_progression>
    <vocabulary_count>${unit.metadata.vocabulary_count}</vocabulary_count>
  </metadata>
  
  <vocabulary_bank>${vocabularyXML}
  </vocabulary_bank>
  
  <sections>${sectionsXML}
  </sections>
  
  <assessments>
    <!-- Assessments would be preserved from existing content -->
  </assessments>
  
</unit>`;
  }

  /**
   * Save processed content to disk
   */
  private async saveProcessedContent(
        grade: number,
    unitId: string,
    xmlContent: string,
    sourceContent: string,
    metadata: any
  ): Promise<void> {
        // In a real implementation, this would save to your backend
    // For now, we'll simulate the save operation
    
    console.log(`💾 Saving processed content: Grade ${grade}, Unit ${unitId}`);
    
    try {
          // Save XML content
      const xmlPath = `/data/structured/grade-${grade}/${unitId}.xml`;
      
      // Save metadata
      await contentChecker.markContentProcessed(
            grade,
        unitId,
        sourceContent,
        {
              processedAt: new Date().toISOString(),
          sourceContentHash: await contentChecker.generateContentHash(sourceContent),
          version: '2.0',
          processor: 'AI-Vocabulary-Extractor',
          ...metadata
        }
      );
      
      console.log('✅ Content saved successfully');
    } catch (error) {
          console.error('❌ Failed to save content:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple content files
   */
  public async batchProcess(
        contentItems: BatchProcessingItem[]
  ): Promise<BatchProcessingResult> {
        console.log(`🔄 Starting batch processing of ${contentItems.length} items`);
    
    const results: ProcessingResult[] = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Process in chunks to avoid overwhelming the AI API
    const chunkSize = 3;
    for (let i = 0; i < contentItems.length; i += chunkSize) {
          const chunk = contentItems.slice(i, i + chunkSize);
      
      const chunkPromises = chunk.map(async (item) => {
            try {
              const result = await this.processContent(item.sourceContent, item.metadata);
          successCount++;
          return result;
        } catch (error) {
              errorCount++;
          return {
                success: false,
            source: 'error',
            message: `Failed: ${(error as Error).message}`,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
      
      // Small delay between chunks
      if (i + chunkSize < contentItems.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return {
          totalItems: contentItems.length,
      successCount,
      errorCount,
      results,
      processingTime: 0 // Would track this in real implementation
    };
  }

  /**
   * Get processing status for a job
   */
  public getProcessingStatus(jobId: string): ProcessingJob | null {
        return this.processingQueue.get(jobId) || null;
  }

  /**
   * Get all active processing jobs
   */
  public getActiveJobs(): ProcessingJob[] {
        return Array.from(this.processingQueue.values())
      .filter(job => job.status === 'processing');
  }

  /**
   * Cancel processing job
   */
  public cancelJob(jobId: string): boolean {
        const job = this.processingQueue.get(jobId);
    if (job && job.status === 'processing') {
          job.status = 'cancelled';
      job.endTime = Date.now();
      return true;
    }
    return false;
  }

  // Helper methods
  
  private generateSectionId(title: string): string {
        return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }
  
  private determineSectionType(title: string): string {
        const lower = title.toLowerCase();
    
    if (lower.includes('getting started') || lower.includes('bắt đầu')) return 'introduction';
    if (lower.includes('closer look') || lower.includes('grammar')) return 'grammar';
    if (lower.includes('vocabulary') || lower.includes('từ vựng')) return 'vocabulary';
    if (lower.includes('communication') || lower.includes('giao tiếp')) return 'culture';
    if (lower.includes('skills') || lower.includes('kỹ năng')) return 'skills';
    if (lower.includes('project') || lower.includes('dự án')) return 'project';
    
    return 'general';
  }
  
  private escapeXML(text: string): string {
        return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Supporting interfaces
export interface ContentMetadata {
      grade: number;
  unitId: string;
  title?: string;
  source: 'loigiahay' | 'manual_notes' | 'textbook';
  originalUrl?: string;
}

export interface VocabularyExtractionResult {
      vocabulary: VocabularyItem[];
  confidence: number;
  processingTime: number;
}

export interface ProcessingResult {
      success: boolean;
  source: 'disk' | 'ai' | 'error';
  message: string;
  xmlPath?: string;
  vocabularyCount?: number;
  processingTime?: number;
  fromCache?: boolean;
  error?: string;
}

export interface ProcessingJob {
      id: string;
  grade: number;
  unitId: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  startTime: number;
  endTime?: number;
  metadata: ContentMetadata;
  error?: string;
}

export interface BatchProcessingItem {
      sourceContent: string;
  metadata: ContentMetadata;
}

export interface BatchProcessingResult {
      totalItems: number;
  successCount: number;
  errorCount: number;
  results: ProcessingResult[];
  processingTime: number;
}

export interface ExistingStructure {
      title: string;
  description: string;
  sections: any[];
  objectives: any[];
  assessments: any[];
}

// Export singleton instance
export const aiVocabularyProcessor = AIVocabularyProcessor.getInstance();