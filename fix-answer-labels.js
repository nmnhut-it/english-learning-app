const fs = require('fs');
const path = require('path');

const VOICE_LECTURES_DIR = path.join(__dirname, 'v2/data/voice-lectures');

function getFilesRecursive(dir, ext) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getFilesRecursive(fullPath, ext));
    } else if (item.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

function fixAnswerLabels(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const newLines = [];
  let modified = false;
  let currentExerciseNum = null;
  let currentExerciseType = 'Bài';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for exercise heading: ### Bài X or ### Bài tập X
    const headingMatch = line.match(/^###\s+(Bài\s*tập|Bài)\s*(\d+)/i);
    if (headingMatch) {
      currentExerciseType = headingMatch[1].includes('tập') ? 'Bài tập' : 'Bài';
      currentExerciseNum = headingMatch[2];
    }

    // Check for chunk comment patterns:
    // <!-- chunk: exercise-bai1 -->, <!-- chunk: exercise_1 -->, <!-- chunk: answer_practice_1 -->, <!-- chunk: bai1 -->
    const chunkMatch = line.match(/<!--\s*chunk:\s*(?:answer_)?(?:practice|exercise)?[-_]?(?:bai)?(\d+)/i);
    if (chunkMatch) {
      currentExerciseNum = chunkMatch[1];
      currentExerciseType = 'Bài';
    }

    // Check for teacher script with Bài X pattern: "Bài 2 — điền..."
    const scriptBaiMatch = line.match(/^Bài\s*(\d+)\s*[—–-]/);
    if (scriptBaiMatch) {
      currentExerciseNum = scriptBaiMatch[1];
      currentExerciseType = 'Bài';
    }

    // Check for bold exercise format: **Bài X** or **Bài X trang Y**
    const boldBaiMatch = line.match(/^\*\*Bài\s*(\d+)(?:\s+trang\s+\d+)?\*\*/);
    if (boldBaiMatch) {
      currentExerciseNum = boldBaiMatch[1];
      currentExerciseType = 'Bài';
    }

    // Check if line has **Đáp án:** without exercise number prefix
    if (line.includes('**Đáp án:**') && !line.includes('Bài')) {
      if (currentExerciseNum) {
        const newLine = line.replace('**Đáp án:**', `**${currentExerciseType} ${currentExerciseNum} - Đáp án:**`);
        newLines.push(newLine);
        modified = true;
        console.log(`  Fixed: "${currentExerciseType} ${currentExerciseNum}" at line ${i + 1}`);
      } else {
        newLines.push(line);
        console.log(`  Warning: No exercise number found for line ${i + 1}`);
      }
    } else {
      newLines.push(line);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
    return true;
  }
  return false;
}

function main() {
  console.log('Fixing answer labels in voice-lecture files...\n');

  const grades = ['g6', 'g7', 'g8', 'g9'];
  let totalFixed = 0;
  let totalOccurrences = 0;

  for (const grade of grades) {
    const gradeDir = path.join(VOICE_LECTURES_DIR, grade);
    if (!fs.existsSync(gradeDir)) continue;

    const files = getFilesRecursive(gradeDir, '.md');

    for (const file of files) {
      const relativePath = path.relative(VOICE_LECTURES_DIR, file);
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      const unfixedLines = lines.filter(l => l.includes('**Đáp án:**') && !l.includes('Bài'));

      if (unfixedLines.length > 0) {
        console.log(`\nProcessing: ${relativePath} (${unfixedLines.length} to fix)`);
        totalOccurrences += unfixedLines.length;
        if (fixAnswerLabels(file)) totalFixed++;
      }
    }
  }

  console.log(`\n\nDone! Fixed ${totalOccurrences} occurrences in ${totalFixed} files.`);
}

main();
