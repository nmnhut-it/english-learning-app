import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test script for strict content extraction
 * Loads actual content files and tests processing
 */

// Configuration
const API_URL = 'http://localhost:5002/api/process/complete';
const TEST_DATA_DIR = path.join(__dirname, '../../v2/test-data');

// Test cases for different grades and lesson types
const testCases = [
  {
    name: 'Grade 11 - Unit 1 - Getting Started',
    file: 'grade-11-unit-1-getting-started.txt',
    grade: 11,
    unit: 1,
    unitTitle: 'A long and healthy life',
    lessonType: 'getting_started'
  },
  {
    name: 'Grade 11 - Unit 1 - Language',
    file: 'grade-11-unit-1-language.txt',
    grade: 11,
    unit: 1,
    unitTitle: 'A long and healthy life',
    lessonType: 'language'
  },
  {
    name: 'Grade 11 - Unit 1 - Reading',
    file: 'grade-11-unit-1-reading.txt',
    grade: 11,
    unit: 1,
    unitTitle: 'A long and healthy life',
    lessonType: 'reading'
  },
  {
    name: 'Grade 11 - Unit 1 - Speaking',
    file: 'grade-11-unit-1-speaking.txt',
    grade: 11,
    unit: 1,
    unitTitle: 'A long and healthy life',
    lessonType: 'speaking'
  },
  {
    name: 'Grade 11 - Unit 1 - Looking Back',
    file: 'grade-11-unit-1-looking-back.txt',
    grade: 11,
    unit: 1,
    unitTitle: 'A long and healthy life',
    lessonType: 'looking_back'
  },
  {
    name: 'Grade 11 - Unit 1 - CLIL',
    file: 'grade-11-unit-1-cill.txt',
    grade: 11,
    unit: 1,
    unitTitle: 'A long and healthy life', 
    lessonType: 'communication_culture'
  }
];

/**
 * Load content from file
 */
