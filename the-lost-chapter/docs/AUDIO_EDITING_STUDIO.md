# Audio Editing Studio - Design Document

## Overview

The **Audio Editing Studio** is an all-in-one Colab notebook that transforms the audiobook creation workflow into a professional-grade studio experience. It consolidates content editing, audio generation, voice cloning, audio tuning, and recording into a single, streamlined interface.

---

## Core Philosophy

1. **One-Click Simplicity**: Each major operation should be achievable with a single click
2. **Non-Destructive Editing**: Original content preserved, changes tracked separately
3. **Preview Before Commit**: All changes reviewable before permanent storage
4. **Professional Quality**: Studio-grade audio processing and editing tools
5. **Offline-Ready**: Generate everything needed for offline distribution

---

## Use Cases

### UC1: Content Management & Review

#### UC1.1: Browse & Navigate Books
```
Actor: Content Creator
Flow:
1. Open Studio notebook
2. View all books in a visual grid (cover, title, progress)
3. Click book to expand chapters
4. Click chapter to load in editor
5. Navigate sections with visual timeline

Features:
- Book cover thumbnails
- Chapter completion indicators
- Section type icons (text, audio, exercise)
- Quick search across all content
```

#### UC1.2: Edit Chapter Content
```
Actor: Content Creator
Flow:
1. Select chapter from navigator
2. View sections in split view (source | preview)
3. Edit markdown content with live preview
4. Add/remove/reorder sections
5. Save changes with version history

Features:
- Rich markdown editor with toolbar
- Live bilingual preview (VI/EN toggle)
- Section drag-and-drop reordering
- Undo/redo with history slider
- Auto-save drafts
```

#### UC1.3: Manage Vocabulary & Translations
```
Actor: Content Creator
Flow:
1. Select text in chapter content
2. Click "Add to Vocabulary" button
3. Fill vocabulary card (word, pronunciation, translation)
4. Link vocabulary to content sections
5. Generate vocabulary bank automatically

Features:
- Inline vocabulary highlighting
- Pronunciation IPA entry with audio preview
- Multiple translation languages
- Vocabulary difficulty rating (A1-C2)
- Export vocabulary lists
```

#### UC1.4: Create & Edit Exercises
```
Actor: Content Creator
Flow:
1. Click "Add Exercise" in section toolbar
2. Select exercise type from palette
3. Fill exercise template
4. Preview interactive exercise
5. Set correct answers and feedback

Exercise Types:
- Multiple Choice (single/multi select)
- True/False with explanation
- Fill in the Blank (single/multiple)
- Matching pairs
- Ordering/Sequencing
- Listening comprehension
- Pronunciation practice
```

---

### UC2: Voice Cloning & Profile Management

#### UC2.1: Record Voice Sample
```
Actor: Content Creator
Flow:
1. Click "Record Voice" button
2. Read provided script (optimized for voice capture)
3. Review recording with waveform display
4. Apply noise reduction if needed
5. Save as voice profile

Features:
- Visual recording indicator with timer
- Real-time waveform display
- Background noise detection warning
- Multiple take support
- Best take selection
```

#### UC2.2: Upload Voice Sample
```
Actor: Content Creator
Flow:
1. Click "Upload Voice Sample"
2. Select audio file (WAV, MP3, M4A, etc.)
3. Preview and trim sample
4. Set language and profile name
5. Process into voice profile

Requirements:
- 30-60 seconds recommended
- Clear speech, minimal noise
- Single speaker only
- Supports: WAV, MP3, M4A, FLAC, OGG
```

#### UC2.3: Clone Voice to Profile
```
Actor: Content Creator
Flow:
1. Select voice sample (recorded or uploaded)
2. Click "Create Voice Profile"
3. Wait for viXTTS processing (30-60 sec)
4. Preview cloned voice with test phrase
5. Save profile with metadata

Output:
- voice-profile.pt (PyTorch embeddings)
- voice-config.json (metadata)
- voice-sample.wav (reference audio)
```

#### UC2.4: Manage Voice Profiles
```
Actor: Content Creator
Flow:
1. View all voice profiles in gallery
2. Play sample preview for each
3. Edit profile metadata (name, language, tags)
4. Delete unused profiles
5. Set default voice per language

Features:
- Profile comparison (A/B testing)
- Profile sharing/export
- Profile import from URL
- Multi-character voice sets
```

---

### UC3: Audio Generation

