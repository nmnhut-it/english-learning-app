/**
 * Fabrication Detection Script v2
 * Compares voice lecture files against source files to detect fabricated content.
 *
 * Features:
 * - Multi-layer matching: exact, substring, LCS, Jaccard
 * - Bi-directional comparison: missing (source→voice) vs fabricated (voice→source)
 * - Entity fingerprinting: names, numbers, quotes must match exactly
 * - Sentence-level alignment for content blocks
 * - Media/link detection: MP3 files, audio links, exercise links, images
 * - Translation validation: checks translations match source content (numbers, names)
 *
 * Severity levels:
 * - CRITICAL: Fabricated content, wrong answers (educational harm)
 * - HIGH: Missing dialogue/reading, missing MP3 audio
 * - MEDIUM: Missing vocabulary, missing links, wrong/missing translations
 * - LOW: Missing images (informational)
 *
 * Usage:
 *   node check-fabrication.js --grade 6 --unit 11 --section getting-started
 *   node check-fabrication.js --grade 6 --unit 11  # all sections
 *   node check-fabrication.js --grade 6            # all units
 */

const fs = require('fs');
const path = require('path');
const { distance } = require('fastest-levenshtein');

// Constants
const THRESHOLDS = {
  EXACT: 98,
  HIGH: 90,
  MEDIUM: 80,
  LOW: 70
};

// Grade 6-9 sections
const SECTIONS_G6_G9 = [
  'getting-started',
  'a-closer-look-1',
  'a-closer-look-2',
  'communication',
  'skills-1',
  'skills-2',
  'looking-back'
];

// Grade 10-11 sections (different structure)
const SECTIONS_G10_G11 = [
  'getting-started',
  'language',
  'reading',
  'speaking',
  'listening',
  'writing',
  'communication-and-culture-clil',
  'looking-back'
];

/** Get sections list for a specific grade */
function getSectionsForGrade(grade) {
  return grade >= 10 ? SECTIONS_G10_G11 : SECTIONS_G6_G9;
}

// Section type mappings by grade
const LISTENING_SECTIONS = {
  g6_g9: ['skills-2'],
  g10_g11: ['listening']
};

const READING_SECTIONS = {
  g6_g9: ['skills-1'],
  g10_g11: ['reading']
};

/** Check if section requires audio and tapescript */
function isListeningSection(grade, section) {
  const sections = grade >= 10 ? LISTENING_SECTIONS.g10_g11 : LISTENING_SECTIONS.g6_g9;
  return sections.includes(section);
}

/** Check if section requires reading tags */
function isReadingSection(grade, section) {
  const sections = grade >= 10 ? READING_SECTIONS.g10_g11 : READING_SECTIONS.g6_g9;
  return sections.includes(section);
}

// =============================================================================
// QUALITY VALIDATION
// =============================================================================

/**
 * Validate exercise translations - check if questions have Vietnamese translations
 * Vietnamese translations should be in *italic* or (parentheses) format
 */
function validateExerciseTranslations(content) {
  const issues = [];
  const questionBlocks = content.match(/<questions[^>]*>([\s\S]*?)<\/questions>/g) || [];

  for (let i = 0; i < questionBlocks.length; i++) {
    const block = questionBlocks[i];
    // Extract question lines (numbered items)
    const questionLines = block.match(/\*\*\d+\.\*\*[^*\n]+/g) || [];

    let missingTranslations = 0;
    for (const line of questionLines) {
      // Check if there's a Vietnamese translation after the question
      // Pattern: *Vietnamese text* or (Vietnamese text) on next line
      const questionNum = line.match(/\*\*(\d+)\.\*\*/)?.[1];
      if (!questionNum) continue;

      // Look for translation pattern after this question in the block
      const afterQuestion = block.split(line)[1] || '';
      const nextQuestion = afterQuestion.match(/\*\*\d+\.\*\*/);
      const textBeforeNext = nextQuestion ? afterQuestion.split(nextQuestion[0])[0] : afterQuestion.substring(0, 200);

      // Check for Vietnamese translation patterns
      const hasItalicVn = /\*[^*]+[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ][^*]*\*/.test(textBeforeNext);
      const hasParenVn = /\([^)]+[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ][^)]*\)/.test(textBeforeNext);

      if (!hasItalicVn && !hasParenVn) {
        missingTranslations++;
      }
    }

    if (missingTranslations > 0 && questionLines.length > 0) {
      const ratio = ((questionLines.length - missingTranslations) / questionLines.length * 100).toFixed(0);
      issues.push({
        block: i + 1,
        missing: missingTranslations,
        total: questionLines.length,
        ratio: parseInt(ratio)
      });
    }
  }

  return issues;
}

/**
 * Validate listening section requirements
 * - Must have <audio src="...mp3"> tags
 * - Must have <reading> tag with tapescript content
 */
function validateListeningRequirements(content) {
  const issues = [];

  // Check for audio tags with src attribute
  const audioTagPattern = /<audio\s+src=["'][^"']+\.mp3["']/gi;
  const audioTags = content.match(audioTagPattern) || [];

  // Also check for markdown audio links [Track](url.mp3)
  const mdAudioPattern = /\[(?:Track|Audio|🔊)[^\]]*\]\([^)]+\.mp3\)/gi;
  const mdAudioLinks = content.match(mdAudioPattern) || [];

  const totalAudio = audioTags.length + mdAudioLinks.length;

  if (totalAudio === 0) {
    issues.push({
      type: 'MISSING_AUDIO',
      detail: 'No <audio src="...mp3"> tags found in listening section'
    });
  }

  // Check for tapescript in reading tags
  const readingBlocks = content.match(/<reading>([\s\S]*?)<\/reading>/g) || [];

  if (readingBlocks.length === 0) {
    issues.push({
      type: 'MISSING_TAPESCRIPT',
      detail: 'No <reading> tag with tapescript found'
    });
  } else {
    // Check if reading content looks like a tapescript (has speaker names)
    let hasTapescript = false;
    for (const block of readingBlocks) {
      // Tapescript typically has "**Name:**" or "Name:" speaker format
      if (/\*\*[A-Z][a-z]+:\*\*|^[A-Z][a-z]+:/m.test(block)) {
        hasTapescript = true;
        break;
      }
      // Or substantial English dialogue content
      if (block.length > 200 && !isVietnamese(block.substring(0, 100))) {
        hasTapescript = true;
        break;
      }
    }

    if (!hasTapescript) {
      issues.push({
        type: 'INVALID_TAPESCRIPT',
        detail: '<reading> tag exists but content does not appear to be a tapescript'
      });
    }
  }

  return issues;
}

/**
 * Validate reading section requirements
 * - Must have <reading> tag with passage content
 * - Must have <translation> tag with Vietnamese translation
 */
function validateReadingRequirements(content) {
  const issues = [];

  // Check for reading tags
  const readingBlocks = content.match(/<reading>([\s\S]*?)<\/reading>/g) || [];

  if (readingBlocks.length === 0) {
    issues.push({
      type: 'MISSING_READING',
      detail: 'No <reading> tag found in reading section'
    });
  } else {
    // Check if reading content is substantial
    let hasValidReading = false;
    for (const block of readingBlocks) {
      const cleanBlock = block.replace(/<\/?reading>/g, '').trim();
      // Reading passage should be substantial English text
      if (cleanBlock.length > 150 && !isVietnamese(cleanBlock.substring(0, 100))) {
        hasValidReading = true;
        break;
      }
    }

    if (!hasValidReading) {
      issues.push({
        type: 'INVALID_READING',
        detail: '<reading> tag exists but content is too short or not English'
      });
    }
  }

  // Check for translation tags
  const translationBlocks = content.match(/<translation>([\s\S]*?)<\/translation>/g) || [];

  if (readingBlocks.length > 0 && translationBlocks.length === 0) {
    issues.push({
      type: 'MISSING_TRANSLATION',
      detail: 'Reading passage exists but no <translation> tag found'
    });
  }

  return issues;
}

/**
 * Validate dialogue format - should be linear, not table format
 * Linear format: **Speaker:** text on separate lines with <translation> block
 * Table format (deprecated): | English | Vietnamese |
 */
function validateDialogueFormat(content) {
  const issues = [];
  const dialogueBlocks = content.match(/<dialogue>([\s\S]*?)<\/dialogue>/g) || [];
  const TABLE_HEADER = /\|\s*English\s*\|\s*Vietnamese\s*\|/i;

  for (let i = 0; i < dialogueBlocks.length; i++) {
    const block = dialogueBlocks[i];
    const blockContent = block.replace(/<\/?dialogue>/g, '').trim();

    // Check if still using table format
    if (TABLE_HEADER.test(blockContent)) {
      issues.push({
        type: 'TABLE_FORMAT',
        detail: `Dialogue block ${i + 1} uses table format - should be linear format`
      });
      continue;
    }

    // Check if linear dialogue has matching translation block
    // Look for <translation> within reasonable distance after dialogue
    const dialoguePos = content.indexOf(block);
    const afterDialogue = content.substring(dialoguePos + block.length, dialoguePos + block.length + 200);
    const hasTranslation = /<translation>/.test(afterDialogue);

    if (!hasTranslation) {
      issues.push({
        type: 'MISSING_DIALOGUE_TRANSLATION',
        detail: `Dialogue block ${i + 1} has no <translation> block following it`
      });
    }
  }

  return issues;
}

/**
 * Run all quality checks on voice lecture content
 */
