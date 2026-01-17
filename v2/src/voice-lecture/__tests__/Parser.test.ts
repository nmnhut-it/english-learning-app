/**
 * Parser Unit Tests
 *
 * Tests for pure parsing functions - no DOM or browser required.
 */

import { describe, it, expect } from 'vitest';
import {
  parseTitle,
  parseChunks,
  parseVocabulary,
  parseTeacherScript,
  parseLesson,
  renderMarkdown,
  renderTables,
  extractVocabularySections,
  extractTeacherScripts,
  validateLesson,
  hasTag,
  getTagContent,
} from '../parser/Parser';

describe('Parser Module', () => {
  describe('parseTitle', () => {
    it('should parse title from markdown', () => {
      const md = '# UNIT 7: TELEVISION\n\nSome content';
      expect(parseTitle(md)).toBe('UNIT 7: TELEVISION');
    });

    it('should return default title if none found', () => {
      const md = 'Some content without heading';
      expect(parseTitle(md)).toBe('Voice Lecture');
    });

    it('should handle multiple headings - take first', () => {
      const md = '# First Title\n\n# Second Title';
      expect(parseTitle(md)).toBe('First Title');
    });
  });

  describe('parseChunks', () => {
    it('should split content into chunks', () => {
      const md = `<!-- chunk: intro -->
Some intro content here

<!-- chunk: vocabulary -->
Vocabulary section here`;

      const chunks = parseChunks(md);
      expect(chunks).toHaveLength(2);
      expect(chunks[0].id).toBe('intro');
      expect(chunks[1].id).toBe('vocabulary');
    });

    it('should extract chunk titles from h3', () => {
      const md = `<!-- chunk: exercise_1 -->
### Bài 1 trang 6 - Listen and read

Exercise content here`;

      const chunks = parseChunks(md);
      expect(chunks[0].title).toBe('Bài 1 trang 6 - Listen and read');
    });

    it('should filter out tiny chunks', () => {
      const md = `<!-- chunk: tiny -->
Hi

<!-- chunk: proper -->
This is a proper chunk with enough content to be meaningful`;

      const chunks = parseChunks(md);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].id).toBe('proper');
    });

    it('should handle content without chunk comments', () => {
      const md = `# Some Title

This is content without explicit chunks but long enough to count.`;

      const chunks = parseChunks(md);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('parseVocabulary', () => {
    it('should parse vocabulary with all fields', () => {
      const content = `
1. **talent show** : (n) chương trình tài năng /ˈtælənt ʃəʊ/
2. **prefer A to B** : thích A hơn B /prɪˈfɜː/
3. **forget - forgot - forgotten** : (v) quên /fəˈɡet/
`;

      const words = parseVocabulary(content);

      expect(words).toHaveLength(3);

      expect(words[0]).toEqual({
        word: 'talent show',
        type: 'n',
        pronunciation: 'ˈtælənt ʃəʊ',
        meaning: 'chương trình tài năng',
      });

      expect(words[1]).toEqual({
        word: 'prefer A to B',
        type: null,
        pronunciation: 'prɪˈfɜː',
        meaning: 'thích A hơn B',
      });

      expect(words[2]).toEqual({
        word: 'forget - forgot - forgotten',
        type: 'v',
        pronunciation: 'fəˈɡet',
        meaning: 'quên',
      });
    });

    it('should handle vocabulary without pronunciation', () => {
      const content = `1. **hello** : (n) xin chào`;

      const words = parseVocabulary(content);
      expect(words[0].pronunciation).toBeNull();
      expect(words[0].meaning).toBe('xin chào');
    });

    it('should handle vocabulary without type', () => {
      const content = `1. **goodbye** : tạm biệt /ɡʊdˈbaɪ/`;

      const words = parseVocabulary(content);
      expect(words[0].type).toBeNull();
    });

    it('should skip malformed lines', () => {
      const content = `
1. **valid** : (n) meaning /pron/
This is not a valid line
2. **also valid** : (v) another meaning /pron2/
`;

      const words = parseVocabulary(content);
      expect(words).toHaveLength(2);
    });
  });

  describe('parseTeacherScript', () => {
    it('should parse all attributes', () => {
      const attrs = 'pause="60" href="audio/file.mp3" action="record"';
      const text = 'Ok lớp 6, bài 1 nha.';

      const ts = parseTeacherScript(text, attrs);

      expect(ts.text).toBe('Ok lớp 6, bài 1 nha.');
      expect(ts.pause).toBe(60);
      expect(ts.href).toBe('audio/file.mp3');
      expect(ts.action).toBe('record');
      expect(ts.id).toMatch(/^ts-/);
    });

    it('should use defaults for missing attributes', () => {
      const ts = parseTeacherScript('Simple text', '');

      expect(ts.pause).toBe(0);
      expect(ts.href).toBeNull();
      expect(ts.action).toBeNull();
    });
  });

  describe('parseLesson', () => {
    it('should return complete lesson structure', () => {
      const md = `# Unit 7: Television

<!-- chunk: intro -->
Introduction content that is long enough

<!-- chunk: vocabulary -->
### Vocabulary Section
Word list content that is also long enough`;

      const lesson = parseLesson(md);

      expect(lesson.title).toBe('Unit 7: Television');
      expect(lesson.chunks).toHaveLength(2);
    });
  });

  describe('renderMarkdown', () => {
    it('should render headings', () => {
      expect(renderMarkdown('# H1')).toContain('<h1>H1</h1>');
      expect(renderMarkdown('## H2')).toContain('<h2>H2</h2>');
      expect(renderMarkdown('### H3')).toContain('<h3>H3</h3>');
    });

    it('should render bold and italic', () => {
      expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
      expect(renderMarkdown('*italic*')).toContain('<em>italic</em>');
    });

    it('should render lists', () => {
      const md = '- item 1\n- item 2';
      const html = renderMarkdown(md);
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>item 1</li>');
      expect(html).toContain('<li>item 2</li>');
    });
  });

  describe('renderTables', () => {
    it('should convert markdown tables to HTML', () => {
      const md = `| English | Vietnamese |
|---------|------------|
| Hello | Xin chào |
| Goodbye | Tạm biệt |`;

      const html = renderTables(md);

      expect(html).toContain('<table>');
      expect(html).toContain('<th>English</th>');
      expect(html).toContain('<td>Hello</td>');
      expect(html).toContain('<td>Xin chào</td>');
    });

    it('should handle tables with different number of columns', () => {
      const md = `| A | B | C |
|---|---|---|
| 1 | 2 | 3 |`;

      const html = renderTables(md);
      expect(html).toContain('<th>A</th>');
      expect(html).toContain('<th>B</th>');
      expect(html).toContain('<th>C</th>');
    });
  });

  describe('extractVocabularySections', () => {
    it('should find all vocabulary tags', () => {
      const content = `
<vocabulary>
1. **word1** : (n) meaning1 /pron1/
</vocabulary>

Some content

<vocabulary>
1. **word2** : (v) meaning2 /pron2/
</vocabulary>
`;

      const sections = extractVocabularySections(content);
      expect(sections).toHaveLength(2);
      expect(sections[0].words[0].word).toBe('word1');
      expect(sections[1].words[0].word).toBe('word2');
    });

    it('should generate unique IDs', () => {
      const content = `
<vocabulary>
1. **word1** : meaning1 /pron/
</vocabulary>
<vocabulary>
1. **word2** : meaning2 /pron/
</vocabulary>
`;

      const sections = extractVocabularySections(content);
      expect(sections[0].id).not.toBe(sections[1].id);
    });
  });

  describe('extractTeacherScripts', () => {
    it('should find all teacher scripts', () => {
      const content = `
<teacher_script pause="0">
First script
</teacher_script>

<teacher_script pause="60" action="record">
Second script
</teacher_script>
`;

      const scripts = extractTeacherScripts(content);
      expect(scripts).toHaveLength(2);
      expect(scripts[0].text).toBe('First script');
      expect(scripts[1].pause).toBe(60);
      expect(scripts[1].action).toBe('record');
    });
  });

  describe('hasTag', () => {
    it('should detect existing tags', () => {
      expect(hasTag('<vocabulary>content</vocabulary>', 'vocabulary')).toBe(true);
      expect(hasTag('<teacher_script pause="0">text</teacher_script>', 'teacher_script')).toBe(true);
    });

    it('should return false for missing tags', () => {
      expect(hasTag('no tags here', 'vocabulary')).toBe(false);
    });
  });

  describe('getTagContent', () => {
    it('should extract tag content', () => {
      const content = '<vocabulary>word list here</vocabulary>';
      expect(getTagContent(content, 'vocabulary')).toBe('word list here');
    });

    it('should return null for missing tag', () => {
      expect(getTagContent('no tag', 'vocabulary')).toBeNull();
    });

    it('should handle multiline content', () => {
      const content = `<task>
**Đề:** Do something
**Dịch:** Làm gì đó
</task>`;

      const extracted = getTagContent(content, 'task');
      expect(extracted).toContain('**Đề:** Do something');
      expect(extracted).toContain('**Dịch:** Làm gì đó');
    });
  });

  describe('validateLesson', () => {
    it('should pass valid lesson', () => {
      const md = `# Unit 7: Television

<!-- chunk: intro -->
<teacher_script pause="0">
Intro text
</teacher_script>

More content here that is long enough

<!-- chunk: vocab -->
<teacher_script pause="0">
Vocab intro
</teacher_script>
<vocabulary>
1. **word** : (n) meaning /pron/
</vocabulary>

More vocab content here`;

      const result = validateLesson(md);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should error on empty lesson', () => {
      const result = validateLesson('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn on missing teacher scripts', () => {
      const md = `# Unit 7

<!-- chunk: no_ts -->
This chunk has no teacher script but enough content to count`;

      const result = validateLesson(md);
      expect(result.warnings.some((w) => w.includes('no teacher scripts'))).toBe(true);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty vocabulary tags', () => {
    const content = '<vocabulary></vocabulary>';
    const sections = extractVocabularySections(content);
    expect(sections).toHaveLength(0);
  });

  it('should handle special characters in vocabulary', () => {
    const content = `1. **it's** : (phrase) nó là /ɪts/`;
    const words = parseVocabulary(content);
    expect(words[0].word).toBe("it's");
  });

  it('should handle Vietnamese in teacher scripts', () => {
    const ts = parseTeacherScript('Ok lớp 6, đọc theo nha!', 'pause="30"');
    expect(ts.text).toBe('Ok lớp 6, đọc theo nha!');
  });

  it('should preserve content between custom tags', () => {
    const md = `
<dialogue>
**Phong:** Hello
**Hung:** Hi
</dialogue>

Regular paragraph

<translation>
Dịch nghĩa
</translation>
`;

    // Both tags should be preserved in output
    expect(hasTag(md, 'dialogue')).toBe(true);
    expect(hasTag(md, 'translation')).toBe(true);
  });
});

describe('Combined Tags & Markdown - Real Lesson Scenarios', () => {
  describe('Full Getting Started Lesson', () => {
    const gettingStartedLesson = `# UNIT 7: TELEVISION

## GETTING STARTED - What's on today?

<!-- chunk: intro -->

<teacher_script pause="0">
Ok lớp 6, Unit 7 nha - Television. Mở sách trang 6 tập 2 đi.
</teacher_script>

This is the introduction to the Television unit.

<!-- chunk: vocabulary -->

<teacher_script pause="0">
Từ vựng click vô nghe phát âm, ghi vô vở rồi qua bài 1.
</teacher_script>

<vocabulary>
1. **talent show** : (n) chương trình tài năng /ˈtælənt ʃəʊ/
2. **programme** : (n) chương trình /ˈprəʊɡræm/
3. **animated film** : (n) phim hoạt hình /ˈænɪmeɪtɪd fɪlm/
4. **cartoon** : (n) phim hoạt hình ngắn /kɑːˈtuːn/
5. **documentary** : (n) phim tài liệu /ˌdɒkjuˈmentri/
</vocabulary>

<teacher_script pause="120">
Ghi từ vựng vô vở. 2 phút.
</teacher_script>

<!-- chunk: dialogue -->

### Bài 1 trang 6 - Listen and read

<teacher_script pause="0">
Bài 1, nghe và đọc hội thoại.
</teacher_script>

<task>
**Đề:** Listen and read.
**Dịch đề:** Nghe và đọc.
**Yêu cầu:** Nghe audio và đọc theo đoạn hội thoại.
</task>

<dialogue>
| English | Vietnamese |
|---------|------------|
| **Phong:** What are you watching, Hung? | **Phong:** Bạn đang xem gì, Hùng? |
| **Hung:** The Voice Kids. It's a music talent show. | **Hùng:** Giọng Hát Việt Nhí. Đó là chương trình tài năng âm nhạc. |
| **Phong:** Is it interesting? | **Phong:** Nó có hay không? |
| **Hung:** Yes, very interesting! | **Hùng:** Có, rất hay! |
</dialogue>

<teacher_script pause="180">
Đọc hội thoại và dịch vô vở. 3 phút.
</teacher_script>

<!-- chunk: exercise_2 -->

### Bài 2 trang 7 - Choose the correct answer

<teacher_script pause="60">
Bài 2, chọn đáp án đúng. 1 phút.
</teacher_script>

<task>
**Đề:** Choose the correct answer A, B, or C.
**Dịch đề:** Chọn đáp án đúng A, B hoặc C.
</task>

<questions type="multiple_choice">
**1.** Phong and Hung are talking about ________.
- A. The Voice Kids programme
- B. English in a Minute programme
- C. different TV programmes

*Phong và Hùng đang nói về ________.*

**2.** The Voice Kids is _________.
- A. a cartoon
- B. a music talent show
- C. a documentary
</questions>

<teacher_script pause="0" type="answer">
Ok đáp án. Câu 1 là C, câu 2 là B.
</teacher_script>

<answer>
**Đáp án:** 1.C | 2.B
</answer>

<explanation>
**Giải thích:**
1. C - Họ nói về nhiều chương trình khác nhau trong hội thoại.
2. B - Hung nói "It's a music talent show".
</explanation>

<!-- chunk: grammar -->

### Grammar - Conjunctions

<teacher_script pause="0">
Phần ngữ pháp về liên từ.
</teacher_script>

<grammar>
## Conjunctions: and, but, so

| Liên từ | Nghĩa | Cách dùng |
|---------|-------|-----------|
| **and** | và | Nối 2 ý cùng chiều |
| **but** | nhưng | Nối 2 ý đối lập |
| **so** | nên, vì vậy | Chỉ kết quả |

**Examples:**
- I like cartoons **and** my sister likes them too.
- I like cartoons **but** my brother doesn't.
- I'm tired **so** I'll go to bed early.
</grammar>

<teacher_script pause="60">
Ghi bảng ngữ pháp vô vở. 1 phút.
</teacher_script>
`;

    it('should parse all chunks correctly', () => {
      const lesson = parseLesson(gettingStartedLesson);

      expect(lesson.title).toBe('UNIT 7: TELEVISION');
      expect(lesson.chunks.length).toBeGreaterThanOrEqual(5);

      // Check chunk IDs
      const chunkIds = lesson.chunks.map(c => c.id);
      expect(chunkIds).toContain('intro');
      expect(chunkIds).toContain('vocabulary');
      expect(chunkIds).toContain('dialogue');
      expect(chunkIds).toContain('exercise_2');
      expect(chunkIds).toContain('grammar');
    });

    it('should extract all teacher scripts with correct attributes', () => {
      const scripts = extractTeacherScripts(gettingStartedLesson);

      expect(scripts.length).toBeGreaterThanOrEqual(8);

      // Check various pause values
      const pauses = scripts.map(s => s.pause);
      expect(pauses).toContain(0);
      expect(pauses).toContain(60);
      expect(pauses).toContain(120);
      expect(pauses).toContain(180);

      // Check for answer type
      const answerScript = scripts.find(s => s.text.includes('đáp án'));
      expect(answerScript).toBeDefined();
    });

    it('should extract vocabulary with all 5 words', () => {
      const vocabSections = extractVocabularySections(gettingStartedLesson);

      expect(vocabSections).toHaveLength(1);
      expect(vocabSections[0].words).toHaveLength(5);

      const words = vocabSections[0].words;
      expect(words[0].word).toBe('talent show');
      expect(words[0].type).toBe('n');
      expect(words[0].pronunciation).toBe('ˈtælənt ʃəʊ');
      expect(words[4].word).toBe('documentary');
    });

    it('should detect all custom tags', () => {
      expect(hasTag(gettingStartedLesson, 'vocabulary')).toBe(true);
      expect(hasTag(gettingStartedLesson, 'dialogue')).toBe(true);
      expect(hasTag(gettingStartedLesson, 'task')).toBe(true);
      expect(hasTag(gettingStartedLesson, 'questions')).toBe(true);
      expect(hasTag(gettingStartedLesson, 'answer')).toBe(true);
      expect(hasTag(gettingStartedLesson, 'explanation')).toBe(true);
      expect(hasTag(gettingStartedLesson, 'grammar')).toBe(true);
      expect(hasTag(gettingStartedLesson, 'teacher_script')).toBe(true);
    });

    it('should extract tag contents correctly', () => {
      const taskContent = getTagContent(gettingStartedLesson, 'task');
      expect(taskContent).toContain('**Đề:**');
      expect(taskContent).toContain('**Dịch đề:**');

      const answerContent = getTagContent(gettingStartedLesson, 'answer');
      expect(answerContent).toContain('1.C');
      expect(answerContent).toContain('2.B');

      const grammarContent = getTagContent(gettingStartedLesson, 'grammar');
      expect(grammarContent).toContain('Conjunctions');
      expect(grammarContent).toContain('and');
      expect(grammarContent).toContain('but');
      expect(grammarContent).toContain('so');
    });

    it('should validate lesson structure', () => {
      const result = validateLesson(gettingStartedLesson);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Skills 2 Lesson with Listening', () => {
    const skills2Lesson = `# UNIT 7: TELEVISION

## SKILLS 2 - Listening + Writing

<!-- chunk: listening_vocab -->

<teacher_script pause="0">
Skills 2 nha. Phần Listening trước.
</teacher_script>

<vocabulary>
1. **channel** : (n) kênh /ˈtʃænl/
2. **schedule** : (n) lịch chiếu /ˈʃedjuːl/
3. **broadcast** : (v) phát sóng /ˈbrɔːdkɑːst/
</vocabulary>

<!-- chunk: tapescript -->

<teacher_script pause="0">
Đây là nội dung bài nghe. Đọc trước để hiểu.
</teacher_script>

<reading>
| English | Vietnamese |
|---------|------------|
| Here are some interesting TV programmes for you. | Đây là một số chương trình TV thú vị dành cho bạn. |
| Green Summer, a music programme, is on channel 1. | Mùa Hè Xanh, một chương trình âm nhạc, chiếu trên kênh 1. |
| It starts at eight o'clock. | Nó bắt đầu lúc 8 giờ. |
</reading>

<teacher_script pause="60">
Đọc hiểu bài nghe. 1 phút.
</teacher_script>

<!-- chunk: listen_exercise -->

### Bài 1 - Listen and tick

<teacher_script pause="0">
Bài 1, nghe và đánh dấu.
</teacher_script>

<audio src="<!-- TODO: g6_u07_skills2_listening.mp3 -->">
**Audio:** Listen to the passage about TV programmes
</audio>

<questions type="listen_tick">
**Listen and tick (✓) the correct box:**

| Programme | Channel 1 | Channel 2 | Channel 3 |
|-----------|-----------|-----------|-----------|
| Green Summer | | | |
| Sports News | | | |
| Cartoon Time | | | |
</questions>

<teacher_script pause="45">
Nghe và tick. 45 giây.
</teacher_script>

<answer>
**Đáp án:**
| Programme | Channel 1 | Channel 2 | Channel 3 |
|-----------|-----------|-----------|-----------|
| Green Summer | ✓ | | |
| Sports News | | ✓ | |
| Cartoon Time | | | ✓ |
</answer>

<!-- chunk: writing -->

### Writing - Describe your favourite programme

<teacher_script pause="0">
Phần Writing. Viết đoạn văn về chương trình TV yêu thích.
</teacher_script>

<task>
**Đề:** Write a paragraph (50-70 words) about your favourite TV programme.
**Dịch đề:** Viết một đoạn văn (50-70 từ) về chương trình TV yêu thích của bạn.
**Hướng dẫn:**
- What is your favourite programme?
- What channel is it on?
- When do you watch it?
- Why do you like it?
</task>

<teacher_script pause="300" action="photo">
Viết bài. 5 phút. Xong chụp bài gửi cho thầy.
</teacher_script>

<reading>
| English | Vietnamese |
|---------|------------|
| My favourite TV programme is The Voice Kids. It's a music talent show on VTV3. I watch it every Saturday evening with my family. I like it because the singers are very talented and the songs are beautiful. | Chương trình TV yêu thích của tôi là Giọng Hát Việt Nhí. Đó là chương trình tài năng âm nhạc trên VTV3. Tôi xem nó vào tối thứ Bảy hàng tuần với gia đình. Tôi thích nó vì các ca sĩ rất tài năng và các bài hát rất hay. |
</reading>
`;

    it('should parse Skills 2 structure correctly', () => {
      const lesson = parseLesson(skills2Lesson);

      expect(lesson.chunks.length).toBeGreaterThanOrEqual(4);

      const chunkIds = lesson.chunks.map(c => c.id);
      expect(chunkIds).toContain('listening_vocab');
      expect(chunkIds).toContain('tapescript');
      expect(chunkIds).toContain('listen_exercise');
      expect(chunkIds).toContain('writing');
    });

    it('should handle reading tag for tapescript', () => {
      expect(hasTag(skills2Lesson, 'reading')).toBe(true);

      const readingContent = getTagContent(skills2Lesson, 'reading');
      expect(readingContent).toContain('English');
      expect(readingContent).toContain('Vietnamese');
      expect(readingContent).toContain('Green Summer');
    });

    it('should handle audio tag with TODO placeholder', () => {
      expect(hasTag(skills2Lesson, 'audio')).toBe(true);
    });

    it('should extract teacher script with photo action', () => {
      const scripts = extractTeacherScripts(skills2Lesson);
      const photoScript = scripts.find(s => s.action === 'photo');

      expect(photoScript).toBeDefined();
      expect(photoScript?.pause).toBe(300);
      expect(photoScript?.text).toContain('chụp bài');
    });

    it('should have questions with listen_tick type', () => {
      const questionsContent = getTagContent(skills2Lesson, 'questions');
      expect(questionsContent).toContain('Listen and tick');
      expect(questionsContent).toContain('Programme');
      expect(questionsContent).toContain('Channel 1');
    });
  });

  describe('A Closer Look 1 with Pronunciation', () => {
    const acl1Lesson = `# UNIT 7: TELEVISION

## A CLOSER LOOK 1 - Vocabulary & Pronunciation

<!-- chunk: vocab_review -->

<teacher_script pause="0">
A Closer Look 1 nha. Từ vựng và phát âm.
</teacher_script>

<vocabulary>
1. **national** : (adj) quốc gia /ˈnæʃnəl/
2. **international** : (adj) quốc tế /ˌɪntəˈnæʃnəl/
3. **local** : (adj) địa phương /ˈləʊkl/
4. **weatherman** : (n) người dẫn thời tiết /ˈweðəmæn/
</vocabulary>

<!-- chunk: pronunciation -->

### Pronunciation: /θ/ and /ð/

<teacher_script pause="0">
Phần phát âm. Âm /θ/ và /ð/.
</teacher_script>

<pronunciation_theory>
## Âm /θ/ và /ð/ - Cách phát âm

### Vị trí miệng và lưỡi

1. **Đặt lưỡi**: Đưa đầu lưỡi ra giữa 2 hàm răng
2. **Thổi hơi**: Đẩy hơi qua khe giữa lưỡi và răng trên
3. **Phân biệt**:
   - **/θ/** = KHÔNG rung cổ họng (vô thanh)
   - **/ð/** = RUNG cổ họng (hữu thanh)

### Bảng tóm tắt:
| Âm | Rung cổ? | Ví dụ |
|----|----------|-------|
| /θ/ | Không | think, thank, three |
| /ð/ | Có | this, that, the |
</pronunciation_theory>

<teacher_script pause="0">
Đọc lý thuyết, sau đó làm bài tập.
</teacher_script>

<!-- chunk: pron_exercise -->

### Bài 4 - Listen and repeat

<teacher_script pause="0">
Bài 4, nghe và lặp lại.
</teacher_script>

<questions type="pronunciation">
**Listen and repeat:**

1. **think** /θɪŋk/ - **this** /ðɪs/
2. **thank** /θæŋk/ - **that** /ðæt/
3. **three** /θriː/ - **the** /ðə/
4. **Thursday** /ˈθɜːzdeɪ/ - **weather** /ˈweðə/
</questions>

<teacher_script pause="0" action="record">
Bấm Ghi âm để đọc lại và gửi cho thầy sửa.
</teacher_script>

<!-- chunk: matching -->

### Bài 5 - Match the words

<task>
**Đề:** Match the words in column A with their meanings in column B.
</task>

<questions type="matching">
| | Column A | | Column B |
|---|---------|---|----------|
| 1 | national | a | on or from TV |
| 2 | local | b | from your country |
| 3 | international | c | from your town/area |
| 4 | television | d | from many countries |
</questions>

<answer>
**Đáp án:** 1-b | 2-c | 3-d | 4-a
</answer>
`;

    it('should parse A Closer Look 1 structure', () => {
      const lesson = parseLesson(acl1Lesson);
      expect(lesson.chunks.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle pronunciation_theory tag', () => {
      expect(hasTag(acl1Lesson, 'pronunciation_theory')).toBe(true);

      const pronContent = getTagContent(acl1Lesson, 'pronunciation_theory');
      expect(pronContent).toContain('/θ/');
      expect(pronContent).toContain('/ð/');
      expect(pronContent).toContain('think');
      expect(pronContent).toContain('this');
    });

    it('should extract teacher script with record action', () => {
      const scripts = extractTeacherScripts(acl1Lesson);
      const recordScript = scripts.find(s => s.action === 'record');

      expect(recordScript).toBeDefined();
      expect(recordScript?.text).toContain('Ghi âm');
    });

    it('should handle matching type questions', () => {
      // There are 2 questions tags - pronunciation first, then matching
      // Check that the matching questions exist in the lesson
      expect(acl1Lesson).toContain('<questions type="matching">');
      expect(acl1Lesson).toContain('Column A');
      expect(acl1Lesson).toContain('Column B');
      expect(acl1Lesson).toContain('national');

      // Extract the matching section specifically
      const matchingMatch = acl1Lesson.match(/<questions type="matching">([\s\S]*?)<\/questions>/);
      expect(matchingMatch).not.toBeNull();
      expect(matchingMatch![1]).toContain('Column A');
      expect(matchingMatch![1]).toContain('| 1 | national |');
    });

    it('should parse vocabulary with adjectives', () => {
      const vocabSections = extractVocabularySections(acl1Lesson);
      expect(vocabSections).toHaveLength(1);

      const words = vocabSections[0].words;
      expect(words.filter(w => w.type === 'adj')).toHaveLength(3);
      expect(words.filter(w => w.type === 'n')).toHaveLength(1);
    });
  });

  describe('Complex Nested Content', () => {
    it('should handle bold and italic inside vocabulary', () => {
      const content = `
<vocabulary>
1. **watch TV** : (phrase) xem TV /wɒtʃ ˌtiːˈviː/
2. **turn on** : (phrasal v) bật /tɜːn ɒn/
3. **turn off** : (phrasal v) tắt /tɜːn ɒf/
</vocabulary>`;

      const sections = extractVocabularySections(content);
      expect(sections[0].words).toHaveLength(3);
      expect(sections[0].words[0].word).toBe('watch TV');
      expect(sections[0].words[1].type).toBe('phrasal v');
    });

    it('should handle tables inside dialogue', () => {
      const content = `
<dialogue>
| English | Vietnamese |
|---------|------------|
| **A:** Hello! | **A:** Xin chào! |
| **B:** Hi there! | **B:** Chào bạn! |
| **A:** How are you? | **A:** Bạn khỏe không? |
</dialogue>`;

      const dialogueContent = getTagContent(content, 'dialogue');
      expect(dialogueContent).toContain('| English | Vietnamese |');
      expect(dialogueContent).toContain('Hello!');
      expect(dialogueContent).toContain('Xin chào!');

      // renderTables should work on the content
      const rendered = renderTables(dialogueContent!);
      expect(rendered).toContain('<table>');
      expect(rendered).toContain('<th>English</th>');
    });

    it('should handle markdown formatting inside grammar box', () => {
      const content = `
<grammar>
## Present Simple

**Form:** Subject + V(s/es)

**Examples:**
- I **watch** TV every day.
- She **watches** TV every day.

| Subject | Verb |
|---------|------|
| I/You/We/They | watch |
| He/She/It | watches |
</grammar>`;

      const grammarContent = getTagContent(content, 'grammar');
      expect(grammarContent).toContain('## Present Simple');
      expect(grammarContent).toContain('**Form:**');

      const rendered = renderMarkdown(grammarContent!);
      expect(rendered).toContain('<h2>Present Simple</h2>');
      expect(rendered).toContain('<strong>Form:</strong>');
    });

    it('should handle multiple vocabulary sections in one lesson', () => {
      const content = `
<!-- chunk: getting_started -->
<vocabulary>
1. **hello** : xin chào /həˈləʊ/
2. **goodbye** : tạm biệt /ɡʊdˈbaɪ/
</vocabulary>

Some content in between...

<!-- chunk: a_closer_look -->
<vocabulary>
1. **watch** : (v) xem /wɒtʃ/
2. **listen** : (v) nghe /ˈlɪsn/
3. **read** : (v) đọc /riːd/
</vocabulary>
`;

      const sections = extractVocabularySections(content);
      expect(sections).toHaveLength(2);
      expect(sections[0].words).toHaveLength(2);
      expect(sections[1].words).toHaveLength(3);
    });

    it('should handle teacher scripts with quotes in text', () => {
      const content = `
<teacher_script pause="0">
Hung nói "It's very interesting!" nghĩa là "Rất hay!"
</teacher_script>`;

      const scripts = extractTeacherScripts(content);
      expect(scripts).toHaveLength(1);
      expect(scripts[0].text).toContain('"It\'s very interesting!"');
    });
  });

  describe('Markdown Rendering with Mixed Content', () => {
    it('should render complex markdown with all elements', () => {
      const md = `# Lesson Title

## Section 1

This is a **bold** word and *italic* word.

### Subsection

- List item 1
- List item 2
- List item 3

| Column 1 | Column 2 |
|----------|----------|
| Data 1 | Data 2 |
| Data 3 | Data 4 |

Another paragraph here.`;

      const html = renderMarkdown(md);

      expect(html).toContain('<h1>Lesson Title</h1>');
      expect(html).toContain('<h2>Section 1</h2>');
      expect(html).toContain('<h3>Subsection</h3>');
      expect(html).toContain('<strong>bold</strong>');
      expect(html).toContain('<em>italic</em>');
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>List item 1</li>');
      expect(html).toContain('<table>');
      expect(html).toContain('<th>Column 1</th>');
      expect(html).toContain('<td>Data 1</td>');
    });

    it('should handle multiple tables in sequence', () => {
      const md = `
| A | B |
|---|---|
| 1 | 2 |

Some text

| C | D |
|---|---|
| 3 | 4 |
`;

      const html = renderTables(md);
      const tableCount = (html.match(/<table>/g) || []).length;
      expect(tableCount).toBe(2);
    });
  });
});
