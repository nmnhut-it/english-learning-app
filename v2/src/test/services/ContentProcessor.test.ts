import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ContentProcessor } from '@services/ContentProcessor';
import { contentChecker } from '@services/ContentChecker';
import { aiVocabularyProcessor } from '@services/AIVocabularyProcessor';
import { aiService } from '@services/AIService';
import type { ContentMetadata, ProcessingResult } from '@/types';

// Mock dependencies
vi.mock('@services/ContentChecker', () => ({
  contentChecker: {
    isContentProcessed: vi.fn(),
    hasSourceContentChanged: vi.fn(),
    getProcessingRecommendations: vi.fn(),
    getProcessingQueue: vi.fn(),
    getGradeProcessingStatus: vi.fn(),
    validateProcessedContent: vi.fn(),
    getCacheStats: vi.fn(),
  },
}));

vi.mock('@services/AIVocabularyProcessor', () => ({
  aiVocabularyProcessor: {
    processContent: vi.fn(),
    getActiveJobs: vi.fn(() => []),
    cancelJob: vi.fn(),
  },
}));

vi.mock('@services/AIService', () => ({
  aiService: {
    isConfigured: vi.fn(),
    processContent: vi.fn(),
  },
}));

describe('ContentProcessor - Check Before Process Logic', () => {
  let processor: ContentProcessor;
  let mockMetadata: ContentMetadata;
  let mockContent: string;

  beforeEach(() => {
    processor = ContentProcessor.getInstance();
    
    mockMetadata = {
      grade: 7,
      unitId: 'unit-01',
      title: 'Hobbies',
      source: 'loigiahay'
    };
    
    mockContent = `
      # Unit 1: Hobbies
      
      ## Vocabulary
      **hobby** - an activity for pleasure
      **unusual** - not common or ordinary
      
      ## Exercises
      1. What is a hobby?
      2. Give an example of an unusual hobby.
    `;

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Check Before Process Workflow', () => {
    it('should load from disk when content exists and unchanged', async () => {
      // Mock: Content exists on disk and hasn't changed
      (contentChecker.isContentProcessed as Mock).mockResolvedValue(true);
      (contentChecker.hasSourceContentChanged as Mock).mockResolvedValue(false);

      const result = await processor.processContent(mockContent, mockMetadata);

      expect(result.success).toBe(true);
      expect(result.action).toBe('loaded_from_disk');
      expect(result.fromCache).toBe(true);
      expect(result.message).toBe('Content loaded from disk (no processing needed)');
      expect(result.xmlPath).toBe('/data/structured/grade-7/unit-01.xml');
      
      // Should check disk but not call AI processing
      expect(contentChecker.isContentProcessed).toHaveBeenCalledWith(7, 'unit-01');
      expect(contentChecker.hasSourceContentChanged).toHaveBeenCalledWith(7, 'unit-01', mockContent);
      expect(aiVocabularyProcessor.processContent).not.toHaveBeenCalled();
    });

    it('should process with AI when content exists but changed', async () => {
      // Mock: Content exists on disk but has changed
      (contentChecker.isContentProcessed as Mock).mockResolvedValue(true);
      (contentChecker.hasSourceContentChanged as Mock).mockResolvedValue(true);
      (aiVocabularyProcessor.processContent as Mock).mockResolvedValue({
        xmlPath: '/data/structured/grade-7/unit-01.xml',
        vocabularyCount: 5
      });

      const result = await processor.processContent(mockContent, mockMetadata);

      expect(result.success).toBe(true);
      expect(result.action).toBe('processed_with_ai');
      expect(result.fromCache).toBe(false);
      expect(result.vocabularyCount).toBe(5);
      
      // Should check disk, detect changes, and process with AI
      expect(contentChecker.isContentProcessed).toHaveBeenCalledWith(7, 'unit-01');
      expect(contentChecker.hasSourceContentChanged).toHaveBeenCalledWith(7, 'unit-01', mockContent);
      expect(aiVocabularyProcessor.processContent).toHaveBeenCalledWith(mockContent, mockMetadata);
    });

    it('should process with AI when content does not exist', async () => {
      // Mock: Content doesn't exist on disk
      (contentChecker.isContentProcessed as Mock).mockResolvedValue(false);
      (aiVocabularyProcessor.processContent as Mock).mockResolvedValue({
        xmlPath: '/data/structured/grade-7/unit-01.xml',
        vocabularyCount: 8
      });

      const result = await processor.processContent(mockContent, mockMetadata);

      expect(result.success).toBe(true);
      expect(result.action).toBe('processed_with_ai');
      expect(result.fromCache).toBe(false);
      expect(result.vocabularyCount).toBe(8);
      
      // Should check disk, not find content, and process with AI
      expect(contentChecker.isContentProcessed).toHaveBeenCalledWith(7, 'unit-01');
      expect(contentChecker.hasSourceContentChanged).not.toHaveBeenCalled();
      expect(aiVocabularyProcessor.processContent).toHaveBeenCalledWith(mockContent, mockMetadata);
    });

    it('should handle processing errors gracefully', async () => {
      // Mock: Content doesn't exist and AI processing fails
      (contentChecker.isContentProcessed as Mock).mockResolvedValue(false);
      (aiVocabularyProcessor.processContent as Mock).mockRejectedValue(new Error('AI service unavailable'));

      const result = await processor.processContent(mockContent, mockMetadata);

      expect(result.success).toBe(false);
      expect(result.action).toBe('failed');
      expect(result.error).toBe('AI service unavailable');
      expect(result.fromCache).toBe(false);
    });

    it('should prevent duplicate processing of same content', async () => {
      // Mock: Content processing takes time
      (contentChecker.isContentProcessed as Mock).mockResolvedValue(false);
      (aiVocabularyProcessor.processContent as Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      // Start two processes for the same content simultaneously
      const promise1 = processor.processContent(mockContent, mockMetadata);
      const promise2 = processor.processContent(mockContent, mockMetadata);

      const [result1, result2] = await Promise.allSettled([promise1, promise2]);

      // One should succeed, one should fail with "already processing" error
      const results = [result1, result2];
      const success = results.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>;
      const failure = results.find(r => r.status === 'rejected') as PromiseRejectedResult;

      expect(success).toBeDefined();
      expect(failure).toBeDefined();
      expect(failure.reason.message).toBe('Content is already being processed');
    });

    it('should measure processing time correctly', async () => {
      (contentChecker.isContentProcessed as Mock).mockResolvedValue(false);
      (aiVocabularyProcessor.processContent as Mock).mockResolvedValue({
        xmlPath: '/data/structured/grade-7/unit-01.xml',
        vocabularyCount: 3
      });

      const startTime = Date.now();
      const result = await processor.processContent(mockContent, mockMetadata);
      const endTime = Date.now();

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
      expect(result.processingTime).toBeLessThanOrEqual(endTime - startTime);
    });
  });

  describe('Content Source Processing', () => {
    it('should process loigiahay content with correct metadata', async () => {
      (contentChecker.isContentProcessed as Mock).mockResolvedValue(false);
      (aiVocabularyProcessor.processContent as Mock).mockResolvedValue({
        xmlPath: '/data/structured/grade-7/unit-01.xml',
        vocabularyCount: 6
      });

      const result = await processor.processLoigiahayContent(mockContent, 7, 1, 'Hobbies');

      expect(result.success).toBe(true);
      expect(result.metadata.source).toBe('loigiahay');
      expect(result.metadata.grade).toBe(7);
      expect(result.metadata.unitId).toBe('unit-01');
      expect(result.metadata.title).toBe('Hobbies');
    });

    it('should process manual notes with correct metadata', async () => {
      (contentChecker.isContentProcessed as Mock).mockResolvedValue(false);
      (aiVocabularyProcessor.processContent as Mock).mockResolvedValue({
        xmlPath: '/data/structured/grade-8/unit-02.xml',
        vocabularyCount: 4
      });

      const notes = 'My teaching notes for Unit 2';
      const result = await processor.processManualNotes(notes, 8, 2, 'My Unit 2 Notes');

      expect(result.success).toBe(true);
      expect(result.metadata.source).toBe('manual_notes');
      expect(result.metadata.grade).toBe(8);
      expect(result.metadata.unitId).toBe('unit-02');
      expect(result.metadata.title).toBe('My Unit 2 Notes');
    });

    it('should process textbook content with correct metadata', async () => {
      (contentChecker.isContentProcessed as Mock).mockResolvedValue(false);
      (aiVocabularyProcessor.processContent as Mock).mockResolvedValue({
        xmlPath: '/data/structured/grade-9/unit-03.xml',
        vocabularyCount: 7
      });

      const textbook = 'Textbook content for Unit 3';
      const result = await processor.processTextbookContent(textbook, 9, 3);

      expect(result.success).toBe(true);
      expect(result.metadata.source).toBe('textbook');
      expect(result.metadata.grade).toBe(9);
      expect(result.metadata.unitId).toBe('unit-03');
      expect(result.metadata.title).toBe('Unit 3');
    });
  });

  describe('Lesson Processing', () => {
    beforeEach(() => {
      (aiService.isConfigured as Mock).mockReturnValue(true);
      (aiService.processContent as Mock).mockResolvedValue({
        vocabulary: [
          { id: 'hobby', word: 'hobby', definition: 'an activity for pleasure' }
        ],
        exercises: [],
        grammar_points: ['present simple'],
        vocabulary_topics: ['hobbies']
      });
    });

    it('should process lesson content with AI when configured', async () => {
      const result = await processor.processLessonContent(
        mockContent, 
        7, 
        1, 
        'getting_started', 
        'Hobbies'
      );

      expect(result.success).toBe(true);
      expect(result.fromCache).toBe(false);
      expect(result.data?.title).toBe('Getting Started');
      expect(result.data?.vocabulary_bank).toHaveLength(1);
      
      expect(aiService.processContent).toHaveBeenCalledWith(mockContent, 7, 1, 'getting_started');
    });

    it('should use fallback processing when AI is not configured', async () => {
      (aiService.isConfigured as Mock).mockReturnValue(false);

      const result = await processor.processLessonContent(
        mockContent, 
        7, 
        1, 
        'getting_started', 
        'Hobbies'
      );

      expect(result.success).toBe(true);
      expect(result.data?.vocabulary_bank).toBeDefined();
      expect(aiService.processContent).not.toHaveBeenCalled();
    });

    it('should use fallback when AI processing fails', async () => {
      (aiService.processContent as Mock).mockRejectedValue(new Error('API Error'));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await processor.processLessonContent(
        mockContent, 
        7, 
        1, 
        'getting_started', 
        'Hobbies'
      );

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('AI processing failed, using fallback:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should save raw content for later reprocessing', async () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem');

      await processor.processLessonContent(
        mockContent, 
        7, 
        1, 
        'getting_started', 
        'Hobbies',
        true // saveRaw = true
      );

      expect(setItemSpy).toHaveBeenCalledWith(
        'raw_content_7_1_getting_started',
        expect.any(String)
      );
      
      // Verify the saved content includes our mock content
      const savedCall = setItemSpy.mock.calls.find(call => call[0] === 'raw_content_7_1_getting_started');
      expect(savedCall).toBeTruthy();
      expect(JSON.parse(savedCall![1]).content).toContain('# Unit 1: Hobbies');
    });

    it('should prevent duplicate lesson processing', async () => {
      // Start two processes for the same lesson simultaneously
      const promise1 = processor.processLessonContent(mockContent, 7, 1, 'getting_started', 'Hobbies');
      const promise2 = processor.processLessonContent(mockContent, 7, 1, 'getting_started', 'Hobbies');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // One should succeed, one should fail
      const results = [result1, result2];
      const success = results.find(r => r.success);
      const failure = results.find(r => !r.success);

      expect(success).toBeDefined();
      expect(failure).toBeDefined();
      expect(failure?.message).toBe('Already processing this lesson');
    });
  });

  describe('Fallback Processing', () => {
    it('should extract vocabulary from bold text', async () => {
      (aiService.isConfigured as Mock).mockReturnValue(false);

      const contentWithBold = `
        Learn about **hobbies** and **creativity**.
        Some **unusual** activities can be fun.
      `;

      const result = await processor.processLessonContent(
        contentWithBold, 
        7, 
        1, 
        'getting_started', 
        'Hobbies'
      );

      expect(result.success).toBe(true);
      expect(result.data?.vocabulary_bank).toHaveLength(3);
      expect(result.data?.vocabulary_bank.map((v: any) => v.word)).toEqual(
        expect.arrayContaining(['hobbies', 'creativity', 'unusual'])
      );
    });

    it('should extract exercises from numbered questions', async () => {
      (aiService.isConfigured as Mock).mockReturnValue(false);

      const contentWithQuestions = `
        1. What is your hobby?
        2. How often do you practice it?
        3. Why do you enjoy this activity?
      `;

      const result = await processor.processLessonContent(
        contentWithQuestions, 
        7, 
        1, 
        'getting_started', 
        'Hobbies'
      );

      expect(result.success).toBe(true);
      expect(result.data?.exercises).toHaveLength(3);
      expect(result.data?.exercises[0].question.text).toBe('What is your hobby?');
    });
  });

  describe('Processing Statistics', () => {
    it('should return current processing stats', () => {
      const stats = processor.getProcessingStats();

      expect(stats).toHaveProperty('activeJobs');
      expect(stats).toHaveProperty('cacheStats');
      expect(stats).toHaveProperty('queueSize');
      expect(stats).toHaveProperty('uptime');
    });

    it('should stop all processing when requested', () => {
      const mockJobs = [{ id: 'job1' }, { id: 'job2' }];
      (aiVocabularyProcessor.getActiveJobs as Mock).mockReturnValue(mockJobs);

      processor.stopAllProcessing();

      expect(aiVocabularyProcessor.cancelJob).toHaveBeenCalledWith('job1');
      expect(aiVocabularyProcessor.cancelJob).toHaveBeenCalledWith('job2');
    });
  });
});