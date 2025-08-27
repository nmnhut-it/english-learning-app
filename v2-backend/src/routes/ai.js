import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { contentProcessingService } from '../services/ContentProcessingService.js';

const router = express.Router();

// Initialize AI clients
let geminiClient = null;

if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini client initialized');
} else {
  console.warn('⚠️  GEMINI_API_KEY not found in environment');
}

/**
 * POST /api/ai/process
 * Main AI processing endpoint - implements check-before-process logic
 */
router.post('/process', async (req, res) => {
  try {
    const { 
      sourceContent, 
      grade, 
      unit, 
      unitTitle, 
      lessonType, 
      contentSource = 'manual',
      aiProvider = 'gemini' 
    } = req.body;
    
    if (!sourceContent || !grade || !unit) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: sourceContent, grade, unit',
          code: 'MISSING_FIELDS'
        }
      });
    }
    
    console.log(`🤖 Processing content: Grade ${grade}, Unit ${unit}, Source: ${contentSource}`);
    
    const startTime = Date.now();
    
    // First check if content already exists and unchanged
    const checkResult = await contentProcessingService.processContent(sourceContent, {
      grade, unit, unitTitle, lessonType, contentSource
    });
    
    if (checkResult.action === 'loaded_from_disk') {
      return res.json(checkResult);
    }
    
    // Process with AI if needed
    let processedData;
    if (aiProvider === 'gemini' && geminiClient) {
      processedData = await processWithGemini(sourceContent, grade, unit, lessonType, unitTitle);
    } else {
      // Fallback to simple processing
      processedData = await processWithFallback(sourceContent, lessonType, unitTitle);
    }
    
    // Save processed content to disk
    const saveResult = await contentProcessingService.saveProcessedContent(
      grade, unit, processedData.xmlContent, sourceContent, {
        aiProvider: processedData.aiProvider,
        lessonType,
        unitTitle,
        contentSource,
        vocabularyCount: processedData.vocabulary?.length || 0
      }
    );
    
    const processingTime = Date.now() - startTime;
    
    res.json({
      success: true,
      action: 'processed_with_ai',
      message: 'Content processed and saved successfully',
      data: {
        ...processedData,
        ...saveResult,
        processingTime,
        grade: parseInt(grade),
        unit,
        lessonType,
        fromCache: false
      }
    });
    
  } catch (error) {
    console.error('❌ AI processing failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'AI processing failed',
        details: error.message,
        code: 'AI_PROCESSING_ERROR'
      }
    });
  }
});

/**
 * Process content with Gemini
 */
