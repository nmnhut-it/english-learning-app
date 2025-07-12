import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const router = express.Router();

// Gemini API configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

const PROMPT_TEMPLATE = `Hãy trả về kết quả HOÀN TOÀN BẰNG MARKDOWN với format sau:

# Từ vựng

[Với mỗi từ/cụm từ, format như sau:]

**[từ/cụm từ]**: (loại từ) nghĩa tiếng Việt /phiên âm IPA/

[Hoặc với động từ bất quy tắc:]

**[V1 - V2 - V3]**: (v) nghĩa tiếng Việt /phiên âm V1 - phiên âm V2 - phiên âm V3/

---

YÊU CẦU BẮT BUỘC:
- Output PHẢI là Markdown thuần túy
- Sử dụng ** ** cho từ/cụm từ chính
- Sử dụng / / cho phiên âm IPA
- Sử dụng --- để ngăn cách
- Phiên âm IPA chuẩn British English
- Loại từ: (n) danh từ, (v) động từ, (adj) tính từ, (adv) trạng từ, (prep) giới từ, (conj) liên từ, (interj) thán từ
- Cụm từ không cần ghi loại từ
- Động từ bất quy tắc phải ghi đủ 3 dạng

Các từ/cụm từ cần xử lý:
`;

// Process vocabulary
router.post('/process', async (req, res) => {
    try {
        const { words, apiKey, grade, unit } = req.body;

        // Validate inputs
        if (!words || !apiKey || !grade || !unit) {
            return res.status(400).json({ 
                error: 'Missing required fields: words, apiKey, grade, unit' 
            });
        }

        // Call Gemini API
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${apiKey}`,
            {
                contents: [{
                    parts: [{
                        text: PROMPT_TEMPLATE + words
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

        // Create file path
        const gradeFolder = `global-success-${grade.replace('g', '')}`;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const fileName = `unit-${unit.padStart(2, '0')}-vocab-${timestamp}.md`;
        
        const folderPath = path.join(__dirname, '../../../markdown-files', gradeFolder, 'vocabulary');
        const filePath = path.join(folderPath, fileName);

        // Ensure directory exists
        await fs.mkdir(folderPath, { recursive: true });

        // Save file
        await fs.writeFile(filePath, processedVocabulary, 'utf8');

        // Return response
        res.json({
            success: true,
            vocabulary: processedVocabulary,
            filePath: path.relative(path.join(__dirname, '../../..'), filePath),
            fileName: fileName
        });

    } catch (error: any) {
        console.error('Error processing vocabulary:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to process vocabulary' 
        });
    }
});

export default router;
