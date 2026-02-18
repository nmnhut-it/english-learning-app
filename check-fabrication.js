/**
 * Fabrication Detection Script
 * Compares voice lecture files against source files to detect fabricated content.
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
const SIMILARITY_THRESHOLD = 95;
const SECTIONS = [
  'getting-started',
  'a-closer-look-1',
  'a-closer-look-2',
  'communication',
  'skills-1',
  'skills-2',
  'looking-back'
];

// Text normalization - removes non a-zA-Z, collapses whitespace
function normalize(text) {
  if (!text) return '';
  return text
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Calculate similarity percentage using Levenshtein distance
function similarity(a, b) {
  const normA = normalize(a);
  const normB = normalize(b);
  if (!normA && !normB) return 100;
  if (!normA || !normB) return 0;
  const dist = distance(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  return maxLen === 0 ? 100 : ((maxLen - dist) / maxLen) * 100;
}

// Check if line contains Vietnamese (diacritics or Vietnamese words)
function isVietnamese(text) {
  // Vietnamese diacritics pattern
  const vnPattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  return vnPattern.test(text);
}

// Extract meaningful lines from text (skip empty, short, or metadata lines)
function extractLines(text, skipVietnamese = true) {
  const MIN_LINE_LENGTH = 10;
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (line.length < MIN_LINE_LENGTH) return false;
      // Skip markdown formatting lines
      if (line.startsWith('|---') || line.startsWith('**Đáp án') || line.startsWith('**Dịch')) return false;
      // Skip Vietnamese translation lines (in parentheses/italics)
      if (skipVietnamese && (line.startsWith('*') || line.startsWith('(')) && isVietnamese(line)) return false;
      return true;
    });
}

// Line-by-line comparison: find best match for each voice line in source
function compareLineByLine(sourceText, voiceText) {
  const sourceLines = extractLines(sourceText);
  const voiceLines = extractLines(voiceText);

  if (voiceLines.length === 0) return { matchRate: 100, unmatched: [] };
  if (sourceLines.length === 0) return { matchRate: 0, unmatched: voiceLines };

  let matchedCount = 0;
  const unmatched = [];

  for (const voiceLine of voiceLines) {
    let bestSim = 0;
    for (const sourceLine of sourceLines) {
      const sim = similarity(voiceLine, sourceLine);
      if (sim > bestSim) bestSim = sim;
      if (bestSim >= SIMILARITY_THRESHOLD) break; // Good enough match
    }
    if (bestSim >= SIMILARITY_THRESHOLD) {
      matchedCount++;
    } else {
      unmatched.push({ line: voiceLine.substring(0, 80), bestSim: bestSim.toFixed(1) });
    }
  }

  const matchRate = (matchedCount / voiceLines.length) * 100;
  return { matchRate, unmatched };
}

// Extract answer values from text (e.g., "**a picnic**" -> "a picnic")
function extractAnswerValues(text) {
  const values = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // Pattern 1: Line starts with number, has bold value: "1. ... **value** ..."
    const numberedMatch = line.match(/^(\d+)\./);
    if (numberedMatch) {
      const num = numberedMatch[1];
      // Find bold value in this line
      const boldMatch = line.match(/\*\*([^*]+)\*\*/);
      if (boldMatch) {
        values.push({ num, value: boldMatch[1].trim().toLowerCase() });
        continue;
      }
    }
    // Pattern 2: Letter answers: 1-b, 2-c, 3-a or 1.A, 2.B
    const letterMatches = line.matchAll(/(\d+)[.-]([a-zA-Z])(?:\s|$|,|\|)/g);
    for (const match of letterMatches) {
      values.push({ num: match[1], value: match[2].toLowerCase() });
    }
  }
  return values;
}

