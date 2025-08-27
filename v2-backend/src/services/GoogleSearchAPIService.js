import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Google Custom Search API Service
 * Uses official Google API for legitimate search with proper authentication
 * Requires API key and Search Engine ID from Google Cloud Console
 */
class GoogleSearchAPIService {
  constructor() {
    // API credentials will be loaded when needed
    this.apiKey = null;
    this.searchEngineId = null;
    
    // Cache for search results
    this.searchCache = new Map();
    this.cacheFile = path.join(__dirname, '../../cache/search-cache.json');
    
    // Quota tracking
    this.dailyQuota = 100; // Free tier limit
    this.queriesUsedToday = 0;
    this.lastResetDate = new Date().toDateString();
    
    // Lesson type mappings for search optimization - made more specific to avoid math confusion
    this.lessonTypeMap = {
      'getting_started': ['getting started', 'getting-started'],
      'language': ['language', 'a closer look 1', 'closer-look-1'],
      'reading': ['reading', 'skills 1', 'skills-1'],
      'speaking': ['speaking', 'skills 2', 'skills-2'],
      'listening': ['listening'],
      'writing': ['writing'],
      'communication_culture': ['communication and culture', 'communication-and-culture', 'clil'],
      'looking_back': ['looking back', 'looking-back']
    };
    
    // Load cache on initialization
    this.loadCache();
  }

