/**
 * Render Output Test
 *
 * Outputs rendered HTML for manual inspection.
 * Run with: npm run test:unit -- RenderOutput
 *
 * This test saves HTML files to /tmp for inspection.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseLesson,
  renderMarkdown,
  renderTables,
  extractVocabularySections,
  extractTeacherScripts,
  hasTag,
  getTagContent,
} from '../parser/Parser';

const VOICE_LECTURES_DIR = path.join(__dirname, '../../../data/voice-lectures');
const OUTPUT_DIR = '/tmp/voice-lecture-renders';

const CUSTOM_TAGS = [
  'vocabulary', 'teacher_script', 'dialogue', 'reading', 'translation',
  'grammar', 'task', 'questions', 'answer', 'explanation',
  'pronunciation_theory', 'audio', 'content_table',
];

/**
 * Render markdown content without aggressive <br> conversion
 */
function renderMarkdownClean(md: string): string {
  let html = md;

  // Headings
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Tables
  html = renderTables(html);

  // Lists - unordered
  html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');

  // Lists - ordered (numbered)
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="numbered">$1</li>');

  // Wrap consecutive list items
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('class="numbered"')) {
      return '<ol>' + match.replace(/ class="numbered"/g, '') + '</ol>';
    }
    return '<ul>' + match + '</ul>';
  });

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr>');

  // Paragraphs - only double newlines become paragraph breaks
  html = html.split(/\n\n+/).map(block => {
    block = block.trim();
    if (!block) return '';
    // Don't wrap if already HTML
    if (block.startsWith('<')) return block;
    return `<p>${block}</p>`;
  }).join('\n');

  return html;
}

function renderTag(tag: string, content: string, attrs: string): string {
  const tagClass = tag.replace(/_/g, '-');

  const icons: Record<string, string> = {
    vocabulary: '📚',
    teacher_script: '🎤',
    dialogue: '💬',
    reading: '📖',
    translation: '🌐',
    grammar: '📐',
    task: '📝',
    questions: '❓',
    answer: '✅',
    explanation: '💡',
    pronunciation_theory: '🔊',
    audio: '🎵',
    content_table: '📋',
  };

  const renderedContent = renderMarkdownClean(content);

  return `<div class="${tagClass}" data-testid="${tagClass}"${attrs}>
<div class="tag-header">
<span class="tag-icon">${icons[tag] || '📄'}</span>
<span class="tag-name">${tag.replace(/_/g, ' ')}</span>
</div>
<div class="tag-content">
${renderedContent}
</div>
</div>`;
}

function renderFullHtml(content: string): string {
  let html = content;

  // Process custom tags first (they get their own markdown rendering)
  for (const tag of CUSTOM_TAGS) {
    const regex = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'g');
    html = html.replace(regex, (_, attrs, inner) => renderTag(tag, inner, attrs));
  }

  // Process chunk comments
  html = html.replace(/<!--\s*chunk:\s*(\w+)\s*-->/g, '<div class="chunk-marker" data-chunk="$1">chunk: $1</div>');

  // Render remaining markdown (content outside custom tags)
  html = renderMarkdownClean(html);

  return html;
}