#### UC3.1: Generate Chapter Audio
```
Actor: Content Creator
Flow:
1. Select chapter in navigator
2. Choose voice profile (or default)
3. Configure generation settings
4. Click "Generate Audio"
5. Monitor progress with preview

Settings:
- Voice: Select from profiles
- Language: Vietnamese / English / Both
- Speed: 0.8x - 1.2x
- Temperature: 0.3 - 0.9 (variation)
- Pause between sentences: 0.3s - 1.5s
```

#### UC3.2: Generate Section Audio
```
Actor: Content Creator
Flow:
1. Select specific section in chapter
2. Click "Generate Audio for Section"
3. Preview generated audio
4. Accept or regenerate with different settings
5. Auto-replace existing audio

Features:
- Section-level regeneration
- Keep/replace decision per section
- Batch section selection
- Selective regeneration
```

#### UC3.3: Batch Audio Generation
```
Actor: Content Creator
Flow:
1. Select multiple chapters
2. Configure batch settings
3. Start batch generation
4. Monitor progress dashboard
5. Review all generated audio

Features:
- Chapter queue management
- Parallel generation (if resources allow)
- Skip already generated
- Force regenerate option
- Generation time estimates
```

#### UC3.4: Multi-Engine Audio Generation
```
Actor: Content Creator
Flow:
1. Select TTS engine
2. Configure engine-specific settings
3. Generate audio
4. Compare engine outputs
5. Select best result

Engines:
- Edge TTS: Fast, no GPU, natural voices
- viXTTS: Voice cloning, GPU required
- XTTS v2: Multi-language, GPU required
```

---

### UC4: Audio Editing & Tuning

#### UC4.1: Timeline Editor
```
Actor: Content Creator
Flow:
1. Load chapter audio in timeline
2. View waveform with sentence markers
3. Click sentence to jump to position
4. Adjust sentence boundaries
5. Save updated timestamps

Features:
- Zoomable waveform display
- Sentence marker drag-and-drop
- Gap/silence detection
- Crossfade transitions
- Split/merge sentences
```

#### UC4.2: Audio Enhancement
```
Actor: Content Creator
Flow:
1. Select audio section
2. Open enhancement panel
3. Apply enhancement presets
4. Preview enhanced audio
5. Accept or revert changes

Enhancements:
- Noise reduction (levels 1-5)
- Volume normalization
- EQ presets (warm, bright, clear)
- Compression (podcast style)
- De-essing (reduce sibilance)
- Reverb removal
```

#### UC4.3: Segment Editing
```
Actor: Content Creator
Flow:
1. Select segment on timeline
2. Choose edit operation
3. Apply edit with preview
4. Fine-tune boundaries
5. Commit changes

Operations:
- Trim start/end
- Delete segment
- Move segment
- Copy/paste segment
- Insert silence
- Crossfade segments
```

#### UC4.4: Pronunciation Correction
```
Actor: Content Creator
Flow:
1. Play audio with transcript
2. Click mispronounced word
3. Choose correction method:
   a. Re-record segment
   b. Regenerate with phonetic hint
   c. Replace from library
4. Preview corrected audio
5. Accept replacement

Features:
- Phonetic override input
- Pronunciation dictionary
- Word-level regeneration
- Seamless splice
```

#### UC4.5: Timing Adjustment
```
Actor: Content Creator
Flow:
1. View transcript with audio
2. Identify timing issues
3. Drag sentence boundaries
4. Adjust pause duration
5. Preview and save

Features:
- Pause insertion/removal
- Speed adjustment per sentence
- Breath sound removal
- Silence trimming
```

---

### UC5: Recording & Import

#### UC5.1: Record Narration
```
Actor: Content Creator
Flow:
1. Select chapter/section to narrate
2. View script in teleprompter mode
3. Click "Record" to start
4. Read script with auto-scroll
5. Stop and review recording

Features:
- Teleprompter mode (scrolling script)
- Visual countdown before recording
- Real-time waveform display
- Pause/resume recording
- Multiple take management
```

#### UC5.2: Import External Audio
```
Actor: Content Creator
Flow:
1. Click "Import Audio"
2. Select audio file
3. Choose target chapter/section
4. Align with existing content
5. Auto-generate timestamps

Features:
- Drag-and-drop upload
- Audio format conversion
- Duration matching check
- Forced alignment to transcript
- Manual timestamp override
```

#### UC5.3: Record Exercise Audio
```
Actor: Content Creator
Flow:
1. Select exercise requiring audio
2. Record question audio
3. Record answer options audio
4. Record feedback audio
5. Link audio to exercise

Features:
- Per-component recording
- Quick re-record individual parts
- Volume leveling across components
- Preview complete exercise flow
```

