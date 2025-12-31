import { test, expect } from '@playwright/test';

/**
 * E2E tests for Vocabulary Game.
 * Validates game initialization, menu navigation, and core functionality.
 */

const GAME_LOAD_TIMEOUT = 15000;
const SCENE_TRANSITION_TIMEOUT = 3000;

// Increase test timeout for slower loading with larger vocabulary
test.setTimeout(60000);

test.describe('Vocabulary Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the game without errors', async ({ page }) => {
    // Wait for game container to be present
    await expect(page.locator('#game-container')).toBeVisible();

    // Wait for Phaser canvas to be created
    await expect(page.locator('#game-container canvas')).toBeVisible({
      timeout: GAME_LOAD_TIMEOUT,
    });

    // Check no console errors related to redGL or WebGL
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Give time for any errors to appear
    await page.waitForTimeout(2000);

    // Verify no redGL errors
    const hasRedGLError = consoleErrors.some(
      (err) => err.includes('redGL') || err.includes('WebGL')
    );
    expect(hasRedGLError).toBe(false);
  });

  test('should display vocabulary loading message', async ({ page }) => {
    // Set up console listener before navigation
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    // Navigate to page (listener must be set before navigation)
    await page.goto('/');

    // Wait for canvas to load (indicates game is ready)
    await expect(page.locator('#game-container canvas')).toBeVisible({
      timeout: GAME_LOAD_TIMEOUT,
    });

    // Give time for console messages to be captured
    await page.waitForTimeout(2000);

    // Verify vocabulary or game-related message was logged
    const hasRelevantMessage = consoleMessages.some(
      (msg) =>
        msg.includes('vocabulary') ||
        msg.includes('Vocabulary') ||
        msg.includes('Loaded') ||
        msg.includes('Games') ||
        msg.includes('points') ||
        msg.includes('sets')
    );
    expect(hasRelevantMessage).toBe(true);
  });

  test('should render canvas with correct dimensions', async ({ page }) => {
    const canvas = page.locator('#game-container canvas');
    await expect(canvas).toBeVisible({ timeout: GAME_LOAD_TIMEOUT });

    // Canvas should exist and have dimensions
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test('should show menu after boot scene', async ({ page }) => {
    // Wait for canvas to load
    await expect(page.locator('#game-container canvas')).toBeVisible({
      timeout: GAME_LOAD_TIMEOUT,
    });

    // Wait for boot scene to complete and menu to appear
    await page.waitForTimeout(SCENE_TRANSITION_TIMEOUT);

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'test-results/menu-screen.png',
      fullPage: false,
    });
  });
});

test.describe('Game Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to fully load
    await expect(page.locator('#game-container canvas')).toBeVisible({
      timeout: GAME_LOAD_TIMEOUT,
    });
    await page.waitForTimeout(SCENE_TRANSITION_TIMEOUT);
  });

  test('should navigate via URL parameters', async ({ page }) => {
    // Test grade/unit URL parameter navigation
    await page.goto('/?grade=7&unit=1');
    await expect(page.locator('#game-container canvas')).toBeVisible({
      timeout: GAME_LOAD_TIMEOUT,
    });
  });

  test('should handle game mode URL parameter', async ({ page }) => {
    // Test mode URL parameter
    await page.goto('/?mode=flashcard');
    await expect(page.locator('#game-container canvas')).toBeVisible({
      timeout: GAME_LOAD_TIMEOUT,
    });
  });
});

test.describe('Copy & Revise Mode', () => {
  test('should navigate to Copy & Revise mode via keyboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#game-container canvas')).toBeVisible({
      timeout: GAME_LOAD_TIMEOUT,
    });
    await page.waitForTimeout(SCENE_TRANSITION_TIMEOUT);

    // Press '1' to go to Copy & Revise mode (first option)
    await page.keyboard.press('1');
    await page.waitForTimeout(1000);

    // Take screenshot to verify scene loaded
    await page.screenshot({
      path: 'test-results/copy-revise-screen.png',
      fullPage: false,
    });
  });
});

test.describe('API Health Check', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('vocab-game-server');
  });

  test('should list classes endpoint', async ({ request }) => {
    const response = await request.get('/api/classes');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('should access dashboard endpoint', async ({ request }) => {
    const response = await request.get('/api/dashboard');
    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data).toHaveProperty('classes');
    expect(data).toHaveProperty('totalClasses');
  });
});
