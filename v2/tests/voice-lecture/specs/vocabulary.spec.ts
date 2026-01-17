import { test, expect, Page } from '@playwright/test';

/**
 * Vocabulary Interactive System Tests
 *
 * Tests the multi-phase vocabulary learning flow:
 * flashcard -> quiz -> writing -> game -> complete
 */

async function loadVocabLesson(page: Page) {
  // Use a lesson with vocabulary
  const lessonPath = '/tests/voice-lecture/fixtures/minimal-lesson.md';
  const encodedPath = btoa(lessonPath);
  await page.goto(`/voice-lecture-viewer-v2.html?test=true&speed=instant&c=${encodedPath}`);

  // Wait for load
  await page.waitForSelector('[data-testid="chunk-0"]');

  // Navigate to vocabulary chunk (chunk-1)
  await page.waitForSelector('[data-testid="continue-btn-0"][data-ready="true"]', { timeout: 10000 });
  await page.click('[data-testid="continue-btn-0"]');

  // Wait for vocab chunk
  await page.waitForSelector('[data-testid^="vocab-"]', { timeout: 10000 });
}

test.describe('Vocabulary Phases', () => {
  test('should render vocabulary interactive component', async ({ page }) => {
    await loadVocabLesson(page);

    // Vocab container should exist
    const vocab = page.locator('[data-testid^="vocab-"]').first();
    await expect(vocab).toBeVisible();
    await expect(vocab).toHaveAttribute('data-status', 'active');
  });

  test('should start on flashcard phase', async ({ page }) => {
    await loadVocabLesson(page);

    const vocab = page.locator('[data-testid^="vocab-"]').first();
    await expect(vocab).toHaveAttribute('data-phase', 'flashcard');

    // Flashcard phase should be active
    const flashcardPhase = page.locator('[data-testid$="-phase-flashcard"][data-active="true"]');
    await expect(flashcardPhase).toBeVisible();
  });

  test('should show start button on flashcard phase', async ({ page }) => {
    await loadVocabLesson(page);

    const startBtn = page.locator('[data-testid$="-start-btn"]').first();
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toHaveText('Bắt đầu học');
  });

  test('should have progress dots for each word', async ({ page }) => {
    await loadVocabLesson(page);

    // Should have 3 dots (3 words in fixture)
    const dots = page.locator('[data-testid$="-dot-0"], [data-testid$="-dot-1"], [data-testid$="-dot-2"]');
    await expect(dots).toHaveCount(3);
  });
});

test.describe('Flashcard Phase', () => {
  test('should start flashcard when button clicked', async ({ page }) => {
    await loadVocabLesson(page);

    // Click start
    await page.click('[data-testid$="-start-btn"]');

    // Wait for first word to show
    await page.waitForFunction(() => {
      const word = document.querySelector('[data-testid$="-word"]');
      return word?.textContent === 'talent show';
    }, { timeout: 5000 });
  });

  test('should flip card to show meaning', async ({ page }) => {
    await loadVocabLesson(page);
    await page.click('[data-testid$="-start-btn"]');

    // Wait for flip
    await page.waitForSelector('[data-testid$="-flashcard"][data-flipped="true"]', { timeout: 10000 });

    // Meaning should be visible
    const meaning = page.locator('[data-testid$="-meaning"]');
    await expect(meaning).toContainText('chương trình tài năng');
  });

  test('should update progress dots as words complete', async ({ page }) => {
    await loadVocabLesson(page);
    await page.click('[data-testid$="-start-btn"]');

    // Wait for first dot to be done
    await page.waitForSelector('[data-testid$="-dot-0"][data-status="done"]', { timeout: 30000 });
  });

  test('should transition to quiz phase after all words', async ({ page }) => {
    await loadVocabLesson(page);
    await page.click('[data-testid$="-start-btn"]');

    // Wait for quiz phase
    await page.waitForSelector('[data-testid$="-phase-quiz"][data-active="true"]', { timeout: 60000 });

    const vocab = page.locator('[data-testid^="vocab-"]').first();
    await expect(vocab).toHaveAttribute('data-phase', 'quiz');
  });
});

test.describe('Quiz Phase', () => {
  async function goToQuizPhase(page: Page) {
    await loadVocabLesson(page);
    await page.click('[data-testid$="-start-btn"]');
    await page.waitForSelector('[data-testid$="-phase-quiz"][data-active="true"]', { timeout: 60000 });
  }

  test('should show quiz question', async ({ page }) => {
    await goToQuizPhase(page);

    const quizWord = page.locator('[data-testid$="-quiz-word"]');
    await expect(quizWord).toBeVisible();
  });

  test('should show multiple choice options', async ({ page }) => {
    await goToQuizPhase(page);

    const options = page.locator('[data-testid$="-option"]');
    await expect(options).toHaveCount(4);
  });

  test('should mark correct answer when selected', async ({ page }) => {
    await goToQuizPhase(page);

    // Find and click correct answer (in test mode, order is deterministic)
    // The correct answer for "talent show" is "chương trình tài năng"
    const correctOption = page.locator('[data-testid$="-option"]').filter({ hasText: 'chương trình tài năng' });
    await correctOption.click();

    // Should be marked correct
    await expect(correctOption).toHaveAttribute('data-result', 'correct');
  });

  test('should mark wrong answer when incorrect selected', async ({ page }) => {
    await goToQuizPhase(page);

    // Click a wrong answer
    const wrongOption = page.locator('[data-testid$="-option"]').filter({ hasText: 'phim hoạt hình' });
    await wrongOption.click();

    // Should be marked wrong
    await expect(wrongOption).toHaveAttribute('data-result', 'wrong');
  });
});

