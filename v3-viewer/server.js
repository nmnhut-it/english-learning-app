const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const crypto = require('crypto');
const os = require('os');

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

// Network IP detection with WiFi priority
function getLocalNetworkIP() {
  const networkInterfaces = os.networkInterfaces();
  
  // Collect all valid IP addresses with priority scoring
  const validIPs = [];
  
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    
    for (const address of addresses) {
      // Skip loopback, non-IPv4, and internal addresses
      if (!address.internal && address.family === 'IPv4') {
        let priority = 0;
        
        // Highest priority: 192.168.x.x (typical home/office WiFi)
        if (address.address.startsWith('192.168.')) {
          priority = 100;
          // Extra priority for common WiFi interface names
          if (interfaceName.toLowerCase().includes('wi-fi') || 
              interfaceName.toLowerCase().includes('wireless') ||
              interfaceName.toLowerCase().includes('wlan')) {
            priority = 150;
          }
        }
        // Medium priority: 10.x.x.x networks
        else if (address.address.startsWith('10.')) {
          priority = 50;
        }
        // Lower priority: 172.16-31.x.x networks  
        else if (address.address.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
          priority = 30;
        }
        // Lowest priority: other private ranges
        else if (!address.address.startsWith('169.254.')) { // Skip link-local
          priority = 10;
        }
        
        if (priority > 0) {
          validIPs.push({
            address: address.address,
            interface: interfaceName,
            priority: priority
          });
        }
      }
    }
  }
  
  // Sort by priority (highest first) and return best IP
  if (validIPs.length > 0) {
    validIPs.sort((a, b) => b.priority - a.priority);
    const bestIP = validIPs[0];
    console.log(`🌐 Selected IP: ${bestIP.address} (${bestIP.interface}, priority: ${bestIP.priority})`);
    return bestIP.address;
  }
  
  console.log('⚠️ No network IP found, using localhost');
  return 'localhost';
}

// Global network info
const LOCAL_IP = getLocalNetworkIP();
const SERVER_URL = `http://${LOCAL_IP}:${PORT}`;

console.log(`📡 Server will be accessible at: ${SERVER_URL}`);

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

function generateUUID() {
  return crypto.randomUUID();
}

function generateShortDescription(sentence, translationData) {
  // Generate a concise description based on sentence content
  const words = sentence.trim().split(' ');
  
  // Extract key words from our compact format
  let keyWords = [];
  if (translationData.words && translationData.words.length > 0) {
    keyWords = translationData.words
      .filter(word => ['noun', 'verb', 'adj', 'adjective'].includes(word.pos?.toLowerCase()))
      .map(word => word.word)
      .slice(0, 3); // Take first 3 key words
  }
  
  // Fallback to first chunk or first few words
  if (keyWords.length === 0) {
    if (translationData.chunks && translationData.chunks.length > 0) {
      keyWords = translationData.chunks[0].chunk.split(' ').slice(0, 3);
    } else {
      keyWords = words.slice(0, 3);
    }
  }
  
  // Create description
  const description = keyWords.join(' ');
  
  // Simple context based on sentence structure
  if (sentence.includes('?')) {
    return `Question: ${description}`;
  } else if (sentence.includes('!')) {
    return `Exclamation: ${description}`;
  } else {
    return description.charAt(0).toUpperCase() + description.slice(1);
  }
}

// Global UUID to translation mapping for quick lookup
let uuidToTranslationMap = new Map();