---

### UC6: Preview & Quality Control

#### UC6.1: Chapter Preview
```
Actor: Content Creator
Flow:
1. Click "Preview Chapter" button
2. Experience chapter as end-user would
3. Navigate through sections
4. Test exercises interactively
5. Note issues for correction

Features:
- Full screen mode
- Mobile/desktop preview toggle
- Audio playback with sync
- Exercise interaction
- Progress simulation
```

#### UC6.2: Audio Quality Check
```
Actor: Content Creator
Flow:
1. Run "Quality Check" on chapter
2. View automated report
3. Review flagged issues
4. Jump to issue location
5. Fix or acknowledge issues

Checks:
- Volume consistency
- Silence gaps > 3s
- Clipping detection
- Noise level analysis
- Pronunciation confidence
- Timestamp alignment
```

#### UC6.3: A/B Comparison
```
Actor: Content Creator
Flow:
1. Select two audio versions
2. Play synchronized comparison
3. Rate each version
4. Select preferred version
5. Apply selection

Features:
- Synchronized playback
- Blind comparison mode
- Rating interface
- Version history
- Batch comparison
```

---

### UC7: Publishing & Export

#### UC7.1: Commit Changes
```
Actor: Content Creator
Flow:
1. Review all pending changes
2. Write commit message
3. Click "Commit"
4. Push to GitHub
5. Verify deployment

Features:
- Change diff view
- Selective commit
- Auto-generated commit messages
- Push with retry
- Deployment status
```

#### UC7.2: Export Book Package
```
Actor: Content Creator
Flow:
1. Select book to export
2. Choose export format
3. Configure package options
4. Generate package
5. Download/share package

Formats:
- Web package (HTML + assets)
- Mobile package (PWA)
- Audio-only (podcast feed)
- EPUB with audio
- SCORM (LMS compatible)
```

#### UC7.3: Generate Podcast Feed
```
Actor: Content Creator
Flow:
1. Select chapters for podcast
2. Configure podcast metadata
3. Generate RSS feed
4. Upload to hosting
5. Share feed URL

Features:
- iTunes-compatible feed
- Episode metadata
- Cover art generation
- Chapter markers
- Show notes from content
```

---

## UI Design

### Studio Layout

```
+------------------------------------------------------------------+
|  [Logo] Audio Editing Studio            [Settings] [Help] [User] |
+------------------------------------------------------------------+
|  +-------------+  +------------------------------------------+   |
|  | NAVIGATOR   |  | WORKSPACE                                |   |
|  |             |  |                                          |   |
|  | [Books]     |  | +--------------------------------------+ |   |
|  |  > Book 1   |  | | EDITOR / TIMELINE                    | |   |
|  |    - Ch 1   |  | |                                      | |   |
|  |    - Ch 2   |  | |  [Content] [Audio] [Timeline] [QC]   | |   |
|  |  > Book 2   |  | |                                      | |   |
|  |             |  | |  Edit area / waveform / preview      | |   |
|  | [Voices]    |  | |                                      | |   |
|  |  - Profile1 |  | +--------------------------------------+ |   |
|  |  - Profile2 |  |                                          |   |
|  |             |  | +--------------------------------------+ |   |
|  | [Queue]     |  | | PROPERTIES / TOOLS                   | |   |
|  |  - Task 1   |  | |                                      | |   |
|  |  - Task 2   |  | |  Settings, metadata, actions         | |   |
|  |             |  | +--------------------------------------+ |   |
|  +-------------+  +------------------------------------------+   |
+------------------------------------------------------------------+
|  [Status Bar: Progress | Current Task | Memory | GPU Status]     |
+------------------------------------------------------------------+
```

### Key Panels

#### Navigator Panel
- **Books**: Tree view of all books and chapters
- **Voices**: Gallery of voice profiles
- **Queue**: Current generation/processing tasks

#### Workspace Tabs
- **Content**: Markdown editor with preview
- **Audio**: Waveform view with playback
- **Timeline**: Multi-track timeline editor
- **QC**: Quality control dashboard

#### Properties Panel
- **Settings**: Current item configuration
- **Metadata**: Title, description, tags
- **Actions**: Context-specific buttons

---

## Technical Architecture

### Notebook Sections

