/**
 * Exercise Rendering Tests
 *
 * Tests for the exercise system in voice-lecture-viewer-v2.html.
 * Run with: npm run test:unit -- ExerciseRendering
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Constants matching the v2 viewer implementation
const EXERCISE_TAG_REGEX = /<exercise([^>]*)>([\s\S]*?)<\/exercise>/gi;

interface ExerciseInstance {
  source: string;
  count: number;
  exercises: any[];
  currentQ: number;
  answers: boolean[];
}

/**
 * Parses exercise tag attributes and content.
 * Mirrors the implementation in voice-lecture-viewer-v2.html.
 */
function parseExerciseTag(attrs: string, content: string): { source: string; count: number; title: string } {
  const source = (attrs.match(/data-source="([^"]+)"/) || [])[1] || '';
  const count = parseInt((attrs.match(/data-count="(\d+)"/) || [])[1] || '10', 10);
  const title = content.trim();

  return { source, count, title };
}

/**
 * Simulates buildExerciseContainer function from v2 viewer.
 */
function buildExerciseContainer(id: string, content: string, source: string, count: string): string {
  return `
<div class="exercise-container" id="${id}" data-testid="exercise-${id}">
  <div class="exercise-start" id="${id}-start" data-testid="exercise-start-${id}">
    <div class="exercise-start-icon">📝</div>
    <div class="exercise-start-title">${content || 'Bài tập thực hành'}</div>
    <div class="exercise-start-desc">${count} câu hỏi trắc nghiệm</div>
    <button class="exercise-start-btn" data-testid="exercise-start-btn-${id}" onclick="window.__voiceLecture.startExercise('${id}')">Bắt đầu làm bài</button>
  </div>
  <div id="${id}-content" data-testid="exercise-content-${id}" style="display:none"></div>
</div>`;
}

describe('Exercise Tag Parsing', () => {
  it('parses exercise tag with data-source and data-count', () => {
    const attrs = ' data-source="exercises.json" data-count="5"';
    const content = 'Kiểm tra từ vựng';

    const result = parseExerciseTag(attrs, content);

    expect(result.source).toBe('exercises.json');
    expect(result.count).toBe(5);
    expect(result.title).toBe('Kiểm tra từ vựng');
  });

  it('uses default count of 10 when not specified', () => {
    const attrs = ' data-source="quiz.json"';
    const content = '';

    const result = parseExerciseTag(attrs, content);

    expect(result.count).toBe(10);
  });

  it('handles empty source attribute', () => {
    const attrs = ' data-count="3"';
    const content = 'Test';

    const result = parseExerciseTag(attrs, content);

    expect(result.source).toBe('');
    expect(result.count).toBe(3);
  });

  it('extracts exercise tags from markdown content', () => {
    const md = `
# Unit 1

<exercise data-source="vocab-quiz.json" data-count="5">
Kiểm tra từ vựng Unit 1
</exercise>

Some other content

<exercise data-source="grammar-quiz.json" data-count="10">
Kiểm tra ngữ pháp
</exercise>
`;

    const exercises: { attrs: string; content: string }[] = [];
    let match;
    const regex = new RegExp(EXERCISE_TAG_REGEX.source, 'gi');

    while ((match = regex.exec(md)) !== null) {
      exercises.push({
        attrs: match[1],
        content: match[2].trim(),
      });
    }

    expect(exercises).toHaveLength(2);
    expect(exercises[0].content).toBe('Kiểm tra từ vựng Unit 1');
    expect(exercises[1].content).toBe('Kiểm tra ngữ pháp');
  });
});

describe('Exercise Container HTML', () => {
  it('generates correct HTML structure', () => {
    const html = buildExerciseContainer('ex-0', 'Bài tập', 'quiz.json', '5');

    expect(html).toContain('class="exercise-container"');
    expect(html).toContain('id="ex-0"');
    expect(html).toContain('data-testid="exercise-ex-0"');
    expect(html).toContain('Bài tập');
    expect(html).toContain('5 câu hỏi trắc nghiệm');
    expect(html).toContain('Bắt đầu làm bài');
  });

  it('uses default title when content is empty', () => {
    const html = buildExerciseContainer('ex-1', '', 'quiz.json', '10');

    expect(html).toContain('Bài tập thực hành');
  });

  it('has start button with correct onclick handler', () => {
    const html = buildExerciseContainer('ex-test', 'Test', 'test.json', '3');

    expect(html).toContain('onclick="window.__voiceLecture.startExercise(\'ex-test\')"');
  });

  it('has content area hidden by default', () => {
    const html = buildExerciseContainer('ex-2', 'Test', 'test.json', '5');

    expect(html).toContain('id="ex-2-content"');
    expect(html).toContain('style="display:none"');
  });
});

