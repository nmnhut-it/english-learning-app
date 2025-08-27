import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// VERY respectful configuration for loigiaihay.com
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
  outputDir: path.join(__dirname, '../../v2/data/raw-crawled/grade-11-final'),
  
  // Extra conservative delays to avoid detection
  delayBetweenRequests: 12000,   // 12 seconds between each request  
  delayBetweenLessons: 8000,     // 8 seconds between lesson types
  delayBetweenUnits: 30000,      // 30 seconds between units
  delayAfterError: 60000,        // 1 minute after any error
  maxRetries: 3,
  
  // Session management
  maxRequestsPerSession: 20,     // Restart browser every 20 requests
  sessionBreak: 120000           // 2 minute break between sessions
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

// Content validation
async function validateContent(content, grade, unit, lessonType) {
  if (content.length < 1000) {
    return { valid: false, reason: 'Content too short' };
  }
  
  const contentLower = content.toLowerCase();
  
  // Strong math content rejection
  const mathIndicators = [
    'toán học', 'mathematics', 'phương trình', 'equation', 
    'đại số', 'algebra', 'hình học', 'geometry',
    'tính toán', 'calculation', 'số học', 'arithmetic',
    'giải tích', 'calculus', 'xác suất', 'probability'
  ];
  
  const hasMathContent = mathIndicators.some(indicator => contentLower.includes(indicator));
  if (hasMathContent) {
    return { valid: false, reason: 'Math content detected' };
  }
  
  // Check for English content indicators
  const englishIndicators = [
    'tiếng anh', 'english', 'global success', 'kết nối tri thức',
    'listen and read', 'dialogue', 'vocabulary', 'grammar',
    'ms hoa', 'conversation', 'pronunciation', 'speaking'
  ];
  
  const hasEnglishContent = englishIndicators.some(indicator => contentLower.includes(indicator));
  if (!hasEnglishContent) {
    return { valid: false, reason: 'No English content indicators' };
  }
  
  // Check unit title match
  const unitTitle = UNIT_TITLES[unit];
  if (unitTitle && contentLower.includes(unitTitle.toLowerCase())) {
    return { valid: true, confidence: 'high' };
  }
  
  // Check grade indicators
  const gradeIndicators = [`lớp ${grade}`, `grade ${grade}`, `tiếng anh ${grade}`];
  const hasGradeMatch = gradeIndicators.some(indicator => contentLower.includes(indicator));
  
  if (hasGradeMatch) {
    return { valid: true, confidence: 'medium' };
  }
  
  return { valid: true, confidence: 'low' };
}

async function ensureOutputDir() {
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  console.log(`📁 Final output directory: ${CONFIG.outputDir}`);
}

