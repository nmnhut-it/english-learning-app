/**
 * AI Service for V2 - Backend API integration
 * Handles content processing through V2 backend
 */

interface AIConfig {
  provider: 'gemini' | 'none';
  apiKey?: string;
  model?: string;
}

export class AIService {
  private config: AIConfig;
  private baseURL = '/api'; // Proxied to backend
  private isBackendConnected = false;

  constructor() {
    // Load config from localStorage
    this.config = this.loadConfig();
    this.testBackendConnection();
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
   * Test backend connection
   */
  private async testBackendConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/status/health`);
      const data = await response.json();
      this.isBackendConnected = data.success;
      
      if (this.isBackendConnected) {
        console.log('✅ Backend connection established');
      }
    } catch (error) {
      console.warn('⚠️ Backend not available:', error.message);
      this.isBackendConnected = false;
    }
  }

  /**
   * Check if AI is configured and backend is available
   */
  public isConfigured(): boolean {
    return this.isBackendConnected;
  }

  /**
   * Process content through backend API
   */
  public async processContent(
    content: string,
    grade: number,
    unit: number,
    lessonType: string,
    unitTitle: string,
    contentSource: string = 'manual'
  ): Promise<any> {
    if (!this.isBackendConnected) {
      throw new Error('Backend not available. Please check server connection.');
    }

    try {
      console.log(`🤖 Processing content via backend: Grade ${grade}, Unit ${unit}`);
      
      const response = await fetch(`${this.baseURL}/process/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceContent: content,
          grade,
          unit,
          unitTitle,
          lessonType,
          contentSource,
          aiProvider: 'gemini'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Backend error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Content processed successfully:`, result);
      
      return result;
    } catch (error) {
      console.error('Backend processing error:', error);
      throw error;
    }
  }

  /**
   * Get backend processing status
   */
  public async getProcessingStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/status/processing`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get processing status:', error);
      return null;
    }
  }

  /**
   * Get content overview
   */
  public async getContentOverview(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/status/overview`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get content overview:', error);
      return null;
    }
  }
}

// Export singleton
export const aiService = new AIService();