// V3 Markdown Viewer JavaScript

// Network Sharing Manager for PC
class NetworkSharingManager {
    constructor() {
        this.networkInfo = null;
        this.init();
    }

    async init() {
        await this.loadNetworkInfo();
        this.setupNetworkCopyButton();
    }

    async loadNetworkInfo() {
        try {
            const response = await fetch('/api/network-info');
            this.networkInfo = await response.json();
            console.log('Network info loaded for PC:', this.networkInfo);
        } catch (error) {
            console.error('Failed to load network info:', error);
        }
    }

    setupNetworkCopyButton() {
        const copyBtn = document.getElementById('copy-network-link');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyCurrentLessonNetworkLink();
            });
        }
    }

    async copyCurrentLessonNetworkLink() {
        if (!this.networkInfo) {
            await this.loadNetworkInfo();
        }

        if (!this.networkInfo) {
            this.showNotification('Network info not available', 'error');
            return;
        }

        const currentPath = window.currentFile?.filepath || '';
        const networkUrl = `${this.networkInfo.serverURL}/view/${currentPath}`;
        const lessonTitle = window.currentFile?.title || 'English Lesson';

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(networkUrl);
                this.showNotification(`📋 Network link copied! Share: ${this.networkInfo.localIP}:${this.networkInfo.port}`, 'success');
            } else {
                this.promptNetworkLink(networkUrl, lessonTitle);
            }
        } catch (error) {
            console.error('Clipboard error:', error);
            this.promptNetworkLink(networkUrl, lessonTitle);
        }
    }

    promptNetworkLink(url, title) {
        const message = `Lesson: ${title}\n\nNetwork Link:\n${url}\n\nShare this link with devices on your local network.`;
        prompt(message, url);
    }

    showNotification(message, type = 'info', duration = 4000) {
        // Create PC-style notification
        const notification = document.createElement('div');
        notification.className = `pc-notification pc-notification-${type}`;
        notification.textContent = message;
        
        // Position at top-right
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto-hide
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    async copyTranslationFileLink(filePath) {
        if (!this.networkInfo) {
            await this.loadNetworkInfo();
        }

        if (!this.networkInfo) {
            this.showNotification('Network info not available', 'error');
            return;
        }

        const networkUrl = `${this.networkInfo.serverURL}/view/${filePath}`;
        const fileName = filePath.split('/').pop().replace('.md', '');

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(networkUrl);
                this.showNotification(`📋 Translation file link copied! ${fileName}`, 'success');
            } else {
                prompt(`Translation file network link:\n${fileName}`, networkUrl);
            }
        } catch (error) {
            console.error('Clipboard error:', error);
            prompt(`Translation file network link:\n${fileName}`, networkUrl);
        }
    }
}

// Translation Manager
class TranslationManager {
    constructor() {
        this.isTranslating = false;
        this.selectedText = '';
        this.translationFiles = [];
        this.originalFiles = [];
        this.isTranslationFile = false;
    }

