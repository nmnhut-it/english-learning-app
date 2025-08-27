import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DATA_PATH = process.env.CONTENT_DATA_PATH || 
  path.join(__dirname, '../../../v2/data/structured');

/**
 * Main Content Processing Service
 * Implements the check-before-process logic for V2
 */
export class ContentProcessingService {
  constructor() {
    this.activeProcessing = new Map();
    this.contentCache = new Map();
  }

  /**
   * Main processing workflow - Check disk first, process if needed
   */
  async processContent(sourceContent, metadata) {
    const { grade, unit, unitTitle, lessonType, contentSource } = metadata;
    const processKey = `${grade}-${unit}-${lessonType || 'default'}`;
    
    // Prevent duplicate processing
    if (this.activeProcessing.has(processKey)) {
      throw new Error('Content is already being processed');
    }
    
    this.activeProcessing.set(processKey, Date.now());
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Processing workflow started: Grade ${grade}, Unit ${unit}`);
      
      // STEP 1: Check if already processed
      console.log('📂 Checking disk for existing processed content...');
      const existsOnDisk = await this.isContentProcessed(grade, unit);
      
      if (existsOnDisk) {
        console.log('✅ Found existing content on disk');
        
        // STEP 2: Check if source content changed
        console.log('🔄 Checking if source content has changed...');
        const hasChanged = await this.hasSourceContentChanged(grade, unit, sourceContent);
        
        if (!hasChanged) {
          console.log('💾 Source unchanged, loading from disk');
          
          const xmlPath = this.getXMLPath(grade, unit);
          const xmlContent = await fs.readFile(xmlPath, 'utf-8');
          const processingTime = Date.now() - startTime;
          
          return {
            success: true,
            action: 'loaded_from_disk',
            message: 'Content loaded from disk (no processing needed)',
            data: {
              xmlContent,
              xmlPath: xmlPath.replace(path.join(__dirname, '../../..'), ''),
              processingTime,
              fromCache: true,
              grade: parseInt(grade),
              unit,
              lessonType
            }
          };
        } else {
          console.log('🔄 Source content changed, reprocessing...');
        }
      } else {
        console.log('🆕 No existing content found, processing needed');
      }
      
      // STEP 3: Process with AI (only if needed)
      console.log('🤖 Starting AI processing...');
      
      // This will be called by the AI route
      return {
        success: true,
        action: 'needs_ai_processing',
        message: 'Content needs AI processing',
        data: {
          grade: parseInt(grade),
          unit,
          lessonType,
          requiresProcessing: true
        }
      };
      
    } catch (error) {
      console.error('❌ Content processing failed:', error);
      
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        action: 'failed',
        message: `Processing failed: ${error.message}`,
        data: {
          processingTime,
          error: error.message,
          grade: parseInt(grade),
          unit,
          lessonType
        }
      };
    } finally {
      this.activeProcessing.delete(processKey);
    }
  }

  /**
   * Check if content is already processed on disk
   */
  async isContentProcessed(grade, unit) {
    try {
      const xmlPath = this.getXMLPath(grade, unit);
      await fs.access(xmlPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if source content has changed by comparing hashes
   */
  async hasSourceContentChanged(grade, unit, sourceContent) {
    try {
      const hashPath = this.getHashPath(grade, unit);
      const newHash = this.generateContentHash(sourceContent);
      
      try {
        const existingHash = await fs.readFile(hashPath, 'utf-8');
        return newHash !== existingHash.trim();
      } catch (error) {
        // Hash file doesn't exist, assume changed
        return true;
      }
    } catch (error) {
      console.error('Error checking content changes:', error);
      return true; // Assume changed on error
    }
  }

  /**
   * Save processed content to disk
   */
  async saveProcessedContent(grade, unit, xmlContent, sourceContent, metadata = {}) {
    try {
      const gradeDir = path.join(CONTENT_DATA_PATH, `grade-${grade}`);
      const xmlPath = this.getXMLPath(grade, unit);
      const hashPath = this.getHashPath(grade, unit);
      
      // Ensure directory exists
      await fs.mkdir(gradeDir, { recursive: true });
      
      // Save XML content
      await fs.writeFile(xmlPath, xmlContent, 'utf-8');
      
      // Save source content hash for change detection
      const sourceHash = this.generateContentHash(sourceContent);
      await fs.writeFile(hashPath, sourceHash, 'utf-8');
      
      // Save metadata
      if (Object.keys(metadata).length > 0) {
        const metadataPath = path.join(gradeDir, `${unit}.metadata.json`);
        await fs.writeFile(metadataPath, JSON.stringify({
          ...metadata,
          savedAt: new Date().toISOString(),
          sourceHash
        }, null, 2), 'utf-8');
      }
      
      console.log(`💾 Content saved to: ${xmlPath}`);
      
      const stats = await fs.stat(xmlPath);
      
      return {
        success: true,
        xmlPath: xmlPath.replace(path.join(__dirname, '../../..'), ''),
        savedAt: stats.mtime,
        fileSize: stats.size,
        sourceHash
      };
      
    } catch (error) {
      console.error('Failed to save processed content:', error);
      throw new Error(`Failed to save content: ${error.message}`);
    }
  }

  /**
   * Load existing content from disk
   */
  async loadContent(grade, unit) {
    try {
      const xmlPath = this.getXMLPath(grade, unit);
      const xmlContent = await fs.readFile(xmlPath, 'utf-8');
      const stats = await fs.stat(xmlPath);
      
      return {
        success: true,
        data: {
          xmlContent,
          xmlPath: xmlPath.replace(path.join(__dirname, '../../..'), ''),
          lastModified: stats.mtime,
          fileSize: stats.size,
          grade: parseInt(grade),
          unit
        }
      };
    } catch (error) {
      throw new Error(`Failed to load content: ${error.message}`);
    }
  }

  /**
   * Get XML file path for grade/unit
   */
  getXMLPath(grade, unit) {
    const unitStr = String(unit);
    const unitId = unitStr.startsWith('unit-') ? unitStr : `unit-${unitStr.padStart(2, '0')}`;
    return path.join(CONTENT_DATA_PATH, `grade-${grade}`, `${unitId}.xml`);
  }

  /**
   * Get hash file path for grade/unit
   */
  getHashPath(grade, unit) {
    const unitStr = String(unit);
    const unitId = unitStr.startsWith('unit-') ? unitStr : `unit-${unitStr.padStart(2, '0')}`;
    return path.join(CONTENT_DATA_PATH, `grade-${grade}`, `${unitId}.hash`);
  }

  /**
   * Generate content hash for change detection
   */
  generateContentHash(content) {
    return crypto.createHash('md5').update(content.trim()).digest('hex');
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    return {
      activeJobs: this.activeProcessing.size,
      cacheSize: this.contentCache.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Clear processing cache
   */
  clearCache() {
    this.contentCache.clear();
    console.log('🧹 Processing cache cleared');
  }

  /**
   * Get processing recommendations based on current state
   */
  async getProcessingRecommendations(grade = null) {
    const recommendations = [];
    
    try {
      const grades = grade ? [grade] : [6, 7, 8, 9, 10, 11, 12];
      
      for (const gradeLevel of grades) {
        const gradeDir = path.join(CONTENT_DATA_PATH, `grade-${gradeLevel}`);
        
        try {
          const files = await fs.readdir(gradeDir);
          const xmlFiles = files.filter(file => file.endsWith('.xml'));
          const missingUnits = 12 - xmlFiles.length;
          
          if (missingUnits > 0) {
            recommendations.push({
              type: 'info',
              message: `Grade ${gradeLevel} is missing ${missingUnits} units`,
              action: 'add_content',
              details: [`${xmlFiles.length}/12 units completed`]
            });
          }
        } catch (error) {
          recommendations.push({
            type: 'warning',
            message: `Grade ${gradeLevel} has no content yet`,
            action: 'add_content',
            details: ['Directory not found']
          });
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }
}

// Export singleton instance
export const contentProcessingService = new ContentProcessingService();