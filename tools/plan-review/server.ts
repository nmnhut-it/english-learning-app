import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3005;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Path helpers ---

const ROOT = path.resolve(__dirname, '../..');
const VOICE_LECTURES = path.join(ROOT, 'v2/data/voice-lectures');
const LOIGIAIHAY = path.join(ROOT, 'loigiaihay.com');
const REVIEW_STATUS_FILE = path.join(__dirname, '.review-status.json');

const SECTIONS_6_9 = [
  'getting-started', 'a-closer-look-1', 'a-closer-look-2',
  'communication', 'skills-1', 'skills-2', 'looking-back'
];
const SECTIONS_10_12 = [
  'getting-started', 'language', 'reading', 'speaking',
  'listening', 'writing', 'communication-and-culture-clil', 'looking-back'
];

function gradeToLectureDir(grade: string): string {
  return `g${grade}`;
}

function gradeToSourceDir(grade: string): string {
  return `grade${grade}`;
}

function getSections(grade: number): string[] {
  return grade >= 10 ? SECTIONS_10_12 : SECTIONS_6_9;
}

function getUnitCount(grade: number): number {
  return grade >= 10 ? 10 : 12;
}

function lecturePath(grade: string, unit: string, section: string): string {
  return path.join(VOICE_LECTURES, gradeToLectureDir(grade), unit, `${section}.md`);
}

function sourcePath(grade: string, unit: string, section: string): string {
  return path.join(LOIGIAIHAY, gradeToSourceDir(grade), unit, `${section}.md`);
}

function sourceHtmlPath(grade: string, unit: string, section: string): string {
  return path.join(LOIGIAIHAY, gradeToSourceDir(grade), unit, `${section}.html`);
}

function fileExists(p: string): boolean {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function readFileOr(p: string, fallback: string = ''): string {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return fallback; }
}

// --- Review status persistence ---

function loadReviewStatus(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(REVIEW_STATUS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveReviewStatus(data: Record<string, string>): void {
  fs.writeFileSync(REVIEW_STATUS_FILE, JSON.stringify(data, null, 2));
}

// --- Paragraph coverage analysis ---

function extractParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 10);
}

function normalizeText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')           // strip HTML/XML tags
    .replace(/<!--[\s\S]*?-->/g, '')   // strip comments
    .replace(/\*\*/g, '')              // strip bold markers
    .replace(/\*/g, '')                // strip italic markers
    .replace(/[|]/g, ' ')             // strip table pipes
    .replace(/[-]{3,}/g, '')           // strip horizontal rules
    .replace(/[#]+\s*/g, '')           // strip heading markers
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim()
    .toLowerCase();
}

function editDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Optimization: if strings are very different in length, skip full computation
  if (Math.abs(a.length - b.length) > Math.max(a.length, b.length) * 0.5) {
    return Math.max(a.length, b.length);
  }

  // Use two-row optimization for memory
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);

  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = editDistance(a, b);
  return 1 - dist / maxLen;
}

// Check if shorter text is a substantial substring of longer text
function substringMatch(needle: string, haystack: string): boolean {
  if (needle.length < 15) return false;
  return haystack.includes(needle);
}

interface ParagraphMatch {
  sourceIndex: number;
  sourceParagraph: string;
  sourceNormalized: string;
  bestMatchIndex: number;
  bestMatchParagraph: string;
  similarity: number;
  status: 'found' | 'partial' | 'missing';
}

