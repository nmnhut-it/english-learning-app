const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const crypto = require('crypto');

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

// Translation cache directory 
const CACHE_DIR = path.join(__dirname, 'data', 'translation-cache');

// File-Based Translation Cache Management
async function ensureCacheDirectory() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create cache directory:', error);
  }
}

function getFileCachePath(sourceFile) {
  // Convert file path to cache filename: g11/unit-10.md → g11_unit-10.json
  const cacheFilename = sourceFile.replace(/[\/\\]/g, '_').replace('.md', '.json');
  return path.join(CACHE_DIR, cacheFilename);
}

async function loadFileCache(sourceFile) {
  try {
    await ensureCacheDirectory();
    const cacheFilePath = getFileCachePath(sourceFile);
    const cacheData = await fs.readFile(cacheFilePath, 'utf-8');
    return JSON.parse(cacheData);
  } catch (error) {
    // Cache file doesn't exist, return empty cache for this file
    return { sentences: {}, metadata: { createdAt: new Date().toISOString() } };
  }
}

async function saveFileCache(sourceFile, cache) {
  try {
    await ensureCacheDirectory();
    const cacheFilePath = getFileCachePath(sourceFile);
    cache.metadata.updatedAt = new Date().toISOString();
    await fs.writeFile(cacheFilePath, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save file cache:', error);
  }
}

function hashSentence(sentence) {
  // Create consistent hash for sentence (normalized)
  const normalized = sentence.trim().toLowerCase().replace(/\s+/g, ' ');
  return crypto.createHash('md5').update(normalized).digest('hex');
}

async function getCachedTranslation(sentence, sourceFile) {
  const fileCache = await loadFileCache(sourceFile);
  const hash = hashSentence(sentence);
  
  if (fileCache.sentences[hash]) {
    // Update usage count
    fileCache.sentences[hash].metadata.usageCount = (fileCache.sentences[hash].metadata.usageCount || 0) + 1;
    fileCache.sentences[hash].metadata.lastUsed = new Date().toISOString();
    await saveFileCache(sourceFile, fileCache);
    
    console.log(`📋 Cache hit in ${sourceFile}: "${sentence.substring(0, 30)}..." (used ${fileCache.sentences[hash].metadata.usageCount} times)`);
    return fileCache.sentences[hash];
  }
  
  return null;
}

async function cacheTranslation(sentence, translationData, sourceFile) {
  const fileCache = await loadFileCache(sourceFile);
  const hash = hashSentence(sentence);
  
  fileCache.sentences[hash] = {
    ...translationData,
    metadata: {
      sourceFile: sourceFile,
      timestamp: new Date().toISOString(),
      usageCount: 1,
      lastUsed: new Date().toISOString()
    }
  };
  
  await saveFileCache(sourceFile, fileCache);
  console.log(`💾 Cached translation in ${sourceFile}: "${sentence.substring(0, 30)}..."`);
}

async function getCacheStats() {
  try {
    await ensureCacheDirectory();
    const cacheFiles = await fs.readdir(CACHE_DIR);
    
    let totalSentences = 0;
    let totalUsage = 0;
    let totalFiles = 0;
    
    for (const cacheFileName of cacheFiles) {
      if (cacheFileName.endsWith('.json')) {
        try {
          const cacheFilePath = path.join(CACHE_DIR, cacheFileName);
          const fileCache = JSON.parse(await fs.readFile(cacheFilePath, 'utf-8'));
          
          const sentences = Object.values(fileCache.sentences || {});
          totalSentences += sentences.length;
          totalUsage += sentences.reduce((sum, entry) => sum + (entry.metadata.usageCount || 0), 0);
          totalFiles++;
        } catch (error) {
          console.error(`Error reading cache file ${cacheFileName}:`, error);
        }
      }
    }
    
    return {
      totalFiles: totalFiles,
      totalSentences: totalSentences,
      totalUsage: totalUsage,
      averageSentencesPerFile: totalFiles > 0 ? Math.round(totalSentences / totalFiles) : 0
    };
  } catch (error) {
    return { totalFiles: 0, totalSentences: 0, totalUsage: 0, averageSentencesPerFile: 0 };
  }
}

// Mobile device detection helper
function isMobileDevice(userAgent) {
  if (!userAgent) return false;
  
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  return mobileRegex.test(userAgent);
}

// Mobile detection middleware
function detectMobile(req, res, next) {
  req.isMobile = isMobileDevice(req.headers['user-agent']);
  req.forceDesktop = req.query.desktop === '1';
  req.forceMobile = req.query.mobile === '1';
  next();
}

// Enhanced translation prompt for auto-detection of lesson content
function createAutoTranslationPrompt(content, sourceFile, metadata) {
  const timestamp = new Date().toISOString();
  const fileName = sourceFile.split('/').pop().replace('.md', '');
  
  return `Bạn là một chuyên gia dạy tiếng Anh. Hãy phân tích toàn bộ nội dung bài học và tự động phát hiện các phần cần dịch sang tiếng Việt.

THÔNG TIN BÀI HỌC:
- File: ${sourceFile}
- Tên bài: ${fileName}
${metadata?.context ? `- Ngữ cảnh: ${metadata.context}` : ''}

NỘI DUNG BÀI HỌC HOÀN CHỈNH:
${content}

YÊU CẦU PHÂN TÍCH VÀ DỊCH TỰ ĐỘNG:

1. **Tự động phát hiện** các phần quan trọng cần dịch:
   - Đối thoại và hội thoại (Dialogues)
   - Đoạn văn đọc hiểu (Reading passages) 
   - Hướng dẫn bài tập (Exercise instructions)
   - Định nghĩa từ vựng (Vocabulary definitions)
   - Giải thích ngữ pháp (Grammar explanations)
   - Câu hỏi và đáp án (Questions and answers)

2. **Bỏ qua** các phần không cần dịch:
   - Tiêu đề metadata (headers, navigation)
   - Số thứ tự bài tập đơn thuần
   - Tên riêng và địa danh
   - Mã số bài tập

3. **Định dạng output** theo markdown với cấu trúc GIỐNG HỆT PC VERSION:

# Đọc hiểu: ${fileName}

*Generated: ${timestamp}*

*Detected Section: auto-complete*

## Original Text

[Tất cả nội dung tiếng Anh đã phát hiện cần dịch]

<details>
<summary>📝 Word-by-Word Analysis</summary>

\`\`\`
1. word1: (part of speech) meaning1 /ipa1/ [root: base_form if needed]
2. word2: (part of speech) meaning2 /ipa2/ [root: base_form if needed]
3. word3: (part of speech) meaning3 /ipa3/
\`\`\`

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

**Word-by-Word Breakdown:**
1. **từ1:** (part of speech) nghĩa1 /phiên-âm/ [root: base_form if needed]
2. **từ2:** (part of speech) nghĩa2 /phiên-âm/ [root: base_form if needed]

**Phrase Analysis:**
1. **cụm từ1:** nghĩa của cụm từ1
2. **cụm từ2:** nghĩa của cụm từ2

**Progressive Translation:**
1. **từ1:** dịch từ1
2. **từ1 từ2:** dịch từ1 từ2
3. **Full sentence:** câu dịch hoàn chỉnh

**Phân tích ngữ pháp:**
[Phân tích chi tiết cấu trúc ngữ pháp bằng tiếng Việt]

---

### Sentence 2
[Tiếp tục cùng format...]

</details>

HƯỚNG DẪN CHI TIẾT:

1. **Phát hiện thông minh**: Tự động nhận biết loại nội dung (đối thoại, đọc hiểu, bài tập...)
2. **Dịch có ngữ cảnh**: Dịch phù hợp với trình độ học sinh
3. **Giữ cấu trúc**: Duy trì tổ chức logic của bài học
4. **Từ vựng IPA**: Phiên âm chuẩn British English
5. **Ngữ pháp**: Giải thích các điểm ngữ pháp quan trọng
6. **Định dạng markdown**: Chính xác với details/summary

CHỈ trả về markdown hoàn chỉnh, không thêm text giải thích nào khác.`;
}

// Helper function to flatten file tree for mobile view
function flattenFileTree(node, files = [], currentPath = []) {
  if (node.files) {
    node.files.forEach(file => {
      files.push({
        ...file,
        grade: currentPath[0] || 'Unknown',
        folder: currentPath.join(' / '),
        fullPath: currentPath.length > 0 ? currentPath.join('/') + '/' + file.path : file.path
      });
    });
  }
  
  if (node.children) {
    node.children.forEach(child => {
      const newPath = currentPath.concat([child.name]);
      flattenFileTree(child, files, newPath);
    });
  }
  
  return files;
}

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

**Word-by-Word Breakdown:**
1. **từ1:** (part of speech) nghĩa1 /phiên-âm/ [root: base_form if needed]
2. **từ2:** (part of speech) nghĩa2 /phiên-âm/ [root: base_form if needed]
3. **từ3:** (part of speech) nghĩa3 /phiên-âm/ [root: base_form if needed]

**Phrase Analysis:**
1. **cụm từ1:** nghĩa của cụm từ1
2. **cụm từ2:** nghĩa của cụm từ2  
3. **cụm từ3:** nghĩa của cụm từ3

**Progressive Translation:**
1. **từ1:** dịch từ1
2. **từ1 từ2:** dịch từ1 từ2
3. **từ1 từ2 từ3:** dịch từ1 từ2 từ3
4. **Full sentence:** câu dịch hoàn chỉnh

**Phân tích ngữ pháp:**
Phân tích chi tiết cấu trúc ngữ pháp của câu bằng tiếng Việt, bao gồm nhưng không giới hạn:
- Chủ ngữ, vị ngữ, tân ngữ
- Mệnh đề quan hệ, mệnh đề phụ
- Tính từ bổ nghĩa cho danh từ nào
- Trạng từ bổ nghĩa cho động từ nào  
- Thì của động từ, cấu trúc đặc biệt
- Bất kỳ điểm ngữ pháp quan trọng nào khác

---

### Sentence 2

**English:** [Next English sentence]

**Vietnamese:** [Next Vietnamese translation]

[Continue same detailed pattern...]

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

// Auto-translation API endpoint for full lesson content
app.post('/api/translate-auto', async (req, res) => {
  try {
    const { sourceFile, metadata } = req.body;
    
    if (!sourceFile) {
      return res.status(400).json({ error: 'Source file is required' });
    }

    // Read the entire file content
    let fileContent = '';
    try {
      const fullPath = path.join(MARKDOWN_DIR, sourceFile);
      const rawContent = await fs.readFile(fullPath, 'utf-8');
      const { content } = matter(rawContent);
      fileContent = content;
    } catch (error) {
      return res.status(400).json({ error: 'Could not read source file' });
    }

    if (!fileContent.trim()) {
      return res.status(400).json({ error: 'Source file is empty' });
    }

    console.log(`🤖 Auto-translating entire lesson: ${sourceFile}`);

    // Call Gemini API with auto-detection prompt
    const prompt = createAutoTranslationPrompt(fileContent, sourceFile, metadata);
    const geminiResponse = await callGeminiAPI(prompt);
    
    // Parse response - should be direct markdown
    const parsedData = {
      detectedSection: 'auto-complete',
      sectionTitle: 'Bản dịch tự động',
      markdownContent: geminiResponse.trim()
    };
    
    // For mobile, don't save to file - just return the translation content
    const markdownContent = generateTranslationMarkdown('', parsedData, sourceFile);
    
    console.log(`✅ Auto-translation completed for mobile: ${sourceFile}`);
    
    res.json({ 
      success: true,
      translationContent: markdownContent,
      detectedSection: parsedData.detectedSection,
      sectionTitle: parsedData.sectionTitle,
      message: `Auto-translation completed`,
      isMobileResponse: true,
      debug: {
        sourceFile: sourceFile,
        contentLength: fileContent.length,
        responseLength: markdownContent.length
      }
    });

  } catch (error) {
    console.error('Auto-translation API error:', error);
    res.status(500).json({ 
      error: 'Auto-translation failed',
      details: error.message 
    });
  }
});

// Single sentence translation API endpoint for mobile with caching
app.post('/api/translate-sentence', async (req, res) => {
  try {
    const { sentence, sourceFile, metadata } = req.body;
    
    if (!sentence || !sentence.trim()) {
      return res.status(400).json({ error: 'Sentence is required' });
    }

    const trimmedSentence = sentence.trim();
    console.log(`🔤 Processing sentence: "${trimmedSentence.substring(0, 50)}..."`);

    // Check file-specific cache first
    const cachedResult = await getCachedTranslation(trimmedSentence, sourceFile);
    if (cachedResult) {
      console.log(`⚡ Returning cached translation from ${sourceFile} (used ${cachedResult.metadata.usageCount} times)`);
      return res.json({ 
        success: true,
        ...cachedResult,
        isMobileResponse: true,
        fromCache: true,
        debug: {
          sourceFile: sourceFile,
          sentenceLength: trimmedSentence.length,
          cacheHit: true,
          usageCount: cachedResult.metadata.usageCount,
          cacheFile: getFileCachePath(sourceFile)
        }
      });
    }

    // Cache miss - call Gemini API
    console.log(`🤖 Cache miss - calling Gemini API`);

    const prompt = `Hãy phân tích chi tiết câu tiếng Anh này và dịch sang tiếng Việt với đầy đủ breakdown.

CÂU CẦN PHÂN TÍCH:
${trimmedSentence}

YÊU CẦU PHÂN TÍCH CHI TIẾT:
1. Phân tích từng từ với từ loại, nghĩa, và phiên âm IPA
2. Nhận diện các cụm từ và nghĩa
3. Dịch dần theo từng bước để hiểu cách ghép nghĩa
4. Phân tích ngữ pháp chi tiết bằng tiếng Việt

ĐỊNH DẠNG OUTPUT (JSON):
{
  "sentence": "${trimmedSentence}",
  "translation": "Câu dịch hoàn chỉnh",
  "words": [
    {"word": "từ1", "pos": "noun", "meaning": "nghĩa1", "ipa": "/phiên-âm/", "root": "base_form nếu khác"},
    {"word": "từ2", "pos": "verb", "meaning": "nghĩa2", "ipa": "/phiên-âm/"}
  ],
  "phrases": [
    {"phrase": "cụm từ 1", "meaning": "nghĩa cụm từ"},
    {"phrase": "cụm từ 2", "meaning": "nghĩa cụm từ"}
  ],
  "progressive": [
    {"english": "từ1", "vietnamese": "dịch từ1"},
    {"english": "từ1 từ2", "vietnamese": "dịch từ1 từ2"},
    {"english": "full sentence", "vietnamese": "câu dịch hoàn chỉnh"}
  ],
  "grammar": "Phân tích chi tiết cấu trúc ngữ pháp của câu bằng tiếng Việt, bao gồm chủ ngữ, vị ngữ, tân ngữ, mệnh đề quan hệ, v.v."
}

CHỈ trả về JSON object, không thêm text nào khác.`;

    // Call Gemini API
    const geminiResponse = await callGeminiAPI(prompt);
    
    // Parse JSON response
    let parsedResult;
    try {
      const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse sentence translation:', error);
      return res.status(500).json({ 
        error: 'Failed to parse translation response',
        details: error.message 
      });
    }
    
    // Cache the result for future use
    await cacheTranslation(trimmedSentence, parsedResult, sourceFile);
    
    console.log(`✅ Fresh translation completed and cached`);
    
    res.json({ 
      success: true,
      ...parsedResult,
      isMobileResponse: true,
      fromCache: false,
      debug: {
        sourceFile: sourceFile,
        sentenceLength: trimmedSentence.length,
        cacheHit: false
      }
    });

  } catch (error) {
    console.error('Sentence translation API error:', error);
    res.status(500).json({ 
      error: 'Sentence translation failed',
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

// Cache management endpoints
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

app.delete('/api/cache/clear', async (req, res) => {
  try {
    await ensureCacheDirectory();
    const cacheFiles = await fs.readdir(CACHE_DIR);
    
    // Clear all cache files
    for (const cacheFile of cacheFiles) {
      if (cacheFile.endsWith('.json')) {
        await fs.unlink(path.join(CACHE_DIR, cacheFile));
      }
    }
    
    console.log('🗑️ All file-based translation caches cleared');
    res.json({ success: true, message: 'All caches cleared successfully' });
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

app.get('/api/cache/file/:filepath(*)', async (req, res) => {
  try {
    const sourceFile = req.params.filepath;
    const fileCache = await loadFileCache(sourceFile);
    
    const sentences = Object.values(fileCache.sentences || {});
    const stats = {
      sourceFile: sourceFile,
      totalSentences: sentences.length,
      totalUsage: sentences.reduce((sum, entry) => sum + (entry.metadata.usageCount || 0), 0),
      createdAt: fileCache.metadata.createdAt,
      updatedAt: fileCache.metadata.updatedAt,
      cacheFile: getFileCachePath(sourceFile)
    };
    
    res.json({ stats, sentences: sentences.slice(0, 10) }); // Return first 10 for preview
  } catch (error) {
    console.error('File cache error:', error);
    res.status(500).json({ error: 'Failed to get file cache' });
  }
});

app.get('/api/cache/popular', async (req, res) => {
  try {
    await ensureCacheDirectory();
    const cacheFiles = await fs.readdir(CACHE_DIR);
    
    const allSentences = [];
    
    for (const cacheFileName of cacheFiles) {
      if (cacheFileName.endsWith('.json')) {
        try {
          const cacheFilePath = path.join(CACHE_DIR, cacheFileName);
          const fileCache = JSON.parse(await fs.readFile(cacheFilePath, 'utf-8'));
          const sourceFile = cacheFileName.replace(/\.json$/, '').replace(/_/g, '/') + '.md';
          
          const sentences = Object.values(fileCache.sentences || {});
          sentences.forEach(entry => {
            allSentences.push({
              sentence: entry.sentence,
              translation: entry.translation,
              usageCount: entry.metadata.usageCount || 0,
              sourceFile: sourceFile,
              lastUsed: entry.metadata.lastUsed
            });
          });
        } catch (error) {
          console.error(`Error reading cache file ${cacheFileName}:`, error);
        }
      }
    }
    
    // Get most popular translations across all files
    const popular = allSentences
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 20);
    
    res.json({ popular });
  } catch (error) {
    console.error('Popular cache error:', error);
    res.status(500).json({ error: 'Failed to get popular translations' });
  }
});

// Routes
app.get('/', detectMobile, async (req, res) => {
  try {
    // Redirect mobile devices to mobile version unless desktop is forced
    if (req.isMobile && !req.forceDesktop) {
      return res.redirect('/mobile');
    }
    
    const fileTree = await scanDirectory(MARKDOWN_DIR);
    res.render('index', { 
      fileTree,
      isMobile: false,
      switchUrl: '/mobile'
    });
  } catch (error) {
    console.error('Error loading file tree:', error);
    res.status(500).send('Error loading file tree');
  }
});

// Mobile route
app.get('/mobile', detectMobile, async (req, res) => {
  try {
    // Redirect desktop devices to desktop version unless mobile is forced
    if (!req.isMobile && !req.forceMobile) {
      return res.redirect('/?desktop=1');
    }
    
    const fileTree = await scanDirectory(MARKDOWN_DIR);
    const flattenedFiles = flattenFileTree(fileTree);
    
    res.render('mobile', { 
      fileTree,
      flattenedFiles,
      isMobile: true,
      switchUrl: '/?desktop=1'
    });
  } catch (error) {
    console.error('Error loading mobile file tree:', error);
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

app.get('/view/:filepath(*)', detectMobile, async (req, res) => {
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
    
    // Determine if mobile view should be used
    const useMobile = (req.isMobile && !req.forceDesktop) || req.query.mobile === '1';
    const templateName = useMobile ? 'mobile-viewer' : 'viewer';
    
    res.render(templateName, {
      title,
      filepath,
      rawContent: markdownContent,
      htmlContent,
      frontmatter: data,
      isMobile: useMobile,
      switchUrl: useMobile ? 
        `/view/${filepath}?desktop=1` : 
        `/view/${filepath}?mobile=1`
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