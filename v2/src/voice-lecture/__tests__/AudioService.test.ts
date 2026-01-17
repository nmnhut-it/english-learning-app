/**
 * AudioService Unit Tests
 *
 * Tests MockAudioService since real AudioService needs browser APIs.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockAudioService } from '../services/AudioService';
import { EventBus, LectureEvents } from '../utils/EventBus';

describe('MockAudioService', () => {
  let audioService: MockAudioService;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus({ recordHistory: true });
    audioService = new MockAudioService(eventBus);
  });

  describe('speakTTS', () => {
    it('should track calls', async () => {
      await audioService.speakTTS('Hello', 'en-US');

      expect(audioService.calls).toHaveLength(1);
      expect(audioService.calls[0].method).toBe('speakTTS');
      expect(audioService.calls[0].args).toEqual(['Hello', 'en-US']);
    });

    it('should emit TTS_SPEAK and TTS_END events', async () => {
      await audioService.speakTTS('Test text', 'vi-VN');

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.TTS_SPEAK)).toBe(true);
      expect(events.some(e => e.event === LectureEvents.TTS_END)).toBe(true);
    });

    it('should use default language', async () => {
      await audioService.speakTTS('Hello');

      expect(audioService.calls[0].args).toEqual(['Hello', 'en-US']);
    });
  });

  describe('playBeep', () => {
    it('should track calls with parameters', async () => {
      await audioService.playBeep(440, 200, 'square');

      expect(audioService.calls).toHaveLength(1);
      expect(audioService.calls[0].method).toBe('playBeep');
      expect(audioService.calls[0].args).toEqual([440, 200, 'square']);
    });

    it('should emit BEEP event', async () => {
      await audioService.playBeep(880, 100);

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.BEEP)).toBe(true);
    });
  });

  describe('playRepeatSignal', () => {
    it('should track call', async () => {
      await audioService.playRepeatSignal();

      expect(audioService.calls.some(c => c.method === 'playRepeatSignal')).toBe(true);
    });
  });

  describe('playAudioFile', () => {
    it('should track calls', async () => {
      await audioService.playAudioFile('/audio/test.mp3');

      expect(audioService.calls).toHaveLength(1);
      expect(audioService.calls[0].method).toBe('playAudioFile');
      expect(audioService.calls[0].args).toEqual(['/audio/test.mp3']);
    });

    it('should emit AUDIO_PLAY and AUDIO_END events', async () => {
      await audioService.playAudioFile('/audio/test.mp3');

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.AUDIO_PLAY)).toBe(true);
      expect(events.some(e => e.event === LectureEvents.AUDIO_END)).toBe(true);
    });
  });

  describe('cancel', () => {
    it('should track call', () => {
      audioService.cancel();

      expect(audioService.calls).toHaveLength(1);
      expect(audioService.calls[0].method).toBe('cancel');
    });
  });

  describe('clearCalls', () => {
    it('should clear call history', async () => {
      await audioService.speakTTS('Hello');
      await audioService.playBeep();

      audioService.clearCalls();

      expect(audioService.calls).toHaveLength(0);
    });
  });

  describe('speakSegments', () => {
    it('should track calls with segments', async () => {
      const segments = [
        { text: 'Hello', lang: 'en' as const },
        { text: 'xin chào', lang: 'vi' as const },
      ];

      await audioService.speakSegments(segments);

      expect(audioService.calls).toHaveLength(1);
      expect(audioService.calls[0].method).toBe('speakSegments');
      expect(audioService.calls[0].args).toEqual([segments]);
    });

    it('should emit TTS_SPEAK and TTS_END events', async () => {
      const segments = [{ text: 'Test', lang: 'en' as const }];

      await audioService.speakSegments(segments);

      const events = eventBus.getHistory();
      expect(events.some(e => e.event === LectureEvents.TTS_SPEAK)).toBe(true);
      expect(events.some(e => e.event === LectureEvents.TTS_END)).toBe(true);
    });

    it('should handle single segment', async () => {
      const segments = [{ text: 'Single', lang: 'vi' as const }];

      await audioService.speakSegments(segments);

      expect(audioService.calls).toHaveLength(1);
    });

    it('should handle multiple segments', async () => {
      const segments = [
        { text: 'Bài 1', lang: 'vi' as const },
        { text: 'Listen and read', lang: 'en' as const },
        { text: 'nha.', lang: 'vi' as const },
      ];

      await audioService.speakSegments(segments);

      expect(audioService.calls).toHaveLength(1);
      expect(audioService.calls[0].args[0]).toHaveLength(3);
    });

    it('should handle empty segments array', async () => {
      await audioService.speakSegments([]);

      expect(audioService.calls).toHaveLength(1);
      expect(audioService.calls[0].args[0]).toHaveLength(0);
    });
  });

  describe('multiple operations', () => {
    it('should track all operations in order', async () => {
      await audioService.speakTTS('First', 'en-US');
      await audioService.playBeep(880);
      await audioService.speakTTS('Second', 'vi-VN');
      audioService.cancel();

      expect(audioService.calls).toHaveLength(4);
      expect(audioService.calls.map(c => c.method)).toEqual([
        'speakTTS',
        'playBeep',
        'speakTTS',
        'cancel',
      ]);
    });

    it('should track speakSegments with other operations', async () => {
      await audioService.speakTTS('First', 'en-US');
      await audioService.speakSegments([{ text: 'Hello', lang: 'en' }]);
      await audioService.playBeep(880);

      expect(audioService.calls).toHaveLength(3);
      expect(audioService.calls.map(c => c.method)).toEqual([
        'speakTTS',
        'speakSegments',
        'playBeep',
      ]);
    });
  });
});

describe('MockAudioService without EventBus', () => {
  it('should work without event bus', async () => {
    const audioService = new MockAudioService();

    await audioService.speakTTS('Hello');
    await audioService.playBeep();

    expect(audioService.calls).toHaveLength(2);
  });
});