async function loadUUIDMap() {
  try {
    await ensureCacheDirectory();
    const cacheFiles = await fs.readdir(CACHE_DIR);
    
    uuidToTranslationMap.clear();
    
    for (const cacheFileName of cacheFiles) {
      if (cacheFileName.endsWith('.json')) {
        try {
          const cacheFilePath = path.join(CACHE_DIR, cacheFileName);
          const fileCache = JSON.parse(await fs.readFile(cacheFilePath, 'utf-8'));
          const sourceFile = cacheFileName.replace(/\.json$/, '').replace(/_/g, '/') + '.md';
          
          Object.entries(fileCache.sentences || {}).forEach(([hash, translation]) => {
            if (translation.uuid) {
              uuidToTranslationMap.set(translation.uuid, {
                ...translation,
                sourceFile: sourceFile,
                hash: hash
              });
            }
          });
        } catch (error) {
          console.error(`Error loading UUID map from ${cacheFileName}:`, error);
        }
      }
    }
    
    console.log(`📋 Loaded ${uuidToTranslationMap.size} translations into UUID map`);
  } catch (error) {
    console.error('Failed to load UUID map:', error);
  }
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
  
  // Generate UUID and description for this translation
  const uuid = generateUUID();
  const shortDesc = generateShortDescription(sentence, translationData);
  
  fileCache.sentences[hash] = {
    ...translationData,
    uuid: uuid,
    shortDesc: shortDesc,
    metadata: {
      sourceFile: sourceFile,
      timestamp: new Date().toISOString(),
      usageCount: 1,
      lastUsed: new Date().toISOString(),
      shareableLink: `/translation/${uuid}`
    }
  };
  
  await saveFileCache(sourceFile, fileCache);
  
  // Update UUID map
  uuidToTranslationMap.set(uuid, {
    ...fileCache.sentences[hash],
    sourceFile: sourceFile,
    hash: hash
  });
  
  console.log(`💾 Cached translation in ${sourceFile}: "${sentence.substring(0, 30)}..." (UUID: ${uuid.substring(0, 8)})`);
  
  return { uuid, shortDesc, shareableLink: `/translation/${uuid}` };
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
1. word1: (pos) Vietnamese meaning /IPA/
2. word2: (pos) Vietnamese meaning /IPA/
3. word3: (pos) Vietnamese meaning /IPA/
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

**Key Words:**
1. **word1:** (pos) Vietnamese meaning /IPA/
2. **word2:** (pos) Vietnamese meaning /IPA/

**Meaning Chunks:** (word groups that form meaningful units)
1. **chunk1:** nghĩa chunk1
2. **chunk2:** nghĩa chunk2

---

### Sentence 2
[Tiếp tục cùng format...]

</details>

RULES: Auto-detect content, British IPA, meaning chunks = word groups that form meaningful units (e.g., "talented musicians" = subject chunk, "performing music" = action chunk), markdown format only.`;
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

// Text processing helper functions
function parseTextIntoSentences(text) {
  // Split text into sentences while preserving structure
  // Use regex to find sentence boundaries but keep track of position and context
  const sentences = [];
  
  // Enhanced regex to match sentences ending with . ! ? followed by space or end
  const sentenceRegex = /[^.!?]*[.!?]+(?=\s|$)/g;
  let match;
  let lastIndex = 0;
  
  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length > 10) { // Only process meaningful sentences
      sentences.push({
        original: sentence,
        startIndex: match.index,
        endIndex: sentenceRegex.lastIndex,
        fullMatch: match[0] // Include original spacing
      });
    }
    lastIndex = sentenceRegex.lastIndex;
  }
  
  return sentences;
}

function replaceTextWithTranslations(originalText, translationMap) {
  // Replace sentences with their translations while preserving document structure
  let processedText = originalText;
  
  // Sort by position (reverse order to avoid index shifting issues)
  const sortedEntries = Object.entries(translationMap)
    .sort(([,a], [,b]) => b.startIndex - a.startIndex);
  
  sortedEntries.forEach(([originalSentence, translationData]) => {
    // Replace the original sentence with translation, preserving surrounding whitespace
    processedText = processedText.replace(originalSentence, translationData.translation);
  });
  
  return processedText;
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
          maxOutputTokens: 32768
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
1. word1: (pos) Vietnamese meaning /IPA/
2. word2: (pos) Vietnamese meaning /IPA/
3. word3: (pos) Vietnamese meaning /IPA/
\`\`\`

EXAMPLES:
1. talented: (adj) tài năng /ˈtæləntɪd/
2. musicians: (noun) nhạc sĩ /mjuːˈzɪʃənz/
3. performing: (verb) biểu diễn /pəˈfɔːmɪŋ/

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
1. **word1:** (pos) Vietnamese meaning /IPA/
2. **word2:** (pos) Vietnamese meaning /IPA/
3. **word3:** (pos) Vietnamese meaning /IPA/

**Meaning Chunks:** (word groups that form meaningful units)
1. **chunk1:** nghĩa chunk1
2. **chunk2:** nghĩa chunk2

---

### Sentence 2

**English:** [Next English sentence]

**Vietnamese:** [Next Vietnamese translation]

[Continue same detailed pattern...]

</details>

RULES: British IPA, meaning chunks = word groups that form meaningful units (e.g., "talented musicians" = subject chunk, "performing music" = action chunk), markdown format only.`;
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

    // Parse content into sentences
    const sentences = parseTextIntoSentences(fileContent);
    console.log(`📝 Found ${sentences.length} sentences to translate`);
    
    if (sentences.length === 0) {
      return res.status(400).json({ error: 'No translatable sentences found' });
    }

    // Translate each sentence using compact JSON format
    const translationMap = {};
    let completedSentences = 0;
    
    for (const sentenceData of sentences) {
      try {
        // Use the compact sentence translation prompt
        const prompt = `Translate and analyze: ${sentenceData.original}

JSON:
{
  "sentence": "${sentenceData.original}",
  "translation": "Vietnamese",
  "words": [{"word": "word", "pos": "pos", "meaning": "nghĩa", "ipa": "/IPA/"}],
  "chunks": [{"chunk": "meaning chunk", "meaning": "nghĩa của chunk"}]
}

Rules:
- Skip: the, a, is, are, was, were, have, has, do, did, will, can, this, that, my, your, in, on, at, for, and, or, but, very, some, all, not, only, also, there, here, when, what, who
- Include: content words (nouns, verbs, adjectives, adverbs)
- Max 5 words, 3-4 fine chunks (2-4 words each)
- British IPA
- Fine chunks examples:
  GOOD: "at that time" (when), "many movies" (what), "TV series" (what), "no reality competitions" (what not), "on TV" (where)
  BAD: "at that time there were many movies and TV series" (entire clause)
- Each chunk = one concept (who/what/when/where/how)

JSON only:`;

        const geminiResponse = await callGeminiAPI(prompt);
        
        // Parse JSON response
        const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const translationResult = JSON.parse(jsonMatch[0]);
          translationMap[sentenceData.original] = {
            ...translationResult,
            startIndex: sentenceData.startIndex,
            endIndex: sentenceData.endIndex
          };
          completedSentences++;
          console.log(`✅ Translated ${completedSentences}/${sentences.length}: "${sentenceData.original.substring(0, 50)}..."`);
        }
      } catch (error) {
        console.error(`❌ Failed to translate sentence: "${sentenceData.original.substring(0, 50)}..."`, error);
        // Continue with other sentences even if one fails
      }
    }
    
    // Replace original sentences with translations while preserving structure
    const translatedContent = replaceTextWithTranslations(fileContent, translationMap);
    
    console.log(`✅ Auto-translation completed: ${completedSentences}/${sentences.length} sentences translated`);
    
    res.json({ 
      success: true,
      translationContent: translatedContent,
      detectedSection: 'auto-complete',
      sectionTitle: 'Bản dịch tự động',
      message: `Auto-translation completed: ${completedSentences}/${sentences.length} sentences`,
      isMobileResponse: true,
      debug: {
        sourceFile: sourceFile,
        originalLength: fileContent.length,
        translatedLength: translatedContent.length,
        sentencesFound: sentences.length,
        sentencesTranslated: completedSentences,
        translationMap: Object.keys(translationMap).length
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
        shareableLink: cachedResult.metadata.shareableLink || `/translation/${cachedResult.uuid}`,
        isMobileResponse: true,
        fromCache: true,
        debug: {
          sourceFile: sourceFile,
          sentenceLength: trimmedSentence.length,
          cacheHit: true,
          usageCount: cachedResult.metadata.usageCount,
          cacheFile: getFileCachePath(sourceFile),
          uuid: cachedResult.uuid
        }
      });
    }

    // Cache miss - call Gemini API
    console.log(`🤖 Cache miss - calling Gemini API`);

    const prompt = `Translate and analyze: ${trimmedSentence}

JSON:
{
  "sentence": "${trimmedSentence}",
  "translation": "Vietnamese",
  "words": [{"word": "word", "pos": "pos", "meaning": "nghĩa", "ipa": "/IPA/"}],
  "chunks": [{"chunk": "meaning chunk", "meaning": "nghĩa của chunk"}]
}

Rules:
- Skip: the, a, is, are, was, were, have, has, do, did, will, can, this, that, my, your, in, on, at, for, and, or, but, very, some, all, not, only, also, there, here, when, what, who
- Include: content words (nouns, verbs, adjectives, adverbs)
- Max 5 words, 3-4 fine chunks (2-4 words each)
- British IPA
- Fine chunks examples:
  GOOD: "talented musicians" (who), "are performing" (action), "beautiful music" (what), "tonight" (when)
  BAD: "talented musicians are performing beautiful music tonight" (entire sentence)
- Each chunk = one concept (who/what/when/where/how)

JSON only:`;

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
    const cacheInfo = await cacheTranslation(trimmedSentence, parsedResult, sourceFile);
    
    console.log(`✅ Fresh translation completed and cached`);
    
    res.json({ 
      success: true,
      ...parsedResult,
      uuid: cacheInfo.uuid,
      shortDesc: cacheInfo.shortDesc,
      shareableLink: cacheInfo.shareableLink,
      isMobileResponse: true,
      fromCache: false,
      debug: {
        sourceFile: sourceFile,
        sentenceLength: trimmedSentence.length,
        cacheHit: false,
        uuid: cacheInfo.uuid
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

// V3 Vocabulary endpoint - cloned from vocab-tool-docker
app.get('/v3-vocab', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teacher Dashboard - Vocabulary Tool</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f7fa;
            color: #2d3748;
            line-height: 1.6;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 1.5rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .nav-links {
            display: flex;
            gap: 1rem;
        }

        .nav-links a {
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            transition: background-color 0.2s;
        }

        .nav-links a:hover {
            background-color: rgba(255,255,255,0.1);
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }

        .page-title {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #2d3748;
        }

        .page-subtitle {
            color: #718096;
            margin-bottom: 2rem;
        }

        .card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #4a5568;
        }

        .form-input, .form-textarea, .form-select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.2s;
        }

        .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-textarea {
            min-height: 200px;
            resize: vertical;
            font-family: inherit;
        }

        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5a67d8;
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: #e2e8f0;
            color: #4a5568;
        }

        .btn-secondary:hover {
            background: #cbd5e0;
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .alert {
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
        }

        .alert-success {
            background: #f0fff4;
            color: #22543d;
            border: 1px solid #68d391;
        }

        .alert-error {
            background: #fed7d7;
            color: #742a2a;
            border: 1px solid #fc8181;
        }

        .alert-info {
            background: #ebf8ff;
            color: #2a4365;
            border: 1px solid #63b3ed;
        }

        .lessons-grid {
            display: grid;
            gap: 1rem;
        }

        .lesson-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            transition: all 0.2s;
        }

        .lesson-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transform: translateY(-1px);
        }

        .lesson-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.5rem;
        }

        .lesson-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 0.25rem;
        }

        .lesson-meta {
            font-size: 0.875rem;
            color: #718096;
        }

        .lesson-stats {
            display: flex;
            gap: 1rem;
            margin-top: 0.5rem;
            font-size: 0.875rem;
        }

        .stat {
            background: #f7fafc;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            color: #4a5568;
        }

        .student-url {
            background: #e6fffa;
            border: 1px dashed #38b2ac;
            border-radius: 6px;
            padding: 1rem;
            margin-top: 1rem;
        }

        .student-url-header {
            font-weight: 500;
            color: #2d3748;
            margin-bottom: 0.5rem;
        }

        .url-display {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-family: monospace;
            background: white;
            padding: 0.5rem;
            border-radius: 4px;
            border: 1px solid #bee3f8;
        }

        .url-text {
            flex: 1;
            color: #2b6cb0;
            word-break: break-all;
        }

        .copy-btn {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            min-width: auto;
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid #e2e8f0;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .hidden {
            display: none;
        }

        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }

            .lesson-header {
                flex-direction: column;
                align-items: flex-start;
            }

            .lesson-stats {
                flex-wrap: wrap;
            }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-content">
            <div class="logo">
                📚 Vocabulary Tool V3
            </div>
            <nav class="nav-links">
                <a href="/">Home</a>
                <a href="/mobile">Mobile</a>
                <a href="/translations">Translations</a>
            </nav>
        </div>
    </header>

    <div class="container">
        <h1 class="page-title">Teacher Dashboard</h1>
        <p class="page-subtitle">Create lessons for students to practice vocabulary in context (V3 Integration)</p>

        <!-- Create Lesson Form -->
        <div class="card">
            <h2 style="margin-bottom: 1rem;">Create New Lesson</h2>

            <form id="lessonForm">
                <div class="form-group">
                    <label class="form-label">Lesson Title *</label>
                    <input type="text" id="title" class="form-input" placeholder="e.g., Unit 3: Hobbies and Interests" required>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Grade</label>
                        <select id="grade" class="form-select">
                            <option value="">Auto-detect</option>
                            <option value="6">Grade 6</option>
                            <option value="7">Grade 7</option>
                            <option value="8">Grade 8</option>
                            <option value="9">Grade 9</option>
                            <option value="10">Grade 10</option>
                            <option value="11">Grade 11</option>
                            <option value="12">Grade 12</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Unit Number</label>
                        <input type="number" id="unit" class="form-input" placeholder="3" min="1" max="20">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Lesson Content *</label>
                    <textarea id="content" class="form-textarea" placeholder="Paste your lesson content here (dialogues, reading passages, vocabulary lists, etc.)

