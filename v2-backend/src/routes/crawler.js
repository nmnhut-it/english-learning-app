import express from 'express';
import { webCrawlerService } from '../services/WebCrawlerService.js';
import { googleCrawlerService } from '../services/GoogleCrawlerService.js';
import { contentProcessingService } from '../services/ContentProcessingService.js';
import { geminiService } from '../services/GeminiService.js';
import fs from 'fs/promises';

const router = express.Router();

/**
 * POST /api/crawler/search
 * Search Google for loigiahay URLs
 */
router.post('/search', async (req, res) => {
  try {
    const { grade, unit, lessonType } = req.body;
    
    if (!grade || !unit || !lessonType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: grade, unit, lessonType'
      });
    }
    
    const url = await googleCrawlerService.searchGoogle(grade, unit, lessonType);
    
    res.json({
      success: !!url,
      url,
      grade,
      unit,
      lessonType
    });
    
  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/crawler/crawl
 * Crawl a specific URL or search and crawl
 */
router.post('/crawl', async (req, res) => {
  try {
    const { url, grade, unit, lessonType, processWithAI = false } = req.body;
    
    let result;
    
    if (url) {
      // Direct URL crawling
      const content = await webCrawlerService.crawlUrl(url);
      const filename = `custom-crawl-${Date.now()}.txt`;
      const filePath = await webCrawlerService.saveContent(content, filename);
      
      result = {
        success: true,
        url,
        contentLength: content.length,
        filePath,
        filename
      };
    } else if (grade && unit && lessonType) {
      // Search and crawl
      result = await webCrawlerService.searchAndCrawl(grade, unit, lessonType);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide either url OR (grade, unit, lessonType)'
      });
    }
    
    // Optionally process with AI immediately
    if (processWithAI && result.success) {
      console.log('🤖 Processing with AI...');
      
      // Read the crawled content
      const content = await fs.readFile(result.filePath, 'utf-8');
      
      // Process with Gemini
      const processResult = await contentProcessingService.processContent(content, {
        grade,
        unit,
        unitTitle: `Unit ${unit}`,
        lessonType,
        contentSource: 'crawler'
      });
      
      result.aiProcessing = processResult;
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Crawl failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/crawler/batch
 * Batch crawl multiple lessons
 */
router.post('/batch', async (req, res) => {
  try {
    const { lessons, processWithAI = false } = req.body;
    
    if (!lessons || !Array.isArray(lessons)) {
      return res.status(400).json({
        success: false,
        error: 'Provide an array of lessons [{grade, unit, lessonType}, ...]'
      });
    }
    
    // Optional: Process each crawled content with AI
    const processCallback = processWithAI ? async (crawlResult) => {
      if (crawlResult.success && crawlResult.filePath) {
        const content = await fs.readFile(crawlResult.filePath, 'utf-8');
        
        const aiResult = await contentProcessingService.processContent(content, {
          grade: crawlResult.grade,
          unit: crawlResult.unit,
          unitTitle: `Unit ${crawlResult.unit}`,
          lessonType: crawlResult.lessonType,
          contentSource: 'crawler'
        });
        
        crawlResult.aiProcessing = {
          success: aiResult.success,
          action: aiResult.action,
          processingTime: aiResult.processingTime
        };
      }
    } : null;
    
    const results = await webCrawlerService.batchCrawl(lessons, processCallback);
    
    res.json({
      success: true,
      totalLessons: lessons.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
    
  } catch (error) {
    console.error('Batch crawl failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/crawler/unit
 * Crawl all lessons for a specific unit
 */
router.post('/unit', async (req, res) => {
  try {
    const { grade, unit, processWithAI = false } = req.body;
    
    if (!grade || !unit) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: grade, unit'
      });
    }
    
    console.log(`📚 Crawling entire Unit ${unit} for Grade ${grade}`);
    
    const results = await webCrawlerService.crawlUnit(grade, unit);
    
    // Optionally process all with AI
    if (processWithAI) {
      for (const result of results) {
        if (result.success && result.filePath) {
          const content = await fs.readFile(result.filePath, 'utf-8');
          
          const aiResult = await contentProcessingService.processContent(content, {
            grade: result.grade,
            unit: result.unit,
            unitTitle: `Unit ${result.unit}`,
            lessonType: result.lessonType,
            contentSource: 'crawler'
          });
          
          result.aiProcessing = {
            success: aiResult.success,
            action: aiResult.action
          };
        }
      }
    }
    
    res.json({
      success: true,
      grade,
      unit,
      totalLessons: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
    
  } catch (error) {
    console.error('Unit crawl failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/crawler/stats
 * Get crawler statistics
 */
router.get('/stats', (req, res) => {
  const crawlerStats = webCrawlerService.getStats();
  const searchStats = googleCrawlerService.getCacheStats();
  
  res.json({
    crawler: crawlerStats,
    search: {
      cacheSize: searchStats.size,
      cachedSearches: searchStats.entries.length
    },
    gemini: {
      available: geminiService.isAvailable()
    }
  });
});

/**
 * POST /api/crawler/delay
 * Set crawl delay
 */
router.post('/delay', (req, res) => {
  const { minutes } = req.body;
  
  if (!minutes || minutes < 1) {
    return res.status(400).json({
      success: false,
      error: 'Provide delay in minutes (minimum 1)'
    });
  }
  
  webCrawlerService.setCrawlDelay(minutes);
  
  res.json({
    success: true,
    message: `Crawl delay set to ${minutes} minutes`
  });
});

export default router;