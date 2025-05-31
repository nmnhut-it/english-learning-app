#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function splitMarkdownFile(filePath, delimiter, options = {}) {
    const {
        outputDir = './output',
        includePrefix = false,
        verbose = false,
        exactMatch = true,
        regex = false
    } = options;
    
    try {
        // Check if file exists
        await fs.access(filePath);
        
        // Read the file
        const content = await fs.readFile(filePath, 'utf8');
        
        if (verbose) {
            console.log(`Reading file: ${filePath}`);
            console.log(`Delimiter: "${delimiter}"`);
            console.log(`Output directory: ${outputDir}`);
        }
        
        // Create output directory if it doesn't exist
        await fs.mkdir(outputDir, { recursive: true });
        
        // Find all delimiter positions
        const delimiterPositions = [];
        
        if (regex) {
            // Use regex matching
            const pattern = new RegExp(delimiter, 'gm');
            let match;
            while ((match = pattern.exec(content)) !== null) {
                delimiterPositions.push({
                    index: match.index,
                    length: match[0].length,
                    text: match[0]
                });
            }
        } else if (exactMatch) {
            // Exact match - ensure delimiter is on its own line or followed by specific characters
            let searchIndex = 0;
            while (searchIndex < content.length) {
                const index = content.indexOf(delimiter, searchIndex);
                if (index === -1) break;
                
                // Check if this is a whole word/line match
                const beforeChar = index > 0 ? content[index - 1] : '\n';
                const afterIndex = index + delimiter.length;
                const afterChar = afterIndex < content.length ? content[afterIndex] : '\n';
                
                // Match if:
                // 1. At start of line (preceded by newline or start of file)
                // 2. At end of line (followed by newline or end of file)
                // 3. Followed by whitespace, punctuation, or end of line
                const isStartOfLine = beforeChar === '\n' || index === 0;
                const isValidAfter = afterChar === '\n' || 
                                   afterChar === '\r' || 
                                   afterChar === ' ' || 
                                   afterChar === '\t' ||
                                   afterIndex >= content.length ||
                                   /[^\w]/.test(afterChar); // Not a word character
                
                if (isStartOfLine || isValidAfter) {
                    delimiterPositions.push({
                        index: index,
                        length: delimiter.length,
                        text: delimiter
                    });
                }
                
                searchIndex = index + delimiter.length;
            }
        } else {
            // Simple substring matching (old behavior)
            let searchIndex = 0;
            while (searchIndex < content.length) {
                const index = content.indexOf(delimiter, searchIndex);
                if (index === -1) break;
                
                delimiterPositions.push({
                    index: index,
                    length: delimiter.length,
                    text: delimiter
                });
                
                searchIndex = index + delimiter.length;
            }
        }
        
        if (verbose) {
            console.log(`Found ${delimiterPositions.length} occurrences of delimiter`);
        }
        
        // Split by delimiter but keep the delimiter
        const parts = [];
        
        // Include content before first delimiter if requested
        if (includePrefix && delimiterPositions.length > 0 && delimiterPositions[0].index > 0) {
            const prefixContent = content.substring(0, delimiterPositions[0].index).trim();
            if (prefixContent) {
                parts.push(prefixContent);
            }
        }
        
        // Process each delimiter position
        for (let i = 0; i < delimiterPositions.length; i++) {
            const start = delimiterPositions[i].index;
            const end = i < delimiterPositions.length - 1 
                ? delimiterPositions[i + 1].index 
                : content.length;
            
            const part = content.substring(start, end).trim();
            if (part) {
                parts.push(part);
            }
        }
        
        if (parts.length === 0) {
            console.error(`No occurrences of delimiter "${delimiter}" found in the file.`);
            process.exit(1);
        }
        
        // Write each part to a separate file
        const fileName = path.basename(filePath, path.extname(filePath));
        const results = [];
        
        for (let i = 0; i < parts.length; i++) {
            const outputPath = path.join(outputDir, `${fileName}_part_${i + 1}.md`);
            await fs.writeFile(outputPath, parts[i]);
            results.push(outputPath);
            
            if (verbose) {
                console.log(`Created: ${outputPath} (${parts[i].length} characters)`);
            }
        }
        
        console.log(`\n✓ Successfully split into ${parts.length} files in ${outputDir}/`);
        return results;
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`Error: File not found: ${filePath}`);
        } else if (error.code === 'EACCES') {
            console.error(`Error: Permission denied: ${filePath}`);
        } else {
            console.error(`Error: ${error.message}`);
        }
        process.exit(1);
    }
}

function showExamples() {
    console.log(`
EXAMPLES:

1. Split a book by chapters (exact match):
   $ mdsplit book.md "## Chapter"
   
   Input:
   --------
   # My Book
   
   ## Chapter 1: Introduction
   Content here...
   
   ## Chapter 2: Main Content
   More content...
   
   ## Chapter Summary  (← Won't match "## Chapter" exactly)
   --------
   
   Output files:
   - book_part_1.md: "## Chapter 1: Introduction\\nContent here..."
   - book_part_2.md: "## Chapter 2: Main Content\\nMore content..."

2. Split by exact line match:
   $ mdsplit document.md "---SPLIT---"
   
   Will only match "---SPLIT---" on its own line, not "---SPLIT--- with text"

3. Use regex for flexible matching:
   $ mdsplit notes.md "^## Chapter \\d+" -r
   
   Matches "## Chapter 1", "## Chapter 2", etc.

4. Disable exact matching for substring search:
   $ mdsplit file.md "Chapter" --no-exact
   
   Will match "Chapter" anywhere, even within words like "Chapters"

5. Include content before first delimiter:
   $ mdsplit notes.md "# " -p
   
   This will include any content that appears before the first "# " as part_1.md
`);
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        outputDir: './output',
        includePrefix: false,
        verbose: false,
        help: false,
        examples: false
    };
    
    const positional = [];
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg === '-h' || arg === '--help') {
            options.help = true;
        } else if (arg === '-e' || arg === '--examples') {
            options.examples = true;
        } else if (arg === '-o' || arg === '--output') {
            options.outputDir = args[++i];
        } else if (arg === '-p' || arg === '--include-prefix') {
            options.includePrefix = true;
        } else if (arg === '-v' || arg === '--verbose') {
            options.verbose = true;
        } else if (!arg.startsWith('-')) {
            positional.push(arg);
        }
    }
    
    return { options, positional };
}

function showHelp() {
    console.log(`
Markdown File Splitter - Split markdown files by delimiter text

USAGE:
  mdsplit <file> <delimiter> [options]

ARGUMENTS:
  file        Path to the markdown file to split
  delimiter   Text to split by (included in each output file)

OPTIONS:
  -o, --output <dir>      Output directory (default: ./output)
  -p, --include-prefix    Include content before first delimiter
  -v, --verbose           Show detailed output
  -e, --examples          Show usage examples
  -h, --help              Show this help message

EXAMPLES:
  mdsplit book.md "## Chapter"
  mdsplit doc.md "---SECTION---" -o ./parts
  mdsplit notes.md "# " -p -v
`);
}

// Main execution
async function main() {
    const { options, positional } = parseArgs();
    
    if (options.help) {
        showHelp();
        process.exit(0);
    }
    
    if (options.examples) {
        showExamples();
        process.exit(0);
    }
    
    if (positional.length < 2) {
        console.error('Error: Missing required arguments\n');
        showHelp();
        process.exit(1);
    }
    
    const [filePath, delimiter] = positional;
    
    await splitMarkdownFile(filePath, delimiter, options);
}

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
}

module.exports = { splitMarkdownFile };