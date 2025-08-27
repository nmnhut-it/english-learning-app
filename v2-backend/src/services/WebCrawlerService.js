import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { googleSearchAPIService } from './GoogleSearchAPIService.js';
import { urlPatternService } from './URLPatternService.js';

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
   * Initialize browser with stealth mode to avoid detection
   */
  async initBrowser() {
    if (!this.browser) {
      console.log('🚀 Launching stealth browser...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--disable-extensions',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-client-side-phishing-detection',
        ],
        defaultViewport: null,
      });
      
      // Remove automation indicators on all pages
      const pages = await this.browser.pages();
      for (const page of pages) {
        await this.setupStealthPage(page);
      }
    }
    return this.browser;
  }
  
  /**
   * Setup stealth mode for a page
   */
  async setupStealthPage(page) {
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      delete navigator.webdriver;
      
      // Mock chrome object
      window.chrome = {
        runtime: {},
      };
      
      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'vi'],
      });
      
      // Override automation detection
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
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
   * Crawl a specific URL with human-like browser behavior
   */
  async crawlUrl(url) {
    await this.waitForDelay();
    
    console.log('🕷️ Human-like crawling:', url);
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      // Apply stealth mode to this page
      await this.setupStealthPage(page);
      
      // Set realistic viewport and user agent
      await page.setViewport({ width: 1366, height: 768 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Set additional headers to look more human
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });
      
      // Navigate directly to target page (skip homepage for now due to timeouts)
      console.log('  → Navigating to target page...');
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', // Less strict loading requirement
        timeout: 60000 
      });
      
      // Wait for content and simulate human reading
      await page.waitForSelector('body', { timeout: 15000 });
      
      // Simulate human behavior - scroll and wait
      console.log('  → Simulating human reading...');
      await page.evaluate(() => {
        window.scrollTo(0, 200);
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await page.evaluate(() => {
        window.scrollTo(0, 600);
      });
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Extract main content - similar to manual copy
      const content = await page.evaluate(() => {
        // Remove scripts, styles, and ads
        const scripts = document.querySelectorAll('script, style, .ads, .advertisement, .header, .footer, .menu, .sidebar');
        scripts.forEach(el => el.remove());
        
        // First remove all navigation and unwanted elements from the entire document
        const unwantedElements = document.querySelectorAll(`
          nav, header, footer, .navigation, .menu, .sidebar, .breadcrumb,
          .ads, .advertisement, .header, .footer, .menu, .sidebar,
          script, style, noscript, iframe, 
          .related-posts, .comments, .comment-section,
          .social-share, .share-buttons
        `);
        unwantedElements.forEach(el => el.remove());
        
        // Try to find the main content area using multiple strategies
        let mainContent = null;
        
        // Strategy 1: Look for lesson-specific content markers
        const lessonMarkers = [
          '[class*="lesson"]', '[id*="lesson"]',
          '[class*="exercise"]', '[id*="exercise"]', 
          '[class*="content-lesson"]', '[class*="lesson-content"]',
          '.content-main', '.main-content', 'article', 'main', '.article-content'
        ];
        
        for (const marker of lessonMarkers) {
          const elements = document.querySelectorAll(marker);
          if (elements.length > 0) {
            // Find the one with most text that contains lesson content
            let bestMatch = null;
            let maxScore = 0;
            
            elements.forEach(element => {
              const text = element.innerText || '';
              const textLength = text.length;
              
              // Score based on length and presence of lesson indicators
              let score = textLength;
              
              // Boost score for lesson content indicators
              if (text.includes('Listen and read') || text.includes('Nghe và đọc')) score += 1000;
              if (text.includes('Exercise') || text.includes('Bài')) score += 500;
              if (text.includes('Ms Hoa') || text.includes('dialogue')) score += 500;
              if (text.includes('Phương pháp giải')) score += 300;
              
              // Penalize if it looks like navigation (many unit listings)
              const unitMatches = (text.match(/Unit \d+:/g) || []).length;
              if (unitMatches > 5) score -= 2000; // Likely navigation menu
              
              if (score > maxScore && textLength > 1000) {
                maxScore = score;
                bestMatch = element;
              }
            });
            
            if (bestMatch) {
              mainContent = bestMatch;
              break;
            }
          }
        }
        
        // Strategy 2: If no specific markers found, look for the largest meaningful text container
        if (!mainContent) {
          const containers = document.querySelectorAll('div, section, article');
          let bestContainer = null;
          let maxScore = 0;
          
          containers.forEach(container => {
            const text = container.innerText || '';
            const textLength = text.length;
            
            if (textLength < 2000) return; // Skip small containers
            
            let score = textLength;
            
            // Boost for lesson content
            if (text.includes('Listen and read')) score += 2000;
            if (text.includes('Exercise')) score += 1000;
            if (text.includes('dialogue')) score += 500;
            
            // Penalize navigation-heavy content
            const unitMatches = (text.match(/Unit \d+:/g) || []).length;
            if (unitMatches > 5) score -= 3000;
            
            if (score > maxScore) {
              maxScore = score;
              bestContainer = container;
            }
          });
          
          mainContent = bestContainer;
        }
        
        // Strategy 3: Fall back to body with aggressive navigation removal
        if (!mainContent) {
          mainContent = document.querySelector('body');
        }
        
        if (!mainContent) return '';
        
        // Get text content preserving structure
        let textContent = mainContent.innerText || mainContent.textContent || '';
        
        // Clean up excessive whitespace but preserve structure
        textContent = textContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0) // Remove empty lines
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
    
    let url = null;
    
    // Strategy 1: Try Google Custom Search API
    try {
      url = await googleSearchAPIService.findLoigiahayUrl(grade, unit, lessonType);
    } catch (error) {
      console.warn('Google Search API error:', error.message);
    }
    
    // Strategy 2: Try URL pattern database
    if (!url) {
      url = await urlPatternService.findUrl(grade, unit, lessonType);
    }
    
    if (!url) {
      console.warn('⚠️ Could not find specific loigiahay URL');
      return {
        success: false,
        error: 'URL not found - try configuring Google Search API or adding URL manually',
        grade,
        unit,
        lessonType,
        suggestion: 'Set GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID environment variables'
      };
    }
    
    // Crawl the URL
    try {
      const content = await this.crawlUrl(url);
      
      // Save successful URL to pattern database for future use
      await urlPatternService.addPattern(grade, unit, lessonType, url, true);
      
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