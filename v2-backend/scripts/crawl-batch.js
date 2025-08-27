import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  grade: 11,
  units: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // Modify this to crawl specific units
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
  delayBetweenRequests: 3000, // 3 seconds
  delayBetweenUnits: 5000 // 5 seconds
};

async function ensureOutputDir() {
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  console.log(`📁 Output directory: ${CONFIG.outputDir}`);
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
      
      // Generate filename
      const filename = `grade-${grade}-unit-${String(unit).padStart(2, '0')}-${lessonType}.txt`;
      const outputPath = path.join(CONFIG.outputDir, filename);
      
      // Add metadata header
      const finalContent = `# METADATA
# ========================================
# Grade: ${grade}
# Unit: ${unit}
# Lesson Type: ${lessonType}
# URL: ${response.data.url || 'Not found'}
# Crawled: ${new Date().toISOString()}
# Size: ${content.length} characters
# ========================================

${content}`;
      
      // Save file
      await fs.writeFile(outputPath, finalContent, 'utf-8');
      
      console.log(`    ✅ Saved: ${filename} (${content.length} chars)`);
      return { success: true, filename, url: response.data.url, size: content.length };
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
  console.log('🚀 Starting Batch Crawl for Grade 11');
  console.log('=====================================\n');
  
  await ensureOutputDir();
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const unit of CONFIG.units) {
    console.log(`\n📚 Unit ${unit}`);
    console.log('-------------------');
    
    for (const lessonType of CONFIG.lessonTypes) {
      const result = await crawlSingleLesson(CONFIG.grade, unit, lessonType);
      
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
      
      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
    }
    
    // Delay between units
    if (unit < CONFIG.units[CONFIG.units.length - 1]) {
      console.log(`\n⏳ Waiting ${CONFIG.delayBetweenUnits/1000}s before next unit...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenUnits));
    }
  }
  
  // Generate summary
  const summary = {
    grade: CONFIG.grade,
    crawledAt: new Date().toISOString(),
    totalAttempts: results.length,
    successful: successCount,
    failed: failCount,
    successRate: `${((successCount / results.length) * 100).toFixed(1)}%`,
    details: results
  };
  
  // Save summary
  const summaryPath = path.join(CONFIG.outputDir, 'crawl-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  
  // Create index file
  const indexContent = results
    .filter(r => r.success)
    .map(r => `${r.filename} | Unit ${r.unit} - ${r.lessonType} | ${r.size} chars | ${r.url || 'No URL'}`)
    .join('\n');
  
  const indexPath = path.join(CONFIG.outputDir, 'index.txt');
  await fs.writeFile(indexPath, `Grade 11 Crawled Content Index
Generated: ${new Date().toISOString()}
Total Files: ${successCount}
======================================

${indexContent}`);
  
  // Print summary
  console.log('\n\n======================================');
  console.log('📊 CRAWL COMPLETE');
  console.log('======================================');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Success Rate: ${summary.successRate}`);
  console.log(`📁 Output Directory: ${CONFIG.outputDir}`);
  console.log(`📋 Summary: crawl-summary.json`);
  console.log(`📑 Index: index.txt`);
}

// Run the crawler
crawlBatch().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});