function analyzeCoverage(sourceText: string, lectureText: string): {
  matches: ParagraphMatch[];
  coverage: number;
  found: number;
  partial: number;
  missing: number;
  total: number;
} {
  const sourceParagraphs = extractParagraphs(sourceText);
  const lectureParagraphs = extractParagraphs(lectureText);

  const sourceNorms = sourceParagraphs.map(normalizeText);
  const lectureNorms = lectureParagraphs.map(normalizeText);
  const lectureFullNorm = normalizeText(lectureText);

  const matches: ParagraphMatch[] = [];

  for (let i = 0; i < sourceParagraphs.length; i++) {
    const sNorm = sourceNorms[i];
    if (sNorm.length < 5) continue;

    let bestSim = 0;
    let bestIdx = -1;

    // First: check substring match against full lecture text
    if (substringMatch(sNorm, lectureFullNorm)) {
      // Find which lecture paragraph contains it
      for (let j = 0; j < lectureParagraphs.length; j++) {
        if (lectureNorms[j].includes(sNorm) || sNorm.includes(lectureNorms[j])) {
          bestSim = 1;
          bestIdx = j;
          break;
        }
      }
      if (bestIdx === -1) {
        bestSim = 0.85;
        bestIdx = 0;
      }
    }

    // If no substring match, try edit distance against each lecture paragraph
    if (bestSim < 0.7) {
      for (let j = 0; j < lectureParagraphs.length; j++) {
        // Optimize: skip very different length paragraphs
        const lenRatio = Math.min(sNorm.length, lectureNorms[j].length) /
                         Math.max(sNorm.length, lectureNorms[j].length);
        if (lenRatio < 0.3) continue;

        const sim = similarity(sNorm, lectureNorms[j]);
        if (sim > bestSim) {
          bestSim = sim;
          bestIdx = j;
        }
      }
    }

    let status: 'found' | 'partial' | 'missing';
    if (bestSim >= 0.7) status = 'found';
    else if (bestSim >= 0.4) status = 'partial';
    else status = 'missing';

    matches.push({
      sourceIndex: i,
      sourceParagraph: sourceParagraphs[i],
      sourceNormalized: sNorm,
      bestMatchIndex: bestIdx,
      bestMatchParagraph: bestIdx >= 0 ? lectureParagraphs[bestIdx] : '',
      similarity: Math.round(bestSim * 100) / 100,
      status,
    });
  }

  const found = matches.filter(m => m.status === 'found').length;
  const partial = matches.filter(m => m.status === 'partial').length;
  const missing = matches.filter(m => m.status === 'missing').length;
  const total = matches.length;

  return {
    matches,
    coverage: total > 0 ? Math.round((found / total) * 100) : 0,
    found,
    partial,
    missing,
    total,
  };
}

// --- Chunk parsing ---

interface Chunk {
  name: string;
  content: string;
  startLine: number;
}

function parseChunks(text: string): Chunk[] {
  const lines = text.split('\n');
  const chunks: Chunk[] = [];
  let currentChunk: Chunk | null = null;
  let buffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/<!--\s*chunk:\s*(.+?)\s*-->/);
    if (match) {
      if (currentChunk) {
        currentChunk.content = buffer.join('\n').trim();
        chunks.push(currentChunk);
      }
      currentChunk = { name: match[1], content: '', startLine: i + 1 };
      buffer = [];
    } else {
      buffer.push(lines[i]);
    }
  }
  if (currentChunk) {
    currentChunk.content = buffer.join('\n').trim();
    chunks.push(currentChunk);
  }
  return chunks;
}

// --- Audio extraction ---

interface AudioRef {
  type: 'source_url' | 'tts_href' | 'audio_tag';
  value: string;
  line: number;
}

function extractAudioRefs(text: string, kind: 'source' | 'lecture'): AudioRef[] {
  const refs: AudioRef[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // [Audio](url) or [🔊 Audio](url)
    const mdLinks = line.matchAll(/\[.*?\]\((https?:\/\/[^\s)]+\.mp3[^\s)]*)\)/g);
    for (const m of mdLinks) {
      refs.push({ type: 'source_url', value: m[1], line: i + 1 });
    }

    // href="audio/..." in teacher_script or audio tags
    const hrefMatches = line.matchAll(/href="([^"]*?\.mp3[^"]*)"/g);
    for (const m of hrefMatches) {
      refs.push({ type: 'tts_href', value: m[1], line: i + 1 });
    }

    // <audio ...> tags
    const audioTags = line.matchAll(/<audio\s+[^>]*src="([^"]+)"/g);
    for (const m of audioTags) {
      refs.push({ type: 'audio_tag', value: m[1], line: i + 1 });
    }
  }
  return refs;
}

// --- Exercise extraction for coverage check ---

function extractExercises(text: string): string[] {
  const matches = text.match(/[Bb]ài\s+\d+/g) || [];
  return [...new Set(matches.map(m => m.toLowerCase()))];
}

// --- API Routes ---

// GET /api/tree — full navigation tree
app.get('/api/tree', (_req, res) => {
  const reviewStatus = loadReviewStatus();
  const grades: any[] = [];

  for (let g = 6; g <= 12; g++) {
    const sections = getSections(g);
    const unitCount = getUnitCount(g);
    const units: any[] = [];

    for (let u = 1; u <= unitCount; u++) {
      const unitStr = `unit-${String(u).padStart(2, '0')}`;
      const sectionList: any[] = [];

      for (const section of sections) {
        const key = `${g}/${unitStr}/${section}`;
        const hasLecture = fileExists(lecturePath(String(g), unitStr, section));
        const hasSource = fileExists(sourcePath(String(g), unitStr, section));
        sectionList.push({
          name: section,
          hasLecture,
          hasSource,
          status: reviewStatus[key] || 'unreviewed',
        });
      }

      units.push({ name: unitStr, sections: sectionList });
    }

    grades.push({ grade: g, units });
  }

  res.json({ grades });
});