Example:
A: What do you like to do in your free time?
B: I enjoy playing guitar and reading books. What about you?
A: I'm into photography and hiking. Do you have any hobbies?
B: Yes, I collect stamps and coins from different countries.

[You can add vocabulary lists, reading passages, or any content students should learn from]" required></textarea>
                </div>

                <button type="submit" class="btn btn-primary" id="createBtn">
                    <span id="createBtnText">Create Lesson</span>
                    <span id="createBtnLoading" class="loading hidden"></span>
                </button>
            </form>
        </div>

        <!-- Alert Messages -->
        <div id="alertContainer"></div>

        <!-- Student URL Display -->
        <div id="studentUrlCard" class="student-url hidden">
            <div class="student-url-header">✅ Lesson Created! Share this link with students:</div>
            <div class="url-display">
                <span class="url-text" id="studentUrl"></span>
                <button type="button" class="btn btn-secondary copy-btn" onclick="copyUrl()">Copy</button>
            </div>
        </div>

        <!-- Recent Lessons -->
        <div class="card">
            <h2 style="margin-bottom: 1rem;">Available Markdown Files</h2>
            <div id="lessonsContainer">
                <div class="loading" style="margin: 2rem auto; display: block;"></div>
            </div>
        </div>
    </div>

    <script>
        let currentStudentUrl = '';
        let fileTree = {};
        let flattenedFiles = [];

        // Load files on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadFiles();
        });

        // Create lesson form submission (adapted for V3)
        document.getElementById('lessonForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const title = document.getElementById('title').value.trim();
            const grade = document.getElementById('grade').value;
            const unit = document.getElementById('unit').value;
            const content = document.getElementById('content').value.trim();

            if (!title || !content) {
                showAlert('Please fill in all required fields', 'error');
                return;
            }

            setLoading(true);
            clearAlerts();

            try {
                // Since this is V3 integration, we'll just show success message
                // Real implementation would integrate with actual V3 backend
                showAlert('Lesson content prepared! (V3 Integration - would save to markdown-files)', 'info');

                // Generate a mock student URL for demo
                const mockId = Math.random().toString(36).substr(2, 9);
                const fullUrl = window.location.origin + '/view/generated-' + mockId + '.md';
                currentStudentUrl = fullUrl;
                document.getElementById('studentUrl').textContent = fullUrl;
                document.getElementById('studentUrlCard').classList.remove('hidden');

                // Clear form
                document.getElementById('lessonForm').reset();

            } catch (error) {
                showAlert('Error: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        });

        async function loadFiles() {
            try {
                const response = await fetch('/api/files');
                const data = await response.json();

                if (data.success) {
                    fileTree = data.fileTree;
                    flattenedFiles = flattenFileTree(fileTree);
                    displayFiles();
                } else {
                    document.getElementById('lessonsContainer').innerHTML =
                        '<p style="color: #718096; text-align: center;">No files found</p>';
                }
            } catch (error) {
                document.getElementById('lessonsContainer').innerHTML =
                    '<p style="color: #e53e3e; text-align: center;">Error loading files: ' + error.message + '</p>';
            }
        }

        function flattenFileTree(tree) {
            let files = [];

            function traverse(node, path = '') {
                if (node.type === 'file' && node.name.endsWith('.md')) {
                    files.push({
                        name: node.name,
                        path: path + node.name,
                        fullPath: node.fullPath || (path + node.name)
                    });
                } else if (node.type === 'directory' && node.children) {
                    const newPath = path + node.name + '/';
                    node.children.forEach(child => traverse(child, newPath));
                }
            }

            if (Array.isArray(tree)) {
                tree.forEach(item => traverse(item));
            } else {
                traverse(tree);
            }

            return files;
        }

        function displayFiles() {
            const container = document.getElementById('lessonsContainer');

            if (flattenedFiles.length === 0) {
                container.innerHTML = '<p style="color: #718096; text-align: center;">No markdown files found</p>';
                return;
            }

            const filesHtml = flattenedFiles.slice(0, 10).map(file => {
                const fileName = file.name.replace('.md', '');
                const filePath = file.path;

                return \`
                    <div class="lesson-card">
                        <div class="lesson-header">
                            <div>
                                <div class="lesson-title">\${fileName}</div>
                                <div class="lesson-meta">Path: \${filePath}</div>
                            </div>
                        </div>

                        <div class="lesson-stats">
                            <span class="stat">📄 Markdown File</span>
                            <span class="stat">📚 V3 Compatible</span>
                        </div>

                        <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <a href="/view/\${file.fullPath}" target="_blank" class="btn btn-primary" style="font-size: 0.875rem;">
                                👁️ View
                            </a>
                            <button onclick="copyToClipboard('/view/\${file.fullPath}')" class="btn btn-secondary" style="font-size: 0.875rem;">
                                📋 Copy Link
                            </button>
                            <button onclick="useAsTemplate('\${file.fullPath}')" class="btn btn-secondary" style="font-size: 0.875rem;">
                                📝 Use as Template
                            </button>
                        </div>
                    </div>
                \`;
            }).join('');

            container.innerHTML = \`<div class="lessons-grid">\${filesHtml}</div>\`;
        }

        async function useAsTemplate(filePath) {
            try {
                const response = await fetch(\`/raw/\${filePath}\`);
                const content = await response.text();

                // Extract title from file name
                const fileName = filePath.split('/').pop().replace('.md', '');

                document.getElementById('title').value = fileName;
                document.getElementById('content').value = content;

                showAlert('Template loaded! Modify as needed and create lesson.', 'success');

            } catch (error) {
                showAlert('Error loading template: ' + error.message, 'error');
            }
        }

        function showAlert(message, type) {
            const alertContainer = document.getElementById('alertContainer');
            const alert = document.createElement('div');
            alert.className = \`alert alert-\${type}\`;
            alert.innerHTML = \`
                <span>\${getAlertIcon(type)}</span>
                <span>\${message}</span>
            \`;
            alertContainer.appendChild(alert);

            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 5000);
        }

        function getAlertIcon(type) {
            switch (type) {
                case 'success': return '✅';
                case 'error': return '❌';
                case 'info': return 'ℹ️';
                default: return '📝';
            }
        }

        function clearAlerts() {
            document.getElementById('alertContainer').innerHTML = '';
        }

        function setLoading(loading) {
            const btn = document.getElementById('createBtn');
            const text = document.getElementById('createBtnText');
            const spinner = document.getElementById('createBtnLoading');

            btn.disabled = loading;
            text.style.display = loading ? 'none' : 'inline';
            spinner.classList.toggle('hidden', !loading);
        }

        function copyUrl() {
            copyToClipboard(currentStudentUrl);
        }

        function copyToClipboard(text) {
            const fullUrl = window.location.origin + text;
            navigator.clipboard.writeText(fullUrl).then(() => {
                showAlert('Link copied to clipboard!', 'success');
            }).catch(() => {
                showAlert('Failed to copy link', 'error');
            });
        }
    </script>
</body>
</html>
  `;

  res.send(html);
});

// Network info endpoint
app.get('/api/network-info', (req, res) => {
  res.json({
    localIP: LOCAL_IP,
    serverURL: SERVER_URL,
    port: PORT,
    hostname: os.hostname()
  });
});

// Initialize UUID map on startup
loadUUIDMap();

// Shareable translation endpoint
app.get('/translation/:uuid', detectMobile, async (req, res) => {
  try {
    const uuid = req.params.uuid;
    
    // Refresh UUID map if empty
    if (uuidToTranslationMap.size === 0) {
      await loadUUIDMap();
    }
    
    const translation = uuidToTranslationMap.get(uuid);
    if (!translation) {
      return res.status(404).send('Translation not found');
    }

    // Determine if mobile view should be used
    const useMobile = (req.isMobile && !req.forceDesktop) || req.query.mobile === '1';
    const templateName = useMobile ? 'translation-mobile' : 'translation-desktop';
    
    res.render(templateName, {
      translation: translation,
      title: `Translation: ${translation.shortDesc}`,
      uuid: uuid,
      isMobile: useMobile,
      switchUrl: useMobile ? 
        `/translation/${uuid}?desktop=1` : 
        `/translation/${uuid}?mobile=1`
    });
  } catch (error) {
    console.error('Translation view error:', error);
    res.status(500).send('Error loading translation');
  }
});

// Translation API endpoint for UUID
app.get('/api/translation/:uuid', async (req, res) => {
  try {
    const uuid = req.params.uuid;
    
    // Refresh UUID map if empty
    if (uuidToTranslationMap.size === 0) {
      await loadUUIDMap();
    }
    
    const translation = uuidToTranslationMap.get(uuid);
    if (!translation) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    res.json({ 
      success: true,
      ...translation,
      uuid: uuid
    });
  } catch (error) {
    console.error('Translation API error:', error);
    res.status(500).json({ error: 'Failed to get translation' });
  }
});

// Translations browser endpoint
app.get('/translations', detectMobile, async (req, res) => {
  try {
    // Refresh UUID map
    await loadUUIDMap();
    
    const translations = Array.from(uuidToTranslationMap.values())
      .sort((a, b) => new Date(b.metadata.lastUsed) - new Date(a.metadata.lastUsed));

    // Determine if mobile view should be used
    const useMobile = (req.isMobile && !req.forceDesktop) || req.query.mobile === '1';
    const templateName = useMobile ? 'translations-mobile' : 'translations-desktop';
    
    res.render(templateName, {
      translations: translations,
      totalTranslations: translations.length,
      isMobile: useMobile,
      switchUrl: useMobile ? '/translations?desktop=1' : '/translations?mobile=1'
    });
  } catch (error) {
    console.error('Translations browser error:', error);
    res.status(500).send('Error loading translations');
  }
});

// Browse translations API
app.get('/api/translations/browse', async (req, res) => {
  try {
    // Refresh UUID map
    await loadUUIDMap();
    
    const translations = Array.from(uuidToTranslationMap.values())
      .map(t => ({
        uuid: t.uuid,
        shortDesc: t.shortDesc,
        sentence: t.sentence.substring(0, 100) + (t.sentence.length > 100 ? '...' : ''),
        translation: t.translation.substring(0, 100) + (t.translation.length > 100 ? '...' : ''),
        sourceFile: t.sourceFile,
        usageCount: t.metadata.usageCount,
        lastUsed: t.metadata.lastUsed,
        shareableLink: `/translation/${t.uuid}`
      }))
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));

    res.json({ 
      success: true,
      translations: translations,
      total: translations.length
    });
  } catch (error) {
    console.error('Browse translations API error:', error);
    res.status(500).json({ error: 'Failed to browse translations' });
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