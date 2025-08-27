import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Grade 11 curriculum structure
const GRADE_11_UNITS = [
  { unit: 1, title: "A long and healthy life" },
  { unit: 2, title: "The generation gap" },
  { unit: 3, title: "Cities of the future" },
  { unit: 4, title: "ASEAN and Vietnam" },
  { unit: 5, title: "Global warming" },
  { unit: 6, title: "Preserving our heritage" },
  { unit: 7, title: "Education options for school-leavers" },
  { unit: 8, title: "Becoming independent" },
  { unit: 9, title: "Social issues" },
  { unit: 10, title: "The ecosystem" }
];

// Lesson types for each unit
const LESSON_TYPES = [
  'getting_started',
  'language',
  'reading',
  'speaking', 
  'listening',
  'writing',
  'communication_culture',
  'looking_back'
];

// Output directory for raw crawled content
const OUTPUT_DIR = path.join(__dirname, '../../v2/data/raw-crawled/grade-11');

async function ensureDirectory() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`📁 Output directory ready: ${OUTPUT_DIR}`);
}

async function crawlLesson(grade, unit, unitTitle, lessonType) {
  const API_URL = 'http://localhost:5002/api/crawler/crawl';
  
  try {
    console.log(`🔍 Crawling Grade ${grade} Unit ${unit} - ${lessonType}...`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grade,
        unit,
        lessonType,
        processWithAI: false // We only want raw crawled content
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.filePath) {
      // Read the crawled content
      const crawledContent = await fs.readFile(result.filePath, 'utf-8');
      
      // Create well-named file
      const filename = `grade-${grade}-unit-${String(unit).padStart(2, '0')}-${lessonType}.txt`;
      const outputPath = path.join(OUTPUT_DIR, filename);
      
      // Save with metadata header
      const contentWithMetadata = `# Grade 11 - Unit ${unit}: ${unitTitle}
# Lesson Type: ${lessonType}
# Crawled: ${new Date().toISOString()}
# Source URL: ${result.url || 'Not found'}
# Content Length: ${crawledContent.length} characters
# ============================================

${crawledContent}`;
      
      await fs.writeFile(outputPath, contentWithMetadata, 'utf-8');
      
      console.log(`✅ Saved: ${filename} (${crawledContent.length} chars)`);
      return { success: true, filename, url: result.url };
    } else {
      console.log(`❌ Failed: ${lessonType} - ${result.error || 'No URL found'}`);
      return { success: false, lessonType, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Error crawling ${lessonType}:`, error.message);
    return { success: false, lessonType, error: error.message };
  }
}

async function crawlUnit(unitInfo) {
  const { unit, title } = unitInfo;
  console.log(`\n📚 Starting Unit ${unit}: ${title}`);
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const lessonType of LESSON_TYPES) {
    const result = await crawlLesson(11, unit, title, lessonType);
    results.push(result);
    
    // Wait 5 seconds between requests to be respectful
    if (result.success) {
      console.log('⏳ Waiting 5 seconds before next request...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return {
    unit,
    title,
    results
  };
}

async function crawlAllGrade11() {
  console.log('🚀 Starting Grade 11 Full Crawl');
  console.log('=' .repeat(50));
  
  await ensureDirectory();
  
  const summary = {
    grade: 11,
    totalUnits: GRADE_11_UNITS.length,
    totalLessons: GRADE_11_UNITS.length * LESSON_TYPES.length,
    successful: 0,
    failed: 0,
    units: []
  };
  
  for (const unitInfo of GRADE_11_UNITS) {
    const unitResults = await crawlUnit(unitInfo);
    summary.units.push(unitResults);
    
    // Count successes and failures
    unitResults.results.forEach(r => {
      if (r.success) summary.successful++;
      else summary.failed++;
    });
    
    // Wait 10 seconds between units
    console.log('\n⏳ Waiting 10 seconds before next unit...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  // Save summary report
  const reportPath = path.join(OUTPUT_DIR, 'crawl-summary.json');
  await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 CRAWL COMPLETE');
  console.log(`✅ Successful: ${summary.successful}/${summary.totalLessons}`);
  console.log(`❌ Failed: ${summary.failed}/${summary.totalLessons}`);
  console.log(`📁 Files saved to: ${OUTPUT_DIR}`);
  console.log(`📋 Summary report: crawl-summary.json`);
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await fetch('http://localhost:5002/health');
    return response.ok;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 Checking backend status...');
  
  const backendRunning = await checkBackend();
  if (!backendRunning) {
    console.error('❌ Backend is not running! Please start it with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Backend is running\n');
  
  // Start crawling
  await crawlAllGrade11();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { crawlAllGrade11, crawlUnit, crawlLesson };