  /**
   * Load credentials from environment
   */
  loadCredentials() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || '';
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
  }

  /**
   * Initialize API credentials
   */
  async initialize() {
    // Load credentials from environment
    this.loadCredentials();
    
    // Check for API credentials
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('⚠️ Google Search API credentials not configured');
      console.log('Please set the following environment variables:');
      console.log('  GOOGLE_SEARCH_API_KEY: Your Google Cloud API key');
      console.log('  GOOGLE_SEARCH_ENGINE_ID: Your Custom Search Engine ID');
      console.log('');
      console.log('To get these credentials:');
      console.log('1. Go to https://console.cloud.google.com');
      console.log('2. Enable Custom Search API');
      console.log('3. Create credentials (API key)');
      console.log('4. Create a Custom Search Engine at https://cse.google.com');
      console.log('5. Configure it to search loigiaihay.com');
      return false;
    }
    
    console.log('✅ Google Search API configured');
    console.log(`📊 Daily quota: ${this.dailyQuota - this.queriesUsedToday} queries remaining`);
    return true;
  }

  /**
   * Load cache from disk
   */
  async loadCache() {
    try {
      const cacheDir = path.dirname(this.cacheFile);
      await fs.mkdir(cacheDir, { recursive: true });
      
      const cacheData = await fs.readFile(this.cacheFile, 'utf-8');
      const parsed = JSON.parse(cacheData);
      
      // Load cache entries
      this.searchCache = new Map(Object.entries(parsed.cache || {}));
      
      // Load quota tracking
      if (parsed.quotaTracking) {
        this.queriesUsedToday = parsed.quotaTracking.queriesUsedToday || 0;
        this.lastResetDate = parsed.quotaTracking.lastResetDate || new Date().toDateString();
        
        // Reset quota if it's a new day
        const today = new Date().toDateString();
        if (this.lastResetDate !== today) {
          this.queriesUsedToday = 0;
          this.lastResetDate = today;
        }
      }
      
      console.log(`📦 Loaded ${this.searchCache.size} cached searches`);
    } catch (error) {
      // Cache doesn't exist yet, that's okay
      console.log('📦 No cache found, starting fresh');
    }
  }

  /**
   * Save cache to disk
   */
  async saveCache() {
    try {
      const cacheData = {
        cache: Object.fromEntries(this.searchCache),
        quotaTracking: {
          queriesUsedToday: this.queriesUsedToday,
          lastResetDate: this.lastResetDate
        },
        savedAt: new Date().toISOString()
      };
      
      await fs.writeFile(this.cacheFile, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.error('Failed to save cache:', error.message);
    }
  }

  /**
   * Check if API quota is available
   */
  checkQuota() {
    // Reset quota if it's a new day
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.queriesUsedToday = 0;
      this.lastResetDate = today;
    }
    
    return this.queriesUsedToday < this.dailyQuota;
  }

  /**
   * Build optimized search query
   */
  buildSearchQuery(grade, unit, lessonType) {
    const lessonKeywords = this.lessonTypeMap[lessonType] || [lessonType.replace(/_/g, ' ')];
    
    // Build highly specific query for loigiaihay.com English content
    // Include multiple English-specific terms to avoid math content
    const queries = [
      `site:loigiaihay.com "tiếng anh ${grade}" "unit ${unit}" "${lessonKeywords[0]}" "global success" -toán -hóa -lý -sinh`,
      `site:loigiaihay.com "tiếng anh ${grade}" "unit ${unit}" "${lessonKeywords[0]}" "kết nối tri thức" -toán -hóa -lý -sinh`,
      `site:loigiaihay.com "tiếng anh ${grade}" "unit ${unit}" "${lessonKeywords[0]}" english -math -toán`,
      `site:loigiaihay.com "tiếng anh ${grade}" "unit ${unit}" ${lessonKeywords[0]} english`
    ];
    
    return queries[0]; // Start with most specific
  }

  /**
   * Search using Google Custom Search API
   */
  async searchWithAPI(query) {
    // Ensure credentials are loaded
    if (!this.apiKey || !this.searchEngineId) {
      this.loadCredentials();
    }
    
    if (!this.apiKey || !this.searchEngineId) {
      throw new Error('Google Search API not configured');
    }
    
    if (!this.checkQuota()) {
      throw new Error(`Daily quota exceeded (${this.dailyQuota} queries/day). Resets at midnight.`);
    }
    
    console.log('🔍 Searching with Google Custom Search API:', query);
    
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('cx', this.searchEngineId);
    url.searchParams.append('q', query);
    url.searchParams.append('num', '10'); // Get 10 results
    
    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'API request failed');
      }
      
      // Increment quota usage
      this.queriesUsedToday++;
      await this.saveCache();
      
      console.log(`✅ Found ${data.items?.length || 0} results`);
      console.log(`📊 Quota used today: ${this.queriesUsedToday}/${this.dailyQuota}`);
      
      return data.items || [];
      
    } catch (error) {
      console.error('❌ Google Search API error:', error.message);
      throw error;
    }
  }

  /**
   * Score and rank search results
   */
  scoreResults(results, grade, unit, lessonType) {
    const lessonKeywords = this.lessonTypeMap[lessonType] || [lessonType];
    
    return results.map(result => {
      let score = 0;
      const url = (result.link || '').toLowerCase();
      const title = (result.title || '').toLowerCase();
      const snippet = (result.snippet || '').toLowerCase();
      
      // Critical: Check for article ID pattern (required for valid URLs)
      if (url.match(/[-\/][ac]\d+\.html$/)) {
        score += 20; // Strong indicator of valid content page
      }
      
      // Check grade match
      if (title.includes(`anh ${grade}`) || title.includes(`grade ${grade}`)) {
        score += 10;
      }
      if (url.includes(`anh-${grade}-`) || url.includes(`grade-${grade}-`)) {
        score += 8;
      }
      
      // Check unit match
      if (title.includes(`unit ${unit}`) || url.includes(`unit-${unit}`)) {
        score += 10;
      }
      
      // Check lesson type match
      lessonKeywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (title.includes(keywordLower)) score += 8;
        if (url.includes(keywordLower.replace(' ', '-'))) score += 6;
        if (snippet.includes(keywordLower)) score += 3;
      });
      
      // Check for textbook names
      if (title.includes('global success') || title.includes('kết nối')) {
        score += 5;
      }
      
      // Penalize workbook (SBT) unless specifically requested
      if ((title.includes('sbt') || snippet.includes('sách bài tập')) && 
          !lessonType.includes('workbook')) {
        score -= 15;
      }
      
      // Penalize if it's wrong grade
      for (let g = 6; g <= 12; g++) {
        if (g !== grade && 
            (title.includes(`anh ${g} `) || url.includes(`anh-${g}-`))) {
          score -= 20;
        }
      }
      
      return {
        ...result,
        url: result.link,
        score
      };
    });
  }

  /**
   * Main search function
   */
  async findLoigiahayUrl(grade, unit, lessonType) {
    const cacheKey = `${grade}-${unit}-${lessonType}`;
    
    // Check cache first
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      console.log('📦 Using cached result:', cached.url);
      return cached.url;
    }
    
    // Check if API is configured
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('⚠️ Google Search API not configured, cannot search');
      return null;
    }
    
    try {
      const lessonKeywords = this.lessonTypeMap[lessonType] || [lessonType.replace(/_/g, ' ')];
      
      // Try multiple query variations to avoid math content
      const queries = [
        `site:loigiaihay.com "tiếng anh ${grade}" "unit ${unit}" "${lessonKeywords[0]}" "global success" -toán -hóa -lý -sinh`,
        `site:loigiaihay.com "tiếng anh ${grade}" "unit ${unit}" "${lessonKeywords[0]}" "kết nối tri thức" -toán -hóa -lý -sinh`,
        `site:loigiaihay.com "tiếng anh ${grade}" "unit ${unit}" "${lessonKeywords[0]}" english -math -toán`,
        `site:loigiaihay.com "tiếng anh ${grade}" "unit ${unit}" ${lessonKeywords[0]} english`
      ];
      
      let bestScoredResults = [];
      let queryUsed = '';
      
      // Try each query until we find good English content
      for (const query of queries) {
        console.log('🔍 Trying query:', query);
        const results = await this.searchWithAPI(query);
        
        if (results.length === 0) continue;
        
        const scoredResults = this.scoreResults(results, grade, unit, lessonType);
        scoredResults.sort((a, b) => b.score - a.score);
        
        // Check if we found good English content (reject math content)
        const hasGoodEnglishContent = scoredResults.some(result => {
          const title = (result.title || '').toLowerCase();
          const url = (result.url || '').toLowerCase();
          
          // Reject if it contains math indicators
          const mathIndicators = ['toán', 'math', 'hóa', 'chemistry', 'lý', 'physics', 'sinh', 'biology'];
          const hasMathContent = mathIndicators.some(indicator => 
            title.includes(indicator) || url.includes(indicator)
          );
          
          // Accept if it has English indicators
          const englishIndicators = ['tiếng anh', 'english', 'global success', 'kết nối tri thức'];
          const hasEnglishContent = englishIndicators.some(indicator => 
            title.includes(indicator) || url.includes(indicator)
          );
          
          return hasEnglishContent && !hasMathContent && result.score >= 10;
        });
        
        if (hasGoodEnglishContent) {
          bestScoredResults = scoredResults;
          queryUsed = query;
          break;
        }
      }
      
      const scoredResults = bestScoredResults;
      
      if (scoredResults.length === 0) {
        console.log('❌ No good English content found after trying all queries');
        return null;
      }
      
      console.log(`📊 Using query: ${queryUsed}`);
      console.log(`📊 Top ${Math.min(3, scoredResults.length)} results:`);
      scoredResults.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i + 1}. [Score: ${r.score}] ${r.title}`);
        console.log(`     ${r.url}`);
      });
      
      // Get best result with minimum score threshold
      const bestResult = scoredResults[0];
      if (bestResult && bestResult.score >= 10) {
        console.log('✅ Selected:', bestResult.url);
        
        // Cache the result
        this.searchCache.set(cacheKey, {
          url: bestResult.url,
          title: bestResult.title,
          score: bestResult.score,
          cachedAt: new Date().toISOString()
        });
        await this.saveCache();
        
        return bestResult.url;
      }
      
      // Try fallback if score is too low
      for (const result of scoredResults) {
        if (result.url && result.url.includes('loigiaihay.com') && 
            result.url.match(/[-\/][ac]\d+\.html$/)) {
          console.log('⚠️ Using lower-confidence result:', result.url);
          
          this.searchCache.set(cacheKey, {
            url: result.url,
            title: result.title,
            score: result.score,
            cachedAt: new Date().toISOString()
          });
          await this.saveCache();
          
          return result.url;
        }
      }
      
      console.log('❌ No valid URL found with article ID');
      return null;
      
    } catch (error) {
      console.error('Search failed:', error.message);
      return null;
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    // Ensure credentials are loaded
    if (!this.apiKey && !this.searchEngineId) {
      this.loadCredentials();
    }
    
    return {
      configured: !!(this.apiKey && this.searchEngineId),
      cacheSize: this.searchCache.size,
      quotaUsed: this.queriesUsedToday,
      quotaRemaining: this.dailyQuota - this.queriesUsedToday,
      quotaResetDate: this.lastResetDate
    };
  }

  /**
   * Clear cache
   */
  async clearCache() {
    this.searchCache.clear();
    await this.saveCache();
    console.log('🗑️ Cache cleared');
  }
}

// Export singleton
export const googleSearchAPIService = new GoogleSearchAPIService();
export default googleSearchAPIService;