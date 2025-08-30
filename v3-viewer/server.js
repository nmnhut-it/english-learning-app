const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const app = express();
const PORT = process.env.PORT || 3005;

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB-UDl_l6FGu4d1KkRG2QE2ZC2Tlx8w0MY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Markdown files directory
const MARKDOWN_DIR = path.join(__dirname, '../markdown-files');

// Translation helper functions
async function callGeminiAPI(prompt) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

function createTranslationPrompt(text, grade, book, unit, lesson, context, fullFileContent, sourceFile) {
  const timestamp = new Date().toISOString();
  
  return `Hãy phân tích văn bản tiếng Anh và xác định phần bài học, sau đó dịch sang tiếng Việt.

THÔNG TIN BÀI HỌC:
- Sách: ${book || 'N/A'}
- Lớp: ${grade || 'N/A'}
- Unit: ${unit || 'N/A'}
- Bài: ${lesson || 'N/A'}
${context ? `- Ngữ cảnh: ${context}` : ''}

NỘI DUNG TOÀN BỘ FILE (để hiểu ngữ cảnh):
${fullFileContent ? fullFileContent.substring(0, 2000) + '...' : 'Không có'}

VĂN BẢN CẦN DỊCH:
${text}

YÊU CẦU OUTPUT (MARKDOWN FORMAT):
Trả về markdown hoàn chỉnh theo cấu trúc sau:

# [Tên phần bài học]: ${sourceFile ? sourceFile.split('/').pop().replace('.md', '') : 'Translation'}

*Generated: ${timestamp}*

*Detected Section: [getting-started|reading|speaking|listening|writing|language|communication-culture|looking-back|skills|vocabulary|grammar]*

## Original Text

${text}

<details>
<summary>📝 Word-by-Word Analysis</summary>

\`\`\`
1. word1: (part of speech) meaning1 /ipa1/ [root: base_form if different]
2. word2: (part of speech) meaning2 /ipa2/ [root: base_form if different]  
3. word3: (part of speech) meaning3 /ipa3/
... (tất cả từ vựng quan trọng)
\`\`\`

VÍ DỤ FORMAT TỪ VỰNG:
1. districts: (noun) các huyện /ˈdɪstrɪkts/ [root: district]
2. running: (verb) đang chạy /ˈrʌnɪŋ/ [root: run]  
3. beautiful: (adjective) đẹp /ˈbjuːtɪfəl/
4. quickly: (adverb) nhanh chóng /ˈkwɪkli/ [root: quick]

</details>

<details>
<summary>🇻🇳 Vietnamese Translation</summary>

**1.** [Câu dịch 1]

**2.** [Câu dịch 2]

</details>

<details>
<summary>📖 Sentence-by-Sentence Breakdown</summary>

### Sentence 1

**English:** [Câu tiếng Anh]

**Vietnamese:** [Câu dịch tiếng Việt]

**Key Words:**
- **từ1** /phiên-âm/: nghĩa1
- **từ2** /phiên-âm/: nghĩa2

---

### Sentence 2

[Tiếp tục với các câu khác...]

</details>

HƯỚNG DẪN XÁC ĐỊNH PHẦN:
- "getting-started": Đối thoại khởi động, giới thiệu từ vựng
- "reading": Bài đọc hiểu, đoạn văn dài
- "speaking": Hoạt động nói, đối thoại thực hành
- "listening": Bài nghe hiểu, hội thoại
- "writing": Bài viết, luyện tập viết
- "language": Ngữ pháp, từ vựng, phát âm
- "communication-culture": Văn hóa giao tiếp
- "looking-back": Ôn tập, tổng kết
- "skills": Kỹ năng tổng hợp
- "vocabulary": Từ vựng chuyên biệt
- "grammar": Ngữ pháp riêng biệt

LƯU Ý:
1. Phiên âm IPA chuẩn British English
2. Dịch tự nhiên, phù hợp học sinh lớp ${grade}
3. Giữ nguyên tên riêng
4. CHỈ trả về markdown hoàn chỉnh, không thêm text giải thích nào khác
5. Đảm bảo format markdown chính xác, đặc biệt các thẻ details/summary`;
}

function parseTranslationResponse(markdownText) {
  // Extract section information from markdown
  const detectedSection = extractDetectedSection(markdownText);
  const sectionTitle = extractSectionTitle(markdownText, detectedSection);
  
  // Return the markdown directly with minimal metadata
  return {
    detectedSection: detectedSection,
    sectionTitle: sectionTitle,
    markdownContent: markdownText.trim()
  };
}

