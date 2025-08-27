import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { googleCrawlerService } from './GoogleCrawlerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Web Crawler Service
 * Crawls loigiahay.com pages and extracts content
 */
class WebCrawlerService {
  constructor() {
    this.browser = null;
    this.crawlDelay = 5 * 60 * 1000; // 5 minutes between crawls
    this.lastCrawlTime = 0;
    this.outputDir = path.join(__dirname, '../../../v2/test-data');
  }

  /**
   * Initialize browser instance
   */
  async initBrowser() {
    if (!this.browser) {
      console.log('🚀 Launching browser...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Browser closed');
    }
  }

  /**
   * Wait for crawl delay (rate limiting)
   */
  async waitForDelay() {
    const timeSinceLastCrawl = Date.now() - this.lastCrawlTime;
    const remainingDelay = this.crawlDelay - timeSinceLastCrawl;
    
    if (remainingDelay > 0) {
      console.log(`⏳ Waiting ${Math.round(remainingDelay / 1000)} seconds before next crawl...`);
      await new Promise(resolve => setTimeout(resolve, remainingDelay));
    }
  }

  /**
   * Crawl a specific URL and extract content
   */
  async crawlUrl(url) {
    await this.waitForDelay();
    
    console.log('🕷️ Crawling:', url);
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for content to load
      await page.waitForSelector('body', { timeout: 10000 });
      
      // Extract main content - similar to manual copy
      const content = await page.evaluate(() => {
        // Remove scripts, styles, and ads
        const scripts = document.querySelectorAll('script, style, .ads, .advertisement');
        scripts.forEach(el => el.remove());
        
        // Get the main content area (adjust selector as needed)
        const mainContent = document.querySelector('body');
        if (!mainContent) return '';
        
        // Get text content preserving structure
        let textContent = mainContent.innerText || mainContent.textContent || '';
        
        // Clean up excessive whitespace but preserve structure
        textContent = textContent
          .split('\n')
          .map(line => line.trim())
          .join('\n');
        
        return textContent;
      });
      
      this.lastCrawlTime = Date.now();
      console.log(`✅ Crawled ${content.length} characters`);
      
      return content;
      
    } catch (error) {
      console.error('❌ Crawl failed:', error.message);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Search and crawl loigiahay content
   */
  async searchAndCrawl(grade, unit, lessonType) {
    console.log(`\n📚 Searching and crawling: Grade ${grade}, Unit ${unit}, ${lessonType}`);
    
    // Search for URL using Google crawler
    const url = await googleCrawlerService.searchGoogle(grade, unit, lessonType);
    
    if (!url || url.includes('google.com/search')) {
      console.warn('⚠️ Could not find specific loigiahay URL');
      return {
        success: false,
        error: 'URL not found',
        grade,
        unit,
        lessonType
      };
    }
    
    // Crawl the URL
    try {
      const content = await this.crawlUrl(url);
      
      // Save to file
      const filename = `grade-${grade}-unit-${unit}-${lessonType.replace(/_/g, '-')}.txt`;
      const filePath = await this.saveContent(content, filename);
      
      return {
        success: true,
        url,
        contentLength: content.length,
        filePath,
        filename,
        grade,
        unit,
        lessonType
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        url,
        grade,
        unit,
        lessonType
      };
    }
  }

  /**
   * Save content to file
   */
  async saveContent(content, filename) {
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const filePath = path.join(this.outputDir, filename);
    
    // Add source information at the top (like manual copies)
    const contentWithHeader = `
${content}

Xem thêm tại: https://loigiaihay.com/`;
    
    await fs.writeFile(filePath, contentWithHeader, 'utf-8');
    console.log(`💾 Saved to: ${filename}`);
    
    return filePath;
  }

  /**
   * Batch crawl multiple lessons
   */
  async batchCrawl(lessons, processCallback = null) {
    const results = [];
    console.log(`\n🚀 Starting batch crawl for ${lessons.length} lessons`);
    console.log(`⏱️ Estimated time: ${lessons.length * 5} minutes\n`);
    
    try {
      await this.initBrowser();
      
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        console.log(`\n[${i + 1}/${lessons.length}] Processing ${lesson.lessonType}...`);
        
        // Crawl the lesson
        const result = await this.searchAndCrawl(
          lesson.grade,
          lesson.unit,
          lesson.lessonType
        );
        
        results.push(result);
        
        // Optional callback for processing after each crawl
        if (processCallback && result.success) {
          console.log('🤖 Running post-crawl processing...');
          await processCallback(result);
        }
        
        // Progress update
        const remaining = lessons.length - i - 1;
        if (remaining > 0) {
          console.log(`\n⏳ ${remaining} lessons remaining...`);
        }
      }
      
    } finally {
      await this.closeBrowser();
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Batch Crawl Complete!');
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(50) + '\n');
    
    return results;
  }

  /**
   * Crawl all lessons for a unit
   */
  async crawlUnit(grade, unit) {
    const lessonTypes = [
      'getting_started',
      'language',
      'reading',
      'speaking',
      'listening',
      'writing',
      'communication_culture',
      'looking_back'
    ];
    
    const lessons = lessonTypes.map(lessonType => ({
      grade,
      unit,
      lessonType
    }));
    
    return this.batchCrawl(lessons);
  }

  /**
   * Get crawl statistics
   */
  getStats() {
    return {
      browserActive: !!this.browser,
      lastCrawlTime: this.lastCrawlTime,
      crawlDelay: this.crawlDelay,
      outputDir: this.outputDir
    };
  }

  /**
   * Set custom crawl delay
   */
  setCrawlDelay(minutes) {
    this.crawlDelay = minutes * 60 * 1000;
    console.log(`⏱️ Crawl delay set to ${minutes} minutes`);
  }
}

// Export singleton instance
export const webCrawlerService = new WebCrawlerService();
export default webCrawlerService;