// Compare answer values between source and voice
function compareAnswerValues(sourceText, voiceText) {
  const sourceValues = extractAnswerValues(sourceText);
  const voiceValues = extractAnswerValues(voiceText);

  if (voiceValues.length === 0) return { matchRate: 100, unmatched: [], matched: [] };
  if (sourceValues.length === 0) return { matchRate: 0, unmatched: voiceValues.map(v => ({ line: `${v.num}. ${v.value}`, bestSim: '0' })), matched: [] };

  let matchedCount = 0;
  const unmatched = [];
  const matched = [];

  for (const voiceVal of voiceValues) {
    const sourceVal = sourceValues.find(s => s.num === voiceVal.num);
    if (sourceVal) {
      const sim = similarity(voiceVal.value, sourceVal.value);
      if (sim >= SIMILARITY_THRESHOLD) {
        matchedCount++;
        matched.push({ num: voiceVal.num, voice: voiceVal.value, source: sourceVal.value });
      } else {
        unmatched.push({
          line: `${voiceVal.num}. "${voiceVal.value}" vs "${sourceVal.value}"`,
          bestSim: sim.toFixed(1)
        });
      }
    } else {
      unmatched.push({ line: `${voiceVal.num}. ${voiceVal.value} (no source)`, bestSim: '0' });
    }
  }

  const matchRate = voiceValues.length > 0 ? (matchedCount / voiceValues.length) * 100 : 100;
  return { matchRate, unmatched, matched };
}

// Extract key words from text (proper nouns, numbers, important nouns)
function extractKeyWords(text) {
  const words = new Set();
  // Proper nouns (capitalized words not at sentence start)
  const properNouns = text.match(/(?<=[.!?]\s+|\n)[A-Z][a-z]+|(?<=\s)[A-Z][a-z]+/g) || [];
  properNouns.forEach(w => words.add(w.toLowerCase()));
  // Numbers and percentages
  const numbers = text.match(/\d+%?/g) || [];
  numbers.forEach(n => words.add(n));
  // Bold words (important terms)
  const boldWords = text.match(/\*\*([^*]+)\*\*/g) || [];
  boldWords.forEach(w => words.add(w.replace(/\*\*/g, '').toLowerCase().trim()));
  return [...words];
}

// Compare reading content by key words
function compareReadingByKeyWords(sourceText, voiceText) {
  const sourceKeys = extractKeyWords(sourceText);
  const voiceKeys = extractKeyWords(voiceText);

  if (voiceKeys.length === 0) return { matchRate: 100, matched: [], missing: [], extra: [] };
  if (sourceKeys.length === 0) return { matchRate: 0, matched: [], missing: [], extra: voiceKeys };

  const matched = voiceKeys.filter(k => sourceKeys.some(s => similarity(k, s) >= 80));
  const missing = sourceKeys.filter(k => !voiceKeys.some(v => similarity(k, v) >= 80));
  const extra = voiceKeys.filter(k => !sourceKeys.some(s => similarity(k, s) >= 80));

  const matchRate = sourceKeys.length > 0 ? (matched.length / sourceKeys.length) * 100 : 100;
  return { matchRate, matched, missing, extra };
}

// Compare vocabulary word by word
function compareVocabularyWords(sourceVocab, voiceVocab) {
  if (voiceVocab.length === 0 && sourceVocab.length === 0) return { matchRate: 100, matched: [], missing: [], extra: [] };
  if (sourceVocab.length === 0) return { matchRate: 100, matched: [], missing: [], extra: voiceVocab };

  const matched = [];
  const missing = [];
  const extra = [];

  // Check each source word
  for (const srcWord of sourceVocab) {
    const found = voiceVocab.find(v => similarity(srcWord, v) >= 80);
    if (found) {
      matched.push({ source: srcWord, voice: found });
    } else {
      missing.push(srcWord);
    }
  }

  // Find extra words in voice not in source
  for (const voiceWord of voiceVocab) {
    if (!sourceVocab.some(s => similarity(s, voiceWord) >= 80)) {
      extra.push(voiceWord);
    }
  }

  const matchRate = sourceVocab.length > 0 ? (matched.length / sourceVocab.length) * 100 : 100;
  return { matchRate, matched, missing, extra };
}

// Parse questions by exercise number from voice lecture
function parseVoiceQuestionsByExercise(questionsBlocks) {
  const exercises = {};
  let currentBai = 0;

  for (const block of questionsBlocks) {
    // Try to find Bài number in the block or nearby context
    const baiMatch = block.match(/Bài\s*(\d+)/i);
    if (baiMatch) {
      currentBai = parseInt(baiMatch[1]);
    } else {
      currentBai++;
    }

    // Extract question items
    const questions = [];
    const lines = block.split('\n');
    for (const line of lines) {
      const qMatch = line.match(/^\*?\*?(\d+)\.\*?\*?\s*(.+)/);
      if (qMatch) {
        questions.push({ num: qMatch[1], text: qMatch[2].trim() });
      }
    }

    if (questions.length > 0) {
      exercises[currentBai] = exercises[currentBai] || [];
      exercises[currentBai].push(...questions);
    }
  }
  return exercises;
}