function extractDetectedSection(markdown) {
  // Extract from "Detected Section: reading" line
  const sectionMatch = markdown.match(/\*Detected Section: ([^*]+)\*/);
  if (sectionMatch) {
    return sectionMatch[1].trim();
  }
  return 'reading'; // default fallback
}

function extractSectionTitle(markdown, section) {
  // Map sections to Vietnamese titles
  const sectionTitles = {
    'getting-started': 'Bắt đầu',
    'reading': 'Đọc hiểu',
    'speaking': 'Nói',
    'listening': 'Nghe hiểu',
    'writing': 'Viết',
    'language': 'Ngôn ngữ',
    'communication-culture': 'Giao tiếp - Văn hóa',
    'looking-back': 'Ôn tập',
    'skills': 'Kỹ năng',
    'vocabulary': 'Từ vựng',
    'grammar': 'Ngữ pháp'
  };
  
  return sectionTitles[section] || 'Dịch thuật';
}

function generateTranslationMarkdown(originalText, parsedData, sourceFile) {
  // Since we now get direct markdown from LLM, just return it
  return parsedData.markdownContent || parsedData;
}

// Helper function to scan directory and build file tree
async function scanDirectory(dirPath, relativePath = '') {
  try {
    const stats = await fs.stat(dirPath);
    const name = path.basename(dirPath);
    
    if (!stats.isDirectory()) {
      throw new Error('Not a directory');
    }

    const node = {
      name: name === 'markdown-files' ? 'Lessons' : name,
      path: relativePath,
      type: 'folder',
      files: [],
      children: []
    };

    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const itemRelativePath = relativePath ? path.join(relativePath, item).replace(/\\/g, '/') : item;
      const itemStats = await fs.stat(itemPath);
      
      if (itemStats.isDirectory()) {
        const childNode = await scanDirectory(itemPath, itemRelativePath);
        node.children.push(childNode);
      } else if (item.endsWith('.md')) {
        // Extract title from markdown file
        try {
          const content = await fs.readFile(itemPath, 'utf-8');
          const { data } = matter(content);
          
          // Get title from frontmatter or first heading
          let title = data.title;
          if (!title) {
            const lines = content.split('\n');
            for (const line of lines) {
              const match = line.match(/^#\s+(.+)$/);
              if (match) {
                title = match[1].trim();
                break;
              }
            }
          }
          
          // Fallback to filename
          if (!title) {
            title = item.replace('.md', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
          
          // Check if translation file exists
          const isTranslation = item.endsWith('.translation.md');
          const hasTranslation = !isTranslation && await fs.access(path.join(path.dirname(itemPath), item.replace('.md', '.translation.md'))).then(() => true).catch(() => false);

          node.files.push({
            name: item,
            path: itemRelativePath,
            title: isTranslation ? `🔤 ${title}` : hasTranslation ? `📄 ${title}` : title,
            isTranslation,
            hasTranslation,
            modified: itemStats.mtime
          });
        } catch (error) {
          console.error(`Error reading file ${itemPath}:`, error);
        }
      }
    }
    
    // Sort children and files
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.files.sort((a, b) => a.name.localeCompare(b.name));
    
    return node;
  } catch (error) {
    console.error('Error scanning directory:', error);
    return { name: 'root', path: '', type: 'folder', files: [], children: [] };
  }
}

// Translation file detection API endpoint
app.get('/api/translation-files/:filepath(*)', async (req, res) => {
  try {
    const filepath = req.params.filepath;
    const fullPath = path.join(MARKDOWN_DIR, filepath);
    const dir = path.dirname(fullPath);
    const basename = path.basename(filepath, '.md');
    
    // Check if this is a translation file
    const isTranslationFile = filepath.endsWith('.translation.md');
    
    if (isTranslationFile) {
      // For translation files, find the original file
      const originalBasename = basename.replace('.translation', '');
      const possibleOriginals = [];
      
      // Look for files with the same base name but without .translation
      try {
        const items = await fs.readdir(dir);
        for (const item of items) {
          if (item.endsWith('.md') && !item.endsWith('.translation.md')) {
            const itemBase = path.basename(item, '.md');
            if (itemBase === originalBasename || item.includes(originalBasename)) {
              const relativePath = path.join(path.dirname(filepath), item).replace(/\\/g, '/');
              possibleOriginals.push({
                file: relativePath,
                title: itemBase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              });
            }
          }
        }
      } catch (error) {
        console.error('Error reading directory for original files:', error);
      }
      
      res.json({
        isTranslationFile: true,
        originalFiles: possibleOriginals,
        translationFiles: []
      });
      
    } else {
      // For original files, find related translation files
      const translationFiles = [];
      
      try {
        const items = await fs.readdir(dir);
        for (const item of items) {
          if (item.endsWith('.translation.md')) {
            const itemBase = path.basename(item, '.translation.md');
            
            // Enhanced matching logic for new filename patterns
            let isMatch = false;
            
            // Direct match: unit-10.md -> unit-10.translation.md
            if (itemBase === basename) {
              isMatch = true;
            }
            // Section match: unit-10.md -> unit-10-reading.translation.md
            else if (itemBase.startsWith(basename + '-')) {
              isMatch = true;
            }
            // Contains match (fallback)
            else if (itemBase.includes(basename)) {
              isMatch = true;
            }
            
            if (isMatch) {
              const itemStats = await fs.stat(path.join(dir, item));
              const relativePath = path.join(path.dirname(filepath), item).replace(/\\/g, '/');
              
              // Extract section from filename if present
              let sectionInfo = '';
              if (itemBase !== basename && itemBase.startsWith(basename + '-')) {
                const sectionPart = itemBase.substring(basename.length + 1);
                sectionInfo = ` (${sectionPart})`;
              }
              
              translationFiles.push({
                file: relativePath,
                title: itemBase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + sectionInfo,
                modified: itemStats.mtime,
                size: itemStats.size,
                section: itemBase !== basename ? itemBase.substring(basename.length + 1) : 'main'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error reading directory for translation files:', error);
      }
      
      // Sort by modification time (newest first)
      translationFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      
      res.json({
        isTranslationFile: false,
        originalFiles: [],
        translationFiles: translationFiles,
        debug: {
          filepath: filepath,
          basename: basename,
          dir: dir,
          itemsFound: translationFiles.length,
          searchPattern: `${basename}.translation.md or ${basename}-*.translation.md`
        }
      });
    }
    
  } catch (error) {
    console.error('Translation files detection error:', error);
    res.status(500).json({ 
      error: 'Failed to detect translation files',
      details: error.message 
    });
  }
});

// Translation API endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceFile, metadata } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!sourceFile) {
      return res.status(400).json({ error: 'Source file is required' });
    }

    // Read full file content for context
    let fullFileContent = '';
    try {
      const fullPath = path.join(MARKDOWN_DIR, sourceFile);
      fullFileContent = await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      console.log('Could not read full file for context');
    }

    // Extract metadata from file path if not provided
    const pathParts = sourceFile.split('/');
    const grade = metadata?.grade || pathParts.find(p => p.startsWith('g') || p.includes('grade')) || 'Unknown';
    const unit = metadata?.unit || pathParts.find(p => p.startsWith('unit-') || p.includes('unit')) || 'Unknown';
    const book = metadata?.book || 'Global Success';
    const lesson = metadata?.lesson || 'Reading';
    const context = metadata?.context || '';

    console.log(`🔄 Translating text from ${sourceFile}...`);

    // Call Gemini API with full file context
    const prompt = createTranslationPrompt(text, grade, book, unit, lesson, context, fullFileContent, sourceFile);
    const geminiResponse = await callGeminiAPI(prompt);
    
    // Parse response (now includes section detection)
    const parsedData = parseTranslationResponse(geminiResponse);
    
    // Generate markdown content
    const markdownContent = generateTranslationMarkdown(text, parsedData, sourceFile);
    
    // Create intelligent filename based on detected section
    const sourceDir = path.dirname(path.join(MARKDOWN_DIR, sourceFile));
    const sourceBasename = path.basename(sourceFile, '.md');
    const detectedSection = parsedData.detectedSection || 'reading';
    
    // Generate filename: preserve original name, add section only if multiple sections exist
    let translationFilename;
    
    // Check if a translation file with just .translation.md already exists
    const basicTranslationFile = path.join(sourceDir, `${sourceBasename}.translation.md`);
    let hasBasicTranslation = false;
    
    try {
      await fs.access(basicTranslationFile);
      hasBasicTranslation = true;
    } catch (error) {
      // File doesn't exist, which is fine
    }
    
    // If basic translation exists or if this is not the first section, add section suffix
    if (hasBasicTranslation) {
      translationFilename = `${sourceBasename}-${detectedSection}.translation.md`;
    } else {
      translationFilename = `${sourceBasename}.translation.md`;
    }
    
    const translationFile = path.join(sourceDir, translationFilename);
    
    // Handle accumulation if file exists
    let finalContent = markdownContent;
    try {
      const existingContent = await fs.readFile(translationFile, 'utf-8');
      // If file exists, append new translation with separator
      const separator = '\n\n---\n\n';
      const timestamp = new Date().toLocaleString();
      const sectionHeader = `## Additional Translation - ${timestamp}\n\n`;
      
      // Remove the main header from new content to avoid duplication
      const contentWithoutMainHeader = markdownContent.split('\n').slice(4).join('\n');
      finalContent = existingContent + separator + sectionHeader + contentWithoutMainHeader;
      
      console.log(`📄 Appending to existing translation file`);
    } catch (error) {
      // File doesn't exist, use original content
      console.log(`📄 Creating new translation file`);
    }
    
    await fs.writeFile(translationFile, finalContent, 'utf-8');
    
    const translationPath = path.relative(MARKDOWN_DIR, translationFile).replace(/\\/g, '/');
    
    console.log(`✅ Translation saved to: ${translationPath}`);
    
    res.json({ 
      success: true,
      translationFile: translationPath,
      detectedSection: parsedData.detectedSection,
      sectionTitle: parsedData.sectionTitle,
      message: `Translation saved as ${path.basename(translationFile)}`,
      debug: {
        sourceFile: sourceFile,
        sourceBasename: sourceBasename,
        detectedSection: detectedSection,
        translationFilename: translationFilename,
        hasBasicTranslation: hasBasicTranslation,
        fullTranslationPath: translationPath
      }
    });

  } catch (error) {
    console.error('Translation API error:', error);
    res.status(500).json({ 
      error: 'Translation failed',
      details: error.message 
    });
  }
});

// Routes
app.get('/', async (req, res) => {
  try {
    const fileTree = await scanDirectory(MARKDOWN_DIR);
    res.render('index', { fileTree });
  } catch (error) {
    console.error('Error loading file tree:', error);
    res.status(500).send('Error loading file tree');
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const fileTree = await scanDirectory(MARKDOWN_DIR);
    res.json(fileTree);
  } catch (error) {
    console.error('Error loading file tree:', error);
    res.status(500).json({ error: 'Error loading file tree' });
  }
});

app.get('/view/:filepath(*)', async (req, res) => {
  try {
    const filepath = req.params.filepath;
    const fullPath = path.join(MARKDOWN_DIR, filepath);
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).send('File not found');
    }
    
    const content = await fs.readFile(fullPath, 'utf-8');
    const { content: markdownContent, data } = matter(content);
    
    // Render markdown to HTML
    const htmlContent = marked(markdownContent);
    
    const title = data.title || 
                  markdownContent.split('\n').find(line => line.match(/^#\s+(.+)$/))?.replace(/^#\s+/, '') ||
                  path.basename(filepath, '.md').replace(/_/g, ' ');
    
    res.render('viewer', {
      title,
      filepath,
      rawContent: markdownContent,
      htmlContent,
      frontmatter: data
    });
  } catch (error) {
    console.error('Error loading file:', error);
    res.status(500).send('Error loading file');
  }
});

app.get('/raw/:filepath(*)', async (req, res) => {
  try {
    const filepath = req.params.filepath;
    const fullPath = path.join(MARKDOWN_DIR, filepath);
    
    const content = await fs.readFile(fullPath, 'utf-8');
    const { content: markdownContent } = matter(content);
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(markdownContent);
  } catch (error) {
    console.error('Error loading raw file:', error);
    res.status(500).send('Error loading file');
  }
});

// API endpoint for updating file access history
app.post('/api/history', (req, res) => {
  // This will be handled client-side with localStorage
  // But we can log server-side if needed
  const { filepath, timestamp } = req.body;
  console.log(`File accessed: ${filepath} at ${new Date(timestamp)}`);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`V3 Markdown Viewer running on http://localhost:${PORT}`);
  console.log(`Looking for markdown files in: ${MARKDOWN_DIR}`);
});