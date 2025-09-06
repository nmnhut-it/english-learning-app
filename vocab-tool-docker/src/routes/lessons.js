const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const GeminiService = require('../services/gemini');

const router = express.Router();
const gemini = new GeminiService();

// Create a new lesson
router.post('/', [
  body('title').notEmpty().trim().isLength({ min: 1, max: 200 }),
  body('content').notEmpty().trim().isLength({ min: 10 }),
  body('grade').optional().isInt({ min: 1, max: 12 }),
  body('unit').optional().isInt({ min: 1, max: 20 })
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { title, content, grade, unit } = req.body;
    const lessonId = uuidv4();

    // Optionally analyze lesson content with Gemini
    let lessonAnalysis = null;
    try {
      lessonAnalysis = await gemini.analyzeLessonContent(content);
    } catch (error) {
      console.warn('Could not analyze lesson content:', error.message);
    }

    // Create lesson in database
    const lesson = {
      id: lessonId,
      title,
      grade: grade || (lessonAnalysis?.suggestedGrade !== 'Unknown' ? parseInt(lessonAnalysis.suggestedGrade) : null),
      unit,
      content
    };

    await req.db.createLesson(lesson);

    res.json({
      success: true,
      lesson: {
        id: lessonId,
        title,
        grade: lesson.grade,
        unit,
        studentUrl: `/lesson/${lessonId}`,
        analysis: lessonAnalysis
      },
      message: 'Lesson created successfully'
    });

  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ 
      error: 'Failed to create lesson',
      message: error.message
    });
  }
});

// Get all lessons (for teacher dashboard)
router.get('/', async (req, res) => {
  try {
    const lessons = await req.db.getAllLessons();
    
    // Get stats for each lesson
    const lessonsWithStats = await Promise.all(
      lessons.map(async (lesson) => {
        try {
          const stats = await req.db.getLessonStats(lesson.id);
          return { ...lesson, stats };
        } catch (error) {
          return { ...lesson, stats: null };
        }
      })
    );

    res.json({
      success: true,
      lessons: lessonsWithStats
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lessons',
      message: error.message
    });
  }
});

// Get specific lesson (for student access)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await req.db.getLesson(id);

    if (!lesson) {
      return res.status(404).json({ 
        error: 'Lesson not found' 
      });
    }

    res.json({
      success: true,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        grade: lesson.grade,
        unit: lesson.unit,
        content: lesson.content,
        created_at: lesson.created_at
      }
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lesson',
      message: error.message
    });
  }
});

// Update lesson
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().trim().isLength({ min: 10 }),
  body('grade').optional().isInt({ min: 1, max: 12 }),
  body('unit').optional().isInt({ min: 1, max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if lesson exists
    const existingLesson = await req.db.getLesson(id);
    if (!existingLesson) {
      return res.status(404).json({ 
        error: 'Lesson not found' 
      });
    }

    // Update lesson
    const updatedRows = await req.db.updateLesson(id, updates);
    
    if (updatedRows === 0) {
      return res.status(404).json({ 
        error: 'Lesson not found or no changes made' 
      });
    }

    res.json({
      success: true,
      message: 'Lesson updated successfully'
    });

  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ 
      error: 'Failed to update lesson',
      message: error.message
    });
  }
});

// Delete lesson (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRows = await req.db.deleteLesson(id);
    
    if (deletedRows === 0) {
      return res.status(404).json({ 
        error: 'Lesson not found' 
      });
    }

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ 
      error: 'Failed to delete lesson',
      message: error.message
    });
  }
});

// Get lesson statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if lesson exists
    const lesson = await req.db.getLesson(id);
    if (!lesson) {
      return res.status(404).json({ 
        error: 'Lesson not found' 
      });
    }

    const stats = await req.db.getLessonStats(id);
    const selectionStats = await req.db.getWordSelectionStats(id);
    const vocabulary = await req.db.getLessonVocabulary(id);
    const sessions = await req.db.getLessonSessions(id);

    res.json({
      success: true,
      stats: {
        ...stats,
        wordSelections: selectionStats,
        vocabularyEntries: vocabulary.length,
        latestVocabulary: vocabulary.slice(-10), // Last 10 entries
        recentSessions: sessions.slice(0, 5) // Last 5 sessions
      }
    });
  } catch (error) {
    console.error('Error fetching lesson stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lesson statistics',
      message: error.message
    });
  }
});

module.exports = router;