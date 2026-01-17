/**
 * ElevenLabs Service - API wrapper for text-to-speech generation.
 * API docs: https://elevenlabs.io/docs/api-reference
 *
 * Models:
 * - eleven_flash_v2_5: Best for Vietnamese (32 languages, fast)
 * - eleven_multilingual_v2: 29 languages, no Vietnamese
 * - eleven_turbo_v2_5: Balanced quality/speed
 */

const axios = require('axios');

const BASE_URL = 'https://api.elevenlabs.io/v1';

// Models available
const MODELS = {
  V3: 'eleven_v3',                       // Latest, most natural (no SSML support)
  FLASH_V2_5: 'eleven_flash_v2_5',       // Fast, Vietnamese support
  MULTILINGUAL_V2: 'eleven_multilingual_v2',
  TURBO_V2_5: 'eleven_turbo_v2_5'
};

// Use v3 for most natural sound
const DEFAULT_MODEL = MODELS.V3;

/**
 * Create axios instance with API key from environment.
 */
function createClient() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not set in environment');
  }

  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * List available voices from ElevenLabs.
 * @returns {Promise<Array<{voice_id, name, labels, preview_url}>>}
 */
async function listVoices() {
  const client = createClient();
  const response = await client.get('/voices');

  return response.data.voices.map(voice => ({
    voice_id: voice.voice_id,
    name: voice.name,
    labels: voice.labels || {},
    preview_url: voice.preview_url,
    category: voice.category || 'custom'
  }));
}

/**
 * Generate speech audio from text.
 * @param {string} text - Text to convert to speech
 * @param {string} voiceId - ElevenLabs voice ID
 * @param {object} options - Optional settings
 * @returns {Promise<Buffer>} Audio data as buffer (MP3)
 */
async function generateSpeech(text, voiceId, options = {}) {
  const client = createClient();

  // Speed: 0.25 (slowest) to 4.0 (fastest), default 1.0
  // Using 1.15 for slightly faster teacher pace
  const DEFAULT_SPEED = 1.15;

  const payload = {
    text: cleanTextForTTS(text),
    model_id: options.model || DEFAULT_MODEL,
    voice_settings: {
      stability: options.stability || 0.5,
      similarity_boost: options.similarityBoost || 0.75,
      style: options.style || 0,
      use_speaker_boost: options.speakerBoost !== false,
      speed: options.speed || DEFAULT_SPEED
    }
  };

  const response = await client.post(
    `/text-to-speech/${voiceId}`,
    payload,
    {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'audio/mpeg'
      }
    }
  );

  return Buffer.from(response.data);
}

/**
 * Clean text for TTS - remove inline tags but keep content.
 * Removes <eng>, <vn> tags but preserves their text content.
 * @param {string} text - Raw text with possible inline tags
 * @returns {string} Cleaned text
 */
function cleanTextForTTS(text) {
  // Remove <eng> and <vn> tags but keep content
  let cleaned = text.replace(/<(eng|vn)>([\s\S]*?)<\/\1>/gi, '$2');

  // Remove any remaining HTML-like tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Get user subscription info (for quota checking).
 * @returns {Promise<{character_count, character_limit}>}
 */
async function getSubscriptionInfo() {
  const client = createClient();
  const response = await client.get('/user/subscription');

  return {
    character_count: response.data.character_count,
    character_limit: response.data.character_limit,
    tier: response.data.tier
  };
}

module.exports = {
  listVoices,
  generateSpeech,
  cleanTextForTTS,
  getSubscriptionInfo
};
