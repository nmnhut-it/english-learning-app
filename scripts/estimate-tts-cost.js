#!/usr/bin/env node
/**
 * Parses all teacher_script tags from voice lectures and estimates ElevenLabs TTS cost.
 * Usage: node scripts/estimate-tts-cost.js
 */

const fs = require('fs');
const path = require('path');

const VOICE_LECTURES_DIR = path.join(__dirname, '../v2/data/voice-lectures');

// ElevenLabs pricing (as of 2024)
const ELEVENLABS_PRICING = {
  starter: { pricePerChar: 0.30 / 1000, name: 'Starter ($5/mo, 30k chars)' },
  creator: { pricePerChar: 0.22 / 1000, name: 'Creator ($22/mo, 100k chars)' },
  pro: { pricePerChar: 0.18 / 1000, name: 'Pro ($99/mo, 500k chars + $0.18/1k extra)' },
  scale: { pricePerChar: 0.10 / 1000, name: 'Scale ($330/mo, 2M chars + $0.10/1k extra)' },
};

function getAllMdFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMdFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractTeacherScripts(content) {
  const scripts = [];
  const regex = /<teacher_script[^>]*>([\s\S]*?)<\/teacher_script>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    let text = match[1].trim();
    // Remove <eng> tags but keep content
    text = text.replace(/<eng>(.*?)<\/eng>/g, '$1');
    // Remove any other HTML tags
    text = text.replace(/<[^>]+>/g, '');
    scripts.push(text);
  }
  return scripts;
}

function formatNumber(num) {
  return num.toLocaleString('en-US');
}

function formatCurrency(amount) {
  return '$' + amount.toFixed(2);
}

function main() {
  console.log('='.repeat(60));
  console.log('ElevenLabs TTS Cost Estimator for Voice Lectures');
  console.log('='.repeat(60));
  console.log();

  const files = getAllMdFiles(VOICE_LECTURES_DIR);
  console.log(`Found ${files.length} voice lecture files\n`);

  const stats = {
    byGrade: {},
    totalScripts: 0,
    totalChars: 0,
    totalWords: 0,
  };

  const allScripts = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const scripts = extractTeacherScripts(content);

    // Extract grade from path (g6, g7, etc.)
    const gradeMatch = file.match(/[\/\\](g\d+)[\/\\]/);
    const grade = gradeMatch ? gradeMatch[1] : 'unknown';

    if (!stats.byGrade[grade]) {
      stats.byGrade[grade] = { scripts: 0, chars: 0, words: 0 };
    }

    for (const script of scripts) {
      const charCount = script.length;
      const wordCount = script.split(/\s+/).filter(w => w.length > 0).length;

      stats.totalScripts++;
      stats.totalChars += charCount;
      stats.totalWords += wordCount;

      stats.byGrade[grade].scripts++;
      stats.byGrade[grade].chars += charCount;
      stats.byGrade[grade].words += wordCount;

      allScripts.push({
        file: path.relative(VOICE_LECTURES_DIR, file),
        text: script,
        chars: charCount,
      });
    }
  }

  // Print breakdown by grade
  console.log('Breakdown by Grade:');
  console.log('-'.repeat(60));
  console.log('Grade    | Scripts | Characters | Words      | Avg Chars');
  console.log('-'.repeat(60));

  const grades = Object.keys(stats.byGrade).sort();
  for (const grade of grades) {
    const g = stats.byGrade[grade];
    const avgChars = Math.round(g.chars / g.scripts);
    console.log(
      `${grade.padEnd(8)} | ${String(g.scripts).padStart(7)} | ${formatNumber(g.chars).padStart(10)} | ${formatNumber(g.words).padStart(10)} | ${avgChars}`
    );
  }

  console.log('-'.repeat(60));
  console.log(
    `TOTAL    | ${String(stats.totalScripts).padStart(7)} | ${formatNumber(stats.totalChars).padStart(10)} | ${formatNumber(stats.totalWords).padStart(10)} | ${Math.round(stats.totalChars / stats.totalScripts)}`
  );
  console.log();

  // Print cost estimates
  console.log('ElevenLabs Cost Estimates:');
  console.log('-'.repeat(60));

  for (const [key, plan] of Object.entries(ELEVENLABS_PRICING)) {
    const cost = stats.totalChars * plan.pricePerChar;
    console.log(`${plan.name.padEnd(45)} ${formatCurrency(cost).padStart(10)}`);
  }
  console.log();

  // Summary
  console.log('Summary:');
  console.log('-'.repeat(60));
  console.log(`Total teacher scripts: ${formatNumber(stats.totalScripts)}`);
  console.log(`Total characters: ${formatNumber(stats.totalChars)}`);
  console.log(`Total words: ${formatNumber(stats.totalWords)}`);
  console.log(`Average script length: ${Math.round(stats.totalChars / stats.totalScripts)} chars`);
  console.log();

  // Estimated audio duration (rough estimate: 150 words per minute for Vietnamese)
  const estimatedMinutes = stats.totalWords / 150;
  const hours = Math.floor(estimatedMinutes / 60);
  const minutes = Math.round(estimatedMinutes % 60);
  console.log(`Estimated audio duration: ~${hours}h ${minutes}m (at 150 words/min)`);
  console.log();

  // Write detailed report
  const reportPath = path.join(__dirname, '../output/tts-cost-report.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: files.length,
      totalScripts: stats.totalScripts,
      totalCharacters: stats.totalChars,
      totalWords: stats.totalWords,
      avgScriptLength: Math.round(stats.totalChars / stats.totalScripts),
      estimatedAudioMinutes: Math.round(estimatedMinutes),
    },
    byGrade: stats.byGrade,
    costEstimates: Object.fromEntries(
      Object.entries(ELEVENLABS_PRICING).map(([key, plan]) => [
        key,
        { plan: plan.name, cost: stats.totalChars * plan.pricePerChar }
      ])
    ),
  }, null, 2));

  console.log(`Detailed report saved to: ${reportPath}`);
}

main();
