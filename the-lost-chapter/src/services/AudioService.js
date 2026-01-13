/**
 * AudioService - Advanced audio handling with caching
 */

const CACHE_NAME = 'tlc-audio-cache';

export const AudioService = {
  audioContext: null,
  audioCache: new Map(),

  /**
   * Initialize Web Audio API
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  },

  /**
   * Load and cache audio buffer
   */
  async loadAudio(url) {
    // Check memory cache
    if (this.audioCache.has(url)) {
      return this.audioCache.get(url);
    }

    // Check browser cache
    const cached = await this.getFromCache(url);
    if (cached) {
      const buffer = await this.decodeAudio(cached);
      this.audioCache.set(url, buffer);
      return buffer;
    }

    // Fetch and cache
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load audio: ${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    await this.saveToCache(url, arrayBuffer);

    const buffer = await this.decodeAudio(arrayBuffer);
    this.audioCache.set(url, buffer);
    return buffer;
  },

  /**
   * Decode audio data
   */
  async decodeAudio(arrayBuffer) {
    this.init();
    return this.audioContext.decodeAudioData(arrayBuffer.slice(0));
  },

  /**
   * Play audio buffer
   */
  playBuffer(buffer, startTime = 0) {
    this.init();
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0, startTime);
    return source;
  },

  /**
   * Cache operations using Cache API
   */
  async getFromCache(url) {
    if (!('caches' in window)) return null;
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(url);
      return response ? response.arrayBuffer() : null;
    } catch {
      return null;
    }
  },

  async saveToCache(url, arrayBuffer) {
    if (!('caches' in window)) return;
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(arrayBuffer);
      await cache.put(url, response);
    } catch (e) {
      console.warn('Failed to cache audio:', e);
    }
  },

  /**
   * Clear audio cache
   */
  async clearCache() {
    this.audioCache.clear();
    if ('caches' in window) {
      await caches.delete(CACHE_NAME);
    }
  }
};