```python
# Section 1: Environment Setup
# - Install dependencies
# - Mount Google Drive
# - Load models
# - Configure GPU

# Section 2: Studio Interface
# - Import ipywidgets components
# - Build navigator
# - Build workspace tabs
# - Build properties panel

# Section 3: Content Management
# - Book/chapter loading
# - Content editing
# - Section management
# - Vocabulary extraction

# Section 4: Voice Management
# - Voice recording
# - Voice profile creation
# - Profile management
# - Voice preview

# Section 5: Audio Generation
# - Chapter generation
# - Batch generation
# - Multi-engine support
# - Progress tracking

# Section 6: Audio Editing
# - Timeline editor
# - Enhancement tools
# - Segment editing
# - Timing adjustment

# Section 7: Quality Control
# - Automated checks
# - A/B comparison
# - Issue tracking
# - Reporting

# Section 8: Publishing
# - Git integration
# - Export tools
# - Deployment verification
```

### Dependencies

```python
# Core
ipywidgets>=8.0.0
ipycanvas>=0.13.0
IPython>=8.0.0

# Audio Processing
pydub>=0.25.1
soundfile>=0.12.1
librosa>=0.10.1
scipy>=1.11.0
noisereduce>=3.0.0

# TTS & Voice Cloning
TTS>=0.22.0  # Coqui XTTS
edge-tts>=6.1.9

# Visualization
matplotlib>=3.7.0
numpy>=1.24.0

# Git & Storage
gitpython>=3.1.0
huggingface_hub>=0.20.0
```

### State Management

```python
class StudioState:
    """Global state for the Audio Editing Studio"""

    # Content
    current_book: str = None
    current_chapter: str = None
    current_section: int = 0

    # Audio
    audio_buffer: np.ndarray = None
    timestamps: List[Timestamp] = []
    waveform_cache: Dict[str, np.ndarray] = {}

    # Voice
    voice_profiles: Dict[str, VoiceProfile] = {}
    current_voice: str = None

    # Generation
    generation_queue: List[GenerationTask] = []
    current_task: GenerationTask = None

    # Editing
    undo_stack: List[EditOperation] = []
    redo_stack: List[EditOperation] = []
    pending_changes: List[Change] = []
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play/Pause audio |
| `Ctrl+S` | Save current changes |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+G` | Generate audio |
| `Ctrl+R` | Start recording |
| `Ctrl+P` | Preview chapter |
| `Ctrl+Enter` | Commit changes |
| `←/→` | Skip 5 seconds |
| `Shift+←/→` | Skip 30 seconds |
| `[/]` | Zoom in/out timeline |

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Notebook structure and dependency setup
- [ ] Basic UI layout with ipywidgets
- [ ] Content loading and navigation
- [ ] Basic content editing

### Phase 2: Voice & Generation (Week 2)
- [ ] Voice recording widget
- [ ] Voice profile management
- [ ] Single chapter audio generation
- [ ] Progress tracking

### Phase 3: Audio Editing (Week 3)
- [ ] Waveform visualization
- [ ] Timeline editor
- [ ] Basic audio enhancements
- [ ] Timestamp editing

### Phase 4: Quality & Publishing (Week 4)
- [ ] Quality check automation
- [ ] A/B comparison tool
- [ ] Git integration
- [ ] Export functionality

---

## Migration from Current Notebooks

### From OneClick_Generate.ipynb
- Voice recorder widget → UC2.1, UC5.1
- Voice cloning section → UC2.3
- Content editor → UC1.2
- Audio generation → UC3.1

### From TheLostChapter_TTS.ipynb
- Book/chapter creation → UC1.1, UC1.2
- Exercise creation → UC1.4
- Batch generation → UC3.3
- Git publishing → UC7.1

### Preserved Features
- All existing voice profiles
- All generated audio
- All book content
- GitHub integration

### New Capabilities
- Timeline editing
- Audio enhancement
- A/B comparison
- Quality automation
- Recording narration
- Pronunciation correction

---

## Success Metrics

1. **Time to First Audio**: < 5 minutes from opening notebook
2. **Chapter Generation**: < 2 minutes per chapter
3. **Edit-to-Preview Cycle**: < 30 seconds
4. **Quality Check Coverage**: 100% automated checks
5. **User Satisfaction**: All key workflows achievable in < 3 clicks

---

## Future Enhancements

### Phase 5+
- Multi-speaker support (different voices per character)
- AI-assisted content generation
- Automatic translation
- Speech-to-text for manual recording transcription
- Collaborative editing
- Version control UI
- Mobile companion app
