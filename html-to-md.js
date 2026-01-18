/**
 * HTML to Markdown Converter for loigiaihay.com content
 *
 * Extracts main content from #box-content div, strips ads/scripts/navigation,
 * and converts to clean Markdown using Turndown.
 *
 * Usage: node html-to-md.js [--dry-run] [--single path/to/file.html]
 */

const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  sourceDir: 'loigiaihay.com',
  contentSelector: '#box-content',
  // Elements to remove before conversion
  removeSelectors: [
    'script',
    'style',
    'iframe',
    '.video-container',
    '.Choose-fast',
    '[id^="pcinread"]',
    '[id*="loigiaihay"]',
    '.tooltip-concept-container',
    '#before_sub_question_nav',
    'ins.adsbygoogle',
    '[class*="ad-"]',
    '[id*="ad-"]',
  ]
};

/**
 * Configure Turndown for clean Markdown output
 */
function createTurndownService() {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });

  // Use GFM plugin for tables, strikethrough, etc.
  turndown.use(gfm);

  // Preserve audio elements as links
  turndown.addRule('audio', {
    filter: 'audio',
    replacement: (content, node) => {
      const src = node.getAttribute('src');
      return src ? `\n[🔊 Audio](${src})\n` : '';
    }
  });

  return turndown;
}

/**
 * Normalize tables by adding thead/tbody structure for GFM compatibility
 */
function normalizeTables(contentEl) {
  contentEl.querySelectorAll('table').forEach(table => {
    const rows = table.querySelectorAll('tr');
    if (rows.length === 0) return;

    // Check if table already has thead
    if (table.querySelector('thead')) return;

    // Create thead with first row, tbody with rest
    const thead = contentEl.ownerDocument.createElement('thead');
    const tbody = contentEl.ownerDocument.createElement('tbody');

    rows.forEach((row, index) => {
      if (index === 0) {
        // Convert first row cells to th if they're td
        row.querySelectorAll('td').forEach(td => {
          const th = contentEl.ownerDocument.createElement('th');
          th.innerHTML = td.innerHTML;
          td.replaceWith(th);
        });
        thead.appendChild(row);
      } else {
        tbody.appendChild(row);
      }
    });

    // Clear table and add thead/tbody
    table.innerHTML = '';
    table.appendChild(thead);
    if (tbody.children.length > 0) {
      table.appendChild(tbody);
    }
  });
}

/**
 * Extract and clean content from HTML
 */
function extractContent(html, filePath) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Extract title from page
  const titleEl = document.querySelector('title');
  const title = titleEl ? titleEl.textContent.split('|')[0].trim() : '';

  // Find main content
  const contentEl = document.querySelector(CONFIG.contentSelector);
  if (!contentEl) {
    console.warn(`  Warning: No ${CONFIG.contentSelector} found in ${filePath}`);
    return null;
  }

  // Remove unwanted elements
  CONFIG.removeSelectors.forEach(selector => {
    contentEl.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Remove elements with inline "display: none"
  contentEl.querySelectorAll('[style*="display: none"]').forEach(el => el.remove());
  contentEl.querySelectorAll('[style*="display:none"]').forEach(el => el.remove());

  // Remove "Lựa chọn câu để xem lời giải nhanh hơn" text
  contentEl.querySelectorAll('span').forEach(span => {
    if (span.textContent.includes('Lựa chọn câu')) {
      span.remove();
    }
  });

  // Remove "Video hướng dẫn giải" labels (now empty after iframe removal)
  contentEl.querySelectorAll('p, strong').forEach(el => {
    const text = el.textContent.trim();
    if (text === 'Video hướng dẫn giải' || text.includes('Video hướng dẫn')) {
      el.remove();
    }
  });

  // Remove empty divs that contained videos
  contentEl.querySelectorAll('div').forEach(div => {
    if (div.textContent.trim() === '' && div.children.length === 0) {
      div.remove();
    }
  });

  // Normalize tables for GFM compatibility
  normalizeTables(contentEl);

  return {
    title,
    content: contentEl.innerHTML
  };
}

/**
 * Clean up Markdown output
 */
function cleanMarkdown(markdown) {
  return markdown
    // Remove excessive blank lines
    .replace(/\n{4,}/g, '\n\n\n')
    // Remove trailing whitespace on lines
    .replace(/[ \t]+$/gm, '')
    // Clean up list formatting
    .replace(/^\s*-\s*$/gm, '')
    // Fix escaped characters that don't need escaping
    .replace(/\\([[\]])/g, '$1')
    // Fix escaped periods after numbers (1\. -> 1.)
    .replace(/(\d+)\\\./g, '$1.')
    // Remove stray asterisks around audio links
    .replace(/\*\s*\n\[🔊/g, '\n[🔊')
    .replace(/\]\(([^)]+)\)\s*\n\*/g, ']($1)\n')
    // Clean up nbsp
    .replace(/&nbsp;/g, ' ')
    // Clean up multiple spaces
    .replace(/ {2,}/g, ' ')
    // Remove empty table cells' extra pipes
    .replace(/\|\s+\|/g, '| |')
    // Trim
    .trim();
}