async function processWithGemini(sourceContent, grade, unit, lessonType, unitTitle) {
  console.log('🟢 Processing with Gemini...');
  
  const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `
Extract vocabulary and create structured learning content from this ${lessonType} lesson for Grade ${grade} students.

Unit Title: ${unitTitle}
Content Source: ${sourceContent}

Please extract:
1. Key vocabulary words with definitions and Vietnamese translations
2. Important phrases and collocations
3. Grammar points if any
4. Suggested exercises

Return as structured data focusing on vocabulary extraction for English learners at CEFR A1-A2 level.

Format the response as a JSON object with:
- vocabulary: array of {word, definition, translation, examples, cefr_level}
- grammar_points: array of grammar topics
- suggested_exercises: array of exercise ideas
- vocabulary_topics: array of thematic vocabulary categories
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Try to parse JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(response);
    } catch (parseError) {
      // If JSON parsing fails, create structured data from text
      parsedData = parseTextResponse(response, sourceContent);
    }
    
    return {
      ...parsedData,
      aiProvider: 'gemini',
      rawResponse: response,
      xmlContent: generateXMLFromData(parsedData, grade, unit, unitTitle, lessonType)
    };
  } catch (error) {
    console.error('Gemini processing error:', error);
    throw new Error(`Gemini processing failed: ${error.message}`);
  }
}

// Claude processing removed - focusing on Gemini integration

/**
 * Fallback processing without AI
 */
async function processWithFallback(sourceContent, lessonType, unitTitle) {
  console.log('⚪ Using fallback processing...');
  
  // Simple vocabulary extraction
  const vocabulary = [];
  const boldPattern = /\*\*([\w\s]+)\*\*/g;
  const matches = sourceContent.matchAll(boldPattern);
  
  for (const match of matches) {
    vocabulary.push({
      word: match[1],
      definition: '',
      translation: '',
      examples: [],
      cefr_level: 'A2'
    });
  }
  
  const fallbackData = {
    vocabulary,
    grammar_points: [],
    suggested_exercises: [],
    vocabulary_topics: []
  };
  
  return {
    ...fallbackData,
    aiProvider: 'fallback',
    rawResponse: 'Processed without AI',
    xmlContent: generateXMLFromData(fallbackData, 7, 'unit-01', unitTitle, lessonType)
  };
}

/**
 * Parse text response into structured data
 */
function parseTextResponse(responseText, sourceContent) {
  // Simple parsing logic for when JSON parsing fails
  return {
    vocabulary: extractVocabularyFromText(responseText, sourceContent),
    grammar_points: extractGrammarPoints(responseText),
    suggested_exercises: extractExercises(responseText),
    vocabulary_topics: extractTopics(responseText)
  };
}

function extractVocabularyFromText(responseText, sourceContent) {
  const vocabulary = [];
  // Look for vocabulary patterns in response
  const vocabPattern = /(?:vocabulary|word):\s*([^.]+)/gi;
  const matches = responseText.matchAll(vocabPattern);
  
  for (const match of matches) {
    vocabulary.push({
      word: match[1].trim(),
      definition: '',
      translation: '',
      examples: [],
      cefr_level: 'A2'
    });
  }
  
  return vocabulary;
}

function extractGrammarPoints(responseText) {
  const grammarPattern = /(?:grammar|tense):\s*([^.]+)/gi;
  const matches = responseText.matchAll(grammarPattern);
  return Array.from(matches, match => match[1].trim());
}

function extractExercises(responseText) {
  const exercisePattern = /(?:exercise|activity):\s*([^.]+)/gi;
  const matches = responseText.matchAll(exercisePattern);
  return Array.from(matches, match => match[1].trim());
}

function extractTopics(responseText) {
  const topicPattern = /(?:topic|theme):\s*([^.]+)/gi;
  const matches = responseText.matchAll(topicPattern);
  return Array.from(matches, match => match[1].trim());
}

/**
 * Generate XML content from processed data
 */
function generateXMLFromData(data, grade, unit, unitTitle, lessonType) {
  const unitId = unit.startsWith('unit-') ? unit : `unit-${String(unit).padStart(2, '0')}`;
  
  let vocabularyXML = '';
  if (data.vocabulary && data.vocabulary.length > 0) {
    vocabularyXML = data.vocabulary.map(vocab => `
    <vocabulary_item id="${vocab.word.toLowerCase().replace(/\s+/g, '-')}" cefr="${vocab.cefr_level || 'A2'}">
      <word>${vocab.word}</word>
      <pronunciation>
        <ipa></ipa>
        <audio_files></audio_files>
      </pronunciation>
      <definition>${vocab.definition || ''}</definition>
      <translation lang="vi">${vocab.translation || ''}</translation>
      <examples>
        ${(vocab.examples || []).map(ex => `<example>${ex}</example>`).join('\n        ')}
      </examples>
    </vocabulary_item>`).join('\n');
  }
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<unit id="${unitId}" title="${unitTitle}" order="${unit}">
  <metadata>
    <description>${lessonType} lesson for ${unitTitle}</description>
    <estimated_duration>45</estimated_duration>
    <processed_at>${new Date().toISOString()}</processed_at>
    <ai_provider>${data.aiProvider || 'fallback'}</ai_provider>
  </metadata>
  
  <vocabulary_bank>
    ${vocabularyXML}
  </vocabulary_bank>
  
  <sections>
    <section id="${lessonType}" title="${lessonType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}" order="1">
      <exercises>
        <!-- Exercises will be added based on lesson type -->
      </exercises>
    </section>
  </sections>
</unit>`;
  
  return xml;
}

export default router;