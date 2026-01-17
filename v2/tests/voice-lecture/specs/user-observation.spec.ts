import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * User Observation Tests
 *
 * These tests launch a visible browser and walk through lessons
 * at a pace you can observe. Run with:
 *
 *   npm run test:e2e:headed -- specs/user-observation.spec.ts
 *
 * Options:
 *   --headed          Show browser window
 *   --slowMo=1000     Slow down actions by 1 second each
 *   --project=chromium  Use Chrome (default)
 */

// Test mode options
const TEST_OPTIONS = {
  // Skip vocab games (use instant mode for vocab phases)
  skipVocabGames: true,
  // Pause between chunks for observation
  chunkPauseMs: 500,
  // Timeout for waiting on elements
  defaultTimeout: 30000,
};

// Helper to load a lesson for observation
async function loadLessonForObservation(
  page: Page,
  lessonPath: string,
  options: { skipVocab?: boolean } = {}
) {
  const skipVocab = options.skipVocab ?? TEST_OPTIONS.skipVocabGames;

  // test=true enables test mode, speed=instant makes timers instant
  const speed = skipVocab ? 'instant' : '10'; // 10x faster if not skipping
  const encodedPath = Buffer.from(lessonPath).toString('base64');
  const url = `/voice-lecture-viewer-v2.html?test=true&speed=${speed}&c=${encodedPath}`;

  console.log(`\n📖 Loading lesson: ${lessonPath}`);
  console.log(`🔗 URL: ${url}`);

  await page.goto(url);
  await page.waitForSelector('[data-testid="chunk-0"]', { timeout: TEST_OPTIONS.defaultTimeout });

  const title = await page.locator('[data-testid="title"]').textContent();
  console.log(`📚 Title: ${title}`);
}

// Helper to wait for chunk to be ready to advance
async function waitForChunkReady(page: Page, chunkIndex: number) {
  console.log(`⏳ Waiting for chunk ${chunkIndex} to complete...`);

  await page.waitForSelector(
    `[data-testid="continue-btn-${chunkIndex}"][data-ready="true"]`,
    { timeout: 120000 } // 2 min timeout for vocab-heavy chunks
  );

  console.log(`✅ Chunk ${chunkIndex} ready`);
}

// Helper to advance to next chunk
async function advanceChunk(page: Page, chunkIndex: number) {
  console.log(`➡️ Advancing from chunk ${chunkIndex}`);

  await page.click(`[data-testid="continue-btn-${chunkIndex}"]`);
  await page.waitForTimeout(TEST_OPTIONS.chunkPauseMs);
}

// Helper to get lesson info
async function getLessonInfo(page: Page) {
  return page.evaluate(() => ({
    title: (window as any).__voiceLecture?.getProgress()?.total ?? 0,
    chunks: (window as any).__voiceLecture?.getChunks() ?? [],
    state: (window as any).__voiceLecture?.getState() ?? {},
  }));
}

// ============ OBSERVATION TESTS ============

test.describe('User Observation - Watch the automation', () => {
  test.describe.configure({ mode: 'serial' }); // Run in order

  test('G6 Unit 7 Getting Started - full walkthrough', async ({ page }) => {
    const lessonPath = '/data/voice-lectures/g6/unit-07/getting-started.md';
    const fullPath = path.join(__dirname, '../../..', lessonPath);

    if (!fs.existsSync(fullPath)) {
      console.log('⚠️ Lesson file not found, skipping');
      test.skip();
      return;
    }

    await loadLessonForObservation(page, lessonPath, { skipVocab: true });

    const info = await getLessonInfo(page);
    console.log(`📊 Total chunks: ${info.chunks.length}`);

    // Walk through each chunk
    for (let i = 0; i < info.chunks.length; i++) {
      const chunk = info.chunks[i];
      console.log(`\n--- Chunk ${i}: ${chunk.title || chunk.id} ---`);

      await waitForChunkReady(page, i);

      // Take screenshot
      await page.screenshot({
        path: `/tmp/voice-lecture-observation/g6-getting-started-chunk-${i}.png`,
        fullPage: true,
      });

      await advanceChunk(page, i);
    }

    // Wait for lesson complete
    await expect(page.locator('[data-testid="lesson-complete"]')).toBeVisible({ timeout: 10000 });
    console.log('\n🎉 Lesson complete!');

    await page.screenshot({
      path: '/tmp/voice-lecture-observation/g6-getting-started-complete.png',
    });
  });

  test('G6 Unit 7 A Closer Look 1 - vocabulary and pronunciation', async ({ page }) => {
    const lessonPath = '/data/voice-lectures/g6/unit-07/a-closer-look-1.md';
    const fullPath = path.join(__dirname, '../../..', lessonPath);

    if (!fs.existsSync(fullPath)) {
      console.log('⚠️ Lesson file not found, skipping');
      test.skip();
      return;
    }

    await loadLessonForObservation(page, lessonPath, { skipVocab: true });

    const info = await getLessonInfo(page);
    console.log(`📊 Total chunks: ${info.chunks.length}`);

    for (let i = 0; i < Math.min(info.chunks.length, 5); i++) {
      // First 5 chunks
      console.log(`\n--- Chunk ${i} ---`);
      await waitForChunkReady(page, i);
      await advanceChunk(page, i);
    }

    console.log('\n✅ Observation complete (first 5 chunks)');
  });
});

