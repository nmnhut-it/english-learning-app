import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conservative crawling configuration
const CONFIG = {
  grade: 11,
  testUnits: [1, 2], // Start with just 2 units for testing
  testLessons: ['getting_started', 'reading', 'communication_culture', 'looking_back'], // Focus on problem lessons
  outputDir: path.join(__dirname, '../../v2/data/raw-crawled/grade-11-test'),
  
  // Respectful crawling delays
  delayBetweenRequests: 8000,    // 8 seconds between each request
  delayBetweenUnits: 15000,      // 15 seconds between units
  delayBetweenLessons: 5000,     // 5 seconds between lessons
  maxRetries: 2,                 // Max retries for failed requests
  
  // User agent rotation
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ]
};

// Unit titles for validation
const UNIT_TITLES = {
  1: "A long and healthy life",
  2: "The generation gap"
};

async function ensureOutputDir() {
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  console.log(`📁 Test output directory: ${CONFIG.outputDir}`);
}

async function validateContent(content, grade, unit, lessonType) {
  if (content.length < 500) {
    return { valid: false, reason: 'Content too short (likely error page)' };
  }
  
  const contentLower = content.toLowerCase();
  
  // Check for math content indicators
  const mathIndicators = ['toán học', 'mathematics', 'phương trình', 'equation', 'số học', 'algebra', 'hình học', 'geometry'];
  const hasMathContent = mathIndicators.some(indicator => contentLower.includes(indicator));
  
  if (hasMathContent) {
    return { valid: false, reason: 'Math content detected' };
  }
  
  // Check for English content indicators
  const englishIndicators = [
    'tiếng anh', 'english', 'global success', 'kết nối tri thức',
    'listen and read', 'dialogue', 'vocabulary', 'grammar'
  ];
  
  const hasEnglishContent = englishIndicators.some(indicator => contentLower.includes(indicator));
  
  if (!hasEnglishContent) {
    return { valid: false, reason: 'No English content indicators found' };
  }
  
  // Check for unit title
  const unitTitle = UNIT_TITLES[unit];
  if (unitTitle && contentLower.includes(unitTitle.toLowerCase())) {
    return { valid: true, confidence: 'high' };
  }
  
  // Check for grade indicators
  const hasGradeIndicator = [
    `grade ${grade}`, `lớp ${grade}`, `tiếng anh ${grade}`
  ].some(indicator => contentLower.includes(indicator));
  
  if (hasGradeIndicator) {
    return { valid: true, confidence: 'medium' };
  }
  
  return { valid: true, confidence: 'low' };
}

