/**
 * Audio Service - Save and manage generated audio files.
 * Audio files stored in: v2/audio/
 */

const fs = require('fs').promises;
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '../../v2/audio');

/**
 * Ensure audio directory exists.
 */
async function ensureAudioDir() {
  await fs.mkdir(AUDIO_DIR, { recursive: true });
}

/**
 * Save audio buffer to file.
 * @param {Buffer} buffer - Audio data
 * @param {string} filename - Filename (e.g., ts_g6_unit07_getting-started_003_a1b2c3d4.mp3)
 * @returns {Promise<{path: string, relativePath: string}>}
 */
async function saveAudio(buffer, filename) {
  await ensureAudioDir();

  const absolutePath = path.join(AUDIO_DIR, filename);
  await fs.writeFile(absolutePath, buffer);

  // Return relative path for href attribute
  const relativePath = `audio/${filename}`;

  return {
    path: absolutePath,
    relativePath
  };
}

/**
 * Check if audio file exists.
 * @param {string} filename - Audio filename
 * @returns {Promise<boolean>}
 */
async function audioExists(filename) {
  try {
    const absolutePath = path.join(AUDIO_DIR, filename);
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get absolute path for audio file.
 * @param {string} filename - Audio filename
 * @returns {string}
 */
function getAudioPath(filename) {
  return path.join(AUDIO_DIR, filename);
}

/**
 * Delete audio file.
 * @param {string} filename - Audio filename
 */
async function deleteAudio(filename) {
  const absolutePath = path.join(AUDIO_DIR, filename);
  await fs.unlink(absolutePath);
}

/**
 * List all audio files in directory.
 * @returns {Promise<string[]>} Array of filenames
 */
async function listAudioFiles() {
  await ensureAudioDir();
  const files = await fs.readdir(AUDIO_DIR);
  return files.filter(f => f.endsWith('.mp3'));
}

module.exports = {
  saveAudio,
  audioExists,
  getAudioPath,
  deleteAudio,
  listAudioFiles,
  AUDIO_DIR
};
