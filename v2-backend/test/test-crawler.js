import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Automated Crawler Test Script
 * Crawls loigiahay content, saves it, processes with Gemini, and verifies extraction
 */

const API_BASE = 'http://localhost:5002';

// Test configuration
const TEST_LESSONS = [
  // Grade 11, Unit 1 - Full unit test
  { grade: 11, unit: 1, lessonType: 'getting_started' },
  { grade: 11, unit: 1, lessonType: 'language' },
  { grade: 11, unit: 1, lessonType: 'reading' },
  { grade: 11, unit: 1, lessonType: 'speaking' },
  { grade: 11, unit: 1, lessonType: 'listening' },
  { grade: 11, unit: 1, lessonType: 'writing' },
  { grade: 11, unit: 1, lessonType: 'communication_culture' },
  { grade: 11, unit: 1, lessonType: 'looking_back' },
  
  // Grade 7, Unit 1 - Sample for comparison
  { grade: 7, unit: 1, lessonType: 'getting_started' },
  { grade: 7, unit: 1, lessonType: 'language' },
];

/**
 * Check if backend is running
 */
async function checkBackend() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✅ Backend is running:', data.status);
    return true;
  } catch (error) {
    console.error('❌ Backend is not running. Please start it with: npm run dev');
    return false;
  }
}

/**
 * Search for loigiahay URL
 */
async function searchForUrl(grade, unit, lessonType) {
  console.log(`\n🔍 Searching for: Grade ${grade}, Unit ${unit}, ${lessonType}`);
  
  const response = await fetch(`${API_BASE}/api/crawler/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grade, unit, lessonType })
  });
  
  const result = await response.json();
  
  if (result.success && result.url) {
    console.log(`✅ Found URL: ${result.url}`);
    return result.url;
  } else {
    console.log('❌ URL not found');
    return null;
  }
}

/**
 * Crawl and save content
 */
async function crawlContent(grade, unit, lessonType) {
  console.log(`\n🕷️ Crawling: Grade ${grade}, Unit ${unit}, ${lessonType}`);
  
  const response = await fetch(`${API_BASE}/api/crawler/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      grade, 
      unit, 
      lessonType,
      processWithAI: false // We'll process separately for testing
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log(`✅ Crawled ${result.contentLength} characters`);
    console.log(`💾 Saved to: ${result.filename}`);
    return result;
  } else {
    console.log(`❌ Crawl failed: ${result.error}`);
    return null;
  }
}

/**
 * Process content with Gemini
 */
