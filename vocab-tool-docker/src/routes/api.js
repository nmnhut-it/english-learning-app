const express = require('express');
const GeminiService = require('../services/gemini');

const router = express.Router();
const gemini = new GeminiService();

// Health check endpoint with database and API status
router.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {}
  };

  // Check database connectivity
  try {
    await req.db.getAllLessons();
    healthCheck.services.database = { status: 'healthy' };
  } catch (error) {
    healthCheck.services.database = { 
      status: 'error', 
      message: error.message 
    };
    healthCheck.status = 'degraded';
  }

  // Check Gemini API
  const geminiHealth = await gemini.healthCheck();
  healthCheck.services.gemini = geminiHealth;
  
  if (geminiHealth.status === 'error') {
    healthCheck.status = 'degraded';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// Export lesson vocabulary in different formats
router.get('/export/:lessonId/:format', async (req, res) => {
  try {
    const { lessonId, format } = req.params;
    
    // Check if lesson exists
    const lesson = await req.db.getLesson(lessonId);
    if (!lesson) {
      return res.status(404).json({ 
        error: 'Lesson not found' 
      });
    }

    const vocabulary = await req.db.getLessonVocabulary(lessonId);
    const selectionStats = await req.db.getWordSelectionStats(lessonId);

    // Create export data
    const exportData = {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        grade: lesson.grade,
        unit: lesson.unit,
        created_at: lesson.created_at
      },
      vocabulary: vocabulary.map(entry => ({
        word: entry.word,
        definition: entry.definition,
        ipa: entry.ipa_pronunciation,
        partOfSpeech: entry.part_of_speech,
        vietnamese: entry.vietnamese_translation,
        contextSentence: entry.context_sentence,
        created_at: entry.created_at
      })),
      selectionStats: selectionStats,
      exportedAt: new Date().toISOString()
    };

    switch (format.toLowerCase()) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${lesson.title}-vocabulary.json"`);
        return res.json(exportData);

      case 'markdown':
        const markdown = generateMarkdown(exportData);
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="${lesson.title}-vocabulary.md"`);
        return res.send(markdown);

      case 'csv':
        const csv = generateCSV(exportData.vocabulary);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${lesson.title}-vocabulary.csv"`);
        return res.send(csv);

      default:
        return res.status(400).json({ 
          error: 'Invalid format. Supported formats: json, markdown, csv' 
        });
    }
  } catch (error) {
    console.error('Error exporting vocabulary:', error);
    res.status(500).json({ 
      error: 'Failed to export vocabulary',
      message: error.message
    });
  }
});

// Get aggregated statistics across all lessons
router.get('/stats/overview', async (req, res) => {
  try {
    const lessons = await req.db.getAllLessons();
    
    let totalVocabulary = 0;
    let totalStudents = 0;
    let totalSelections = 0;
    let gradeDistribution = {};
    
    const lessonsWithStats = await Promise.all(
      lessons.map(async (lesson) => {
        try {
          const stats = await req.db.getLessonStats(lesson.id);
          totalVocabulary += stats.vocabulary_count || 0;
          totalStudents += stats.unique_students || 0;
          totalSelections += stats.total_selections || 0;
          
          const grade = lesson.grade || 'Unknown';
          gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
          
          return { ...lesson, stats };
        } catch (error) {
          return { ...lesson, stats: null };
        }
      })
    );

    res.json({
      success: true,
      overview: {
        totalLessons: lessons.length,
        totalVocabulary,
        totalStudents,
        totalSelections,
        gradeDistribution
      },
      lessons: lessonsWithStats.slice(0, 10) // Latest 10 lessons
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch overview statistics',
      message: error.message
    });
  }
});

// Search vocabulary across all lessons
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters long' 
      });
    }

    // This is a simple implementation - in production, you might want to use full-text search
    const searchTerm = q.trim().toLowerCase();
    
    // Get all vocabulary entries (this could be optimized with proper search indexing)
    const lessons = await req.db.getAllLessons();
    const searchResults = [];
    
    for (const lesson of lessons.slice(0, 20)) { // Limit to recent lessons for performance
      try {
        const vocabulary = await req.db.getLessonVocabulary(lesson.id);
        const matches = vocabulary.filter(entry => 
          entry.word.toLowerCase().includes(searchTerm) ||
          entry.definition.toLowerCase().includes(searchTerm) ||
          (entry.vietnamese_translation && entry.vietnamese_translation.toLowerCase().includes(searchTerm))
        );
        
        matches.forEach(match => {
          searchResults.push({
            ...match,
            lesson: {
              id: lesson.id,
              title: lesson.title,
              grade: lesson.grade,
              unit: lesson.unit
            }
          });
        });
      } catch (error) {
        // Skip this lesson on error
        continue;
      }
    }

    // Sort by relevance (exact matches first, then partial matches)
    searchResults.sort((a, b) => {
      const aExact = a.word.toLowerCase() === searchTerm;
      const bExact = b.word.toLowerCase() === searchTerm;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    res.json({
      success: true,
      query: q,
      results: searchResults.slice(0, parseInt(limit)),
      total: searchResults.length
    });
  } catch (error) {
    console.error('Error searching vocabulary:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message
    });
  }
});

// Helper function to generate markdown export
function generateMarkdown(data) {
  const { lesson, vocabulary, selectionStats } = data;
  
  let markdown = `# ${lesson.title}\n\n`;
  markdown += `**Grade:** ${lesson.grade || 'N/A'} | **Unit:** ${lesson.unit || 'N/A'}\n`;
  markdown += `**Created:** ${new Date(lesson.created_at).toLocaleDateString()}\n\n`;
  markdown += `## Vocabulary (${vocabulary.length} words)\n\n`;
  
  vocabulary.forEach((entry, index) => {
    markdown += `### ${index + 1}. ${entry.word}\n\n`;
    markdown += `**Definition:** ${entry.definition}\n\n`;
    markdown += `**Part of Speech:** ${entry.partOfSpeech}\n\n`;
    markdown += `**IPA:** ${entry.ipa}\n\n`;
    if (entry.vietnamese) {
      markdown += `**Vietnamese:** ${entry.vietnamese}\n\n`;
    }
    if (entry.contextSentence) {
      markdown += `**Context:** ${entry.contextSentence}\n\n`;
    }
    markdown += `---\n\n`;
  });
  
  if (selectionStats.length > 0) {
    markdown += `## Popular Words\n\n`;
    selectionStats.slice(0, 10).forEach((stat, index) => {
      markdown += `${index + 1}. **${stat.word}** - Selected ${stat.selection_count} times\n`;
    });
    markdown += `\n`;
  }
  
  markdown += `*Exported on ${new Date().toLocaleString()}*\n`;
  
  return markdown;
}

// Helper function to generate CSV export
function generateCSV(vocabulary) {
  const headers = ['Word', 'Definition', 'IPA', 'Part of Speech', 'Vietnamese', 'Context'];
  let csv = headers.join(',') + '\n';
  
  vocabulary.forEach(entry => {
    const row = [
      `"${entry.word || ''}"`,
      `"${(entry.definition || '').replace(/"/g, '""')}"`,
      `"${entry.ipa || ''}"`,
      `"${entry.partOfSpeech || ''}"`,
      `"${(entry.vietnamese || '').replace(/"/g, '""')}"`,
      `"${(entry.contextSentence || '').replace(/"/g, '""')}"`
    ];
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

module.exports = router;