describe('Exercise State Management', () => {
  let exerciseState: { instances: Record<string, ExerciseInstance>; counter: number };

  beforeEach(() => {
    exerciseState = {
      instances: {},
      counter: 0,
    };
  });

  it('initializes exercise instance correctly', () => {
    const exId = `ex-${exerciseState.counter++}`;
    exerciseState.instances[exId] = {
      source: 'vocab.json',
      count: 5,
      exercises: [],
      currentQ: 0,
      answers: [],
    };

    expect(exerciseState.instances[exId]).toBeDefined();
    expect(exerciseState.instances[exId].source).toBe('vocab.json');
    expect(exerciseState.instances[exId].count).toBe(5);
    expect(exerciseState.instances[exId].currentQ).toBe(0);
    expect(exerciseState.instances[exId].answers).toEqual([]);
  });

  it('assigns unique IDs to multiple exercises', () => {
    const id1 = `ex-${exerciseState.counter++}`;
    const id2 = `ex-${exerciseState.counter++}`;
    const id3 = `ex-${exerciseState.counter++}`;

    exerciseState.instances[id1] = { source: 'a.json', count: 5, exercises: [], currentQ: 0, answers: [] };
    exerciseState.instances[id2] = { source: 'b.json', count: 10, exercises: [], currentQ: 0, answers: [] };
    exerciseState.instances[id3] = { source: 'c.json', count: 3, exercises: [], currentQ: 0, answers: [] };

    expect(id1).toBe('ex-0');
    expect(id2).toBe('ex-1');
    expect(id3).toBe('ex-2');
    expect(Object.keys(exerciseState.instances)).toHaveLength(3);
  });

  it('tracks answers correctly', () => {
    const exId = `ex-${exerciseState.counter++}`;
    exerciseState.instances[exId] = {
      source: 'quiz.json',
      count: 3,
      exercises: [],
      currentQ: 0,
      answers: [],
    };

    // Simulate answering questions
    exerciseState.instances[exId].answers.push(true); // correct
    exerciseState.instances[exId].currentQ++;
    exerciseState.instances[exId].answers.push(false); // wrong
    exerciseState.instances[exId].currentQ++;
    exerciseState.instances[exId].answers.push(true); // correct

    expect(exerciseState.instances[exId].answers).toEqual([true, false, true]);
    expect(exerciseState.instances[exId].answers.filter((a) => a).length).toBe(2);
  });
});

describe('Exercise Result Calculation', () => {
  function calculateResult(answers: boolean[]): { correctCount: number; total: number; percentage: number } {
    const correctCount = answers.filter((a) => a).length;
    const total = answers.length;
    const percentage = Math.round((correctCount / total) * 100);
    return { correctCount, total, percentage };
  }

  function getResultText(pct: number): { icon: string; text: string } {
    if (pct < 50) return { icon: '😔', text: 'Cần cố gắng thêm!' };
    if (pct < 80) return { icon: '👍', text: 'Khá tốt!' };
    if (pct < 100) return { icon: '🌟', text: 'Tuyệt vời!' };
    return { icon: '🎉', text: 'Xuất sắc!' };
  }

  it('calculates 100% for all correct', () => {
    const result = calculateResult([true, true, true, true, true]);
    expect(result.percentage).toBe(100);
    expect(getResultText(result.percentage)).toEqual({ icon: '🎉', text: 'Xuất sắc!' });
  });

  it('calculates 80% correctly', () => {
    const result = calculateResult([true, true, true, true, false]);
    expect(result.percentage).toBe(80);
    expect(getResultText(result.percentage)).toEqual({ icon: '🌟', text: 'Tuyệt vời!' });
  });

  it('calculates 60% correctly', () => {
    const result = calculateResult([true, true, true, false, false]);
    expect(result.percentage).toBe(60);
    expect(getResultText(result.percentage)).toEqual({ icon: '👍', text: 'Khá tốt!' });
  });

  it('calculates 40% correctly', () => {
    const result = calculateResult([true, true, false, false, false]);
    expect(result.percentage).toBe(40);
    expect(getResultText(result.percentage)).toEqual({ icon: '😔', text: 'Cần cố gắng thêm!' });
  });

  it('calculates 0% for all wrong', () => {
    const result = calculateResult([false, false, false, false, false]);
    expect(result.percentage).toBe(0);
    expect(getResultText(result.percentage)).toEqual({ icon: '😔', text: 'Cần cố gắng thêm!' });
  });
});

