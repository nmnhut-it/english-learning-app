const fs = require('fs');
const path = require('path');

const LESSON_TYPES = {
  'GETTING STARTED': 'getting-started',
  'A CLOSER LOOK 1': 'a-closer-look-1',
  'A CLOSER LOOK 2': 'a-closer-look-2',
  'COMMUNICATION': 'communication',
  'SKILLS 1': 'skills-1',
  'SKILLS 2': 'skills-2',
  'LOOKING BACK': 'looking-back',
  'PROJECT': 'project',
  'REVIEW 1': 'review-1',
  'REVIEW 2': 'review-2',
  'REVIEW 3': 'review-3',
  'REVIEW 4': 'review-4'
};

function extractUnitInfo(content) {
  // Try different formats
  let unitMatch = content.match(/\*\*UNIT (\d+):\s*([^*]+)\*\*/);
  if (!unitMatch) {
    unitMatch = content.match(/^UNIT (\d+):\s*([^\n]+)/m);
  }
  if (!unitMatch) {
    unitMatch = content.match(/^#\s*UNIT (\d+):\s*([^\n]+)/m);
  }
  if (!unitMatch) return null;

  return {
    unitNumber: unitMatch[1].trim(),
    unitTitle: unitMatch[2].trim()
  };
}

function extractReviewInfo(content, startLine) {
  const reviewMatch = content.match(/\*\*REVIEW (\d+)\*\*/);
  if (!reviewMatch) return null;

  return {
    reviewNumber: reviewMatch[1].trim(),
    isReview: true
  };
}

function splitFileIntoLessons(filePath) {
  console.log(`\nProcessing: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const unitInfo = extractUnitInfo(content);
  if (!unitInfo) {
    console.log('  ❌ No unit info found');
    return;
  }

  console.log(`  Unit ${unitInfo.unitNumber}: ${unitInfo.unitTitle}`);

  const sections = [];
  let currentSection = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Try different section header formats
    let sectionMatch = line.match(/^\*\*([A-Z][A-Z\s\d]+)\*\*\s*$/);
    if (!sectionMatch) {
      sectionMatch = line.match(/^([A-Z][A-Z\s\d]+)\s*$/);
    }
    if (!sectionMatch) {
      sectionMatch = line.match(/^##\s+([A-Z][A-Z\s\d]+)\s*$/);
    }

    if (sectionMatch) {
      const sectionName = sectionMatch[1].trim();

      if (LESSON_TYPES[sectionName]) {
        if (currentSection) {
          sections.push({
            name: currentSection,
            content: currentContent.join('\n')
          });
        }

        currentSection = sectionName;
        currentContent = [line];
      } else if (currentSection) {
        currentContent.push(line);
      }
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections.push({
      name: currentSection,
      content: currentContent.join('\n')
    });
  }

  const inputDir = path.dirname(filePath);
  const baseFilename = path.basename(filePath, '.md');
  const gradeMatch = baseFilename.match(/g(\d+)/);

  if (!gradeMatch) {
    console.log('  ❌ Cannot determine grade number');
    return;
  }

  const gradeNum = gradeMatch[1];

  sections.forEach(section => {
    const lessonType = LESSON_TYPES[section.name];

    const isReview = section.name.startsWith('REVIEW');
    let outputDir, outputFilename, header;

    if (isReview) {
      const reviewNum = section.name.match(/REVIEW (\d+)/)[1];
      outputDir = path.join(inputDir, `review-${reviewNum}`);
      outputFilename = `g${gradeNum}_${lessonType}.md`;
      header = `**${section.name}**\n\n`;
    } else {
      outputDir = path.join(inputDir, `unit-${unitInfo.unitNumber.padStart(2, '0')}`);
      outputFilename = `g${gradeNum}_u${unitInfo.unitNumber.padStart(2, '0')}_${lessonType}.md`;
      header = `**UNIT ${unitInfo.unitNumber}: ${unitInfo.unitTitle}**\n\n`;
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, header + section.content, 'utf8');

    console.log(`  ✓ Created: ${outputFilename}`);
  });
}

function processDirectory(dirPath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing directory: ${dirPath}`);
  console.log('='.repeat(60));

  const files = fs.readdirSync(dirPath)
    .filter(f => f.match(/g\d+_part_\d+\.md$/))
    .sort();

  console.log(`Found ${files.length} files to process`);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    try {
      splitFileIntoLessons(filePath);
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  });
}

const gradeDirs = ['formatg6', 'g7', 'g8', 'g9'];
const baseDir = path.join(__dirname, 'markdown-files');

console.log('Lesson File Splitter');
console.log('='.repeat(60));

if (process.argv.length > 2) {
  const targetGrade = process.argv[2];
  const targetDir = path.join(baseDir, targetGrade);

  if (fs.existsSync(targetDir)) {
    processDirectory(targetDir);
  } else {
    console.log(`❌ Directory not found: ${targetDir}`);
  }
} else {
  gradeDirs.forEach(gradeDir => {
    const fullPath = path.join(baseDir, gradeDir);
    if (fs.existsSync(fullPath)) {
      processDirectory(fullPath);
    }
  });
}

console.log('\n✅ Done!');
