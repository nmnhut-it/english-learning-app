// Mobile Viewer JavaScript for V3 Markdown Viewer

class MobileTranslationManager {
    constructor() {
        this.selectedText = '';
        this.isTranslating = false;
        this.selectionRange = null;
        this.translationFiles = [];
        this.init();
    }

    init() {
        this.setupTextSelection();
        this.setupTranslationControls();
        this.setupViewToggle();
        this.setupNavigationPanel();
        this.loadTranslationFiles();
    }

    setupTextSelection() {
        const content = document.getElementById('mobile-rendered-content');
        const toolbar = document.getElementById('mobile-selection-toolbar');
        const translateBtn = document.getElementById('mobile-translate-selected');
        const cancelBtn = document.getElementById('mobile-cancel-selection');

        if (!content || !toolbar) return;

        // Text selection handling
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            // Mobile-friendly debug - show on screen
            this.showDebugInfo(`Selection: ${selectedText.length} chars`);

            if (selectedText.length > 5) {
                // Check if selection is within content area
                let isInContent = false;
                try {
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        isInContent = content.contains(range.commonAncestorContainer) || 
                                    content.contains(selection.anchorNode) ||
                                    content === range.commonAncestorContainer;
                    }
                } catch (e) {
                    this.showDebugInfo('Selection error: ' + e.message);
                }

                if (isInContent) {
                    this.selectedText = selectedText;
                    this.selectionRange = selection.getRangeAt(0);
                    this.showSelectionToolbar();
                    this.updateTranslateButton();
                    this.showDebugInfo(`Valid: "${selectedText.substring(0, 30)}..."`);
                    return;
                }
            }
            
            // Clear selection if no valid text
            this.selectedText = '';
            this.selectionRange = null;
            this.hideSelectionToolbar();
            this.updateTranslateButton();
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        
        // Also listen for touchend in case selectionchange doesn't fire reliably
        content.addEventListener('touchend', () => {
            setTimeout(handleSelectionChange, 100);
        });

        // Translate selected text
        if (translateBtn) {
            translateBtn.addEventListener('click', () => {
                this.translateSelectedText();
            });
        }

