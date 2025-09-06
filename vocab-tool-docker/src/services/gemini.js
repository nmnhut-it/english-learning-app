const axios = require('axios');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    if (!this.apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
    }
  }

  async processVocabularyWithContext(words, lessonContext, metadata = {}) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const { grade, unit, title } = metadata;

    // Build context-aware prompt
    const prompt = `You are an English teacher creating vocabulary definitions for students. The vocabulary words are taken from this lesson context:

LESSON CONTEXT:
Grade: ${grade || 'N/A'}
Unit: ${unit || 'N/A'}
Title: ${title || 'N/A'}

LESSON CONTENT:
${lessonContext}

VOCABULARY WORDS TO PROCESS:
${words.join(', ')}

Please provide definitions for each word that are RELEVANT TO THIS LESSON CONTEXT. Return the response in this EXACT JSON format:

{
  "vocabularyEntries": [
    {
      "word": "example_word",
      "contextSentence": "sentence from the lesson containing this word",
      "definition": "meaning relevant to this lesson context",
      "ipaPronunciation": "/ˈeksæmpəl/",
      "partOfSpeech": "noun",
      "vietnameseTranslation": "từ ví dụ",
      "lessonRelevance": "why this word is important in this lesson"
    }
  ]
}

REQUIREMENTS:
- Definitions must be appropriate for Grade ${grade || '6-12'} level
- Use British English IPA pronunciations
- Vietnamese translations should be contextually appropriate
- Context sentences should come from or relate to the lesson content
- Part of speech: noun, verb, adjective, adverb, preposition, conjunction, interjection
- For phrasal verbs or idioms, treat as complete units
- Ensure all responses are suitable for Vietnamese English learners

Words to process: ${words.join(', ')}`;

    try {
      console.log(`🤖 Processing ${words.length} words with Gemini AI...`);
      
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE"
            }
          ]
        }
      );

      if (!response.data.candidates || !response.data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }

      const rawResponse = response.data.candidates[0].content.parts[0].text;
      console.log('🤖 Raw Gemini response received');

      // Parse JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(rawResponse);
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON response:', rawResponse);
        throw new Error('Failed to parse Gemini response as JSON');
      }

      // Validate response structure
      if (!parsedResponse.vocabularyEntries || !Array.isArray(parsedResponse.vocabularyEntries)) {
        throw new Error('Invalid response structure from Gemini');
      }

      console.log(`✅ Successfully processed ${parsedResponse.vocabularyEntries.length} vocabulary entries`);
      
      return {
        success: true,
        vocabularyEntries: parsedResponse.vocabularyEntries,
        rawResponse: rawResponse,
        processedCount: parsedResponse.vocabularyEntries.length,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Gemini API Error:', error.message);
      
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid request to Gemini API. Please check your input.');
      } else if (error.response?.status === 403) {
        throw new Error('Gemini API key invalid or insufficient permissions.');
      }
      
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }

  // Generate lesson summary for better context understanding
  async analyzeLessonContent(lessonContent) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `Analyze this English lesson content and provide a brief summary for vocabulary processing context:

LESSON CONTENT:
${lessonContent}

Please provide a JSON response with:
{
  "summary": "Brief description of the lesson topic and main themes",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "suggestedGrade": "estimated grade level (6-12)",
  "lessonType": "estimated lesson type (dialogue, reading, grammar, etc.)"
}`;

    try {
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 1024,
            responseMimeType: "application/json"
          }
        }
      );

      const rawResponse = response.data.candidates[0].content.parts[0].text;
      return JSON.parse(rawResponse);

    } catch (error) {
      console.error('Error analyzing lesson content:', error.message);
      return {
        summary: "Unable to analyze lesson content",
        keyTopics: [],
        suggestedGrade: "Unknown",
        lessonType: "Unknown"
      };
    }
  }

  // Health check for API key validation
  async healthCheck() {
    if (!this.apiKey) {
      return { status: 'error', message: 'API key not configured' };
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: 'Hello, respond with "API working" in JSON format: {"status": "working"}'
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 50,
            responseMimeType: "application/json"
          }
        }
      );

      return { status: 'healthy', message: 'Gemini API is accessible' };
    } catch (error) {
      return { 
        status: 'error', 
        message: `API check failed: ${error.message}`,
        statusCode: error.response?.status 
      };
    }
  }
}

module.exports = GeminiService;