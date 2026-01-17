import { test, expect, Page } from '@playwright/test';

/**
 * Voice Lecture Navigation Tests
 *
 * Tests chunk navigation flow, teacher scripts, and timers.
 */

// Helper to load a lesson with test mode
async function loadLesson(page: Page, lessonPath: string) {
  const encodedPath = btoa(lessonPath);
  await page.goto(`/voice-lecture-viewer-v2.html?test=true&speed=instant&c=${encodedPath}`);

  // Wait for lesson to load
  await page.waitForSelector('[data-testid="chunk-0"]');
}

// Helper to wait for state change
async function waitForState(page: Page, expectedState: string) {
  await page.waitForFunction(
    (state) => (window as any).__voiceLecture?.getState()?.state === state,
    expectedState,
    { timeout: 5000 }
  );
}

// Helper to wait for event
async function waitForEvent(page: Page, eventName: string) {
  return page.evaluate(
    (name) => (window as any).__voiceLecture.waitForEvent(name, 5000),
    eventName
  );
}

test.describe('Chunk Navigation', () => {
  test('should load lesson and show first chunk as active', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    // First chunk should be active
    const chunk0 = page.locator('[data-testid="chunk-0"]');
    await expect(chunk0).toHaveAttribute('data-status', 'active');

    // Other chunks should be pending
    const chunk1 = page.locator('[data-testid="chunk-1"]');
    await expect(chunk1).toHaveAttribute('data-status', 'pending');
  });

  test('should advance to next chunk when continue button clicked', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    // Wait for chunk to complete
    await page.waitForSelector('[data-testid="continue-btn-0"][data-ready="true"]', { timeout: 10000 });

    // Click continue
    await page.click('[data-testid="continue-btn-0"]');

    // Verify chunk 1 is now active
    await expect(page.locator('[data-testid="chunk-1"]')).toHaveAttribute('data-status', 'active');
    await expect(page.locator('[data-testid="chunk-0"]')).toHaveAttribute('data-status', 'completed');
  });

  test('should update progress bar as chunks complete', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    // Get initial progress
    const initialWidth = await page.locator('[data-testid="progress-fill"]').evaluate(
      (el) => parseFloat(getComputedStyle(el).width)
    );

    // Wait and advance
    await page.waitForSelector('[data-testid="continue-btn-0"][data-ready="true"]', { timeout: 10000 });
    await page.click('[data-testid="continue-btn-0"]');

    // Progress should increase
    await page.waitForFunction(() => {
      const fill = document.querySelector('[data-testid="progress-fill"]') as HTMLElement;
      return parseFloat(fill.style.width) > 25;
    });
  });

  test('should show lesson complete when all chunks done', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    // Navigate through all chunks
    const chunkCount = await page.evaluate(() => (window as any).__voiceLecture.getChunks().length);

    for (let i = 0; i < chunkCount; i++) {
      await page.waitForSelector(`[data-testid="continue-btn-${i}"][data-ready="true"]`, { timeout: 10000 });
      await page.click(`[data-testid="continue-btn-${i}"]`);
    }

    // Lesson complete should show
    await expect(page.locator('[data-testid="lesson-complete"]')).toBeVisible();
  });
});

test.describe('Teacher Script Flow', () => {
  test('should play teacher scripts in sequence', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    // First TS should be played (marked as played)
    await page.waitForFunction(() => {
      const ts = document.querySelector('[data-testid^="ts-ts-0"]');
      return ts?.getAttribute('data-played') === 'true';
    }, { timeout: 5000 });
  });

  test('should show timer when TS has pause > 0', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    // Wait for TS with timer to activate (ts-1 has pause=5)
    await page.waitForSelector('[data-testid^="timer-ts-"][data-active="true"]', { timeout: 10000 });

    // Timer should be visible
    const timer = page.locator('[data-testid^="timer-ts-"][data-active="true"]');
    await expect(timer).toBeVisible();
  });

  test('should skip timer when skip button clicked', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    // Wait for timer
    const timerSelector = '[data-testid^="timer-ts-"][data-active="true"]';
    await page.waitForSelector(timerSelector, { timeout: 10000 });

    // Click skip
    await page.click('[data-testid^="timer-skip-"]');

    // Timer should disappear
    await expect(page.locator(timerSelector)).not.toBeVisible();
  });
});

test.describe('State Inspection', () => {
  test('should expose state via window.__voiceLecture', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    const state = await page.evaluate(() => (window as any).__voiceLecture.getState());

    expect(state).toHaveProperty('currentChunkIndex');
    expect(state).toHaveProperty('state');
    expect(state).toHaveProperty('chunkCount');
  });

  test('should track event history in test mode', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    // Wait a bit for events
    await page.waitForTimeout(1000);

    const history = await page.evaluate(() => (window as any).__voiceLecture.getEventHistory());

    expect(history.length).toBeGreaterThan(0);
    expect(history.some((e: any) => e.event === 'lesson:load')).toBe(true);
  });

  test('should get progress info', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    const progress = await page.evaluate(() => (window as any).__voiceLecture.getProgress());

    expect(progress).toHaveProperty('current');
    expect(progress).toHaveProperty('total');
    expect(progress).toHaveProperty('percentage');
    expect(progress.current).toBe(1);
  });
});

test.describe('Content Rendering', () => {
  test('should render dialogue boxes', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    // Navigate to exercise chunk
    await page.waitForSelector('[data-testid="continue-btn-0"][data-ready="true"]', { timeout: 10000 });
    await page.click('[data-testid="continue-btn-0"]');
    await page.waitForSelector('[data-testid="continue-btn-1"][data-ready="true"]', { timeout: 10000 });
    await page.click('[data-testid="continue-btn-1"]');

    // Dialogue should be rendered
    await expect(page.locator('[data-testid="dialogue"]')).toBeVisible();
  });

  test('should render task boxes', async ({ page }) => {
    await loadLesson(page, '/tests/voice-lecture/fixtures/minimal-lesson.md');

    // Navigate to exercise chunk
    await page.waitForSelector('[data-testid="continue-btn-0"][data-ready="true"]', { timeout: 10000 });
    await page.click('[data-testid="continue-btn-0"]');
    await page.waitForSelector('[data-testid="continue-btn-1"][data-ready="true"]', { timeout: 10000 });
    await page.click('[data-testid="continue-btn-1"]');

    // Task should be rendered
    await expect(page.locator('[data-testid="task"]')).toBeVisible();
  });
});
