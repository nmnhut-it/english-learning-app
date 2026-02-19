/**
 * Generate markdown list of missing audio links for voice lectures.
 * Outputs MISSING-AUDIO-LINKS.md with full URLs and target files.
 */
const fs = require('fs');
const path = require('path');

const GRADES = [6, 7, 8, 9];
const SECTIONS = [
  'getting-started', 'a-closer-look-1', 'a-closer-look-2',
  'communication', 'skills-1', 'skills-2', 'looking-back'
];

const VOICE_DIR = 'v2/data/voice-lectures';

// Extract audio URLs with full paths from source file
function extractAudioUrls(content) {
  const urls = [];

  // Pattern 1: <audio src="...mp3">
  const audioSrcPattern = /src=["']([^"']*\.mp3)["']/gi;
  let match;
  while ((match = audioSrcPattern.exec(content)) !== null) {
    urls.push(match[1]);
  }

  // Pattern 2: [Audio](url.mp3)
  const markdownPattern = /\[.*?\]\((https?:\/\/[^\)]*\.mp3)\)/gi;
  while ((match = markdownPattern.exec(content)) !== null) {
    urls.push(match[1]);
  }

  return [...new Set(urls)]; // Remove duplicates
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

// Main function
function main() {
  const missingAudio = [];

  for (const grade of GRADES) {
    for (let unit = 1; unit <= 12; unit++) {
      for (const section of SECTIONS) {
        const sourceFile = findSourceFile(grade, unit, section);
        const voicePath = getVoicePath(grade, unit, section);

        if (!sourceFile || !fs.existsSync(voicePath)) {
          continue;
        }

        const sourceContent = fs.readFileSync(sourceFile, 'utf8');
        const voiceContent = fs.readFileSync(voicePath, 'utf8');

        const audioUrls = extractAudioUrls(sourceContent);

        // Filter to track-*.mp3 files (listening exercises)
        const trackUrls = audioUrls.filter(url =>
          url.includes('track-') ||
          url.includes('Track-') ||
          /\/\d+\.mp3$/.test(url)
        );

        const missingUrls = trackUrls.filter(url => !voiceHasAudio(voiceContent, url));

        if (missingUrls.length > 0) {
          missingAudio.push({
            grade,
            unit,
            section,
            voicePath,
            sourceFile,
            audioUrls: missingUrls
          });
        }
      }
    }
  }

  // Generate markdown
  let md = `# Missing Audio Links

Generated: ${new Date().toISOString().split('T')[0]}
Total: ${missingAudio.reduce((sum, item) => sum + item.audioUrls.length, 0)} audio files across ${missingAudio.length} voice lectures

## Instructions

For each entry below:
1. Read the voice lecture file
2. Find the appropriate listening exercise section
3. Insert \`<audio src="URL"></audio>\` before the exercise

### Insertion Priority
1. After \`</vocabulary>\` tag
2. Before \`<reading>\` tag
3. Before \`<!-- chunk: tapescript -->\`
4. Before listening exercise heading (\`### Bài N\`)

---

`;

  // Group by grade
  for (const grade of GRADES) {
    const gradeItems = missingAudio.filter(item => item.grade === grade);
    if (gradeItems.length === 0) continue;

    md += `## Grade ${grade}\n\n`;

    for (const item of gradeItems) {
      const unitStr = item.unit.toString().padStart(2, '0');
      md += `### G${grade} Unit ${unitStr} - ${item.section}\n\n`;
      md += `**Voice file:** \`${item.voicePath}\`\n`;
      md += `**Source:** \`${item.sourceFile}\`\n\n`;
      md += `**Audio to insert:**\n`;

      for (const url of item.audioUrls) {
        md += `- \`${url}\`\n`;
      }

      md += `\n**Insert as:**\n\`\`\`html\n`;
      for (const url of item.audioUrls) {
        md += `<audio src="${url}"></audio>\n`;
      }
      md += `\`\`\`\n\n---\n\n`;
    }
  }

  fs.writeFileSync('MISSING-AUDIO-LINKS.md', md);
  console.log(`Generated MISSING-AUDIO-LINKS.md with ${missingAudio.length} entries`);
}

main();
