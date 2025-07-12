import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const router = express.Router();

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

// Process vocabulary with context
router.post('/process', async (req, res) => {
    try {
        const { words, apiKey, grade, unit, book, context } = req.body;

        // Validate inputs
        if (!words || !apiKey || !grade || !unit) {
            return res.status(400).json({ 
                error: 'Missing required fields: words, apiKey, grade, unit' 
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
        const fileName = `unit-${unit.padStart(2, '0')}-vocab-${timestamp}`;
        
        const folderPath = path.join(__dirname, '../../../markdown-files', gradeFolder, 'vocabulary');
        const markdownPath = path.join(folderPath, `${fileName}.md`);
        const jsonPath = path.join(folderPath, `${fileName}.json`);

        // Ensure directory exists
        await fs.mkdir(folderPath, { recursive: true });

        // Save markdown file
        await fs.writeFile(markdownPath, processedVocabulary, 'utf8');

        // Create JSON structure
        const jsonData = {
            metadata: {
                grade: parseInt(grade),
                unit: parseInt(unit),
                book: book,
                context: context || null,
                createdAt: new Date().toISOString(),
                totalWords: vocabularyItems.length
            },
            vocabulary: vocabularyItems
        };

        // Save JSON file
        await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');

        // Return response
        res.json({
            success: true,
            vocabulary: processedVocabulary,
            markdownPath: path.relative(path.join(__dirname, '../../..'), markdownPath),
            jsonPath: path.relative(path.join(__dirname, '../../..'), jsonPath),
            vocabularyCount: vocabularyItems.length
        });

    } catch (error: any) {
        console.error('Error processing vocabulary:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to process vocabulary' 
        });
    }
});

export default router;
