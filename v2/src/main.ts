// V2 English Learning App - Main Entry Point

import './styles/main.css';
import { App } from './App';
import { audioService } from '@services/AudioService';
import { contentService } from '@services/ContentService';

/**
 * Initialize and start the V2 English Learning App
 */
async function initializeApp(): Promise<void> {
      const loadingScreen = document.getElementById('loading-screen');
  const appContainer = document.getElementById('app');
  const errorBoundary = document.getElementById('error-boundary');

  try {
        console.log('🚀 Starting English Learning App V2...');
    
    // Initialize services
    console.log('🔊 Initializing AudioService...');
    // AudioService will be initialized on first user interaction (autoplay policy)
    
    console.log('📚 Initializing ContentService...');
    // ContentService is ready - no initialization needed
    
    console.log('🎨 Creating App instance...');
    const app = new App();
    
    console.log('📱 Rendering application...');
    if (appContainer) {
          app.render(appContainer);
      
      // Show app, hide loading
      appContainer.classList.add('loaded');
      loadingScreen?.remove();
      
      console.log('✅ App initialized successfully!');
    } else {
          throw new Error('App container not found');
    }
    
  } catch (error) {
        console.error('❌ Failed to initialize app:', error);
    
    // Show error boundary
    if (errorBoundary && loadingScreen) {
          loadingScreen.style.display = 'none';
      errorBoundary.style.display = 'flex';
      errorBoundary.innerHTML = `
        <div style=\"text-align: center; padding: 2rem; max-width: 500px;\">
          <h2 style=\"color: #dc2626; margin-bottom: 1rem;\">🚫 Failed to Load App</h2>
          <p style=\"color: #6b7280; margin-bottom: 1.5rem;\">There was an error loading the English Learning App V2.</p>
          <details style=\"margin-bottom: 1.5rem; text-align: left;\">
            <summary style=\"cursor: pointer; color: #2563eb; font-weight: 600;\">Error Details</summary>
            <pre style=\"background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin-top: 0.5rem; overflow-x: auto; font-size: 0.875rem;\">${error instanceof Error ? error.stack || error.message : String(error)}</pre>
          </details>
          <button onclick=\"window.location.reload()\" 
                  style=\"background: #2563eb; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600; font-size: 1rem;\">
            🔄 Reload App
          </button>
        </div>
      `;
    }
  }
}

/**
 * Handle user interactions for audio initialization
 */
function setupUserInteractionHandlers(): void {
      const initializeAudio = async () => {
        try {
          await audioService.initialize();
      console.log('🔊 AudioService initialized on user interaction');
    } catch (error) {
          console.warn('Failed to initialize audio:', error);
    }
    
    // Remove listeners after first initialization
    document.removeEventListener('click', initializeAudio);
    document.removeEventListener('keydown', initializeAudio);
    document.removeEventListener('touchstart', initializeAudio);
  };
  
  // Initialize audio on first user interaction
  document.addEventListener('click', initializeAudio, { once: true });
  document.addEventListener('keydown', initializeAudio, { once: true });
  document.addEventListener('touchstart', initializeAudio, { once: true });
}

/**
 * Setup error handling
 */
function setupErrorHandling(): void {
      // Global error handler
  window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
    // Could send to analytics service here
  });
  
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
    // Could send to analytics service here
  });
}

/**
 * Setup performance monitoring
 */
function setupPerformanceMonitoring(): void {
      // Log performance metrics
  window.addEventListener('load', () => {
        if ('performance' in window) {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      console.log('⚡ Performance Metrics:', {
            'DOM Content Loaded': `${Math.round(perfData.domContentLoadedEventEnd - perfData.navigationStart)}ms`,
        'Page Load Complete': `${Math.round(perfData.loadEventEnd - perfData.navigationStart)}ms`,
        'First Paint': getFirstPaint(),
        'First Contentful Paint': getFirstContentfulPaint()
      });
    }
  });
}

function getFirstPaint(): string {
      const perfEntries = performance.getEntriesByType('paint');
  const firstPaint = perfEntries.find(entry => entry.name === 'first-paint');
  return firstPaint ? `${Math.round(firstPaint.startTime)}ms` : 'N/A';
}

function getFirstContentfulPaint(): string {
      const perfEntries = performance.getEntriesByType('paint');
  const fcp = perfEntries.find(entry => entry.name === 'first-contentful-paint');
  return fcp ? `${Math.round(fcp.startTime)}ms` : 'N/A';
}

/**
 * Setup keyboard shortcuts
 */
function setupGlobalKeyboardShortcuts(): void {
      document.addEventListener('keydown', (event) => {
        // Global shortcuts
    if (event.ctrlKey || event.metaKey) {
          switch (event.key) {
            case '/':
          event.preventDefault();
          // Focus search if available
          const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
          if (searchInput) {
                searchInput.focus();
          }
          break;
          
        case 'k':
          event.preventDefault();
          // Quick command palette
          console.log('Command palette not implemented yet');
          break;
      }
    }
    
    // Global navigation
    if (event.key === 'Escape') {
          // Close modals, dropdowns, etc.
      const activeModal = document.querySelector('[data-modal][data-active=\"true\"]');
      if (activeModal) {
            activeModal.setAttribute('data-active', 'false');
      }
    }
  });
}

/**
 * Setup accessibility enhancements
 */
function setupAccessibilityEnhancements(): void {
      // Skip to main content link
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #2563eb;
    color: white;
    padding: 8px;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 600;
    z-index: 100;
    transition: top 0.3s;
  `;
  
  skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
  });
  
  skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
  });
  
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Focus management
  let focusableElements: NodeListOf<Element>;
  
  const updateFocusableElements = () => {
        focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])'
    );
  };
  
  updateFocusableElements();
  
  // Update focusable elements when DOM changes
  const observer = new MutationObserver(updateFocusableElements);
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Main initialization function
 */
async function main(): Promise<void> {
      console.log('🎓 English Learning App V2 - Initializing...');
  
  // Setup foundational systems
  setupErrorHandling();
  setupPerformanceMonitoring();
  setupUserInteractionHandlers();
  setupGlobalKeyboardShortcuts();
  setupAccessibilityEnhancements();
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }
  
  // Initialize the main application
  await initializeApp();
}

// Start the application
main().catch(error => {
      console.error('Fatal error during app initialization:', error);
});

// Development helpers
if (process.env.NODE_ENV === 'development') {
      // Hot module replacement
  if (import.meta.hot) {
        import.meta.hot.accept();
  }
  
  // Development console commands
  (window as any).devTools = {
        audioService,
    contentService,
    clearCache: () => {
          contentService.clearCache();
      audioService.clearCache();
      localStorage.clear();
      console.log('All caches cleared');
    },
    loadSample: async () => {
          try {
            const unit = await contentService.loadUnit(7, 'unit-01');
        console.log('Sample unit loaded:', unit);
        return unit;
      } catch (error) {
            console.error('Failed to load sample:', error);
      }
    }
  };
  
  console.log('🛠️ Development tools available at window.devTools');
}