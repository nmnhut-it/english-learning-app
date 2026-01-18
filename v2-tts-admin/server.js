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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'tts-admin' });
});

// Start server
app.listen(PORT, () => {
  console.log(`TTS Admin Server running at http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/files`);
});