function generatePage(title: string, content: string, stats: any): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    :root {
      --primary: #2563eb;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
    }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      background: #f8fafc;
    }
    h1 { color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 0.5rem; }
    h2 { color: #334155; margin-top: 2rem; }
    h3 { color: #475569; }

    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin: 1rem 0;
    }
    .stat { background: white; padding: 1rem; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 2rem; font-weight: bold; color: var(--primary); }
    .stat-label { color: #64748b; font-size: 0.875rem; }

    .chunk-marker {
      background: #e2e8f0;
      color: #64748b;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin: 1.5rem 0;
      display: inline-block;
    }

    .vocabulary, .dialogue, .reading, .translation, .grammar,
    .task, .questions, .answer, .explanation, .pronunciation-theory,
    .audio, .content-table {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .tag-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .tag-icon { font-size: 1.25rem; }
    .tag-name { font-weight: 600; text-transform: capitalize; color: #334155; }

    .vocabulary { border-left: 4px solid #8b5cf6; }
    .dialogue { border-left: 4px solid #06b6d4; }
    .reading { border-left: 4px solid #14b8a6; }
    .translation { border-left: 4px solid #6366f1; }
    .grammar { border-left: 4px solid #f59e0b; }
    .task { border-left: 4px solid #3b82f6; }
    .questions { border-left: 4px solid #ec4899; }
    .answer { border-left: 4px solid var(--success); }
    .explanation { border-left: 4px solid #eab308; }
    .pronunciation-theory { border-left: 4px solid #f97316; }
    .audio { border-left: 4px solid #a855f7; }

    .teacher-script {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      margin: 1rem 0;
    }

    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #e2e8f0; padding: 0.75rem; text-align: left; }
    th { background: #f1f5f9; }
    tr:hover { background: #f8fafc; }

    ul, ol { margin: 0.5rem 0 0.5rem 1.5rem; }
    strong { color: var(--primary); }
    em { color: #64748b; font-style: italic; }

    .tag-content p { margin: 0.5rem 0; }
  </style>
</head>
<body>
  <h1>${title}</h1>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${stats.chunks}</div>
      <div class="stat-label">Chunks</div>
    </div>
    <div class="stat">
      <div class="stat-value">${stats.vocab}</div>
      <div class="stat-label">Vocab Words</div>
    </div>
    <div class="stat">
      <div class="stat-value">${stats.scripts}</div>
      <div class="stat-label">Scripts</div>
    </div>
    <div class="stat">
      <div class="stat-value">${stats.tags}</div>
      <div class="stat-label">Tags Used</div>
    </div>
  </div>

  <hr>

  ${content}
</body>
</html>`;
}

describe('Render Output', () => {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const testFiles = [
    'g6/unit-07/getting-started.md',
    'g6/unit-07/a-closer-look-1.md',
    'g6/unit-07/skills-2.md',
    'g7/unit-07/getting-started.md',
  ];

  for (const file of testFiles) {
    const filePath = path.join(VOICE_LECTURES_DIR, file);

    it(`renders ${file} to HTML file`, () => {
      if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file} - not found`);
        return;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lesson = parseLesson(content);
      const vocab = extractVocabularySections(content);
      const scripts = extractTeacherScripts(content);
      const tagsUsed = CUSTOM_TAGS.filter(t => hasTag(content, t));

      const stats = {
        chunks: lesson.chunks.length,
        vocab: vocab.reduce((sum, v) => sum + v.words.length, 0),
        scripts: scripts.length,
        tags: tagsUsed.length,
      };

      const renderedContent = renderFullHtml(content);
      const html = generatePage(lesson.title, renderedContent, stats);

      // Save to file
      const outputFile = path.join(OUTPUT_DIR, file.replace(/\//g, '-').replace('.md', '.html'));
      fs.writeFileSync(outputFile, html);

      console.log(`✅ Rendered: ${outputFile}`);

      // Basic assertions
      expect(html).toContain('<h1>');
      expect(html).toContain('data-testid');
    });
  }

  it('creates an index page', () => {
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.html') && f !== 'index.html');

    const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Voice Lecture Renders</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; }
    h1 { color: #2563eb; }
    ul { list-style: none; padding: 0; }
    li { margin: 0.5rem 0; }
    a { color: #2563eb; text-decoration: none; padding: 0.5rem 1rem; display: block; border-radius: 4px; }
    a:hover { background: #e0e7ff; }
  </style>
</head>
<body>
  <h1>Voice Lecture Renders</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <ul>
    ${files.map(f => `<li><a href="${f}">${f}</a></li>`).join('\n')}
  </ul>
</body>
</html>`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), indexHtml);
    console.log(`\n📁 Output directory: ${OUTPUT_DIR}`);
    console.log(`📄 Open: ${OUTPUT_DIR}/index.html`);

    expect(files.length).toBeGreaterThan(0);
  });
});
