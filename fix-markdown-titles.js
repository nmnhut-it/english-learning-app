const fs = require('fs').promises;
const path = require('path');

// Directory containing markdown files
const MARKDOWN_DIR = path.join(__dirname, 'markdown-files');

// Function to extract the main title from content
function extractMainTitle(content) {
  const lines = content.split('\n');
  
  // Look for the first # heading that looks like a unit title
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)$/);
    if (match) {
      const title = match[1].trim();
      // Check if this looks like a main unit/chapter title
      if (title.match(/^(UNIT|CHAPTER|LESSON|BÀI)\s+\d+/i) || 
          title.match(/^(REVIEW|TEST|PROJECT)/i) ||
          title.length > 10) { // Likely a main title if it's reasonably long
        return { title, line };
      }
    }
  }
  
  // If no unit title found, look for any # heading
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)$/);
    if (match) {
      return { title: match[1].trim(), line };
    }
  }
  
  return null;
}

// Function to ensure file starts with its main title
async function fixMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const titleInfo = extractMainTitle(content);
    
    if (!titleInfo) {
      console.log(`⚠️  No title found in ${path.basename(filePath)}`);
      return false;
    }
    
    // Check if the file already starts with the main title
    const firstNonEmptyLine = content.split('\n').find(line => line.trim() !== '');
    if (firstNonEmptyLine === titleInfo.line) {
      console.log(`✓ ${path.basename(filePath)} already starts with title: "${titleInfo.title}"`);
      return false;
    }
    
    // Remove the title from its current position if it exists
    let newContent = content;
    if (content.includes(titleInfo.line)) {
      newContent = content.replace(titleInfo.line + '\n', '');
    }
    
    // Add the title at the beginning
    newContent = titleInfo.line + '\n\n' + newContent.trim();
    
    // Write the fixed content back
    await fs.writeFile(filePath, newContent, 'utf-8');
    console.log(`✅ Fixed ${path.basename(filePath)} - moved title to start: "${titleInfo.title}"`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to process all markdown files in a directory
async function processDirectory(dirPath) {
  let filesFixed = 0;
  let totalFiles = 0;
  
  try {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        // Recursively process subdirectories
        const { fixed, total } = await processDirectory(itemPath);
        filesFixed += fixed;
        totalFiles += total;
      } else if (item.endsWith('.md')) {
        totalFiles++;
        const wasFixed = await fixMarkdownFile(itemPath);
        if (wasFixed) filesFixed++;
      }
    }
    
    return { fixed: filesFixed, total: totalFiles };
    
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error.message);
    return { fixed: filesFixed, total: totalFiles };
  }
}

// Main function
async function main() {
  console.log('🔍 Scanning markdown files in:', MARKDOWN_DIR);
  console.log('=' .repeat(60));
  
  const { fixed, total } = await processDirectory(MARKDOWN_DIR);
  
  console.log('=' .repeat(60));
  console.log(`📊 Summary: Fixed ${fixed} out of ${total} markdown files`);
  
  if (fixed > 0) {
    console.log('\n⚠️  Remember to restart your backend server to see the changes!');
  }
}

// Run the script
main().catch(console.error);