// Compare questions by exercise
function compareQuestionsByExercise(sourceExercises, voiceQuestions) {
  const voiceByExercise = parseVoiceQuestionsByExercise(voiceQuestions);
  const results = [];
  let totalMatched = 0;
  let totalQuestions = 0;

  // Compare each source exercise
  for (const exercise of sourceExercises) {
    const baiNum = parseInt(exercise.bai);
    const sourceQs = exercise.questions;
    const voiceQs = voiceByExercise[baiNum] || [];

    totalQuestions += sourceQs.length;

    for (const srcQ of sourceQs) {
      let bestMatch = null;
      let bestSim = 0;

      for (const voiceQ of voiceQs) {
        const sim = similarity(srcQ.text, voiceQ.text);
        if (sim > bestSim) {
          bestSim = sim;
          bestMatch = voiceQ;
        }
      }

      if (bestSim >= SIMILARITY_THRESHOLD) {
        totalMatched++;
        results.push({ bai: baiNum, num: srcQ.num, status: '✓', sim: bestSim.toFixed(0) });
      } else {
        results.push({
          bai: baiNum,
          num: srcQ.num,
          status: '✗',
          sim: bestSim.toFixed(0),
          source: srcQ.text.substring(0, 50),
          voice: bestMatch ? bestMatch.text.substring(0, 50) : '(none)'
        });
      }
    }
  }

  const matchRate = totalQuestions > 0 ? (totalMatched / totalQuestions) * 100 : 100;
  return { matchRate, results: results.filter(r => r.status === '✗') };
}

// Parse voice answers by exercise number
function parseVoiceAnswersByExercise(answerBlocks) {
  const exercises = {};
  let currentBai = 0;

  for (const block of answerBlocks) {
    // Try to find Bài number in block header or previous context
    const baiMatch = block.match(/Bài\s*(\d+)/i);
    if (baiMatch) {
      currentBai = parseInt(baiMatch[1]);
    } else {
      currentBai++;
    }

    // Extract answers from block
    const answers = extractAnswerValues(block);
    if (answers.length > 0) {
      exercises[currentBai] = exercises[currentBai] || [];
      exercises[currentBai].push(...answers);
    }
  }
  return exercises;
}

// Compare answers by exercise
function compareAnswersByExercise(sourceAnswers, voiceAnswers) {
  const voiceByExercise = parseVoiceAnswersByExercise(voiceAnswers);
  const results = [];
  let totalMatched = 0;
  let totalAnswers = 0;

  // Compare each source exercise's answers
  for (const [baiKey, srcAnswerText] of Object.entries(sourceAnswers)) {
    const baiNum = parseInt(baiKey.replace('bai', ''));
    const srcAnswers = extractAnswerValues(srcAnswerText);
    const voiceAns = voiceByExercise[baiNum] || [];

    totalAnswers += srcAnswers.length;

    for (const srcA of srcAnswers) {
      const voiceA = voiceAns.find(v => v.num === srcA.num);
      if (voiceA) {
        const sim = similarity(srcA.value, voiceA.value);
        if (sim >= SIMILARITY_THRESHOLD) {
          totalMatched++;
          results.push({ bai: baiNum, num: srcA.num, status: '✓' });
        } else {
          results.push({
            bai: baiNum,
            num: srcA.num,
            status: '✗',
            source: srcA.value,
            voice: voiceA.value
          });
        }
      } else {
        results.push({
          bai: baiNum,
          num: srcA.num,
          status: '✗',
          source: srcA.value,
          voice: '(missing)'
        });
      }
    }
  }

  const matchRate = totalAnswers > 0 ? (totalMatched / totalAnswers) * 100 : 100;
  return { matchRate, results: results.filter(r => r.status === '✗') };
}

