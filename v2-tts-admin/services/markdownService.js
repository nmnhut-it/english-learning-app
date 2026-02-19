/**
 * Markdown Service - Parse and update teacher scripts in markdown files.
 * Related: v2/data/voice-lectures/**\/*.md
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const crypto = require('crypto');

const VOICE_LECTURES_DIR = path.join(__dirname, '../../v2/data/voice-lectures');
const SCRIPT_REGEX = /<teacher_script([^>]*)>([\s\S]*?)<\/teacher_script>/gi;

/**
 * Section display order per grade group.
 * g6-g9: Getting Started → A Closer Look 1/2 → Communication → Skills → Looking Back → Project
 * g10-g11: Vocab → Grammar → Getting Started → Language → 4 Skills → Culture → Looking Back → Project
 */
const SECTION_ORDER_G6_G9 = [
  'getting-started',
  'a-closer-look-1',
  'a-closer-look-2',
  'communication',
  'skills-1',
  'skills-2',
  'looking-back',
  'project',
];

const SECTION_ORDER_G10_G11 = [
  'vocabulary',
  'vocabulary-practice',
  'grammar',
  'getting-started',
  'language',
  'reading',
  'speaking',
  'listening',
  'writing',
  'communication-and-culture',
  'communication-and-culture-clil',
  'looking-back',
  'project',
];

/** Get section sort index for a given grade and section name. */
function getSectionOrder(grade, section) {
  const gradeNum = parseInt(grade.replace('g', ''), 10);
  const order = gradeNum >= 10 ? SECTION_ORDER_G10_G11 : SECTION_ORDER_G6_G9;
  const idx = order.indexOf(section);
  return idx === -1 ? order.length : idx;
}

/**
 * Clean text for TTS - remove inline tags but keep content.
 * This is the actual text that gets spoken.
 * @param {string} text - Raw text with possible inline tags
 * @returns {string} Cleaned text ready for TTS
 */
function cleanTextForTTS(text) {
  // Remove <eng> and <vn> tags but keep content
  let cleaned = text.replace(/<(eng|vn)>([\s\S]*?)<\/\1>/gi, '$2');
  // Remove any remaining HTML-like tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

/**
 * List all markdown files in voice-lectures directory.
 * @returns {Promise<Array<{path: string, grade: string, unit: string, section: string}>>}
 */
async function listMarkdownFiles() {
  const pattern = path.join(VOICE_LECTURES_DIR, '**/*.md').replace(/\\/g, '/');
  const files = await glob(pattern);

  return files.map(filePath => {
    const relativePath = path.relative(VOICE_LECTURES_DIR, filePath);
    const parts = relativePath.split(path.sep);

    return {
      path: relativePath.replace(/\\/g, '/'),
      absolutePath: filePath,
      grade: parts[0] || '',
      unit: parts[1] || '',
      section: parts[2]?.replace('.md', '') || ''
    };
  }).sort((a, b) => {
    // Sort by grade, then unit, then custom section order
    if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
    if (a.unit !== b.unit) return a.unit.localeCompare(b.unit);
    return getSectionOrder(a.grade, a.section) - getSectionOrder(b.grade, b.section);
  });
}

/**
 * Generate hash from text for caching audio files.
 * @param {string} text - Script text
 * @returns {string} First 8 chars of MD5 hash
 */
function generateHash(text) {
  return crypto.createHash('md5').update(text).digest('hex').slice(0, 8);
}

/**
 * Parse all teacher scripts from a markdown file.
 * @param {string} relativePath - Path relative to voice-lectures dir
 * @returns {Promise<Array<{index, text, cleanedText, pause, action, href, hash, rawAttrs}>>}
 */
async function parseTeacherScripts(relativePath) {
  const absolutePath = path.join(VOICE_LECTURES_DIR, relativePath);
  const content = await fs.readFile(absolutePath, 'utf-8');

  const scripts = [];
  let match;
  let index = 0;

  // Reset regex state
  SCRIPT_REGEX.lastIndex = 0;

  while ((match = SCRIPT_REGEX.exec(content)) !== null) {
    const attrs = match[1];
    const text = match[2].trim();
    const cleanedText = cleanTextForTTS(text);

    // Parse attributes
    const pauseMatch = attrs.match(/pause="(\d+)"/);
    const actionMatch = attrs.match(/action="(\w+)"/);
    const hrefMatch = attrs.match(/href="([^"]+)"/);

    scripts.push({
      index,
      text,
      cleanedText,
      pause: pauseMatch ? parseInt(pauseMatch[1], 10) : 0,
      action: actionMatch ? actionMatch[1] : null,
      href: hrefMatch ? hrefMatch[1] : null,
      hash: generateHash(cleanedText), // Hash based on cleaned text for reuse
      rawAttrs: attrs.trim(),
      startOffset: match.index,
      fullMatch: match[0]
    });

    index++;
  }

  return scripts;
}