function loadTestContent(filename) {
  const filePath = path.join(TEST_DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Test file not found: ${filePath}`);
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Process content via API
 */
async function processContent(testCase) {
  const content = loadTestContent(testCase.file);
  if (!content) {
    return { success: false, error: 'File not found' };
  }

  console.log(`\n📋 Testing: ${testCase.name}`);
  console.log(`   File: ${testCase.file}`);
  console.log(`   Content length: ${content.length} characters`);
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sourceContent: content,
        grade: testCase.grade,
        unit: testCase.unit,
        unitTitle: testCase.unitTitle,
        lessonType: testCase.lessonType
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Processing successful!`);
      console.log(`   Action: ${result.action}`);
      console.log(`   Processing time: ${result.processingTime}ms`);
      console.log(`   AI Provider: ${result.data?.aiProvider || 'fallback'}`);
      
      // Check if XML was generated
      if (result.data?.xmlContent) {
        // Validate XML structure
        const xmlValidation = validateXMLStructure(result.data.xmlContent);
        console.log(`   XML Validation: ${xmlValidation.valid ? '✅' : '❌'}`);
        if (!xmlValidation.valid) {
          console.log(`   Validation errors: ${xmlValidation.errors.join(', ')}`);
        }
        
        // Extract statistics
        const stats = extractContentStats(result.data.xmlContent);
        console.log(`   Content extracted:`);
        console.log(`     - Vocabulary: ${stats.vocabularyCount} items`);
        console.log(`     - Dialogues: ${stats.dialogueCount}`);
        console.log(`     - Exercises: ${stats.exerciseCount}`);
        console.log(`     - Answers found: ${stats.answersFound}`);
        
        // Check strict extraction
        if (stats.vocabularyCount > 0) {
          const strictCheck = verifyStrictExtraction(content, result.data.xmlContent);
          console.log(`   Strict extraction check: ${strictCheck.valid ? '✅' : '⚠️'}`);
          if (strictCheck.warnings.length > 0) {
            console.log(`   Warnings: ${strictCheck.warnings.join('\n            ')}`);
          }
        }
      }
      
      // Save output for inspection
      const outputFile = path.join(__dirname, `output-${testCase.file.replace('.txt', '.xml')}`);
      if (result.data?.xmlContent) {
        fs.writeFileSync(outputFile, result.data.xmlContent, 'utf-8');
        console.log(`   Output saved to: ${outputFile}`);
      }
      
    } else {
      console.log(`❌ Processing failed!`);
      console.log(`   Error: ${result.error?.message || result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Validate XML structure
 */
function validateXMLStructure(xmlContent) {
  const errors = [];
  
  // Check for required XML elements
  const requiredElements = [
    '<?xml',
    '<lesson_content',
    '<metadata>',
    '<vocabulary_bank>',
    '<extraction_summary>'
  ];
  
  for (const element of requiredElements) {
    if (!xmlContent.includes(element)) {
      errors.push(`Missing required element: ${element}`);
    }
  }
  
  // Check XML is well-formed (basic check)
  const openTags = xmlContent.match(/<[^/][^>]*>/g) || [];
  const closeTags = xmlContent.match(/<\/[^>]+>/g) || [];
  
  if (Math.abs(openTags.length - closeTags.length) > 2) { // Allow some self-closing tags
    errors.push('XML may not be well-formed (tag mismatch)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract content statistics from XML
 */
function extractContentStats(xmlContent) {
  const stats = {
    vocabularyCount: 0,
    dialogueCount: 0,
    exerciseCount: 0,
    answersFound: false
  };
  
  // Count vocabulary items
  const vocabMatches = xmlContent.match(/<vocabulary_item/g);
  stats.vocabularyCount = vocabMatches ? vocabMatches.length : 0;
  
  // Count dialogues
  const dialogueMatches = xmlContent.match(/<dialogue/g);
  stats.dialogueCount = dialogueMatches ? dialogueMatches.length : 0;
  
  // Count exercises
  const exerciseMatches = xmlContent.match(/<exercise/g);
  stats.exerciseCount = exerciseMatches ? exerciseMatches.length : 0;
  
  // Check for answers
  stats.answersFound = xmlContent.includes('<answer') && 
                      !xmlContent.includes('status="not_provided"');
  
  return stats;
}

/**
 * Verify strict extraction (no invented content)
 */
function verifyStrictExtraction(sourceContent, xmlContent) {
  const warnings = [];
  
  // Extract vocabulary words from XML
  const vocabPattern = /<word>([^<]+)<\/word>/g;
  let match;
  while ((match = vocabPattern.exec(xmlContent)) !== null) {
    const word = match[1];
    if (!sourceContent.includes(word)) {
      warnings.push(`Vocabulary "${word}" not found in source`);
    }
  }
  
  // Extract dialogue text
  const dialoguePattern = /<turn[^>]*>([^<]+)<\/turn>/g;
  while ((match = dialoguePattern.exec(xmlContent)) !== null) {
    const text = match[1];
    if (text.length > 10 && !sourceContent.includes(text)) {
      warnings.push(`Dialogue text not found verbatim in source`);
    }
  }
  
  // Check definitions aren't invented
  const defPattern = /<definition>([^<]+)<\/definition>/g;
  while ((match = defPattern.exec(xmlContent)) !== null) {
    const definition = match[1];
    if (definition && definition.length > 5 && !sourceContent.includes(definition)) {
      warnings.push(`Definition "${definition}" might be invented`);
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Content Extraction Tests');
  console.log('=====================================');
  
  // Check if backend is running
  try {
    const health = await fetch('http://localhost:5002/health');
    const status = await health.json();
    console.log(`✅ Backend is running: ${status.status}`);
    console.log(`   Gemini available: ${status.services?.gemini?.available ? '✅' : '❌'}`);
  } catch (error) {
    console.error('❌ Backend is not running! Please start it with: npm run dev');
    process.exit(1);
  }
  
  const results = [];
  
  // Run each test case
  for (const testCase of testCases) {
    const result = await processContent(testCase);
    results.push({
      name: testCase.name,
      success: result.success
    });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n=====================================');
  console.log('📊 Test Summary:');
  const successCount = results.filter(r => r.success).length;
  console.log(`   Total tests: ${results.length}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${results.length - successCount}`);
  
  results.forEach(r => {
    console.log(`   ${r.success ? '✅' : '❌'} ${r.name}`);
  });
  
  console.log('\n✨ Testing complete!');
}

// Run tests if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAllTests().catch(console.error);
}

export { processContent, loadTestContent, validateXMLStructure };