import { Router, Request, Response } from 'express';
import translationService from '../services/translationService';

const router = Router();

// Get today's vocabulary
router.get('/today', async (req: Request, res: Response) => {
  try {
    const vocabulary = await translationService.getVocabularyToday();
    res.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      count: vocabulary.length,
      data: vocabulary
    });
  } catch (error) {
    console.error('Error getting today\'s vocabulary:', error);
    res.status(500).json({
      error: 'Failed to get today\'s vocabulary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get last week's vocabulary
router.get('/last-week', async (req: Request, res: Response) => {
  try {
    const vocabulary = await translationService.getVocabularyLastWeek();
    
    // Combine all vocabulary items
    const allVocab: any[] = [];
    const lessonInfo: any[] = [];
    
    vocabulary.forEach(export => {
      allVocab.push(...export.vocabulary);
      lessonInfo.push({
        date: export.metadata.date,
        grade: export.metadata.grade,
        unit: export.metadata.unit,
        lesson: export.metadata.lesson,
        count: export.vocabulary.length
      });
    });

    res.json({
      success: true,
      period: 'last-week',
      lessons: lessonInfo,
      totalWords: allVocab.length,
      data: vocabulary
    });
  } catch (error) {
    console.error('Error getting last week\'s vocabulary:', error);
    res.status(500).json({
      error: 'Failed to get last week\'s vocabulary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get vocabulary by specific date
router.get('/date/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const vocabulary = await translationService.getVocabularyByDate(date);
    res.json({
      success: true,
      date: date,
      count: vocabulary.length,
      data: vocabulary
    });
  } catch (error) {
    console.error('Error getting vocabulary by date:', error);
    res.status(500).json({
      error: 'Failed to get vocabulary by date',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get vocabulary by lesson (all accumulated vocabulary for a specific lesson)
router.get('/lesson/:grade/:book/:unit/:lesson', async (req: Request, res: Response) => {
  try {
    const { grade, book, unit, lesson } = req.params;
    
    const vocabulary = await translationService.getVocabularyByLesson(
      parseInt(grade),
      book,
      parseInt(unit),
      lesson
    );

    if (!vocabulary) {
      return res.status(404).json({
        error: 'No vocabulary found for this lesson'
      });
    }

    res.json({
      success: true,
      data: vocabulary
    });
  } catch (error) {
    console.error('Error getting lesson vocabulary:', error);
    res.status(500).json({
      error: 'Failed to get lesson vocabulary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get vocabulary by date AND grade
router.get('/date/:date/grade/:grade', async (req: Request, res: Response) => {
  try {
    const { date, grade } = req.params;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const vocabulary = await translationService.getVocabularyByDateAndGrade(date, parseInt(grade));
    
    // Combine all vocabulary items
    const allVocab: any[] = [];
    vocabulary.forEach(export => {
      allVocab.push(...export.vocabulary);
    });

    res.json({
      success: true,
      date: date,
      grade: parseInt(grade),
      lessonsCount: vocabulary.length,
      totalWords: allVocab.length,
      data: vocabulary
    });
  } catch (error) {
    console.error('Error getting vocabulary by date and grade:', error);
    res.status(500).json({
      error: 'Failed to get vocabulary by date and grade',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get this week's vocabulary for a specific grade
router.get('/this-week/grade/:grade', async (req: Request, res: Response) => {
  try {
    const { grade } = req.params;
    const vocabulary = await translationService.getVocabularyThisWeekByGrade(parseInt(grade));
    
    // Combine all vocabulary items and get unique lessons
    const allVocab: any[] = [];
    const lessons = new Set<string>();
    
    vocabulary.forEach(export => {
      allVocab.push(...export.vocabulary);
      lessons.add(`Unit ${export.metadata.unit} - ${export.metadata.lesson}`);
    });

    res.json({
      success: true,
      period: 'this-week',
      grade: parseInt(grade),
      lessonsCount: lessons.size,
      totalWords: allVocab.length,
      data: vocabulary
    });
  } catch (error) {
    console.error('Error getting this week\'s vocabulary by grade:', error);
    res.status(500).json({
      error: 'Failed to get this week\'s vocabulary by grade',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get this month's vocabulary for a specific grade
router.get('/this-month/grade/:grade', async (req: Request, res: Response) => {
  try {
    const { grade } = req.params;
    const vocabulary = await translationService.getVocabularyThisMonthByGrade(parseInt(grade));
    
    // Combine all vocabulary items and get unique lessons
    const allVocab: any[] = [];
    const lessons = new Set<string>();
    
    vocabulary.forEach(export => {
      allVocab.push(...export.vocabulary);
      lessons.add(`Unit ${export.metadata.unit} - ${export.metadata.lesson}`);
    });

    res.json({
      success: true,
      period: 'this-month',
      grade: parseInt(grade),
      lessonsCount: lessons.size,
      totalWords: allVocab.length,
      data: vocabulary
    });
  } catch (error) {
    console.error('Error getting this month\'s vocabulary by grade:', error);
    res.status(500).json({
      error: 'Failed to get this month\'s vocabulary by grade',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get vocabulary by date range (optionally filtered by grade)
router.post('/range', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, grade } = req.body;
    
    // Validate date formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    const vocabulary = await translationService.getVocabularyByDateRange(
      startDate, 
      endDate, 
      grade ? parseInt(grade) : undefined
    );
    
    // Combine all vocabulary items
    const allVocab: any[] = [];
    vocabulary.forEach(export => {
      allVocab.push(...export.vocabulary);
    });

    res.json({
      success: true,
      startDate: startDate,
      endDate: endDate,
      grade: grade ? parseInt(grade) : 'all',
      lessonsCount: vocabulary.length,
      totalWords: allVocab.length,
      data: vocabulary
    });
  } catch (error) {
    console.error('Error getting vocabulary by date range:', error);
    res.status(500).json({
      error: 'Failed to get vocabulary by date range',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get vocabulary for quiz format (compatible with existing quiz system)
router.get('/quiz-format/:grade/:book/:unit/:lesson', async (req: Request, res: Response) => {
  try {
    const { grade, book, unit, lesson } = req.params;
    
    const vocabulary = await translationService.getVocabularyByLesson(
      parseInt(grade),
      book,
      parseInt(unit),
      lesson
    );

    if (!vocabulary) {
      return res.status(404).json({
        error: 'No vocabulary found for this lesson'
      });
    }

    // Format for quiz compatibility
    const quizFormat = {
      metadata: {
        grade: parseInt(grade),
        unit: parseInt(unit),
        book: book,
        context: `${lesson} - Auto-extracted`,
        createdAt: new Date().toISOString(),
        totalWords: vocabulary.vocabulary.length
      },
      vocabulary: vocabulary.vocabulary
    };

    res.json({
      success: true,
      data: quizFormat
    });
  } catch (error) {
    console.error('Error getting quiz format vocabulary:', error);
    res.status(500).json({
      error: 'Failed to get quiz format vocabulary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;