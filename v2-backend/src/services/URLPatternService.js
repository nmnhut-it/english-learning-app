import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * URL Pattern Service
 * Manages a database of known URL patterns for loigiaihay.com
 * Provides fallback when API quota is exhausted
 */
class URLPatternService {
  constructor() {
    this.patternDatabase = new Map();
    this.databaseFile = path.join(__dirname, '../../cache/url-patterns.json');
    
    // Known verified patterns (from successful crawls)
    this.knownPatterns = {
      // Grade 7 patterns
      7: {
        1: {
          'getting_started': 'https://loigiaihay.com/tieng-anh-7-unit-1-getting-started-a103296.html',
          'language': 'https://loigiaihay.com/tieng-anh-7-unit-1-a-closer-look-1-a103298.html',
          'reading': 'https://loigiaihay.com/tieng-anh-7-unit-1-skills-1-a103302.html',
          'speaking': 'https://loigiaihay.com/tieng-anh-7-unit-1-skills-2-a103303.html'
        }
      },
      
      // Grade 10 patterns
      10: {
        1: {
          'getting_started': 'https://loigiaihay.com/tieng-anh-10-unit-1-getting-started-a103425.html',
          'language': 'https://loigiaihay.com/tieng-anh-10-unit-1-language-a103426.html',
          'reading': 'https://loigiaihay.com/tieng-anh-10-unit-1-reading-a103427.html'
        }
      },
      
      // Grade 11 patterns (from your testing)
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
        },
        5: {
          'speaking': 'https://loigiaihay.com/tieng-anh-11-unit-5-speaking-a135508.html' // From user's example
        }
      },
      