// Parse source file (loigiaihay.com format)
function parseSourceFile(content) {
  // Normalize line endings to Unix style
  content = content.replace(/\r\n/g, '\n');

  const result = {
    dialogues: [],
    exercises: [],
    vocabulary: [],
    answers: {}
  };

  // Extract dialogues from Bài 1 section only (main dialogue, not sample answers)
  // Split at "Bài 2" to get only the first exercise section
  const bai1Section = content.split(/\*\*Bài\s+2\*\*/)[0] || content;

  // Extract dialogues: **Speaker:** or **Speaker**: text (English names only, 2-15 chars)
  // Handle both **Name:** and **Name**: formats
  // Skip Vietnamese translations which use **_Speaker:_** or italic text
  const dialogueRegex = /\*\*([A-Z][a-z]{1,14})(?::\*\*|\*\*:)\s*(.+?)(?=\n|$)/g;
  let match;
  while ((match = dialogueRegex.exec(bai1Section)) !== null) {
    const text = match[2].trim();
    // Skip Vietnamese translations (italic text starting with _ or *)
    // Skip lines with Vietnamese diacritics
    if (!text.startsWith('_') && !text.startsWith('*') && !isVietnamese(text)) {
      result.dialogues.push({
        speaker: match[1],
        text: text
      });
    }
  }

  // Extract exercises by Bài number
  const exerciseBlocks = content.split(/\*\*Bài\s+(\d+)\*\*/);
  for (let i = 1; i < exerciseBlocks.length; i += 2) {
    const baiNum = exerciseBlocks[i];
    const baiContent = exerciseBlocks[i + 1] || '';

    // Extract questions (numbered items)
    const questions = [];
    const questionRegex = /(\d+)\.\s+(.+?)(?=\n\d+\.|$|\*\*Lời giải)/gs;
    let qMatch;
    while ((qMatch = questionRegex.exec(baiContent)) !== null) {
      questions.push({
        num: qMatch[1],
        text: qMatch[2].trim()
      });
    }

    // Extract answers from "Lời giải chi tiết"
    const answerMatch = baiContent.match(/\*\*Lời giải chi tiết:\*\*\s*([\s\S]*?)(?=\*\*Bài|\*\*Từ vựng|$)/);
    if (answerMatch) {
      result.answers[`bai${baiNum}`] = answerMatch[1].trim();
    }

    if (questions.length > 0) {
      result.exercises.push({
        bai: baiNum,
        questions,
        rawContent: baiContent.substring(0, 500)
      });
    }
  }

  // Extract reading content (dialogues already captured serve as reading content)
  result.readings = [];
  if (result.dialogues.length > 0) {
    result.readings.push(result.dialogues.map(d => `${d.speaker}: ${d.text}`).join('\n'));
  }

  // Extract vocabulary from "Từ vựng" section
  const vocabMatch = content.match(/\*\*Từ vựng\*\*([\s\S]*?)$/);
  if (vocabMatch) {
    const vocabRegex = /\*\*([a-zA-Z\s-]+)\*\*/g;
    let vMatch;
    while ((vMatch = vocabRegex.exec(vocabMatch[1])) !== null) {
      result.vocabulary.push(vMatch[1].trim().toLowerCase());
    }
  }

  return result;
}

// Parse voice lecture file (custom tags format)
function parseVoiceLecture(content) {
  // Normalize line endings to Unix style
  content = content.replace(/\r\n/g, '\n');

  const result = {
    dialogues: [],
    questions: [],
    answers: [],
    vocabulary: []
  };

  // Extract dialogues from <dialogue> tables (exclude sample answers)
  const SAMPLE_SPEAKERS = ['Example', 'A', 'B', 'C', 'D', 'Sample'];
  const dialogueRegex = /<dialogue>([\s\S]*?)<\/dialogue>/g;
  let match;
  while ((match = dialogueRegex.exec(content)) !== null) {
    const tableContent = match[1];
    // Parse table rows: | **Speaker:** text | Vietnamese |
    const rowRegex = /\|\s*\*\*([A-Za-z]+):\*\*\s*(.+?)\s*\|/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const speaker = rowMatch[1];
      // Skip sample answer speakers
      if (!SAMPLE_SPEAKERS.includes(speaker)) {
        result.dialogues.push({
          speaker: speaker,
          text: rowMatch[2].trim()
        });
      }
    }
  }

  // Extract reading/tapescript content from <reading> tags
  const readingRegex = /<reading>([\s\S]*?)<\/reading>/g;
  while ((match = readingRegex.exec(content)) !== null) {
    result.readings = result.readings || [];
    result.readings.push(match[1].trim());
  }

  // Extract questions from <questions> blocks
  const questionsRegex = /<questions[^>]*>([\s\S]*?)<\/questions>/g;
  while ((match = questionsRegex.exec(content)) !== null) {
    result.questions.push(match[1].trim());
  }

  // Extract answers from <answer> blocks
  const answerRegex = /<answer>([\s\S]*?)<\/answer>/g;
  while ((match = answerRegex.exec(content)) !== null) {
    result.answers.push(match[1].trim());
  }

  // Extract vocabulary from <vocabulary> block
  const vocabMatch = content.match(/<vocabulary>([\s\S]*?)<\/vocabulary>/);
  if (vocabMatch) {
    const vocabRegex = /\*\*([a-zA-Z\s-]+)\*\*/g;
    let vMatch;
    while ((vMatch = vocabRegex.exec(vocabMatch[1])) !== null) {
      result.vocabulary.push(vMatch[1].trim().toLowerCase());
    }
  }

  return result;
}

