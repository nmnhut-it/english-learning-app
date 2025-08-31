// Simplified Mobile Viewer JavaScript for V3 Markdown Viewer

// Mobile Audio Manager for pronunciation
class MobileAudioManager {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.isSupported = 'speechSynthesis' in window;
        this.currentUtterance = null;
        this.init();
    }

    init() {
        if (!this.isSupported) {
            console.log('Speech synthesis not supported');
            return;
        }

        this.loadVoices();
        
        // Voices might load asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        console.log('Available voices:', this.voices.length);
    }

    findBestVoice(language = 'en') {
        if (language === 'en') {
            // Prefer British English, fallback to any English
            return this.voices.find(voice => 
                voice.lang.includes('en-GB') || 
                voice.lang.includes('en-UK')
            ) || this.voices.find(voice => voice.lang.startsWith('en'));
        } else if (language === 'vi') {
            // Vietnamese voice
            return this.voices.find(voice => voice.lang.startsWith('vi'));
        }
        
        return this.voices[0]; // Default fallback
    }

    speak(text, language = 'en', rate = 0.8) {
        if (!this.isSupported || !text.trim()) return;

        // Stop any current speech
        this.stop();

        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voice = this.findBestVoice(language);
        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        } else {
            utterance.lang = language === 'en' ? 'en-GB' : 'vi-VN';
        }

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
        
        return utterance;
    }

    stop() {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        this.currentUtterance = null;
    }

    isSpeaking() {
        return this.synth.speaking;
    }
}

class SimpleMobileTranslationManager {
    constructor() {
        this.isTranslating = false;
        this.translationFiles = [];
        this.audioManager = new MobileAudioManager();
        this.networkInfo = null;
        this.init();
    }

    init() {
        this.setupClickToTranslate();
        this.setupViewToggle();
        this.setupNavigationPanel();
        this.loadTranslationFiles();
        this.loadNetworkInfo();
    }

    async loadNetworkInfo() {
        try {
            const response = await fetch('/api/network-info');
            this.networkInfo = await response.json();
            console.log('Network info loaded:', this.networkInfo);
        } catch (error) {
            console.error('Failed to load network info:', error);
        }
    }

    setupClickToTranslate() {
        const content = document.getElementById('mobile-rendered-content');
        if (!content) return;

        // Add click handlers to all text content
        content.addEventListener('click', (e) => {
            const clickedElement = e.target;
            
            // Find the sentence containing the clicked text
            const sentence = this.detectSentence(clickedElement, e);
            
            if (sentence && sentence.length > 10) {
                // Show context menu for translation
                this.showTranslateContextMenu(e, sentence);
            }
        });
    }

    detectSentence(element, event) {
        // Get the text content from the clicked element or its parent
        let textContainer = element;
        
        // Walk up to find a suitable text container (p, li, div, etc.)
        while (textContainer && textContainer !== document.body) {
            if (textContainer.tagName && ['P', 'LI', 'DIV', 'BLOCKQUOTE', 'TD'].includes(textContainer.tagName)) {
                break;
            }
            textContainer = textContainer.parentElement;
        }
        
        if (!textContainer) return null;
        
        const fullText = textContainer.textContent || textContainer.innerText;
        
        // Simple sentence detection - split by sentence endings
        const sentences = fullText.match(/[^\.!?]+[\.!?]+/g) || [fullText];
        
        // If only one sentence, return it
        if (sentences.length === 1) {
            return sentences[0].trim();
        }
        
        // For multiple sentences, try to detect which one was clicked
        // This is a simple approach - could be enhanced
        const clickPosition = this.getClickPositionInText(event, textContainer);
        let charCount = 0;
        
        for (const sentence of sentences) {
            charCount += sentence.length;
            if (clickPosition <= charCount) {
                return sentence.trim();
            }
        }
        
        // Fallback to first sentence
        return sentences[0].trim();
    }

    getClickPositionInText(event, container) {
        // Approximate click position in text - simplified approach
        const rect = container.getBoundingClientRect();
        const clickY = event.clientY - rect.top;
        const containerHeight = rect.height;
        const textLength = container.textContent.length;
        
        // Rough estimation based on vertical position
        const relativePosition = clickY / containerHeight;
        return Math.floor(relativePosition * textLength);
    }