describe('Exercise JSON Format', () => {
  const sampleExerciseJson = {
    exercises: [
      {
        question: 'What is the meaning of "traffic"?',
        options: ['Giao thông', 'Xe buýt', 'Đường phố', 'Cầu'],
        correctIndex: 0,
        explanation: '"Traffic" means giao thông in Vietnamese.',
      },
      {
        question: 'Choose the correct sentence:',
        options: ['He go to school.', 'He goes to school.', 'He going to school.', 'He goed to school.'],
        correctIndex: 1,
        explanation: 'Third person singular uses "goes".',
      },
    ],
  };

  it('validates exercise JSON structure', () => {
    expect(sampleExerciseJson.exercises).toBeInstanceOf(Array);
    expect(sampleExerciseJson.exercises.length).toBeGreaterThan(0);
  });

  it('validates exercise item structure', () => {
    const exercise = sampleExerciseJson.exercises[0];

    expect(exercise).toHaveProperty('question');
    expect(exercise).toHaveProperty('options');
    expect(exercise).toHaveProperty('correctIndex');
    expect(exercise.options).toBeInstanceOf(Array);
    expect(typeof exercise.correctIndex).toBe('number');
  });

  it('validates correctIndex is within options range', () => {
    for (const exercise of sampleExerciseJson.exercises) {
      expect(exercise.correctIndex).toBeGreaterThanOrEqual(0);
      expect(exercise.correctIndex).toBeLessThan(exercise.options.length);
    }
  });
});

describe('Integration with Markdown Content', () => {
  function extractExercises(md: string): { source: string; count: number; title: string }[] {
    const exercises: { source: string; count: number; title: string }[] = [];
    const regex = new RegExp(EXERCISE_TAG_REGEX.source, 'gi');
    let match;

    while ((match = regex.exec(md)) !== null) {
      exercises.push(parseExerciseTag(match[1], match[2]));
    }

    return exercises;
  }

  it('extracts exercises from real-world markdown', () => {
    const md = `
# UNIT 7: TRAFFIC

## GETTING STARTED

<teacher_script pause="0">
Xong phần từ vựng rồi. Giờ làm bài tập kiểm tra nha.
</teacher_script>

<exercise data-source="exercises/vocab-quiz.json" data-count="10">
Kiểm tra từ vựng - Unit 7 Traffic
</exercise>

### Grammar Practice

<exercise data-source="exercises/grammar-quiz.json" data-count="5">
Kiểm tra ngữ pháp
</exercise>
`;

    const exercises = extractExercises(md);

    expect(exercises).toHaveLength(2);
    expect(exercises[0].source).toBe('exercises/vocab-quiz.json');
    expect(exercises[0].count).toBe(10);
    expect(exercises[0].title).toBe('Kiểm tra từ vựng - Unit 7 Traffic');
    expect(exercises[1].source).toBe('exercises/grammar-quiz.json');
    expect(exercises[1].count).toBe(5);
  });

  it('handles exercise tag with no content', () => {
    const md = `
<exercise data-source="quiz.json" data-count="5"></exercise>
`;

    const exercises = extractExercises(md);

    expect(exercises).toHaveLength(1);
    expect(exercises[0].title).toBe('');
  });

  it('handles multiline exercise content', () => {
    const md = `
<exercise data-source="quiz.json" data-count="3">
Bài kiểm tra
Ngữ pháp Unit 1
</exercise>
`;

    const exercises = extractExercises(md);

    expect(exercises).toHaveLength(1);
    expect(exercises[0].title).toContain('Bài kiểm tra');
  });
});

