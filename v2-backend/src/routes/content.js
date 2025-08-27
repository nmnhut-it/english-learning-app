import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get content data path from environment or default
const CONTENT_DATA_PATH = process.env.CONTENT_DATA_PATH || 
  path.join(__dirname, '../../../v2/data/structured');

/**
 * GET /api/content/:grade/:unit
 * Load existing content for a grade/unit
 */
router.get('/:grade/:unit', async (req, res) => {
  try {
    const { grade, unit } = req.params;
    const xmlPath = path.join(CONTENT_DATA_PATH, `grade-${grade}`, `${unit}.xml`);
    
    console.log(`📖 Loading content: Grade ${grade}, Unit ${unit}`);
    
    try {
      const xmlContent = await fs.readFile(xmlPath, 'utf-8');
      
      res.json({
        success: true,
        data: {
          grade: parseInt(grade),
          unit,
          xmlContent,
          xmlPath: xmlPath.replace(path.join(__dirname, '../../..'), ''),
          lastModified: (await fs.stat(xmlPath)).mtime,
          fromDisk: true
        }
      });
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        res.status(404).json({
          success: false,
          error: {
            message: `Content not found for Grade ${grade}, Unit ${unit}`,
            code: 'CONTENT_NOT_FOUND'
          }
        });
      } else {
        throw fileError;
      }
    }
  } catch (error) {
    console.error('Failed to load content:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to load content',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/content/status/:grade/:unit
 * Check if content exists and get hash for change detection
 */
router.get('/status/:grade/:unit', async (req, res) => {
  try {
    const { grade, unit } = req.params;
    const xmlPath = path.join(CONTENT_DATA_PATH, `grade-${grade}`, `${unit}.xml`);
    
    let exists = false;
    let contentHash = null;
    let lastModified = null;
    
    try {
      const stats = await fs.stat(xmlPath);
      exists = true;
      lastModified = stats.mtime;
      
      // Generate hash of existing content for change detection
      const xmlContent = await fs.readFile(xmlPath, 'utf-8');
      contentHash = crypto.createHash('md5').update(xmlContent).digest('hex');
    } catch (error) {
      // File doesn't exist, which is fine
    }
    
    res.json({
      success: true,
      data: {
        exists,
        contentHash,
        lastModified,
        xmlPath: exists ? xmlPath.replace(path.join(__dirname, '../../..'), '') : null
      }
    });
  } catch (error) {
    console.error('Failed to check content status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to check content status',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/content/save
 * Save processed XML content to file system
 */
router.post('/save', async (req, res) => {
  try {
    const { grade, unit, xmlContent, metadata } = req.body;
    
    if (!grade || !unit || !xmlContent) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Missing required fields: grade, unit, xmlContent',
          code: 'MISSING_FIELDS'
        }
      });
    }
    
    const gradeDir = path.join(CONTENT_DATA_PATH, `grade-${grade}`);
    const xmlPath = path.join(gradeDir, `${unit}.xml`);
    
    console.log(`💾 Saving content to: ${xmlPath}`);
    
    // Ensure directory exists
    await fs.mkdir(gradeDir, { recursive: true });
    
    // Save XML content
    await fs.writeFile(xmlPath, xmlContent, 'utf-8');
    
    // Save metadata if provided
    if (metadata) {
      const metadataPath = path.join(gradeDir, `${unit}.metadata.json`);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    }
    
    const stats = await fs.stat(xmlPath);
    
    res.json({
      success: true,
      data: {
        grade: parseInt(grade),
        unit,
        xmlPath: xmlPath.replace(path.join(__dirname, '../../..'), ''),
        savedAt: stats.mtime,
        fileSize: stats.size
      }
    });
  } catch (error) {
    console.error('Failed to save content:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to save content',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/content/hash-check
 * Check if source content has changed by comparing hashes
 */
router.post('/hash-check', async (req, res) => {
  try {
    const { grade, unit, sourceContent } = req.body;
    
    if (!sourceContent) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Source content is required for hash comparison',
          code: 'MISSING_SOURCE_CONTENT'
        }
      });
    }
    
    // Get current content hash
    const newHash = crypto.createHash('md5').update(sourceContent).digest('hex');
    
    // Check existing content hash
    const xmlPath = path.join(CONTENT_DATA_PATH, `grade-${grade}`, `${unit}.xml`);
    let existingHash = null;
    let exists = false;
    
    try {
      const existingContent = await fs.readFile(xmlPath, 'utf-8');
      existingHash = crypto.createHash('md5').update(existingContent).digest('hex');
      exists = true;
    } catch (error) {
      // File doesn't exist
    }
    
    const hasChanged = !exists || newHash !== existingHash;
    
    res.json({
      success: true,
      data: {
        exists,
        hasChanged,
        newHash,
        existingHash,
        recommendation: hasChanged ? 'process' : 'load_from_disk'
      }
    });
  } catch (error) {
    console.error('Failed to check content hash:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to check content hash',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/content/list/:grade
 * List all available units for a grade
 */
router.get('/list/:grade', async (req, res) => {
  try {
    const { grade } = req.params;
    const gradeDir = path.join(CONTENT_DATA_PATH, `grade-${grade}`);
    
    let units = [];
    
    try {
      const files = await fs.readdir(gradeDir);
      units = files
        .filter(file => file.endsWith('.xml'))
        .map(file => {
          const unit = file.replace('.xml', '');
          return { unit, xmlFile: file };
        })
        .sort((a, b) => a.unit.localeCompare(b.unit));
    } catch (error) {
      // Directory doesn't exist, return empty array
    }
    
    res.json({
      success: true,
      data: {
        grade: parseInt(grade),
        units,
        totalUnits: units.length
      }
    });
  } catch (error) {
    console.error('Failed to list content:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to list content',
        details: error.message
      }
    });
  }
});

export default router;