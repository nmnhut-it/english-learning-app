#!/usr/bin/env npx ts-node
/**
 * CLI tool to render voice lecture markdown to HTML for inspection
 *
 * Usage:
 *   npx ts-node src/voice-lecture/tools/render-cli.ts <markdown-file>
 *   npx ts-node src/voice-lecture/tools/render-cli.ts <markdown-file> --output file.html
 *   npx ts-node src/voice-lecture/tools/render-cli.ts <markdown-file> --json
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  parseLesson,
  renderMarkdown,
  renderTables,
  extractVocabularySections,
  extractTeacherScripts,
  parseTeacherScript,
  hasTag,
  getTagContent,
  validateLesson,
} from '../parser/Parser';

// Custom tags that need special rendering
const CUSTOM_TAGS = [
  'vocabulary',
  'teacher_script',
  'dialogue',
  'reading',
  'translation',
  'grammar',
  'task',
  'questions',
  'answer',
  'explanation',
  'pronunciation_theory',
  'audio',
  'content_table',
];

interface RenderResult {
  title: string;
  chunks: Array<{
    id: string;
    title: string;
    html: string;
    rawContent: string;
  }>;
  vocabulary: Array<{
    words: Array<{
      word: string;
      type?: string;
      meaning: string;
      pronunciation?: string;
    }>;
  }>;
  teacherScripts: Array<{
    text: string;
    pause: number;
    action?: string;
    type?: string;
  }>;
  tags: Record<string, boolean>;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  fullHtml: string;
}

function renderCustomTag(tag: string, content: string, attrs: string = ''): string {
  const tagClass = tag.replace(/_/g, '-');

  switch (tag) {
    case 'vocabulary':
      return `<div class="vocabulary-section" data-testid="vocabulary">
        <h4>📚 Vocabulary</h4>
        ${renderMarkdown(content)}
      </div>`;

    case 'teacher_script':
      // Parse teacher script to get stripped text (without <eng>/<vn> tags)
      const ts = parseTeacherScript(content, attrs);
      // Encode segments as JSON for data attribute
      const segmentsJson = JSON.stringify(ts.segments).replace(/"/g, '&quot;');
      return `<div class="teacher-script" data-testid="teacher-script"
        id="${ts.id}"
        data-text="${ts.text.replace(/"/g, '&quot;')}"
        data-segments="${segmentsJson}"
        data-pause="${ts.pause}"
        data-lang="${ts.lang}"
        ${ts.action ? `data-action="${ts.action}"` : ''}
        ${ts.href ? `data-href="${ts.href}"` : ''}>
        <span class="icon">🎤</span>
        <p>${ts.text}</p>
      </div>`;

    case 'dialogue':
      return `<div class="dialogue-section" data-testid="dialogue">
        <h4>💬 Dialogue</h4>
        ${renderTables(content) || renderMarkdown(content)}
      </div>`;

    case 'reading':
      return `<div class="reading-section" data-testid="reading">
        <h4>📖 Reading</h4>
        ${renderTables(content) || renderMarkdown(content)}
      </div>`;

    case 'translation':
      return `<div class="translation-section" data-testid="translation">
        <h4>🌐 Translation</h4>
        ${renderMarkdown(content)}
      </div>`;

    case 'grammar':
      return `<div class="grammar-section" data-testid="grammar">
        <h4>📐 Grammar</h4>
        ${renderTables(renderMarkdown(content))}
      </div>`;

    case 'task':
      return `<div class="task-section" data-testid="task">
        <h4>📝 Task</h4>
        ${renderMarkdown(content)}
      </div>`;

    case 'questions':
      return `<div class="questions-section" data-testid="questions">
        <h4>❓ Questions</h4>
        ${renderTables(renderMarkdown(content))}
      </div>`;

    case 'answer':
      return `<div class="answer-section" data-testid="answer">
        <h4>✅ Answer</h4>
        ${renderMarkdown(content)}
      </div>`;

    case 'explanation':
      return `<div class="explanation-section" data-testid="explanation">
        <h4>💡 Explanation</h4>
        ${renderTables(renderMarkdown(content))}
      </div>`;

    case 'pronunciation_theory':
      return `<div class="pronunciation-theory" data-testid="pronunciation-theory">
        <h4>🔊 Pronunciation Theory</h4>
        ${renderTables(renderMarkdown(content))}
      </div>`;

    case 'audio': {
      const srcMatch = attrs.match(/src="([^"]+)"/);
      const src = srcMatch ? srcMatch[1] : '';
      const audioEl = src && !src.includes('TODO')
        ? `<audio controls src="${src}"></audio>`
        : `<div class="audio-placeholder">🔇 ${content.trim() || 'Audio chưa sẵn sàng'}</div>`;
      return `<div class="audio-section" data-testid="audio">
        ${audioEl}
      </div>`;
    }

    case 'content_table':
      return `<div class="content-table" data-testid="content-table">
        ${renderTables(content)}
      </div>`;

    default:
      return `<div class="${tagClass}">${renderMarkdown(content)}</div>`;
  }
}

function renderFullContent(markdown: string): string {
  let html = markdown;

  // Process custom tags
  for (const tag of CUSTOM_TAGS) {
    const regex = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'g');
    html = html.replace(regex, (match, attrs, content) => {
      return renderCustomTag(tag, content, attrs);
    });
  }

  // Remove chunk comments
  html = html.replace(/<!--\s*chunk:\s*\w+\s*-->/g, '<hr class="chunk-divider">');

  // Render remaining markdown
  html = renderMarkdown(html);
  html = renderTables(html);

  return html;
}

function generateHtmlPage(result: RenderResult): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${result.title}</title>
  <style>
    :root {
      --primary: #2563eb;
      --success: #10b981;
      --warning: #f59e0b;
      --error: #ef4444;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #1e293b;
      --text-muted: #64748b;
      --border: #e2e8f0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem;
    }

    .container { max-width: 900px; margin: 0 auto; }

    h1, h2, h3, h4 { margin: 1.5rem 0 0.75rem; }
    h1 { color: var(--primary); border-bottom: 2px solid var(--primary); padding-bottom: 0.5rem; }
    h2 { color: var(--text); }

    .chunk-divider {
      border: none;
      border-top: 3px dashed var(--border);
      margin: 2rem 0;
    }

    /* Custom tag sections */
    .vocabulary-section,
    .dialogue-section,
    .reading-section,
    .translation-section,
    .grammar-section,
    .task-section,
    .questions-section,
    .answer-section,
    .explanation-section,
    .pronunciation-theory,
    .audio-section,
    .content-table {
      background: var(--card-bg);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 0;
      border-left: 4px solid var(--primary);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .vocabulary-section { border-color: #8b5cf6; }
    .dialogue-section { border-color: #06b6d4; }
    .reading-section { border-color: #14b8a6; }
    .translation-section { border-color: #6366f1; }
    .grammar-section { border-color: #f59e0b; }
    .task-section { border-color: #3b82f6; }
    .questions-section { border-color: #ec4899; }
    .answer-section { border-color: var(--success); }
    .explanation-section { border-color: #eab308; }
    .pronunciation-theory { border-color: #f97316; }
    .audio-section { border-color: #a855f7; }

    .teacher-script {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      margin: 1rem 0;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .teacher-script .icon { font-size: 1.5rem; }
    .teacher-script p { margin: 0; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }

    th, td {
      border: 1px solid var(--border);
      padding: 0.75rem;
      text-align: left;
    }

    th { background: var(--bg); font-weight: 600; }
    tr:hover { background: var(--bg); }

    ul, ol { margin: 0.5rem 0 0.5rem 1.5rem; }
    li { margin: 0.25rem 0; }

    strong { color: var(--primary); }
    em { color: var(--text-muted); }

    /* Validation section */
    .validation {
      background: var(--card-bg);
      border-radius: 8px;
      padding: 1.5rem;
      margin: 2rem 0;
    }

    .validation.valid { border-left: 4px solid var(--success); }
    .validation.invalid { border-left: 4px solid var(--error); }

    .error { color: var(--error); }
    .warning { color: var(--warning); }
    .success { color: var(--success); }

    /* Stats */
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }

    .stat-card {
      background: var(--card-bg);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-value { font-size: 2rem; font-weight: bold; color: var(--primary); }
    .stat-label { color: var(--text-muted); font-size: 0.875rem; }

    /* Tags list */
    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0;
    }

    .tag {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.875rem;
    }

    .tag.present { background: #dcfce7; color: #166534; }
    .tag.absent { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${result.title}</h1>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${result.chunks.length}</div>
        <div class="stat-label">Chunks</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.vocabulary.reduce((sum, v) => sum + v.words.length, 0)}</div>
        <div class="stat-label">Vocabulary Words</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${result.teacherScripts.length}</div>
        <div class="stat-label">Teacher Scripts</div>
      </div>
    </div>

    <h2>Tags Found</h2>
    <div class="tags-list">
      ${CUSTOM_TAGS.map(tag =>
        `<span class="tag ${result.tags[tag] ? 'present' : 'absent'}">${tag}</span>`
      ).join('')}
    </div>

    <div class="validation ${result.validation.isValid ? 'valid' : 'invalid'}">
      <h3>${result.validation.isValid ? '✅ Valid' : '❌ Invalid'}</h3>
      ${result.validation.errors.length > 0 ? `
        <h4 class="error">Errors:</h4>
        <ul>${result.validation.errors.map(e => `<li class="error">${e}</li>`).join('')}</ul>
      ` : ''}
      ${result.validation.warnings.length > 0 ? `
        <h4 class="warning">Warnings:</h4>
        <ul>${result.validation.warnings.map(w => `<li class="warning">${w}</li>`).join('')}</ul>
      ` : ''}
    </div>

    <h2>Rendered Content</h2>
    <div class="rendered-content">
      ${result.fullHtml}
    </div>

    <h2>Chunks Detail</h2>
    ${result.chunks.map((chunk, i) => `
      <details>
        <summary><strong>Chunk ${i + 1}: ${chunk.id}</strong> - ${chunk.title || '(no title)'}</summary>
        <div style="padding: 1rem; background: #f1f5f9; margin: 0.5rem 0; border-radius: 4px;">
          ${chunk.html}
        </div>
      </details>
    `).join('')}

    <h2>Vocabulary</h2>
    ${result.vocabulary.map((section, i) => `
      <details>
        <summary><strong>Section ${i + 1}</strong> (${section.words.length} words)</summary>
        <table>
          <tr><th>Word</th><th>Type</th><th>Meaning</th><th>Pronunciation</th></tr>
          ${section.words.map(w => `
            <tr>
              <td><strong>${w.word}</strong></td>
              <td>${w.type || '-'}</td>
              <td>${w.meaning}</td>
              <td>${w.pronunciation ? `/${w.pronunciation}/` : '-'}</td>
            </tr>
          `).join('')}
        </table>
      </details>
    `).join('')}

    <h2>Teacher Scripts</h2>
    <table>
      <tr><th>#</th><th>Text</th><th>Pause</th><th>Action</th></tr>
      ${result.teacherScripts.map((s, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${s.text.substring(0, 100)}${s.text.length > 100 ? '...' : ''}</td>
          <td>${s.pause}s</td>
          <td>${s.action || '-'}</td>
        </tr>
      `).join('')}
    </table>
  </div>
</body>
</html>`;
}

function renderFile(filePath: string): RenderResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lesson = parseLesson(content);
  const validation = validateLesson(content);

  const result: RenderResult = {
    title: lesson.title,
    chunks: lesson.chunks.map(chunk => ({
      id: chunk.id,
      title: chunk.title,
      html: renderFullContent(chunk.content),
      rawContent: chunk.content,
    })),
    vocabulary: extractVocabularySections(content),
    teacherScripts: extractTeacherScripts(content),
    tags: {},
    validation,
    fullHtml: renderFullContent(content),
  };

  // Check which tags are present
  for (const tag of CUSTOM_TAGS) {
    result.tags[tag] = hasTag(content, tag);
  }

  return result;
}

// CLI entry point
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Voice Lecture Render CLI

Usage:
  npx ts-node src/voice-lecture/tools/render-cli.ts <markdown-file>
  npx ts-node src/voice-lecture/tools/render-cli.ts <markdown-file> --output file.html
  npx ts-node src/voice-lecture/tools/render-cli.ts <markdown-file> --json

Options:
  --output, -o    Output HTML file path
  --json          Output as JSON instead of HTML
  --help, -h      Show this help
`);
    process.exit(0);
  }

  const filePath = args[0];
  const outputIndex = args.findIndex(a => a === '--output' || a === '-o');
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;
  const jsonOutput = args.includes('--json');

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const result = renderFile(filePath);

    if (jsonOutput) {
      const output = JSON.stringify(result, null, 2);
      if (outputPath) {
        fs.writeFileSync(outputPath, output);
        console.log(`JSON written to: ${outputPath}`);
      } else {
        console.log(output);
      }
    } else {
      const html = generateHtmlPage(result);
      if (outputPath) {
        fs.writeFileSync(outputPath, html);
        console.log(`HTML written to: ${outputPath}`);
      } else {
        // Write to temp file and show path
        const tempPath = path.join('/tmp', `render-${Date.now()}.html`);
        fs.writeFileSync(tempPath, html);
        console.log(`HTML written to: ${tempPath}`);

        // Also print summary to console
        console.log(`
📊 Render Summary for: ${filePath}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${result.title}
Chunks: ${result.chunks.length}
Vocabulary: ${result.vocabulary.reduce((sum, v) => sum + v.words.length, 0)} words
Teacher Scripts: ${result.teacherScripts.length}
Valid: ${result.validation.isValid ? '✅' : '❌'}
${result.validation.errors.length > 0 ? `Errors: ${result.validation.errors.join(', ')}` : ''}

Tags found: ${Object.entries(result.tags).filter(([,v]) => v).map(([k]) => k).join(', ')}
Tags missing: ${Object.entries(result.tags).filter(([,v]) => !v).map(([k]) => k).join(', ') || 'none'}
`);
      }
    }
  } catch (err) {
    console.error('Error rendering file:', err);
    process.exit(1);
  }
}

main();
