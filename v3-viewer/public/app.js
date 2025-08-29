// V3 Markdown Viewer JavaScript
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

// Global functions
function trackFileAccess(filepath, title) {
    historyManager.setFileAccess(filepath, title);
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
    // Search shortcut (/)
    if (e.key === '/' && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        showSearch();
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