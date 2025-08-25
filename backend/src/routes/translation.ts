import { Router, Request, Response } from 'express';
import translationService from '../services/translationService';

const router = Router();

// Save a new translation
router.post('/save', async (req: Request, res: Response) => {
  try {
    const translation = req.body;
    
    if (!translation || !translation.metadata || !translation.originalText || !translation.analysis) {
      return res.status(400).json({ 
        error: 'Invalid translation data. Required fields: metadata, originalText, analysis' 
      });
    }

    const saved = await translationService.saveTranslation(translation);
    res.json({ 
      success: true, 
      data: saved,
      message: 'Translation saved successfully' 
    });
  } catch (error) {
    console.error('Error saving translation:', error);
    res.status(500).json({ 
      error: 'Failed to save translation',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get a specific translation by ID
router.get('/:grade/:book/:unit/:lesson/:id', async (req: Request, res: Response) => {
  try {
    const { grade, book, unit, lesson, id } = req.params;
    
    const translation = await translationService.getTranslation(
      id,
      parseInt(grade),
      book,
      parseInt(unit),
      lesson
    );

    if (!translation) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    res.json({ 
      success: true, 
      data: translation 
    });
  } catch (error) {
    console.error('Error getting translation:', error);
    res.status(500).json({ 
      error: 'Failed to get translation',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get all translations for a lesson
router.get('/:grade/:book/:unit/:lesson', async (req: Request, res: Response) => {
  try {
    const { grade, book, unit, lesson } = req.params;
    
    const translations = await translationService.getTranslationsByLesson(
      parseInt(grade),
      book,
      parseInt(unit),
      lesson
    );

    res.json({ 
      success: true, 
      data: translations,
      count: translations.length 
    });
  } catch (error) {
    console.error('Error getting translations:', error);
    res.status(500).json({ 
      error: 'Failed to get translations',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Search translations
router.post('/search', async (req: Request, res: Response) => {
  try {
    const query = req.body;
    const results = await translationService.searchTranslations(query);
    
    res.json({ 
      success: true, 
      data: results,
      count: results.length 
    });
  } catch (error) {
    console.error('Error searching translations:', error);
    res.status(500).json({ 
      error: 'Failed to search translations',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Update a translation (teacher notes, tags)
router.patch('/:grade/:book/:unit/:lesson/:id', async (req: Request, res: Response) => {
  try {
    const { grade, book, unit, lesson, id } = req.params;
    const updates = req.body;
    
    const updated = await translationService.updateTranslation(
      id,
      parseInt(grade),
      book,
      parseInt(unit),
      lesson,
      updates
    );

    if (!updated) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    res.json({ 
      success: true, 
      data: updated,
      message: 'Translation updated successfully' 
    });
  } catch (error) {
    console.error('Error updating translation:', error);
    res.status(500).json({ 
      error: 'Failed to update translation',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Delete a translation
router.delete('/:grade/:book/:unit/:lesson/:id', async (req: Request, res: Response) => {
  try {
    const { grade, book, unit, lesson, id } = req.params;
    
    const deleted = await translationService.deleteTranslation(
      id,
      parseInt(grade),
      book,
      parseInt(unit),
      lesson
    );

    if (!deleted) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    res.json({ 
      success: true, 
      message: 'Translation deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting translation:', error);
    res.status(500).json({ 
      error: 'Failed to delete translation',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get statistics
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const stats = await translationService.getStatistics();
    res.json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Export translations for a specific context
router.get('/export/:grade/:book/:unit?/:lesson?', async (req: Request, res: Response) => {
  try {
    const { grade, book, unit, lesson } = req.params;
    
    const query: any = {
      grade: parseInt(grade),
      book
    };
    
    if (unit) query.unit = parseInt(unit);
    if (lesson) query.lesson = lesson;
    
    const results = await translationService.searchTranslations(query);
    
    // Format for export
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        grade: query.grade,
        book: query.book,
        unit: query.unit,
        lesson: query.lesson,
        totalTranslations: results.length
      },
      translations: results
    };
    
    res.json({ 
      success: true, 
      data: exportData 
    });
  } catch (error) {
    console.error('Error exporting translations:', error);
    res.status(500).json({ 
      error: 'Failed to export translations',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;