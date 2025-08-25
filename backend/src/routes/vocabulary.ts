import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const router = express.Router();

// Gemini API configuration
// Using gemini-1.5-flash for better rate limits (2000 RPM vs 1000 RPM for Pro)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Process vocabulary with context
router.post('/process', async (req, res) => {
    try {
        const { words, apiKey, grade, unit, lesson, book, context, customFileName } = req.body;

        // Validate inputs
        if (!words || !apiKey || !grade || !unit || !lesson) {
            return res.status(400).json({ 
                error: 'Missing required fields: words, apiKey, grade, unit, lesson' 
            });
        }

        // Validate custom filename if provided
        if (customFileName && (typeof customFileName !== 'string' || customFileName.trim().length === 0)) {
            return res.status(400).json({ 
                error: 'Invalid custom filename' 
            });
        }

        // Build prompt with optional context
        let prompt = `Hãy trả về kết quả HOÀN TOÀN BẰNG MARKDOWN với format sau:

# Từ vựng

`;
        
        if (context) {
            prompt += `## ${context}\n\n`;
        }
        
        prompt += `[Với mỗi từ/cụm từ, format CHÍNH XÁC như sau:]

**[từ/cụm từ]**: (loại từ) nghĩa tiếng Việt /phiên âm IPA/

[Hoặc với động từ bất quy tắc:]

**[V1 - V2 - V3]**: (v) nghĩa tiếng Việt /phiên âm V1 - phiên âm V2 - phiên âm V3/

---

YÊU CẦU BẮT BUỘC:
- Output PHẢI là Markdown thuần túy
- Sử dụng ** ** cho từ/cụm từ chính
- Sử dụng / / cho phiên âm IPA
- Phiên âm IPA chuẩn British English
- Loại từ: (n) danh từ, (v) động từ, (adj) tính từ, (adv) trạng từ, (prep) giới từ, (conj) liên từ, (interj) thán từ
- Cụm từ không cần ghi loại từ
- Động từ bất quy tắc phải ghi đủ 3 dạng
- KHÔNG thêm ví dụ
- KHÔNG thêm ghi chú

Các từ/cụm từ cần xử lý:\n`;

        prompt += words;

        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

        // Call Gemini API
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 1,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "text/plain"
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_NONE"
                    }
                ]
            }
        );

        if (!response.data.candidates || !response.data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response from Gemini API');
        }

        const processedVocabulary = response.data.candidates[0].content.parts[0].text;

        // Parse vocabulary for JSON
        const vocabularyItems: any[] = [];
        const lines = processedVocabulary.split('\n');
        
        for (const line of lines) {
            // Match regular vocabulary: **word**: (type) meaning /pronunciation/
            const regularMatch = line.match(/\*\*(.+?)\*\*:\s*\((.+?)\)\s*(.+?)\s*\/(.+?)\//);
            if (regularMatch) {
                vocabularyItems.push({
                    word: regularMatch[1].trim(),
                    type: regularMatch[2].trim(),
                    meaning: regularMatch[3].trim(),
                    pronunciation: regularMatch[4].trim(),
                    irregular: false
                });
                continue;
            }
            
            // Match irregular verbs: **V1 - V2 - V3**: (v) meaning /p1 - p2 - p3/
            const irregularMatch = line.match(/\*\*(.+?)\s*-\s*(.+?)\s*-\s*(.+?)\*\*:\s*\(v\)\s*(.+?)\s*\/(.+?)\//);
            if (irregularMatch) {
                const pronunciations = irregularMatch[5].split('-').map((p: string) => p.trim());
                vocabularyItems.push({
                    word: irregularMatch[1].trim(),
                    v2: irregularMatch[2].trim(),
                    v3: irregularMatch[3].trim(),
                    type: 'v',
                    meaning: irregularMatch[4].trim(),
                    pronunciation: pronunciations[0] || '',
                    pronunciationV2: pronunciations[1] || '',
                    pronunciationV3: pronunciations[2] || '',
                    irregular: true
                });
            }
        }

        // Create file paths
        const bookFolder = book || 'global-success';
        const gradeFolder = `${bookFolder}-${grade}`;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        
        // Use custom filename if provided, otherwise auto-generate
        let fileName: string;
        if (customFileName && customFileName.trim().length > 0) {
            // Sanitize custom filename
            const sanitized = customFileName
                .trim()
                .replace(/[^a-zA-Z0-9\-_]/g, '-')
                .replace(/--+/g, '-')
                .replace(/^-|-$/g, '')
                .toLowerCase();
            
            if (sanitized.length === 0) {
                return res.status(400).json({ 
                    error: 'Invalid custom filename - only letters, numbers, hyphens and underscores are allowed' 
                });
            }
            
            fileName = `${sanitized}-${timestamp}`;
        } else {
            fileName = `unit-${unit.padStart(2, '0')}-${lesson}-vocab-${timestamp}`;
        }
        
        const folderPath = path.join(__dirname, '../../../markdown-files', gradeFolder, 'vocabulary');
        const markdownPath = path.join(folderPath, `${fileName}.md`);
        // Ensure directory exists
        await fs.mkdir(folderPath, { recursive: true });

        // Save markdown file
        await fs.writeFile(markdownPath, processedVocabulary, 'utf8');

        // Return response
        res.json({
            success: true,
            vocabulary: processedVocabulary,
            markdownPath: path.relative(path.join(__dirname, '../../..'), markdownPath),
            fileName: fileName,
            vocabularyCount: vocabularyItems.length
        });

    } catch (error: any) {
        console.error('Error processing vocabulary:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to process vocabulary' 
        });
    }
});

