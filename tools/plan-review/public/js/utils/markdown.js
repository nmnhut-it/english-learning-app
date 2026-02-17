// Simple markdown renderer (no external deps)
const MarkdownUtil = {
  render(text) {
    if (!text) return '<div class="empty-state"><div class="empty-text">No content</div></div>';

    let html = this.escapeHtml(text);

    // Headings
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold / italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Tables (simple: detect lines with |)
    html = this.renderTables(html);

    // Custom tags — render as highlighted blocks
    html = html.replace(/&lt;(vocabulary|dialogue|reading|translation|grammar)&gt;/g,
      '<div class="custom-tag tag-$1"><span class="tag-label">&lt;$1&gt;</span>');
    html = html.replace(/&lt;\/(vocabulary|dialogue|reading|translation|grammar)&gt;/g,
      '<span class="tag-label">&lt;/$1&gt;</span></div>');

    html = html.replace(/&lt;teacher_script([^&]*)&gt;/g,
      '<div class="custom-tag tag-teacher"><span class="tag-label">&lt;teacher_script$1&gt;</span>');
    html = html.replace(/&lt;\/teacher_script&gt;/g,
      '<span class="tag-label">&lt;/teacher_script&gt;</span></div>');

    html = html.replace(/&lt;(task|questions|answer|explanation)([^&]*)&gt;/g,
      '<div class="custom-tag tag-$1"><span class="tag-label">&lt;$1$2&gt;</span>');
    html = html.replace(/&lt;\/(task|questions|answer|explanation)&gt;/g,
      '<span class="tag-label">&lt;/$1&gt;</span></div>');

    // Comments (chunk markers)
    html = html.replace(/&lt;!--\s*chunk:\s*(.+?)\s*--&gt;/g,
      '<div class="chunk-marker" data-chunk="$1">chunk: $1</div>');

    // Lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Paragraphs (lines not already wrapped)
    html = html.replace(/^(?!<[hud\-lo]|<\/|<span|<div)(.+)$/gm, '<p>$1</p>');

    // Cleanup empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');

    return `<div class="markdown-content">${html}</div>`;
  },

  renderTables(html) {
    const lines = html.split('\n');
    let inTable = false;
    const result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          result.push('<table>');
          inTable = true;
        }
        // Skip separator lines
        if (/^\|[\s\-:|]+\|$/.test(line)) continue;

        const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        const tag = !inTable || result[result.length - 1] === '<table>' ? 'th' : 'td';
        result.push('<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>');
      } else {
        if (inTable) {
          result.push('</table>');
          inTable = false;
        }
        result.push(lines[i]);
      }
    }
    if (inTable) result.push('</table>');
    return result.join('\n');
  },

  escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },
};
