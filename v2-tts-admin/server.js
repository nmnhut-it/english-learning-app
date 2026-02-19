/**
 * TTS Admin Server - Review and generate audio for teacher scripts.
 * Port: 5003 | API: /api/* | UI: http://localhost:5003
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;

const markdownService = require('./services/markdownService');
const elevenLabsService = require('./services/elevenLabsService');
const audioService = require('./services/audioService');

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve audio files from v2/audio directory
app.use('/audio', express.static(path.join(__dirname, '../v2/audio')));

// === API Routes ===

/**
 * GET /api/files - List all markdown files
 */
app.get('/api/files', async (req, res) => {
  try {
    const files = await markdownService.listMarkdownFiles();
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/file/:path - Get teacher scripts from a file
 * Path is URL-encoded relative path (e.g., g6/unit-07/getting-started.md)
 */
app.get('/api/file/*', async (req, res) => {
  try {
    const relativePath = req.params[0];
    const scripts = await markdownService.parseTeacherScripts(relativePath);

    // Add generated filename for each script (based on content hash only)
    const scriptsWithFilenames = scripts.map(script => ({
      ...script,
      generatedFilename: markdownService.generateAudioFilename(script.hash)
    }));

    res.json({ success: true, scripts: scriptsWithFilenames, path: relativePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/voices - List available ElevenLabs voices
 */
app.get('/api/voices', async (req, res) => {
  try {
    const voices = await elevenLabsService.listVoices();
    res.json({ success: true, voices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/subscription - Get ElevenLabs subscription info
 */
app.get('/api/subscription', async (req, res) => {
  try {
    const info = await elevenLabsService.getSubscriptionInfo();
    res.json({ success: true, ...info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/generate - Generate audio for a script
 * Body: { filePath, scriptIndex, voiceId, cleanedText, hash, forceRegenerate }
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { filePath, scriptIndex, voiceId, cleanedText, hash, forceRegenerate } = req.body;

    if (!filePath || scriptIndex === undefined || !voiceId || !cleanedText) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: filePath, scriptIndex, voiceId, cleanedText'
      });
    }

    // Generate filename based on content hash only (enables reuse)
    const filename = markdownService.generateAudioFilename(hash);

    // Check if audio already exists (same hash = same content)
    // Skip cache if forceRegenerate is true
    const exists = await audioService.audioExists(filename);
    if (exists && !forceRegenerate) {
      const relativePath = `audio/${filename}`;
      // Still update markdown to link to existing audio
      await markdownService.updateScriptHref(filePath, scriptIndex, relativePath);
      return res.json({
        success: true,
        cached: true,
        filename,
        href: relativePath,
        message: 'Audio already exists (reused)'
      });
    }

    // Delete old file if regenerating
    if (exists && forceRegenerate) {
      await audioService.deleteAudio(filename);
    }

    // Generate audio via ElevenLabs using cleaned text
    const audioBuffer = await elevenLabsService.generateSpeech(cleanedText, voiceId);

    // Save audio file
    const { relativePath } = await audioService.saveAudio(audioBuffer, filename);

    // Update markdown file with href
    await markdownService.updateScriptHref(filePath, scriptIndex, relativePath);

    res.json({
      success: true,
      cached: false,
      filename,
      href: relativePath,
      message: 'Audio generated and saved'
    });

  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/update-href - Update markdown href without generating audio
 * Body: { filePath, scriptIndex, href }
 */
app.post('/api/update-href', async (req, res) => {
  try {
    const { filePath, scriptIndex, href } = req.body;

    if (!filePath || scriptIndex === undefined || !href) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: filePath, scriptIndex, href'
      });
    }

    await markdownService.updateScriptHref(filePath, scriptIndex, href);
    res.json({ success: true, message: 'Href updated' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/audio-exists/:filename - Check if audio file exists
 */
app.get('/api/audio-exists/:filename', async (req, res) => {
  try {
    const exists = await audioService.audioExists(req.params.filename);
    res.json({ success: true, exists });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/audio-lookup/:hash - Lookup audio by content hash
 * Returns audio path if exists, used for auto-linking
 */
app.get('/api/audio-lookup/:hash', async (req, res) => {
  try {
    const hash = req.params.hash;
    const filename = markdownService.generateAudioFilename(hash);
    const exists = await audioService.audioExists(filename);

    if (exists) {
      res.json({
        success: true,
        exists: true,
        filename,
        href: `audio/${filename}`
      });
    } else {
      res.json({ success: true, exists: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/update-script - Update script text content in markdown
 * Body: { filePath, scriptIndex, newText }
 */
app.post('/api/update-script', async (req, res) => {
  try {
    const { filePath, scriptIndex, newText } = req.body;

    if (!filePath || scriptIndex === undefined || newText === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: filePath, scriptIndex, newText'
      });
    }

    await markdownService.updateScriptText(filePath, scriptIndex, newText);
    const newHash = markdownService.generateHash(newText);

    res.json({
      success: true,
      message: 'Script text updated',
      newHash
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/upload-recording - Upload recorded audio from browser
 * Body: multipart form with audio blob, filePath, scriptIndex, hash
 */
app.post('/api/upload-recording', upload.single('audio'), async (req, res) => {
  try {
    const { filePath, scriptIndex, hash } = req.body;
    const audioBuffer = req.file?.buffer;

    if (!audioBuffer || !filePath || scriptIndex === undefined || !hash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: audio, filePath, scriptIndex, hash'
      });
    }

    // Generate filename based on hash (webm extension for recordings)
    const filename = `tts_${hash}.webm`;
    const audioDir = path.join(__dirname, '../v2/audio');
    const finalPath = path.join(audioDir, filename);

    // Save webm file directly
    await fs.writeFile(finalPath, audioBuffer);

    // Update markdown file with href
    const relativePath = `audio/${filename}`;
    await markdownService.updateScriptHref(filePath, parseInt(scriptIndex), relativePath);

    res.json({
      success: true,
      filename,
      href: relativePath,
      message: 'Recording saved'
    });

  } catch (error) {
    console.error('Upload recording error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === Compare View API Routes ===

/**
 * GET /api/voice-lecture/* - Get raw voice lecture markdown content
 * Path format: gX/unit-XX/section.md (e.g., g6/unit-01/getting-started.md)
 */
app.get('/api/voice-lecture/*', async (req, res) => {
  try {
    const relativePath = req.params[0];
    const fullPath = path.join(__dirname, '../v2/data/voice-lectures', relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ success: true, content, path: relativePath });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({ success: true, content: null, path: req.params[0], message: 'File not found' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

/**
 * GET /api/loigiaihay/* - Get loigiaihay source markdown content
 * Path format: gradeX/unit-XX/section.md (e.g., grade6/unit-01/getting-started.md)
 */
app.get('/api/loigiaihay/*', async (req, res) => {
  try {
    const relativePath = req.params[0];
    const fullPath = path.join(__dirname, '../loigiaihay.com', relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ success: true, content, path: relativePath });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({ success: true, content: null, path: req.params[0], message: 'File not found' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

/**
 * GET /api/compare-files - List files available for comparison
 * Returns files that exist in voice-lectures with their loigiaihay counterparts
 */
app.get('/api/compare-files', async (req, res) => {
  try {
    const files = await markdownService.listMarkdownFiles();
    // Map to include loigiaihay path
    const compareFiles = files.map(file => {
      const gradeNum = file.grade.replace('g', '');
      const loigiaihayPath = `grade${gradeNum}/${file.unit}/${file.section}.md`;
      return {
        ...file,
        voiceLecturePath: file.path,
        loigiaihayPath
      };
    });
    res.json({ success: true, files: compareFiles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/compare-recording - Upload recording for compare view
 * Body: multipart form with audio blob, note (optional description)
 */
app.post('/api/compare-recording', upload.single('audio'), async (req, res) => {
  try {
    const { note } = req.body;
    const audioBuffer = req.file?.buffer;

    if (!audioBuffer) {
      return res.status(400).json({ success: false, error: 'Missing audio file' });
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filename = `compare_${timestamp}.webm`;
    const audioDir = path.join(__dirname, '../v2/audio');
    const finalPath = path.join(audioDir, filename);

    await fs.writeFile(finalPath, audioBuffer);

    res.json({
      success: true,
      filename,
      href: `audio/${filename}`,
      message: 'Recording saved'
    });

  } catch (error) {
    console.error('Compare recording error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// === Recording Mode API Routes ===

const REMARKS_FILE = path.join(__dirname, 'data/remarks.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load remarks from file
async function loadRemarks() {
  try {
    const data = await fs.readFile(REMARKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Save remarks to file
async function saveRemarks(remarks) {
  await ensureDataDir();
  await fs.writeFile(REMARKS_FILE, JSON.stringify(remarks, null, 2));
}

/**
 * GET /api/file-content/* - Get raw markdown file content
 */
app.get('/api/file-content/*', async (req, res) => {
  try {
    const relativePath = req.params[0];
    const fullPath = path.join(__dirname, '../v2/data/voice-lectures', relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ success: true, content, path: relativePath });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ success: false, error: 'File not found' });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

/**
 * GET /api/remarks - Get all remarks
 */
app.get('/api/remarks', async (req, res) => {
  try {
    const remarks = await loadRemarks();
    res.json({ success: true, remarks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/remarks - Save a remark
 * Body: { filePath, scriptIndex, remark }
 */
app.post('/api/remarks', async (req, res) => {
  try {
    const { filePath, scriptIndex, remark } = req.body;

    const parsedIndex = Number(scriptIndex);
    if (!filePath || !Number.isInteger(parsedIndex) || parsedIndex < 0 || !remark) {
      return res.status(400).json({
        success: false,
        error: 'Missing/invalid fields: filePath (string), scriptIndex (non-negative integer), remark (string)'
      });
    }

    const remarks = await loadRemarks();

    if (!remarks[filePath]) {
      remarks[filePath] = {};
    }

    remarks[filePath][parsedIndex] = {
      remark,
      created: new Date().toISOString()
    };

    await saveRemarks(remarks);
    res.json({ success: true, message: 'Remark saved' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/remarks - Delete a remark
 * Body: { filePath, scriptIndex }
 */
app.delete('/api/remarks', async (req, res) => {
  try {
    const { filePath, scriptIndex } = req.body;

    if (!filePath || scriptIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: filePath, scriptIndex'
      });
    }

    const remarks = await loadRemarks();

    if (remarks[filePath] && remarks[filePath][scriptIndex]) {
      delete remarks[filePath][scriptIndex];

      // Clean up empty file entries
      if (Object.keys(remarks[filePath]).length === 0) {
        delete remarks[filePath];
      }

      await saveRemarks(remarks);
    }

    res.json({ success: true, message: 'Remark deleted' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/remarks/report - Export all remarks as a report
 */
app.get('/api/remarks/report', async (req, res) => {
  try {
    const remarks = await loadRemarks();

    // Format as readable report
    let report = '# Voice Lecture Remarks Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    for (const [filePath, scripts] of Object.entries(remarks)) {
      report += `## ${filePath}\n\n`;
      for (const [index, data] of Object.entries(scripts)) {
        report += `- **Block #${parseInt(index) + 1}**: ${data.remark}\n`;
      }
      report += '\n';
    }

    res.type('text/markdown').send(report);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'tts-admin' });
});

// Start server
app.listen(PORT, () => {
  console.log(`TTS Admin Server running at http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/files`);
});
