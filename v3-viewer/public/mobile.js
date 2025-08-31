// Mobile-specific JavaScript for V3 Markdown Viewer

// Mobile File Management
class MobileFileManager {
    constructor() {
        this.currentFile = null;
        this.searchTerm = '';
        this.recentFiles = this.getRecentFiles();
        this.init();
    }

    init() {
        this.setupSearch();
        this.setupRecentFiles();
        this.setupTouchEvents();
        this.updateStats();
    }

    setupSearch() {
        const searchInput = document.getElementById('mobile-search');
        const searchClear = document.getElementById('mobile-search-clear');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.performSearch();
                
                if (this.searchTerm) {
                    searchClear.style.display = 'block';
                } else {
                    searchClear.style.display = 'none';
                }
            });
        }

        if (searchClear) {
            searchClear.addEventListener('click', () => {
                this.clearMobileSearch();
            });
        }
    }

    setupRecentFiles() {
        if (this.recentFiles.length > 0) {
            const recentSection = document.getElementById('mobile-recent');
            const recentList = document.getElementById('mobile-recent-list');
            
            if (recentSection && recentList) {
                recentSection.style.display = 'block';
                recentList.innerHTML = this.recentFiles.slice(0, 5).map(file => 
                    this.createMobileFileCard(file, true)
                ).join('');
            }
        }
    }

    setupTouchEvents() {
        // Touch and gesture events
        let touchStartY = 0;
        let touchStartTime = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            // Pull to refresh logic could go here
        }, { passive: true });

        // Long press detection for context menu
        document.addEventListener('touchstart', (e) => {
            if (e.target.closest('.mobile-file-card')) {
                this.handleLongPressStart(e);
            }
        });
    }

    performSearch() {
        const gradeList = document.getElementById('mobile-grade-list');
        const noResults = document.getElementById('mobile-no-results');
        let hasResults = false;

        if (!gradeList) return;

        if (!this.searchTerm) {
            // Show all sections
            const gradeSections = gradeList.querySelectorAll('.mobile-grade-section');
            gradeSections.forEach(section => {
                section.style.display = 'block';
                const cards = section.querySelectorAll('.mobile-file-card');
                cards.forEach(card => card.style.display = 'block');
            });
            hasResults = true;
            noResults.style.display = 'none';
            return;
        }

        // Filter files
        const gradeSections = gradeList.querySelectorAll('.mobile-grade-section');
        gradeSections.forEach(section => {
            const cards = section.querySelectorAll('.mobile-file-card');
            let sectionHasResults = false;

            cards.forEach(card => {
                const title = card.querySelector('.mobile-file-title')?.textContent.toLowerCase() || '';
                const name = card.querySelector('.mobile-file-name')?.textContent.toLowerCase() || '';
                const path = card.querySelector('.mobile-file-path')?.textContent.toLowerCase() || '';

                if (title.includes(this.searchTerm) || name.includes(this.searchTerm) || path.includes(this.searchTerm)) {
                    card.style.display = 'block';
                    sectionHasResults = true;
                    hasResults = true;
                } else {
                    card.style.display = 'none';
                }
            });

            section.style.display = sectionHasResults ? 'block' : 'none';
            if (sectionHasResults) {
                // Auto-expand section when search has results
                const content = section.querySelector('.mobile-grade-content');
                const toggle = section.querySelector('.mobile-grade-toggle');
                if (content && toggle) {
                    content.style.display = 'block';
                    toggle.textContent = '▲';
                }
            }
        });

        noResults.style.display = hasResults ? 'none' : 'block';
    }

    createMobileFileCard(file, isRecent = false) {
        const translationIndicator = (file.hasTranslation && !file.isTranslation) ? 
            '<span class="mobile-translation-indicator">🔤</span>' : '';
        
        const recentBadge = isRecent ? '<span class="mobile-recent-badge">Recent</span>' : '';

        return `
            <div class="mobile-file-card" data-path="${file.path}" onclick="openMobileFile('${file.path}')">
                <div class="mobile-file-header">
                    <span class="mobile-file-icon">${file.isTranslation ? '🔤' : '📄'}</span>
                    <div class="mobile-file-meta">
                        ${translationIndicator}
                        ${recentBadge}
                    </div>
                </div>
                <div class="mobile-file-info">
                    <h4 class="mobile-file-title">${file.title}</h4>
                    <p class="mobile-file-name">${file.name}</p>
                    ${file.folder && file.folder !== 'Unknown' ? `<p class="mobile-file-path">${file.folder}</p>` : ''}
                </div>
                <div class="mobile-file-actions">
                    <button class="mobile-action-btn" onclick="event.stopPropagation(); openMobileFile('${file.path}')">View</button>
                    ${(file.hasTranslation && !file.isTranslation) ? 
                        `<button class="mobile-action-btn secondary" onclick="event.stopPropagation(); showTranslations('${file.path}')">Translations</button>` : ''
                    }
                </div>
            </div>
        `;
    }

    handleLongPressStart(e) {
        const card = e.target.closest('.mobile-file-card');
        if (!card) return;

        this.longPressTimer = setTimeout(() => {
            this.showContextMenu(card, e.touches[0]);
        }, 600); // 600ms long press

        // Clear on touch end
        const clearLongPress = () => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
            }
            document.removeEventListener('touchend', clearLongPress);
            document.removeEventListener('touchmove', clearLongPress);
        };

        document.addEventListener('touchend', clearLongPress);
        document.addEventListener('touchmove', clearLongPress);
    }

    showContextMenu(card, touch) {
        const filePath = card.dataset.path;
        const contextMenu = document.getElementById('mobile-context-menu');
        const contextTitle = document.getElementById('mobile-context-title');
        
        if (!contextMenu || !contextTitle) return;

        contextTitle.textContent = card.querySelector('.mobile-file-title').textContent;
        contextMenu.style.display = 'flex';
        
        // Position menu
        const rect = card.getBoundingClientRect();
        contextMenu.style.top = `${rect.bottom + 10}px`;

        // Add event listeners for actions
        const actions = contextMenu.querySelectorAll('.mobile-context-action');
        actions.forEach(action => {
            action.onclick = () => this.handleContextAction(action.dataset.action, filePath);
        });
    }

    handleContextAction(action, filePath) {
        this.hideContextMenu();
        
        switch (action) {
            case 'view':
                openMobileFile(filePath);
                break;
            case 'translate':
                // Navigate to file and trigger translation
                window.location.href = `/view/${filePath}?translate=1`;
                break;
            case 'translations':
                showTranslations(filePath);
                break;
            case 'share':
                this.shareFile(filePath);
                break;
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('mobile-context-menu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }

    shareFile(filePath) {
        const url = `${window.location.origin}/view/${filePath}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'English Lesson',
                url: url
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Link copied to clipboard!');
            }).catch(() => {
                // Final fallback: show URL
                prompt('Copy this link:', url);
            });
        }
    }

    showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
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

    getRecentFiles() {
        try {
            const history = JSON.parse(localStorage.getItem('v3-markdown-history') || '{}');
            return Object.values(history)
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5);
        } catch {
            return [];
        }
    }

    updateStats() {
        // Stats are already updated in the template, but we can update them dynamically
        const totalFiles = window.flattenedFiles?.length || 0;
        const translationCount = window.flattenedFiles?.filter(f => f.hasTranslation || f.isTranslation).length || 0;
        
        const totalEl = document.getElementById('mobile-total-files');
        const transEl = document.getElementById('mobile-translation-count');
        
        if (totalEl) totalEl.textContent = totalFiles;
        if (transEl) transEl.textContent = translationCount;
    }
}

// Global mobile functions
function toggleGradeSection(header) {
    const section = header.parentElement;
    const content = section.querySelector('.mobile-grade-content');
    const toggle = section.querySelector('.mobile-grade-toggle');
    
    if (content && toggle) {
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '▲';
        } else {
            content.style.display = 'none';
            toggle.textContent = '▼';
        }
    }
}

function openMobileFile(filePath) {
    // Track in recent files
    if (window.mobileFileManager) {
        const file = window.flattenedFiles?.find(f => f.path === filePath);
        if (file) {
            const historyManager = new HistoryManager();
            historyManager.setFileAccess(filePath, file.title);
        }
    }
    
    // Navigate to file with mobile parameter
    window.location.href = `/view/${filePath}?mobile=1`;
}

function showTranslations(filePath) {
    // This would show a list of available translations
    // For now, just navigate to the first translation file
    const file = window.flattenedFiles?.find(f => f.path === filePath);
    if (file && file.hasTranslation) {
        // Try to find the translation file
        const translationPath = filePath.replace('.md', '.translation.md');
        window.location.href = `/view/${translationPath}?mobile=1`;
    }
}

function clearMobileSearch() {
    const searchInput = document.getElementById('mobile-search');
    const searchClear = document.getElementById('mobile-search-clear');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
    }
    
    if (searchClear) {
        searchClear.style.display = 'none';
    }
}

// Initialize mobile file manager
let mobileFileManager;

document.addEventListener('DOMContentLoaded', () => {
    if (window.isMobile) {
        mobileFileManager = new MobileFileManager();
        window.mobileFileManager = mobileFileManager;
    }

    // Context menu close handler
    const contextClose = document.getElementById('mobile-context-close');
    if (contextClose) {
        contextClose.addEventListener('click', () => {
            mobileFileManager.hideContextMenu();
        });
    }

    // Click outside to close context menu
    document.addEventListener('click', (e) => {
        const contextMenu = document.getElementById('mobile-context-menu');
        if (contextMenu && !contextMenu.contains(e.target) && contextMenu.style.display !== 'none') {
            mobileFileManager.hideContextMenu();
        }
    });
});