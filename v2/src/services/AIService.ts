/**
 * Simple AI Service supporting both Claude and Gemini APIs
 * Handles vocabulary extraction and content processing
 */

interface AIConfig {
  provider: 'claude' | 'gemini' | 'none';
  apiKey?: string;
  model?: string;
}

export class AIService {
  private config: AIConfig;

  constructor() {
    // Load config from localStorage
    this.config = this.loadConfig();
  }

  /**
   * Load AI configuration from localStorage
   */
  private loadConfig(): AIConfig {
    const saved = localStorage.getItem('ai_config');
    if (saved) {
      return JSON.parse(saved);
    }
    return { provider: 'none' };
  }

  /**
   * Save AI configuration
   */
  public saveConfig(config: AIConfig): void {
    this.config = config;
    localStorage.setItem('ai_config', JSON.stringify(config));
  }

  /**
   * Check if AI is configured
   */
  public isConfigured(): boolean {
    return this.config.provider !== 'none' && !!this.config.apiKey;
  }

  /**
   * Process content with AI (Claude or Gemini)
   */
  public async processContent(
    content: string,
    grade: number,
    unit: number,
    lesson: string
  ): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('AI not configured. Please add API key in settings.');
    }

    const prompt = this.buildPrompt(content, grade, unit, lesson);

    switch (this.config.provider) {
      case 'claude':
        return this.processWithClaude(prompt);
      case 'gemini':
        return this.processWithGemini(prompt);
      default:
        throw new Error('Invalid AI provider');
    }
  }

  /**
   * Build prompt for AI processing
   */
  private buildPrompt(
    content: string,
    grade: number,
    unit: number,
    lesson: string
  ): string {
    return `Extract vocabulary and exercises from this English learning content.
    Grade: ${grade}
    Unit: ${unit}
    Lesson: ${lesson}
    
    Content:
    ${content}
    
    Return JSON with:
    {
      "vocabulary": [
        {
          "word": "word",
          "pronunciation": "/pronunciation/",
          "definition": "definition",
          "translation": "Vietnamese translation",
          "part_of_speech": "noun/verb/etc",
          "examples": ["example 1", "example 2"]
        }
      ],
      "exercises": [
        {
          "type": "multiple_choice",
          "question": "question text",
          "options": ["A", "B", "C", "D"],
          "correct": "A",
          "explanation": "why this is correct"
        }
      ]
    }`;
  }

  /**
   * Process with Claude API
   */
  private async processWithClaude(prompt: string): Promise<any> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-haiku-20240307',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      // Try to parse JSON from response
      try {
        return JSON.parse(content);
      } catch {
        // If not valid JSON, return raw content
        return { raw: content, processed: false };
      }
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * Process with Gemini API
   */
  private async processWithGemini(prompt: string): Promise<any> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      
      // Try to parse JSON from response
      try {
        return JSON.parse(content);
      } catch {
        // If not valid JSON, return raw content
        return { raw: content, processed: false };
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  /**
   * Extract vocabulary only (simpler processing)
   */
  public async extractVocabulary(content: string): Promise<any[]> {
    if (!this.isConfigured()) {
      // Fallback to simple extraction without AI
      return this.simpleVocabularyExtraction(content);
    }

    const prompt = `Extract vocabulary words from this content. 
    Return only a JSON array of vocabulary items.
    Content: ${content}`;

    try {
      const result = await this.processContent(prompt, 0, 0, '');
      return Array.isArray(result) ? result : result.vocabulary || [];
    } catch (error) {
      console.error('AI extraction failed, using simple extraction:', error);
      return this.simpleVocabularyExtraction(content);
    }
  }

  /**
   * Simple vocabulary extraction without AI
   */
  private simpleVocabularyExtraction(content: string): any[] {
    // Basic pattern matching for vocabulary
    const vocabPattern = /\*\*([\w\s]+)\*\*\s*\/([^\/]+)\//g;
    const matches = content.matchAll(vocabPattern);
    const vocabulary = [];

    for (const match of matches) {
      vocabulary.push({
        word: match[1].trim(),
        pronunciation: match[2].trim(),
        definition: '',
        translation: '',
        part_of_speech: 'unknown'
      });
    }

    return vocabulary;
  }
}

// Export singleton
export const aiService = new AIService();