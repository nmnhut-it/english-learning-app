import googleIt from 'google-it';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Proper Search Service using google-it library
 * More reliable than puppeteer scraping
 */
class ProperSearchService {
  constructor() {
    this.searchCache = new Map();
    
    // Lesson type mappings
    this.lessonTypeMap = {
      'getting_started': ['getting started', 'getting-started'],
      'language': ['language', 'a closer look 1', 'closer-look-1'],
      'reading': ['reading', 'skills 1', 'skills-1'],
      'speaking': ['speaking', 'skills 2', 'skills-2'],
      'listening': ['listening'],
      'writing': ['writing'],
      'communication_culture': ['communication', 'culture', 'clil', 'communication-and-culture'],
      'looking_back': ['looking back', 'looking-back']
    };
  }

  /**
   * Build optimized search query
   */
  buildSearchQuery(grade, unit, lessonType) {
    const lessonKeywords = this.lessonTypeMap[lessonType] || [lessonType.replace(/_/g, ' ')];
    
    // Build query with site restriction
    const baseQuery = `site:loigiaihay.com "tiếng anh ${grade}" "unit ${unit}" global success`;
    
    // Add lesson type keywords
    const fullQuery = `${baseQuery} ${lessonKeywords[0]}`;
    
    return fullQuery;
  }

  /**
   * Search using google-it library
   */
  async searchWithGoogleIt(query) {
    try {
      console.log('🔍 Searching with google-it:', query);
      
      const options = {
        query: query,
        limit: 10,
        'no-display': true, // Don't open browser
        'disable-safe-search': true
      };
      
      const results = await googleIt(options);
      
      return results;
    } catch (error) {
      console.error('google-it search failed:', error.message);
      return [];
    }
  }

  /**
   * Alternative: Use custom Google search with axios
   */
  async searchWithAxios(query) {
    try {
      console.log('🔍 Searching with axios:', query);
      
      // Use Google's JSON API (undocumented but works)
      const searchUrl = `https://www.google.com/search`;
      const params = {
        q: query,
        num: 20,
        hl: 'vi' // Vietnamese results
      };
      
      const response = await axios.get(searchUrl, {
        params,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'
        }
      });
      
      const $ = cheerio.load(response.data);
      const results = [];
      
      // Extract search results
      $('div.g').each((index, element) => {
        const $element = $(element);
        const $link = $element.find('a[href]').first();
        const $title = $element.find('h3').first();
        const $snippet = $element.find('.VwiC3b, .s, .st').first();
        
        const href = $link.attr('href');
        
        // Filter for loigiaihay URLs with article IDs
        if (href && href.includes('loigiaihay.com') && 
            (href.includes('-a') || href.includes('-c')) && 
            href.endsWith('.html')) {
          
          results.push({
            link: href,
            title: $title.text() || '',
            snippet: $snippet.text() || ''
          });
        }
      });
      
      return results;
      
    } catch (error) {
      console.error('Axios search failed:', error.message);
      return [];
    }
  }

  /**
   * Score and rank results based on relevance
   */
  scoreResults(results, grade, unit, lessonType) {
    const lessonKeywords = this.lessonTypeMap[lessonType] || [lessonType];
    
    return results.map(result => {
      let score = 0;
      const url = (result.link || result.url || '').toLowerCase();
      const title = (result.title || '').toLowerCase();
      const snippet = (result.snippet || '').toLowerCase();
      
      // Check for article ID (required)
      if (url.match(/[-\/][ac]\d+\.html$/)) {
        score += 20;
      } else {
        score -= 10; // Penalize URLs without article IDs
      }
      
      // Check grade match (critical)
      if (title.includes(`anh ${grade}`) || url.includes(`anh-${grade}-`)) {
        score += 15;
      }
      if (title.includes(`lớp ${grade}`) || snippet.includes(`grade ${grade}`)) {
        score += 5;
      }
      
      // Check unit match (critical)
      if (title.includes(`unit ${unit}`) || url.includes(`unit-${unit}-`)) {
        score += 15;
      }
      
      // Check lesson type match
      lessonKeywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase().replace(' ', '-');
        if (title.includes(keyword) || url.includes(keywordLower)) {
          score += 10;
        }
        if (snippet.includes(keyword)) {
          score += 3;
        }
      });
      
      // Check for "Global Success" or "Kết nối tri thức"
      if (title.includes('global success') || title.includes('kết nối')) {
        score += 5;
      }
      
      // Penalize workbook (SBT) unless specifically requested
      if ((title.includes('sbt') || snippet.includes('sách bài tập')) && 
          !lessonType.includes('workbook')) {
        score -= 10;
      }
      
      // Penalize if it's clearly wrong grade
      for (let g = 1; g <= 12; g++) {
        if (g !== grade && 
            (title.includes(`anh ${g} `) || url.includes(`anh-${g}-`))) {
          score -= 20;
        }
      }
      
      return { ...result, score };
    });
  }

  /**
   * Main search function
   */
  async findLoigiahayUrl(grade, unit, lessonType) {
    const cacheKey = `${grade}-${unit}-${lessonType}`;
    
    // Check cache
    if (this.searchCache.has(cacheKey)) {
      console.log('📦 Using cached result');
      return this.searchCache.get(cacheKey);
    }
    
    const query = this.buildSearchQuery(grade, unit, lessonType);
    
    // Try google-it first
    let results = await this.searchWithGoogleIt(query);
    
    // If no results, try axios method
    if (results.length === 0) {
      console.log('⚠️ google-it returned no results, trying axios...');
      results = await this.searchWithAxios(query);
    }
    
    if (results.length === 0) {
      console.log('❌ No search results found');
      return null;
    }
    
    // Score and rank results
    const scoredResults = this.scoreResults(results, grade, unit, lessonType);
    scoredResults.sort((a, b) => b.score - a.score);
    
    // Log top results for debugging
    console.log(`📊 Top ${Math.min(3, scoredResults.length)} results:`);
    scoredResults.slice(0, 3).forEach((r, i) => {
      const url = r.link || r.url;
      console.log(`  ${i + 1}. [Score: ${r.score}] ${r.title}`);
      console.log(`     ${url}`);
    });
    
    // Get best result
    const bestResult = scoredResults[0];
    const bestUrl = bestResult.link || bestResult.url;
    
    // Validate URL has article ID
    if (bestUrl && bestUrl.match(/[-\/][ac]\d+\.html$/)) {
      console.log('✅ Selected:', bestUrl);
      this.searchCache.set(cacheKey, bestUrl);
      return bestUrl;
    }
    
    // If best result doesn't have good score, try to extract any valid URL
    for (const result of scoredResults) {
      const url = result.link || result.url;
      if (url && url.includes('loigiaihay.com') && url.match(/[-\/][ac]\d+\.html$/)) {
        console.log('⚠️ Using fallback result:', url);
        this.searchCache.set(cacheKey, url);
        return url;
      }
    }
    
    console.log('❌ No valid URL found with article ID');
    return null;
  }

  /**
   * Batch search
   */
  async batchSearch(lessons) {
    const results = [];
    
    for (const lesson of lessons) {
      const url = await this.findLoigiahayUrl(lesson.grade, lesson.unit, lesson.lessonType);
      
      results.push({
        ...lesson,
        url,
        found: !!url
      });
      
      // Small delay between searches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
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
export const properSearchService = new ProperSearchService();
export default properSearchService;