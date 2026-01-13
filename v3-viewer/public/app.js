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

// Vocabulary Manager
class VocabularyManager {
    constructor() {
        this.isProcessing = false;
        this.selectedText = '';
        this.detectedGrade = null;
        this.detectedContext = null;
    }

    getSelectedText() {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text && text.length > 10) { // Only process meaningful text
            return text;
        }
        return null;
    }

    detectGradeFromPath() {
        // First try to detect from document content (most accurate)
        const gradeFromContent = this.detectGradeFromContent();
        if (gradeFromContent) return gradeFromContent;

        // Fallback to path-based detection
        const currentFile = window.currentFile?.filepath;
        if (!currentFile) return null;

        const path = currentFile.toLowerCase();

        // Check for grade patterns in path
        if (path.includes('/g6/') || path.includes('formatg6')) return 6;
        if (path.includes('/g7/') || path.includes('global-success-7')) return 7;
        if (path.includes('/g8/') || path.includes('global-success-8')) return 8;
        if (path.includes('/g9/') || path.includes('global-success-9')) return 9;
        if (path.includes('/g10/') || path.includes('global-success-10')) return 10;
        if (path.includes('/g11/') || path.includes('global-success-11')) return 11;
        if (path.includes('/g12/') || path.includes('global-success-12')) return 12;

        return null;
    }

    detectGradeFromContent() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;

        const range = selection.getRangeAt(0);
        const selectedElement = range.commonAncestorContainer;

        // Get the document text up to the selection point
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let textContent = '';
        let node;
        let reachedSelection = false;

        // Walk through all text nodes until we reach the selection
        while (node = walker.nextNode()) {
            if (!reachedSelection) {
                textContent += node.textContent + ' ';

                // Check if we've reached the selection point
                if (node === selectedElement ||
                    selectedElement.contains && selectedElement.contains(node) ||
                    node.contains && node.contains(selectedElement)) {
                    reachedSelection = true;
                }
            }
        }

        // Search for grade patterns in the text before selection
        const gradePatterns = [
            /grade\s*(\d{1,2})/gi,
            /lớp\s*(\d{1,2})/gi,
            /g(\d{1,2})\b/gi,
            /class\s*(\d{1,2})/gi,
            /(\d{1,2})th\s*grade/gi,
            /khối\s*(\d{1,2})/gi
        ];

        let lastFoundGrade = null;
        let lastFoundPosition = -1;

        // Find the most recent (nearest to selection) grade mention
        for (const pattern of gradePatterns) {
            let match;
            pattern.lastIndex = 0; // Reset regex

            while ((match = pattern.exec(textContent)) !== null) {
                const grade = parseInt(match[1]);
                if (grade >= 6 && grade <= 12) {
                    // This is a more recent occurrence
                    if (match.index > lastFoundPosition) {
                        lastFoundGrade = grade;
                        lastFoundPosition = match.index;
                    }
                }
            }
        }

        return lastFoundGrade;
    }

    detectContextFromDocument() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;

        // First try to detect from document content (most accurate)
        const contextFromContent = this.detectContextFromContent();
        if (contextFromContent) return contextFromContent;

        // Fallback to heading-based detection
        return this.detectContextFromHeadings();
    }

    detectContextFromContent() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;

        const range = selection.getRangeAt(0);
        const selectedElement = range.commonAncestorContainer;

        // Get the document text up to the selection point
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let textContent = '';
        let node;
        let reachedSelection = false;

        // Walk through all text nodes until we reach the selection
        while (node = walker.nextNode()) {
            if (!reachedSelection) {
                textContent += node.textContent + ' ';

                // Check if we've reached the selection point
                if (node === selectedElement ||
                    selectedElement.contains && selectedElement.contains(node) ||
                    node.contains && node.contains(selectedElement)) {
                    reachedSelection = true;
                }
            }
        }

        // Search for unit and context patterns in the text before selection
        const unitPatterns = [
            /UNIT\s*(\d+)\s*:\s*([^\\n]+)/gi,
            /unit\s*(\d+)\s*:\s*([^\\n]+)/gi,
            /Unit\s*(\d+)\s*:\s*([^\\n]+)/gi,
            /UNIT\s*(\d+)\s*-\s*([^\\n]+)/gi,
            /unit\s*(\d+)\s*-\s*([^\\n]+)/gi
        ];

        const sessionPatterns = [
            /GETTING\s*STARTED/gi,
            /A\s*CLOSER\s*LOOK/gi,
            /COMMUNICATION\s*AND\s*CULTURE/gi,
            /SKILLS/gi,
            /LOOKING\s*BACK/gi,
            /PROJECT/gi,
            /REVIEW/gi,
            /getting\s*started/gi,
            /a\s*closer\s*look/gi,
            /communication\s*and\s*culture/gi,
            /looking\s*back/gi,
            /vocabulary/gi,
            /practice/gi,
            /lesson/gi
        ];

        let lastFoundUnit = null;
        let lastFoundSession = null;
        let lastUnitPosition = -1;
        let lastSessionPosition = -1;

        // Find the most recent unit mention
        for (const pattern of unitPatterns) {
            let match;
            pattern.lastIndex = 0; // Reset regex

            while ((match = pattern.exec(textContent)) !== null) {
                const unitNumber = parseInt(match[1]);
                const unitTitle = match[2].trim();

                if (unitNumber >= 1 && unitNumber <= 20) {
                    // This is a more recent occurrence
                    if (match.index > lastUnitPosition) {
                        lastFoundUnit = {
                            number: unitNumber,
                            title: unitTitle,
                            fullText: match[0].trim()
                        };
                        lastUnitPosition = match.index;
                    }
                }
            }
        }

        // Find the most recent session mention
        for (const pattern of sessionPatterns) {
            let match;
            pattern.lastIndex = 0; // Reset regex

            while ((match = pattern.exec(textContent)) !== null) {
                // This is a more recent occurrence
                if (match.index > lastSessionPosition) {
                    lastFoundSession = match[0].trim();
                    lastSessionPosition = match.index;
                }
            }
        }

        // Build context from what we found
        if (lastFoundUnit && lastFoundSession) {
            // Check which one is more recent
            if (lastUnitPosition > lastSessionPosition) {
                // Unit is more recent, session might be part of previous context
                return lastFoundUnit.fullText;
            } else {
                // Session is more recent than unit
                if (lastFoundUnit) {
                    return `Unit ${lastFoundUnit.number}: ${lastFoundSession}`;
                } else {
                    return lastFoundSession;
                }
            }
        } else if (lastFoundUnit) {
            return lastFoundUnit.fullText;
        } else if (lastFoundSession) {
            return lastFoundSession;
        }

        return null;
    }

    detectContextFromHeadings() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;

        const range = selection.getRangeAt(0);
        const selectedElement = range.commonAncestorContainer;

        // Find the closest heading before the selection
        let currentElement = selectedElement.nodeType === Node.TEXT_NODE
            ? selectedElement.parentElement
            : selectedElement;

        const foundHeadings = [];

        // Search upward and through previous siblings for headings
        while (currentElement && currentElement !== document.body) {
            // Check previous siblings for headings
            let sibling = currentElement.previousElementSibling;
            while (sibling) {
                if (sibling.tagName && /^H[1-6]$/.test(sibling.tagName)) {
                    const headingText = sibling.textContent.trim();
                    foundHeadings.push({ text: headingText, level: parseInt(sibling.tagName[1]) });
                }
                sibling = sibling.previousElementSibling;
            }

            // Check current element if it's a heading
            if (currentElement.tagName && /^H[1-6]$/.test(currentElement.tagName)) {
                const headingText = currentElement.textContent.trim();
                foundHeadings.push({ text: headingText, level: parseInt(currentElement.tagName[1]) });
            }

            currentElement = currentElement.parentElement;
        }

        // Sort headings by level (H1 first, then H2, etc.) to find hierarchy
        foundHeadings.sort((a, b) => a.level - b.level);

        // Return the most relevant heading
        if (foundHeadings.length > 0) {
            return foundHeadings[0].text;
        }

        // Fallback: check filename for context
        const currentFile = window.currentFile?.filepath;
        if (currentFile) {
            const filename = currentFile.toLowerCase();

            // Extract unit from filename
            const unitMatch = filename.match(/unit[-_]?(\d+)/i);
            if (unitMatch) {
                return `Unit ${unitMatch[1]}`;
            }
        }

        return null;
    }

    showVocabularyProgress() {
        // Remove any existing progress indicator
        this.hideVocabularyProgress();

        const progressDiv = document.createElement('div');
        progressDiv.id = 'vocabulary-progress';
        progressDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 10000;
                        background: white; border: 2px solid #3b82f6; border-radius: 8px;
                        padding: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.15);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 24px; height: 24px; border: 3px solid #e5e7eb;
                                border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    <div>
                        <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">Processing Vocabulary</div>
                        <div style="font-size: 13px; color: #6b7280;">Analyzing selected text...</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(progressDiv);
    }

    hideVocabularyProgress() {
        const progressDiv = document.getElementById('vocabulary-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
    }

    showVocabularyError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 10000;
                        background: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px;
                        padding: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); max-width: 350px; cursor: pointer;">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div style="color: #dc2626; font-size: 18px;">⚠️</div>
                    <div>
                        <div style="font-weight: 600; color: #7f1d1d; margin-bottom: 6px;">Vocabulary Processing Error</div>
                        <div style="font-size: 13px; color: #991b1b; line-height: 1.4;">
                            ${message}
                        </div>
                    </div>
                </div>
                <div style="font-size: 11px; margin-top: 5px; opacity: 0.8;">
                    Click to dismiss
                </div>
            </div>
        `;

        errorDiv.addEventListener('click', () => errorDiv.remove());
        document.body.appendChild(errorDiv);

        // Auto-hide after 7 seconds
        setTimeout(() => errorDiv.remove(), 7000);
    }

    showVocabularyModal(selectedText, grade, context) {
        // Remove existing modal if any
        const existingModal = document.getElementById('vocabulary-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'vocabulary-modal';
        modal.innerHTML = `
            <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10000;
                        display: flex; align-items: center; justify-content: center; padding: 20px;">
                <div style="background: white; border-radius: 12px; padding: 24px;
                            max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="font-size: 20px; font-weight: 600; color: #1f2937;">Process Vocabulary</h2>
                        <button onclick="document.getElementById('vocabulary-modal').remove()"
                                style="background: none; border: none; font-size: 24px; cursor: pointer;
                                       color: #6b7280; padding: 4px;">×</button>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-weight: 500; margin-bottom: 8px; color: #374151;">Selected Text:</label>
                        <div style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px;
                                    padding: 12px; font-size: 14px; max-height: 120px; overflow-y: auto;">
                            ${selectedText.replace(/\n/g, '<br>')}
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                        <div>
                            <label style="display: block; font-weight: 500; margin-bottom: 8px; color: #374151;">Grade:</label>
                            <select id="vocab-grade" style="width: 100%; padding: 8px; border: 1px solid #d1d5db;
                                                           border-radius: 6px; font-size: 14px;">
                                <option value="">Auto-detect</option>
                                <option value="6" ${grade === 6 ? 'selected' : ''}>Grade 6</option>
                                <option value="7" ${grade === 7 ? 'selected' : ''}>Grade 7</option>
                                <option value="8" ${grade === 8 ? 'selected' : ''}>Grade 8</option>
                                <option value="9" ${grade === 9 ? 'selected' : ''}>Grade 9</option>
                                <option value="10" ${grade === 10 ? 'selected' : ''}>Grade 10</option>
                                <option value="11" ${grade === 11 ? 'selected' : ''}>Grade 11</option>
                                <option value="12" ${grade === 12 ? 'selected' : ''}>Grade 12</option>
                            </select>
                        </div>

                        <div>
                            <label style="display: block; font-weight: 500; margin-bottom: 8px; color: #374151;">Context:</label>
                            <input type="text" id="vocab-context" value="${context || ''}" placeholder="e.g., Unit 3: Getting Started"
                                   style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button onclick="document.getElementById('vocabulary-modal').remove()"
                                style="padding: 10px 20px; border: 1px solid #d1d5db; background: white;
                                       color: #374151; border-radius: 6px; cursor: pointer; font-size: 14px;">
                            Cancel
                        </button>
                        <button onclick="vocabularyManager.processVocabulary()"
                                style="padding: 10px 20px; background: #3b82f6; color: white; border: none;
                                       border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                            Process Vocabulary
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async processVocabulary() {
        const selectedText = this.selectedText;
        const grade = document.getElementById('vocab-grade')?.value || '';
        const context = document.getElementById('vocab-context')?.value || '';

        // Close modal
        document.getElementById('vocabulary-modal')?.remove();

        this.showVocabularyProgress();

        try {
            const currentFile = window.currentFile?.filepath || '';

            const response = await fetch('/api/vocabulary/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedText,
                    grade: grade ? parseInt(grade) : undefined,
                    context,
                    filepath: currentFile
                })
            });

            const data = await response.json();

            if (data.success) {
                this.showVocabularySuccess(data);
            } else {
                throw new Error(data.message || 'Processing failed');
            }

        } catch (error) {
            this.showVocabularyError('Failed to process vocabulary: ' + error.message);
        } finally {
            this.hideVocabularyProgress();
            this.isProcessing = false;
        }
    }

    showVocabularySuccess(data) {
        const successDiv = document.createElement('div');

        const message = data.message || `Generated ${data.vocabularyEntries?.length || 0} vocabulary entries`;
        const gradeText = data.detectedGrade ? `Grade: ${data.detectedGrade}` : '';
        const contextText = data.detectedContext ? `Context: ${data.detectedContext}` : '';

        successDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 10000;
                        background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px;
                        padding: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); max-width: 400px; cursor: pointer;">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <div style="color: #16a34a; font-size: 18px;">📚</div>
                    <div>
                        <div style="font-weight: 600; color: #14532d; margin-bottom: 6px;">Vocabulary Dashboard</div>
                        <div style="font-size: 13px; color: #166534; line-height: 1.4; margin-bottom: 8px;">
                            ${message}
                        </div>
                        ${gradeText || contextText ? `
                            <div style="font-size: 11px; color: #15803d; line-height: 1.3;">
                                ${gradeText ? `<div>${gradeText}</div>` : ''}
                                ${contextText ? `<div>${contextText}</div>` : ''}
                            </div>
                        ` : ''}
                        ${data.studentUrl ? `
                            <div style="font-size: 11px; color: #15803d; background: white;
                                        padding: 6px; border-radius: 4px; margin-top: 8px;
                                        word-break: break-all; font-family: monospace;">
                                ${data.studentUrl}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div style="font-size: 11px; margin-top: 5px; opacity: 0.8;">
                    Click to dismiss
                </div>
            </div>
        `;

        successDiv.addEventListener('click', () => successDiv.remove());
        document.body.appendChild(successDiv);

        // Auto-hide after 5 seconds (shorter for redirect feedback)
        setTimeout(() => successDiv.remove(), 5000);
    }

    async processSelectedVocabulary() {
        if (this.isProcessing) return;

        const selectedText = this.getSelectedText();
        if (!selectedText) {
            this.showVocabularyError('Please select some text to process vocabulary (minimum 10 characters)');
            return;
        }

        this.selectedText = selectedText;
        this.detectedGrade = this.detectGradeFromPath();
        this.detectedContext = this.detectContextFromDocument();

        // Build URL parameters for the vocabulary dashboard
        const params = new URLSearchParams();
        params.set('text', selectedText);
        if (this.detectedGrade) {
            params.set('grade', this.detectedGrade.toString());
        }
        if (this.detectedContext) {
            params.set('context', this.detectedContext);
        }

        // Add current file path for reference
        if (window.currentFile?.filepath) {
            params.set('source', window.currentFile.filepath);
        }

        // Open vocabulary teaching dashboard in new tab
        const dashboardUrl = `/v3-vocab?${params.toString()}`;
        window.open(dashboardUrl, '_blank');

        // Show brief feedback
        this.showVocabularySuccess({
            message: 'Opening vocabulary teaching dashboard...',
            detectedGrade: this.detectedGrade,
            detectedContext: this.detectedContext
        });
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
const vocabularyManager = new VocabularyManager();
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

    // Vocabulary processing shortcut (v)
    if (e.key === 'v' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        vocabularyManager.processSelectedVocabulary();
        return;
    }

    // Copy network link (c)
    if (e.key === 'c' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        networkSharingManager.copyCurrentLessonNetworkLink();
        return;
    }

    // Open vocabulary game (g)
    if (e.key === 'g' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        if (typeof gameLauncher !== 'undefined') {
            gameLauncher.openGame();
        }
        return;
    }

    // Open classroom battle (Shift+G)
    if (e.key === 'G' && e.shiftKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        if (typeof gameLauncher !== 'undefined') {
            gameLauncher.openGame('classroom');
        }
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

// ============================================
// Game Launcher - Open vocabulary game from viewer
// ============================================

class GameLauncher {
    constructor() {
        this.gameBaseUrl = 'http://localhost:3006';
        this.setupGameButton();
    }

    /**
     * Parse filepath to extract grade and unit
     * Examples:
     *   "g11/grade-11-unit-5-getting-started.md" -> { grade: 11, unit: 5 }
     *   "global-success-7/unit-01.md" -> { grade: 7, unit: 1 }
     */
    parseLesson(filepath) {
        if (!filepath) return null;

        const result = { grade: null, unit: null, lesson: null };

        // Try to extract grade
        // Pattern: g11, grade-11, global-success-11, etc.
        const gradeMatch = filepath.match(/(?:g|grade[- ]?|global[- ]?success[- ]?)(\d+)/i);
        if (gradeMatch) {
            result.grade = parseInt(gradeMatch[1]);
        }

        // Try to extract unit
        // Pattern: unit-5, unit-05, unit5, etc.
        const unitMatch = filepath.match(/unit[- ]?0?(\d+)/i);
        if (unitMatch) {
            result.unit = parseInt(unitMatch[1]);
        }

        // Try to extract lesson type
        // Pattern: getting-started, reading, speaking, listening, writing, etc.
        const lessonTypes = ['getting-started', 'reading', 'speaking', 'listening', 'writing', 'looking-back', 'project'];
        for (const type of lessonTypes) {
            if (filepath.toLowerCase().includes(type)) {
                result.lesson = type;
                break;
            }
        }

        return result;
    }

    /**
     * Build vocabulary set key from lesson info
     */
    buildVocabSetKey(lessonInfo) {
        if (!lessonInfo || !lessonInfo.grade || !lessonInfo.unit) {
            return null;
        }

        // Format: g11-unit-5 or g11-unit-5-reading
        let key = `g${lessonInfo.grade}-unit-${lessonInfo.unit}`;
        if (lessonInfo.lesson) {
            key += `-${lessonInfo.lesson}`;
        }
        return key;
    }

    /**
     * Open vocabulary game with current lesson
     */
    openGame(mode = 'menu') {
        if (!window.currentFile) {
            this.showNotification('Không có file đang mở', 'error');
            return;
        }

        const filepath = window.currentFile.filepath;
        const lessonInfo = this.parseLesson(filepath);
        const vocabSetKey = this.buildVocabSetKey(lessonInfo);

        // Build game URL with parameters
        let gameUrl = this.gameBaseUrl;
        const params = new URLSearchParams();

        if (lessonInfo.grade) params.set('grade', lessonInfo.grade);
        if (lessonInfo.unit) params.set('unit', lessonInfo.unit);
        if (lessonInfo.lesson) params.set('lesson', lessonInfo.lesson);
        if (vocabSetKey) params.set('vocabSet', vocabSetKey);
        if (mode !== 'menu') params.set('mode', mode);

        if (params.toString()) {
            gameUrl += '?' + params.toString();
        }

        // Open in new tab
        window.open(gameUrl, '_blank');

        this.showNotification(`🎮 Đang mở game - Lớp ${lessonInfo.grade || '?'} Unit ${lessonInfo.unit || '?'}`, 'success');
    }

    /**
     * Open game for classroom battle (teacher mode)
     */
    openClassroomBattle() {
        this.openGame('classroom');
    }

    /**
     * Open game for review/quiz
     */
    openReview() {
        this.openGame('review');
    }

    /**
     * Setup game button in the viewer UI
     */
    setupGameButton() {
        // Will be called when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.addGameButtonToUI();
        });

        // If DOM already loaded
        if (document.readyState !== 'loading') {
            this.addGameButtonToUI();
        }
    }

    addGameButtonToUI() {
        const fileActions = document.querySelector('.file-actions');
        if (!fileActions) return;

        // Check if button already exists
        if (document.getElementById('open-game')) return;

        // Create game button
        const gameBtn = document.createElement('button');
        gameBtn.id = 'open-game';
        gameBtn.className = 'action-btn game-btn';
        gameBtn.title = 'Open Vocabulary Game (G)';
        gameBtn.innerHTML = '🎮 Game';
        gameBtn.onclick = () => this.openGame();

        // Create dropdown for game modes
        const dropdown = document.createElement('div');
        dropdown.className = 'game-dropdown';
        dropdown.innerHTML = `
            <button class="action-btn game-btn-main" title="Vocabulary Game (G)">🎮 Game</button>
            <div class="game-dropdown-content">
                <button data-mode="menu">📚 Tự học</button>
                <button data-mode="classroom">🏆 Thi đấu lớp</button>
                <button data-mode="review">📊 Ôn tập</button>
            </div>
        `;

        // Add styles for dropdown
        this.addDropdownStyles();

        // Add click handlers
        dropdown.querySelector('.game-btn-main').onclick = (e) => {
            e.preventDefault();
            dropdown.classList.toggle('open');
        };

        dropdown.querySelectorAll('.game-dropdown-content button').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const mode = btn.dataset.mode;
                dropdown.classList.remove('open');
                this.openGame(mode);
            };
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });

        fileActions.appendChild(dropdown);

        // Also add hint below translation hint
        const translationHint = document.querySelector('.translation-hint');
        if (translationHint) {
            const gameHint = document.createElement('div');
            gameHint.className = 'translation-hint game-hint';
            gameHint.innerHTML = '🎮 <strong>Vocabulary Game:</strong> Press <kbd>G</kbd> to open game';
            translationHint.parentNode.insertBefore(gameHint, translationHint.nextSibling);
        }
    }

    addDropdownStyles() {
        if (document.getElementById('game-dropdown-styles')) return;

        const style = document.createElement('style');
        style.id = 'game-dropdown-styles';
        style.textContent = `
            .game-dropdown {
                position: relative;
                display: inline-block;
            }
            .game-dropdown-content {
                display: none;
                position: absolute;
                right: 0;
                top: 100%;
                background: #1e293b;
                border: 1px solid #334155;
                border-radius: 8px;
                min-width: 150px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 100;
                overflow: hidden;
            }
            .game-dropdown.open .game-dropdown-content {
                display: block;
            }
            .game-dropdown-content button {
                display: block;
                width: 100%;
                padding: 10px 15px;
                border: none;
                background: transparent;
                color: #e2e8f0;
                text-align: left;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            }
            .game-dropdown-content button:hover {
                background: #334155;
            }
            .game-btn-main {
                background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%) !important;
                border-color: #8b5cf6 !important;
            }
            .game-btn-main:hover {
                background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%) !important;
            }
            .game-hint {
                margin-top: 8px;
                color: #a78bfa;
            }
            .game-hint kbd {
                background: #6366f1;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-size: 14px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize Game Launcher
const gameLauncher = new GameLauncher();

// ============================================
// Classroom Timer Widget
// ============================================

class ClassroomTimer {
    constructor() {
        this.isRunning = false;
        this.timeRemaining = 0;
        this.totalTime = 0;
        this.interval = null;
        this.widget = null;
        this.audioContext = null;
        this.presets = [
            { label: '1 phút', seconds: 60 },
            { label: '2 phút', seconds: 120 },
            { label: '3 phút', seconds: 180 },
            { label: '5 phút', seconds: 300 },
            { label: '10 phút', seconds: 600 },
        ];
        this.init();
    }

    init() {
        this.createWidget();
        this.setupKeyboardShortcut();
    }

    getAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    createWidget() {
        // Create floating timer widget
        this.widget = document.createElement('div');
        this.widget.id = 'classroom-timer';
        this.widget.innerHTML = `
            <button class="timer-exit-btn" title="Thoát fullscreen (ESC)">✕ Thoát</button>
            <div class="timer-header">
                <span class="timer-title">⏱️ Timer</span>
                <button class="timer-toggle-btn" title="Thu nhỏ">−</button>
            </div>
            <div class="timer-body">
                <div class="timer-display">
                    <span class="timer-time">00:00</span>
                </div>
                <div class="timer-progress">
                    <div class="timer-progress-bar"></div>
                </div>
                <div class="timer-presets">
                    ${this.presets.map(p => `<button data-seconds="${p.seconds}">${p.label}</button>`).join('')}
                </div>
                <div class="timer-custom">
                    <input type="number" class="timer-custom-input" min="1" max="60" value="5" placeholder="Phút">
                    <button class="timer-custom-btn">Đặt</button>
                </div>
                <div class="timer-controls">
                    <button class="timer-start">▶ Bắt đầu</button>
                    <button class="timer-pause" style="display:none">⏸ Tạm dừng</button>
                    <button class="timer-reset">↺ Reset</button>
                </div>
            </div>
        `;

        this.addWidgetStyles();
        document.body.appendChild(this.widget);

        // Event listeners
        this.setupEventListeners();

        // Start minimized
        this.widget.classList.add('minimized');
    }

    addWidgetStyles() {
        if (document.getElementById('timer-widget-styles')) return;

        const style = document.createElement('style');
        style.id = 'timer-widget-styles';
        style.textContent = `
            #classroom-timer {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border: 2px solid #6366f1;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
                z-index: 9999;
                font-family: 'Segoe UI', system-ui, sans-serif;
                color: #e2e8f0;
                min-width: 200px;
                transition: all 0.3s ease;
                overflow: hidden;
            }
            #classroom-timer.minimized .timer-body {
                display: none;
            }
            #classroom-timer.minimized {
                min-width: 120px;
            }
            #classroom-timer.warning {
                border-color: #f59e0b;
                animation: timer-pulse 0.5s ease-in-out infinite alternate;
            }
            #classroom-timer.danger {
                border-color: #ef4444;
                animation: timer-pulse 0.3s ease-in-out infinite alternate;
            }
            @keyframes timer-pulse {
                from { box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3); }
                to { box-shadow: 0 8px 48px rgba(239, 68, 68, 0.6); }
            }
            .timer-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background: rgba(99, 102, 241, 0.2);
                cursor: move;
            }
            .timer-title {
                font-weight: 600;
                font-size: 14px;
            }
            .timer-toggle-btn {
                background: none;
                border: none;
                color: #94a3b8;
                font-size: 18px;
                cursor: pointer;
                padding: 0 5px;
            }
            .timer-toggle-btn:hover {
                color: #e2e8f0;
            }
            .timer-body {
                padding: 15px;
            }
            .timer-display {
                text-align: center;
                margin-bottom: 10px;
            }
            .timer-time {
                font-size: 48px;
                font-weight: 700;
                font-family: 'Courier New', monospace;
                color: #fff;
                text-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
            }
            #classroom-timer.warning .timer-time {
                color: #f59e0b;
            }
            #classroom-timer.danger .timer-time {
                color: #ef4444;
            }
            .timer-progress {
                height: 6px;
                background: #334155;
                border-radius: 3px;
                margin-bottom: 15px;
                overflow: hidden;
            }
            .timer-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #6366f1, #8b5cf6);
                border-radius: 3px;
                width: 100%;
                transition: width 0.5s linear;
            }
            #classroom-timer.warning .timer-progress-bar {
                background: linear-gradient(90deg, #f59e0b, #fbbf24);
            }
            #classroom-timer.danger .timer-progress-bar {
                background: linear-gradient(90deg, #ef4444, #f87171);
            }
            .timer-presets {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-bottom: 10px;
            }
            .timer-presets button {
                flex: 1;
                min-width: 60px;
                padding: 6px 10px;
                background: #334155;
                border: 1px solid #475569;
                border-radius: 6px;
                color: #e2e8f0;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .timer-presets button:hover {
                background: #475569;
                border-color: #6366f1;
            }
            .timer-presets button.active {
                background: #6366f1;
                border-color: #6366f1;
            }
            .timer-custom {
                display: flex;
                gap: 5px;
                margin-bottom: 10px;
            }
            .timer-custom-input {
                flex: 1;
                padding: 6px 10px;
                background: #1e293b;
                border: 1px solid #475569;
                border-radius: 6px;
                color: #e2e8f0;
                font-size: 14px;
                text-align: center;
            }
            .timer-custom-btn {
                padding: 6px 15px;
                background: #475569;
                border: 1px solid #6366f1;
                border-radius: 6px;
                color: #e2e8f0;
                font-size: 12px;
                cursor: pointer;
            }
            .timer-custom-btn:hover {
                background: #6366f1;
            }
            .timer-controls {
                display: flex;
                gap: 8px;
            }
            .timer-controls button {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .timer-start {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
            }
            .timer-start:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
            }
            .timer-pause {
                background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                color: white;
            }
            .timer-reset {
                background: #475569;
                color: #e2e8f0;
            }
            .timer-reset:hover {
                background: #64748b;
            }
            /* Fullscreen mode for classroom display */
            #classroom-timer.fullscreen {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-width: 100%;
            }
            #classroom-timer.fullscreen .timer-header {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                padding: 20px;
                background: transparent;
            }
            #classroom-timer.fullscreen .timer-time {
                font-size: 200px;
            }
            #classroom-timer.fullscreen .timer-body {
                width: 100%;
                max-width: 600px;
            }
            #classroom-timer.fullscreen .timer-exit-btn {
                display: block;
            }
            .timer-exit-btn {
                display: none;
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(239, 68, 68, 0.8);
                border: none;
                color: white;
                font-size: 16px;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                z-index: 10;
            }
            .timer-exit-btn:hover {
                background: rgba(239, 68, 68, 1);
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Toggle minimize
        this.widget.querySelector('.timer-toggle-btn').onclick = () => {
            this.widget.classList.toggle('minimized');
            const btn = this.widget.querySelector('.timer-toggle-btn');
            btn.textContent = this.widget.classList.contains('minimized') ? '+' : '−';
        };

        // Preset buttons
        this.widget.querySelectorAll('.timer-presets button').forEach(btn => {
            btn.onclick = () => {
                const seconds = parseInt(btn.dataset.seconds);
                this.setTime(seconds);
                this.widget.querySelectorAll('.timer-presets button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        // Custom time
        this.widget.querySelector('.timer-custom-btn').onclick = () => {
            const input = this.widget.querySelector('.timer-custom-input');
            const minutes = parseInt(input.value) || 5;
            this.setTime(minutes * 60);
        };

        // Start/Pause
        this.widget.querySelector('.timer-start').onclick = () => this.start();
        this.widget.querySelector('.timer-pause').onclick = () => this.pause();
        this.widget.querySelector('.timer-reset').onclick = () => this.reset();

        // Make draggable
        this.makeDraggable();

        // Double-click header for fullscreen
        this.widget.querySelector('.timer-header').ondblclick = () => {
            this.toggleFullscreen();
        };

        // Exit button for fullscreen mode
        this.widget.querySelector('.timer-exit-btn').onclick = () => {
            this.exitFullscreen();
        };
    }

    toggleFullscreen() {
        const wasFullscreen = this.widget.classList.contains('fullscreen');
        this.widget.classList.toggle('fullscreen');

        // Reset position when exiting fullscreen
        if (wasFullscreen) {
            this.resetPosition();
        }
    }

    exitFullscreen() {
        if (this.widget.classList.contains('fullscreen')) {
            this.widget.classList.remove('fullscreen');
            this.resetPosition();
        }
    }

    resetPosition() {
        this.widget.style.left = '';
        this.widget.style.right = '';
        this.widget.style.top = '';
        this.widget.style.bottom = '';
    }

    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // ESC to exit fullscreen
            if (e.key === 'Escape' && this.widget.classList.contains('fullscreen')) {
                e.preventDefault();
                this.exitFullscreen();
                return;
            }

            // T key (with Alt) to toggle timer
            if (e.key === 't' && e.altKey) {
                e.preventDefault();
                this.widget.classList.toggle('minimized');
                const btn = this.widget.querySelector('.timer-toggle-btn');
                btn.textContent = this.widget.classList.contains('minimized') ? '+' : '−';
            }
        });
    }

    makeDraggable() {
        const header = this.widget.querySelector('.timer-header');
        let isDragging = false;
        let offsetX, offsetY;

        header.onmousedown = (e) => {
            if (this.widget.classList.contains('fullscreen')) return;
            isDragging = true;
            offsetX = e.clientX - this.widget.offsetLeft;
            offsetY = e.clientY - this.widget.offsetTop;
            this.widget.style.transition = 'none';
        };

        document.onmousemove = (e) => {
            if (!isDragging) return;
            const x = Math.max(0, Math.min(window.innerWidth - this.widget.offsetWidth, e.clientX - offsetX));
            const y = Math.max(0, Math.min(window.innerHeight - this.widget.offsetHeight, e.clientY - offsetY));
            this.widget.style.left = x + 'px';
            this.widget.style.right = 'auto';
            this.widget.style.top = y + 'px';
            this.widget.style.bottom = 'auto';
        };

        document.onmouseup = () => {
            isDragging = false;
            this.widget.style.transition = 'all 0.3s ease';
        };
    }

    setTime(seconds) {
        this.totalTime = seconds;
        this.timeRemaining = seconds;
        this.updateDisplay();
        this.widget.classList.remove('warning', 'danger');
    }

    start() {
        if (this.timeRemaining <= 0) return;

        this.isRunning = true;
        this.widget.querySelector('.timer-start').style.display = 'none';
        this.widget.querySelector('.timer-pause').style.display = 'block';
        this.widget.classList.remove('minimized');

        // Play start sound
        this.playSound('start');

        this.interval = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();

            // Warning at 30 seconds
            if (this.timeRemaining === 30) {
                this.widget.classList.add('warning');
                this.playSound('warning');
            }

            // Danger at 10 seconds
            if (this.timeRemaining === 10) {
                this.widget.classList.remove('warning');
                this.widget.classList.add('danger');
            }

            // Last 5 seconds tick
            if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
                this.playSound('tick');
            }

            // Time's up
            if (this.timeRemaining <= 0) {
                this.stop();
                this.playSound('timesUp');
            }
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.interval);
        this.widget.querySelector('.timer-start').style.display = 'block';
        this.widget.querySelector('.timer-pause').style.display = 'none';
    }

    stop() {
        this.pause();
        this.widget.classList.remove('warning', 'danger');
    }

    reset() {
        this.stop();
        this.timeRemaining = this.totalTime;
        this.updateDisplay();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.widget.querySelector('.timer-time').textContent = display;

        // Update progress bar
        const progress = this.totalTime > 0 ? (this.timeRemaining / this.totalTime) * 100 : 100;
        this.widget.querySelector('.timer-progress-bar').style.width = progress + '%';
    }

    playSound(type) {
        try {
            const ctx = this.getAudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const sounds = {
                start: { freq: 800, duration: 0.2, wave: 'sine' },
                tick: { freq: 1000, duration: 0.05, wave: 'square' },
                warning: { freq: 600, duration: 0.3, wave: 'triangle' },
                timesUp: { freq: 440, duration: 0.5, wave: 'sawtooth' },
            };

            const sound = sounds[type] || sounds.tick;
            osc.frequency.value = sound.freq;
            osc.type = sound.wave;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + sound.duration);
            osc.start();
            osc.stop(ctx.currentTime + sound.duration);

            // For time's up, play multiple beeps
            if (type === 'timesUp') {
                for (let i = 1; i < 4; i++) {
                    setTimeout(() => {
                        const o = ctx.createOscillator();
                        const g = ctx.createGain();
                        o.connect(g);
                        g.connect(ctx.destination);
                        o.frequency.value = 880;
                        o.type = 'square';
                        g.gain.setValueAtTime(0.3, ctx.currentTime);
                        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                        o.start();
                        o.stop(ctx.currentTime + 0.15);
                    }, i * 200);
                }
            }
        } catch (e) {
            console.warn('Could not play timer sound:', e);
        }
    }
}

// Initialize Timer Widget
const classroomTimer = new ClassroomTimer();