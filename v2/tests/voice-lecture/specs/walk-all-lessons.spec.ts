import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Walk-Through Tests
 *
 * Simulates a real user pressing ArrowRight repeatedly to walk through
 * every voice lecture end-to-end. Uses test mode (speed=instant) so
 * timers resolve in ~10ms. Detects stuck states and timeouts.
 */

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Timing constants ---
const LESSON_TIMEOUT_MS = 120_000;
const ADVANCE_INTERVAL_MS = 200;
const STUCK_THRESHOLD_MS = 15_000;
const LOAD_TIMEOUT_MS = 15_000;

// --- TTS/Audio errors to ignore in headless mode ---
const IGNORABLE_ERROR_PATTERNS = [
  'speechSynthesis',
  'AudioContext',
  'NotAllowedError',
  'play() request was interrupted',
];

// --- State returned by window.__voiceLecture.getState() ---
interface LessonState {
  state: string;
  currentChunkIndex: number;
  currentTSId: string | null;
  chunkCount: number;
}

interface LessonResult {
  status: 'complete' | 'stuck' | 'timeout' | 'error';
  duration: number;
  chunksReached: number;
  totalChunks: number;
  errors: string[];
  lastState: LessonState | null;
}

// --- File discovery (mirrors content-validation.spec.ts) ---
function getLessonFiles(): string[] {
  const basePath = path.join(__dirname, '../../../data/voice-lectures');

  if (!fs.existsSync(basePath)) {
    console.warn('Voice lectures directory not found:', basePath);
    return [];
  }

  const files: string[] = [];

  function walk(dir: string) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (item.endsWith('.md')) {
        // Normalize to forward slashes for URL compatibility on Windows
        const urlPath = fullPath
          .replace(path.join(__dirname, '../../..'), '')
          .replace(/\\/g, '/');
        files.push(urlPath);
      }
    }
  }

  walk(basePath);
  return files;
}

function getTestName(filePath: string): string {
  return filePath.split('/').slice(-3).join('/');
}

function buildViewerUrl(filePath: string): string {
  // encodeURIComponent handles base64 chars (+, /, =) that break query strings.
  // Use clean URL (no .html) — serve's cleanUrls redirect strips query params.
  const encoded = encodeURIComponent(Buffer.from(filePath).toString('base64'));
  return `/voice-lecture-viewer-v2?test=true&speed=instant&c=${encoded}`;
}

function isCriticalError(message: string): boolean {
  return !IGNORABLE_ERROR_PATTERNS.some((p) => message.includes(p));
}

/**
 * Advances the lesson one step using the exposed __voiceLecture API.
 * State-driven: picks the right action based on the current state machine value,
 * avoiding CSS visibility issues with offsetParent/opacity.
 */
async function clickNextAction(page: Page): Promise<void> {
  await page.evaluate(() => {
    const api = (window as any).__voiceLecture;
    if (!api) return;

    const stateData = api.getState();
    const currentState = stateData?.state;

    // 1. TTS playing → skip it
    if (currentState === 'npc_speaking') {
      api.skipSpeaking();
      return;
    }

    // 2. NPC waiting for continue click
    if (currentState === 'npc_waiting') {
      api.npcContinue();
      return;
    }

    // 3. Timer running → skip it
    if (currentState === 'timer') {
      const activeTimer = document.querySelector<HTMLElement>('.timer-skip');
      if (activeTimer) activeTimer.click();
      return;
    }

    // 4. Vocab section active → skip vocab entirely
    if (currentState === 'vocab') {
      const vocabEl = document.querySelector('.vocab-interactive[data-status="active"]');
      if (vocabEl) {
        api.skipVocab(vocabEl.id);
      }
      return;
    }

    // 5. Chunk done → click main nav to advance
    if (currentState === 'chunk_done' || currentState === 'idle') {
      const mainNav = document.querySelector<HTMLElement>(
        '#main-nav-btn[data-ready="true"]',
      );
      if (mainNav) mainNav.click();
    }
  });
}