      // Grade 12 patterns
      12: {
        1: {
          'getting_started': 'https://loigiaihay.com/tieng-anh-12-unit-1-getting-started-a165284.html',
          'language': 'https://loigiaihay.com/tieng-anh-12-unit-1-language-a165286.html'
        }
      }
    };
    
    // Lesson type URL mappings
    this.lessonTypeUrlMap = {
      'getting_started': ['getting-started'],
      'language': ['language', 'a-closer-look-1', 'closer-look-1'],
      'reading': ['reading', 'skills-1'],
      'speaking': ['speaking', 'skills-2'],
      'listening': ['listening'],
      'writing': ['writing'],
      'communication_culture': ['communication-and-culture', 'communication-and-culture-clil', 'clil'],
      'looking_back': ['looking-back', 'project']
    };
    
    // Load database on initialization
    this.loadDatabase();
  }

  /**
   * Load pattern database from disk
   */
  async loadDatabase() {
    try {
      const dbDir = path.dirname(this.databaseFile);
      await fs.mkdir(dbDir, { recursive: true });
      
      const data = await fs.readFile(this.databaseFile, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Merge loaded patterns with known patterns
      Object.entries(parsed.patterns || {}).forEach(([key, value]) => {
        this.patternDatabase.set(key, value);
      });
      
      console.log(`📚 Loaded ${this.patternDatabase.size} URL patterns`);
    } catch (error) {
      // Database doesn't exist yet, initialize with known patterns
      this.initializeWithKnownPatterns();
      console.log('📚 Initialized URL pattern database');
    }
  }

  /**
   * Initialize database with known patterns
   */
  initializeWithKnownPatterns() {
    Object.entries(this.knownPatterns).forEach(([grade, units]) => {
      Object.entries(units).forEach(([unit, lessons]) => {
        Object.entries(lessons).forEach(([lessonType, url]) => {
          const key = `${grade}-${unit}-${lessonType}`;
          this.patternDatabase.set(key, {
            url,
            verified: true,
            source: 'known',
            addedAt: new Date().toISOString()
          });
        });
      });
    });
  }

  /**
   * Save database to disk
   */
  async saveDatabase() {
    try {
      const data = {
        patterns: Object.fromEntries(this.patternDatabase),
        savedAt: new Date().toISOString(),
        totalPatterns: this.patternDatabase.size
      };
      
      await fs.writeFile(this.databaseFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save pattern database:', error.message);
    }
  }

  /**
   * Add a new URL pattern
   */
  async addPattern(grade, unit, lessonType, url, verified = false) {
    const key = `${grade}-${unit}-${lessonType}`;
    
    // Validate URL has article ID
    if (!url.match(/[-\/][ac]\d+\.html$/)) {
      console.warn('⚠️ URL does not have valid article ID:', url);
      return false;
    }
    
    this.patternDatabase.set(key, {
      url,
      verified,
      source: verified ? 'crawled' : 'discovered',
      addedAt: new Date().toISOString()
    });
    
    await this.saveDatabase();
    console.log(`✅ Added pattern: ${key} -> ${url}`);
    return true;
  }

  /**
   * Get URL from pattern database
   */
  getUrl(grade, unit, lessonType) {
    const key = `${grade}-${unit}-${lessonType}`;
    const pattern = this.patternDatabase.get(key);
    
    if (pattern) {
      console.log(`📚 Found URL in pattern database: ${pattern.url}`);
      return pattern.url;
    }
    
    return null;
  }

  /**
   * Try to infer URL pattern
   */
  inferUrl(grade, unit, lessonType) {
    // Try to find similar patterns for the same grade
    const gradePatterns = [];
    
    this.patternDatabase.forEach((value, key) => {
      const [g, u, lt] = key.split('-');
      if (g === String(grade) && lt === lessonType) {
        gradePatterns.push({
          unit: parseInt(u),
          url: value.url,
          articleId: this.extractArticleId(value.url)
        });
      }
    });
    
    if (gradePatterns.length >= 2) {
      // Try to infer pattern from existing URLs
      gradePatterns.sort((a, b) => a.unit - b.unit);
      
      // Check if article IDs follow a pattern
      const idDiffs = [];
      for (let i = 1; i < gradePatterns.length; i++) {
        const diff = gradePatterns[i].articleId - gradePatterns[i-1].articleId;
        const unitDiff = gradePatterns[i].unit - gradePatterns[i-1].unit;
        idDiffs.push(diff / unitDiff);
      }
      
      // If differences are consistent, we might have a pattern
      const avgDiff = idDiffs.reduce((a, b) => a + b, 0) / idDiffs.length;
      const isConsistent = idDiffs.every(d => Math.abs(d - avgDiff) < 10);
      
      if (isConsistent && gradePatterns[0]) {
        const baseUrl = gradePatterns[0].url;
        const baseId = gradePatterns[0].articleId;
        const baseUnit = gradePatterns[0].unit;
        
        // Calculate expected article ID
        const expectedId = Math.round(baseId + (unit - baseUnit) * avgDiff);
        
        // Build URL with inferred ID
        const inferredUrl = baseUrl.replace(/-[ac]\d+\.html$/, `-a${expectedId}.html`);
        
        console.log(`🔮 Inferred URL pattern: ${inferredUrl}`);
        return inferredUrl;
      }
    }
    
    return null;
  }

  /**
   * Extract article ID from URL
   */
  extractArticleId(url) {
    const match = url.match(/[-\/][ac](\d+)\.html$/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Find URL using multiple strategies
   */
  async findUrl(grade, unit, lessonType) {
    // Strategy 1: Check pattern database
    let url = this.getUrl(grade, unit, lessonType);
    if (url) return url;
    
    // Strategy 2: Try to infer from patterns
    url = this.inferUrl(grade, unit, lessonType);
    if (url) {
      console.log('⚠️ Using inferred URL (may not be accurate)');
      return url;
    }
    
    // Strategy 3: Build a guess URL (least reliable)
    const lessonUrlParts = this.lessonTypeUrlMap[lessonType] || [lessonType.replace(/_/g, '-')];
    const guessUrl = `https://loigiaihay.com/tieng-anh-${grade}-unit-${unit}-${lessonUrlParts[0]}.html`;
    
    console.log('⚠️ No pattern found, returning guess URL (likely invalid):', guessUrl);
    return null; // Don't return guess URLs as they won't work without article ID
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      totalPatterns: this.patternDatabase.size,
      byGrade: {},
      byLessonType: {},
      verified: 0,
      unverified: 0
    };
    
    this.patternDatabase.forEach((value, key) => {
      const [grade, unit, lessonType] = key.split('-');
      
      // Count by grade
      stats.byGrade[grade] = (stats.byGrade[grade] || 0) + 1;
      
      // Count by lesson type
      stats.byLessonType[lessonType] = (stats.byLessonType[lessonType] || 0) + 1;
      
      // Count verified vs unverified
      if (value.verified) {
        stats.verified++;
      } else {
        stats.unverified++;
      }
    });
    
    return stats;
  }

  /**
   * Export patterns for backup
   */
  async exportPatterns() {
    const exportData = {
      patterns: Object.fromEntries(this.patternDatabase),
      exportedAt: new Date().toISOString(),
      stats: this.getStats()
    };
    
    const exportFile = path.join(__dirname, '../../cache/url-patterns-export.json');
    await fs.writeFile(exportFile, JSON.stringify(exportData, null, 2));
    
    console.log(`📤 Exported ${this.patternDatabase.size} patterns to ${exportFile}`);
    return exportFile;
  }

  /**
   * Clear database
   */
  async clearDatabase() {
    this.patternDatabase.clear();
    this.initializeWithKnownPatterns(); // Keep known patterns
    await this.saveDatabase();
    console.log('🗑️ Pattern database cleared (kept known patterns)');
  }
}

// Export singleton
export const urlPatternService = new URLPatternService();
export default urlPatternService;