async function crawlLessonRespectfully(grade, unit, lessonType, requestCount) {
  console.log(`  📖 Crawling: Unit ${unit} - ${lessonType} (Request #${requestCount})`);
  
  try {
    const response = await axios.post('http://localhost:5002/api/crawler/crawl', {
      grade,
      unit, 
      lessonType,
      processWithAI: false
    }, {
      timeout: 120000, // 2 minute timeout
    });
    
    if (response.data.success && response.data.filePath) {
      // Read and validate content
      const content = await fs.readFile(response.data.filePath, 'utf-8');
      const validation = await validateContent(content, grade, unit, lessonType);
      
      if (!validation.valid) {
        console.log(`    ❌ Invalid: ${validation.reason}`);
        return { success: false, error: validation.reason, url: response.data.url };
      }
      
      // Save with clean naming
      const filename = `grade${grade}-unit${String(unit).padStart(2, '0')}-${lessonType}.txt`;
      const outputPath = path.join(CONFIG.outputDir, filename);
      
      // Save ONLY the raw content (no metadata headers that confuse indexer)
      await fs.writeFile(outputPath, content, 'utf-8');
      
      console.log(`    ✅ Valid (${validation.confidence}): ${filename} (${content.length} chars)`);
      
      return {
        success: true,
        filename,
        url: response.data.url,
        size: content.length,
        confidence: validation.confidence
      };
      
    } else {
      console.log(`    ❌ Failed: ${response.data.error}`);
      return { success: false, error: response.data.error };
    }
    
  } catch (error) {
    console.log(`    ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function crawlFullGrade11() {
  console.log('🚀 Starting RESPECTFUL Full Grade 11 Crawl');
  console.log('==========================================');
  console.log(`⏱️  Request delay: ${CONFIG.delayBetweenRequests/1000}s`);
  console.log(`⏱️  Unit delay: ${CONFIG.delayBetweenUnits/1000}s`);
  console.log(`⏱️  Error delay: ${CONFIG.delayAfterError/1000}s`);
  console.log(`🔄 Max per session: ${CONFIG.maxRequestsPerSession}`);
  console.log('');
  
  await ensureOutputDir();
  
  const results = [];
  const metadata = {
    grade: CONFIG.grade,
    crawledAt: new Date().toISOString(),
    config: CONFIG,
    units: {}
  };
  
  let successCount = 0;
  let failCount = 0;
  let requestCount = 0;
  let sessionCount = 1;
  
  for (const unit of CONFIG.units) {
    console.log(`\n📚 Unit ${unit}: ${UNIT_TITLES[unit]}`);
    console.log('─'.repeat(50));
    
    metadata.units[unit] = {
      title: UNIT_TITLES[unit],
      lessons: {}
    };
    
    for (const lessonType of CONFIG.lessonTypes) {
      requestCount++;
      
      // Session management - restart browser every N requests
      if (requestCount > CONFIG.maxRequestsPerSession) {
        console.log(`\n🔄 Session ${sessionCount} complete. Taking ${CONFIG.sessionBreak/1000}s break...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.sessionBreak));
        requestCount = 1;
        sessionCount++;
        console.log(`🔄 Starting session ${sessionCount}\n`);
      }
      
      const result = await crawlLessonRespectfully(CONFIG.grade, unit, lessonType, requestCount);
      
      results.push({
        unit,
        lessonType,
        session: sessionCount,
        ...result
      });
      
      if (result.success) {
        successCount++;
        metadata.units[unit].lessons[lessonType] = {
          filename: result.filename,
          url: result.url,
          size: result.size,
          confidence: result.confidence
        };
      } else {
        failCount++;
        metadata.units[unit].lessons[lessonType] = {
          error: result.error
        };
        
        // Extra delay after errors
        console.log(`    ⏳ Error delay: ${CONFIG.delayAfterError/1000}s`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayAfterError));
      }
      
      // Standard delay between requests
      console.log(`    ⏳ Standard delay: ${CONFIG.delayBetweenRequests/1000}s`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
    }
    
    // Longer delay between units  
    if (unit < CONFIG.units[CONFIG.units.length - 1]) {
      console.log(`\n⏳ Unit ${unit} complete. Waiting ${CONFIG.delayBetweenUnits/1000}s before Unit ${unit + 1}...\n`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenUnits));
    }
  }
  
  // Save metadata
  const metadataPath = path.join(CONFIG.outputDir, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  
  // Create index of successful files
  const successfulFiles = results
    .filter(r => r.success)
    .map(r => r.filename)
    .sort();
  
  const indexPath = path.join(CONFIG.outputDir, 'index.txt');
  await fs.writeFile(indexPath, successfulFiles.join('\n'));
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🏁 GRADE 11 CRAWL COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${failCount}/${results.length}`);
  console.log(`📊 Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
  console.log(`📁 Files saved to: ${CONFIG.outputDir}`);
  console.log(`⏱️  Total time: ${((Date.now() - Date.parse(metadata.crawledAt)) / 60000).toFixed(1)} minutes`);
  
  // Success by unit
  console.log('\n📊 Success by Unit:');
  CONFIG.units.forEach(unit => {
    const unitResults = results.filter(r => r.unit === unit);
    const unitSuccess = unitResults.filter(r => r.success).length;
    console.log(`  Unit ${unit}: ${unitSuccess}/${unitResults.length} successful`);
  });
  
  // Problem lesson analysis
  console.log('\n🎯 Previously Problematic Lessons:');
  const problemLessons = ['reading', 'communication_culture', 'looking_back'];
  problemLessons.forEach(lessonType => {
    const lessonResults = results.filter(r => r.lessonType === lessonType);
    const successful = lessonResults.filter(r => r.success).length;
    console.log(`  ${lessonType}: ${successful}/${lessonResults.length} successful`);
  });
  
  console.log(`\n📋 Full report: metadata.json`);
  console.log(`📑 File index: index.txt`);
}

// Check backend
async function checkBackend() {
  try {
    const response = await axios.get('http://localhost:5002/health', { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔧 Checking backend status...');
  
  const backendRunning = await checkBackend();
  if (!backendRunning) {
    console.error('❌ Backend not running! Please start: cd v2-backend && npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Backend ready');
  console.log('⚠️  This will take ~45 minutes with respectful delays');
  console.log('💡 loigiaihay.com anti-crawling countermeasures in place\n');
  
  await crawlFullGrade11();
}

main().catch(error => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});