function runQualityChecks(content, grade, section) {
  const results = {
    exerciseTranslations: { passed: true, issues: [] },
    listeningRequirements: { passed: true, issues: [] },
    readingRequirements: { passed: true, issues: [] },
    dialogueFormat: { passed: true, issues: [] }
  };

  // Always check exercise translations
  const translationIssues = validateExerciseTranslations(content);
  if (translationIssues.length > 0) {
    results.exerciseTranslations.passed = false;
    results.exerciseTranslations.issues = translationIssues;
  }

  // Check listening requirements for listening sections
  if (isListeningSection(grade, section)) {
    const listeningIssues = validateListeningRequirements(content);
    if (listeningIssues.length > 0) {
      results.listeningRequirements.passed = false;
      results.listeningRequirements.issues = listeningIssues;
    }
  }

  // Check reading requirements for reading sections
  if (isReadingSection(grade, section)) {
    const readingIssues = validateReadingRequirements(content);
    if (readingIssues.length > 0) {
      results.readingRequirements.passed = false;
      results.readingRequirements.issues = readingIssues;
    }
  }

  // Check dialogue format (all sections with dialogues)
  const dialogueIssues = validateDialogueFormat(content);
  if (dialogueIssues.length > 0) {
    results.dialogueFormat.passed = false;
    results.dialogueFormat.issues = dialogueIssues;
  }

  return results;
}

// =============================================================================
// TEXT NORMALIZATION & UTILITIES
// =============================================================================