        // Cancel selection
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                window.getSelection().removeAllRanges();
                this.hideSelectionToolbar();
            });
        }

        // Touch-specific selection enhancements
        let touchTimer;
        content.addEventListener('touchstart', (e) => {
            touchTimer = setTimeout(() => {
                // Long press detected - could trigger text selection helper
                this.showTextSelectionHint(e.touches[0]);
            }, 500);
        });

        content.addEventListener('touchend', () => {
            if (touchTimer) {
                clearTimeout(touchTimer);
            }
        });

        content.addEventListener('touchmove', () => {
            if (touchTimer) {
                clearTimeout(touchTimer);
            }
        });
    }

    setupTranslationControls() {
        const statusEl = document.getElementById('mobile-translation-status');
        const fabBtn = document.getElementById('mobile-translation-fab-btn');
        const translateBtn = document.getElementById('mobile-translate-btn');
        const testBtn = document.getElementById('mobile-test-btn');

        // Main translate button in header
        if (translateBtn) {
            translateBtn.addEventListener('click', () => {
                console.log('Translate button clicked, selectedText:', this.selectedText);
                if (this.selectedText && this.selectedText.trim().length > 0) {
                    this.translateSelectedText();
                } else {
                    this.showTranslationHint();
                }
            });
        }

        // Test button for debugging
        if (testBtn) {
            testBtn.addEventListener('click', async () => {
                console.log('Test button clicked');
                this.selectedText = 'This is a test sentence for translation.';
                this.updateTranslateButton();
                console.log('Set test text:', this.selectedText);
                
                // Test API with hardcoded text
                try {
                    const response = await fetch('/api/translate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            text: 'Hello world. This is a test.',
                            sourceFile: window.currentFile?.filepath || 'test.md',
                            metadata: {
                                context: 'Mobile test'
                            }
                        })
                    });
                    
                    console.log('Test API response status:', response.status);
                    const result = await response.json();
                    console.log('Test API result:', result);
                    
                    if (result.success) {
                        this.showToast('API test successful!');
                    } else {
                        this.showToast('API test failed: ' + (result.error || 'Unknown error'), 'error');
                    }
                } catch (error) {
                    console.error('Test API error:', error);
                    this.showToast('API test error: ' + error.message, 'error');
                }
            });
        }

        // FAB for quick translation access
        if (fabBtn) {
            fabBtn.addEventListener('click', () => {
                if (this.translationFiles.length > 0) {
                    this.showTranslationOptions();
                } else {
                    this.showTranslationHint();
                }
            });
        }

        // Update translation status
        this.updateTranslationStatus();
    }

    setupViewToggle() {
        const toggleBtn = document.getElementById('mobile-view-toggle');
        const renderedContent = document.getElementById('mobile-rendered-content');
        const rawContent = document.getElementById('mobile-raw-content');
        const toggleRawBtn = document.getElementById('mobile-toggle-raw');

        const toggleView = () => {
            if (renderedContent && rawContent) {
                const isRawVisible = rawContent.style.display !== 'none';
                
                if (isRawVisible) {
                    renderedContent.style.display = 'block';
                    rawContent.style.display = 'none';
                    toggleBtn.textContent = '🔄';
                    if (toggleRawBtn) toggleRawBtn.textContent = '📝 Raw View';
                } else {
                    renderedContent.style.display = 'none';
                    rawContent.style.display = 'block';
                    toggleBtn.textContent = '🎨';
                    if (toggleRawBtn) toggleRawBtn.textContent = '🎨 Rendered View';
                }
            }
        };

        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleView);
        }

        if (toggleRawBtn) {
            toggleRawBtn.addEventListener('click', toggleView);
        }
    }

    setupNavigationPanel() {
        const navPanel = document.getElementById('mobile-nav-panel');
        const navClose = document.getElementById('mobile-nav-close');
        const copyLinkBtn = document.getElementById('mobile-copy-link');

        // Show navigation panel on swipe up (simplified)
        let startY;
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            const diff = startY - endY;

            // Swipe up from bottom to show nav
            if (diff > 100 && startY > window.innerHeight - 100) {
                this.showNavigationPanel();
            }
        });

        if (navClose) {
            navClose.addEventListener('click', () => {
                this.hideNavigationPanel();
            });
        }

        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                this.copyCurrentLink();
            });
        }
    }

    async loadTranslationFiles() {
        const currentFile = window.currentFile?.filepath;
        if (!currentFile) return;

        try {
            const response = await fetch(`/api/translation-files/${currentFile}`);
            const data = await response.json();
            
            this.translationFiles = data.translationFiles || [];
            this.isTranslationFile = data.isTranslationFile || false;
            this.originalFiles = data.originalFiles || [];
            
            this.updateTranslationFilesPanel();
            this.updateTranslationFab();
        } catch (error) {
            console.error('Failed to load translation files:', error);
        }
    }

    showSelectionToolbar() {
        const toolbar = document.getElementById('mobile-selection-toolbar');
        if (toolbar) {
            toolbar.style.display = 'flex';
            // Position toolbar above selection
            this.positionSelectionToolbar();
        }
    }

    hideSelectionToolbar() {
        const toolbar = document.getElementById('mobile-selection-toolbar');
        if (toolbar) {
            toolbar.style.display = 'none';
        }
        this.selectedText = '';
        this.selectionRange = null;
    }

    positionSelectionToolbar() {
        const toolbar = document.getElementById('mobile-selection-toolbar');
        if (!toolbar || !this.selectionRange) return;

        const rect = this.selectionRange.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Position above selection, or below if no space
        if (rect.top > 80) {
            toolbar.style.top = `${rect.top + scrollTop - 60}px`;
        } else {
            toolbar.style.top = `${rect.bottom + scrollTop + 10}px`;
        }
        
        toolbar.style.left = '50%';
        toolbar.style.transform = 'translateX(-50%)';
    }

    updateTranslateButton() {
        const btn = document.getElementById('mobile-translate-btn');
        if (btn) {
            console.log('Updating translate button, selectedText length:', this.selectedText.length);
            if (this.selectedText && this.selectedText.length > 5) {
                const preview = this.selectedText.substring(0, 15);
                btn.textContent = `Translate "${preview}${this.selectedText.length > 15 ? '...' : ''}"`;
                btn.disabled = false;
                btn.classList.add('enabled');
                console.log('Button enabled with text:', btn.textContent);
            } else {
                btn.textContent = 'Select text to translate';
                btn.disabled = true;
                btn.classList.remove('enabled');
                console.log('Button disabled');
            }
        } else {
            console.log('Translate button not found');
        }
    }

    async translateSelectedText() {
        this.showDebugInfo(`Translating: ${this.selectedText.length} chars`);
        
        if (!this.selectedText || this.selectedText.trim().length === 0) {
            this.showToast('No text selected - please select some text first', 'error');
            return;
        }

        if (this.isTranslating) {
            this.showToast('Translation already in progress', 'error');
            return;
        }

        this.isTranslating = true;
        this.hideSelectionToolbar();
        this.showTranslationModal();

        try {
            const requestData = {
                text: this.selectedText.trim(),
                sourceFile: window.currentFile?.filepath || 'unknown.md',
                metadata: {
                    context: 'Mobile text selection',
                    userAgent: navigator.userAgent
                }
            };

            // Show what we're sending on mobile
            this.showDebugInfo(`Sending: "${requestData.text.substring(0, 20)}..."`);

            // Also log for any debugging you can do later
            console.log('Mobile translation request:', requestData);

            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log('Translation response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Translation result:', result);

            if (result.success) {
                this.showTranslationResult(result);
                // Refresh translation files
                this.loadTranslationFiles();
            } else {
                this.showTranslationError(result.error || 'Translation failed');
            }

        } catch (error) {
            console.error('Translation error:', error);
            this.showTranslationError(`Network error: ${error.message}`);
        } finally {
            this.isTranslating = false;
        }
    }

    showTranslationModal() {
        const modal = document.getElementById('mobile-translation-modal');
        const preview = document.getElementById('mobile-selected-preview');
        
        if (modal && preview) {
            preview.textContent = this.selectedText;
            modal.style.display = 'flex';
        }
    }

    hideTranslationModal() {
        const modal = document.getElementById('mobile-translation-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showTranslationResult(result) {
        this.hideTranslationModal();
        
        const modal = document.getElementById('mobile-result-modal');
        const info = document.getElementById('mobile-translation-info');
        const viewBtn = document.getElementById('mobile-view-translation');
        const tabBtn = document.getElementById('mobile-open-translation-tab');
        const shareBtn = document.getElementById('mobile-share-translation');

        if (modal && info) {
            info.innerHTML = `
                <div class="mobile-result-detail">
                    <strong>File:</strong> ${result.translationFile}
                </div>
                <div class="mobile-result-detail">
                    <strong>Section:</strong> ${result.sectionTitle}
                </div>
            `;

            // Setup action buttons
            if (viewBtn) {
                viewBtn.onclick = () => {
                    window.location.href = `/view/${result.translationFile}?mobile=1`;
                };
            }

            if (tabBtn) {
                tabBtn.onclick = () => {
                    window.open(`/view/${result.translationFile}?mobile=1`, '_blank');
                    this.hideTranslationResult();
                };
            }

            if (shareBtn) {
                shareBtn.onclick = () => {
                    this.shareTranslation(result.translationFile);
                };
            }

            modal.style.display = 'flex';
        }
    }

    showTranslationError(error) {
        this.hideTranslationModal();
        this.showToast(`Translation failed: ${error}`, 'error');
    }

    hideTranslationResult() {
        const modal = document.getElementById('mobile-result-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showNavigationPanel() {
        const panel = document.getElementById('mobile-nav-panel');
        if (panel) {
            panel.style.display = 'flex';
        }
    }

    hideNavigationPanel() {
        const panel = document.getElementById('mobile-nav-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    updateTranslationFilesPanel() {
        const container = document.getElementById('mobile-translation-files');
        if (!container) return;

        if (this.isTranslationFile && this.originalFiles.length > 0) {
            container.innerHTML = `
                <div class="mobile-translation-item">
                    <span class="mobile-translation-icon">📄</span>
                    <div class="mobile-translation-info">
                        <strong>Original File</strong>
                        <p>${this.originalFiles[0].title}</p>
                    </div>
                    <button onclick="window.location.href='/view/${this.originalFiles[0].file}?mobile=1'" 
                            class="mobile-translation-action">View</button>
                </div>
            `;
        } else if (this.translationFiles.length > 0) {
            container.innerHTML = this.translationFiles.map(file => `
                <div class="mobile-translation-item">
                    <span class="mobile-translation-icon">🔤</span>
                    <div class="mobile-translation-info">
                        <strong>${file.title}</strong>
                        <p>${this.getTimeAgo(new Date(file.modified))}</p>
                    </div>
                    <button onclick="window.location.href='/view/${file.file}?mobile=1'" 
                            class="mobile-translation-action">View</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="mobile-no-translations">
                    <span>No translations yet</span>
                    <p>Select text and translate to create one</p>
                </div>
            `;
        }
    }

    updateTranslationFab() {
        const fab = document.getElementById('mobile-translation-fab-btn');
        if (fab) {
            if (this.translationFiles.length > 0 || this.isTranslationFile) {
                fab.style.display = 'block';
                fab.title = this.isTranslationFile ? 'View Original' : 'View Translations';
            }
        }
    }

    updateTranslationStatus() {
        const status = document.getElementById('mobile-translation-status');
        if (status) {
            if (this.translationFiles.length > 0) {
                status.textContent = `${this.translationFiles.length} translation(s) available`;
                status.classList.add('has-translations');
            } else if (this.isTranslationFile) {
                status.textContent = 'Translation file';
                status.classList.add('is-translation');
            } else {
                status.textContent = 'Ready to translate';
                status.classList.remove('has-translations', 'is-translation');
            }
        }
    }

    showTextSelectionHint(touch) {
        // Show a subtle hint for text selection
        this.showToast('Tap and hold to select text for translation');
    }

    showTranslationHint() {
        this.showToast('Select text first, then tap translate');
    }

    showTranslationOptions() {
        this.showNavigationPanel();
    }

    copyCurrentLink() {
        const url = window.location.href;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Link copied to clipboard!');
            }).catch(() => {
                this.promptLink(url);
            });
        } else {
            this.promptLink(url);
        }
    }

    promptLink(url) {
        prompt('Copy this link:', url);
    }

    shareTranslation(translationFile) {
        const url = `${window.location.origin}/view/${translationFile}?mobile=1`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Translation - ' + window.currentFile.title,
                url: url
            }).catch(console.error);
        } else {
            this.copyLink(url);
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `mobile-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('mobile-toast-show'), 100);

        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('mobile-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    showDebugInfo(message) {
        // Show debug info in translation status bar for mobile debugging
        const statusEl = document.getElementById('mobile-translation-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = '#f59e0b'; // Orange for debug
            setTimeout(() => {
                this.updateTranslationStatus(); // Restore normal status after 2 seconds
            }, 2000);
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }
}

// Initialize mobile translation manager
let mobileTranslationManager;

// Test API function
async function testMobileAPI() {
    console.log('Testing mobile API connectivity...');
    try {
        const response = await fetch('/api/files');
        console.log('API test response status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('API test successful, files found:', data.files?.length || 'unknown');
        } else {
            console.log('API test failed with status:', response.status);
        }
    } catch (error) {
        console.error('API test error:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Mobile viewer DOM loaded');
    
    if (window.isMobile) {
        console.log('Initializing mobile translation manager...');
        mobileTranslationManager = new MobileTranslationManager();
        window.mobileTranslationManager = mobileTranslationManager;
        
        // Setup modal close handlers
        document.getElementById('mobile-result-close')?.addEventListener('click', () => {
            mobileTranslationManager.hideTranslationResult();
        });

        // Close modals on background tap
        document.querySelectorAll('.mobile-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Test API
        testMobileAPI();
    } else {
        console.log('Not mobile environment');
    }
});