test.describe('Vocabulary Flow - Observe all phases', () => {
  test('vocabulary flashcard and quiz phases', async ({ page }) => {
    const lessonPath = '/tests/voice-lecture/fixtures/minimal-lesson.md';

    // Use fast but visible speed
    const encodedPath = Buffer.from(lessonPath).toString('base64');
    await page.goto(`/voice-lecture-viewer-v2.html?test=true&speed=100&c=${encodedPath}`);

    await page.waitForSelector('[data-testid="chunk-0"]');
    console.log('📖 Loaded minimal lesson');

    // Navigate to vocabulary chunk
    await page.waitForSelector('[data-testid="continue-btn-0"][data-ready="true"]', { timeout: 30000 });
    await page.click('[data-testid="continue-btn-0"]');
    console.log('➡️ Advanced to vocab chunk');

    // Wait for vocab component
    await page.waitForSelector('[data-testid^="vocab-"]', { timeout: 10000 });
    console.log('📚 Vocabulary component visible');

    // Click start
    await page.click('[data-testid$="-start-btn"]');
    console.log('▶️ Started vocabulary flashcard');

    // Wait for flashcard phase to complete and quiz to start
    await page.waitForSelector('[data-testid$="-phase-quiz"][data-active="true"]', { timeout: 120000 });
    console.log('❓ Quiz phase started');

    // Answer quiz questions
    const words = ['talent show', 'programme', 'cartoon'];
    const meanings = ['chương trình tài năng', 'chương trình', 'phim hoạt hình'];

    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(500);

      // Get current quiz word
      const currentWord = await page.locator('[data-testid$="-quiz-word"]').textContent();
      console.log(`❓ Quiz question ${i + 1}: ${currentWord}`);

      // Find correct answer
      const wordIndex = words.findIndex(w => w === currentWord);
      if (wordIndex >= 0) {
        const correctMeaning = meanings[wordIndex];
        const correctOption = page.locator('[data-testid$="-option"]').filter({ hasText: correctMeaning });

        if (await correctOption.count() > 0) {
          await correctOption.click();
          console.log(`✅ Answered: ${correctMeaning}`);
        }
      }

      await page.waitForTimeout(1000);
    }

    // Wait for writing phase
    await page.waitForSelector('[data-testid$="-phase-writing"][data-active="true"]', { timeout: 30000 });
    console.log('✍️ Writing phase started');

    // Skip writing
    await page.click('[data-testid$="-skip-writing"]');
    console.log('⏭️ Skipped writing');

    // Wait for game phase
    await page.waitForSelector('[data-testid$="-phase-game"][data-active="true"]', { timeout: 10000 });
    console.log('🎮 Game phase started');

    // Play matching game
    for (let i = 0; i < words.length; i++) {
      const word = page.locator('[data-testid$="-game-word"]').filter({ hasText: words[i] });
      const meaning = page.locator('[data-testid$="-game-meaning"]').filter({ hasText: meanings[i] });

      await word.click();
      await page.waitForTimeout(200);
      await meaning.click();
      console.log(`🎯 Matched: ${words[i]} = ${meanings[i]}`);
      await page.waitForTimeout(500);
    }

    // Wait for complete phase
    await page.waitForSelector('[data-testid$="-phase-complete"][data-active="true"]', { timeout: 10000 });
    console.log('🎉 Vocabulary complete!');
  });
});