// Compare two parsed results and generate report
function compareContent(source, voice) {
  const issues = [];
  const summary = [];

  // Compare dialogue speakers (only if BOTH source and voice have dialogues)
  const sourceSpeakers = [...new Set(source.dialogues.map(d => d.speaker))];
  const voiceSpeakers = [...new Set(voice.dialogues.map(d => d.speaker))];
  const hasSourceDialogue = source.dialogues.length >= 3; // At least 3 lines = real dialogue
  const hasVoiceDialogue = voice.dialogues.length >= 3;

  // Only compare if both have dialogues (voice might use <reading> tags instead)
  if (hasSourceDialogue && hasVoiceDialogue) {
    const speakerSim = similarity(sourceSpeakers.join(' '), voiceSpeakers.join(' '));
    if (speakerSim < SIMILARITY_THRESHOLD) {
      issues.push({
        type: 'CRITICAL',
        block: 'Dialogue Speakers',
        source: sourceSpeakers.join(', ') || '(none)',
        voice: voiceSpeakers.join(', ') || '(none)',
        similarity: speakerSim.toFixed(1)
      });
    }
    summary.push({
      block: 'Dialogue Speakers',
      source: sourceSpeakers.join(', ') || '(none)',
      voice: voiceSpeakers.join(', ') || '(none)',
      similarity: speakerSim.toFixed(1),
      status: speakerSim >= SIMILARITY_THRESHOLD ? '✅ PASS' : '❌ FAIL'
    });

    // Compare dialogue text
    const sourceDialogueText = source.dialogues.map(d => d.text).join(' ');
    const voiceDialogueText = voice.dialogues.map(d => d.text).join(' ');
    const dialogueSim = similarity(sourceDialogueText, voiceDialogueText);

    if (dialogueSim < SIMILARITY_THRESHOLD) {
      issues.push({
        type: 'CRITICAL',
        block: 'Dialogue Content',
        source: sourceDialogueText.substring(0, 200) + '...',
        voice: voiceDialogueText.substring(0, 200) + '...',
        similarity: dialogueSim.toFixed(1)
      });
    }
    summary.push({
      block: 'Dialogue Content',
      source: `${source.dialogues.length} lines`,
      voice: `${voice.dialogues.length} lines`,
      similarity: dialogueSim.toFixed(1),
      status: dialogueSim >= SIMILARITY_THRESHOLD ? '✅ PASS' : '❌ FAIL'
    });
  }

  // Compare reading/tapescript content using key words
  const sourceReadings = source.readings || [];
  const voiceReadings = voice.readings || [];
  const hasSourceReadings = sourceReadings.length > 0;
  const hasVoiceReadings = voiceReadings.length > 0;

  if (hasSourceReadings && hasVoiceReadings && !hasVoiceDialogue) {
    const sourceReadingText = sourceReadings.join('\n');
    const voiceReadingText = voiceReadings.join('\n');

    // Use both line-by-line and key words comparison
    const lineComparison = compareLineByLine(sourceReadingText, voiceReadingText);
    const keyWordComparison = compareReadingByKeyWords(sourceReadingText, voiceReadingText);

    // Use higher of the two match rates (more lenient)
    const matchRate = Math.max(lineComparison.matchRate, keyWordComparison.matchRate);

    if (matchRate < SIMILARITY_THRESHOLD) {
      issues.push({
        type: 'HIGH',
        block: 'Reading/Tapescript',
        source: `${sourceReadings.length} blocks`,
        voice: `${voiceReadings.length} blocks`,
        similarity: matchRate.toFixed(1),
        unmatched: lineComparison.unmatched.slice(0, 5),
        missing: keyWordComparison.missing.slice(0, 5).join(', '),
        extra: keyWordComparison.extra.slice(0, 5).join(', ')
      });
    }
    summary.push({
      block: 'Reading/Tapescript',
      source: `${sourceReadings.length} blocks`,
      voice: `${voiceReadings.length} blocks`,
      similarity: matchRate.toFixed(1),
      status: matchRate >= SIMILARITY_THRESHOLD ? '✅ PASS' : '❌ FAIL'
    });
  }

  // Compare vocabulary word-by-word (MEDIUM priority - not critical)
  if (source.vocabulary.length > 0) {
    const vocabResult = compareVocabularyWords(source.vocabulary, voice.vocabulary);

    if (vocabResult.matchRate < SIMILARITY_THRESHOLD) {
      issues.push({
        type: 'MEDIUM',
        block: 'Vocabulary',
        source: `${source.vocabulary.length} words`,
        voice: `${voice.vocabulary.length} words`,
        similarity: vocabResult.matchRate.toFixed(1),
        missing: vocabResult.missing.slice(0, 5).join(', '),
        extra: vocabResult.extra.slice(0, 5).join(', ')
      });
    }
    summary.push({
      block: 'Vocabulary',
      source: `${source.vocabulary.length} words`,
      voice: `${voice.vocabulary.length} words`,
      similarity: vocabResult.matchRate.toFixed(1),
      status: vocabResult.matchRate >= SIMILARITY_THRESHOLD ? '✅ PASS' : '❌ FAIL'
    });
  }

  // Compare questions by exercise number
  if (source.exercises.length > 0 && voice.questions.length > 0) {
    const questionResult = compareQuestionsByExercise(source.exercises, voice.questions);

    if (questionResult.matchRate < SIMILARITY_THRESHOLD) {
      // Convert detailed results to unmatched format for report
      const unmatched = questionResult.results.map(r => ({
        line: `Bài ${r.bai} Q${r.num}: ${r.source || ''}`,
        bestSim: r.sim
      }));
      issues.push({
        type: 'HIGH',
        block: 'Exercise Questions',
        source: `${source.exercises.length} exercises`,
        voice: `${voice.questions.length} blocks`,
        similarity: questionResult.matchRate.toFixed(1),
        unmatched: unmatched.slice(0, 5)
      });
    }
    summary.push({
      block: 'Exercise Questions',
      source: `${source.exercises.length} exercises`,
      voice: `${voice.questions.length} blocks`,
      similarity: questionResult.matchRate.toFixed(1),
      status: questionResult.matchRate >= SIMILARITY_THRESHOLD ? '✅ PASS' : '❌ FAIL'
    });
  }

  // Compare answers by exercise
  if (Object.keys(source.answers).length > 0 && voice.answers.length > 0) {
    const answerResult = compareAnswersByExercise(source.answers, voice.answers);

    if (answerResult.matchRate < SIMILARITY_THRESHOLD) {
      // Convert detailed results to unmatched format for report
      const unmatched = answerResult.results.map(r => ({
        line: `Bài ${r.bai} #${r.num}: "${r.voice}" vs "${r.source}"`,
        bestSim: '0'
      }));
      issues.push({
        type: 'MEDIUM',
        block: 'Answer Keys',
        source: `${Object.keys(source.answers).length} sets`,
        voice: `${voice.answers.length} blocks`,
        similarity: answerResult.matchRate.toFixed(1),
        unmatched: unmatched.slice(0, 5)
      });
    }
    summary.push({
      block: 'Answer Keys',
      source: `${Object.keys(source.answers).length} sets`,
      voice: `${voice.answers.length} blocks`,
      similarity: answerResult.matchRate.toFixed(1),
      status: answerResult.matchRate >= SIMILARITY_THRESHOLD ? '✅ PASS' : '❌ FAIL'
    });
  }

  return { issues, summary };
}

