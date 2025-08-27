import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { geminiService } from '../services/GeminiService.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DATA_PATH = process.env.CONTENT_DATA_PATH || 
  path.join(__dirname, '../../../v2/data/structured');

/**
 * GET /api/status/overview
 * Get overall content processing status
 */
router.get('/overview', async (req, res) => {
  try {
    const grades = [6, 7, 8, 9, 10, 11, 12];
    const overview = [];
    
    for (const grade of grades) {
      const gradeDir = path.join(CONTENT_DATA_PATH, `grade-${grade}`);
      let unitCount = 0;
      let units = [];
      
      try {
        const files = await fs.readdir(gradeDir);
        const xmlFiles = files.filter(file => file.endsWith('.xml'));
        unitCount = xmlFiles.length;
        
        units = await Promise.all(xmlFiles.map(async (file) => {
          const unitPath = path.join(gradeDir, file);
          const stats = await fs.stat(unitPath);
          return {
            unit: file.replace('.xml', ''),
            lastModified: stats.mtime,
            fileSize: stats.size
          };
        }));
        
      } catch (error) {
        // Directory doesn't exist or is empty
      }
      
      overview.push({
        grade,
        unitCount,
        units,
        completionPercentage: Math.round((unitCount / 12) * 100) // 12 units per grade
      });
    }
    
    const totalUnits = overview.reduce((sum, grade) => sum + grade.unitCount, 0);
    const maxPossibleUnits = grades.length * 12; // 7 grades × 12 units
    
    res.json({
      success: true,
      data: {
        overview,
        summary: {
          totalGrades: grades.length,
          totalUnits,
          maxPossibleUnits,
          overallCompletion: Math.round((totalUnits / maxPossibleUnits) * 100)
        },
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Failed to get status overview:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get status overview',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/status/processing
 * Get current processing status and queue
 */
router.get('/processing', async (req, res) => {
  try {
    // In a real implementation, this would track active processing jobs
    // For now, return mock processing status
    
    res.json({
      success: true,
      data: {
        activeJobs: 0,
        queueSize: 0,
        processingCapacity: {
          maxConcurrent: parseInt(process.env.MAX_CONCURRENT_PROCESSING) || 3,
          current: 0,
          available: parseInt(process.env.MAX_CONCURRENT_PROCESSING) || 3
        },
        aiProviders: {
          gemini: geminiService.getStatus()
        },
        uptime: process.uptime(),
        lastActivity: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Failed to get processing status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get processing status',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/status/health
 * Detailed health check including AI provider connectivity
 */
router.get('/health', async (req, res) => {
  try {
    const checks = {
      server: true,
      fileSystem: false,
      gemini: false
    };
    
    // Check file system access
    try {
      await fs.access(CONTENT_DATA_PATH);
      checks.fileSystem = true;
    } catch (error) {
      console.warn('File system check failed:', error.message);
    }
    
    // Check Gemini connectivity using centralized service
    checks.gemini = await geminiService.healthCheck();
    
    // Claude removed - focusing on Gemini
    
    const allHealthy = Object.values(checks).every(check => check);
    
    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      data: {
        checks,
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Health check failed',
        details: error.message
      }
    });
  }
});

export default router;