/** Strip markdown formatting: bold, italic, links, etc. */
function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // **bold** → bold
    .replace(/\*([^*]+)\*/g, '$1')       // *italic* → italic
    .replace(/_([^_]+)_/g, '$1')         // _italic_ → italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url) → link
    .replace(/`([^`]+)`/g, '$1');        // `code` → code
}

/** Normalize text for comparison: strip format, lowercase, collapse whitespace */
function normalize(text) {
  if (!text) return '';
  return stripMarkdown(text)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Check if text contains Vietnamese diacritics */
function isVietnamese(text) {
  const vnPattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  return vnPattern.test(text);
}

/** Extract tokens (words) from text */
function tokenize(text) {
  return normalize(text).split(/\s+/).filter(t => t.length > 0);
}

/** Split text into sentences */
function splitSentences(text) {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5 && !isVietnamese(s));
}

// =============================================================================
// STRICT NORMALIZED COMPARISON (New - favors false positives)
// =============================================================================

/** Normalize strictly: keep only a-z, lowercase, collapse whitespace */
function normalizeStrict(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Compare two texts using strict normalized sentence matching.
 * Any source sentence not found in voice = flagged.
 * Returns: matchRate, unmatched sentences, severity
 */
function compareNormalizedSentences(sourceText, voiceText) {
  if (!sourceText) return { matchRate: 100, unmatched: [], passed: true, severity: 'PASS' };

  const sourceSentences = splitSentences(sourceText).map(normalizeStrict).filter(s => s.length >= 10);
  const voiceNormalized = normalizeStrict(voiceText || '');

  if (sourceSentences.length === 0) {
    return { matchRate: 100, unmatched: [], passed: true, severity: 'PASS' };
  }

  let matched = 0;
  const unmatched = [];

  for (const sentence of sourceSentences) {
    if (voiceNormalized.includes(sentence)) {
      matched++;
    } else {
      unmatched.push(sentence);
    }
  }

  const matchRate = (matched / sourceSentences.length) * 100;

  // STRICT: Any unmatched sentence = CRITICAL flag
  return {
    matchRate,
    unmatched,
    total: sourceSentences.length,
    matched,
    passed: unmatched.length === 0,
    severity: unmatched.length > 0 ? 'CRITICAL' : 'PASS'
  };
}

/**
 * Extract raw English text blocks from source file (loigiaihay format).
 * Simpler approach: just get text between markers, filter out Vietnamese.
 */
function extractSourceBlocks(content) {
  const blocks = { dialogueText: '', questionText: '', readingText: '' };

  // Dialogue: Between Bài 1 and Tạm dịch (or Bài 2)
  const bai1Match = content.match(/\*\*(?:Bài\s+)?1\.?\*\*[\s\S]*?(?=\*\*Tạm dịch|\*\*Bài\s+2|\*\*Phương pháp)/i);
  if (bai1Match) {
    // Extract English dialogue lines: ***Speaker:*** text or **Speaker:** text
    const dialogueLines = bai1Match[0].match(/\*{2,3}([A-Z][a-z]+):\*{2,3}\s*([^\n*]+)/g) || [];
    const englishLines = dialogueLines
      .map(line => line.replace(/\*{2,3}[A-Za-z]+:\*{2,3}\s*/, '').trim())
      .filter(line => !isVietnamese(line) && line.length > 5);
    blocks.dialogueText = englishLines.join(' ');
  }

  // Questions: All exercise text (English parts only)
  const questionMatches = content.match(/\d+\.\s+[A-Z][^*\n]+/g) || [];
  blocks.questionText = questionMatches
    .filter(q => !isVietnamese(q))
    .join(' ');

  // Reading: Look for substantial English paragraphs
  const paragraphs = content.split(/\n\n+/);
  const englishParagraphs = paragraphs
    .filter(p => p.length > 100 && !isVietnamese(p) && /^[A-Z]/.test(p.trim()))
    .join(' ');
  blocks.readingText = englishParagraphs;

  return blocks;
}

/**
 * Extract raw English text blocks from voice file (custom tags format).
 */
function extractVoiceBlocks(content) {
  const blocks = { dialogueText: '', questionText: '', readingText: '' };

  // Dialogue: Inside <dialogue> tags (both table and linear format)
  const dialogueMatches = content.match(/<dialogue>([\s\S]*?)<\/dialogue>/g) || [];
  for (const match of dialogueMatches) {
    const inner = match.replace(/<\/?dialogue>/g, '');
    // Extract English text, remove speaker markers and Vietnamese
    const lines = inner.split('\n')
      .map(line => line.replace(/^\*\*[A-Za-z]+:\*\*\s*/, '').replace(/\|/g, '').trim())
      .filter(line => line.length > 5 && !isVietnamese(line) && /^[A-Za-z]/.test(line));
    blocks.dialogueText += ' ' + lines.join(' ');
  }

  // Questions: Inside <questions> tags
  const questionMatches = content.match(/<questions[^>]*>([\s\S]*?)<\/questions>/g) || [];
  for (const match of questionMatches) {
    const inner = match.replace(/<\/?questions[^>]*>/g, '');
    const lines = inner.split('\n')
      .map(line => line.replace(/^\*\*\d+\.\*\*\s*/, '').trim())
      .filter(line => line.length > 5 && !isVietnamese(line) && /^[A-Za-z]/.test(line));
    blocks.questionText += ' ' + lines.join(' ');
  }

  // Reading: Inside <reading> tags
  const readingMatches = content.match(/<reading>([\s\S]*?)<\/reading>/g) || [];
  for (const match of readingMatches) {
    const inner = match.replace(/<\/?reading>/g, '');
    const lines = inner.split('\n')
      .filter(line => line.length > 5 && !isVietnamese(line));
    blocks.readingText += ' ' + lines.join(' ');
  }

  return blocks;
}

/**
 * Run strict comparison between source and voice blocks.
 * Returns array of results for each content type.
 */
function runStrictComparison(sourceBlocks, voiceBlocks) {
  const results = [];

  // Compare dialogues
  if (sourceBlocks.dialogueText && sourceBlocks.dialogueText.length > 20) {
    const result = compareNormalizedSentences(sourceBlocks.dialogueText, voiceBlocks.dialogueText);
    results.push({ type: 'Dialogue', ...result });
  }

  // Compare questions
  if (sourceBlocks.questionText && sourceBlocks.questionText.length > 20) {
    const result = compareNormalizedSentences(sourceBlocks.questionText, voiceBlocks.questionText);
    results.push({ type: 'Questions', ...result });
  }

  // Compare reading
  if (sourceBlocks.readingText && sourceBlocks.readingText.length > 50) {
    const result = compareNormalizedSentences(sourceBlocks.readingText, voiceBlocks.readingText);
    results.push({ type: 'Reading', ...result });
  }

  const hasIssues = results.some(r => r.unmatched && r.unmatched.length > 0);
  return { results, overallSeverity: hasIssues ? 'CRITICAL' : 'PASS' };
}

// =============================================================================
// MATCHING ALGORITHMS
// =============================================================================

/** Calculate Levenshtein similarity percentage */
function levenshteinSimilarity(a, b) {
  const normA = normalize(a);
  const normB = normalize(b);
  if (!normA && !normB) return 100;
  if (!normA || !normB) return 0;
  const dist = distance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  return maxLen === 0 ? 100 : ((maxLen - dist) / maxLen) * 100;
}

/** Check substring containment (startsWith, endsWith, includes) */
function substringMatch(source, voice) {
  const normSrc = normalize(source);
  const normVoice = normalize(voice);
  if (!normSrc || !normVoice) return { match: false, ratio: 0 };

  // Check if one contains the other
  if (normVoice.includes(normSrc)) {
    return { match: true, ratio: normSrc.length / normVoice.length, type: 'voice-contains-source' };
  }
  if (normSrc.includes(normVoice)) {
    return { match: true, ratio: normVoice.length / normSrc.length, type: 'source-contains-voice' };
  }

  // Check prefix/suffix overlap
  const minLen = Math.min(normSrc.length, normVoice.length);
  const checkLen = Math.floor(minLen * 0.7); // 70% overlap threshold

  if (normSrc.startsWith(normVoice.substring(0, checkLen)) ||
      normVoice.startsWith(normSrc.substring(0, checkLen))) {
    return { match: true, ratio: checkLen / minLen, type: 'prefix' };
  }

  if (normSrc.endsWith(normVoice.substring(normVoice.length - checkLen)) ||
      normVoice.endsWith(normSrc.substring(normSrc.length - checkLen))) {
    return { match: true, ratio: checkLen / minLen, type: 'suffix' };
  }

  return { match: false, ratio: 0 };
}

/** Calculate Longest Common Subsequence length */
function lcsLength(a, b) {
  const m = a.length;
  const n = b.length;

  // Optimize for long strings - use rolling array
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** LCS-based similarity (more robust for insertions/deletions) */
function lcsSimilarity(a, b) {
  const normA = normalize(a);
  const normB = normalize(b);
  if (!normA && !normB) return 100;
  if (!normA || !normB) return 0;

  // For very long strings, use token-based LCS
  if (normA.length > 500 || normB.length > 500) {
    const tokensA = tokenize(a);
    const tokensB = tokenize(b);
    const lcs = lcsLength(tokensA, tokensB);
    return (lcs / Math.max(tokensA.length, tokensB.length)) * 100;
  }

  const lcs = lcsLength(normA, normB);
  return (lcs / Math.max(normA.length, normB.length)) * 100;
}

/** Jaccard similarity on tokens (handles word reordering) */
function jaccardSimilarity(a, b) {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (tokensA.size === 0 && tokensB.size === 0) return 100;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  const intersection = [...tokensA].filter(t => tokensB.has(t));
  const union = new Set([...tokensA, ...tokensB]);
  return (intersection.length / union.size) * 100;
}

/**
 * Multi-layer flexible matching - tries multiple algorithms
 * Returns best match result with confidence score
 */
function flexibleMatch(source, voice) {
  const normSrc = normalize(source);
  const normVoice = normalize(voice);

  // Layer 1: Exact match after normalization
  if (normSrc === normVoice) {
    return { match: true, confidence: 100, method: 'exact' };
  }

  // Layer 2: Substring containment
  const subMatch = substringMatch(source, voice);
  if (subMatch.match && subMatch.ratio >= 0.7) {
    return { match: true, confidence: 95 * subMatch.ratio, method: `substring-${subMatch.type}` };
  }

  // Layer 3: Levenshtein similarity
  const levSim = levenshteinSimilarity(source, voice);
  if (levSim >= THRESHOLDS.HIGH) {
    return { match: true, confidence: levSim, method: 'levenshtein' };
  }

  // Layer 4: LCS similarity (better for insertions)
  const lcsSim = lcsSimilarity(source, voice);
  if (lcsSim >= THRESHOLDS.MEDIUM) {
    return { match: true, confidence: lcsSim, method: 'lcs' };
  }

  // Layer 5: Jaccard similarity (handles reordering)
  const jacSim = jaccardSimilarity(source, voice);
  if (jacSim >= THRESHOLDS.MEDIUM) {
    return { match: true, confidence: jacSim, method: 'jaccard' };
  }

  // No match - return best score
  const bestSim = Math.max(levSim, lcsSim, jacSim);
  return { match: false, confidence: bestSim, method: 'none' };
}

// =============================================================================
// ENTITY FINGERPRINTING
// =============================================================================

/**
 * Extract fingerprint: names, numbers, quoted text
 * These MUST match exactly - fabrication often changes these
 */
function extractFingerprint(text) {
  const cleanText = stripMarkdown(text);

  return {
    // Speaker names in dialogue format: "Name:" or "**Name:**"
    speakers: [...new Set((cleanText.match(/\b([A-Z][a-z]{1,15}):/g) || [])
      .map(s => s.replace(':', '').toLowerCase()))],

    // Proper nouns (capitalized words, likely names/places)
    properNouns: [...new Set((cleanText.match(/\b[A-Z][a-z]{2,15}\b/g) || [])
      .map(n => n.toLowerCase()))],

    // Numbers (important data points)
    numbers: [...new Set(cleanText.match(/\b\d+(?:\.\d+)?%?\b/g) || [])],

    // Quoted text (direct speech, important phrases)
    quotes: (cleanText.match(/"([^"]{3,50})"/g) || [])
      .map(q => normalize(q))
  };
}

// =============================================================================
// MEDIA & LINK EXTRACTION
// =============================================================================

/**
 * Extract media references: MP3 files, audio links, exercise links
 * Returns structured media info for comparison
 */
function extractMedia(text) {
  const media = {
    mp3Files: [],      // Direct .mp3 file references
    audioLinks: [],    // Links to audio content
    exerciseLinks: [], // Links to exercises/external content
    imageLinks: []     // Image references
  };

  // MP3 file patterns
  const mp3Patterns = [
    /https?:\/\/[^\s"'<>\)]+\.mp3/gi,                  // Direct URL (exclude ) too)
    /\[.*?\]\((https?:\/\/[^\s\)]+\.mp3)\)/gi,         // Markdown link [text](url.mp3)
    /<audio>\s*(https?:\/\/[^\s<]+\.mp3)\s*<\/audio>/gi, // <audio>url</audio>
    /<audio>\s*\n?(https?:\/\/[^\s<\n]+\.mp3)/gi,      // <audio>\nurl (multiline)
    /src=["']([^"']+\.mp3)["']/gi,                     // HTML src
    /href=["']([^"']+\.mp3)["']/gi                     // HTML href
  ];

  for (const pattern of mp3Patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      let url = (match[1] || match[0]).trim();
      // Clean up any trailing characters
      url = url.replace(/[\s\)\]>]+$/, '');
      if (url && !media.mp3Files.includes(url)) {
        media.mp3Files.push(url);
      }
    }
  }

  // General audio links (non-mp3 but audio-related)
  const audioPatterns = [
    /https?:\/\/[^\s"'<>]*(?:audio|sound|listen)[^\s"'<>]*/gi,
    /\[.*?(?:Listen|Audio|Nghe).*?\]\(([^)]+)\)/gi
  ];

  for (const pattern of audioPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const url = match[1] || match[0];
      if (!media.audioLinks.includes(url) && !media.mp3Files.includes(url)) {
        media.audioLinks.push(url);
      }
    }
  }

  // Image references - extract FIRST to exclude from links
  const imagePatterns = [
    /https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp)/gi,
    /!\[.*?\]\(([^)]+)\)/gi  // Markdown images
  ];

  for (const pattern of imagePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const url = match[1] || match[0];
      if (!media.imageLinks.includes(url)) {
        media.imageLinks.push(url);
      }
    }
  }

  // Exercise/external links (loigiaihay, etc.) - exclude images
  const linkPatterns = [
    /https?:\/\/(?:www\.)?loigiaihay\.com[^\s"'<>)]+/gi,
    /https?:\/\/[^\s"'<>)]+(?:exercise|bai-tap|unit)[^\s"'<>)]*/gi,
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi  // Markdown links [text](url)
  ];

  for (const pattern of linkPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const url = match[2] || match[1] || match[0];
      // Skip if already categorized (mp3, audio, or image)
      const isImage = media.imageLinks.some(img =>
        img.includes(url) || url.includes(img)
      );
      if (!media.mp3Files.includes(url) &&
          !media.audioLinks.includes(url) &&
          !media.exerciseLinks.includes(url) &&
          !isImage) {
        media.exerciseLinks.push(url);
      }
    }
  }

  return media;
}

/**
 * Compare media bi-directionally
 * Missing media = incomplete lesson
 * Extra media in voice = usually OK (enhancements)
 */
function compareMediaBidirectional(sourceMedia, voiceMedia) {
  const results = {
    mp3: { missing: [], extra: [], matched: [] },
    audio: { missing: [], extra: [], matched: [] },
    links: { missing: [], extra: [], matched: [] },
    images: { missing: [], extra: [], matched: [] }
  };

  // Helper to normalize URL for comparison
  const normalizeUrl = (url) => {
    return url
      .replace(/^https?:\/\//, '')    // Remove protocol
      .replace(/^www\./, '')           // Remove www
      .replace(/[\s\)\]\>\/]+$/, '')   // Remove trailing chars
      .trim()
      .toLowerCase();
  };

  // Helper to compare URL lists
  const compareUrls = (sourceUrls, voiceUrls) => {
    const missing = [];
    const extra = [];
    const matched = [];
    const voiceMatched = new Set();

    for (const srcUrl of sourceUrls) {
      const normSrc = normalizeUrl(srcUrl);

      let found = false;
      for (let i = 0; i < voiceUrls.length; i++) {
        const normVoice = normalizeUrl(voiceUrls[i]);

        // Check exact match or if one contains the other (for shortened URLs)
        if (normSrc === normVoice ||
            normSrc.includes(normVoice) ||
            normVoice.includes(normSrc)) {
          matched.push({ source: srcUrl, voice: voiceUrls[i] });
          voiceMatched.add(i);
          found = true;
          break;
        }
      }

      if (!found) {
        missing.push(srcUrl);
      }
    }

    // Find extra in voice
    for (let i = 0; i < voiceUrls.length; i++) {
      if (!voiceMatched.has(i)) {
        extra.push(voiceUrls[i]);
      }
    }

    return { missing, extra, matched };
  };

  results.mp3 = compareUrls(sourceMedia.mp3Files, voiceMedia.mp3Files);
  results.audio = compareUrls(sourceMedia.audioLinks, voiceMedia.audioLinks);
  results.links = compareUrls(sourceMedia.exerciseLinks, voiceMedia.exerciseLinks);
  results.images = compareUrls(sourceMedia.imageLinks, voiceMedia.imageLinks);

  // Calculate overall stats
  const totalSourceMedia = sourceMedia.mp3Files.length + sourceMedia.audioLinks.length;
  const totalMissing = results.mp3.missing.length + results.audio.missing.length;
  const matchRate = totalSourceMedia > 0 ?
    ((totalSourceMedia - totalMissing) / totalSourceMedia) * 100 : 100;

  return {
    ...results,
    matchRate,
    hasMissingAudio: results.mp3.missing.length > 0 || results.audio.missing.length > 0
  };
}

/**
 * Compare fingerprints bi-directionally
 * Returns critical issues if key entities don't match
 */
function compareFingerprints(sourceFp, voiceFp) {
  const issues = [];

  // Speakers must match (critical for dialogues)
  const missingSpeakers = sourceFp.speakers.filter(s => !voiceFp.speakers.includes(s));
  const extraSpeakers = voiceFp.speakers.filter(s => !sourceFp.speakers.includes(s));

  if (missingSpeakers.length > 0) {
    issues.push({ type: 'MISSING', entity: 'speakers', values: missingSpeakers });
  }
  if (extraSpeakers.length > 0) {
    issues.push({ type: 'FABRICATED', entity: 'speakers', values: extraSpeakers });
  }

  // Numbers must match (educational accuracy)
  const missingNumbers = sourceFp.numbers.filter(n => !voiceFp.numbers.includes(n));
  const extraNumbers = voiceFp.numbers.filter(n => !sourceFp.numbers.includes(n));

  if (missingNumbers.length > 0) {
    issues.push({ type: 'MISSING', entity: 'numbers', values: missingNumbers });
  }
  if (extraNumbers.length > 0) {
    issues.push({ type: 'FABRICATED', entity: 'numbers', values: extraNumbers });
  }

  return issues;
}

// =============================================================================
// BI-DIRECTIONAL CONTENT COMPARISON
// =============================================================================

/**
 * Bi-directional sentence alignment
 * Returns: matched, missingFromVoice (source→voice), fabricatedInVoice (voice→source)
 */
function alignSentencesBidirectional(sourceText, voiceText) {
  const sourceSentences = splitSentences(sourceText);
  const voiceSentences = splitSentences(voiceText);

  const matched = [];
  const missingFromVoice = [];  // In source, not in voice
  const fabricatedInVoice = []; // In voice, not in source

  const voiceMatched = new Set();

  // Direction 1: Source → Voice (find missing content)
  for (const srcSent of sourceSentences) {
    let bestMatch = null;
    let bestScore = 0;
    let bestIdx = -1;

    for (let i = 0; i < voiceSentences.length; i++) {
      const result = flexibleMatch(srcSent, voiceSentences[i]);
      if (result.confidence > bestScore) {
        bestScore = result.confidence;
        bestMatch = voiceSentences[i];
        bestIdx = i;
      }
    }

    if (bestScore >= THRESHOLDS.MEDIUM) {
      matched.push({
        source: srcSent.substring(0, 60),
        voice: bestMatch.substring(0, 60),
        score: bestScore.toFixed(0)
      });
      voiceMatched.add(bestIdx);
    } else {
      missingFromVoice.push({
        text: srcSent.substring(0, 80),
        bestScore: bestScore.toFixed(0)
      });
    }
  }

  // Direction 2: Voice → Source (find fabricated content)
  for (let i = 0; i < voiceSentences.length; i++) {
    if (voiceMatched.has(i)) continue;

    const voiceSent = voiceSentences[i];
    let bestScore = 0;

    for (const srcSent of sourceSentences) {
      const result = flexibleMatch(voiceSent, srcSent);
      if (result.confidence > bestScore) {
        bestScore = result.confidence;
      }
    }

    if (bestScore < THRESHOLDS.MEDIUM) {
      fabricatedInVoice.push({
        text: voiceSent.substring(0, 80),
        bestScore: bestScore.toFixed(0)
      });
    }
  }

  const totalSource = sourceSentences.length;
  const totalVoice = voiceSentences.length;
  const matchRate = totalSource > 0 ? (matched.length / totalSource) * 100 : 100;
  const fabricationRate = totalVoice > 0 ? (fabricatedInVoice.length / totalVoice) * 100 : 0;

  return {
    matched,
    missingFromVoice,
    fabricatedInVoice,
    matchRate,
    fabricationRate,
    stats: { totalSource, totalVoice, matchedCount: matched.length }
  };
}

/**
 * Bi-directional token/word comparison for vocabulary
 */
function compareVocabularyBidirectional(sourceVocab, voiceVocab) {
  const matched = [];
  const missingFromVoice = [];
  const fabricatedInVoice = [];

  const voiceMatched = new Set();

  // Source → Voice
  for (const srcWord of sourceVocab) {
    let found = false;
    for (let i = 0; i < voiceVocab.length; i++) {
      if (flexibleMatch(srcWord, voiceVocab[i]).confidence >= THRESHOLDS.MEDIUM) {
        matched.push({ source: srcWord, voice: voiceVocab[i] });
        voiceMatched.add(i);
        found = true;
        break;
      }
    }
    if (!found) {
      missingFromVoice.push(srcWord);
    }
  }

  // Voice → Source
  for (let i = 0; i < voiceVocab.length; i++) {
    if (voiceMatched.has(i)) continue;
    const voiceWord = voiceVocab[i];
    const foundInSource = sourceVocab.some(s =>
      flexibleMatch(voiceWord, s).confidence >= THRESHOLDS.MEDIUM
    );
    if (!foundInSource) {
      fabricatedInVoice.push(voiceWord);
    }
  }

  const matchRate = sourceVocab.length > 0 ? (matched.length / sourceVocab.length) * 100 : 100;
  const fabricationRate = voiceVocab.length > 0 ? (fabricatedInVoice.length / voiceVocab.length) * 100 : 0;

  return { matched, missingFromVoice, fabricatedInVoice, matchRate, fabricationRate };
}

/**
 * Clean text for comparison: strip formatting, keep only letters
 */
function cleanTextForComparison(text, isVietnamese = false) {
  let cleaned = text
    .replace(/\*\*[^*]+\*\*/g, '')  // Remove bold markers
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (isVietnamese) {
    // Keep Vietnamese diacritics
    cleaned = cleaned.replace(/[^a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/gi, ' ');
  } else {
    cleaned = cleaned.replace(/[^a-z\s]/gi, ' ');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Count words in cleaned text
 */
function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Validate translation quality - STRICT mode with per-sentence checking
 * Checks: numbers, names, sentence-level alignment, key content
 */
function validateTranslation(englishText, vietnameseText) {
  const issues = [];

  // 1. Check numbers - all numbers must appear in translation
  const englishNumbers = englishText.match(/\b\d+(?:[,.]\d+)?%?\b/g) || [];
  const vietnameseNumbers = vietnameseText.match(/\b\d+(?:[,.]\d+)?%?\b/g) || [];
  for (const num of englishNumbers) {
    if (!vietnameseNumbers.includes(num)) {
      issues.push({ type: 'MISSING_NUMBER', value: num });
    }
  }

  // 2. Per-sentence validation - each English sentence should have a Vietnamese counterpart
  const engSentences = englishText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 15);
  const vieSentences = vietnameseText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);

  // Check sentence count
  if (vieSentences.length < engSentences.length * 0.7) {
    issues.push({
      type: 'TRUNCATED',
      value: `${vieSentences.length}/${engSentences.length} sentences (${Math.round(vieSentences.length/engSentences.length*100)}%)`
    });
  }

  // 3. Per-sentence word ratio check
  let shortSentences = 0;
  const minSentencesToCheck = Math.min(engSentences.length, vieSentences.length);

  for (let i = 0; i < minSentencesToCheck; i++) {
    const engClean = cleanTextForComparison(engSentences[i], false);
    const vieClean = cleanTextForComparison(vieSentences[i], true);

    const engWordCount = countWords(engClean);
    const vieWordCount = countWords(vieClean);

    // Each Vietnamese sentence should be at least 60% of English sentence word count
    if (engWordCount > 5 && vieWordCount < engWordCount * 0.6) {
      shortSentences++;
    }
  }

  if (shortSentences > 0) {
    issues.push({
      type: 'SHORT_SENTENCES',
      value: `${shortSentences}/${minSentencesToCheck} sentences too short`
    });
  }

  // 4. Overall word ratio check
  const cleanEng = cleanTextForComparison(englishText, false);
  const cleanVie = cleanTextForComparison(vietnameseText, true);
  const engWords = countWords(cleanEng);
  const vieWords = countWords(cleanVie);
  const wordRatio = vieWords / Math.max(engWords, 1);

  if (wordRatio < 0.7) {
    issues.push({
      type: 'TOO_SHORT',
      value: `${vieWords}/${engWords} words (${Math.round(wordRatio * 100)}%)`
    });
  }

  // 5. Character count ratio - detect heavily simplified translations
  const engChars = cleanEng.replace(/\s+/g, '').length;
  const vieChars = cleanVie.replace(/\s+/g, '').length;
  const charRatio = vieChars / Math.max(engChars, 1);

  if (charRatio < 0.6) {
    issues.push({
      type: 'SIMPLIFIED',
      value: `${vieChars}/${engChars} chars (${Math.round(charRatio * 100)}%)`
    });
  }

  // 6. Common words to exclude from name checking
  const commonWords = new Set([
    // Pronouns & determiners
    'the', 'this', 'that', 'they', 'there', 'these', 'those', 'it', 'its', 'our', 'your',
    'i', 'we', 'you', 'he', 'she', 'my', 'his', 'her', 'their',
    // Prepositions & conjunctions
    'in', 'on', 'at', 'for', 'to', 'and', 'but', 'or', 'as', 'if', 'so', 'yet',
    // Question words
    'what', 'when', 'where', 'how', 'who', 'why', 'which',
    // Location words
    'outside', 'inside', 'here', 'there',
    // Common nouns (education context)
    'students', 'teachers', 'modern', 'schools', 'learning', 'class', 'group',
    'digital', 'resources', 'field', 'trips', 'people', 'children', 'parents',
    'lessons', 'questions', 'answers', 'help', 'work', 'time', 'way', 'problem',
    'email', 'internet', 'online', 'classmates', 'classroom', 'school',
    // Quantifiers & ordinals
    'each', 'every', 'some', 'many', 'all', 'most', 'few', 'several',
    'first', 'second', 'third', 'finally', 'last', 'only',
    // Transition words
    'then', 'now', 'also', 'however', 'furthermore', 'moreover', 'therefore',
    'although', 'because', 'since', 'while', 'during', 'after', 'before',
    // Other common words
    'today', 'tomorrow', 'yesterday', 'recently', 'currently',
    'think', 'better', 'really', 'much', 'more', 'can', 'have', 'don'
  ]);

  // 6. Check proper nouns (names) - must appear in translation
  const englishNames = [...new Set((englishText.match(/\b[A-Z][a-z]{2,15}\b/g) || [])
    .filter(n => !commonWords.has(n.toLowerCase())))];

  for (const name of englishNames) {
    if (!vietnameseText.toLowerCase().includes(name.toLowerCase())) {
      issues.push({ type: 'MISSING_NAME', value: name });
    }
  }

  // 7. Check key content - important phrases should have Vietnamese equivalents
  // Look for key English phrases and check if translation has Vietnamese equivalent concepts
  const keyPhrases = [
    { en: /face-to-face/i, vie: /trực tiếp|mặt đối mặt/i },
    { en: /online learning/i, vie: /học trực tuyến|học online/i },
    { en: /traditional classroom/i, vie: /lớp học truyền thống|lớp truyền thống/i },
    { en: /blended learning/i, vie: /học kết hợp|học hybrid/i },
    { en: /discussion board/i, vie: /bảng thảo luận|diễn đàn/i },
    { en: /advantages/i, vie: /ưu điểm|lợi thế/i },
    { en: /disadvantages/i, vie: /nhược điểm|bất lợi/i },
    { en: /distractions/i, vie: /phân tâm|xao nhãng/i },
    { en: /Internet connection/i, vie: /kết nối|Internet|mạng/i }
  ];

  for (const phrase of keyPhrases) {
    if (phrase.en.test(englishText) && !phrase.vie.test(vietnameseText)) {
      const match = englishText.match(phrase.en);
      issues.push({ type: 'MISSING_CONCEPT', value: match ? match[0] : 'concept' });
    }
  }

  return issues;
}

/**
 * Compare voice translation against source translation using text similarity
 */
function compareTranslationTexts(sourceTranslation, voiceTranslation) {
  const issues = [];

  // Clean and normalize both translations
  const cleanSource = cleanTextForComparison(sourceTranslation, true);
  const cleanVoice = cleanTextForComparison(voiceTranslation, true);

  // Calculate similarity using Levenshtein
  const similarity = levenshteinSimilarity(cleanSource, cleanVoice);

  // Require 90% match with source translation
  if (similarity < THRESHOLDS.HIGH) {
    issues.push({
      type: 'MISMATCH_SOURCE',
      value: `${Math.round(similarity)}% match with source translation`
    });
  }

  // Check word count difference
  const sourceWords = countWords(cleanSource);
  const voiceWords = countWords(cleanVoice);
  const wordDiff = Math.abs(sourceWords - voiceWords) / Math.max(sourceWords, 1);

  if (wordDiff > 0.3) {
    issues.push({
      type: 'WORD_COUNT_DIFF',
      value: `${voiceWords}/${sourceWords} words (${Math.round((1-wordDiff)*100)}%)`
    });
  }

  return { similarity, issues };
}

/**
 * Compare translations bi-directionally
 * Check: missing translations, wrong content, mismatch with source
 */
function compareTranslationsBidirectional(sourceReadings, voiceReadings, voiceTranslations, sourceTranslations = []) {
  const results = {
    matched: [],
    missing: [],      // Reading exists but no translation
    wrong: [],        // Translation has issues (missing numbers/names)
    mismatch: [],     // Translation doesn't match source translation
    extra: []         // Translation without corresponding reading
  };

  // Each reading should have a corresponding translation
  const totalReadings = voiceReadings.length;
  const totalTranslations = voiceTranslations.length;

  // Check for missing translations
  if (totalReadings > 0 && totalTranslations === 0) {
    results.missing.push({ type: 'NO_TRANSLATIONS', count: totalReadings });
    return {
      ...results,
      matchRate: 0,
      hasMissing: true,
      hasWrong: false,
      hasMismatch: false
    };
  }

  // Validate each translation against its source reading AND source translation
  const minCount = Math.min(totalReadings, totalTranslations);
  for (let i = 0; i < minCount; i++) {
    const reading = voiceReadings[i];
    const translation = voiceTranslations[i];
    let allIssues = [];

    // Check translation completeness against reading
    const validationIssues = validateTranslation(reading, translation);
    allIssues = allIssues.concat(validationIssues);

    // Compare against source translation if available
    if (sourceTranslations.length > i) {
      const sourceComparison = compareTranslationTexts(sourceTranslations[i], translation);
      if (sourceComparison.issues.length > 0) {
        allIssues = allIssues.concat(sourceComparison.issues);
        results.mismatch.push({
          index: i,
          similarity: sourceComparison.similarity,
          issues: sourceComparison.issues
        });
      }
    }

    if (allIssues.length === 0) {
      results.matched.push({ index: i });
    } else {
      results.wrong.push({
        index: i,
        issues: allIssues,
        readingPreview: reading.substring(0, 50),
        translationPreview: translation.substring(0, 50)
      });
    }
  }

  // Extra translations without readings
  if (totalTranslations > totalReadings) {
    for (let i = totalReadings; i < totalTranslations; i++) {
      results.extra.push({ index: i, preview: voiceTranslations[i].substring(0, 50) });
    }
  }

  // Missing translations for readings
  if (totalReadings > totalTranslations) {
    for (let i = totalTranslations; i < totalReadings; i++) {
      results.missing.push({ index: i, preview: voiceReadings[i].substring(0, 50) });
    }
  }

  const matchRate = totalReadings > 0 ? (results.matched.length / totalReadings) * 100 : 100;

  return {
    ...results,
    matchRate,
    hasMissing: results.missing.length > 0,
    hasWrong: results.wrong.length > 0,
    hasMismatch: results.mismatch.length > 0
  };
}

/**
 * Bi-directional answer comparison (zero tolerance for wrong answers)
 */
function compareAnswersBidirectional(sourceAnswers, voiceAnswers) {
  const matched = [];
  const wrong = [];      // Answer exists but different
  const missing = [];    // In source, not in voice
  const extra = [];      // In voice, not in source

  const voiceKeys = new Set(Object.keys(voiceAnswers));

  // Helper to detect answer type: 'letter' (A-D), 'word' (actual text), 'tf' (T/F)
  const getAnswerType = (value) => {
    const v = value.trim().toLowerCase();
    if (v.length === 1 && /^[a-d]$/.test(v)) return 'letter';
    if (/^(t|f|true|false)$/i.test(v)) return 'tf';
    return 'word';
  };

  // Source → Voice
  for (const [key, srcValue] of Object.entries(sourceAnswers)) {
    if (voiceKeys.has(key)) {
      voiceKeys.delete(key);
      const voiceValue = voiceAnswers[key];
      const normSrc = normalize(srcValue);
      const normVoice = normalize(voiceValue);

      if (normSrc === normVoice) {
        matched.push({ key, value: srcValue });
      } else {
        // Check if answer types are different (e.g., letter vs word)
        const srcType = getAnswerType(srcValue);
        const voiceType = getAnswerType(voiceValue);

        if (srcType !== voiceType) {
          // Different types - could be format difference, mark as matched
          // (e.g., source has "b" for MC, voice has actual answer text)
          matched.push({ key, value: srcValue, note: 'format-diff' });
        } else {
          wrong.push({ key, source: srcValue, voice: voiceValue });
        }
      }
    } else {
      missing.push({ key, value: srcValue });
    }
  }

  // Voice → Source (remaining keys are extra)
  for (const key of voiceKeys) {
    extra.push({ key, value: voiceAnswers[key] });
  }

  const total = Object.keys(sourceAnswers).length;
  const matchRate = total > 0 ? (matched.length / total) * 100 : 100;

  return { matched, wrong, missing, extra, matchRate };
}

// =============================================================================
// FILE PARSERS
// =============================================================================

/** Parse source file (loigiaihay.com format) */
function parseSourceFile(content) {
  content = content.replace(/\r\n/g, '\n');

  const result = {
    dialogues: [],
    exercises: [],
    vocabulary: [],
    answers: {},
    readings: [],
    translations: [],  // Vietnamese translations from source
    media: extractMedia(content)  // Extract media references
  };

  // Extract dialogues from Bài 1 section (main dialogue only)
  const bai1Section = content.split(/\*\*Bài\s+2\*\*/)[0] || content;
  const dialogueRegex = /\*\*([A-Z][a-z]{1,14})(?::\*\*|\*\*:)\s*(.+?)(?=\n|$)/g;
  let match;
  while ((match = dialogueRegex.exec(bai1Section)) !== null) {
    const text = match[2].trim();
    if (!text.startsWith('_') && !text.startsWith('*') && !isVietnamese(text)) {
      result.dialogues.push({ speaker: match[1], text });
    }
  }

  // Build reading content from dialogues
  if (result.dialogues.length > 0) {
    result.readings.push(result.dialogues.map(d => `${d.speaker}: ${d.text}`).join('\n'));
  }

  // Extract reading passages (G10+ format): ALL-CAPS title followed by paragraphs
  // Pattern: **TITLE** or TITLE in all caps, followed by English paragraphs
  const readingPatterns = [
    /\*\*([A-Z][A-Z\s]{3,50})\*\*\s*\n+((?:[A-Z][^*\n]+[.!?]\s*)+)/g,  // **TITLE**
    /^([A-Z][A-Z\s]{3,50})\s*\n+((?:[A-Z][^*\n]+[.!?]\s*)+)/gm         // Plain TITLE
  ];

  for (const pattern of readingPatterns) {
    let readMatch;
    while ((readMatch = pattern.exec(content)) !== null) {
      const title = readMatch[1].trim();
      const body = readMatch[2].trim();
      // Only add if it's substantial English content (not Vietnamese)
      if (body.length > 100 && !isVietnamese(body)) {
        result.readings.push(`${title}\n${body}`);
      }
    }
  }

  // Extract exercises by Bài number
  const exerciseBlocks = content.split(/\*\*Bài\s+(\d+)\*\*/);
  for (let i = 1; i < exerciseBlocks.length; i += 2) {
    const baiNum = exerciseBlocks[i];
    const baiContent = exerciseBlocks[i + 1] || '';

    const questions = [];
    const questionRegex = /(\d+)\.\s+(.+?)(?=\n\d+\.|$|\*\*Lời giải)/gs;
    let qMatch;
    while ((qMatch = questionRegex.exec(baiContent)) !== null) {
      questions.push({ num: qMatch[1], text: qMatch[2].trim() });
    }

    const answerMatch = baiContent.match(/\*\*Lời giải chi tiết:\*\*\s*([\s\S]*?)(?=\*\*Bài|\*\*Từ vựng|$)/);
    if (answerMatch) {
      result.answers[`bai${baiNum}`] = answerMatch[1].trim();
    }

    if (questions.length > 0) {
      result.exercises.push({ bai: baiNum, questions, rawContent: baiContent.substring(0, 500) });
    }
  }

  // Extract vocabulary
  const vocabMatch = content.match(/\*\*Từ vựng\*\*([\s\S]*?)$/);
  if (vocabMatch) {
    const vocabRegex = /\*\*([a-zA-Z\s-]+)\*\*/g;
    let vMatch;
    while ((vMatch = vocabRegex.exec(vocabMatch[1])) !== null) {
      result.vocabulary.push(vMatch[1].trim().toLowerCase());
    }
  }

  // Extract translations - look for Vietnamese text after "Tạm dịch" markers
  // Multiple patterns: **Tạm dịch:**, *Tạm dịch:*, Tạm dịch:
  const translationMarkers = content.split(/\*?\*?Tạm dịch:?\*?\*?\s*/i);

  for (let i = 1; i < translationMarkers.length; i++) {
    // Get text until next major section
    let section = translationMarkers[i].split(/\*\*(?:Lời giải|Bài \d|Phương pháp)/)[0];

    // Extract Vietnamese text - remove markdown formatting, keep Vietnamese
    const vieText = section
      .replace(/\*\*\*?[A-Za-z]+\*\*\*?/g, ' ')   // Remove speaker names
      .replace(/\*([^*]+)\*/g, '$1')               // Extract italic text
      .replace(/\[.*?\]\(.*?\)/g, '')              // Remove links
      .replace(/!\[.*?\]\(.*?\)/g, '')             // Remove images
      .replace(/\s+/g, ' ')
      .trim();

    // Only add if it's substantial Vietnamese content
    if (vieText.length > 50 && isVietnamese(vieText)) {
      result.translations.push(vieText);
    }
  }

  // Also extract inline translations *(Vietnamese text)*
  const inlinePattern = /\*\(([^)]{20,})\)\*/g;
  let inlineMatch;
  const inlineTexts = [];
  while ((inlineMatch = inlinePattern.exec(content)) !== null) {
    if (isVietnamese(inlineMatch[1])) {
      inlineTexts.push(inlineMatch[1]);
    }
  }

  // If no translations found but many inline translations exist, combine them
  if (result.translations.length === 0 && inlineTexts.length > 3) {
    result.translations.push(inlineTexts.join(' '));
  }

  return result;
}

/** Parse voice lecture file (custom tags format) */
function parseVoiceLecture(content) {
  content = content.replace(/\r\n/g, '\n');

  const result = {
    dialogues: [],
    questions: [],
    answers: [],
    vocabulary: [],
    readings: [],
    tasks: [],
    translations: [],  // Vietnamese translations of content
    media: extractMedia(content)  // Extract media references
  };

  // Extract dialogues from <dialogue> tables
  const SAMPLE_SPEAKERS = ['Example', 'A', 'B', 'C', 'D', 'Sample'];
  const dialogueRegex = /<dialogue>([\s\S]*?)<\/dialogue>/g;
  let match;
  while ((match = dialogueRegex.exec(content)) !== null) {
    const tableContent = match[1];
    const rowRegex = /\|\s*\*\*([A-Za-z]+):\*\*\s*(.+?)\s*\|/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const speaker = rowMatch[1];
      if (!SAMPLE_SPEAKERS.includes(speaker)) {
        result.dialogues.push({ speaker, text: rowMatch[2].trim() });
      }
    }
  }

  // Extract reading/tapescript
  const readingRegex = /<reading>([\s\S]*?)<\/reading>/g;
  while ((match = readingRegex.exec(content)) !== null) {
    result.readings.push(match[1].trim());
  }

  // Extract questions
  const questionsRegex = /<questions[^>]*>([\s\S]*?)<\/questions>/g;
  while ((match = questionsRegex.exec(content)) !== null) {
    result.questions.push(match[1].trim());
  }

  // Extract answers
  const answerRegex = /<answer>([\s\S]*?)<\/answer>/g;
  while ((match = answerRegex.exec(content)) !== null) {
    result.answers.push(match[1].trim());
  }

  // Extract tasks
  const taskRegex = /<task>([\s\S]*?)<\/task>/g;
  while ((match = taskRegex.exec(content)) !== null) {
    result.tasks.push(match[1].trim());
  }

  // Extract vocabulary
  const vocabMatch = content.match(/<vocabulary>([\s\S]*?)<\/vocabulary>/);
  if (vocabMatch) {
    const vocabRegex = /\*\*([a-zA-Z\s-]+)\*\*/g;
    let vMatch;
    while ((vMatch = vocabRegex.exec(vocabMatch[1])) !== null) {
      result.vocabulary.push(vMatch[1].trim().toLowerCase());
    }
  }

  // Extract translations
  const translationRegex = /<translation>([\s\S]*?)<\/translation>/g;
  while ((match = translationRegex.exec(content)) !== null) {
    result.translations.push(match[1].trim());
  }

  return result;
}

// =============================================================================
// MAIN COMPARISON
// =============================================================================

/** Compare two parsed results with bi-directional analysis */
function compareContent(source, voice) {
  const issues = [];
  const summary = [];

  // 1. DIALOGUE COMPARISON (CRITICAL)
  const hasSourceDialogue = source.dialogues.length >= 3;
  const hasVoiceDialogue = voice.dialogues.length >= 3;

  if (hasSourceDialogue && hasVoiceDialogue) {
    // Fingerprint comparison
    const sourceText = source.dialogues.map(d => `${d.speaker}: ${d.text}`).join('\n');
    const voiceText = voice.dialogues.map(d => `${d.speaker}: ${d.text}`).join('\n');

    const sourceFp = extractFingerprint(sourceText);
    const voiceFp = extractFingerprint(voiceText);
    const fpIssues = compareFingerprints(sourceFp, voiceFp);

    for (const issue of fpIssues) {
      issues.push({
        type: issue.type === 'FABRICATED' ? 'CRITICAL' : 'HIGH',
        block: `Dialogue ${issue.entity}`,
        detail: `${issue.type}: ${issue.values.join(', ')}`
      });
    }

    // Sentence-level bi-directional comparison
    const dialogueAlign = alignSentencesBidirectional(sourceText, voiceText);

    summary.push({
      block: 'Dialogue',
      source: `${source.dialogues.length} lines`,
      voice: `${voice.dialogues.length} lines`,
      matchRate: dialogueAlign.matchRate.toFixed(0),
      fabricationRate: dialogueAlign.fabricationRate.toFixed(0),
      status: dialogueAlign.fabricationRate > 20 ? '❌ FABRICATED' :
              dialogueAlign.matchRate < THRESHOLDS.MEDIUM ? '⚠️ MISSING' : '✅ PASS'
    });

    if (dialogueAlign.fabricatedInVoice.length > 0) {
      issues.push({
        type: 'CRITICAL',
        block: 'Dialogue - Fabricated Content',
        detail: dialogueAlign.fabricatedInVoice.slice(0, 3).map(f => f.text).join(' | ')
      });
    }

    if (dialogueAlign.missingFromVoice.length > 0) {
      issues.push({
        type: 'HIGH',
        block: 'Dialogue - Missing Content',
        detail: dialogueAlign.missingFromVoice.slice(0, 3).map(m => m.text).join(' | ')
      });
    }
  }

  // 2. READING/TAPESCRIPT COMPARISON
  const hasSourceReading = (source.readings || []).length > 0;
  const hasVoiceReading = (voice.readings || []).length > 0;

  if (hasSourceReading && hasVoiceReading) {
    const sourceText = source.readings.join('\n');
    const voiceText = voice.readings.join('\n');

    const readingAlign = alignSentencesBidirectional(sourceText, voiceText);

    summary.push({
      block: 'Reading/Tapescript',
      source: `${source.readings.length} blocks`,
      voice: `${voice.readings.length} blocks`,
      matchRate: readingAlign.matchRate.toFixed(0),
      fabricationRate: readingAlign.fabricationRate.toFixed(0),
      status: readingAlign.fabricationRate > 30 ? '❌ FABRICATED' :
              readingAlign.matchRate < THRESHOLDS.LOW ? '⚠️ MISSING' : '✅ PASS'
    });

    if (readingAlign.fabricatedInVoice.length > 0) {
      issues.push({
        type: 'CRITICAL',
        block: 'Reading - Fabricated Content',
        detail: readingAlign.fabricatedInVoice.slice(0, 3).map(f => f.text).join(' | ')
      });
    }
  }

  // 2b. TRANSLATION COMPARISON (check voice translations match voice readings AND source translations)
  const voiceTranslations = voice.translations || [];
  const voiceReadings = voice.readings || [];
  const sourceTranslations = source.translations || [];

  if (voiceReadings.length > 0 || sourceTranslations.length > 0) {
    const translationResult = compareTranslationsBidirectional(
      source.readings || [],
      voiceReadings,
      voiceTranslations,
      sourceTranslations
    );

    summary.push({
      block: 'Translations',
      source: `${sourceTranslations.length} source, ${voiceReadings.length} readings`,
      voice: `${voiceTranslations.length} translations`,
      matchRate: translationResult.matchRate.toFixed(0),
      fabricationRate: '0',
      status: translationResult.hasMissing ? '⚠️ MISSING' :
              translationResult.hasMismatch ? '⚠️ MISMATCH' :
              translationResult.hasWrong ? '⚠️ WRONG' : '✅ PASS'
    });

    // Missing translations
    if (translationResult.missing.length > 0) {
      const missingDetail = translationResult.missing[0].type === 'NO_TRANSLATIONS'
        ? `No translations for ${translationResult.missing[0].count} readings`
        : `${translationResult.missing.length} readings without translations`;
      issues.push({
        type: 'MEDIUM',
        block: 'Translation - Missing',
        detail: missingDetail
      });
    }

    // Wrong translations (missing numbers/names)
    if (translationResult.wrong.length > 0) {
      const wrongDetails = translationResult.wrong.slice(0, 3).map(w => {
        const issueTypes = w.issues.map(i => `${i.type}: ${i.value}`).join(', ');
        return issueTypes;
      }).join(' | ');
      issues.push({
        type: 'MEDIUM',
        block: 'Translation - Wrong/Incomplete',
        detail: wrongDetails
      });
    }

    // Mismatch with source translation
    if (translationResult.mismatch.length > 0) {
      const mismatchDetails = translationResult.mismatch.slice(0, 3).map(m => {
        return `Block ${m.index + 1}: ${Math.round(m.similarity)}% match`;
      }).join(', ');
      issues.push({
        type: 'MEDIUM',
        block: 'Translation - Mismatch with Source',
        detail: mismatchDetails
      });
    }
  }

  // 3. VOCABULARY COMPARISON
  if (source.vocabulary.length > 0) {
    const vocabResult = compareVocabularyBidirectional(source.vocabulary, voice.vocabulary);

    summary.push({
      block: 'Vocabulary',
      source: `${source.vocabulary.length} words`,
      voice: `${voice.vocabulary.length} words`,
      matchRate: vocabResult.matchRate.toFixed(0),
      fabricationRate: vocabResult.fabricationRate.toFixed(0),
      status: vocabResult.fabricationRate > 30 ? '❌ FABRICATED' :
              vocabResult.matchRate < THRESHOLDS.LOW ? '⚠️ MISSING' : '✅ PASS'
    });

    if (vocabResult.fabricatedInVoice.length > 0) {
      issues.push({
        type: 'MEDIUM',
        block: 'Vocabulary - Extra Words',
        detail: vocabResult.fabricatedInVoice.slice(0, 5).join(', ')
      });
    }

    if (vocabResult.missingFromVoice.length > 0) {
      issues.push({
        type: 'MEDIUM',
        block: 'Vocabulary - Missing Words',
        detail: vocabResult.missingFromVoice.slice(0, 5).join(', ')
      });
    }
  }

  // 4. ANSWER COMPARISON (CRITICAL - wrong answers = educational harm)
  if (Object.keys(source.answers).length > 0 && voice.answers.length > 0) {
    // Parse voice answers into structured format
    const voiceAnswerMap = {};
    let baiNum = 0;
    for (const block of voice.answers) {
      const baiMatch = block.match(/Bài\s*(\d+)/i);
      baiNum = baiMatch ? parseInt(baiMatch[1]) : baiNum + 1;

      // Extract answer values - more precise patterns
      // Pattern 1: "1. A | 2. B" or "1.A | 2.B" (pipe-separated)
      // Pattern 2: "1-A, 2-B" (comma-separated with dash)
      // Pattern 3: "1. Kim | 2. Laura" (name answers)
      const answerPatterns = [
        /(\d+)\.\s*([A-Z])\s*(?:\||,|$)/gi,           // "1. A |" or "1. A,"
        /(\d+)-([A-Z])\s*(?:\||,|$)/gi,               // "1-A |" or "1-A,"
        /(\d+)\.\s*([A-Z][a-z]+)\s*(?:\||,|$)/gi      // "1. Kim |" (capitalized word)
      ];

      for (const pattern of answerPatterns) {
        const matches = block.matchAll(pattern);
        for (const m of matches) {
          const key = `bai${baiNum}_q${m[1]}`;
          if (!voiceAnswerMap[key]) {  // Don't overwrite
            voiceAnswerMap[key] = m[2].trim();
          }
        }
      }
    }

    // Parse source answers similarly
    const sourceAnswerMap = {};
    for (const [baiKey, text] of Object.entries(source.answers)) {
      const baiNum = baiKey.replace('bai', '');
      const answerPatterns = [
        /(\d+)\.\s*([A-Z])\s*(?:\||,|$)/gi,
        /(\d+)-([A-Z])\s*(?:\||,|$)/gi,
        /(\d+)\.\s*([A-Z][a-z]+)\s*(?:\||,|$)/gi
      ];
      for (const pattern of answerPatterns) {
        const matches = text.matchAll(pattern);
        for (const m of matches) {
          const key = `bai${baiNum}_q${m[1]}`;
          if (!sourceAnswerMap[key]) {  // Don't overwrite
            sourceAnswerMap[key] = m[2].replace(/\*\*/g, '').trim();
          }
        }
      }
    }

    const answerResult = compareAnswersBidirectional(sourceAnswerMap, voiceAnswerMap);

    summary.push({
      block: 'Answers',
      source: `${Object.keys(sourceAnswerMap).length} items`,
      voice: `${Object.keys(voiceAnswerMap).length} items`,
      matchRate: answerResult.matchRate.toFixed(0),
      fabricationRate: '0',
      status: answerResult.wrong.length > 0 ? '❌ WRONG ANSWERS' :
              answerResult.matchRate < THRESHOLDS.MEDIUM ? '⚠️ MISSING' : '✅ PASS'
    });

    if (answerResult.wrong.length > 0) {
      issues.push({
        type: 'CRITICAL',
        block: 'Answers - WRONG',
        detail: answerResult.wrong.slice(0, 5).map(w =>
          `${w.key}: "${w.voice}" should be "${w.source}"`
        ).join(' | ')
      });
    }
  }

  // 5. MEDIA/LINK COMPARISON (MP3, audio links, exercise links)
  const sourceMedia = source.media || { mp3Files: [], audioLinks: [], exerciseLinks: [], imageLinks: [] };
  const voiceMedia = voice.media || { mp3Files: [], audioLinks: [], exerciseLinks: [], imageLinks: [] };

  const totalSourceMedia = sourceMedia.mp3Files.length + sourceMedia.audioLinks.length +
                           sourceMedia.exerciseLinks.length + sourceMedia.imageLinks.length;

  if (totalSourceMedia > 0) {
    const mediaResult = compareMediaBidirectional(sourceMedia, voiceMedia);

    // Build source/voice counts string
    const sourceCount = `${sourceMedia.mp3Files.length} mp3, ${sourceMedia.exerciseLinks.length} links`;
    const voiceCount = `${voiceMedia.mp3Files.length} mp3, ${voiceMedia.exerciseLinks.length} links`;

    summary.push({
      block: 'Media/Links',
      source: sourceCount,
      voice: voiceCount,
      matchRate: mediaResult.matchRate.toFixed(0),
      fabricationRate: '0',
      status: mediaResult.hasMissingAudio ? '⚠️ MISSING AUDIO' :
              mediaResult.matchRate < THRESHOLDS.LOW ? '⚠️ MISSING' : '✅ PASS'
    });

    // Missing MP3 files is HIGH priority (audio required for listening exercises)
    if (mediaResult.mp3.missing.length > 0) {
      issues.push({
        type: 'HIGH',
        block: 'Media - Missing MP3',
        detail: mediaResult.mp3.missing.slice(0, 3).map(url => {
          // Extract filename from URL for readability
          const filename = url.split('/').pop() || url;
          return filename.length > 50 ? filename.substring(0, 47) + '...' : filename;
        }).join(', ')
      });
    }

    // Missing exercise links is MEDIUM priority
    if (mediaResult.links.missing.length > 0) {
      issues.push({
        type: 'MEDIUM',
        block: 'Media - Missing Links',
        detail: `${mediaResult.links.missing.length} links missing`
      });
    }

    // Missing images - LOW priority (informational)
    if (mediaResult.images.missing.length > 0) {
      issues.push({
        type: 'LOW',
        block: 'Media - Missing Images',
        detail: `${mediaResult.images.missing.length} images missing`
      });
    }
  }

  return { issues, summary };
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function generateReport(grade, unit, section, comparison) {
  const { issues, summary } = comparison;
  const gradeNum = parseInt(grade);

  const criticalIssues = issues.filter(i => i.type === 'CRITICAL');
  const hasCritical = criticalIssues.length > 0;
  const hasIssues = issues.length > 0;

  let report = `# Fabrication Check Report v2\n\n`;
  report += `**Grade:** ${grade} | **Unit:** ${unit} | **Section:** ${section}\n`;
  report += `**Status:** ${hasCritical ? '❌ CRITICAL - LIKELY FABRICATION' : hasIssues ? '⚠️ REVIEW NEEDED' : '✅ PASSED'}\n\n`;

  // Summary table
  report += `## Summary\n\n`;
  report += `| Block | Source | Voice | Match% | Fabrication% | Status |\n`;
  report += `|-------|--------|-------|--------|--------------|--------|\n`;
  for (const row of summary) {
    report += `| ${row.block} | ${row.source} | ${row.voice} | ${row.matchRate}% | ${row.fabricationRate}% | ${row.status} |\n`;
  }
  report += `\n`;

  // Issues
  if (issues.length > 0) {
    report += `## Issues\n\n`;
    for (const issue of issues) {
      const iconMap = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🔵' };
      const icon = iconMap[issue.type] || '⚪';
      report += `### ${icon} ${issue.type}: ${issue.block}\n\n`;
      report += `${issue.detail}\n\n`;
    }
  }

  // Quality Checks Summary
  if (comparison.qualityChecks) {
    const qc = comparison.qualityChecks;
    report += `## Quality Checks\n\n`;
    report += `| Check | Status | Details |\n`;
    report += `|-------|--------|--------|\n`;

    // Exercise translations
    const exTrans = qc.exerciseTranslations;
    if (exTrans.issues.length > 0) {
      const details = exTrans.issues.map(i => `Block ${i.block}: ${i.missing}/${i.total}`).join(', ');
      report += `| Exercise Translations | ⚠️ ${details} | Missing Vietnamese translations |\n`;
    } else {
      report += `| Exercise Translations | ✅ PASS | All questions have translations |\n`;
    }

    // Listening requirements (only show for listening sections)
    if (isListeningSection(gradeNum, section)) {
      const listen = qc.listeningRequirements;
      if (listen.issues.length > 0) {
        const details = listen.issues.map(i => i.type).join(', ');
        report += `| Listening Requirements | ❌ FAIL | ${details} |\n`;
      } else {
        report += `| Listening Requirements | ✅ PASS | Has audio + tapescript |\n`;
      }
    }

    // Reading requirements (only show for reading sections)
    if (isReadingSection(gradeNum, section)) {
      const read = qc.readingRequirements;
      if (read.issues.length > 0) {
        const details = read.issues.map(i => i.type).join(', ');
        report += `| Reading Requirements | ❌ FAIL | ${details} |\n`;
      } else {
        report += `| Reading Requirements | ✅ PASS | Has reading + translation |\n`;
      }
    }

    // Dialogue format (only show if dialogues exist)
    if (qc.dialogueFormat && qc.dialogueFormat.issues.length > 0) {
      const dialogue = qc.dialogueFormat;
      const details = dialogue.issues.map(i => i.type).join(', ');
      report += `| Dialogue Format | ❌ FAIL | ${details} |\n`;
    }

    report += `\n`;
  }

  // Strict Comparison Results (new) - Side-by-side comparison
  if (comparison.strictComparison) {
    const sc = comparison.strictComparison;
    const sourceBlocks = comparison.sourceBlocks || {};
    const voiceBlocks = comparison.voiceBlocks || {};

    report += `## Content Comparison (Source vs Voice)\n\n`;

    for (const result of sc.results) {
      if (!result.passed) {
        const type = result.type;
        const sourceKey = type.toLowerCase() + 'Text';
        const sourceContent = sourceBlocks[sourceKey] || '';
        const voiceContent = voiceBlocks[sourceKey] || '';

        report += `### ${type} (${result.matchRate.toFixed(0)}% match)\n\n`;

        // Show source content (first 500 chars)
        if (sourceContent) {
          report += `**📖 SOURCE (from textbook):**\n\`\`\`\n`;
          report += sourceContent.substring(0, 800).trim();
          if (sourceContent.length > 800) report += '\n... (truncated)';
          report += `\n\`\`\`\n\n`;
        }

        // Show voice content (first 500 chars)
        if (voiceContent) {
          report += `**🎤 VOICE (in lesson file):**\n\`\`\`\n`;
          report += voiceContent.substring(0, 800).trim();
          if (voiceContent.length > 800) report += '\n... (truncated)';
          report += `\n\`\`\`\n\n`;
        }

        // Show unmatched sentences
        if (result.unmatched && result.unmatched.length > 0) {
          report += `**❌ Unmatched source sentences (${result.unmatched.length}):**\n`;
          for (const sentence of result.unmatched.slice(0, 5)) {
            report += `- "${sentence}"\n`;
          }
          if (result.unmatched.length > 5) {
            report += `- ... and ${result.unmatched.length - 5} more\n`;
          }
          report += `\n`;
        }
      }
    }

    // Summary table
    report += `### Match Summary\n\n`;
    report += `| Content Type | Match Rate | Unmatched | Status |\n`;
    report += `|--------------|------------|-----------|--------|\n`;
    for (const result of sc.results) {
      const status = result.passed ? '✅ PASS' : '❌ CRITICAL';
      const unmatchedCount = result.unmatched ? result.unmatched.length : 0;
      report += `| ${result.type} | ${result.matchRate.toFixed(0)}% | ${unmatchedCount}/${result.total} | ${status} |\n`;
    }
    report += `\n`;
  }

  return report;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    options[key] = args[i + 1];
  }

  const grade = options.grade;
  const unit = options.unit;
  const section = options.section;

  if (!grade) {
    console.log('Fabrication Detection v2 - Bi-directional comparison');
    console.log('');
    console.log('Usage: node check-fabrication.js --grade <N> [--unit <NN>] [--section <name>]');
    console.log('');
    console.log('Examples:');
    console.log('  node check-fabrication.js --grade 6 --unit 11 --section getting-started');
    console.log('  node check-fabrication.js --grade 6 --unit 11');
    console.log('  node check-fabrication.js --grade 6');
    process.exit(1);
  }

  const unitsToCheck = unit ? [unit.padStart(2, '0')] :
    Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
  const sectionsToCheck = section ? [section] : getSectionsForGrade(grade);

  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  let totalPassed = 0;
  let totalFailed = 0;

  for (const unitNum of unitsToCheck) {
    for (const sect of sectionsToCheck) {
      const sourceFile = path.join(__dirname, 'loigiaihay.com', `grade${grade}`, `unit-${unitNum}`, `${sect}.md`);
      const voiceFile = path.join(__dirname, 'v2', 'data', 'voice-lectures', `g${grade}`, `unit-${unitNum}`, `${sect}.md`);

      if (!fs.existsSync(sourceFile) || !fs.existsSync(voiceFile)) {
        continue;
      }

      console.log(`Checking: G${grade} U${unitNum} ${sect}`);

      const sourceContent = fs.readFileSync(sourceFile, 'utf-8');
      const voiceContent = fs.readFileSync(voiceFile, 'utf-8');

      const sourceParsed = parseSourceFile(sourceContent);
      const voiceParsed = parseVoiceLecture(voiceContent);

      const comparison = compareContent(sourceParsed, voiceParsed);

      // Run STRICT normalized comparison (new - favors false positives)
      const sourceBlocks = extractSourceBlocks(sourceContent);
      const voiceBlocks = extractVoiceBlocks(voiceContent);
      const strictComparison = runStrictComparison(sourceBlocks, voiceBlocks);
      comparison.strictComparison = strictComparison;
      comparison.sourceBlocks = sourceBlocks;  // For side-by-side report
      comparison.voiceBlocks = voiceBlocks;

      // Add strict comparison issues to main issues list
      for (const result of strictComparison.results) {
        if (result.unmatched && result.unmatched.length > 0) {
          comparison.issues.push({
            type: 'CRITICAL',
            block: `STRICT ${result.type} - Unmatched Sentences`,
            detail: `${result.unmatched.length}/${result.total} sentences not found: "${result.unmatched.slice(0, 2).join('", "')}${result.unmatched.length > 2 ? '...' : ''}"`
          });
        }
      }

      // Run quality checks
      const qualityChecks = runQualityChecks(voiceContent, parseInt(grade), sect);
      comparison.qualityChecks = qualityChecks;

      // Add quality issues to main issues list
      if (!qualityChecks.exerciseTranslations.passed) {
        const issues = qualityChecks.exerciseTranslations.issues;
        const totalMissing = issues.reduce((sum, i) => sum + i.missing, 0);
        const totalQuestions = issues.reduce((sum, i) => sum + i.total, 0);
        comparison.issues.push({
          type: 'LOW',
          block: 'Quality - Exercise Translations',
          detail: `${totalMissing}/${totalQuestions} questions missing Vietnamese translations`
        });
      }

      if (!qualityChecks.listeningRequirements.passed) {
        for (const issue of qualityChecks.listeningRequirements.issues) {
          comparison.issues.push({
            type: issue.type === 'MISSING_AUDIO' ? 'HIGH' : 'MEDIUM',
            block: `Quality - Listening (${issue.type})`,
            detail: issue.detail
          });
        }
      }

      if (!qualityChecks.readingRequirements.passed) {
        for (const issue of qualityChecks.readingRequirements.issues) {
          comparison.issues.push({
            type: issue.type === 'MISSING_READING' ? 'HIGH' : 'MEDIUM',
            block: `Quality - Reading (${issue.type})`,
            detail: issue.detail
          });
        }
      }

      if (!qualityChecks.dialogueFormat.passed) {
        for (const issue of qualityChecks.dialogueFormat.issues) {
          comparison.issues.push({
            type: issue.type === 'TABLE_FORMAT' ? 'MEDIUM' : 'LOW',
            block: `Quality - Dialogue (${issue.type})`,
            detail: issue.detail
          });
        }
      }

      const report = generateReport(grade, unitNum, sect, comparison);

      const reportFile = path.join(reportsDir, `fabrication-g${grade}-unit-${unitNum}-${sect}.md`);
      fs.writeFileSync(reportFile, report);

      const criticalIssues = comparison.issues.filter(i => i.type === 'CRITICAL');
      const highIssues = comparison.issues.filter(i => i.type === 'HIGH');

      if (criticalIssues.length > 0) {
        totalFailed++;
        console.log(`  ❌ CRITICAL (${criticalIssues.length})`);
        for (const issue of criticalIssues.slice(0, 2)) {
          console.log(`     ${issue.block}: ${issue.detail.substring(0, 60)}...`);
        }
      } else if (highIssues.length > 0) {
        totalFailed++;
        console.log(`  🟠 HIGH (${highIssues.length})`);
        for (const issue of highIssues.slice(0, 2)) {
          console.log(`     ${issue.block}: ${issue.detail.substring(0, 60)}...`);
        }
      } else if (comparison.issues.length > 0) {
        totalPassed++;
        console.log(`  ⚠️ REVIEW (${comparison.issues.length} minor)`);
      } else {
        totalPassed++;
        console.log(`  ✅ PASSED`);
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`SUMMARY: ${totalPassed} passed, ${totalFailed} critical failures`);
  console.log(`Reports: ${reportsDir}`);
}

main().catch(console.error);
