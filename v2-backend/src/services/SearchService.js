import fetch from 'node-fetch';
import { getJson } from 'serpapi';

/**
 * Search Service
 * Uses multiple search methods to find loigiahay.com URLs
 */
class SearchService {
  constructor() {
    this.searchCache = new Map();
    
    // Lesson type mappings for URL construction
    this.lessonTypeMap = {
      'getting_started': 'getting-started',
      'language': 'language',
      'reading': 'reading', 
      'speaking': 'speaking',
      'listening': 'listening',
      'writing': 'writing',
      'communication_culture': 'communication-and-culture-clil',
      'looking_back': 'looking-back'
    };
  }

  /**
   * Build search query
   */
  buildSearchQuery(grade, unit, lessonType) {
    const lessonKeywords = this.lessonTypeMap[lessonType] || lessonType.replace(/_/g, ' ');
    return `site:loigiaihay.com "tiếng anh ${grade}" "unit ${unit}" "${lessonKeywords}"`;
  }

  /**
   * Method 1: Use SerpApi for Google Search (if API key available)
   */
  async searchWithSerpApi(query) {
    if (!process.env.SERPAPI_KEY) {
      return null;
    }

    try {
      console.log('🔍 Searching with SerpApi:', query);
      
      const response = await getJson({
        engine: "google",
        api_key: process.env.SERPAPI_KEY,
        q: query,
        num: 10
      });

      if (response.organic_results && response.organic_results.length > 0) {
        // Find the best matching result
        for (const result of response.organic_results) {
          const url = result.link;
          // Check for proper loigiahay URL with article ID
          if (url && url.includes('loigiaihay.com') && url.includes('-a') && url.endsWith('.html')) {
            console.log('✅ Found via SerpApi:', url);
            return url;
          }
        }
      }
    } catch (error) {
      console.error('SerpApi search failed:', error.message);
    }

    return null;
  }

  /**
   * Method 2: Use DuckDuckGo Search (no API key needed)
   */
  async searchWithDuckDuckGo(query) {
    try {
      console.log('🔍 Searching with DuckDuckGo:', query);
      
      // DuckDuckGo HTML search
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const html = await response.text();
      
      // Extract URLs from DuckDuckGo results
      const urlPattern = /href="(https?:\/\/loigiaihay\.com\/[^"]*-a\d+\.html)"/g;
      const matches = [...html.matchAll(urlPattern)];
      
      if (matches.length > 0) {
        const url = matches[0][1];
        console.log('✅ Found via DuckDuckGo:', url);
        return url;
      }
    } catch (error) {
      console.error('DuckDuckGo search failed:', error.message);
    }

    return null;
  }

  /**
   * Method 3: Use Bing Search (simpler HTML parsing)
   */
  async searchWithBing(query) {
    try {
      console.log('🔍 Searching with Bing:', query);
      
      const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const html = await response.text();
      
      // Extract loigiahay URLs from Bing results
      const urlPattern = /href="(https?:\/\/loigiaihay\.com\/[^"]*-a\d+\.html)"/g;
      const matches = [...html.matchAll(urlPattern)];
      
      if (matches.length > 0) {
        const url = matches[0][1];
        console.log('✅ Found via Bing:', url);
        return url;
      }
    } catch (error) {
      console.error('Bing search failed:', error.message);
    }

    return null;
  }

  /**
   * Method 4: Direct URL construction with known patterns
   */
  async constructDirectUrl(grade, unit, lessonType) {
    console.log('🔧 Constructing direct URL...');
    
    // Known URL patterns for different grades
    const knownPatterns = {
      // Grade 11 patterns
      11: {
        1: {
          'getting_started': 'https://loigiaihay.com/tieng-anh-11-unit-1-getting-started-a135502.html',
          'language': 'https://loigiaihay.com/tieng-anh-11-unit-1-language-a135504.html',
          'reading': 'https://loigiaihay.com/tieng-anh-11-unit-1-reading-a135506.html',
          'speaking': 'https://loigiaihay.com/tieng-anh-11-unit-1-speaking-a135508.html',
          'listening': 'https://loigiaihay.com/tieng-anh-11-unit-1-listening-a135509.html',
          'writing': 'https://loigiaihay.com/tieng-anh-11-unit-1-writing-a135510.html',
          'communication_culture': 'https://loigiaihay.com/tieng-anh-11-unit-1-communication-and-culture-clil-a135511.html',
          'looking_back': 'https://loigiaihay.com/tieng-anh-11-unit-1-looking-back-a135512.html'
        }
      },
      // Grade 7 patterns (example)
      7: {
        1: {
          'getting_started': 'https://loigiaihay.com/tieng-anh-7-unit-1-getting-started-a103296.html',
          'language': 'https://loigiaihay.com/tieng-anh-7-unit-1-a-closer-look-1-a103298.html'
        }
      }
    };

    // Check if we have a known pattern
    if (knownPatterns[grade] && knownPatterns[grade][unit] && knownPatterns[grade][unit][lessonType]) {
      const url = knownPatterns[grade][unit][lessonType];
      console.log('✅ Using known URL pattern:', url);
      return url;
    }

    // Try to construct a URL based on patterns
    // Article IDs seem to follow patterns but are not predictable
    // This is a last resort and may not work
    const lessonUrlPart = this.lessonTypeMap[lessonType] || lessonType.replace(/_/g, '-');
    const guessUrl = `https://loigiaihay.com/tieng-anh-${grade}-unit-${unit}-${lessonUrlPart}-a999999.html`;
    
    console.log('⚠️ No known pattern, constructed guess:', guessUrl);
    return null; // Return null since guessed URLs likely won't work
  }

  /**
   * Main search function - tries multiple methods
   */
  async findLoigiahayUrl(grade, unit, lessonType) {
    const query = this.buildSearchQuery(grade, unit, lessonType);
    const cacheKey = `${grade}-${unit}-${lessonType}`;
    
    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      console.log('📦 Using cached URL');
      return this.searchCache.get(cacheKey);
    }

    let url = null;

    // Try Method 1: SerpApi (if configured)
    if (process.env.SERPAPI_KEY) {
      url = await this.searchWithSerpApi(query);
    }

    // Try Method 2: DuckDuckGo (free, no API needed)
    if (!url) {
      url = await this.searchWithDuckDuckGo(query);
    }

    // Try Method 3: Bing (backup)
    if (!url) {
      url = await this.searchWithBing(query);
    }

    // Try Method 4: Known patterns
    if (!url) {
      url = await this.constructDirectUrl(grade, unit, lessonType);
    }

    if (url) {
      // Validate the URL format
      if (url.includes('-a') && url.endsWith('.html')) {
        this.searchCache.set(cacheKey, url);
        return url;
      } else {
        console.warn('⚠️ URL found but format seems wrong:', url);
      }
    }

    console.error(`❌ Could not find URL for Grade ${grade}, Unit ${unit}, ${lessonType}`);
    return null;
  }

  /**
   * Batch search for multiple lessons
   */
  async batchSearch(lessons) {
    const results = [];
    
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
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.searchCache.clear();
    console.log('🗑️ Search cache cleared');
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

// Export singleton instance
export const searchService = new SearchService();
export default searchService;