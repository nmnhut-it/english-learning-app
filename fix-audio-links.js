/**
 * Fix missing audio links in voice lectures.
 * Extracts audio URLs from source files and inserts them into voice lectures.
 */
const fs = require('fs');
const path = require('path');

const GRADES = [6, 7, 8, 9];
const SECTIONS = [
  'getting-started', 'a-closer-look-1', 'a-closer-look-2',
  'communication', 'skills-1', 'skills-2', 'looking-back'
];

const SOURCE_DIRS = [
  'loigiaihay.com',
  'markdown-files'
];

const VOICE_DIR = 'v2/data/voice-lectures';

// Extract audio URLs from source file
function extractAudioUrls(content) {
  const urls = new Set();

  // Pattern 1: <audio src="...mp3">
  const audioSrcPattern = /src=["']([^"']*\.mp3)["']/gi;
  let match;
  while ((match = audioSrcPattern.exec(content)) !== null) {
    urls.add(match[1]);
  }

  // Pattern 2: [Audio](url.mp3)
  const markdownPattern = /\[.*?\]\((https?:\/\/[^\)]*\.mp3)\)/gi;
  while ((match = markdownPattern.exec(content)) !== null) {
    urls.add(match[1]);
  }

  return Array.from(urls);
}

// Check if voice lecture contains audio URL
function voiceHasAudio(voiceContent, audioUrl) {
  const filename = path.basename(audioUrl);
  return voiceContent.includes(filename) || voiceContent.includes(audioUrl);
}

// Find source file for a section
function findSourceFile(grade, unit, section) {
  const patterns = [
    `loigiaihay.com/grade${grade}/unit-${unit.toString().padStart(2, '0')}/${section}.md`,
    `loigiaihay.com/grade${grade}/unit-${unit.toString().padStart(2, '0')}/${section}.html`,
    `markdown-files/g${grade}/unit-${unit.toString().padStart(2, '0')}/g${grade}_u${unit.toString().padStart(2, '0')}_${section}.md`,
  ];

  for (const p of patterns) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

// Get voice lecture path
function getVoicePath(grade, unit, section) {
  return `${VOICE_DIR}/g${grade}/unit-${unit.toString().padStart(2, '0')}/${section}.md`;
}

// Insert audio tag before a listening exercise
function insertAudioTag(voiceContent, audioUrl, exerciseNum = null) {
  // Find a good insertion point - before skills-2 reading/listening section
  const insertPatterns = [
    /<!-- chunk: (listening|tapescript) -->/i,
    /<reading>/i,
    /### Bài \d+ trang.*Listen/i,
  ];

  const audioTag = `<audio src="${audioUrl}"></audio>\n`;

  for (const pattern of insertPatterns) {
    const match = voiceContent.match(pattern);
    if (match) {
      const idx = match.index;
      return voiceContent.slice(0, idx) + audioTag + '\n' + voiceContent.slice(idx);
    }
  }

  // If no good spot found, don't insert
  return null;
}

// Insert audio after vocabulary section or before listening exercises
function insertAudioIntoVoice(voiceContent, audioUrls) {
  let modified = voiceContent;
  let insertCount = 0;

  for (const url of audioUrls) {
    if (voiceHasAudio(modified, url)) continue;

    const audioTag = `<audio src="${url}"></audio>`;

    // Try to find insertion points in order of preference
    const insertionPoints = [
      // After vocabulary section
      { pattern: /<\/vocabulary>\s*\n/, suffix: '\n' + audioTag + '\n' },
      // Before reading section
      { pattern: /(<reading>)/, prefix: audioTag + '\n\n' },
      // Before tapescript
      { pattern: /(<!-- chunk: tapescript -->)/, prefix: audioTag + '\n\n' },
      // Before listening exercises
      { pattern: /(### Bài \d+.*[Ll]isten)/, prefix: audioTag + '\n\n' },
      // After dialogue section
      { pattern: /<\/dialogue>\s*\n/, suffix: '\n' + audioTag + '\n' },
    ];

    let inserted = false;
    for (const point of insertionPoints) {
      const match = modified.match(point.pattern);
      if (match) {
        if (point.prefix) {
          modified = modified.replace(point.pattern, point.prefix + '$1');
        } else if (point.suffix) {
          modified = modified.replace(point.pattern, match[0] + point.suffix);
        }
        inserted = true;
        insertCount++;
        break;
      }
    }

    if (!inserted) {
      // Insert after first teacher_script if no better spot
      const firstScript = modified.match(/<\/teacher_script>\s*\n/);
      if (firstScript) {
        modified = modified.replace(
          /<\/teacher_script>\s*\n/,
          '</teacher_script>\n\n' + audioTag + '\n'
        );
        insertCount++;
      }
    }
  }

  return { content: modified, count: insertCount };
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--fix');
  const verbose = args.includes('--verbose');

  console.log(`Audio Link Fixer ${dryRun ? '(DRY RUN - use --fix to apply)' : '(APPLYING FIXES)'}`);
  console.log('='.repeat(50));

  const report = {
    checked: 0,
    missingAudio: [],
    fixed: 0,
    filesModified: []
  };

  for (const grade of GRADES) {
    for (let unit = 1; unit <= 12; unit++) {
      for (const section of SECTIONS) {
        const sourceFile = findSourceFile(grade, unit, section);
        const voicePath = getVoicePath(grade, unit, section);

        if (!sourceFile || !fs.existsSync(voicePath)) {
          continue;
        }

        report.checked++;

        const sourceContent = fs.readFileSync(sourceFile, 'utf8');
        let voiceContent = fs.readFileSync(voicePath, 'utf8');

        const audioUrls = extractAudioUrls(sourceContent);

        // Filter to track-*.mp3 files (listening exercises)
        const trackUrls = audioUrls.filter(url =>
          url.includes('track-') ||
          url.includes('Track-') ||
          /\/\d+\.mp3$/.test(url)
        );

        const missingUrls = trackUrls.filter(url => !voiceHasAudio(voiceContent, url));

        if (missingUrls.length > 0) {
          const key = `G${grade} U${unit.toString().padStart(2, '0')} ${section}`;

          for (const url of missingUrls) {
            report.missingAudio.push({ file: key, audio: url, voicePath });
            if (verbose) {
              console.log(`Missing: ${key} - ${path.basename(url)}`);
            }
          }

          if (!dryRun) {
            const result = insertAudioIntoVoice(voiceContent, missingUrls);
            if (result.count > 0) {
              fs.writeFileSync(voicePath, result.content);
              report.fixed += result.count;
              report.filesModified.push(voicePath);
              console.log(`Fixed: ${key} - added ${result.count} audio tag(s)`);
            }
          }
        }
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Checked: ${report.checked} files`);
  console.log(`Missing audio references: ${report.missingAudio.length}`);

  if (!dryRun) {
    console.log(`Fixed: ${report.fixed} audio tags in ${report.filesModified.length} files`);
  }

  if (dryRun && report.missingAudio.length > 0) {
    console.log('\n--- Missing Audio Summary ---');

    // Group by file
    const byFile = {};
    for (const item of report.missingAudio) {
      if (!byFile[item.file]) {
        byFile[item.file] = [];
      }
      byFile[item.file].push(path.basename(item.audio));
    }

    for (const [file, audios] of Object.entries(byFile)) {
      console.log(`${file}: ${audios.join(', ')}`);
    }

    console.log('\nRun with --fix to apply changes.');
  }
}

main();