describe('Path Resolution', () => {
  // Resolve relative paths (handles ../ segments) - mirrors v2 viewer implementation
  function resolveRelativePath(basePath: string, relativePath: string): string {
    const baseSegments = basePath.split('/').filter((s) => s);
    const relativeSegments = relativePath.split('/');

    for (const segment of relativeSegments) {
      if (segment === '..') {
        baseSegments.pop();
      } else if (segment !== '.' && segment !== '') {
        baseSegments.push(segment);
      }
    }

    return baseSegments.join('/');
  }

  it('resolves simple relative path', () => {
    const base = 'data/voice-lectures/grammar';
    const relative = 'exercises.json';
    expect(resolveRelativePath(base, relative)).toBe('data/voice-lectures/grammar/exercises.json');
  });

  it('resolves path with single ../', () => {
    const base = 'data/voice-lectures/grammar';
    const relative = '../vocab.json';
    expect(resolveRelativePath(base, relative)).toBe('data/voice-lectures/vocab.json');
  });

  it('resolves path with multiple ../', () => {
    const base = 'data/voice-lectures/grammar/first-conditional';
    const relative = '../../../tieu-hoc/data/unit-8.json';
    expect(resolveRelativePath(base, relative)).toBe('data/tieu-hoc/data/unit-8.json');
  });

  it('handles ./ in path', () => {
    const base = 'data/voice-lectures';
    const relative = './exercises/quiz.json';
    expect(resolveRelativePath(base, relative)).toBe('data/voice-lectures/exercises/quiz.json');
  });

  it('handles absolute-like paths (starting with /)', () => {
    const base = 'data/voice-lectures/grammar';
    const relative = '/tieu-hoc/data/quiz.json';
    // After filter, this becomes ['tieu-hoc', 'data', 'quiz.json']
    expect(resolveRelativePath(base, relative)).toBe('data/voice-lectures/grammar/tieu-hoc/data/quiz.json');
  });
});

describe('Word Rearrange Exercise Type', () => {
  const sampleWordRearrangeExercise = {
    id: 10,
    type: 'word-rearrange',
    instruction: 'Sắp xếp câu: If I / see John tonight / I / tell him the news',
    words: ['If', 'I', 'see', 'John', 'tonight', ',', 'I', 'will', 'tell', 'him', 'the', 'news.'],
    distractors: ['saw', 'told', 'am'],
    correctSentence: 'If I see John tonight, I will tell him the news.',
    acceptedAnswers: [
      'If I see John tonight, I will tell him the news.',
      "If I see John tonight, I'll tell him the news.",
    ],
    explanation: 'First Conditional: If + present simple, will + base verb',
  };

  it('identifies word-rearrange type', () => {
    expect(sampleWordRearrangeExercise.type).toBe('word-rearrange');
  });

  it('has words array', () => {
    expect(sampleWordRearrangeExercise.words).toBeInstanceOf(Array);
    expect(sampleWordRearrangeExercise.words.length).toBeGreaterThan(0);
  });

  it('has distractors array', () => {
    expect(sampleWordRearrangeExercise.distractors).toBeInstanceOf(Array);
    expect(sampleWordRearrangeExercise.distractors.length).toBe(3);
  });

  it('has correct sentence', () => {
    expect(sampleWordRearrangeExercise.correctSentence).toBe('If I see John tonight, I will tell him the news.');
  });

  it('has accepted answers including contractions', () => {
    expect(sampleWordRearrangeExercise.acceptedAnswers).toHaveLength(2);
    expect(sampleWordRearrangeExercise.acceptedAnswers[1]).toContain("I'll");
  });

  // Test answer normalization
  function normalizeAnswer(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,!?]/g, '');
  }

  it('normalizes answers for comparison', () => {
    expect(normalizeAnswer('If I see John tonight, I will tell him the news.')).toBe(
      'if i see john tonight i will tell him the news'
    );
    expect(normalizeAnswer("If I see John tonight, I'll tell him the news.")).toBe(
      "if i see john tonight i'll tell him the news"
    );
  });

  it('detects correct answer', () => {
    const userAnswer = 'If I see John tonight, I will tell him the news.';
    const isCorrect = sampleWordRearrangeExercise.acceptedAnswers.some(
      (ans) => normalizeAnswer(userAnswer) === normalizeAnswer(ans)
    );
    expect(isCorrect).toBe(true);
  });

  it('detects incorrect answer', () => {
    const userAnswer = 'If I saw John tonight, I told him the news.';
    const isCorrect = sampleWordRearrangeExercise.acceptedAnswers.some(
      (ans) => normalizeAnswer(userAnswer) === normalizeAnswer(ans)
    );
    expect(isCorrect).toBe(false);
  });
});