// GET /api/content/:grade/:unit/:section
app.get('/api/content/:grade/:unit/:section', (req, res) => {
  const { grade, unit, section } = req.params;
  const lecture = readFileOr(lecturePath(grade, unit, section));
  const source = readFileOr(sourcePath(grade, unit, section));
  const sourceHtml = readFileOr(sourceHtmlPath(grade, unit, section));

  const lectureChunks = lecture ? parseChunks(lecture) : [];

  res.json({ lecture, source, sourceHtml, lectureChunks });
});

// PUT /api/content/:grade/:unit/:section/lecture
app.put('/api/content/:grade/:unit/:section/lecture', (req, res) => {
  const { grade, unit, section } = req.params;
  const { content } = req.body;
  const filePath = lecturePath(grade, unit, section);

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/content/:grade/:unit/:section/source
app.put('/api/content/:grade/:unit/:section/source', (req, res) => {
  const { grade, unit, section } = req.params;
  const { content } = req.body;
  const filePath = sourcePath(grade, unit, section);

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf-8');
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analyze/:grade/:unit/:section — paragraph coverage analysis
app.get('/api/analyze/:grade/:unit/:section', (req, res) => {
  const { grade, unit, section } = req.params;
  const source = readFileOr(sourcePath(grade, unit, section));
  const lecture = readFileOr(lecturePath(grade, unit, section));

  if (!source) return res.status(404).json({ error: 'Source file not found' });
  if (!lecture) return res.status(404).json({ error: 'Lecture file not found' });

  const result = analyzeCoverage(source, lecture);
  res.json(result);
});

// GET /api/audio-audit/:grade/:unit/:section
app.get('/api/audio-audit/:grade/:unit/:section', (req, res) => {
  const { grade, unit, section } = req.params;
  const source = readFileOr(sourcePath(grade, unit, section));
  const lecture = readFileOr(lecturePath(grade, unit, section));

  const sourceAudio = extractAudioRefs(source, 'source');
  const lectureAudio = extractAudioRefs(lecture, 'lecture');

  res.json({ sourceAudio, lectureAudio });
});

// GET /api/coverage — full coverage report
app.get('/api/coverage', (_req, res) => {
  const reviewStatus = loadReviewStatus();
  const report: any[] = [];

  for (let g = 6; g <= 12; g++) {
    const sections = getSections(g);
    const unitCount = getUnitCount(g);

    for (let u = 1; u <= unitCount; u++) {
      const unitStr = `unit-${String(u).padStart(2, '0')}`;

      for (const section of sections) {
        const key = `${g}/${unitStr}/${section}`;
        const hasLecture = fileExists(lecturePath(String(g), unitStr, section));
        const hasSource = fileExists(sourcePath(String(g), unitStr, section));
        const sourceText = hasSource ? readFileOr(sourcePath(String(g), unitStr, section)) : '';
        const lectureText = hasLecture ? readFileOr(lecturePath(String(g), unitStr, section)) : '';

        const sourceExercises = sourceText ? extractExercises(sourceText) : [];
        const lectureExercises = lectureText ? extractExercises(lectureText) : [];
        const missingExercises = sourceExercises.filter(e => !lectureExercises.includes(e));

        report.push({
          key,
          grade: g,
          unit: unitStr,
          section,
          hasLecture,
          hasSource,
          status: reviewStatus[key] || 'unreviewed',
          sourceExerciseCount: sourceExercises.length,
          lectureExerciseCount: lectureExercises.length,
          missingExercises,
        });
      }
    }
  }

  res.json({ report });
});

// GET /api/review-status
app.get('/api/review-status', (_req, res) => {
  res.json(loadReviewStatus());
});

// PUT /api/review-status/:grade/:unit/:section
app.put('/api/review-status/:grade/:unit/:section', (req, res) => {
  const { grade, unit, section } = req.params;
  const { status } = req.body;
  const key = `${grade}/${unit}/${section}`;
  const data = loadReviewStatus();
  data[key] = status;
  saveReviewStatus(data);
  res.json({ ok: true });
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Plan Review Tool running at http://localhost:${PORT}`);
});