test.describe('Writing Phase', () => {
  async function goToWritingPhase(page: Page) {
    await loadVocabLesson(page);
    await page.click('[data-testid$="-start-btn"]');

    // Complete flashcard and quiz phases
    await page.waitForSelector('[data-testid$="-phase-writing"][data-active="true"]', { timeout: 120000 });
  }

  test('should show writing timer', async ({ page }) => {
    await goToWritingPhase(page);

    const timer = page.locator('[data-testid$="-writing-time"]');
    await expect(timer).toBeVisible();
  });

  test('should have skip button', async ({ page }) => {
    await goToWritingPhase(page);

    const skipBtn = page.locator('[data-testid$="-skip-writing"]');
    await expect(skipBtn).toBeVisible();
  });

  test('should skip to game phase when skip clicked', async ({ page }) => {
    await goToWritingPhase(page);

    await page.click('[data-testid$="-skip-writing"]');

    await page.waitForSelector('[data-testid$="-phase-game"][data-active="true"]', { timeout: 10000 });
  });
});

test.describe('Game Phase', () => {
  async function goToGamePhase(page: Page) {
    await loadVocabLesson(page);
    await page.click('[data-testid$="-start-btn"]');

    // Wait for writing then skip
    await page.waitForSelector('[data-testid$="-phase-writing"][data-active="true"]', { timeout: 120000 });
    await page.click('[data-testid$="-skip-writing"]');

    await page.waitForSelector('[data-testid$="-phase-game"][data-active="true"]', { timeout: 10000 });
  }

  test('should show game grid', async ({ page }) => {
    await goToGamePhase(page);

    const game = page.locator('[data-testid$="-game"]');
    await expect(game).toBeVisible();
  });

  test('should have words and meanings columns', async ({ page }) => {
    await goToGamePhase(page);

    const words = page.locator('[data-testid$="-game-word"]');
    const meanings = page.locator('[data-testid$="-game-meaning"]');

    await expect(words).toHaveCount(3);
    await expect(meanings).toHaveCount(3);
  });

  test('should select item when clicked', async ({ page }) => {
    await goToGamePhase(page);

    const firstWord = page.locator('[data-testid$="-game-word"]').first();
    await firstWord.click();

    await expect(firstWord).toHaveAttribute('data-selected', 'true');
  });

  test('should match correct pairs', async ({ page }) => {
    await goToGamePhase(page);

    // Click "talent show"
    const talentShow = page.locator('[data-testid$="-game-word"]').filter({ hasText: 'talent show' });
    await talentShow.click();

    // Click matching meaning
    const meaning = page.locator('[data-testid$="-game-meaning"]').filter({ hasText: 'chương trình tài năng' });
    await meaning.click();

    // Both should be matched
    await expect(talentShow).toHaveAttribute('data-matched', 'true');
    await expect(meaning).toHaveAttribute('data-matched', 'true');
  });
});

test.describe('Complete Phase', () => {
  test('should show complete phase after game finished', async ({ page }) => {
    await loadVocabLesson(page);
    await page.click('[data-testid$="-start-btn"]');

    // Wait for writing then skip
    await page.waitForSelector('[data-testid$="-phase-writing"][data-active="true"]', { timeout: 120000 });
    await page.click('[data-testid$="-skip-writing"]');

    // Wait for game
    await page.waitForSelector('[data-testid$="-phase-game"][data-active="true"]', { timeout: 10000 });

    // Match all pairs
    const words = ['talent show', 'programme', 'cartoon'];
    const meanings = ['chương trình tài năng', 'chương trình', 'phim hoạt hình'];

    for (let i = 0; i < words.length; i++) {
      const word = page.locator('[data-testid$="-game-word"]').filter({ hasText: words[i] });
      const meaning = page.locator('[data-testid$="-game-meaning"]').filter({ hasText: meanings[i] });

      await word.click();
      await meaning.click();

      // Small delay between matches
      await page.waitForTimeout(500);
    }

    // Wait for complete phase
    await page.waitForSelector('[data-testid$="-phase-complete"][data-active="true"]', { timeout: 10000 });
  });

  test('should resume lesson flow when finish button clicked', async ({ page }) => {
    await loadVocabLesson(page);
    await page.click('[data-testid$="-start-btn"]');

    // Skip through phases quickly
    await page.waitForSelector('[data-testid$="-phase-writing"][data-active="true"]', { timeout: 120000 });
    await page.click('[data-testid$="-skip-writing"]');
    await page.waitForSelector('[data-testid$="-phase-game"][data-active="true"]', { timeout: 10000 });

    // Match all pairs
    const words = ['talent show', 'programme', 'cartoon'];
    const meanings = ['chương trình tài năng', 'chương trình', 'phim hoạt hình'];

    for (let i = 0; i < words.length; i++) {
      await page.locator('[data-testid$="-game-word"]').filter({ hasText: words[i] }).click();
      await page.locator('[data-testid$="-game-meaning"]').filter({ hasText: meanings[i] }).click();
      await page.waitForTimeout(300);
    }

    // Wait for complete phase
    await page.waitForSelector('[data-testid$="-phase-complete"][data-active="true"]', { timeout: 10000 });

    // Click finish
    await page.click('[data-testid$="-finish-btn"]');

    // Vocab should be marked complete
    const vocab = page.locator('[data-testid^="vocab-"]').first();
    await expect(vocab).toHaveAttribute('data-status', 'complete');
  });
});