/**
 * Walks a single lesson by clicking action buttons repeatedly until
 * the lesson completes, gets stuck, or times out.
 */
async function walkLesson(page: Page, lessonPath: string): Promise<LessonResult> {
  const errors: string[] = [];
  const startTime = Date.now();
  let lastState: LessonState | null = null;

  // Collect console errors (filter audio noise)
  page.on('console', (msg) => {
    if (msg.type() === 'error' && isCriticalError(msg.text())) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    if (isCriticalError(err.message)) {
      errors.push(err.message);
    }
  });

  // Navigate
  await page.goto(buildViewerUrl(lessonPath));
  await page.waitForSelector('[data-testid="content"]', { timeout: LOAD_TIMEOUT_MS });

  // Stuck detection: track last state fingerprint and when it changed
  let lastFingerprint = '';
  let lastChangeTime = Date.now();

  // Advance loop: click actionable buttons in priority order
  while (true) {
    await clickNextAction(page);
    await page.waitForTimeout(ADVANCE_INTERVAL_MS);

    // Read current state
    const currentState = await page.evaluate(() => {
      const api = (window as any).__voiceLecture;
      return api?.getState?.() ?? null;
    }) as LessonState | null;

    lastState = currentState;
    const elapsed = Date.now() - startTime;

    // Success: lesson complete
    if (currentState?.state === 'complete') {
      return {
        status: 'complete',
        duration: elapsed,
        chunksReached: currentState.chunkCount,
        totalChunks: currentState.chunkCount,
        errors,
        lastState: currentState,
      };
    }

    // Build fingerprint from state + chunk index
    const fingerprint = `${currentState?.state}:${currentState?.currentChunkIndex}`;
    if (fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      lastChangeTime = Date.now();
    }

    // Stuck: no state change for STUCK_THRESHOLD_MS
    if (Date.now() - lastChangeTime > STUCK_THRESHOLD_MS) {
      return {
        status: 'stuck',
        duration: elapsed,
        chunksReached: currentState?.currentChunkIndex ?? -1,
        totalChunks: currentState?.chunkCount ?? 0,
        errors,
        lastState: currentState,
      };
    }

    // Timeout: exceeded LESSON_TIMEOUT_MS
    if (elapsed > LESSON_TIMEOUT_MS) {
      return {
        status: 'timeout',
        duration: elapsed,
        chunksReached: currentState?.currentChunkIndex ?? -1,
        totalChunks: currentState?.chunkCount ?? 0,
        errors,
        lastState: currentState,
      };
    }
  }
}

// --- Discover all lessons ---
const lessonFiles = getLessonFiles();

// --- Generate tests ---
test.describe('Walk All Lessons', () => {
  test.describe.configure({ mode: 'parallel' });

  if (lessonFiles.length === 0) {
    test.skip('No lesson files found', async () => {});
  }

  for (const filePath of lessonFiles) {
    const testName = getTestName(filePath);

    test(`walk: ${testName}`, async ({ page }) => {
      const result = await walkLesson(page, filePath);

      // Log result for debugging in HTML report
      test.info().annotations.push(
        { type: 'duration_ms', description: String(result.duration) },
        { type: 'chunks', description: `${result.chunksReached}/${result.totalChunks}` },
        { type: 'status', description: result.status },
      );

      if (result.errors.length > 0) {
        test.info().annotations.push({
          type: 'errors',
          description: result.errors.join(' | '),
        });
      }

      // Assert: lesson reached completion
      expect(
        result.status,
        `Lesson ${testName} ended with status "${result.status}" ` +
          `at chunk ${result.chunksReached}/${result.totalChunks}. ` +
          `Last state: ${JSON.stringify(result.lastState)}`,
      ).toBe('complete');

      // Assert: completion UI is visible
      await expect(page.locator('[data-testid="lesson-complete"]')).toBeVisible();

      // Assert: no critical errors
      expect(result.errors).toEqual([]);
    });
  }
});
