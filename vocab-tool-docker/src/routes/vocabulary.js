const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const GeminiService = require('../services/gemini');

const router = express.Router();
const gemini = new GeminiService();

// Record student word selection
router.post('/select', [
  body('lessonId').notEmpty().isUUID(),
  body('words').isArray().notEmpty(),
  body('sessionId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { lessonId, words, sessionId } = req.body;
    const studentIp = req.ip || req.connection.remoteAddress;
    const studentSessionId = sessionId || uuidv4();

    // Check if lesson exists
    const lesson = await req.db.getLesson(lessonId);
    if (!lesson) {
      return res.status(404).json({ 
        error: 'Lesson not found' 
      });
    }

    // Record each word selection
    for (const word of words) {
      await req.db.recordStudentSelection(lessonId, word.trim(), studentIp, studentSessionId);
    }

    res.json({
      success: true,
      message: `Recorded ${words.length} word selections`,
      sessionId: studentSessionId
    });

  } catch (error) {
    console.error('Error recording word selection:', error);
    res.status(500).json({ 
      error: 'Failed to record word selection',
      message: error.message
    });
  }
});

// Process vocabulary with Gemini AI
router.post('/process', [
  body('lessonId').notEmpty().isUUID(),
  body('words').isArray().notEmpty(),
  body('sessionId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { lessonId, words, sessionId } = req.body;
    const processSessionId = uuidv4();

    // Get lesson content for context
    const lesson = await req.db.getLesson(lessonId);
    if (!lesson) {
      return res.status(404).json({ 
        error: 'Lesson not found' 
      });
    }

    // Filter and validate words
    const cleanWords = words
      .filter(word => word && typeof word === 'string')
      .map(word => word.trim())
      .filter(word => word.length > 0)
      .slice(0, 20); // Limit to 20 words per request

    if (cleanWords.length === 0) {
      return res.status(400).json({ 
        error: 'No valid words provided' 
      });
    }

    // Record selections if sessionId provided
    if (sessionId) {
      const studentIp = req.ip || req.connection.remoteAddress;
      for (const word of cleanWords) {
        await req.db.recordStudentSelection(lessonId, word, studentIp, sessionId);
      }
    }

    console.log(`🔄 Processing ${cleanWords.length} words for lesson ${lessonId}`);

    // Process with Gemini AI
    const geminiResult = await gemini.processVocabularyWithContext(
      cleanWords,
      lesson.content,
      {
        grade: lesson.grade,
        unit: lesson.unit,
        title: lesson.title
      }
    );

    if (!geminiResult.success) {
      throw new Error('Failed to process vocabulary with AI');
    }

    // Save vocabulary entries to database
    const savedEntries = [];
    for (const entry of geminiResult.vocabularyEntries) {
      try {
        const dbEntry = {
          lesson_id: lessonId,
          word: entry.word,
          context_sentence: entry.contextSentence,
          definition: entry.definition,
          ipa_pronunciation: entry.ipaPronunciation,
          part_of_speech: entry.partOfSpeech,
          vietnamese_translation: entry.vietnameseTranslation
        };
        
        const saved = await req.db.saveVocabularyEntry(dbEntry);
        savedEntries.push({ ...entry, id: saved.id });
      } catch (error) {
        console.warn(`Failed to save vocabulary entry for "${entry.word}":`, error.message);
      }
    }

    // Save processing session
    await req.db.saveVocabularySession({
      id: processSessionId,
      lesson_id: lessonId,
      words_processed: cleanWords,
      gemini_response: geminiResult.rawResponse,
      processed_count: savedEntries.length
    });

    console.log(`✅ Successfully processed and saved ${savedEntries.length} vocabulary entries`);

    res.json({
      success: true,
      vocabularyEntries: savedEntries,
      processedCount: savedEntries.length,
      sessionId: processSessionId,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        grade: lesson.grade,
        unit: lesson.unit
      }
    });

  } catch (error) {
    console.error('Error processing vocabulary:', error);
    
    // Handle specific Gemini API errors
    if (error.message.includes('Rate limit exceeded')) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Please wait a moment before processing more vocabulary.',
        retryAfter: 60
      });
    }

    res.status(500).json({ 
      error: 'Failed to process vocabulary',
      message: error.message
    });
  }
});

// Get lesson vocabulary
router.get('/lesson/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    // Check if lesson exists
    const lesson = await req.db.getLesson(lessonId);
    if (!lesson) {
      return res.status(404).json({ 
        error: 'Lesson not found' 
      });
    }

    const vocabulary = await req.db.getLessonVocabulary(lessonId);

    res.json({
      success: true,
      vocabulary,
      count: vocabulary.length,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        grade: lesson.grade,
        unit: lesson.unit
      }
    });
  } catch (error) {
    console.error('Error fetching lesson vocabulary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vocabulary',
      message: error.message
    });
  }
});

// Get word selection statistics for a lesson
router.get('/stats/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    // Check if lesson exists
    const lesson = await req.db.getLesson(lessonId);
    if (!lesson) {
      return res.status(404).json({ 
        error: 'Lesson not found' 
      });
    }

    const selectionStats = await req.db.getWordSelectionStats(lessonId);
    const lessonStats = await req.db.getLessonStats(lessonId);

    res.json({
      success: true,
      lessonStats,
      wordSelections: selectionStats,
      topWords: selectionStats.slice(0, 10), // Top 10 most selected words
      lesson: {
        id: lesson.id,
        title: lesson.title
      }
    });
  } catch (error) {
    console.error('Error fetching vocabulary stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vocabulary statistics',
      message: error.message
    });
  }
});

// Get processing sessions for a lesson
router.get('/sessions/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    // Check if lesson exists
    const lesson = await req.db.getLesson(lessonId);
    if (!lesson) {
      return res.status(404).json({ 
        error: 'Lesson not found' 
      });
    }

    const sessions = await req.db.getLessonSessions(lessonId);

    res.json({
      success: true,
      sessions,
      count: sessions.length,
      lesson: {
        id: lesson.id,
        title: lesson.title
      }
    });
  } catch (error) {
    console.error('Error fetching vocabulary sessions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vocabulary sessions',
      message: error.message
    });
  }
});

module.exports = router;