/**
 * Convert a single HTML file to Markdown
 */
function convertFile(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  const extracted = extractContent(html, htmlPath);

  if (!extracted) {
    return null;
  }

  const turndown = createTurndownService();
  let markdown = turndown.turndown(extracted.content);

  // Add title as H1 if exists
  if (extracted.title) {
    markdown = `# ${extracted.title}\n\n${markdown}`;
  }

  return cleanMarkdown(markdown);
}

/**
 * Process all HTML files in directory with batched processing
 */
function processAllFiles(dryRun = false) {
  const sourceDir = path.join(process.cwd(), CONFIG.sourceDir);

  if (!fs.existsSync(sourceDir)) {
    console.error(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  // Find all HTML files recursively
  const htmlFiles = findHtmlFiles(sourceDir);
  console.log(`Found ${htmlFiles.length} HTML files to convert`);

  let converted = 0;
  let skipped = 0;
  let errors = 0;

  // Process in smaller batches to manage memory
  const BATCH_SIZE = 50;

  for (let i = 0; i < htmlFiles.length; i++) {
    const htmlPath = htmlFiles[i];
    const mdPath = htmlPath.replace(/\.html$/, '.md');
    const relativePath = path.relative(sourceDir, htmlPath);

    // Skip if MD already exists
    if (fs.existsSync(mdPath)) {
      skipped++;
      continue;
    }

    process.stdout.write(`\r[${i + 1}/${htmlFiles.length}] Converting: ${relativePath.padEnd(60)}`);

    try {
      const markdown = convertFile(htmlPath);

      if (markdown) {
        if (!dryRun) {
          fs.writeFileSync(mdPath, markdown, 'utf-8');
        }
        converted++;
      } else {
        errors++;
      }
    } catch (err) {
      console.error(`\nError converting ${relativePath}: ${err.message}`);
      errors++;
    }

    // Force garbage collection hint every batch
    if ((i + 1) % BATCH_SIZE === 0) {
      if (global.gc) {
        global.gc();
      }
    }
  }

  console.log(`\n\nConversion complete:`);
  console.log(`  Converted: ${converted}`);
  console.log(`  Skipped (already exists): ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

/**
 * Find all HTML files in directory recursively
 */
function findHtmlFiles(dir) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Process a single file (for testing)
 */
function processSingleFile(htmlPath) {
  if (!fs.existsSync(htmlPath)) {
    console.error(`File not found: ${htmlPath}`);
    process.exit(1);
  }

  const markdown = convertFile(htmlPath);
  if (markdown) {
    console.log(markdown);
  }
}

// CLI handling
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const singleIndex = args.indexOf('--single');

if (singleIndex !== -1 && args[singleIndex + 1]) {
  processSingleFile(args[singleIndex + 1]);
} else {
  processAllFiles(dryRun);
}