    getSelectedText() {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text && text.length > 10) { // Only translate meaningful text
            return text;
        }
        return null;
    }

    showTranslationProgress() {
        // Remove any existing progress indicator
        this.hideTranslationProgress();

        const progressDiv = document.createElement('div');
        progressDiv.id = 'translation-progress';
        progressDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        progressDiv.appendChild(spinner);
        progressDiv.appendChild(document.createTextNode('🔄 Translating...'));
        document.body.appendChild(progressDiv);
    }

    hideTranslationProgress() {
        const existing = document.getElementById('translation-progress');
        if (existing) {
            existing.remove();
        }
    }

    showTranslationResult(result) {
        this.hideTranslationProgress();

        const resultDiv = document.createElement('div');
        resultDiv.id = 'translation-result';
        resultDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
            font-size: 14px;
            max-width: 320px;
        `;

        resultDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">✅ Translation Complete!</div>
            <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">
                Saved as: ${result.translationFile}
            </div>
            <div style="display: flex; gap: 8px;">
                <button id="view-translation" style="
                    background: rgba(255,255,255,0.2); 
                    border: 1px solid rgba(255,255,255,0.3); 
                    color: white; 
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    font-size: 11px; 
                    cursor: pointer;
                ">📄 View</button>
                <button id="open-translation-new-tab" style="
                    background: rgba(255,255,255,0.2); 
                    border: 1px solid rgba(255,255,255,0.3); 
                    color: white; 
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    font-size: 11px; 
                    cursor: pointer;
                ">🔗 New Tab</button>
            </div>
        `;

        // Add event listeners for buttons
        resultDiv.querySelector('#view-translation').addEventListener('click', () => {
            window.location.href = `/view/${result.translationFile}`;
        });

        resultDiv.querySelector('#open-translation-new-tab').addEventListener('click', () => {
            window.open(`/view/${result.translationFile}`, '_blank');
        });

        document.body.appendChild(resultDiv);

        // Auto-hide after 7 seconds
        setTimeout(() => {
            resultDiv.style.opacity = '0';
            resultDiv.style.transform = 'translateX(100%)';
            resultDiv.style.transition = 'all 0.5s ease';
            setTimeout(() => resultDiv.remove(), 500);
        }, 7000);
    }

    showTranslationError(error) {
        this.hideTranslationProgress();

        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
            font-size: 14px;
            max-width: 300px;
            cursor: pointer;
        `;

        errorDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">❌ Translation Failed</div>
            <div style="font-size: 12px; opacity: 0.9;">
                ${error.message || error}
            </div>
            <div style="font-size: 11px; margin-top: 5px; opacity: 0.8;">
                Click to dismiss
            </div>
        `;

        errorDiv.addEventListener('click', () => errorDiv.remove());
        document.body.appendChild(errorDiv);

        // Auto-hide after 7 seconds
        setTimeout(() => errorDiv.remove(), 7000);
    }

    async translateSelectedText() {
        if (this.isTranslating) return;

        const selectedText = this.getSelectedText();
        if (!selectedText) {
            this.showTranslationError('Please select some text to translate (minimum 10 characters)');
            return;
        }

        // Get current file path
        const currentFile = window.currentFile?.filepath;
        if (!currentFile) {
            this.showTranslationError('Cannot detect current file');
            return;
        }

        this.isTranslating = true;
        this.showTranslationProgress();

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: selectedText,
                    sourceFile: currentFile,
                    metadata: {
                        // Extract from URL or file path
                        context: 'Selected text from lesson'
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showTranslationResult(result);
                // Refresh translation files after successful translation
                this.loadTranslationFiles();
            } else {
                this.showTranslationError(result.error || 'Translation failed');
            }

        } catch (error) {
            console.error('Translation error:', error);
            this.showTranslationError(error.message || 'Network error');
        } finally {
            this.isTranslating = false;
        }
    }

    async loadTranslationFiles() {
        const currentFile = window.currentFile?.filepath;
        if (!currentFile) return;

        try {
            const response = await fetch(`/api/translation-files/${currentFile}`);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            this.isTranslationFile = data.isTranslationFile;
            this.translationFiles = data.translationFiles || [];
            this.originalFiles = data.originalFiles || [];
            
            this.updateTranslationFilesSidebar();
        } catch (error) {
            console.error('Failed to load translation files:', error);
            this.showTranslationFilesError(`Failed to load translation files: ${error.message}`);
        }
    }

    updateTranslationFilesSidebar() {
        const container = document.getElementById('translation-files-list');
        if (!container) return;

        let html = '';

        if (this.isTranslationFile && this.originalFiles.length > 0) {
            html += '<div class="translation-section">';
            html += '<div class="section-title">📄 Original Files</div>';
            this.originalFiles.forEach(file => {
                html += `
                    <div class="translation-file-item" data-file="${file.file}">
                        <div class="file-info">
                            <span class="file-name">${file.title}</span>
                        </div>
                        <div class="file-actions">
                            <button onclick="window.location.href='/view/${file.file}'" class="action-btn-sm" title="View">📄</button>
                            <button onclick="window.open('/view/${file.file}', '_blank')" class="action-btn-sm" title="Open in new tab">🔗</button>
                            <button onclick="networkSharingManager.copyTranslationFileLink('${file.file}')" class="action-btn-sm" title="Copy network link">📋</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            // Add hotkey hints
            html += '<div class="translation-hotkeys">';
            html += '<div class="hotkey-item"><kbd>Shift+T</kbd> Jump to original</div>';
            html += '<div class="hotkey-item"><kbd>Ctrl+T</kbd> Open in new tab</div>';
            html += '</div>';

        } else if (!this.isTranslationFile && this.translationFiles.length > 0) {
            html += '<div class="translation-section">';
            html += '<div class="section-title">🔤 Available Translations</div>';
            this.translationFiles.forEach(file => {
                const timeAgo = this.getTimeAgo(new Date(file.modified));
                html += `
                    <div class="translation-file-item" data-file="${file.file}">
                        <div class="file-info">
                            <span class="file-name">${file.title}</span>
                            <span class="file-time">${timeAgo}</span>
                        </div>
                        <div class="file-actions">
                            <button onclick="window.location.href='/view/${file.file}'" class="action-btn-sm" title="View">🔤</button>
                            <button onclick="window.open('/view/${file.file}', '_blank')" class="action-btn-sm" title="Open in new tab">🔗</button>
                            <button onclick="networkSharingManager.copyTranslationFileLink('${file.file}')" class="action-btn-sm" title="Copy network link">📋</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            
            // Add hotkey hints
            html += '<div class="translation-hotkeys">';
            html += '<div class="hotkey-item"><kbd>Shift+T</kbd> Jump to translation</div>';
            html += '<div class="hotkey-item"><kbd>Ctrl+T</kbd> Open in new tab</div>';
            html += '</div>';

        } else {
            html = '<div class="no-translation">No translation files found</div>';
        }

        container.innerHTML = html;
    }

    showTranslationFilesError(message) {
        const container = document.getElementById('translation-files-list');
        if (!container) return;
        
        container.innerHTML = `<div class="translation-error">${message}</div>`;
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

    jumpToTranslation() {
        if (this.isTranslationFile && this.originalFiles.length > 0) {
            // Jump to original file
            window.location.href = `/view/${this.originalFiles[0].file}`;
        } else if (!this.isTranslationFile && this.translationFiles.length > 0) {
            // Jump to first translation file
            window.location.href = `/view/${this.translationFiles[0].file}`;
        } else {
            this.showTranslationError('No related translation files found. Try refreshing the page.');
        }
    }

    openTranslationInNewTab() {
        if (this.isTranslationFile && this.originalFiles.length > 0) {
            // Open original file in new tab
            window.open(`/view/${this.originalFiles[0].file}`, '_blank');
        } else if (!this.isTranslationFile && this.translationFiles.length > 0) {
            // Open first translation file in new tab
            window.open(`/view/${this.translationFiles[0].file}`, '_blank');
        } else {
            this.showTranslationError('No related translation files found');
        }
    }
}

class HistoryManager {
    constructor() {
        this.storageKey = 'v3-markdown-history';
        this.searchKey = 'v3-search-history';
    }
    
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        } catch {
            return {};
        }
    }
    
    setFileAccess(filepath, title) {
        const history = this.getHistory();
        const folderPath = filepath.split('/').slice(0, -1).join('/');
        
        history[folderPath] = {
            lastFile: filepath,
            lastTitle: title,
            timestamp: Date.now(),
            visitCount: (history[folderPath]?.visitCount || 0) + 1
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(history));
        this.updateFolderPreviews();
    }
    
    getLastAccessed(folderPath) {
        const history = this.getHistory();
        return history[folderPath] || null;
    }
    
    getRecentFiles(limit = 5) {
        const history = this.getHistory();
        return Object.values(history)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    
    clearHistory() {
        localStorage.removeItem(this.storageKey);
        this.updateFolderPreviews();
        this.updateRecentFiles();
    }
    
    updateFolderPreviews() {
        const history = this.getHistory();
        
        Object.keys(history).forEach(folderPath => {
            const previewId = 'preview-' + folderPath.replace(/[^\w]/g, '_');
            const previewElement = document.getElementById(previewId);
            
            if (previewElement) {
                const data = history[folderPath];
                const timeAgo = this.getTimeAgo(data.timestamp);
                
                previewElement.innerHTML = `
                    <div class="last-accessed" onclick="openFile('${data.lastFile}')">
                        <span class="last-file-icon">📄</span>
                        <div class="last-file-info">
                            <span class="last-file-name">${data.lastTitle}</span>
                            <span class="last-file-time">${timeAgo}</span>
                        </div>
                    </div>
                `;
            }
        });
    }
    
    updateRecentFiles() {
        const recentElement = document.getElementById('recent-files');
        if (!recentElement) return;
        
        const recent = this.getRecentFiles();
        
        if (recent.length === 0) {
            recentElement.innerHTML = '<p class="no-recent">No recent files</p>';
            return;
        }
        
        recentElement.innerHTML = recent.map(file => `
            <div class="recent-file-item" onclick="openFile('${file.lastFile}')">
                <span class="recent-file-icon">📄</span>
                <div class="recent-file-info">
                    <span class="recent-file-name">${file.lastTitle}</span>
                    <span class="recent-file-time">${this.getTimeAgo(file.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }
    
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }
}

// Search functionality
class SearchManager {
    constructor() {
        this.fileTree = window.fileTreeData || {};
        this.allFiles = this.flattenFiles(this.fileTree);
    }
    
    flattenFiles(node, files = []) {
        if (node.files) {
            files.push(...node.files);
        }
        if (node.children) {
            node.children.forEach(child => this.flattenFiles(child, files));
        }
        return files;
    }
    
    search(query) {
        if (!query.trim()) return [];
        
        const lowercaseQuery = query.toLowerCase();
        return this.allFiles.filter(file => 
            file.name.toLowerCase().includes(lowercaseQuery) ||
            file.title.toLowerCase().includes(lowercaseQuery) ||
            file.path.toLowerCase().includes(lowercaseQuery)
        ).slice(0, 20); // Limit results
    }
    
    renderResults(results) {
        const resultsContainer = document.getElementById('search-results');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="no-results">No files found</p>';
            return;
        }
        
        resultsContainer.innerHTML = results.map(file => `
            <div class="search-result-item" onclick="openFile('${file.path}'); closeSearch();">
                <span class="search-result-icon">📄</span>
                <div class="search-result-info">
                    <span class="search-result-title">${file.title}</span>
                    <span class="search-result-path">${file.path}</span>
                </div>
            </div>
        `).join('');
    }
}

// Initialize managers
const historyManager = new HistoryManager();
const searchManager = new SearchManager();
const translationManager = new TranslationManager();
const networkSharingManager = new NetworkSharingManager();

// Sidebar toggle functionality
class SidebarManager {
    constructor() {
        this.storageKey = 'v3-sidebar-hidden';
        this.isHidden = this.getSidebarState();
        this.initializeSidebar();
    }
    
    getSidebarState() {
        try {
            return localStorage.getItem(this.storageKey) === 'true';
        } catch {
            return false;
        }
    }
    
    setSidebarState(hidden) {
        this.isHidden = hidden;
        localStorage.setItem(this.storageKey, hidden.toString());
        this.applySidebarState();
    }
    
    initializeSidebar() {
        this.applySidebarState();
    }
    
    applySidebarState() {
        const sidebar = document.querySelector('.sidebar');
        const container = document.querySelector('.container');
        const header = document.querySelector('.header');
        
        console.log('=== APPLYING SIDEBAR STATE ===');
        console.log('isHidden:', this.isHidden);
        
        if (this.isHidden) {
            console.log('HIDING header and sidebar only...');
            sidebar?.classList.add('sidebar-hidden');
            container?.classList.add('sidebar-collapsed');
            header?.classList.add('header-hidden');
            // DO NOT add header-hidden to body - that's causing the issue
        } else {
            console.log('SHOWING elements...');
            sidebar?.classList.remove('sidebar-hidden');
            container?.classList.remove('sidebar-collapsed');
            header?.classList.remove('header-hidden');
        }
    }
    
    toggleSidebar() {
        this.setSidebarState(!this.isHidden);
    }
}

// Initialize sidebar manager
const sidebarManager = new SidebarManager();

// Global functions
function trackFileAccess(filepath, title) {
    historyManager.setFileAccess(filepath, title);
}

function toggleSidebar() {
    sidebarManager.toggleSidebar();
}

function openFile(filepath) {
    window.location.href = `/view/${filepath}`;
}

function toggleFolder(element) {
    const folderItem = element.parentElement;
    const content = folderItem.querySelector('.folder-content');
    const icon = element.querySelector('.folder-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '📂';
        folderItem.classList.add('expanded');
    } else {
        content.style.display = 'none';
        icon.textContent = '📁';
        folderItem.classList.remove('expanded');
    }
}

function showSearch() {
    document.getElementById('search-modal').style.display = 'flex';
    document.getElementById('search-input').focus();
}

function closeSearch() {
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('search-input').value = '';
    document.getElementById('search-results').innerHTML = '';
}

function clearHistory() {
    if (confirm('Clear all file access history?')) {
        historyManager.clearHistory();
        alert('History cleared!');
    }
}

// Viewer-specific functions
function switchToRaw() {
    document.getElementById('rendered-content').style.display = 'none';
    document.getElementById('raw-content').style.display = 'block';
    document.getElementById('view-raw').classList.add('active');
    document.getElementById('view-rendered').classList.remove('active');
    
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('view', 'raw');
    window.history.pushState({}, '', url);
}

function switchToRendered() {
    document.getElementById('rendered-content').style.display = 'block';
    document.getElementById('raw-content').style.display = 'none';
    document.getElementById('view-rendered').classList.add('active');
    document.getElementById('view-raw').classList.remove('active');
    
    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.delete('view');
    window.history.pushState({}, '', url);
}

function generateTOC() {
    const content = document.getElementById('rendered-content');
    const tocList = document.getElementById('toc-list');
    
    if (!content || !tocList) return;
    
    const headings = content.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
        tocList.innerHTML = '<p class="no-toc">No headings found</p>';
        return;
    }
    
    const tocItems = Array.from(headings).map((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const id = `toc-${index}`;
        heading.id = id;
        
        return `
            <div class="toc-item toc-level-${level}">
                <a href="#${id}" class="toc-link">${heading.textContent}</a>
            </div>
        `;
    }).join('');
    
    tocList.innerHTML = tocItems;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize folder previews and recent files
    historyManager.updateFolderPreviews();
    historyManager.updateRecentFiles();
    
    // Update stats
    const totalFiles = document.querySelectorAll('.file-item').length;
    const totalFolders = document.querySelectorAll('.folder-item').length;
    
    const totalFilesEl = document.getElementById('total-files');
    const totalFoldersEl = document.getElementById('total-folders');
    
    if (totalFilesEl) totalFilesEl.textContent = totalFiles;
    if (totalFoldersEl) totalFoldersEl.textContent = totalFolders;
    
    // Generate TOC for viewer pages
    generateTOC();
    
    // Load translation files for current page
    if (window.currentFile) {
        translationManager.loadTranslationFiles();
    }
    
    // Check URL for view parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'raw') {
        switchToRaw();
    }
});

// Search input handler
document.addEventListener('input', function(e) {
    if (e.target.id === 'search-input') {
        const query = e.target.value;
        const results = searchManager.search(query);
        searchManager.renderResults(results);
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ignore if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    // Search shortcut (/)
    if (e.key === '/' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        showSearch();
        return;
    }
    
    // Sidebar toggle shortcut (s)
    if (e.key === 's' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        console.log('>>> S KEY PRESSED <<<');
        console.log('Before toggle - isHidden:', sidebarManager.isHidden);
        sidebarManager.toggleSidebar();
        console.log('After toggle - isHidden:', sidebarManager.isHidden);
        return;
    }
    
    // Translation shortcut (t)
    if (e.key === 't' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        translationManager.translateSelectedText();
        return;
    }
    
    // Jump to/from translation (Shift+T)
    if (e.key === 'T' && e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        translationManager.jumpToTranslation();
        return;
    }
    
    // Open translation in new tab (Ctrl+T)
    if (e.key === 't' && e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        translationManager.openTranslationInNewTab();
        return;
    }
    
    // Copy network link (c)
    if (e.key === 'c' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        networkSharingManager.copyCurrentLessonNetworkLink();
        return;
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        closeSearch();
        return;
    }
    
    // Only for viewer pages
    if (!window.currentFile) return;
    
    // Raw view (r)
    if (e.key === 'r' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        switchToRaw();
    }
    
    // Rendered view (v)
    if (e.key === 'v' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        switchToRendered();
    }
});

// Button click handlers
document.addEventListener('click', function(e) {
    if (e.target.id === 'search-btn') {
        showSearch();
    } else if (e.target.id === 'sidebar-toggle') {
        sidebarManager.toggleSidebar();
    } else if (e.target.id === 'close-search') {
        closeSearch();
    } else if (e.target.id === 'toggle-view') {
        const isRawVisible = document.getElementById('raw-content').style.display !== 'none';
        if (isRawVisible) {
            switchToRendered();
        } else {
            switchToRaw();
        }
    } else if (e.target.id === 'view-raw') {
        switchToRaw();
    } else if (e.target.id === 'view-rendered') {
        switchToRendered();
    }
});

// Click outside to close search
document.addEventListener('click', function(e) {
    const modal = document.getElementById('search-modal');
    if (e.target === modal) {
        closeSearch();
    }
});