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

describe('Empty text handling - FIX for consecutive teacher script bug', () => {
  let audioService: MockAudioService;
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus({ recordHistory: true });
    audioService = new MockAudioService(eventBus);
  });

  describe('speakTTS with empty text', () => {
    it('should handle empty string', async () => {
      await audioService.speakTTS('', 'vi-VN');

      expect(audioService.calls).toHaveLength(1);

      // Should emit events with skipped flag
      const events = eventBus.getHistory();
      const speakEvent = events.find(e => e.event === LectureEvents.TTS_SPEAK);
      const endEvent = events.find(e => e.event === LectureEvents.TTS_END);

      expect(speakEvent).toBeDefined();
      expect(endEvent).toBeDefined();
      expect((speakEvent?.data as any).skipped).toBe(true);
      expect((endEvent?.data as any).skipped).toBe(true);
    });

    it('should handle whitespace-only string', async () => {
      await audioService.speakTTS('   \n\t   ', 'vi-VN');

      const events = eventBus.getHistory();
      const speakEvent = events.find(e => e.event === LectureEvents.TTS_SPEAK);
      expect((speakEvent?.data as any).skipped).toBe(true);
    });

    it('should handle null-like values', async () => {
      // @ts-ignore - testing runtime behavior
      await audioService.speakTTS(null, 'vi-VN');

      const events = eventBus.getHistory();
      const speakEvent = events.find(e => e.event === LectureEvents.TTS_SPEAK);
      expect((speakEvent?.data as any).skipped).toBe(true);
    });

    it('should NOT skip normal text', async () => {
      await audioService.speakTTS('Hello world', 'en-US');

      const events = eventBus.getHistory();
      const speakEvent = events.find(e => e.event === LectureEvents.TTS_SPEAK);
      expect((speakEvent?.data as any).skipped).toBe(false);
    });
  });

  describe('speakSegments with empty array', () => {
    it('should handle empty segments array', async () => {
      await audioService.speakSegments([]);

      const events = eventBus.getHistory();
      const speakEvent = events.find(e => e.event === LectureEvents.TTS_SPEAK);
      const endEvent = events.find(e => e.event === LectureEvents.TTS_END);

      expect(speakEvent).toBeDefined();
      expect(endEvent).toBeDefined();
      expect((speakEvent?.data as any).skipped).toBe(true);
      expect((endEvent?.data as any).skipped).toBe(true);
    });

    it('should NOT skip non-empty segments', async () => {
      await audioService.speakSegments([{ text: 'Hello', lang: 'en' }]);

      const events = eventBus.getHistory();
      const speakEvent = events.find(e => e.event === LectureEvents.TTS_SPEAK);
      expect((speakEvent?.data as any).skipped).toBe(false);
    });
  });

  describe('simulates the actual bug scenario', () => {
    it('should handle teacher_script with action="record" but no text', async () => {
      // This simulates what happens when we have:
      // <teacher_script pause="0" action="record"></teacher_script>
      //
      // The parser extracts:
      // - text: "" (empty)
      // - segments: [] (empty array)
      // - action: "record"
      //
      // Previously, calling speakTTS('') would hang because
      // speechSynthesis.speak('') might never fire onend.

      // Test that empty text is handled correctly
      await audioService.speakTTS('', 'vi-VN');

      // Should complete immediately without hanging
      expect(audioService.calls).toHaveLength(1);
    });

    it('should handle sequence of scripts ending with empty action script', async () => {
      // Simulates: script1 -> script2 -> script3 (with pause) -> empty script (action=record)
      await audioService.speakTTS('Ok đáp án nè', 'vi-VN');
      await audioService.speakTTS('Ai chọn câu 1 là A thì bị lừa', 'vi-VN');
      await audioService.speakTTS('Các em sửa bài', 'vi-VN');
      await audioService.speakTTS('', 'vi-VN'); // Empty action=record script

      expect(audioService.calls).toHaveLength(4);

      // All should complete, including the empty one
      const events = eventBus.getHistory();
      const endEvents = events.filter(e => e.event === LectureEvents.TTS_END);
      expect(endEvents).toHaveLength(4);
    });

    it('should handle speakSegments with empty array from parsed empty script', async () => {
      // When parser parses <teacher_script pause="0" action="record"></teacher_script>
      // it returns segments: [] (empty array)

      await audioService.speakSegments([]); // Empty segments from empty teacher_script

      // Should complete immediately
      expect(audioService.calls).toHaveLength(1);

      const events = eventBus.getHistory();
      const endEvent = events.find(e => e.event === LectureEvents.TTS_END);
      expect(endEvent).toBeDefined();
    });
  });
});
