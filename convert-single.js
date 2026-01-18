/**
 * Convert a single HTML file to Markdown
 * Usage: node convert-single.js <html-file>
 */

const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');
const fs = require('fs');

const REMOVE_SELECTORS = [
  'script', 'style', 'iframe', '.video-container', '.Choose-fast',
  '[id^="pcinread"]', '[id*="loigiaihay"]', '.tooltip-concept-container',
  '#before_sub_question_nav', 'ins.adsbygoogle', '[class*="ad-"]', '[id*="ad-"]'
];

function convert(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Get title
  const titleEl = doc.querySelector('title');
  const title = titleEl ? titleEl.textContent.split('|')[0].trim() : '';

  // Get content
  const contentEl = doc.querySelector('#box-content');
  if (!contentEl) {
    console.error('No #box-content found');
    process.exit(1);
  }

  // Remove unwanted elements
  REMOVE_SELECTORS.forEach(sel => {
    contentEl.querySelectorAll(sel).forEach(el => el.remove());
  });

  // Remove hidden elements
  contentEl.querySelectorAll('[style*="display: none"], [style*="display:none"]').forEach(el => el.remove());

  // Remove video labels
  contentEl.querySelectorAll('p, strong').forEach(el => {
    if (el.textContent.trim().includes('Video hướng dẫn')) el.remove();
  });

  // Normalize tables
  contentEl.querySelectorAll('table').forEach(table => {
    if (table.querySelector('thead')) return;
    const rows = table.querySelectorAll('tr');
    if (rows.length === 0) return;

    const thead = doc.createElement('thead');
    const tbody = doc.createElement('tbody');

    rows.forEach((row, i) => {
      if (i === 0) {
        row.querySelectorAll('td').forEach(td => {
          const th = doc.createElement('th');
          th.innerHTML = td.innerHTML;
          td.replaceWith(th);
        });
        thead.appendChild(row);
      } else {
        tbody.appendChild(row);
      }
    });

    table.innerHTML = '';
    table.appendChild(thead);
    if (tbody.children.length) table.appendChild(tbody);
  });

  // Convert to markdown
  const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
  });
  turndown.use(gfm);
  turndown.addRule('audio', {
    filter: 'audio',
    replacement: (c, node) => {
      const src = node.getAttribute('src');
      return src ? `\n[🔊 Audio](${src})\n` : '';
    }
  });

  let md = turndown.turndown(contentEl.innerHTML);
  if (title) md = `# ${title}\n\n${md}`;

  // Cleanup
  md = md
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/(\d+)\\\./g, '$1.')
    .replace(/&nbsp;/g, ' ')
    .trim();

  // Write output
  const mdPath = htmlPath.replace(/\.html$/, '.md');
  fs.writeFileSync(mdPath, md, 'utf-8');
  console.log(`OK: ${mdPath}`);
}

convert(process.argv[2]);
