import type { Unit } from '@/types';

/**
 * ContentChecker Service
 * Checks if content has already been processed and saved to disk
 * Prevents redundant AI processing
 */
export class ContentChecker {
      private static instance: ContentChecker;
  private readonly basePath = '/data/structured';
  private processedCache: Map<string, ProcessingStatus> = new Map();
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ContentChecker {
        if (!ContentChecker.instance) {
          ContentChecker.instance = new ContentChecker();
    }
    return ContentChecker.instance;
  }

  /**
   * Check if content has already been proces
   */
  public async isContentProcessed(grade: number, unitId: string): Promise<boolean> {
        const cacheKey = `${grade}-${unitId}`;
    
    // Check cache first
    const cached = this.processedCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.exists;
    }

    try {
          const xmlPath = `${this.basePath}/grade-${grade}/${unitId}.xml`;
      const response = await fetch(xmlPath, { method: 'HEAD' });
      const exists = response.ok;
      
      // Cache result
      this.processedCache.set(cacheKey, {
            exists,
        timestamp: Date.now(),
        xmlPath,
        lastModified: response.headers.get('last-modified') || undefined
      });
      
      return exists;
    } catch (error) {
          console.log(`Content not found for grade ${grade}, unit ${unitId}`);
      
      // Cache negative result
      this.processedCache.set(cacheKey, {
            exists: false,
        timestamp: Date.now(),
        xmlPath: `${this.basePath}/grade-${grade}/${unitId}.xml`
      });
      
      return false;
    }
  }

  /**
   * Get detailed processing status with metadata
   */
  public async getProcessingStatus(grade: number, unitId: string): Promise<ProcessingStatus> {
        const cacheKey = `${grade}-${unitId}`;
    
    // Check cache first
    const cached = this.processedCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached;
    }

    try {
          const xmlPath = `${this.basePath}/grade-${grade}/${unitId}.xml`;
      const response = await fetch(xmlPath, { method: 'HEAD' });
      
      if (response.ok) {
            const status: ProcessingStatus = {
              exists: true,
          timestamp: Date.now(),
          xmlPath,
          lastModified: response.headers.get('last-modified') || undefined,
          contentLength: parseInt(response.headers.get('content-length') || '0'),
          processed: true
        };
        
        // Try to get additional metadata
        try {
              const metadataPath = `${this.basePath}/grade-${grade}/${unitId}-metadata.json`;
          const metadataResponse = await fetch(metadataPath);
          if (metadataResponse.ok) {
                status.metadata = await metadataResponse.json();
          }
        } catch (metaError) {
              console.log('No metadata file found (this is optional)');
        }
        
        this.processedCache.set(cacheKey, status);
        return status;
      } else {
            const status: ProcessingStatus = {
              exists: false,
          timestamp: Date.now(),
          xmlPath,
          processed: false
        };
        
        this.processedCache.set(cacheKey, status);
        return status;
      }
    } catch (error) {
          const status: ProcessingStatus = {
            exists: false,
        timestamp: Date.now(),
        xmlPath: `${this.basePath}/grade-${grade}/${unitId}.xml`,
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.processedCache.set(cacheKey, status);
      return status;
    }
  }

  /**
   * Check if source content has changed since last processing
   */
  public async hasSourceContentChanged(
        grade: number, 
    unitId: string, 
    sourceContent: string
  ): Promise<boolean> {
        const status = await this.getProcessingStatus(grade, unitId);
    
    if (!status.exists || !status.metadata) {
          return true; // No processed version exists
    }
    
    // Compare content hash
    const currentHash = await this.generateContentHash(sourceContent);
    const storedHash = status.metadata.sourceContentHash;
    
    if (!storedHash || currentHash !== storedHash) {
          console.log('Source content has changed, reprocessing needed');
      return true;
    }
    
    console.log('Source content unchanged, using cached version');
    return false;
  }

  /**
   * Generate hash for content comparison
   */
  public async generateContentHash(content: string): Promise<string> {
        // Clean content for consistent hashing
    const cleanContent = content
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\s+$/gm, '') // Remove trailing whitespace
      .trim();
    
    // Use Web Crypto API for hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(cleanContent);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get all processed content for a grade
   */
  public async getGradeProcessingStatus(grade: number): Promise<GradeProcessingStatus> {
        const gradeStatus: GradeProcessingStatus = {
          grade,
      units: [],
      totalUnits: 0,
      processedUnits: 0,
      lastUpdated: new Date().toISOString()
    };

    // Check all possible units (1-12 typically)
    const unitPromises = Array.from({ length: 12 }, (_, i) => {
          const unitId = `unit-${String(i + 1).padStart(2, '0')}`;
      return this.getProcessingStatus(grade, unitId).then(status => ({
            unitId,
        status
      }));
    });

    const results = await Promise.all(unitPromises);
    
    results.forEach(({ unitId, status }) => {
          if (status.exists) {
            gradeStatus.processedUnits++;
        gradeStatus.units.push({
              unitId,
          processed: true,
          lastModified: status.lastModified,
          hasMetadata: !!status.metadata
        });
      } else {
            gradeStatus.units.push({
              unitId,
          processed: false
        });
      }
      gradeStatus.totalUnits++;
    });

    return gradeStatus;
  }

  /**
   * Mark content as processed
   */
  public async markContentProcessed(
        grade: number, 
    unitId: string, 
    sourceContent: string,
    metadata?: ProcessingMetadata
  ): Promise<void> {
        const contentHash = await this.generateContentHash(sourceContent);
    
    const processingMetadata: ProcessingMetadata = {
          ...metadata,
      processedAt: new Date().toISOString(),
      sourceContentHash: contentHash,
      version: '2.0',
      processor: 'AI-Vocabulary-Extractor'
    };

    // Save metadata file
    const metadataPath = `${this.basePath}/grade-${grade}/${unitId}-metadata.json`;
    
    try {
          // In a real implementation, this would save to the server
      // For now, we'll cache it locally
      const cacheKey = `${grade}-${unitId}`;
      this.processedCache.set(cacheKey, {
            exists: true,
        timestamp: Date.now(),
        xmlPath: `${this.basePath}/grade-${grade}/${unitId}.xml`,
        processed: true,
        metadata: processingMetadata
      });
      
      console.log(`Marked content as processed: Grade ${grade}, Unit ${unitId}`);
    } catch (error) {
          console.error('Failed to mark content as processed:', error);
      throw error;
    }
  }

  /**
   * Check multiple units at once
   */
  public async checkMultipleUnits(requests: ContentCheckRequest[]): Promise<ContentCheckResult[]> {
        const results = await Promise.all(
          requests.map(async (request) => {
            const status = await this.getProcessingStatus(request.grade, request.unitId);
        return {
              ...request,
          status,
          needsProcessing: !status.exists
        };
      })
    );
    
    return results;
  }

  /**
   * Get processing queue (content that needs processing)
   */
  public async getProcessingQueue(grade?: number): Promise<ProcessingQueueItem[]> {
        const queue: ProcessingQueueItem[] = [];
    const grades = grade ? [grade] : [6, 7, 8, 9, 10, 11, 12];
    
    for (const gradeLevel of grades) {
          const gradeStatus = await this.getGradeProcessingStatus(gradeLevel);
      
      gradeStatus.units.forEach(unit => {
            if (!unit.processed) {
              queue.push({
                grade: gradeLevel,
            unitId: unit.unitId,
            priority: this.calculatePriority(gradeLevel, unit.unitId),
            estimatedProcessingTime: 120 // seconds
          });
        }
      });
    }
    
    // Sort by priority
    return queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Clear cache for specific content
   */
  public clearCache(grade?: number, unitId?: string): void {
        if (grade && unitId) {
          this.processedCache.delete(`${grade}-${unitId}`);
    } else if (grade) {
          // Clear all units for grade
      Array.from(this.processedCache.keys())
        .filter(key => key.startsWith(`${grade}-`))
        .forEach(key => this.processedCache.delete(key));
    } else {
          // Clear all cache
      this.processedCache.clear();
    }
  }

  /**
   * Calculate processing priority
   */
  private calculatePriority(grade: number, unitId: string): number {
        // Higher priority for lower grades and earlier units
    const gradeWeight = (13 - grade) * 10; // Grade 6 = 70, Grade 12 = 10
    const unitNumber = parseInt(unitId.replace('unit-', '')) || 1;
    const unitWeight = (13 - unitNumber); // Unit 1 = 12, Unit 12 = 1
    
    return gradeWeight + unitWeight;
  }

  /**
   * Validate XML file integrity
   */
  public async validateProcessedContent(grade: number, unitId: string): Promise<ValidationResult> {
        const status = await this.getProcessingStatus(grade, unitId);
    
    if (!status.exists) {
          return {
            valid: false,
        errors: ['Content file does not exist']
      };
    }

    try {
          // Fetch and validate XML
      const response = await fetch(status.xmlPath);
      if (!response.ok) {
            return {
              valid: false,
          errors: [`Failed to fetch content: ${response.statusText}`]
        };
      }
      
      const xmlContent = await response.text();
      
      // Basic XML validation
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
            return {
              valid: false,
          errors: ['XML parsing error: ' + parseError.textContent]
        };
      }
      
      // Check required elements
      const errors: string[] = [];
      const unit = xmlDoc.querySelector('unit');
      
      if (!unit) {
            errors.push('Missing unit root element');
      } else {
            if (!unit.getAttribute('id')) errors.push('Unit missing id attribute');
        if (!unit.getAttribute('title')) errors.push('Unit missing title attribute');
        if (!unit.querySelector('vocabulary_bank')) errors.push('Unit missing vocabulary_bank');
        if (!unit.querySelector('sections')) errors.push('Unit missing sections');
      }
      
      return {
            valid: errors.length === 0,
        errors,
        contentLength: xmlContent.length,
        vocabularyCount: xmlDoc.querySelectorAll('vocabulary_item').length,
        exerciseCount: xmlDoc.querySelectorAll('exercise').length
      };
      
    } catch (error) {
          return {
            valid: false,
        errors: ['Validation failed: ' + (error as Error).message]
      };
    }
  }

  /**
   * Get content freshness information
   */
  public async getContentFreshness(grade: number, unitId: string): Promise<ContentFreshness> {
        const status = await this.getProcessingStatus(grade, unitId);
    
    if (!status.exists) {
          return {
            status: 'missing',
        message: 'Content has not been processed yet'
      };
    }
    
    const now = Date.now();
    const processedAt = status.metadata?.processedAt ? 
      new Date(status.metadata.processedAt).getTime() : 0;
    
    const ageInHours = (now - processedAt) / (1000 * 60 * 60);
    
    if (ageInHours < 1) {
          return {
            status: 'fresh',
        message: 'Content processed recently',
        ageInHours
      };
    } else if (ageInHours < 24) {
          return {
            status: 'recent',
        message: `Content processed ${Math.round(ageInHours)} hours ago`,
        ageInHours
      };
    } else if (ageInHours < 168) { // 1 week
      return {
            status: 'older',
        message: `Content processed ${Math.round(ageInHours / 24)} days ago`,
        ageInHours
      };
    } else {
          return {
            status: 'stale',
        message: 'Content is quite old, consider reprocessing',
        ageInHours
      };
    }
  }

  /**
   * Batch check multiple content files
   */
  public async batchCheck(items: ContentCheckRequest[]): Promise<BatchCheckResult> {
        const results: ContentCheckResult[] = [];
    let totalFound = 0;
    let totalMissing = 0;
    
    // Process in chunks to avoid overwhelming the server
    const chunkSize = 5;
    for (let i = 0; i < items.length; i += chunkSize) {
          const chunk = items.slice(i, i + chunkSize);
      
      const chunkResults = await Promise.all(
            chunk.map(async (item) => {
              const status = await this.getProcessingStatus(item.grade, item.unitId);
          const result: ContentCheckResult = {
                ...item,
            status,
            needsProcessing: !status.exists
          };
          
          if (status.exists) {
                totalFound++;
          } else {
                totalMissing++;
          }
          
          return result;
        })
      );
      
      results.push(...chunkResults);
    }
    
    return {
          results,
      summary: {
            totalChecked: items.length,
        found: totalFound,
        missing: totalMissing,
        checkedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Generate processing recommendations
   */
  public async getProcessingRecommendations(grade?: number): Promise<ProcessingRecommendation[]> {
        const recommendations: ProcessingRecommendation[] = [];
    const queue = await this.getProcessingQueue(grade);
    
    if (queue.length === 0) {
          recommendations.push({
            type: 'info',
        message: 'All content is up to date',
        action: 'none'
      });
      return recommendations;
    }
    
    // High priority missing content
    const highPriorityMissing = queue.filter(item => item.priority > 50);
    if (highPriorityMissing.length > 0) {
          recommendations.push({
            type: 'urgent',
        message: `${highPriorityMissing.length} high-priority units need processing`,
        action: 'process_high_priority',
        details: highPriorityMissing.map(item => `Grade ${item.grade} ${item.unitId}`)
      });
    }
    
    // Batch processing recommendation
    if (queue.length > 5) {
          const estimatedTime = queue.reduce((sum, item) => sum + item.estimatedProcessingTime, 0);
      recommendations.push({
            type: 'efficiency',
        message: `Consider batch processing ${queue.length} units`,
        action: 'batch_process',
        details: [`Estimated time: ${Math.round(estimatedTime / 60)} minutes`]
      });
    }
    
    return recommendations;
  }

  /**
   * Clear all caches
   */
  public clearAllCaches(): void {
        this.processedCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): CacheStats {
        return {
          size: this.processedCache.size,
      entries: Array.from(this.processedCache.entries()).map(([key, value]) => ({
            key,
        exists: value.exists,
        age: Date.now() - value.timestamp,
        hasMetadata: !!value.metadata
      }))
    };
  }
}

// Supporting interfaces
export interface ProcessingStatus {
      exists: boolean;
  timestamp: number;
  xmlPath: string;
  lastModified?: string;
  contentLength?: number;
  processed: boolean;
  metadata?: ProcessingMetadata;
  error?: string;
}

export interface ProcessingMetadata {
      processedAt: string;
  sourceContentHash: string;
  version: string;
  processor: string;
  vocabularyCount?: number;
  exerciseCount?: number;
  sectionCount?: number;
  originalSource?: string;
  processingTime?: number;
}

export interface ContentCheckRequest {
      grade: number;
  unitId: string;
  sourceContent?: string;
}

export interface ContentCheckResult extends ContentCheckRequest {
      status: ProcessingStatus;
  needsProcessing: boolean;
}

export interface BatchCheckResult {
      results: ContentCheckResult[];
  summary: {
        totalChecked: number;
    found: number;
    missing: number;
    checkedAt: string;
  };
}

export interface GradeProcessingStatus {
      grade: number;
  units: UnitProcessingInfo[];
  totalUnits: number;
  processedUnits: number;
  lastUpdated: string;
}

export interface UnitProcessingInfo {
      unitId: string;
  processed: boolean;
  lastModified?: string;
  hasMetadata?: boolean;
}

export interface ProcessingQueueItem {
      grade: number;
  unitId: string;
  priority: number;
  estimatedProcessingTime: number;
}

export interface ContentFreshness {
      status: 'missing' | 'fresh' | 'recent' | 'older' | 'stale';
  message: string;
  ageInHours?: number;
}

export interface ProcessingRecommendation {
      type: 'info' | 'warning' | 'urgent' | 'efficiency';
  message: string;
  action: 'none' | 'process_high_priority' | 'batch_process' | 'reprocess_stale';
  details?: string[];
}

export interface ValidationResult {
      valid: boolean;
  errors: string[];
  contentLength?: number;
  vocabularyCount?: number;
  exerciseCount?: number;
}

export interface CacheStats {
      size: number;
  entries: {
        key: string;
    exists: boolean;
    age: number;
    hasMetadata: boolean;
  }[];
}

// Export singleton instance
export const contentChecker = ContentChecker.getInstance();