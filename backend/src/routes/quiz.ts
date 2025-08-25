import { Router, Request, Response } from 'express';
import quizService from '../services/quizService';

const router = Router();

// Prepare a quiz session
router.post('/prepare', async (req: Request, res: Response) => {
  try {
    const { grade, period, date } = req.body;
    
    if (!period && !date) {
      return res.status(400).json({
        error: 'Either period or date must be provided'
      });
    }

    const result = await quizService.prepareQuizSession(grade, period, date);
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      vocabCount: result.vocabCount,
      quizUrl: `/vocabulary-quiz-enhanced.html?session=${result.sessionId}`
    });
  } catch (error) {
    console.error('Error preparing quiz:', error);
    res.status(500).json({
      error: 'Failed to prepare quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Prepare quiz from specific lesson
router.post('/prepare-lesson', async (req: Request, res: Response) => {
  try {
    const { grade, book, unit, lesson } = req.body;
    
    if (!grade || !book || !unit || !lesson) {
      return res.status(400).json({
        error: 'Grade, book, unit, and lesson are required'
      });
    }

    const result = await quizService.prepareQuizFromLesson(
      parseInt(grade),
      book,
      parseInt(unit),
      lesson
    );
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      vocabCount: result.vocabCount,
      quizUrl: `/vocabulary-quiz-enhanced.html?session=${result.sessionId}`
    });
  } catch (error) {
    console.error('Error preparing lesson quiz:', error);
    res.status(500).json({
      error: 'Failed to prepare lesson quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get quiz session data
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = quizService.getQuizSession(sessionId);
    
    if (!session) {
      return res.status(404).json({
        error: 'Quiz session not found'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error getting quiz session:', error);
    res.status(500).json({
      error: 'Failed to get quiz session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Save quiz results
router.post('/results/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const results = req.body;
    
    const success = quizService.saveQuizResults(sessionId, results);
    
    if (!success) {
      return res.status(404).json({
        error: 'Quiz session not found'
      });
    }

    res.json({
      success: true,
      message: 'Results saved successfully'
    });
  } catch (error) {
    console.error('Error saving quiz results:', error);
    res.status(500).json({
      error: 'Failed to save quiz results',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recent quiz sessions
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const sessions = quizService.getRecentSessions(limit);
    
    res.json({
      success: true,
      count: sessions.length,
      data: sessions.map(s => ({
        id: s.id,
        grade: s.grade,
        period: s.period,
        date: s.date,
        vocabCount: s.metadata.vocabCount,
        source: s.metadata.source,
        createdAt: s.metadata.createdAt,
        resultsCount: s.results?.length || 0
      }))
    });
  } catch (error) {
    console.error('Error getting recent sessions:', error);
    res.status(500).json({
      error: 'Failed to get recent sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Quick prepare endpoints for common scenarios
router.post('/quick/today/:grade?', async (req: Request, res: Response) => {
  try {
    const grade = req.params.grade ? parseInt(req.params.grade) : undefined;
    const result = await quizService.prepareQuizSession(grade, 'today');
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      vocabCount: result.vocabCount,
      quizUrl: `/vocabulary-quiz-enhanced.html?session=${result.sessionId}`
    });
  } catch (error) {
    console.error('Error preparing today quiz:', error);
    res.status(500).json({
      error: 'Failed to prepare today quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/quick/this-week/:grade', async (req: Request, res: Response) => {
  try {
    const grade = parseInt(req.params.grade);
    const result = await quizService.prepareQuizSession(grade, 'this-week');
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      vocabCount: result.vocabCount,
      quizUrl: `/vocabulary-quiz-enhanced.html?session=${result.sessionId}`
    });
  } catch (error) {
    console.error('Error preparing this week quiz:', error);
    res.status(500).json({
      error: 'Failed to prepare this week quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/quick/last-week/:grade', async (req: Request, res: Response) => {
  try {
    const grade = parseInt(req.params.grade);
    const result = await quizService.prepareQuizSession(grade, 'last-week');
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      vocabCount: result.vocabCount,
      quizUrl: `/vocabulary-quiz-enhanced.html?session=${result.sessionId}`
    });
  } catch (error) {
    console.error('Error preparing last week quiz:', error);
    res.status(500).json({
      error: 'Failed to prepare last week quiz',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;