// Format copied data from websites
router.post('/format-data', async (req, res) => {
    try {
        const { content, apiKey, source, sourceUrl } = req.body;

        if (!content || !apiKey) {
            return res.status(400).json({ 
                error: 'Missing required fields: content, apiKey' 
            });
        }

        // Read file format definitions
        const formatDefinitionsPath = path.join(__dirname, '../../file-format.md');
        const formatDefinitions = await fs.readFile(formatDefinitionsPath, 'utf8');

        // Build prompt for Gemini to detect and format data
        const prompt = `You are a teacher preparing lesson materials following the Global Success textbook structure in G7 format. Extract and format the ACTUAL CONTENT from the provided text.

IMPORTANT: Focus on extracting dialogue, exercises, vocabulary, and lesson content - NOT navigation or page structure.

DETECT GRADE LEVEL:
- Grades 6-9 (THCS): Uses "A Closer Look 1/2", "Skills 1/2" structure
- Grades 10-12 (THPT): Uses separate "Language", "Reading", "Speaking", "Listening", "Writing" sections

GLOBAL SUCCESS UNIT STRUCTURE:

FOR THCS (Grades 6-9):
1. Getting Started (dialogue and initial activities)
2. A Closer Look 1 (vocabulary & pronunciation)
3. A Closer Look 2 (grammar)
4. Communication
5. Skills 1 (reading & speaking)
6. Skills 2 (listening & writing)
7. Looking Back & Project

FOR THPT (Grades 10-12):
1. Getting Started
2. Language (grammar, vocabulary, pronunciation)
3. Reading
4. Speaking
5. Listening
6. Writing
7. Communication and Culture / CLIL
8. Looking Back
9. Project

G7 FORMAT REQUIREMENTS:

**UNIT [NUMBER]: [UNIT NAME]**

**[SECTION NAME]** (e.g., GETTING STARTED, A CLOSER LOOK 1, etc.)

For vocabulary sections:
1. word : (type) meaning /pronunciation/
2. phrase : (type) meaning /pronunciation/
(Note the spaces around the colon)

For dialogue (especially in Getting Started):
[Character]: [English dialogue]
[Character]: [English dialogue]

[Vietnamese translation of the full dialogue]

For exercises:
**Bài [number] trang [page]**
[Exercise instruction in Vietnamese if available]
1. [Question/item]
2. [Question/item]

Answer key (if provided):
1. [answer]
2. [answer]

For grammar sections (A Closer Look 2):
- Present the grammar rule/structure
- Examples with translations
- Practice exercises

EXTRACTION INSTRUCTIONS:
1. IGNORE: navigation menus, sidebar links, breadcrumbs, advertisements
2. EXTRACT in order:
   - Section name (Getting Started, A Closer Look 1, etc.)
   - Main dialogue between characters with full conversation
   - Vocabulary lists with pronunciations and meanings
   - All exercises (Bài 1, 2, 3...) with instructions and answers
   - Grammar explanations and examples
   - Tables or categorized content

3. For loigiaihay.com specifically:
   - Detect grade level from URL or content (e.g., "tieng-anh-10" = Grade 10)
   - Use appropriate structure (THCS for 6-9, THPT for 10-12)
   - Extract the complete dialogue (not just fragments)
   - Get all vocabulary with IPA pronunciations
   - Include exercise instructions and complete answers
   - Preserve True/False answers, multiple choice options
   - Keep any tables or organized content structures

4. Grade-specific formatting:
   - For THCS: Keep "A Closer Look 1/2" and "Skills 1/2" naming
   - For THPT: Use individual skill names (Reading, Speaking, etc.)
   - Adapt section headers based on detected grade level

Return JSON with:
{
  "detectedType": "study_unit",
  "markdownContent": "[extracted and formatted content following appropriate Global Success structure]",
  "isNewType": false
}

CONTENT TO FORMAT:
${content}

SOURCE: ${source || 'Unknown'}
SOURCE URL: ${sourceUrl || 'Not provided'}`;

        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay

        // Call Gemini API
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 1,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json"
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_NONE"
                    }
                ]
            }
        );

        if (!response.data.candidates || !response.data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response from Gemini API');
        }

        let formattedData;
        try {
            const parsedResponse = JSON.parse(response.data.candidates[0].content.parts[0].text);
            
            // Handle if response is an array
            if (Array.isArray(parsedResponse)) {
                formattedData = parsedResponse[0];
            } else {
                formattedData = parsedResponse;
            }
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', response.data.candidates[0].content.parts[0].text);
            throw new Error('Failed to parse Gemini response as JSON');
        }

        // Validate required fields
        if (!formattedData || !formattedData.markdownContent) {
            console.error('Missing markdownContent in response:', formattedData);
            throw new Error('Gemini response missing required markdownContent field');
        }
        
        // If new type is detected, update file-format.md
        if (formattedData.isNewType && formattedData.newTypeDefinition) {
            const newTypeDef = formattedData.newTypeDefinition;
            
            // Create the new type section
            const newTypeSection = `

## ${newTypeDef.typeName.split('_').map((word: string) => 
    word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Format

${newTypeDef.description ? `**Description**: ${newTypeDef.description}\n` : ''}
### Markdown Structure
\`\`\`markdown
${newTypeDef.markdownStructure}
\`\`\`
`;
            
            // Read current file-format.md
            let currentFormatDef = await fs.readFile(formatDefinitionsPath, 'utf8');
            
            // Find the position to insert (before Type Detection Rules)
            const insertPosition = currentFormatDef.indexOf('## Type Detection Rules');
            
            if (insertPosition !== -1) {
                // Insert new type definition
                currentFormatDef = 
                    currentFormatDef.slice(0, insertPosition) + 
                    newTypeSection + '\n' +
                    currentFormatDef.slice(insertPosition);
                
                // Update type detection rules
                const rulesEnd = currentFormatDef.indexOf('## File Naming Convention');
                if (rulesEnd !== -1) {
                    const rulesSection = currentFormatDef.slice(insertPosition, rulesEnd);
                    const updatedRules = rulesSection.replace(
                        '- Contains mixed elements → mixed_content',
                        `- Contains mixed elements → mixed_content\n- ${newTypeDef.description} → ${newTypeDef.typeName}`
                    );
                    
                    currentFormatDef = 
                        currentFormatDef.slice(0, insertPosition) + 
                        updatedRules + 
                        currentFormatDef.slice(rulesEnd);
                }
                
                // Write updated file-format.md
                await fs.writeFile(formatDefinitionsPath, currentFormatDef, 'utf8');
                
                console.log(`Added new type definition: ${newTypeDef.typeName}`);
            }
        }
        
        // Generate file paths based on detected type
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timestamp = date.getTime();
        const fileName = `${formattedData.detectedType}-${timestamp}`;
        
        const folderPath = path.join(__dirname, '../../../markdown-files/formatted-data', dateStr);
        const markdownPath = path.join(folderPath, `${fileName}.md`);

        // Ensure directory exists
        await fs.mkdir(folderPath, { recursive: true });

        // Save markdown file only
        if (!formattedData.markdownContent) {
            console.error('formattedData structure:', JSON.stringify(formattedData, null, 2));
            throw new Error('markdownContent is undefined in formattedData');
        }
        await fs.writeFile(markdownPath, formattedData.markdownContent, 'utf8');

        res.json({
            success: true,
            detectedType: formattedData.detectedType,
            markdownPath: path.relative(path.join(__dirname, '../../..'), markdownPath),
            preview: formattedData.markdownContent.substring(0, 500) + '...'
        });

    } catch (error: any) {
        console.error('Error formatting data:', error);
        
        // Handle rate limit errors
        if (error.response?.status === 429) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded. Please wait a moment and try again.',
                retryAfter: 60 // seconds
            });
        }
        
        res.status(500).json({ 
            error: error.message || 'Failed to format data' 
        });
    }
});

