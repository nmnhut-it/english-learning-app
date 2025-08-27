import fetch from 'node-fetch';
import puppeteer from 'puppeteer';

/**
 * Google Search Service
 * Finds loigiahay.com URLs for specific lessons
 */
class GoogleSearchService {
  constructor() {
    this.searchPatterns = {
      getting_started: 'getting started',
      language: 'language', 
      reading: 'reading',
      speaking: 'speaking',
      listening: 'listening',
      writing: 'writing',
      communication_culture: 'communication culture clil',
      looking_back: 'looking back'
    };
    
    // Cache search results to avoid repeated searches
    this.searchCache = new Map();
    this.browser = null;
  }

  /**
   * Initialize browser
   */
  async initBrowser() {
    if (!this.browser) {
      console.log('🚀 Launching browser for search...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Close browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Build search query for Google
   */
  buildSearchQuery(grade, unit, lessonType) {
    const lessonKeywords = this.searchPatterns[lessonType] || lessonType;
    // More specific search to get exact grade
    return `site:loigiaihay.com "tiếng anh ${grade}" "unit ${unit}" "${lessonKeywords}" global success`;
  }

  /**
   * Search Google and extract the actual link from search results
   */
  async searchGoogle(query) {
    const cacheKey = query;
    
    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      console.log('📦 Using cached search result for:', query);
      return this.searchCache.get(cacheKey);
    }

    console.log('🔍 Searching Google for:', query);
    
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set user agent to avoid bot detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to Google
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      console.log('🌐 Search URL:', searchUrl);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait a bit for results to load
      await page.waitForTimeout(2000);
      
      // Extract all links from search results
      const links = await page.evaluate(() => {
        const results = [];
        // Google search result links are in <a> tags with href
        const linkElements = document.querySelectorAll('a[href]');
        
        linkElements.forEach(link => {
          const href = link.href;
          // Look for loigiaihay.com links that are not Google redirects
          // The actual URLs have article IDs like: tieng-anh-11-unit-1-speaking-a135508.html
          if (href && 
              href.includes('loigiaihay.com') && 
              !href.includes('google.com') &&
              !href.includes('webcache') &&
              !href.includes('translate') &&
              href.includes('-a') && // Must have article ID
              href.endsWith('.html')) { // Must end with .html
            
            // Get the visible text to help verify it's the right link
            const text = link.innerText || link.textContent || '';
            results.push({
              url: href,
              text: text.substring(0, 100)
            });
          }
        });
        
        return results;
      });
      
      await page.close();
      
      console.log(`📋 Found ${links.length} loigiaihay links`);
      
      // Log all found links for debugging
      links.forEach((link, index) => {
        console.log(`  ${index + 1}. ${link.url}`);
      });
      
      if (links.length > 0) {
        // Parse query to get grade and lesson type for verification
        const gradeMatch = query.match(/"tiếng anh (\d+)"/);
        const unitMatch = query.match(/"unit (\d+)"/);
        const lessonMatch = query.match(/"([^"]+)" global success/);
        
        const grade = gradeMatch ? gradeMatch[1] : '';
        const unit = unitMatch ? unitMatch[1] : '';
        const lessonKeywords = lessonMatch ? lessonMatch[1].toLowerCase() : '';
        
        // Find the best matching link
        let bestLink = null;
        let bestScore = 0;
        
        for (const link of links) {
          let score = 0;
          const urlLower = link.url.toLowerCase();
          
          // Check if URL contains the grade number
          if (grade && urlLower.includes(`anh-${grade}-`)) {
            score += 3; // High priority for correct grade
          }
          
          // Check if URL contains the unit number
          if (unit && urlLower.includes(`unit-${unit}-`)) {
            score += 2;
          }
          
          // Check if URL contains lesson type keywords
          if (lessonKeywords) {
            const keywords = lessonKeywords.split(' ');
            keywords.forEach(keyword => {
              if (urlLower.includes(keyword.replace(' ', '-'))) {
                score += 1;
              }
            });
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestLink = link.url;
          }
        }
        
        if (bestLink) {
          console.log(`✅ Selected best match (score: ${bestScore}):`, bestLink);
          this.searchCache.set(cacheKey, bestLink);
          return bestLink;
        } else if (links.length > 0) {
          // Fallback to first result
          bestLink = links[0].url;
          console.log('⚠️ Using first result (no good match found):', bestLink);
          this.searchCache.set(cacheKey, bestLink);
          return bestLink;
        }
      }
      
      console.log('❌ No suitable links found in search results');
      return null;
      
    } catch (error) {
      console.error('❌ Google search failed:', error.message);
      
      // If search fails, try constructing URL directly as fallback
      return this.constructFallbackUrl(query);
    }
  }

  /**
   * Construct a fallback URL when search fails
   */
  constructFallbackUrl(query) {
    // Parse the query to extract grade, unit, and lesson type
    const match = query.match(/"tiếng anh (\d+)".*"unit (\d+)".*"([^"]+)"/);
    
    if (match) {
      const [, grade, unit, lessonPart] = match;
      
      // Map lesson keywords back to URL format
      const lessonMap = {
        'getting started': 'getting-started',
        'language': 'language',
        'reading': 'reading',
        'speaking': 'speaking',
        'listening': 'listening',
        'writing': 'writing',
        'communication culture clil': 'communication-and-culture-clil',
        'looking back': 'looking-back'
      };
      
      const urlLesson = lessonMap[lessonPart.toLowerCase()] || lessonPart.replace(/\s+/g, '-');
      
      // Construct a likely URL (this is a guess, may not work)
      const fallbackUrl = `https://loigiaihay.com/tieng-anh-${grade}-unit-${unit}-${urlLesson}.html`;
      
      console.log('🔧 Constructed fallback URL:', fallbackUrl);
      return fallbackUrl;
    }
    
    return null;
  }

  /**
   * Find loigiahay URL for a specific lesson
   */
  async findLoigiahayUrl(grade, unit, lessonType) {
    const query = this.buildSearchQuery(grade, unit, lessonType);
    const url = await this.searchGoogle(query);
    
    if (!url) {
      console.warn(`⚠️ Could not find URL for Grade ${grade}, Unit ${unit}, ${lessonType}`);
    }
    
    return url;
  }

  /**
   * Batch search for multiple lessons
   */
  async batchSearch(lessons) {
    const results = [];
    
    try {
      // Keep browser open for batch operations
      await this.initBrowser();
      
      for (const lesson of lessons) {
        const { grade, unit, lessonType } = lesson;
        const url = await this.findLoigiahayUrl(grade, unit, lessonType);
        
        results.push({
          grade,
          unit,
          lessonType,
          url,
          found: !!url
        });
        
        // Small delay between searches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } finally {
      // Close browser after batch
      await this.closeBrowser();
    }
    
    return results;
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
    console.log('🗑️ Search cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.searchCache.size,
      entries: Array.from(this.searchCache.entries())
    };
  }
}

// Export singleton instance
export const googleSearchService = new GoogleSearchService();
export default googleSearchService;