    showTranslateContextMenu(event, sentence) {
        // Remove any existing context menu
        this.hideContextMenu();

        const contextMenu = document.createElement('div');
        contextMenu.id = 'mobile-translate-context';
        contextMenu.className = 'mobile-translate-context';
        
        contextMenu.innerHTML = `
            <div class="mobile-context-option" data-action="translate">
                🔤 Translate this sentence
            </div>
            <div class="mobile-context-option" data-action="cancel">
                ✕ Cancel
            </div>
        `;

        // Position near click
        contextMenu.style.position = 'absolute';
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';
        contextMenu.style.zIndex = '2000';

        document.body.appendChild(contextMenu);

        // Add event handlers
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'translate') {
                this.translateSentence(sentence);
            }
            this.hideContextMenu();
        });

        // Auto-hide after 5 seconds
        setTimeout(() => this.hideContextMenu(), 5000);
    }

    hideContextMenu() {
        const existing = document.getElementById('mobile-translate-context');
        if (existing) {
            existing.remove();
        }
    }

    async translateSentence(sentence) {
        if (this.isTranslating) return;

        this.isTranslating = true;
        this.showSentenceTranslationModal(sentence);

        try {
            const response = await fetch('/api/translate-sentence', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sentence: sentence.trim(),
                    sourceFile: window.currentFile?.filepath || 'unknown.md',
                    metadata: {
                        context: 'Mobile sentence translation'
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                // Show if result came from cache or fresh API call
                if (result.fromCache) {
                    this.showToast(`⚡ Instant result from cache (used ${result.debug.usageCount} times)`, 'info', 2000);
                } else {
                    this.showToast('🤖 Fresh translation from AI', 'info', 2000);
                }
                this.displaySentenceBreakdown(result);
            } else {
                this.showTranslationError(result.error || 'Translation failed');
            }

        } catch (error) {
            console.error('Sentence translation error:', error);
            this.showTranslationError(`Network error: ${error.message}`);
        } finally {
            this.isTranslating = false;
        }
    }

    showSentenceTranslationModal(sentence) {
        // Show loading modal with the sentence being translated
        const modal = document.getElementById('mobile-translation-modal');
        if (modal) {
            modal.querySelector('h3').textContent = 'Translating Sentence';
            modal.querySelector('.mobile-modal-body').innerHTML = `
                <div class="mobile-progress">
                    <div class="mobile-progress-spinner"></div>
                    <p>Analyzing sentence structure...</p>
                </div>
                <div class="mobile-sentence-preview">
                    "${sentence.substring(0, 100)}${sentence.length > 100 ? '...' : ''}"
                </div>
            `;
            modal.style.display = 'flex';
        }
    }

    displaySentenceBreakdown(result) {
        const modal = document.getElementById('mobile-translation-modal');
        if (!modal) return;

        // Create detailed breakdown display
        modal.querySelector('h3').textContent = '🔤 Sentence Translation';
        modal.querySelector('.mobile-modal-body').innerHTML = `
            <div class="mobile-sentence-breakdown">
                <div class="mobile-breakdown-section">
                    <h4>📝 English 
                        <button class="mobile-pronounce-btn" onclick="simpleMobileTranslationManager.pronounce('${result.sentence.replace(/'/g, "\\'")}', 'en')" title="Pronounce English">
                            🔊
                        </button>
                    </h4>
                    <p class="mobile-original-text">${result.sentence}</p>
                </div>

                <div class="mobile-breakdown-section">
                    <h4>🇻🇳 Vietnamese 
                        <button class="mobile-pronounce-btn" onclick="simpleMobileTranslationManager.pronounce('${result.translation.replace(/'/g, "\\'")}', 'vi')" title="Pronounce Vietnamese">
                            🔊
                        </button>
                    </h4>
                    <p class="mobile-translation-text">${result.translation}</p>
                </div>

                <div class="mobile-breakdown-section collapsible">
                    <h4 onclick="this.parentElement.classList.toggle('expanded')">
                        📚 Word Analysis <span class="toggle-arrow">▼</span>
                    </h4>
                    <div class="mobile-breakdown-content">
                        ${result.words.map((word, index) => `
                            <div class="mobile-word-item">
                                <span class="word-number">${index + 1}.</span>
                                <span class="word-text">${word.word}:</span>
                                <button class="mobile-word-pronounce-btn" onclick="simpleMobileTranslationManager.pronounce('${word.word.replace(/'/g, "\\'")}', 'en')" title="Pronounce word">
                                    🔊
                                </button>
                                <span class="word-pos">(${word.pos})</span>
                                <span class="word-meaning">${word.meaning}</span>
                                <span class="word-ipa">${word.ipa}</span>
                                ${word.root ? `<span class="word-root">[root: ${word.root}]</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="mobile-breakdown-section collapsible">
                    <h4 onclick="this.parentElement.classList.toggle('expanded')">
                        🔗 Phrase Analysis <span class="toggle-arrow">▼</span>
                    </h4>
                    <div class="mobile-breakdown-content">
                        ${result.phrases.map((phrase, index) => `
                            <div class="mobile-phrase-item">
                                <span class="phrase-number">${index + 1}.</span>
                                <span class="phrase-text">${phrase.phrase}:</span>
                                <span class="phrase-meaning">${phrase.meaning}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="mobile-breakdown-section collapsible">
                    <h4 onclick="this.parentElement.classList.toggle('expanded')">
                        ⚡ Progressive Translation <span class="toggle-arrow">▼</span>
                    </h4>
                    <div class="mobile-breakdown-content">
                        ${result.progressive.map((step, index) => `
                            <div class="mobile-progressive-item">
                                <span class="prog-number">${index + 1}.</span>
                                <span class="prog-english">${step.english}:</span>
                                <button class="mobile-word-pronounce-btn" onclick="simpleMobileTranslationManager.pronounce('${step.english.replace(/'/g, "\\'")}', 'en')" title="Pronounce English">
                                    🔊
                                </button>
                                <span class="prog-vietnamese">${step.vietnamese}</span>
                                <button class="mobile-word-pronounce-btn" onclick="simpleMobileTranslationManager.pronounce('${step.vietnamese.replace(/'/g, "\\'")}', 'vi')" title="Pronounce Vietnamese">
                                    🔊
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="mobile-breakdown-section collapsible">
                    <h4 onclick="this.parentElement.classList.toggle('expanded')">
                        📚 Grammar Analysis <span class="toggle-arrow">▼</span>
                    </h4>
                    <div class="mobile-breakdown-content">
                        <div class="mobile-grammar-text">${result.grammar}</div>
                    </div>
                </div>
            </div>

            <div class="mobile-breakdown-actions">
                <button onclick="simpleMobileTranslationManager.shareTranslation('${result.uuid}', '${result.shortDesc}')" class="mobile-action-btn">
                    📤 Share Translation
                </button>
                <button onclick="simpleMobileTranslationManager.copyNetworkLink('${result.uuid}', '${result.shortDesc}')" class="mobile-action-btn secondary">
                    📋 Copy Network Link
                </button>
                <button onclick="simpleMobileTranslationManager.hideSentenceBreakdown()" class="mobile-action-btn secondary">
                    Close
                </button>
            </div>
        `;

        modal.style.display = 'flex';
    }

    pronounce(text, language = 'en', buttonElement = null) {
        if (!this.audioManager.isSupported) {
            this.showToast('Speech not supported on this device', 'error');
            return;
        }

        // Visual feedback for the button
        if (buttonElement) {
            this.showPronunciationFeedback(buttonElement);
        } else {
            // Find the button that was clicked
            const allPronounceButtons = document.querySelectorAll('.mobile-pronounce-btn, .mobile-word-pronounce-btn');
            allPronounceButtons.forEach(btn => {
                if (btn.onclick && btn.onclick.toString().includes(text.substring(0, 10))) {
                    this.showPronunciationFeedback(btn);
                }
            });
        }

        // Speak the text
        const utterance = this.audioManager.speak(text, language);
        
        if (utterance) {
            utterance.onstart = () => {
                this.showToast(`🔊 ${language === 'en' ? 'Speaking English' : 'Đang phát tiếng Việt'}`, 'info', 1000);
            };
            
            utterance.onerror = () => {
                this.showToast('Pronunciation failed', 'error');
            };
        }
    }

    showPronunciationFeedback(button) {
        if (!button) return;
        
        // Add visual feedback
        button.classList.add('pronouncing');
        button.style.backgroundColor = 'var(--primary-color)';
        button.style.color = 'white';
        
        // Remove feedback after 2 seconds
        setTimeout(() => {
            button.classList.remove('pronouncing');
            button.style.backgroundColor = '';
            button.style.color = '';
        }, 2000);
    }

    shareTranslation(uuid, shortDesc) {
        if (!uuid) {
            this.showToast('Translation not available for sharing', 'error');
            return;
        }

        const shareUrl = `${window.location.origin}/translation/${uuid}`;
        const shareText = `Translation: ${shortDesc}`;

        // Try native sharing first (mobile)
        if (navigator.share) {
            navigator.share({
                title: shareText,
                text: `Check out this English sentence translation: "${shortDesc}"`,
                url: shareUrl
            }).then(() => {
                this.showToast('Translation shared successfully!');
            }).catch((error) => {
                console.log('Share failed, falling back to clipboard:', error);
                this.copyTranslationLink(shareUrl, shareText);
            });
        } else {
            // Fallback to clipboard
            this.copyTranslationLink(shareUrl, shareText);
        }
    }

    copyTranslationLink(url, description) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.showToast('Translation link copied to clipboard!');
            }).catch(() => {
                this.promptTranslationLink(url, description);
            });
        } else {
            this.promptTranslationLink(url, description);
        }
    }

    promptTranslationLink(url, description) {
        // Final fallback - show URL in prompt
        const message = `${description}\n\nCopy this link:`;
        prompt(message, url);
    }

    async copyNetworkLink(uuid, shortDesc) {
        if (!uuid) {
            this.showToast('Translation not available for sharing', 'error');
            return;
        }

        // Ensure network info is loaded
        if (!this.networkInfo) {
            await this.loadNetworkInfo();
        }

        if (!this.networkInfo) {
            this.showToast('Network info not available', 'error');
            return;
        }

        const networkUrl = `${this.networkInfo.serverURL}/translation/${uuid}`;
        const description = `Translation: ${shortDesc}`;

        // Copy network link to clipboard
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(networkUrl);
                this.showToast(`📋 Network link copied!\n${this.networkInfo.localIP}:${this.networkInfo.port}`, 'info', 4000);
            } catch (error) {
                this.promptNetworkLink(networkUrl, description);
            }
        } else {
            this.promptNetworkLink(networkUrl, description);
        }
    }

    promptNetworkLink(url, description) {
        const message = `${description}\n\nNetwork Link (for local devices):\n\n${url}\n\nShare this link with devices on your local network.`;
        prompt(message, url);
    }

    async copyLessonNetworkLink() {
        // Ensure network info is loaded
        if (!this.networkInfo) {
            await this.loadNetworkInfo();
        }

        if (!this.networkInfo) {
            this.showToast('Network info not available', 'error');
            return;
        }

        const currentPath = window.currentFile?.filepath || '';
        const networkUrl = `${this.networkInfo.serverURL}/view/${currentPath}?mobile=1`;
        const lessonTitle = window.currentFile?.title || 'English Lesson';

        // Copy lesson network link to clipboard
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(networkUrl);
                this.showToast(`📋 Lesson link copied!\n${this.networkInfo.localIP}:${this.networkInfo.port}`, 'info', 4000);
            } catch (error) {
                this.promptLessonNetworkLink(networkUrl, lessonTitle);
            }
        } else {
            this.promptLessonNetworkLink(networkUrl, lessonTitle);
        }
    }

    promptLessonNetworkLink(url, title) {
        const message = `Lesson: ${title}\n\nNetwork Link (for local devices):\n\n${url}\n\nShare this link with devices on your local network to access this lesson.`;
        prompt(message, url);
    }

    hideSentenceBreakdown() {
        const modal = document.getElementById('mobile-translation-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    setupTranslationControls() {
        const translateBtn = document.getElementById('mobile-translate-lesson-btn');
        const fabBtn = document.getElementById('mobile-translation-fab-btn');
        const copyLinkBtn = document.getElementById('mobile-copy-lesson-link');

        // Main translate lesson button
        if (translateBtn) {
            translateBtn.addEventListener('click', () => {
                this.translateEntireLesson();
            });
        }

        // Copy lesson link button
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                this.copyLessonNetworkLink();
            });
        }

        // FAB for quick access to translations
        if (fabBtn) {
            fabBtn.addEventListener('click', () => {
                this.showNavigationPanel();
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
                    if (toggleBtn) toggleBtn.textContent = '🔄';
                    if (toggleRawBtn) toggleRawBtn.textContent = '📝 Raw View';
                } else {
                    renderedContent.style.display = 'none';
                    rawContent.style.display = 'block';
                    if (toggleBtn) toggleBtn.textContent = '🎨';
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
        const navClose = document.getElementById('mobile-nav-close');
        const copyLinkBtn = document.getElementById('mobile-copy-link');

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

    async translateEntireLesson() {
        if (this.isTranslating) {
            this.showToast('Translation already in progress', 'error');
            return;
        }

        this.isTranslating = true;
        this.showTranslationModal();
        this.updateTranslateButton();

        try {
            const response = await fetch('/api/translate-auto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourceFile: window.currentFile?.filepath || 'unknown.md',
                    metadata: {
                        context: 'Mobile full lesson translation',
                        userAgent: navigator.userAgent
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                if (result.isMobileResponse) {
                    // For mobile, display translation content directly
                    this.displayTranslationContent(result);
                } else {
                    // For PC compatibility
                    this.showTranslationResult(result);
                    this.loadTranslationFiles();
                }
            } else {
                this.showTranslationError(result.error || 'Translation failed');
            }

        } catch (error) {
            console.error('Translation error:', error);
            this.showTranslationError(`Network error: ${error.message}`);
        } finally {
            this.isTranslating = false;
            this.updateTranslateButton();
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
            this.updateTranslationStatus();
        } catch (error) {
            console.error('Failed to load translation files:', error);
        }
    }

    updateTranslateButton() {
        const btn = document.getElementById('mobile-translate-lesson-btn');
        if (btn) {
            if (this.isTranslating) {
                btn.textContent = '🔄 Translating...';
                btn.disabled = true;
                btn.style.opacity = '0.5';
            } else {
                btn.textContent = '🔤 Translate Lesson';
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        }
    }

    updateTranslationStatus() {
        const status = document.getElementById('mobile-translation-status');
        if (status) {
            if (this.isTranslating) {
                status.textContent = 'Translating lesson...';
                status.style.color = '#f59e0b'; // Orange
            } else if (this.translationFiles.length > 0) {
                status.textContent = `${this.translationFiles.length} translation(s) available`;
                status.style.color = '#10b981'; // Green
            } else if (this.isTranslationFile) {
                status.textContent = 'This is a translation file';
                status.style.color = '#2563eb'; // Blue
            } else {
                status.textContent = 'Ready to translate entire lesson';
                status.style.color = '#64748b'; // Gray
            }
        }
    }

    showTranslationModal() {
        const modal = document.getElementById('mobile-translation-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideTranslationModal() {
        const modal = document.getElementById('mobile-translation-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    displayTranslationContent(result) {
        this.hideTranslationModal();
        
        // Create a new page view with translation content
        const currentContent = document.getElementById('mobile-rendered-content');
        if (currentContent) {
            // Parse markdown to HTML for display
            const translationHtml = this.parseMarkdownToHtml(result.translationContent);
            
            // Replace current content with translation
            currentContent.innerHTML = translationHtml;
            
            // Update header to show this is translation view
            const titleEl = document.querySelector('.mobile-viewer-title h1');
            const statusEl = document.getElementById('mobile-translation-status');
            const translateBtn = document.getElementById('mobile-translate-lesson-btn');
            
            if (titleEl) {
                titleEl.textContent = '🔤 ' + titleEl.textContent;
            }
            
            if (statusEl) {
                statusEl.textContent = 'Viewing translation content';
                statusEl.style.color = '#10b981'; // Green
            }
            
            if (translateBtn) {
                translateBtn.textContent = '📄 Back to Original';
                translateBtn.onclick = () => {
                    location.reload(); // Simple way to go back to original
                };
            }
            
            this.showToast('Translation displayed! Tap "Back to Original" to return.', 'info', 5000);
        }
    }

    parseMarkdownToHtml(markdown) {
        // Simple markdown parsing for mobile display
        // This is a basic implementation - could use marked.js if available
        return markdown
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/<details>/g, '<details>')
            .replace(/<\/details>/g, '</details>')
            .replace(/<summary>(.+?)<\/summary>/g, '<summary>$1</summary>')
            .replace(/^---$/gm, '<hr>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(?!<[h1-6]|<details|<pre|<hr|<\/)/gm, '<p>')
            .replace(/<p><\/p>/g, '');
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
                    <strong>Translation completed!</strong>
                </div>
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
        this.showToast(`Translation failed: ${error}`, 'error', 5000);
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
                    <p>Tap "Translate Lesson" to create one</p>
                </div>
            `;
        }
    }

    updateTranslationFab() {
        const fab = document.getElementById('mobile-translation-fab-btn');
        if (fab) {
            if (this.translationFiles.length > 0 || this.isTranslationFile) {
                fab.style.display = 'block';
                fab.title = 'View translations';
            }
        }
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
            this.copyCurrentLink();
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

// Initialize simple mobile translation manager
let simpleMobileTranslationManager;

document.addEventListener('DOMContentLoaded', () => {
    if (window.isMobile) {
        simpleMobileTranslationManager = new SimpleMobileTranslationManager();
        window.simpleMobileTranslationManager = simpleMobileTranslationManager;
        
        // Setup modal close handlers
        document.getElementById('mobile-result-close')?.addEventListener('click', () => {
            simpleMobileTranslationManager.hideTranslationResult();
        });

        // Close modals on background tap
        document.querySelectorAll('.mobile-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
});