// Save quiz vocabulary
router.post('/save-quiz', async (req, res) => {
    try {
        const { vocabulary, source, fileName } = req.body;

        if (!vocabulary || !Array.isArray(vocabulary) || vocabulary.length === 0) {
            return res.status(400).json({ 
                error: 'Invalid vocabulary data' 
            });
        }

        if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Filename is required' 
            });
        }

        // Sanitize filename
        function sanitizeFileName(name: string): string {
            return name
                .trim()
                .replace(/[^a-zA-Z0-9\-_]/g, '-')
                .replace(/--+/g, '-')
                .replace(/^-|-$/g, '')
                .toLowerCase();
        }

        const sanitizedFileName = sanitizeFileName(fileName);
        if (sanitizedFileName.length === 0) {
            return res.status(400).json({ 
                error: 'Invalid filename - only letters, numbers, hyphens and underscores are allowed' 
            });
        }

        // Generate filename with date and user input
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0];
        const timestamp = date.getTime();
        const finalFileName = `${sanitizedFileName}-${dateStr}-${timestamp}`;
        
        // Create folder path
        const folderPath = path.join(__dirname, '../../../markdown-files/vocabquiz', dateStr);
        
        // Ensure directory exists
        await fs.mkdir(folderPath, { recursive: true });
        
        // Create markdown content
        let markdownContent = `# Vocabulary Quiz - ${dateStr}\n\n`;
        markdownContent += `Source: ${source || 'Manual Input'}\n\n`;
        markdownContent += `Total Words: ${vocabulary.length}\n\n`;
        markdownContent += `---\n\n`;
        
        vocabulary.forEach((item, index) => {
            markdownContent += `## ${index + 1}. ${item.word}\n\n`;
            if (item.ipa) {
                markdownContent += `**IPA**: ${item.ipa}\n\n`;
            }
            markdownContent += `**Meaning**: ${item.meaning}\n\n`;
            markdownContent += `---\n\n`;
        });
        
        // Save markdown file
        const markdownPath = path.join(folderPath, `${finalFileName}.md`);
        await fs.writeFile(markdownPath, markdownContent, 'utf8');
        
        res.json({
            success: true,
            markdownPath: path.relative(path.join(__dirname, '../../..'), markdownPath),
            fileName: finalFileName,
            message: `Vocabulary saved as '${finalFileName}.md': ${vocabulary.length} words`
        });
        
    } catch (error: any) {
        console.error('Error saving quiz vocabulary:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to save vocabulary' 
        });
    }
});