async function processWithGemini(filePath, grade, unit, lessonType) {
  console.log(`\n🤖 Processing with Gemini...`);
  
  // Read the crawled content
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Process via API
  const response = await fetch(`${API_BASE}/api/process/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceContent: content,
      grade,
      unit,
      unitTitle: `Unit ${unit}`,
      lessonType,
      contentSource: 'crawler'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log(`✅ Processing: ${result.action}`);
    console.log(`   AI Provider: ${result.data?.aiProvider || 'fallback'}`);
    
    if (result.data?.xmlContent) {
      // Save processed XML
      const xmlFilename = path.basename(filePath).replace('.txt', '.xml');
      const xmlPath = path.join(__dirname, xmlFilename);
      await fs.writeFile(xmlPath, result.data.xmlContent, 'utf-8');
      console.log(`   XML saved to: ${xmlFilename}`);
      
      // Extract statistics
      const stats = extractStats(result.data.xmlContent);
      console.log(`   Extracted:`);
      console.log(`     - Vocabulary: ${stats.vocabulary} items`);
      console.log(`     - Dialogues: ${stats.dialogues}`);
      console.log(`     - Exercises: ${stats.exercises}`);
      console.log(`     - Answers: ${stats.answers ? 'Yes' : 'No'}`);
      
      return { ...result, stats, xmlPath };
    }
  } else {
    console.log(`❌ Processing failed: ${result.error?.message}`);
  }
  
  return result;
}

/**
 * Extract statistics from XML
 */
function extractStats(xmlContent) {
  return {
    vocabulary: (xmlContent.match(/<vocabulary_item/g) || []).length,
    dialogues: (xmlContent.match(/<dialogue/g) || []).length,
    exercises: (xmlContent.match(/<exercise/g) || []).length,
    answers: xmlContent.includes('<answer status="provided">')
  };
}

/**
 * Verify extraction quality
 */
async function verifyExtraction(crawledPath, xmlPath) {
  console.log(`\n🔍 Verifying extraction quality...`);
  
  const source = await fs.readFile(crawledPath, 'utf-8');
  const xml = await fs.readFile(xmlPath, 'utf-8');
  
  const issues = [];
  
  // Extract vocabulary from XML and check against source
  const vocabMatches = xml.matchAll(/<word>([^<]+)<\/word>/g);
  for (const match of vocabMatches) {
    const word = match[1];
    if (!source.includes(word)) {
      issues.push(`Vocabulary "${word}" not in source`);
    }
  }
  
  // Check dialogue content
  const dialogueMatches = xml.matchAll(/<turn[^>]*>([^<]+)<\/turn>/g);
  for (const match of dialogueMatches) {
    const text = match[1];
    if (text.length > 10 && !source.includes(text)) {
      issues.push(`Dialogue text not found in source`);
    }
  }
  
  if (issues.length === 0) {
    console.log(`✅ Extraction verified - all content traceable to source`);
  } else {
    console.log(`⚠️ Found ${issues.length} potential issues:`);
    issues.slice(0, 5).forEach(issue => console.log(`   - ${issue}`));
  }
  
  return { valid: issues.length === 0, issues };
}

/**
 * Run complete test for one lesson
 */
async function testLesson(lesson) {
  const { grade, unit, lessonType } = lesson;
  console.log('\n' + '='.repeat(60));
  console.log(`📚 Testing: Grade ${grade}, Unit ${unit}, ${lessonType}`);
  console.log('='.repeat(60));
  
  const result = {
    grade,
    unit,
    lessonType,
    searchSuccess: false,
    crawlSuccess: false,
    processSuccess: false,
    verificationSuccess: false
  };
  
  try {
    // Step 1: Search for URL
    const url = await searchForUrl(grade, unit, lessonType);
    result.searchSuccess = !!url;
    result.url = url;
    
    if (!url || url.includes('google.com')) {
      console.log('⚠️ Skipping - no specific URL found');
      return result;
    }
    
    // Step 2: Crawl content
    const crawlResult = await crawlContent(grade, unit, lessonType);
    result.crawlSuccess = !!crawlResult?.success;
    
    if (!crawlResult?.success) {
      return result;
    }
    
    result.crawledFile = crawlResult.filename;
    result.contentLength = crawlResult.contentLength;
    
    // Step 3: Process with Gemini
    const processResult = await processWithGemini(
      crawlResult.filePath,
      grade,
      unit,
      lessonType
    );
    
    result.processSuccess = !!processResult?.success;
    result.aiProvider = processResult?.data?.aiProvider;
    result.stats = processResult?.stats;
    
    if (!processResult?.xmlPath) {
      return result;
    }
    
    // Step 4: Verify extraction
    const verification = await verifyExtraction(
      crawlResult.filePath,
      processResult.xmlPath
    );
    
    result.verificationSuccess = verification.valid;
    result.verificationIssues = verification.issues.length;
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    result.error = error.message;
  }
  
  return result;
}

/**
 * Run batch tests
 */
async function runBatchTests(lessons) {
  const results = [];
  
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    console.log(`\n[${i + 1}/${lessons.length}] Processing...`);
    
    const result = await testLesson(lesson);
    results.push(result);
    
    // Wait 5 seconds between crawls (respectful crawling)
    if (i < lessons.length - 1) {
      console.log('\n⏳ Waiting 5 seconds before next crawl...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  return results;
}

/**
 * Generate test report
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST REPORT');
  console.log('='.repeat(60));
  
  const stats = {
    total: results.length,
    searchSuccess: results.filter(r => r.searchSuccess).length,
    crawlSuccess: results.filter(r => r.crawlSuccess).length,
    processSuccess: results.filter(r => r.processSuccess).length,
    verificationSuccess: results.filter(r => r.verificationSuccess).length
  };
  
  console.log('\nOverall Statistics:');
  console.log(`  Total Tests: ${stats.total}`);
  console.log(`  URL Found: ${stats.searchSuccess}/${stats.total}`);
  console.log(`  Crawl Success: ${stats.crawlSuccess}/${stats.total}`);
  console.log(`  Process Success: ${stats.processSuccess}/${stats.total}`);
  console.log(`  Verification Pass: ${stats.verificationSuccess}/${stats.total}`);
  
  console.log('\nDetailed Results:');
  results.forEach(r => {
    const status = r.verificationSuccess ? '✅' : r.processSuccess ? '⚠️' : '❌';
    console.log(`${status} Grade ${r.grade}, Unit ${r.unit}, ${r.lessonType}`);
    
    if (r.stats) {
      console.log(`   Extracted: ${r.stats.vocabulary} vocab, ${r.stats.exercises} exercises`);
    }
    
    if (r.verificationIssues > 0) {
      console.log(`   ⚠️ ${r.verificationIssues} verification issues`);
    }
    
    if (r.error) {
      console.log(`   ❌ Error: ${r.error}`);
    }
  });
  
  // Save report to file
  const reportPath = path.join(__dirname, `crawler-report-${Date.now()}.json`);
  fs.writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 Automated Crawler Test Starting');
  console.log('=====================================\n');
  
  // Check backend
  if (!await checkBackend()) {
    process.exit(1);
  }
  
  // Option to test single lesson or batch
  const args = process.argv.slice(2);
  let lessons = TEST_LESSONS;
  
  if (args[0] === '--single') {
    // Test just one lesson for quick verification
    lessons = [TEST_LESSONS[0]];
    console.log('📝 Running single lesson test\n');
  } else if (args[0] === '--grade' && args[1]) {
    // Test specific grade
    const grade = parseInt(args[1]);
    lessons = TEST_LESSONS.filter(l => l.grade === grade);
    console.log(`📝 Testing Grade ${grade} lessons\n`);
  }
  
  console.log(`Testing ${lessons.length} lessons...`);
  console.log('Expected time: ~' + (lessons.length * 5) + ' seconds\n');
  
  // Run tests
  const results = await runBatchTests(lessons);
  
  // Generate report
  generateReport(results);
  
  console.log('\n✨ Testing complete!');
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { testLesson, runBatchTests };