// Generate markdown report
function generateReport(grade, unit, section, comparison) {
  const { issues, summary } = comparison;

  // Critical issues = dialogue mismatches only (wrong names/content)
  const criticalIssues = issues.filter(i => i.type === 'CRITICAL');
  const hasIssues = issues.length > 0;
  const hasCriticalIssues = criticalIssues.length > 0;

  let report = `# Fabrication Check Report\n\n`;
  report += `**Grade:** ${grade} | **Unit:** ${unit} | **Section:** ${section}\n`;
  if (hasCriticalIssues) {
    report += `**Status:** ❌ CRITICAL ISSUES (likely fabrication)\n`;
  } else if (hasIssues) {
    report += `**Status:** ⚠️ FORMAT DIFFERENCES (review recommended)\n`;
  } else {
    report += `**Status:** ✅ ALL PASSED\n`;
  }
  report += `**Threshold:** ${SIMILARITY_THRESHOLD}%\n\n`;

  // Summary table
  report += `## Summary\n\n`;
  report += `| Block | Source | Voice | Similarity | Status |\n`;
  report += `|-------|--------|-------|------------|--------|\n`;
  for (const row of summary) {
    report += `| ${row.block} | ${row.source} | ${row.voice} | ${row.similarity}% | ${row.status} |\n`;
  }
  report += `\n`;

  // Detailed issues
  if (issues.length > 0) {
    report += `## Issues Found\n\n`;
    for (const issue of issues) {
      report += `### ${issue.type}: ${issue.block}\n\n`;
      report += `**Match Rate:** ${issue.similarity}%\n\n`;
      report += `**Source:** ${issue.source}\n\n`;
      report += `**Voice Lecture:** ${issue.voice}\n\n`;
      if (issue.missing) {
        report += `**Missing words:** ${issue.missing}\n\n`;
      }
      if (issue.extra) {
        report += `**Extra words:** ${issue.extra}\n\n`;
      }
      if (issue.unmatched && issue.unmatched.length > 0) {
        report += `**Unmatched lines (no source match found):**\n`;
        for (const item of issue.unmatched) {
          report += `- \`${item.line}...\` (best: ${item.bestSim}%)\n`;
        }
        report += `\n`;
      }
      report += `---\n\n`;
    }
  }

  return report;
}