// List formatted data files
router.get('/list-formatted-data', async (req, res) => {
    try {
        const baseDir = path.join(__dirname, '../../../markdown-files/formatted-data');
        const files = [];

        // Check if directory exists
        try {
            await fs.access(baseDir);
        } catch {
            // Directory doesn't exist yet
            return res.json({ success: true, files: [] });
        }

        // Read all date directories
        const dateDirs = await fs.readdir(baseDir);
        
        for (const dateDir of dateDirs) {
            const datePath = path.join(baseDir, dateDir);
            const stat = await fs.stat(datePath);
            
            if (stat.isDirectory()) {
                // Read markdown files in date directory
                const dirFiles = await fs.readdir(datePath);
                const mdFiles = dirFiles.filter(f => f.endsWith('.md'));
                
                for (const file of mdFiles) {
                    // Extract type from filename
                    const match = file.match(/^(.+?)-(\d+)\.md$/);
                    if (match) {
                        // Read the file to get metadata
                        const filePath = path.join(datePath, file);
                        const content = await fs.readFile(filePath, 'utf8');
                        const typeMatch = content.match(/\*\*Type\*\*:\s*(.+)/i);
                        
                        files.push({
                            name: file.replace('.md', ''),
                            path: path.join('formatted-data', dateDir, file),
                            date: dateDir,
                            type: typeMatch ? typeMatch[1].trim() : match[1],
                            timestamp: parseInt(match[2])
                        });
                    }
                }
            }
        }

        // Sort by timestamp descending
        files.sort((a, b) => b.timestamp - a.timestamp);

        res.json({ success: true, files });
    } catch (error: any) {
        console.error('Error listing formatted data:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to list formatted data' 
        });
    }
});

// Get specific formatted data file
router.post('/get-formatted-data', async (req, res) => {
    try {
        const { filePath } = req.body;

        if (!filePath) {
            return res.status(400).json({ 
                error: 'Missing required field: filePath' 
            });
        }

        // Security: ensure path is within formatted-data directory
        if (!filePath.startsWith('formatted-data/') || filePath.includes('..')) {
            return res.status(400).json({ 
                error: 'Invalid file path' 
            });
        }

        const fullPath = path.join(__dirname, '../../../markdown-files', filePath);
        const markdownContent = await fs.readFile(fullPath, 'utf8');

        res.json({ 
            success: true, 
            content: markdownContent 
        });
    } catch (error: any) {
        console.error('Error reading formatted data:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to read formatted data' 
        });
    }
});

export default router;
