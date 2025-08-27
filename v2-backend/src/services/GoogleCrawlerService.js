import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

/**
 * Google Crawler Service
 * Crawls actual Google search results to find loigiahay URLs with article IDs
 */
class GoogleCrawlerService {
  constructor() {
    this.browser = null;
    this.searchCache = new Map();
  }

  /**
   * Initialize browser
   */
  async initBrowser() {
    if (!this.browser) {
      console.log('🚀 Launching browser for Google search...');
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--window-size=1920,1080'
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
   * Build search query
   */
  buildSearchQuery(grade, unit, lessonType) {
    // Map lesson types to common keywords found in URLs
    const lessonKeywords = {
      'getting_started': 'getting started',
      'language': 'language',
      'reading': 'reading skills 1', // Often "Skills 1" is reading
      'speaking': 'speaking skills 2', 
      'listening': 'listening',
      'writing': 'writing',
      'communication_culture': 'communication culture clil',
      'looking_back': 'looking back'
    };

    const keywords = lessonKeywords[lessonType] || lessonType.replace(/_/g, ' ');
    
    // Build a more specific search query
    // Order matters: site first, then specific terms
    return `site:loigiaihay.com "global success" "${grade}" "unit ${unit}" ${keywords}`;
  }

  /**
   * Extract URLs from Google search page
   */
  async extractGoogleResults(page) {
    return await page.evaluate(() => {
      const results = [];
      
      // Google search results are in divs with class 'g'
      const searchResults = document.querySelectorAll('div.g');
      
      searchResults.forEach((result, index) => {
        // Find the main link
        const linkElement = result.querySelector('a[href]');
        if (!linkElement) return;
        
        const url = linkElement.href;
        
        // Skip if not a loigiaihay URL
        if (!url.includes('loigiaihay.com')) return;
        
        // Get the title and snippet for ranking
        const titleElement = result.querySelector('h3');
        const snippetElement = result.querySelector('.VwiC3b, .s, .st');
        
        const title = titleElement ? titleElement.innerText : '';
        const snippet = snippetElement ? snippetElement.innerText : '';
        
        results.push({
          url: url,
          title: title,
          snippet: snippet,
          position: index + 1
        });
      });
      
      return results;
    });
  }

  /**
   * Rank and filter search results
   */
  rankResults(results, grade, unit, lessonType) {
    const scoredResults = results.map(result => {
      let score = 0;
      const urlLower = result.url.toLowerCase();
      const titleLower = result.title.toLowerCase();
      const snippetLower = result.snippet.toLowerCase();
      
      // Check for article ID pattern (most reliable indicator)
      if (urlLower.match(/-[ac]\d+\.html$/)) {
        score += 10; // URLs with article IDs are valid
      }
      
      // Check grade match
      if (titleLower.includes(`${grade}`) || urlLower.includes(`-${grade}-`)) {
        score += 5;
      }
      
      // Check unit match
      if (titleLower.includes(`unit ${unit}`) || urlLower.includes(`unit-${unit}-`)) {
        score += 5;
      }
      
      // Check lesson type keywords
      const lessonKeywordMap = {
        'getting_started': ['getting started', 'getting-started'],
        'language': ['language', 'a closer look', 'closer-look'],
        'reading': ['reading', 'skills 1', 'skills-1'],
        'speaking': ['speaking', 'skills 2', 'skills-2'],
        'listening': ['listening'],
        'writing': ['writing'],
        'communication_culture': ['communication', 'culture', 'clil'],
        'looking_back': ['looking back', 'looking-back']
      };
      
      const keywords = lessonKeywordMap[lessonType] || [lessonType];
      keywords.forEach(keyword => {
        if (titleLower.includes(keyword) || urlLower.includes(keyword.replace(' ', '-'))) {
          score += 3;
        }
      });
      
      // Check for "global success" or "kết nối tri thức"
      if (titleLower.includes('global success') || titleLower.includes('kết nối')) {
        score += 2;
      }
      
      // Penalize SBT (workbook) results if not specifically requested
      if ((titleLower.includes('sbt') || snippetLower.includes('sách bài tập')) && 
          !lessonType.includes('workbook')) {
        score -= 3;
      }
      
      // Bonus for exact position (first results are often more relevant)
      score += (10 - result.position) * 0.5;
      
      return { ...result, score };
    });
    
    // Sort by score
    scoredResults.sort((a, b) => b.score - a.score);
    
    return scoredResults;
  }

  /**
   * Search Google and get the best matching URL
   */
  async searchGoogle(grade, unit, lessonType) {
    const cacheKey = `${grade}-${unit}-${lessonType}`;
    
    // Check cache
    if (this.searchCache.has(cacheKey)) {
      console.log('📦 Using cached search result');
      return this.searchCache.get(cacheKey);
    }
    
    const query = this.buildSearchQuery(grade, unit, lessonType);
    console.log('🔍 Google search query:', query);
    
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Navigate to Google
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`;
      console.log('🌐 Navigating to:', searchUrl);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for search results (try multiple selectors)
      try {
        await page.waitForSelector('div.g', { timeout: 5000 });
      } catch (e) {
        // Try alternative selectors
        console.log('⚠️ Primary selector failed, trying alternatives...');
        await page.waitForSelector('#search', { timeout: 5000 });
      }
      
      // Handle cookie consent if it appears
      try {
        const acceptButton = await page.$('button:has-text("Accept all"), button:has-text("I agree")');
        if (acceptButton) {
          await acceptButton.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {
        // No cookie banner, continue
      }
      
      // Extract all search results
      const results = await this.extractGoogleResults(page);
      console.log(`📋 Found ${results.length} loigiaihay results`);
      
      await page.close();
      
      if (results.length === 0) {
        console.log('❌ No results found');
        return null;
      }
      
      // Rank and filter results
      const rankedResults = this.rankResults(results, grade, unit, lessonType);
      
      // Log top 3 results for debugging
      console.log('🏆 Top results:');
      rankedResults.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i + 1}. [Score: ${r.score.toFixed(1)}] ${r.title}`);
        console.log(`     ${r.url}`);
      });
      
      // Get the best result
      const bestResult = rankedResults[0];
      
      if (bestResult && bestResult.score > 5) {
        console.log('✅ Selected:', bestResult.url);
        this.searchCache.set(cacheKey, bestResult.url);
        return bestResult.url;
      } else {
        console.log('⚠️ No high-confidence match found');
        // Return best match anyway if score is reasonable
        if (bestResult && bestResult.score > 0) {
          this.searchCache.set(cacheKey, bestResult.url);
          return bestResult.url;
        }
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Google search failed:', error.message);
      
      // Try alternative search with fetch (simpler but less reliable)
      return this.searchWithFetch(query);
    }
  }

  /**
   * Fallback search using fetch
   */
  async searchWithFetch(query) {
    try {
      console.log('🔄 Trying fallback search with fetch...');
      
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const html = await response.text();
      
      // Extract URLs with article IDs
      const urlPattern = /href="(https?:\/\/loigiaihay\.com\/[^"]*-[ac]\d+\.html)"/g;
      const matches = [...html.matchAll(urlPattern)];
      
      if (matches.length > 0) {
        const url = matches[0][1];
        console.log('✅ Found via fetch:', url);
        return url;
      }
    } catch (error) {
      console.error('Fetch search also failed:', error.message);
    }
    
    return null;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.searchCache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.searchCache.size,
      entries: Array.from(this.searchCache.keys())
    };
  }
}

// Export singleton
export const googleCrawlerService = new GoogleCrawlerService();
export default googleCrawlerService;