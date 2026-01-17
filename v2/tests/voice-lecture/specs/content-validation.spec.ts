import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Content Validation Tests
 *
 * Batch tests that verify all markdown lesson files render correctly.
 * Runs in test mode with instant timers for fast verification.
 */

// Get all lesson files
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
        // Convert to URL path
        const urlPath = fullPath.replace(path.join(__dirname, '../../..'), '');
        files.push(urlPath);
      }
    }
  }

  walk(basePath);
  return files;
}

const lessonFiles = getLessonFiles();

// Generate unique test name from file path (e.g., "g6/unit-07/getting-started.md")
function getTestName(filePath: string): string {
  const parts = filePath.split('/');
  // Get the last 3 parts: grade/unit/file
  return parts.slice(-3).join('/');
}

// Generate tests for each file
test.describe('Content Validation', () => {
  // Skip if no files found
  if (lessonFiles.length === 0) {
    test.skip('No lesson files found', async () => {});
  }

  for (const filePath of lessonFiles) {
    const testName = getTestName(filePath);

    test(`${testName} - loads without errors`, async ({ page }) => {
      const errors: string[] = [];

      // Capture console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Capture page errors
      page.on('pageerror', (err) => {
        errors.push(err.message);
      });

      // Load lesson
      const encodedPath = Buffer.from(filePath).toString('base64');
      await page.goto(`/voice-lecture-viewer-v2.html?test=true&speed=instant&c=${encodedPath}`);

      // Wait for content to load
      await page.waitForSelector('[data-testid="content"]', { timeout: 10000 });

      // Check for chunks
      const chunkCount = await page.evaluate(() => {
        return document.querySelectorAll('[data-testid^="chunk-"]').length;
      });

      expect(chunkCount).toBeGreaterThan(0);

      // Check for critical errors (ignore TTS/audio errors)
      const criticalErrors = errors.filter(
        (e) => !e.includes('speechSynthesis') && !e.includes('AudioContext')
      );

      expect(criticalErrors).toEqual([]);
    });

    test(`${testName} - has valid structure`, async ({ page }) => {
      const encodedPath = Buffer.from(filePath).toString('base64');
      await page.goto(`/voice-lecture-viewer-v2.html?test=true&speed=instant&c=${encodedPath}`);

      await page.waitForSelector('[data-testid="content"]', { timeout: 10000 });

      // Check lesson title is set
      const title = await page.locator('[data-testid="title"]').textContent();
      expect(title).not.toBe('Voice Lecture v2');

      // Check chunks have navigation
      const chunks = await page.locator('[data-testid^="chunk-"]').all();
      for (const chunk of chunks) {
        const index = await chunk.getAttribute('data-index');
        const nav = page.locator(`[data-testid="chunk-nav-${index}"]`);
        await expect(nav).toBeAttached();
      }
    });

    test(`${testName} - can navigate through chunks`, async ({ page }) => {
      const encodedPath = Buffer.from(filePath).toString('base64');
      await page.goto(`/voice-lecture-viewer-v2.html?test=true&speed=instant&c=${encodedPath}`);

      await page.waitForSelector('[data-testid="content"]', { timeout: 10000 });

      // Get chunk count
      const chunkCount = await page.evaluate(
        () => (window as any).__voiceLecture?.getChunks()?.length ?? 0
      );

      // Try to navigate through first 3 chunks (or all if less)
      const maxChunks = Math.min(chunkCount, 3);

      for (let i = 0; i < maxChunks; i++) {
        // Wait for continue button to be ready
        await page.waitForSelector(
          `[data-testid="continue-btn-${i}"][data-ready="true"]`,
          { timeout: 30000 }
        );

        // Click if not the last chunk we're testing
        if (i < maxChunks - 1) {
          await page.click(`[data-testid="continue-btn-${i}"]`);
          await page.waitForTimeout(100);
        }
      }
    });
  }
});

test.describe('Vocabulary Content Validation', () => {
  for (const filePath of lessonFiles) {
    const testName = getTestName(filePath);

    test(`${testName} - vocabulary sections parse correctly`, async ({ page }) => {
      const encodedPath = Buffer.from(filePath).toString('base64');
      await page.goto(`/voice-lecture-viewer-v2.html?test=true&speed=instant&c=${encodedPath}`);

      await page.waitForSelector('[data-testid="content"]', { timeout: 10000 });

      // Find all vocab sections
      const vocabSections = await page.locator('[data-testid^="vocab-"]').all();

      for (const vocab of vocabSections) {
        const id = await vocab.getAttribute('data-testid');

        // Check it has progress dots (means words were parsed)
        const dots = await vocab.locator('[data-testid$="-dot-0"]').count();
        expect(dots).toBeGreaterThan(0);

        // Check phases exist
        const flashcard = await vocab.locator('[data-testid$="-phase-flashcard"]').count();
        const quiz = await vocab.locator('[data-testid$="-phase-quiz"]').count();
        expect(flashcard).toBe(1);
        expect(quiz).toBe(1);
      }
    });
  }
});

// Quick smoke test for specific important files
test.describe('Critical Lessons', () => {
  const criticalLessons = [
    '/data/voice-lectures/g6/unit-07/getting-started.md',
    '/data/voice-lectures/g7/unit-07/getting-started.md',
  ];

  for (const lessonPath of criticalLessons) {
    // Use last 3 parts for unique test name
    const shortName = lessonPath.split('/').slice(-3).join('/');

    test(`${shortName} - full navigation test`, async ({ page }) => {
      // Check if file exists first
      const fullPath = path.join(__dirname, '../../..', lessonPath);
      if (!fs.existsSync(fullPath)) {
        test.skip();
        return;
      }

      const encodedPath = Buffer.from(lessonPath).toString('base64');
      await page.goto(`/voice-lecture-viewer-v2.html?test=true&speed=instant&c=${encodedPath}`);

      await page.waitForSelector('[data-testid="content"]', { timeout: 10000 });

      // Navigate through ALL chunks
      const chunkCount = await page.evaluate(
        () => (window as any).__voiceLecture?.getChunks()?.length ?? 0
      );

      for (let i = 0; i < chunkCount; i++) {
        await page.waitForSelector(
          `[data-testid="continue-btn-${i}"][data-ready="true"]`,
          { timeout: 60000 }
        );
        await page.click(`[data-testid="continue-btn-${i}"]`);
      }

      // Should show complete
      await expect(page.locator('[data-testid="lesson-complete"]')).toBeVisible();
    });
  }
});
