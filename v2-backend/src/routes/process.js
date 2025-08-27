import express from 'express';
import { contentProcessingService } from '../services/ContentProcessingService.js';
import { geminiService } from '../services/GeminiService.js';

const router = express.Router();

/**
 * POST /api/process/complete
 * Complete processing workflow: Check-before-process + AI + Save to disk
 */
router.post('/complete', async (req, res) => {
  try {
    const { 
      sourceContent, 
      grade, 
      unit, 
      unitTitle, 
      lessonType = 'getting_started', 
      contentSource = 'manual' 
    } = req.body;
    
    if (!sourceContent || !grade || !unit || !unitTitle) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: sourceContent, grade, unit, unitTitle',
          code: 'MISSING_FIELDS'
        }
      });
    }
    
    console.log(`🚀 Complete processing workflow: Grade ${grade}, Unit ${unit} (${lessonType})`);
    const startTime = Date.now();
    
    // STEP 1: Check if content already exists and unchanged (check-before-process)
    const checkResult = await contentProcessingService.processContent(sourceContent, {
      grade, unit, unitTitle, lessonType, contentSource
    });
    
    if (checkResult.action === 'loaded_from_disk') {
      console.log('💾 Content loaded from disk - no processing needed');
      return res.json({
        ...checkResult,
        processingTime: Date.now() - startTime
      });
    }
    
    // STEP 2: Process with AI (Gemini)
    console.log('🤖 Processing with Gemini AI...');
    let processedData;
    
    if (geminiService.isAvailable()) {
      try {
        const geminiResult = await geminiService.processContent(sourceContent, grade, unit, lessonType, unitTitle);
        
        // Gemini now returns XML directly
        processedData = {
          xmlContent: geminiResult.xmlContent,
          aiProvider: 'gemini',
          lessonType: geminiResult.lessonType,
          rawResponse: geminiResult.rawResponse
        };
        console.log('✅ Gemini processing completed successfully');
      } catch (aiError) {
        console.warn('❌ Gemini processing failed, using fallback:', aiError.message);
        processedData = await processWithFallback(sourceContent, grade, unit, lessonType, unitTitle);
      }
    } else {
      console.log('⚪ Gemini not available, using fallback processing');
      processedData = await processWithFallback(sourceContent, grade, unit, lessonType, unitTitle);
    }
    
    // STEP 3: Save to disk
    console.log('💾 Saving processed content to disk...');
    const saveResult = await contentProcessingService.saveProcessedContent(
      grade, unit, processedData.xmlContent, sourceContent, {
        aiProvider: processedData.aiProvider,
        lessonType,
        unitTitle,
        contentSource,
        vocabularyCount: processedData.vocabulary?.length || 0,
        processedAt: new Date().toISOString()
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
    console.error('❌ Complete processing failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Processing workflow failed',
        details: error.message,
        code: 'PROCESSING_WORKFLOW_ERROR'
      }
    });
  }
});


/**
 * Fallback processing without AI - returns XML format
 */
async function processWithFallback(sourceContent, grade, unit, lessonType, unitTitle) {
  console.log('⚪ Using fallback processing...');
  
  // Simple vocabulary extraction from bold text
  const vocabulary = [];
  const boldPattern = /\*\*([\w\s]+)\*\*/g;
  let match;
  
  while ((match = boldPattern.exec(sourceContent)) !== null) {
    const word = match[1].trim();
    vocabulary.push(`
    <vocabulary_item id="${word.toLowerCase().replace(/\s+/g, '-')}">
      <word>${escapeXML(word)}</word>
      <definition></definition>
      <translation lang="vi"></translation>
      <source_location>bold_text</source_location>
    </vocabulary_item>`);
  }
  
  // Look for dialogues
  const dialoguePattern = /^([A-Z][a-z]+):\s*(.+)$/gm;
  const speakers = new Set();
  const turns = [];
  
  while ((match = dialoguePattern.exec(sourceContent)) !== null) {
    speakers.add(match[1]);
    turns.push(`        <turn speaker="${escapeXML(match[1])}">${escapeXML(match[2])}</turn>`);
  }
  
  // Generate XML
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<lesson_content type="${lessonType}" grade="${grade}" extraction_mode="fallback">
  <metadata>
    <extraction_timestamp>${new Date().toISOString()}</extraction_timestamp>
    <unit_title>${escapeXML(unitTitle)}</unit_title>
    <fallback_reason>AI processing unavailable</fallback_reason>
  </metadata>
  
  <vocabulary_bank>
${vocabulary.join('\n')}
  </vocabulary_bank>
  
  ${turns.length > 0 ? `<dialogues>
    <dialogue id="dialogue-1">
      <participants>${Array.from(speakers).join(', ')}</participants>
      <transcript>
${turns.join('\n')}
      </transcript>
    </dialogue>
  </dialogues>` : ''}
  
  <exercises>
    <!-- No exercises extracted in fallback mode -->
  </exercises>
  
  <extraction_summary>
    <dialogues_found>${turns.length > 0}</dialogues_found>
    <exercises_found>false</exercises_found>
    <vocabulary_count>${vocabulary.length}</vocabulary_count>
  </extraction_summary>
</lesson_content>`;
  
  return {
    xmlContent,
    aiProvider: 'fallback',
    lessonType,
    rawResponse: 'Processed without AI using pattern extraction'
  };
}


/**
 * Generate XML content from processed data
 */
function generateXMLFromData(data, grade, unit, unitTitle, lessonType, sourceContent = '') {
  const unitId = unit.toString().startsWith('unit-') ? unit : `unit-${String(unit).padStart(2, '0')}`;
  
  let vocabularyXML = '';
  if (data.vocabulary && data.vocabulary.length > 0) {
    vocabularyXML = data.vocabulary.map(vocab => `
    <vocabulary_item id="${vocab.word.toLowerCase().replace(/\s+/g, '-')}" cefr="${vocab.cefr_level || 'A2'}">
      <word>${escapeXML(vocab.word)}</word>
      <pronunciation>
        <ipa></ipa>
        <audio_files></audio_files>
      </pronunciation>
      <definition>${escapeXML(vocab.definition || '')}</definition>
      <translation lang="vi">${escapeXML(vocab.translation || '')}</translation>
      <examples>
        ${(vocab.examples || []).map(ex => `<example>${escapeXML(ex)}</example>`).join('\n        ')}
      </examples>
      <part_of_speech>${escapeXML(vocab.part_of_speech || 'noun')}</part_of_speech>
    </vocabulary_item>`).join('\n');
  }
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<unit id="${unitId}" title="${escapeXML(unitTitle)}" order="${unit}">
  <metadata>
    <description>${lessonType} lesson for ${escapeXML(unitTitle)}</description>
    <estimated_duration>45</estimated_duration>
    <processed_at>${new Date().toISOString()}</processed_at>
    <ai_provider>${data.aiProvider || 'fallback'}</ai_provider>
    <vocabulary_count>${data.vocabulary?.length || 0}</vocabulary_count>
    <grammar_points>${(data.grammar_points || []).join(', ')}</grammar_points>
    <vocabulary_topics>${(data.vocabulary_topics || []).join(', ')}</vocabulary_topics>
  </metadata>
  
  <vocabulary_bank>${vocabularyXML}
  </vocabulary_bank>
  
  <sections>
    <section id="${lessonType}" title="${lessonType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}" order="1">
      <content>
        <text>${escapeXML(sourceContent.substring(0, 500))}...</text>
      </content>
      <exercises>
        <!-- Exercises will be generated based on lesson type and vocabulary -->
      </exercises>
    </section>
  </sections>
</unit>`;
  
  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default router;