test.describe('Real Lesson Walkthrough - Interactive', () => {
  // This test walks through a real lesson with pauses for observation

  test('G7 Unit 7 Getting Started - observe teacher scripts and content', async ({ page }) => {
    const lessonPath = '/data/voice-lectures/g7/unit-07/getting-started.md';
    const fullPath = path.join(__dirname, '../../..', lessonPath);

    if (!fs.existsSync(fullPath)) {
      test.skip();
      return;
    }

    // Load with 10x speed (faster but still observable)
    const encodedPath = Buffer.from(lessonPath).toString('base64');
    await page.goto(`/voice-lecture-viewer-v2.html?test=true&speed=10&c=${encodedPath}`);

    await page.waitForSelector('[data-testid="chunk-0"]');

    const title = await page.locator('[data-testid="title"]').textContent();
    console.log(`\n📚 Lesson: ${title}`);

    // Get chunk count
    const chunkCount = await page.evaluate(
      () => (window as any).__voiceLecture?.getChunks()?.length ?? 0
    );
    console.log(`📊 Chunks: ${chunkCount}`);

    // Walk through first 3 chunks with observation
    const maxChunks = Math.min(chunkCount, 3);

    for (let i = 0; i < maxChunks; i++) {
      // Get chunk info
      const chunkTitle = await page.locator(`[data-testid="chunk-title-${i}"]`).textContent().catch(() => `Chunk ${i}`);
      console.log(`\n--- ${chunkTitle} ---`);

      // Check for vocabulary
      const hasVocab = await page.locator(`#chunk-${i} [data-testid^="vocab-"]`).count() > 0;
      if (hasVocab) {
        console.log('📚 Contains vocabulary section');

        // Wait for vocab to be ready, then start
        await page.waitForSelector('[data-testid$="-start-btn"]', { timeout: 30000 });
        await page.click('[data-testid$="-start-btn"]');

        // Wait for vocab to complete (skipping through phases)
        await page.waitForSelector('[data-testid$="-phase-writing"][data-active="true"]', { timeout: 120000 });
        await page.click('[data-testid$="-skip-writing"]');

        // Quick game completion
        await page.waitForSelector('[data-testid$="-phase-game"][data-active="true"]', { timeout: 10000 });

        // Match all pairs quickly
        const gameWords = await page.locator('[data-testid$="-game-word"]').all();
        for (const wordEl of gameWords) {
          const wordText = await wordEl.getAttribute('data-word');
          if (wordText) {
            await wordEl.click();
            const meaningEl = page.locator(`[data-testid$="-game-meaning"][data-word="${wordText}"]`);
            await meaningEl.click();
            await page.waitForTimeout(100);
          }
        }

        // Finish vocab
        await page.waitForSelector('[data-testid$="-phase-complete"][data-active="true"]', { timeout: 10000 });
        await page.click('[data-testid$="-finish-btn"]');
      }

      // Wait for chunk to complete
      await waitForChunkReady(page, i);

      // Log what we see
      const hasDialogue = await page.locator(`#chunk-${i} [data-testid="dialogue"]`).count() > 0;
      const hasTask = await page.locator(`#chunk-${i} [data-testid="task"]`).count() > 0;
      const hasAnswer = await page.locator(`#chunk-${i} [data-testid="answer"]`).count() > 0;

      if (hasDialogue) console.log('💬 Contains dialogue');
      if (hasTask) console.log('📝 Contains task');
      if (hasAnswer) console.log('✅ Contains answer');

      // Advance
      if (i < maxChunks - 1) {
        await advanceChunk(page, i);
      }
    }

    console.log('\n✅ Observation complete');
  });
});

// ============ SPEED TEST - Run full lesson fast ============

test.describe('Speed Test - Full lesson completion', () => {
  test('G6 Getting Started - instant mode full completion', async ({ page }) => {
    const lessonPath = '/data/voice-lectures/g6/unit-07/getting-started.md';
    const fullPath = path.join(__dirname, '../../..', lessonPath);

    if (!fs.existsSync(fullPath)) {
      test.skip();
      return;
    }

    // Instant mode
    const encodedPath = Buffer.from(lessonPath).toString('base64');
    await page.goto(`/voice-lecture-viewer-v2.html?test=true&speed=instant&c=${encodedPath}`);

    await page.waitForSelector('[data-testid="chunk-0"]');

    const chunkCount = await page.evaluate(
      () => (window as any).__voiceLecture?.getChunks()?.length ?? 0
    );

    console.log(`⚡ Speed test: ${chunkCount} chunks`);
    const startTime = Date.now();

    for (let i = 0; i < chunkCount; i++) {
      // Handle vocabulary if present
      const vocabBtn = page.locator(`#chunk-${i} [data-testid$="-start-btn"]`);
      if (await vocabBtn.count() > 0) {
        await vocabBtn.click();

        // Skip through vocab phases
        await page.waitForSelector('[data-testid$="-phase-writing"][data-active="true"]', { timeout: 120000 });
        await page.click('[data-testid$="-skip-writing"]');

        // Auto-complete game
        await page.waitForSelector('[data-testid$="-phase-game"][data-active="true"]', { timeout: 10000 });
        const gameWords = await page.locator('[data-testid$="-game-word"]').all();
        for (const wordEl of gameWords) {
          const wordText = await wordEl.getAttribute('data-word');
          if (wordText) {
            await wordEl.click();
            await page.locator(`[data-testid$="-game-meaning"][data-word="${wordText}"]`).click();
          }
        }

        await page.waitForSelector('[data-testid$="-phase-complete"][data-active="true"]', { timeout: 10000 });
        await page.click('[data-testid$="-finish-btn"]');
      }

      await page.waitForSelector(`[data-testid="continue-btn-${i}"][data-ready="true"]`, { timeout: 60000 });
      await page.click(`[data-testid="continue-btn-${i}"]`);
    }

    const elapsed = Date.now() - startTime;
    console.log(`⏱️ Completed in ${(elapsed / 1000).toFixed(1)}s`);

    await expect(page.locator('[data-testid="lesson-complete"]')).toBeVisible({ timeout: 10000 });
  });
});