// Main function
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
    console.log('Usage: node check-fabrication.js --grade <N> [--unit <NN>] [--section <name>]');
    console.log('Example: node check-fabrication.js --grade 6 --unit 11 --section getting-started');
    process.exit(1);
  }

  // Determine which sections to check
  const unitsToCheck = unit ? [unit.padStart(2, '0')] :
    Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'));
  const sectionsToCheck = section ? [section] : SECTIONS;

  // Create reports directory
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }

  let totalPassed = 0;
  let totalFailed = 0;
  const allResults = [];

  for (const unitNum of unitsToCheck) {
    for (const sect of sectionsToCheck) {
      const sourceFile = path.join(__dirname, 'loigiaihay.com', `grade${grade}`, `unit-${unitNum}`, `${sect}.md`);
      const voiceFile = path.join(__dirname, 'v2', 'data', 'voice-lectures', `g${grade}`, `unit-${unitNum}`, `${sect}.md`);

      if (!fs.existsSync(sourceFile) || !fs.existsSync(voiceFile)) {
        continue;
      }

      console.log(`Checking: Grade ${grade}, Unit ${unitNum}, ${sect}`);

      const sourceContent = fs.readFileSync(sourceFile, 'utf-8');
      const voiceContent = fs.readFileSync(voiceFile, 'utf-8');

      const sourceParsed = parseSourceFile(sourceContent);
      const voiceParsed = parseVoiceLecture(voiceContent);

      const comparison = compareContent(sourceParsed, voiceParsed);
      const report = generateReport(grade, unitNum, sect, comparison);

      // Save report
      const reportFile = path.join(reportsDir, `fabrication-g${grade}-unit-${unitNum}-${sect}.md`);
      fs.writeFileSync(reportFile, report);

      // Critical issues = dialogue mismatches only
      const criticalIssues = comparison.issues.filter(i => i.type === 'CRITICAL');
      const hasCriticalIssues = criticalIssues.length > 0;
      const passed = comparison.issues.length === 0;

      if (passed) {
        totalPassed++;
        console.log(`  ✅ PASSED`);
      } else if (!hasCriticalIssues) {
        totalPassed++; // Format differences don't count as failures
        console.log(`  ⚠️ FORMAT DIFF (${comparison.issues.length} minor)`);
      } else {
        totalFailed++;
        console.log(`  ❌ CRITICAL (${criticalIssues.length} issues - likely fabrication)`);
        for (const issue of criticalIssues) {
          console.log(`     - ${issue.type}: ${issue.block} (${issue.similarity}%)`);
        }
      }

      allResults.push({
        grade,
        unit: unitNum,
        section: sect,
        passed,
        issues: comparison.issues.length
      });
    }
  }

  // Print summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`SUMMARY: ${totalPassed} passed, ${totalFailed} failed`);
  console.log(`Reports saved to: ${reportsDir}`);
}

main().catch(console.error);
