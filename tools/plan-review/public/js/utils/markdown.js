// Markdown renderer for review tool
// Ported from v2/src/voice-lecture/parser/Parser.ts renderFullContent approach
const MarkdownUtil = {
  // Custom tags matching the production parser
  CUSTOM_TAGS: [
    'vocabulary', 'teacher_script', 'dialogue', 'reading', 'translation',
    'grammar', 'task', 'questions', 'answer', 'explanation',
    'pronunciation_theory', 'audio', 'content_table', 'exercise',
  ],

  /**
   * Render full markdown content with proper custom tag handling.
   * Uses the placeholder approach from the production parser to avoid <p><div> nesting.
   */
  render(text) {
    if (!text) return '<div class="empty-state"><div class="empty-text">No content</div></div>';

    let html = text;

    // Step 1: Replace custom tags with placeholders (before any HTML escaping)
    const tagPlaceholders = new Map();
    let placeholderIndex = 0;

    for (const tag of this.CUSTOM_TAGS) {
      const regex = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'g');
      html = html.replace(regex, (match, attrs, inner) => {
        const placeholder = `<!--TAG_PH_${placeholderIndex++}-->`;
        tagPlaceholders.set(placeholder, this.renderTag(tag, inner, attrs || ''));
        return placeholder;
      });
    }

    // Step 2: Replace chunk comments with placeholders
    const chunkPlaceholders = new Map();
    let chunkIndex = 0;
    html = html.replace(/<!--\s*chunk:\s*(.+?)\s*-->/g, (match, chunkId) => {
      const placeholder = `<!--CHUNK_PH_${chunkIndex++}-->`;
      chunkPlaceholders.set(placeholder, `<div class="chunk-marker" data-chunk="${chunkId.trim()}">chunk: ${chunkId.trim()}</div>`);
      return placeholder;
    });

    // Step 3: Render markdown on the remaining content (outside custom tags)
    html = this.renderMarkdown(html);

    // Step 4: Restore placeholders
    for (const [placeholder, rendered] of tagPlaceholders) {
      html = html.replace(placeholder, rendered);
    }
    for (const [placeholder, rendered] of chunkPlaceholders) {
      html = html.replace(placeholder, rendered);
    }

    return `<div class="markdown-content">${html}</div>`;
  },

  /**
   * Render a custom tag with label and inner content
   */
  renderTag(tag, inner, attrs) {
    const tagClass = tag.replace(/_/g, '-');
    const attrDisplay = attrs.trim() ? ` ${attrs.trim()}` : '';

    // Parse teacher_script attributes for display
    if (tag === 'teacher_script') {
      const pauseMatch = attrs.match(/pause="(\d+)"/);
      const actionMatch = attrs.match(/action="(\w+)"/);
      const pause = pauseMatch ? pauseMatch[1] : '0';
      const action = actionMatch ? actionMatch[1] : null;

      // Strip inline <eng>/<vn> tags for display, show them as highlighted spans
      let displayText = this.escapeHtml(inner.trim());
      displayText = displayText.replace(/&lt;eng&gt;([\s\S]*?)&lt;\/eng&gt;/g,
        '<span class="lang-tag lang-en">$1</span>');
      displayText = displayText.replace(/&lt;vn&gt;([\s\S]*?)&lt;\/vn&gt;/g,
        '<span class="lang-tag lang-vi">$1</span>');

      let badge = `pause=${pause}s`;
      if (action) badge += ` action=${action}`;

      return `<div class="custom-tag tag-${tagClass}">
        <div class="tag-header">
          <span class="tag-label">teacher_script</span>
          <span class="tag-attrs">${badge}</span>
        </div>
        <div class="tag-body">${displayText}</div>
      </div>`;
    }

    // Parse questions type attribute
    if (tag === 'questions') {
      const typeMatch = attrs.match(/type="([^"]+)"/);
      const type = typeMatch ? typeMatch[1] : 'unknown';
      return `<div class="custom-tag tag-${tagClass}">
        <div class="tag-header">
          <span class="tag-label">questions</span>
          <span class="tag-attrs">type=${type}</span>
        </div>
        <div class="tag-body">${this.renderMarkdown(inner)}</div>
      </div>`;
    }

    // Vocabulary: render as structured list
    if (tag === 'vocabulary') {
      return `<div class="custom-tag tag-${tagClass}">
        <div class="tag-header"><span class="tag-label">vocabulary</span></div>
        <div class="tag-body">${this.renderVocabulary(inner)}</div>
      </div>`;
    }

    // Dialogue: render as proper table
    if (tag === 'dialogue') {
      return `<div class="custom-tag tag-${tagClass}">
        <div class="tag-header"><span class="tag-label">dialogue</span></div>
        <div class="tag-body">${this.renderMarkdown(inner)}</div>
      </div>`;
    }

    // All other tags: render inner content as markdown
    return `<div class="custom-tag tag-${tagClass}">
      <div class="tag-header">
        <span class="tag-label">${tag.replace(/_/g, ' ')}</span>
        ${attrDisplay ? `<span class="tag-attrs">${this.escapeHtml(attrDisplay)}</span>` : ''}
      </div>
      <div class="tag-body">${this.renderMarkdown(inner)}</div>
    </div>`;
  },

  /**
   * Render vocabulary as structured word list
   */
  renderVocabulary(content) {
    const lines = content.trim().split(/\r?\n/);
    let html = '<ol class="vocab-list">';
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*\*\*(.+?)\*\*\s*:\s*(.+)$/);
      if (match) {
        const word = match[1].trim();
        let rest = match[2].trim();

        // Extract type
        let type = '';
        const typeMatch = rest.match(/^\(([^)]+)\)\s*/);
        if (typeMatch) {
          type = typeMatch[1];
          rest = rest.slice(typeMatch[0].length);
        }

        // Extract pronunciation
        let pron = '';
        const pronMatch = rest.match(/\s*\/([^/]+)\/$/);
        if (pronMatch) {
          pron = pronMatch[1];
          rest = rest.slice(0, -pronMatch[0].length);
        }

        html += `<li class="vocab-item">
          <strong class="vocab-word">${this.escapeHtml(word)}</strong>
          ${type ? `<span class="vocab-type">(${this.escapeHtml(type)})</span>` : ''}
          <span class="vocab-meaning">${this.escapeHtml(rest.trim())}</span>
          ${pron ? `<span class="vocab-pron">/${this.escapeHtml(pron)}/</span>` : ''}
        </li>`;
      } else if (line.trim()) {
        html += `<li>${this.escapeHtml(line.trim())}</li>`;
      }
    }
    html += '</ol>';
    return html;
  },

  /**
   * Render basic markdown to HTML (headings, bold, italic, lists, tables)
   * Ported from Parser.ts renderMarkdown
   */
  renderMarkdown(markdown) {
    // NOTE: Do NOT escapeHtml here. The production Parser.ts does not escape either.
    // Escaping would destroy HTML-comment placeholders (<!--TAG_PH_N-->) used by render().
    // Content-level escaping is handled in renderTag/renderVocabulary for specific fields.
    let html = markdown;

    // Handle <eng>/<vn> inline tags (appear inside custom tag bodies rendered via renderMarkdown)
    html = html.replace(/<eng>([\s\S]*?)<\/eng>/g,
      '<span class="lang-tag lang-en">$1</span>');
    html = html.replace(/<vn>([\s\S]*?)<\/vn>/g,
      '<span class="lang-tag lang-vi">$1</span>');

    // Headings
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Bold / italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Horizontal rules
    html = html.replace(/^---+$/gm, '<hr>');

    // Tables
    html = this.renderTables(html);

    // Unordered lists
    html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');

    // Ordered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="numbered">$1</li>');

    // Wrap consecutive list items
    html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (match) => {
      if (match.includes('class="numbered"')) {
        return '<ol>' + match.replace(/ class="numbered"/g, '') + '</ol>';
      }
      return '<ul>' + match + '</ul>';
    });

    // Paragraphs - double newlines become paragraph breaks
    html = html.split(/\n\n+/).map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<')) return block;
      return `<p>${block}</p>`;
    }).join('\n');

    // Cleanup empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');

    return html;
  },

  /**
   * Render markdown tables to HTML
   * Ported from Parser.ts renderTables
   */
  renderTables(html) {
    const lines = html.split('\n');
    let inTable = false;
    const result = [];
    let isFirstDataRow = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          result.push('<div class="table-wrap"><table>');
          inTable = true;
          isFirstDataRow = true;
        }
        // Skip separator lines
        if (/^\|[\s\-:|]+\|$/.test(line)) continue;

        const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        const tag = isFirstDataRow ? 'th' : 'td';
        result.push('<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>');
        if (isFirstDataRow) isFirstDataRow = false;
      } else {
        if (inTable) {
          result.push('</table></div>');
          inTable = false;
        }
        result.push(lines[i]);
      }
    }
    if (inTable) result.push('</table></div>');
    return result.join('\n');
  },

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },
};