/**
 * Generate audio filename based on content hash only.
 * Format: tts_{hash}.mp3
 * This allows reuse across different files with same content.
 */
function generateAudioFilename(hash) {
  return `tts_${hash}.mp3`;
}

/**
 * Update a teacher script's href attribute in the markdown file.
 * @param {string} relativePath - Path relative to voice-lectures dir
 * @param {number} scriptIndex - Index of the script to update
 * @param {string} href - New href value (audio file path)
 */
async function updateScriptHref(relativePath, scriptIndex, href) {
  const absolutePath = path.join(VOICE_LECTURES_DIR, relativePath);
  let content = await fs.readFile(absolutePath, 'utf-8');

  const scripts = [];
  let match;
  SCRIPT_REGEX.lastIndex = 0;

  while ((match = SCRIPT_REGEX.exec(content)) !== null) {
    scripts.push({
      fullMatch: match[0],
      attrs: match[1],
      text: match[2],
      startOffset: match.index
    });
  }

  if (scriptIndex >= scripts.length) {
    throw new Error(`Script index ${scriptIndex} out of range (max: ${scripts.length - 1})`);
  }

  const script = scripts[scriptIndex];
  let newAttrs = script.attrs.trim();

  if (newAttrs.includes('href=')) {
    // Replace existing href
    newAttrs = newAttrs.replace(/href="[^"]*"/, `href="${href}"`);
  } else {
    // Add href attribute
    newAttrs = `${newAttrs} href="${href}"`;
  }

  // Ensure space between tag name and attributes
  const newTag = `<teacher_script ${newAttrs}>${script.text}</teacher_script>`;

  // Replace in content
  content = content.slice(0, script.startOffset) + newTag +
            content.slice(script.startOffset + script.fullMatch.length);

  await fs.writeFile(absolutePath, content, 'utf-8');

  return { success: true, newTag };
}

/**
 * Update a teacher script's text content in the markdown file.
 * @param {string} relativePath - Path relative to voice-lectures dir
 * @param {number} scriptIndex - Index of the script to update
 * @param {string} newText - New text content (cleaned TTS text)
 */
async function updateScriptText(relativePath, scriptIndex, newText) {
  const absolutePath = path.join(VOICE_LECTURES_DIR, relativePath);
  let content = await fs.readFile(absolutePath, 'utf-8');

  const scripts = [];
  let match;
  SCRIPT_REGEX.lastIndex = 0;

  while ((match = SCRIPT_REGEX.exec(content)) !== null) {
    scripts.push({
      fullMatch: match[0],
      attrs: match[1],
      text: match[2],
      startOffset: match.index
    });
  }

  if (scriptIndex >= scripts.length) {
    throw new Error(`Script index ${scriptIndex} out of range (max: ${scripts.length - 1})`);
  }

  const script = scripts[scriptIndex];

  // Build new tag with updated text (preserve newline formatting)
  const newTag = `<teacher_script ${script.attrs.trim()}>\n${newText}\n</teacher_script>`;

  // Replace in content
  content = content.slice(0, script.startOffset) + newTag +
            content.slice(script.startOffset + script.fullMatch.length);

  await fs.writeFile(absolutePath, content, 'utf-8');

  return { success: true, newTag };
}

module.exports = {
  listMarkdownFiles,
  parseTeacherScripts,
  updateScriptHref,
  updateScriptText,
  generateAudioFilename,
  generateHash,
  cleanTextForTTS,
  VOICE_LECTURES_DIR
};
