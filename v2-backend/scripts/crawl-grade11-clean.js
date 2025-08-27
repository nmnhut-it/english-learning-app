import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  grade: 11,
  units: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  lessonTypes: [
    'getting_started',
    'language',
    'reading', 
    'speaking',
    'listening',
    'writing',
    'communication_culture',
    'looking_back'
  ],
  outputDir: path.join(__dirname, '../../v2/data/raw-crawled/grade-11'),
  delayBetweenRequests: 3000,
  delayBetweenUnits: 5000
};

// Unit titles for validation
const UNIT_TITLES = {
  1: "A long and healthy life",
  2: "The generation gap", 
  3: "Cities of the future",
  4: "ASEAN and Vietnam",
  5: "Global warming",
  6: "Preserving our heritage",
  7: "Education options for school-leavers",
  8: "Becoming independent",
  9: "Social issues",
  10: "The ecosystem"
};

// Grade 11 content validators
const GRADE_11_KEYWORDS = [
  'global warming', 'climate change', 'ASEAN', 'heritage', 
  'generation gap', 'ecosystem', 'independent', 'social issues',
  'healthy life', 'cities of the future', 'school-leavers',
  'present perfect', 'past perfect', 'passive voice', 'modal verbs',
  'relative clauses', 'conditional sentences', 'reported speech'
];

// Invalid content indicators (elementary level)
const INVALID_KEYWORDS = [
  "They're firefighters", "Funny monkeys", "bubble tea",
  "What's your favorite color", "My family", "My toys",
  "Let's play", "I like apples"
];

async function ensureOutputDir() {
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  console.log(`📁 Output directory: ${CONFIG.outputDir}`);
}

async function validateContent(content, grade, unit) {
  // Check if content is too short (likely an error page)
  if (content.length < 1000) {
    return { valid: false, reason: 'Content too short' };
  }
  
  // Check for invalid (elementary) keywords
  const hasInvalidContent = INVALID_KEYWORDS.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  if (hasInvalidContent) {
    return { valid: false, reason: 'Elementary school content detected' };
  }
  
  // Check for grade-appropriate keywords
  const hasValidKeywords = GRADE_11_KEYWORDS.some(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Check for unit title
  const unitTitle = UNIT_TITLES[unit];
  const hasUnitTitle = unitTitle && content.toLowerCase().includes(unitTitle.toLowerCase());
  
  // Check for "Grade 11" or "Lớp 11" or "Tiếng Anh 11"
  const hasGradeIndicator = 
    content.includes('Grade 11') || 
    content.includes('Lớp 11') ||
    content.includes('Tiếng Anh 11') ||
    content.includes('English 11');
  
  if (!hasValidKeywords && !hasUnitTitle && !hasGradeIndicator) {
    return { valid: false, reason: 'No Grade 11 content indicators found' };
  }
  
  return { valid: true };
}

async function crawlSingleLesson(grade, unit, lessonType) {
  const API_URL = 'http://localhost:5002/api/crawler/crawl';
  
  console.log(`  → Crawling: Unit ${unit} - ${lessonType}`);
  
  try {
    const response = await axios.post(API_URL, {
      grade,
      unit,
      lessonType,
      processWithAI: false
    });
    
    if (response.data.success && response.data.filePath) {
      // Read crawled content
      const content = await fs.readFile(response.data.filePath, 'utf-8');
      
      // Validate content
      const validation = await validateContent(content, grade, unit);
      
      if (!validation.valid) {
        console.log(`    ⚠️ Invalid content: ${validation.reason}`);
        console.log(`    ↻ URL: ${response.data.url || 'Unknown'}`);
        return { 
          success: false, 
          error: `Invalid content: ${validation.reason}`,
          url: response.data.url 
        };
      }
      
      // Generate filename
      const filename = `grade${grade}-unit${String(unit).padStart(2, '0')}-${lessonType}.txt`;
      const outputPath = path.join(CONFIG.outputDir, filename);
      
      // Save ONLY the raw content, no headers
      await fs.writeFile(outputPath, content, 'utf-8');
      
      console.log(`    ✅ Saved: ${filename} (${content.length} chars)`);
      
      return { 
        success: true, 
        filename, 
        url: response.data.url, 
        size: content.length 
      };
      
    } else {
      console.log(`    ❌ Failed: ${response.data.error || 'URL not found'}`);
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    console.log(`    ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function crawlBatch() {
  console.log('🚀 Starting Clean Batch Crawl for Grade 11');
  console.log('=====================================\n');
  
  await ensureOutputDir();
  
  const results = [];
  const metadata = {
    grade: CONFIG.grade,
    crawledAt: new Date().toISOString(),
    units: {}
  };
  
  let successCount = 0;
  let failCount = 0;
  
  for (const unit of CONFIG.units) {
    console.log(`\n📚 Unit ${unit}: ${UNIT_TITLES[unit]}`);
    console.log('-------------------');
    
    metadata.units[unit] = {
      title: UNIT_TITLES[unit],
      lessons: {}
    };
    
    for (const lessonType of CONFIG.lessonTypes) {
      const result = await crawlSingleLesson(CONFIG.grade, unit, lessonType);
      
      results.push({
        unit,
        lessonType,
        ...result
      });
      
      if (result.success) {
        successCount++;
        metadata.units[unit].lessons[lessonType] = {
          filename: result.filename,
          url: result.url,
          size: result.size
        };
      } else {
        failCount++;
        metadata.units[unit].lessons[lessonType] = {
          error: result.error
        };
      }
      
      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
    }
    
    // Delay between units
    if (unit < CONFIG.units[CONFIG.units.length - 1]) {
      console.log(`\n⏳ Waiting ${CONFIG.delayBetweenUnits/1000}s before next unit...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenUnits));
    }
  }
  
  // Save metadata separately
  const metadataPath = path.join(CONFIG.outputDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  
  // Create simple index file
  const successfulFiles = results
    .filter(r => r.success)
    .map(r => r.filename)
    .sort();
  
  const indexPath = path.join(CONFIG.outputDir, 'index.txt');
  await fs.writeFile(indexPath, successfulFiles.join('\n'));
  
  // Print summary
  console.log('\n\n=====================================');
  console.log('📊 CRAWL COMPLETE');
  console.log('=====================================');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
  console.log(`📁 Output Directory: ${CONFIG.outputDir}`);
  console.log(`📋 Metadata: metadata.json`);
  console.log(`📑 Index: index.txt`);
  
  // List any failed crawls for review
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log('\n⚠️ Failed Crawls:');
    failed.forEach(f => {
      console.log(`  - Unit ${f.unit} ${f.lessonType}: ${f.error}`);
    });
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await axios.get('http://localhost:5002/health');
    return response.status === 200;
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
  await crawlBatch();
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});