async function crawlWithRespectfulDelay(grade, unit, lessonType, attempt = 1) {
  console.log(`  → Attempt ${attempt}: Unit ${unit} - ${lessonType}`);
  
  try {
    // Random user agent
    const userAgent = CONFIG.userAgents[Math.floor(Math.random() * CONFIG.userAgents.length)];
    
    const response = await axios.post('http://localhost:5002/api/crawler/crawl', {
      grade,
      unit,
      lessonType,
      processWithAI: false,
      userAgent
    }, {
      timeout: 60000, // 60 second timeout
      headers: {
        'User-Agent': userAgent
      }
    });
    
    if (response.data.success && response.data.filePath) {
      // Read and validate content
      const content = await fs.readFile(response.data.filePath, 'utf-8');
      const validation = await validateContent(content, grade, unit, lessonType);
      
      if (!validation.valid) {
        console.log(`    ⚠️ Invalid: ${validation.reason}`);
        console.log(`    🔗 URL: ${response.data.url}`);
        
        // Retry with different query if available
        if (attempt < CONFIG.maxRetries) {
          console.log(`    🔄 Retrying in ${CONFIG.delayBetweenRequests/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
          return await crawlWithRespectfulDelay(grade, unit, lessonType, attempt + 1);
        }
        
        return { 
          success: false, 
          error: validation.reason,
          url: response.data.url,
          attempt
        };
      }
      
      // Save with clean filename
      const filename = `grade${grade}-unit${String(unit).padStart(2, '0')}-${lessonType}.txt`;
      const outputPath = path.join(CONFIG.outputDir, filename);
      
      // Add simple header with validation info
      const header = `# Grade ${grade} Unit ${unit} - ${lessonType}
# URL: ${response.data.url}
# Validation: ${validation.confidence} confidence
# Size: ${content.length} characters
# Crawled: ${new Date().toISOString()}
# ==========================================

`;
      
      await fs.writeFile(outputPath, header + content, 'utf-8');
      
      console.log(`    ✅ Valid (${validation.confidence}): ${filename} (${content.length} chars)`);
      
      return {
        success: true,
        filename,
        url: response.data.url,
        size: content.length,
        confidence: validation.confidence,
        attempt
      };
      
    } else {
      console.log(`    ❌ Failed: ${response.data.error}`);
      return { 
        success: false, 
        error: response.data.error,
        attempt
      };
    }
    
  } catch (error) {
    console.log(`    ❌ Error: ${error.message}`);
    
    if (attempt < CONFIG.maxRetries && !error.message.includes('timeout')) {
      console.log(`    🔄 Retrying in ${CONFIG.delayBetweenRequests/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
      return await crawlWithRespectfulDelay(grade, unit, lessonType, attempt + 1);
    }
    
    return { 
      success: false, 
      error: error.message,
      attempt
    };
  }
}

async function testCrawler() {
  console.log('🧪 Testing Fixed Crawler for Grade 11');
  console.log('====================================');
  console.log(`⏱️  Request delay: ${CONFIG.delayBetweenRequests/1000}s`);
  console.log(`⏱️  Unit delay: ${CONFIG.delayBetweenUnits/1000}s`);
  console.log(`🔄 Max retries: ${CONFIG.maxRetries}`);
  console.log('');
  
  await ensureOutputDir();
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const unit of CONFIG.testUnits) {
    console.log(`\n📚 Unit ${unit}: ${UNIT_TITLES[unit]}`);
    console.log('─'.repeat(40));
    
    for (const lessonType of CONFIG.testLessons) {
      const result = await crawlWithRespectfulDelay(CONFIG.grade, unit, lessonType);
      
      results.push({
        unit,
        lessonType,
        ...result
      });
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Respectful delay between requests
      console.log(`    ⏳ Waiting ${CONFIG.delayBetweenRequests/1000}s before next request...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
    }
    
    // Longer delay between units
    if (unit < CONFIG.testUnits[CONFIG.testUnits.length - 1]) {
      console.log(`\n⏳ Unit complete. Waiting ${CONFIG.delayBetweenUnits/1000}s before next unit...\n`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenUnits));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🧪 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
  
  // Detailed results
  console.log('\n📋 Detailed Results:');
  results.forEach(r => {
    const status = r.success ? 
      `✅ ${r.confidence || 'ok'} (${r.size} chars)` : 
      `❌ ${r.error}`;
    console.log(`  Unit ${r.unit} ${r.lessonType}: ${status}`);
    if (r.url) console.log(`     ${r.url}`);
  });
  
  // Save test report
  const report = {
    testDate: new Date().toISOString(),
    config: CONFIG,
    summary: { successCount, failCount, totalTests: results.length },
    results
  };
  
  const reportPath = path.join(CONFIG.outputDir, 'test-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Test report saved: ${reportPath}`);
  console.log(`📁 Test files: ${CONFIG.outputDir}`);
  
  // Specific focus on problem lessons
  console.log('\n🎯 Problem Lesson Analysis:');
  const problemLessons = ['reading', 'communication_culture', 'looking_back'];
  problemLessons.forEach(lessonType => {
    const lessonResults = results.filter(r => r.lessonType === lessonType);
    const successful = lessonResults.filter(r => r.success).length;
    console.log(`  ${lessonType}: ${successful}/${lessonResults.length} successful`);
  });
}

// Check backend availability
async function checkBackend() {
  try {
    const response = await axios.get('http://localhost:5002/health', { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 Checking backend...');
  
  const backendRunning = await checkBackend();
  if (!backendRunning) {
    console.error('❌ Backend not running! Start with: cd v2-backend && npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Backend ready\n');
  
  await testCrawler();
}

main().catch(error => {
  console.error('💥 Fatal error:', error.message);
  process.exit(1);
});