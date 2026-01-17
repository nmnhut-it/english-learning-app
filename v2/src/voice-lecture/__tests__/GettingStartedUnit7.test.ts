/**
 * Unit Tests for Getting Started Unit 7 Voice Lecture
 *
 * These tests focus on identifying issues with parsing and rendering
 * the actual getting-started.md file for Unit 7.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseTitle,
  parseChunks,
  parseVocabulary,
  parseTeacherScript,
  parseLesson,
  extractTeacherScripts,
  extractVocabularySections,
  validateLesson,
  parseTextSegments,
  hasTag,
  getTagContent,
  renderFullContent,
  ParsedChunk,
  TeacherScript,
} from '../parser/Parser';

// Load actual getting-started.md file
let gettingStartedContent: string;

beforeAll(() => {
  const filePath = path.resolve(__dirname, '../../../data/voice-lectures/g6/unit-07/getting-started.md');
  gettingStartedContent = fs.readFileSync(filePath, 'utf-8');
});

describe('Getting Started Unit 7 - Full File Parsing', () => {
  describe('Title Parsing', () => {
    it('should parse the title correctly', () => {
      const title = parseTitle(gettingStartedContent);
      expect(title).toBe('UNIT 7: TELEVISION');
    });
  });

  describe('Chunk Parsing', () => {
    it('should parse all chunks from the file', () => {
      const chunks = parseChunks(gettingStartedContent);
      expect(chunks.length).toBeGreaterThanOrEqual(8);

      // Log chunk info for debugging
      console.log('Parsed chunks:', chunks.map((c, i) => ({ index: i, id: c.id, contentLength: c.content.length })));
    });

    it('should have expected chunk IDs', () => {
      const chunks = parseChunks(gettingStartedContent);
      const chunkIds = chunks.map(c => c.id);

      // Expected chunks from the getting-started.md file
      expect(chunkIds).toContain('intro');
      expect(chunkIds).toContain('vocabulary');
      expect(chunkIds).toContain('exercise_1');
      expect(chunkIds).toContain('translation');
      expect(chunkIds).toContain('exercise_2');
      expect(chunkIds).toContain('answer_2');
      expect(chunkIds).toContain('exercise_3');
      expect(chunkIds).toContain('answer_3');
    });

    it('should not have empty chunks', () => {
      const chunks = parseChunks(gettingStartedContent);

      chunks.forEach((chunk, index) => {
        expect(chunk.content.length, `Chunk ${chunk.id} at index ${index} is too short`).toBeGreaterThan(20);
      });
    });
  });

  describe('Vocabulary Parsing', () => {
    it('should extract vocabulary section', () => {
      const vocabSections = extractVocabularySections(gettingStartedContent);
      expect(vocabSections.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse all vocabulary words', () => {
      const vocabSections = extractVocabularySections(gettingStartedContent);

      // First vocabulary section should have 14 words
      expect(vocabSections[0].words.length).toBe(14);

      // Check specific words
      const words = vocabSections[0].words;
      const talentShow = words.find(w => w.word === 'talent show');
      expect(talentShow).toBeDefined();
      expect(talentShow?.type).toBe('n');
      expect(talentShow?.pronunciation).toBe('ˈtælənt ʃəʊ');
    });

    it('should handle vocabulary without type', () => {
      const vocabSections = extractVocabularySections(gettingStartedContent);
      const words = vocabSections[0].words;

      // "The Voice Kids" has no type
      const voiceKids = words.find(w => w.word === 'The Voice Kids');
      expect(voiceKids).toBeDefined();
      expect(voiceKids?.type).toBeNull();
    });

    it('should handle vocabulary without pronunciation', () => {
      const vocabSections = extractVocabularySections(gettingStartedContent);
      const words = vocabSections[0].words;

      // Some words might not have pronunciation
      const voiceKids = words.find(w => w.word === 'The Voice Kids');
      expect(voiceKids?.pronunciation).toBeNull();
    });
  });

  describe('Teacher Script Parsing', () => {
    it('should extract all teacher scripts', () => {
      const scripts = extractTeacherScripts(gettingStartedContent);
      expect(scripts.length).toBeGreaterThanOrEqual(15);

      // Log script info for debugging
      console.log('Parsed teacher scripts:', scripts.map((s, i) => ({
        index: i,
        id: s.id,
        textLength: s.text.length,
        pause: s.pause,
        action: s.action,
        segmentCount: s.segments.length,
      })));
    });

    it('should parse scripts with inline <eng> tags', () => {
      const scripts = extractTeacherScripts(gettingStartedContent);

      // Find script with <eng> tag
      const engScript = scripts.find(s => s.text.includes('Television'));
      expect(engScript).toBeDefined();

      // Check segments
      expect(engScript!.segments.length).toBeGreaterThan(1);

      // Should have English segment for "Television"
      const engSegment = engScript!.segments.find(seg => seg.lang === 'en' && seg.text.includes('Television'));
      expect(engSegment).toBeDefined();
    });

    it('should parse scripts with record action', () => {
      const scripts = extractTeacherScripts(gettingStartedContent);

      const recordScripts = scripts.filter(s => s.action === 'record');
      expect(recordScripts.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle EMPTY teacher scripts with action', () => {
      // This is a critical edge case - empty teacher_script tags with action
      const emptyScript = `<teacher_script pause="0" action="record">
</teacher_script>`;

      const script = parseTeacherScript('\n', 'pause="0" action="record"');
      expect(script.text).toBe('');
      expect(script.action).toBe('record');
      expect(script.pause).toBe(0);
    });

    it('should handle scripts with various pause values', () => {
      const scripts = extractTeacherScripts(gettingStartedContent);

      const pauses = scripts.map(s => s.pause);
      expect(pauses).toContain(0);
      expect(pauses).toContain(30);
      expect(pauses).toContain(45);
      expect(pauses).toContain(60);
      expect(pauses).toContain(180);
    });
  });

  describe('Inline Language Tags', () => {
    it('should parse <eng> tags correctly', () => {
      const text = 'Bài 1 <eng>Listen and read</eng> nha. Đọc hội thoại và dịch vô tập.';
      const segments = parseTextSegments(text, 'vi');

      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({ text: 'Bài 1', lang: 'vi' });
      expect(segments[1]).toEqual({ text: 'Listen and read', lang: 'en' });
      expect(segments[2]).toEqual({ text: 'nha. Đọc hội thoại và dịch vô tập.', lang: 'vi' });
    });

    it('should handle script starting with <eng> tag', () => {
      const text = '<eng>Click</eng> vào nút bắt đầu nha';
      const segments = parseTextSegments(text, 'vi');

      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({ text: 'Click', lang: 'en' });
      expect(segments[1]).toEqual({ text: 'vào nút bắt đầu nha', lang: 'vi' });
    });

    it('should handle script ending with <eng> tag', () => {
      const text = 'Unit 7 là về <eng>Television</eng>';
      const segments = parseTextSegments(text, 'vi');

      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({ text: 'Unit 7 là về', lang: 'vi' });
      expect(segments[1]).toEqual({ text: 'Television', lang: 'en' });
    });

    it('should handle multiple consecutive <eng> tags', () => {
      const text = '<eng>animated film</eng> khác <eng>cartoon</eng>';
      const segments = parseTextSegments(text, 'vi');

      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({ text: 'animated film', lang: 'en' });
      expect(segments[1]).toEqual({ text: 'khác', lang: 'vi' });
      expect(segments[2]).toEqual({ text: 'cartoon', lang: 'en' });
    });

    it('should handle text with no language tags', () => {
      const text = 'Ok đáp án nè. Các em đọc lại đáp án.';
      const segments = parseTextSegments(text, 'vi');

      expect(segments).toHaveLength(1);
      expect(segments[0]).toEqual({ text: 'Ok đáp án nè. Các em đọc lại đáp án.', lang: 'vi' });
    });

    it('should handle empty text', () => {
      const segments = parseTextSegments('', 'vi');
      expect(segments).toHaveLength(0);
    });

    it('should handle whitespace-only text', () => {
      const segments = parseTextSegments('   ', 'vi');
      expect(segments).toHaveLength(0);
    });
  });

  describe('Validation', () => {
    it('should validate the full lesson', () => {
      const result = validateLesson(gettingStartedContent);

      console.log('Validation errors:', result.errors);
      console.log('Validation warnings:', result.warnings);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('Teacher Script Edge Cases', () => {
  describe('Empty Teacher Scripts', () => {
    it('should handle completely empty script content', () => {
      const script = parseTeacherScript('', 'pause="0"');
      expect(script.text).toBe('');
      expect(script.segments).toHaveLength(0);
      expect(script.pause).toBe(0);
    });

    it('should handle script with only whitespace', () => {
      const script = parseTeacherScript('   \n\t  ', 'pause="60"');
      expect(script.text).toBe('');
      expect(script.segments).toHaveLength(0);
      expect(script.pause).toBe(60);
    });

    it('should handle script with only action attribute', () => {
      const script = parseTeacherScript('', 'pause="0" action="record"');
      expect(script.action).toBe('record');
      expect(script.text).toBe('');
    });

    it('should handle empty script extraction from content', () => {
      const content = `
<teacher_script pause="0" action="record">
</teacher_script>
`;
      const scripts = extractTeacherScripts(content);
      expect(scripts).toHaveLength(1);
      expect(scripts[0].action).toBe('record');
      expect(scripts[0].text.trim()).toBe('');
    });
  });

  describe('Consecutive Teacher Scripts', () => {
    it('should parse multiple consecutive scripts', () => {
      const content = `
<teacher_script pause="0">
First script
</teacher_script>

<teacher_script pause="0">
Second script
</teacher_script>

<teacher_script pause="60">
Third script
</teacher_script>
`;
      const scripts = extractTeacherScripts(content);
      expect(scripts).toHaveLength(3);
      expect(scripts[0].text).toBe('First script');
      expect(scripts[1].text).toBe('Second script');
      expect(scripts[2].text).toBe('Third script');
      expect(scripts[2].pause).toBe(60);
    });

    it('should handle consecutive scripts without gaps', () => {
      const content = `<teacher_script pause="0">First</teacher_script><teacher_script pause="30">Second</teacher_script>`;
      const scripts = extractTeacherScripts(content);
      expect(scripts).toHaveLength(2);
    });
  });

  describe('Complex Script Content', () => {
    it('should preserve Vietnamese characters', () => {
      const text = 'Chào mấy đứa. Hôm nay thầy kẹt lịch nên không dạy ở nhà được.';
      const script = parseTeacherScript(text, 'pause="0"');
      expect(script.text).toBe(text);
    });

    it('should handle mixed Vietnamese and English with tags', () => {
      const text = 'Bài 2 <eng>Choose the correct answer A, B, or C</eng>. Đọc lại hội thoại, chọn đáp án đúng.';
      const script = parseTeacherScript(text, 'pause="60"');

      // Plain text should not have tags
      expect(script.text).toBe('Bài 2 Choose the correct answer A, B, or C. Đọc lại hội thoại, chọn đáp án đúng.');

      // Segments should be split
      expect(script.segments.length).toBe(3);
      expect(script.segments[1].lang).toBe('en');
    });

    it('should handle quotes in script text', () => {
      const text = 'Phong nói "I like animated films" nghĩa là "Tôi thích phim hoạt hình"';
      const script = parseTeacherScript(text, 'pause="0"');
      expect(script.text).toContain('"I like animated films"');
    });

    it('should handle newlines in script content', () => {
      const text = `First line
Second line
Third line`;
      const script = parseTeacherScript(text, 'pause="0"');
      expect(script.text).toBe('First line\nSecond line\nThird line');
    });
  });
});

describe('Chunk Content Analysis', () => {
  it('should have teacher scripts in each chunk', () => {
    const chunks = parseChunks(gettingStartedContent);

    chunks.forEach((chunk, index) => {
      const scripts = extractTeacherScripts(chunk.content);
      console.log(`Chunk ${index} (${chunk.id}): ${scripts.length} teacher scripts`);

      // Most chunks should have at least one teacher script
      // But some edge cases might not
      if (scripts.length === 0) {
        console.warn(`Warning: Chunk ${chunk.id} has no teacher scripts`);
      }
    });
  });

  it('should not have chunks with only separator content', () => {
    const chunks = parseChunks(gettingStartedContent);

    chunks.forEach((chunk) => {
      // Check that content is not just horizontal rules
      const contentWithoutHr = chunk.content.replace(/---/g, '').trim();
      expect(contentWithoutHr.length, `Chunk ${chunk.id} has only separator content`).toBeGreaterThan(10);
    });
  });
});

describe('Full Lesson Structure', () => {
  it('should produce valid ParsedLesson', () => {
    const lesson = parseLesson(gettingStartedContent);

    expect(lesson.title).toBeTruthy();
    expect(lesson.chunks.length).toBeGreaterThan(0);

    // Each chunk should have required properties
    lesson.chunks.forEach((chunk, index) => {
      expect(chunk.id, `Chunk ${index} missing id`).toBeTruthy();
      expect(chunk.index).toBe(index);
      expect(chunk.content, `Chunk ${index} missing content`).toBeTruthy();
    });
  });

  it('should maintain chunk order', () => {
    const lesson = parseLesson(gettingStartedContent);

    for (let i = 0; i < lesson.chunks.length; i++) {
      expect(lesson.chunks[i].index).toBe(i);
    }
  });
});

describe('renderFullContent', () => {
  it('should render teacher scripts with data attributes', () => {
    const content = `
<teacher_script pause="60" action="record">
Bài 1 <eng>Listen</eng> nha.
</teacher_script>
`;
    const html = renderFullContent(content);

    expect(html).toContain('data-pause="60"');
    expect(html).toContain('data-action="record"');
    expect(html).toContain('data-segments');
    expect(html).toContain('class="teacher-script ts"');
  });

  it('should handle empty teacher scripts in full content', () => {
    const content = `
Some text before

<teacher_script pause="0" action="record">
</teacher_script>

Some text after
`;
    const html = renderFullContent(content);

    expect(html).toContain('data-action="record"');
    expect(html).toContain('class="teacher-script ts"');
  });

  it('should preserve vocabulary tag structure', () => {
    const content = `
<vocabulary>
1. **hello** : (n) xin chào /həˈləʊ/
</vocabulary>
`;
    const html = renderFullContent(content);

    expect(html).toContain('class="vocabulary"');
    expect(html).toContain('hello');
  });
});

describe('Potential Issue Detection', () => {
  it('should detect if any chunks have content that could cause issues', () => {
    const chunks = parseChunks(gettingStartedContent);

    const issues: string[] = [];

    chunks.forEach((chunk) => {
      // Check for problematic patterns
      if (chunk.content.includes('<teacher_script') && !chunk.content.includes('</teacher_script>')) {
        issues.push(`Chunk ${chunk.id}: Unclosed teacher_script tag`);
      }

      if (chunk.content.includes('<eng>') && !chunk.content.includes('</eng>')) {
        issues.push(`Chunk ${chunk.id}: Unclosed eng tag`);
      }

      // Check for empty script tags that might cause issues
      const emptyScriptMatch = chunk.content.match(/<teacher_script[^>]*>\s*<\/teacher_script>/g);
      if (emptyScriptMatch) {
        console.log(`Chunk ${chunk.id}: Found ${emptyScriptMatch.length} empty teacher_script tags`);
      }
    });

    if (issues.length > 0) {
      console.error('Detected issues:', issues);
    }

    expect(issues).toHaveLength(0);
  });

  it('should check for consecutive teacher scripts that might cause navigation issues', () => {
    const content = gettingStartedContent;
    const consecutivePattern = /<\/teacher_script>\s*<teacher_script/g;
    const matches = content.match(consecutivePattern);

    if (matches) {
      console.log(`Found ${matches.length} consecutive teacher_script pairs`);
    }

    // This is informational - consecutive scripts are valid
    expect(true).toBe(true);
  });
});

describe('CRITICAL: Consecutive Teacher Script Issue', () => {
  describe('Empty teacher scripts detection', () => {
    it('should identify empty teacher scripts in getting-started.md', () => {
      const scripts = extractTeacherScripts(gettingStartedContent);
      const emptyScripts = scripts.filter(s => s.text.trim() === '');

      console.log('Empty teacher scripts found:', emptyScripts.map(s => ({
        id: s.id,
        action: s.action,
        pause: s.pause,
      })));

      // Document how many empty scripts exist
      expect(emptyScripts.length).toBeGreaterThanOrEqual(0);

      // Empty scripts with action="record" are valid but need special handling
      emptyScripts.forEach(script => {
        if (script.action) {
          console.log(`Empty script ${script.id} has action="${script.action}"`);
        }
      });
    });

    it('should handle empty script text gracefully', () => {
      const script = parseTeacherScript('', 'pause="0" action="record"');

      // These should not cause errors
      expect(script.text).toBe('');
      expect(script.segments).toHaveLength(0);
      expect(script.action).toBe('record');

      // TTS should not be called for empty text
      // This is a behavioral requirement - not parser's responsibility
    });
  });

  describe('Consecutive teacher script patterns', () => {
    it('should identify consecutive scripts in actual file', () => {
      const chunks = parseChunks(gettingStartedContent);

      chunks.forEach((chunk) => {
        const scripts = extractTeacherScripts(chunk.content);

        if (scripts.length >= 2) {
          console.log(`Chunk ${chunk.id}: ${scripts.length} teacher scripts`);

          // Check for consecutive scripts with pause=0
          for (let i = 0; i < scripts.length - 1; i++) {
            const current = scripts[i];
            const next = scripts[i + 1];

            if (current.pause === 0 && next.pause === 0) {
              console.log(`  - Consecutive pause=0 scripts: "${current.text.slice(0, 30)}..." -> "${next.text.slice(0, 30)}..."`);
            }

            // Check for empty script followed by another script
            if (current.text.trim() === '') {
              console.log(`  - EMPTY script followed by: "${next.text.slice(0, 30)}..."`);
            }
          }
        }
      });
    });

    it('should correctly parse intro chunk with 3 consecutive scripts', () => {
      const chunks = parseChunks(gettingStartedContent);
      const introChunk = chunks.find(c => c.id === 'intro');

      expect(introChunk).toBeDefined();

      const scripts = extractTeacherScripts(introChunk!.content);

      console.log('Intro chunk scripts:', scripts.map(s => ({
        id: s.id,
        textLength: s.text.length,
        textPreview: s.text.slice(0, 50) + '...',
        pause: s.pause,
        segments: s.segments.length,
      })));

      // The intro chunk should have 3 teacher scripts
      expect(scripts.length).toBe(3);

      // All should have pause=0
      scripts.forEach(s => {
        expect(s.pause).toBe(0);
      });
    });
  });

  describe('Segment parsing for consecutive scripts', () => {
    it('should parse segments correctly for each script in intro', () => {
      const chunks = parseChunks(gettingStartedContent);
      const introChunk = chunks.find(c => c.id === 'intro');
      const scripts = extractTeacherScripts(introChunk!.content);

      // First script should have <eng>Television</eng> tag
      const firstScript = scripts[0];
      expect(firstScript.segments.length).toBeGreaterThan(1);

      const engSegment = firstScript.segments.find(s => s.lang === 'en');
      expect(engSegment).toBeDefined();
      expect(engSegment?.text).toContain('Television');

      // Second script has no eng tags
      const secondScript = scripts[1];
      expect(secondScript.segments).toHaveLength(1);
      expect(secondScript.segments[0].lang).toBe('vi');

      // Third script should have <eng>Getting Started</eng>
      const thirdScript = scripts[2];
      const engSegment3 = thirdScript.segments.find(s => s.lang === 'en');
      expect(engSegment3).toBeDefined();
      expect(engSegment3?.text).toContain('Getting Started');
    });
  });

  describe('answer_2 chunk with empty action script', () => {
    it('should parse answer_2 chunk correctly including empty record script', () => {
      const chunks = parseChunks(gettingStartedContent);
      const answerChunk = chunks.find(c => c.id === 'answer_2');

      expect(answerChunk).toBeDefined();

      const scripts = extractTeacherScripts(answerChunk!.content);

      console.log('answer_2 scripts:', scripts.map(s => ({
        id: s.id,
        textLength: s.text.length,
        pause: s.pause,
        action: s.action,
      })));

      // Find the empty script with action="record"
      const emptyRecordScript = scripts.find(s => s.action === 'record' && s.text.trim() === '');

      if (emptyRecordScript) {
        console.log('Found empty record script:', emptyRecordScript);
        expect(emptyRecordScript.text).toBe('');
        expect(emptyRecordScript.segments).toHaveLength(0);
      }
    });

    it('should document the issue: TTS with empty text might not fire onend', () => {
      // This test documents the behavioral issue
      const content = `
<teacher_script pause="30">
Các em sửa bài nếu có sai.
</teacher_script>

<teacher_script pause="0" action="record">
</teacher_script>
`;
      const scripts = extractTeacherScripts(content);

      expect(scripts).toHaveLength(2);
      expect(scripts[0].text).toBe('Các em sửa bài nếu có sai.');
      expect(scripts[0].pause).toBe(30);

      expect(scripts[1].text.trim()).toBe('');
      expect(scripts[1].action).toBe('record');
      expect(scripts[1].pause).toBe(0);

      // ISSUE: When the first script finishes (after 30s timer),
      // the viewer will try to play the empty script.
      // speakTTS('', callback) is called with empty text.
      // SpeechSynthesis.speak() with empty utterance may not fire onend!

      console.log('DOCUMENTED ISSUE: Empty teacher_script with action="record" may cause viewer to get stuck');
      console.log('SOLUTION: Skip TTS for empty text, call onEnd immediately');
    });
  });
});

describe('AudioService behavior simulation', () => {
  it('should handle empty text in speakTTS simulation', () => {
    // Simulating the speakTTS behavior
    function simulateSpeakTTS(text: string): Promise<boolean> {
      return new Promise((resolve) => {
        if (!text || text.trim() === '') {
          // BUG: If we call speechSynthesis.speak(''), onend may never fire
          // FIX: Should resolve immediately for empty text
          console.log('Empty text - should skip TTS and resolve immediately');
          resolve(false); // false = was skipped
          return;
        }
        // Normal TTS would happen here
        resolve(true); // true = was spoken
      });
    }

    // Test empty text
    return simulateSpeakTTS('').then((wasSpoken) => {
      expect(wasSpoken).toBe(false);
    });
  });

  it('should handle whitespace-only text', () => {
    function simulateSpeakTTS(text: string): Promise<boolean> {
      return new Promise((resolve) => {
        if (!text || text.trim() === '') {
          resolve(false);
          return;
        }
        resolve(true);
      });
    }

    return simulateSpeakTTS('   \n  ').then((wasSpoken) => {
      expect(wasSpoken).toBe(false);
    });
  });
});

describe('Navigation flow simulation', () => {
  interface MockElement {
    id: string;
    type: 'ts' | 'vocab' | 'content' | 'none';
    text: string;
    pause: number;
    action?: string;
    played: boolean;
  }

  function simulateChunkNavigation(elements: MockElement[]): string[] {
    const playOrder: string[] = [];
    let currentIndex = 0;

    function findNextUnplayed(): number {
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].type === 'ts' && !elements[i].played) {
          return i;
        }
      }
      return -1;
    }

    function findNext(fromIndex: number): number {
      for (let i = fromIndex + 1; i < elements.length; i++) {
        if (elements[i].type !== 'none') {
          return i;
        }
      }
      return -1;
    }

    function playTS(index: number): void {
      if (index < 0 || index >= elements.length) return;

      const el = elements[index];
      if (el.type !== 'ts' || el.played) return;

      el.played = true;
      playOrder.push(el.id);

      // Simulate TTS completion
      // BUG: If text is empty, this might not complete!
      const textIsEmpty = !el.text || el.text.trim() === '';

      if (textIsEmpty) {
        // CURRENT BUG: Would call speakTTS(''), which may hang
        console.log(`BUG SIMULATION: Playing empty TS ${el.id} - may hang!`);
        // FIX: Should skip TTS and continue immediately
      }

      // After speaking (or timer), find and play next
      const nextIndex = findNext(index);
      if (nextIndex >= 0 && elements[nextIndex].type === 'ts') {
        // Consecutive TS - play it
        playTS(nextIndex);
      }
      // Otherwise navigation would unlock
    }

    // Start navigation
    const firstTS = findNextUnplayed();
    if (firstTS >= 0) {
      playTS(firstTS);
    }

    return playOrder;
  }

  it('should navigate consecutive teacher scripts correctly', () => {
    const elements: MockElement[] = [
      { id: 'ts-1', type: 'ts', text: 'First script', pause: 0, played: false },
      { id: 'ts-2', type: 'ts', text: 'Second script', pause: 0, played: false },
      { id: 'ts-3', type: 'ts', text: 'Third script', pause: 0, played: false },
    ];

    const playOrder = simulateChunkNavigation(elements);

    expect(playOrder).toEqual(['ts-1', 'ts-2', 'ts-3']);
  });

  it('should handle script followed by empty action script', () => {
    const elements: MockElement[] = [
      { id: 'ts-1', type: 'ts', text: 'Do the exercise', pause: 30, played: false },
      { id: 'ts-2', type: 'ts', text: '', pause: 0, action: 'record', played: false },
    ];

    const playOrder = simulateChunkNavigation(elements);

    // Both should be "played" even if ts-2 has empty text
    expect(playOrder).toEqual(['ts-1', 'ts-2']);
    expect(elements[0].played).toBe(true);
    expect(elements[1].played).toBe(true);
  });

  it('should handle answer_2 chunk pattern', () => {
    // This simulates the actual pattern in answer_2 chunk
    const elements: MockElement[] = [
      { id: 'ts-1', type: 'ts', text: 'Ok đáp án nè...', pause: 0, played: false },
      { id: 'ts-2', type: 'ts', text: 'Ai chọn câu 1 là A...', pause: 0, played: false },
      { id: 'ts-3', type: 'ts', text: 'Các em sửa bài...', pause: 30, played: false },
      { id: 'ts-4', type: 'ts', text: '', pause: 0, action: 'record', played: false },
    ];

    const playOrder = simulateChunkNavigation(elements);

    expect(playOrder).toEqual(['ts-1', 'ts-2', 'ts-3', 'ts-4']);
  });
});
