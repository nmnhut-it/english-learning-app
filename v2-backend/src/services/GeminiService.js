import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptLibrary } from './PromptLibrary.js';

/**
 * Gemini AI Service
 * Centralized service for all Gemini AI interactions
 */
class GeminiService {
  constructor() {
    this.client = null;
    this.model = null;
    this.isHealthy = false;
    this.initialized = false;
  }

  /**
   * Initialize Gemini client (lazy initialization)
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🔧 Initializing Gemini service...');
      console.log('🔧 GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);

      if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️ GEMINI_API_KEY not found in environment');
        this.initialized = true; // Mark as attempted
        return;
      }

      this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.client.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.isHealthy = true;
      this.initialized = true;
      
      console.log('✅ Gemini service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini service:', error.message);
      this.isHealthy = false;
      this.initialized = true;
    }
  }

  /**
   * Check if Gemini is available
   */
  isAvailable() {
    this.initialize(); // Lazy initialization
    return this.client !== null && this.model !== null && this.isHealthy;
  }

  /**
   * Health check - test actual API connectivity
   */
  async healthCheck() {
    this.initialize(); // Lazy initialization
    if (!this.isHealthy) {
      return false;
    }

    try {
      const result = await this.model.generateContent('Test health check');
      const response = result.response.text();
      return response && response.length > 0;
    } catch (error) {
      console.warn('Gemini health check failed:', error.message);
      this.isHealthy = false;
      return false;
    }
  }

  /**
   * Process content with Gemini AI using strict extraction
   */
  async processContent(sourceContent, grade, unit, lessonType, unitTitle) {
    this.initialize(); // Lazy initialization
    if (!this.isAvailable()) {
      throw new Error('Gemini service is not available');
    }

    // Clean the content first
    const cleanedContent = PromptLibrary.cleanContent(sourceContent);
    
    // Generate strict extraction prompt
    const prompt = PromptLibrary.generatePrompt(grade, lessonType, unitTitle, cleanedContent);

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();
      
      // Extract XML from response
      let xmlContent;
      try {
        // Look for XML in the response
        const xmlMatch = response.match(/<\?xml[\s\S]*?<\/lesson_content>/);
        if (xmlMatch) {
          xmlContent = xmlMatch[0];
        } else {
          // Try to find XML without declaration
          const contentMatch = response.match(/<lesson_content[\s\S]*?<\/lesson_content>/);
          if (contentMatch) {
            xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n${contentMatch[0]}`;
          } else {
            console.warn('No XML found in Gemini response, using fallback');
            xmlContent = this.generateFallbackXML(cleanedContent, lessonType, unitTitle, grade);
          }
        }
      } catch (parseError) {
        console.warn('Failed to extract XML from Gemini response:', parseError);
        xmlContent = this.generateFallbackXML(cleanedContent, lessonType, unitTitle, grade);
      }
      
      return {
        success: true,
        xmlContent: xmlContent,
        aiProvider: 'gemini',
        lessonType: lessonType,
        rawResponse: response
      };
      
    } catch (error) {
      console.error('Gemini content processing failed:', error);
      this.isHealthy = false;
      throw error;
    }
  }

  /**
   * Generate fallback XML when Gemini fails or returns invalid format
   */
  generateFallbackXML(sourceContent, lessonType, unitTitle, grade) {
    console.log('Generating fallback XML with strict extraction');
    
    // Extract vocabulary from bold text patterns
    const vocabulary = [];
    const boldPattern = /\*\*([\w\s]+)\*\*/g;
    let match;
    
    while ((match = boldPattern.exec(sourceContent)) !== null) {
      const word = match[1].trim();
      vocabulary.push(`
    <vocabulary_item id="${word.toLowerCase().replace(/\s+/g, '-')}">
      <word>${word}</word>
      <definition></definition>
      <translation lang="vi"></translation>
      <source_location>bold_text</source_location>
    </vocabulary_item>`);
    }
    
    // Look for dialogue patterns (Name: text)
    const dialoguePattern = /^([A-Z][a-z]+):\s*(.+)$/gm;
    const dialogues = [];
    const speakers = new Set();
    const turns = [];
    
    while ((match = dialoguePattern.exec(sourceContent)) !== null) {
      speakers.add(match[1]);
      turns.push(`        <turn speaker="${match[1]}">${match[2]}</turn>`);
    }
    
    let dialogueXML = '';
    if (turns.length > 0) {
      dialogueXML = `
  <dialogues>
    <dialogue id="dialogue-1">
      <participants>${Array.from(speakers).join(', ')}</participants>
      <transcript>
${turns.join('\n')}
      </transcript>
      <translation lang="vi" available="false">
      </translation>
    </dialogue>
  </dialogues>`;
    }
    
    // Look for exercises (Bài 1, Bài 2, etc.)
    const exercisePattern = /Bài (\d+)/g;
    const exercises = [];
    let exerciseCount = 0;
    
    while ((match = exercisePattern.exec(sourceContent)) !== null) {
      exerciseCount++;
      exercises.push(`
    <exercise id="bai-${match[1]}" type="unknown">
      <instruction>Exercise ${match[1]}</instruction>
      <instruction_vi></instruction_vi>
      <questions>
      </questions>
    </exercise>`);
    }
    
    // Generate the complete XML
    return `<?xml version="1.0" encoding="UTF-8"?>
<lesson_content type="${lessonType}" grade="${grade}" extraction_mode="fallback">
  <metadata>
    <extraction_timestamp>${new Date().toISOString()}</extraction_timestamp>
    <unit_title>${unitTitle}</unit_title>
    <fallback_reason>Gemini response invalid or unavailable</fallback_reason>
  </metadata>
  
  <vocabulary_bank>
${vocabulary.join('\n')}
  </vocabulary_bank>
${dialogueXML}
  <exercises>
${exercises.join('\n')}
  </exercises>
  
  <grammar_points>
  </grammar_points>
  
  <extraction_summary>
    <dialogues_found>${turns.length > 0}</dialogues_found>
    <exercises_found>${exerciseCount > 0}</exercises_found>
    <answers_found>false</answers_found>
    <vocabulary_count>${vocabulary.length}</vocabulary_count>
  </extraction_summary>
</lesson_content>`;
  }

  /**
   * Get service status
   */
  getStatus() {
    this.initialize(); // Lazy initialization
    return {
      available: this.isAvailable(),
      healthy: this.isHealthy,
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
      modelName: this.model ? 'gemini-1.5-flash' : null,
      lastHealthCheck: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;