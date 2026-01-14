# Audio Editing Studio - Widget Specifications

## Widget Architecture

```
StudioApp (main container)
├── HeaderWidget
│   ├── LogoWidget
│   ├── ToolbarWidget
│   └── UserMenuWidget
├── SidebarWidget
│   ├── BookNavigatorWidget
│   ├── VoiceGalleryWidget
│   └── TaskQueueWidget
├── WorkspaceWidget
│   ├── ContentEditorWidget
│   ├── AudioEditorWidget
│   ├── TimelineEditorWidget
│   └── QualityDashboardWidget
└── PropertiesWidget
    ├── SettingsWidget
    ├── MetadataWidget
    └── ActionsWidget
```

---

## Core Widgets

### 1. BookNavigatorWidget

```python
class BookNavigatorWidget(widgets.VBox):
    """
    Tree-view navigator for books and chapters
    """

    def __init__(self, state: StudioState):
        self.state = state

        # Components
        self.search_input = widgets.Text(
            placeholder="Search books...",
            layout=widgets.Layout(width='100%')
        )
        self.book_tree = widgets.SelectMultiple(
            options=[],
            layout=widgets.Layout(width='100%', height='200px')
        )
        self.refresh_btn = widgets.Button(
            description="Refresh",
            icon="refresh"
        )

        # Layout
        super().__init__(children=[
            self.search_input,
            self.book_tree,
            self.refresh_btn
        ])

    def load_books(self):
        """Load all books from content directory"""
        pass

    def on_book_select(self, change):
        """Handle book/chapter selection"""
        pass

    def filter_books(self, search_term: str):
        """Filter books by search term"""
        pass


# Visual representation:
# +---------------------------+
# | [🔍 Search books...     ] |
# +---------------------------+
# | 📚 Gentle Mind           |
# |   📖 Ch 1: Introduction  |
# |   📖 Ch 2: Memory Basics |
# |   📖 Ch 3: Exercises     |
# | 📚 Sample Book           |
# |   📖 Ch 1: Getting Start |
# |   📖 Ch 2: Advanced      |
# +---------------------------+
# | [🔄 Refresh]              |
# +---------------------------+
```

### 2. VoiceGalleryWidget

```python
class VoiceGalleryWidget(widgets.VBox):
    """
    Gallery view for voice profiles
    """

    def __init__(self, state: StudioState):
        self.state = state

        # Components
        self.profile_grid = widgets.GridBox(
            children=[],
            layout=widgets.Layout(
                grid_template_columns='repeat(2, 1fr)',
                gap='8px'
            )
        )
        self.add_voice_btn = widgets.Button(
            description="New Voice",
            icon="plus",
            button_style="success"
        )

        super().__init__(children=[
            widgets.HTML("<h4>Voice Profiles</h4>"),
            self.profile_grid,
            self.add_voice_btn
        ])

    def load_profiles(self):
        """Load all voice profiles from directory"""
        pass

    def create_profile_card(self, profile: VoiceProfile) -> widgets.VBox:
        """Create a mini card for a voice profile"""
        return widgets.VBox([
            widgets.HTML(f"<b>{profile.name}</b>"),
            widgets.HTML(f"<small>{profile.language}</small>"),
            widgets.Button(description="▶", layout=widgets.Layout(width='40px'))
        ])


# Visual representation:
# +---------------------------+
# | Voice Profiles           |
# +---------------------------+
# | +--------+ +--------+    |
# | |Teacher | |Student |    |
# | |[VI] ▶  | |[EN] ▶  |    |
# | +--------+ +--------+    |
# | +--------+ +--------+    |
# | |Custom1 | |Custom2 |    |
# | |[VI] ▶  | |[VI] ▶  |    |
# | +--------+ +--------+    |
# +---------------------------+
# | [+ New Voice]            |
# +---------------------------+
```

### 3. ContentEditorWidget

```python
class ContentEditorWidget(widgets.VBox):
    """
    Markdown editor with live preview
    """

    def __init__(self, state: StudioState):
        self.state = state

        # Components
        self.section_selector = widgets.Dropdown(
            options=[],
            description="Section:"
        )

        self.language_toggle = widgets.ToggleButtons(
            options=['VI', 'EN', 'Both'],
            value='Both',
            description='Language:'
        )

        self.editor_area = widgets.Textarea(
            placeholder="Enter markdown content...",
            layout=widgets.Layout(width='100%', height='300px')
        )

        self.preview_area = widgets.HTML(
            value="<p>Preview will appear here...</p>",
            layout=widgets.Layout(
                width='100%',
                height='300px',
                overflow='auto',
                border='1px solid #ccc',
                padding='10px'
            )
        )

        self.toolbar = widgets.HBox([
            widgets.Button(icon="bold", tooltip="Bold"),
            widgets.Button(icon="italic", tooltip="Italic"),
            widgets.Button(icon="list-ul", tooltip="List"),
            widgets.Button(icon="link", tooltip="Link"),
            widgets.Button(icon="save", tooltip="Save"),
        ])

        # Split view
        self.split_view = widgets.HBox([
            widgets.VBox([widgets.Label("Source"), self.editor_area]),
            widgets.VBox([widgets.Label("Preview"), self.preview_area])
        ])

        super().__init__(children=[
            self.section_selector,
            self.language_toggle,
            self.toolbar,
            self.split_view
        ])

    def on_text_change(self, change):
        """Update preview on text change"""
        self.preview_area.value = self.render_markdown(change['new'])

    def render_markdown(self, text: str) -> str:
        """Convert markdown to HTML"""
        pass


# Visual representation:
# +--------------------------------------------------+
# | Section: [Ch1 - Introduction ▼]  Lang: [VI|EN|Both]
# +--------------------------------------------------+
# | [B] [I] [≡] [🔗] [💾]                            |
# +--------------------------------------------------+
# | Source              | Preview                    |
# |---------------------|---------------------------|
# | # Heading           | <h1>Heading</h1>          |
# |                     |                           |
# | This is **bold**    | This is <b>bold</b>       |
# | and *italic* text.  | and <i>italic</i> text.   |
# |                     |                           |
# +--------------------------------------------------+
```

### 4. AudioEditorWidget

```python
class AudioEditorWidget(widgets.VBox):
    """
    Audio playback with waveform visualization
    """

    def __init__(self, state: StudioState):
        self.state = state

        # Audio output
        self.audio_output = widgets.Output()

        # Waveform canvas
        self.waveform_canvas = widgets.HTML(
            value=self.generate_waveform_svg(),
            layout=widgets.Layout(width='100%', height='100px')
        )

        # Transport controls
        self.play_btn = widgets.Button(icon="play", description="")
        self.stop_btn = widgets.Button(icon="stop", description="")
        self.skip_back_btn = widgets.Button(icon="backward", description="")
        self.skip_fwd_btn = widgets.Button(icon="forward", description="")

        self.transport = widgets.HBox([
            self.skip_back_btn,
            self.play_btn,
            self.stop_btn,
            self.skip_fwd_btn
        ])

        # Progress slider
        self.progress_slider = widgets.FloatSlider(
            value=0,
            min=0,
            max=100,
            step=0.1,
            description='',
            layout=widgets.Layout(width='100%')
        )

        # Time display
        self.time_display = widgets.HTML(
            value="<code>00:00 / 00:00</code>"
        )

        # Voice selector
        self.voice_selector = widgets.Dropdown(
            options=['Default', 'Teacher', 'Student'],
            description="Voice:"
        )

        # Generate button
        self.generate_btn = widgets.Button(
            description="Generate Audio",
            icon="microphone",
            button_style="primary"
        )

        super().__init__(children=[
            self.waveform_canvas,
            self.progress_slider,
            widgets.HBox([self.transport, self.time_display]),
            widgets.HBox([self.voice_selector, self.generate_btn]),
            self.audio_output
        ])

    def generate_waveform_svg(self) -> str:
        """Generate SVG waveform visualization"""
        pass

    def play_audio(self):
        """Play current audio"""
        pass

    def generate_audio(self):
        """Generate audio for current section"""
        pass


# Visual representation:
# +--------------------------------------------------+
# | ▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂                    |
# | [═══════════════════●═══════════════════════════] |
# |                                                  |
# | [⏮] [▶] [⏹] [⏭]               00:12 / 02:34    |
# |                                                  |
# | Voice: [Teacher ▼]        [🎤 Generate Audio]   |
# +--------------------------------------------------+
```

### 5. TimelineEditorWidget

```python
class TimelineEditorWidget(widgets.VBox):
    """
    Multi-track timeline editor for audio
    """

    def __init__(self, state: StudioState):
        self.state = state

        # Zoom controls
        self.zoom_slider = widgets.IntSlider(
            value=50,
            min=10,
            max=200,
            description="Zoom:"
        )

        # Timeline canvas
        self.timeline_canvas = widgets.HTML(
            value=self.generate_timeline_svg(),
            layout=widgets.Layout(
                width='100%',
                height='200px',
                overflow_x='scroll'
            )
        )

        # Sentence list
        self.sentence_list = widgets.Select(
            options=[],
            description="Sentences:",
            layout=widgets.Layout(height='150px')
        )

        # Edit controls
        self.edit_start = widgets.FloatText(description="Start:")
        self.edit_end = widgets.FloatText(description="End:")
        self.apply_btn = widgets.Button(
            description="Apply",
            button_style="primary"
        )

        super().__init__(children=[
            self.zoom_slider,
            self.timeline_canvas,
            self.sentence_list,
            widgets.HBox([self.edit_start, self.edit_end, self.apply_btn])
        ])

    def generate_timeline_svg(self) -> str:
        """Generate SVG timeline with markers"""
        pass

    def on_marker_drag(self, marker_id: str, new_time: float):
        """Handle marker drag events"""
        pass


# Visual representation:
# +--------------------------------------------------+
# | Zoom: [===========●===============]              |
# +--------------------------------------------------+
# | 0:00    0:05    0:10    0:15    0:20    0:25    |
# | |-------|-------|-------|-------|-------|       |
# | ▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂▁▂▃▅▇█▇▅▃▂         |
# | [  Sentence 1  ][Sentence 2][  Sentence 3   ]   |
# |     ▲              ▲           ▲                 |
# +--------------------------------------------------+
# | Sentences:                                       |
# | > 0:00-0:05 "This is the first sentence."       |
# |   0:05-0:09 "Second sentence here."             |
# |   0:09-0:15 "And the third sentence."           |
# +--------------------------------------------------+
# | Start: [0.00]  End: [5.23]  [Apply]             |
# +--------------------------------------------------+
```

### 6. VoiceRecorderWidget

```python
class VoiceRecorderWidget(widgets.VBox):
    """
    Voice recording interface with waveform display
    """

    def __init__(self, state: StudioState):
        self.state = state

        # Status display
        self.status = widgets.HTML(
            value="<span style='color:gray'>Ready to record</span>"
        )

        # Timer display
        self.timer = widgets.HTML(
            value="<h1 style='font-family:monospace'>00:00</h1>"
        )

        # Real-time waveform
        self.live_waveform = widgets.HTML(
            value="<div style='height:50px;background:#f0f0f0'></div>",
            layout=widgets.Layout(width='100%', height='60px')
        )

        # Controls
        self.record_btn = widgets.Button(
            description="Record",
            icon="circle",
            button_style="danger",
            layout=widgets.Layout(width='120px')
        )
        self.stop_btn = widgets.Button(
            description="Stop",
            icon="stop",
            disabled=True,
            layout=widgets.Layout(width='120px')
        )
        self.playback_btn = widgets.Button(
            description="Play",
            icon="play",
            disabled=True,
            layout=widgets.Layout(width='120px')
        )

        # Script display (teleprompter)
        self.script_area = widgets.HTML(
            value="""
            <div style='font-size:18px; line-height:1.8; padding:20px; background:#fffef0'>
                <p><b>Read this script:</b></p>
                <p>"Xin chào! Tôi là giáo viên tiếng Anh.
                   Hôm nay chúng ta sẽ học về các sở thích.
                   Bạn có sở thích gì? Tôi thích đọc sách và nghe nhạc."</p>
            </div>
            """,
            layout=widgets.Layout(height='150px', overflow='auto')
        )

        # Noise reduction toggle
        self.noise_reduction = widgets.Checkbox(
            value=True,
            description="Apply noise reduction"
        )

        # Save controls
        self.profile_name = widgets.Text(
            placeholder="Voice profile name",
            description="Name:"
        )
        self.save_btn = widgets.Button(
            description="Save Profile",
            icon="save",
            button_style="success",
            disabled=True
        )

        super().__init__(children=[
            self.status,
            self.timer,
            self.live_waveform,
            widgets.HBox([self.record_btn, self.stop_btn, self.playback_btn]),
            self.script_area,
            self.noise_reduction,
            widgets.HBox([self.profile_name, self.save_btn])
        ])

    def start_recording(self):
        """Start audio recording"""
        pass

    def stop_recording(self):
        """Stop recording and process audio"""
        pass

    def apply_noise_reduction(self, audio: np.ndarray) -> np.ndarray:
        """Apply noise reduction to recorded audio"""
        pass


# Visual representation:
# +--------------------------------------------------+
# |              ● Recording...                       |
# |                  01:23                            |
# | ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▁▂▃▄▅▆▇            |
# |                                                  |
# |    [⬤ Record]  [⏹ Stop]  [▶ Play]                |
# |                                                  |
# | +----------------------------------------------+ |
# | | Read this script:                            | |
# | |                                              | |
# | | "Xin chào! Tôi là giáo viên tiếng Anh..."   | |
# | +----------------------------------------------+ |
# |                                                  |
# | [✓] Apply noise reduction                        |
# |                                                  |
# | Name: [My Voice Profile      ]  [💾 Save Profile]|
# +--------------------------------------------------+
```

### 7. AudioEnhancementWidget

```python
class AudioEnhancementWidget(widgets.VBox):
    """
    Audio enhancement controls
    """

    def __init__(self, state: StudioState):
        self.state = state

        # Preset selector
        self.preset = widgets.Dropdown(
            options=['None', 'Podcast', 'Audiobook', 'Classroom', 'Custom'],
            description="Preset:"
        )

        # Noise reduction
        self.noise_reduction = widgets.IntSlider(
            value=0, min=0, max=100,
            description="Noise:"
        )

        # Volume normalization
        self.normalize = widgets.FloatSlider(
            value=-3.0, min=-20.0, max=0.0,
            description="Level (dB):"
        )

        # EQ controls
        self.eq_low = widgets.IntSlider(
            value=0, min=-12, max=12,
            description="Low:"
        )
        self.eq_mid = widgets.IntSlider(
            value=0, min=-12, max=12,
            description="Mid:"
        )
        self.eq_high = widgets.IntSlider(
            value=0, min=-12, max=12,
            description="High:"
        )

        # Compression
        self.compression = widgets.IntSlider(
            value=0, min=0, max=100,
            description="Compress:"
        )

        # De-essing
        self.deess = widgets.IntSlider(
            value=0, min=0, max=100,
            description="De-ess:"
        )

        # Preview / Apply buttons
        self.preview_btn = widgets.Button(
            description="Preview",
            icon="headphones"
        )
        self.apply_btn = widgets.Button(
            description="Apply",
            icon="check",
            button_style="success"
        )
        self.reset_btn = widgets.Button(
            description="Reset",
            icon="undo"
        )

        super().__init__(children=[
            widgets.HTML("<h4>Audio Enhancement</h4>"),
            self.preset,
            widgets.HTML("<b>Noise & Level</b>"),
            self.noise_reduction,
            self.normalize,
            widgets.HTML("<b>EQ</b>"),
            self.eq_low,
            self.eq_mid,
            self.eq_high,
            widgets.HTML("<b>Dynamics</b>"),
            self.compression,
            self.deess,
            widgets.HBox([self.preview_btn, self.apply_btn, self.reset_btn])
        ])

    def apply_preset(self, preset_name: str):
        """Apply enhancement preset"""
        presets = {
            'Podcast': {'noise': 30, 'normalize': -3, 'compression': 50},
            'Audiobook': {'noise': 20, 'normalize': -6, 'compression': 30},
            'Classroom': {'noise': 40, 'normalize': -3, 'eq_mid': 3}
        }
        pass


# Visual representation:
# +--------------------------------------------------+
# | Audio Enhancement                                |
# +--------------------------------------------------+
# | Preset: [Podcast ▼]                              |
# +--------------------------------------------------+
# | Noise & Level                                    |
# | Noise:    [════════●════════════] 30            |
# | Level:    [════●════════════════] -3 dB         |
# +--------------------------------------------------+
# | EQ                                               |
# | Low:      [════════●════════════] 0             |
# | Mid:      [════════════●════════] +3            |
# | High:     [════════●════════════] 0             |
# +--------------------------------------------------+
# | Dynamics                                         |
# | Compress: [════════════●════════] 50            |
# | De-ess:   [════════●════════════] 20            |
# +--------------------------------------------------+
# | [🎧 Preview] [✓ Apply] [↩ Reset]                |
# +--------------------------------------------------+
```

### 8. GenerationQueueWidget

```python
class GenerationQueueWidget(widgets.VBox):
    """
    Task queue for audio generation
    """

    def __init__(self, state: StudioState):
        self.state = state

        # Overall progress
        self.overall_progress = widgets.IntProgress(
            value=0, min=0, max=100,
            description='Overall:',
            layout=widgets.Layout(width='100%')
        )

        # Current task display
        self.current_task = widgets.HTML(
            value="<i>No active task</i>"
        )

        # Task list
        self.task_list = widgets.Select(
            options=[],
            description='',
            layout=widgets.Layout(height='150px', width='100%')
        )

        # Controls
        self.add_btn = widgets.Button(icon="plus", tooltip="Add task")
        self.remove_btn = widgets.Button(icon="minus", tooltip="Remove task")
        self.start_btn = widgets.Button(
            description="Start Queue",
            icon="play",
            button_style="primary"
        )
        self.stop_btn = widgets.Button(
            description="Stop",
            icon="stop",
            button_style="danger"
        )

        super().__init__(children=[
            widgets.HTML("<h4>Generation Queue</h4>"),
            self.overall_progress,
            self.current_task,
            self.task_list,
            widgets.HBox([self.add_btn, self.remove_btn]),
            widgets.HBox([self.start_btn, self.stop_btn])
        ])


# Visual representation:
# +--------------------------------------------------+
# | Generation Queue                                 |
# +--------------------------------------------------+
# | Overall: [████████████░░░░░░░░] 65%             |
# | Currently: Generating Ch2-EN...                  |
# +--------------------------------------------------+
# | ✓ Ch1-VI (completed)                            |
# | ✓ Ch1-EN (completed)                            |
# | ● Ch2-VI (in progress)                          |
# |   Ch2-EN (pending)                              |
# |   Ch3-VI (pending)                              |
# |   Ch3-EN (pending)                              |
# +--------------------------------------------------+
# | [+] [-]                                          |
# | [▶ Start Queue] [⏹ Stop]                        |
# +--------------------------------------------------+
```

### 9. QualityCheckWidget

```python
class QualityCheckWidget(widgets.VBox):
    """
    Automated quality checking dashboard
    """

    def __init__(self, state: StudioState):
        self.state = state

        # Run check button
        self.run_check_btn = widgets.Button(
            description="Run Quality Check",
            icon="search",
            button_style="primary"
        )

        # Results summary
        self.summary = widgets.HTML(
            value="<p>Click 'Run Quality Check' to analyze audio</p>"
        )

        # Issue list
        self.issue_list = widgets.Select(
            options=[],
            description='Issues:',
            layout=widgets.Layout(height='150px', width='100%')
        )

        # Issue details
        self.issue_details = widgets.HTML(
            value=""
        )

        # Action buttons
        self.jump_btn = widgets.Button(
            description="Jump to Issue",
            icon="arrow-right"
        )
        self.fix_btn = widgets.Button(
            description="Auto-Fix",
            icon="wrench"
        )
        self.ignore_btn = widgets.Button(
            description="Ignore",
            icon="times"
        )

        super().__init__(children=[
            self.run_check_btn,
            self.summary,
            self.issue_list,
            self.issue_details,
            widgets.HBox([self.jump_btn, self.fix_btn, self.ignore_btn])
        ])

    def run_checks(self, audio_path: str) -> List[QualityIssue]:
        """Run all quality checks"""
        issues = []

        # Volume check
        issues.extend(self.check_volume_consistency())

        # Silence check
        issues.extend(self.check_silence_gaps())

        # Clipping check
        issues.extend(self.check_clipping())

        # Noise check
        issues.extend(self.check_noise_levels())

        return issues


# Visual representation:
# +--------------------------------------------------+
# | [🔍 Run Quality Check]                           |
# +--------------------------------------------------+
# | Summary: 3 issues found                          |
# | ✓ Volume: OK                                     |
# | ⚠ Silence: 1 long gap detected                  |
# | ✓ Clipping: OK                                  |
# | ⚠ Noise: 2 sections above threshold             |
# +--------------------------------------------------+
# | Issues:                                          |
# | ⚠ 0:45 - Long silence (4.2s)                   |
# | ⚠ 1:23 - High noise level                      |
# | ⚠ 2:01 - High noise level                      |
# +--------------------------------------------------+
# | Issue at 0:45: Silence gap of 4.2 seconds       |
# | exceeds threshold of 3.0 seconds.               |
# |                                                  |
# | [→ Jump] [🔧 Auto-Fix] [✗ Ignore]               |
# +--------------------------------------------------+
```

### 10. GitPublishWidget

```python
class GitPublishWidget(widgets.VBox):
    """
    Git commit and push interface
    """

    def __init__(self, state: StudioState):
        self.state = state

        # Status display
        self.status = widgets.HTML(
            value="<p>Checking repository status...</p>"
        )

        # Changes list
        self.changes_list = widgets.SelectMultiple(
            options=[],
            description='Changes:',
            layout=widgets.Layout(height='150px', width='100%')
        )

        # Commit message
        self.commit_message = widgets.Textarea(
            placeholder="Enter commit message...",
            description="Message:",
            layout=widgets.Layout(width='100%', height='80px')
        )

        # Auto-generate message button
        self.auto_msg_btn = widgets.Button(
            description="Auto-generate",
            icon="magic"
        )

        # Action buttons
        self.commit_btn = widgets.Button(
            description="Commit",
            icon="check",
            button_style="primary"
        )
        self.push_btn = widgets.Button(
            description="Push",
            icon="cloud-upload",
            button_style="success"
        )

        # Progress output
        self.output = widgets.Output()

        super().__init__(children=[
            widgets.HTML("<h4>Publish Changes</h4>"),
            self.status,
            self.changes_list,
            widgets.HBox([self.commit_message, self.auto_msg_btn]),
            widgets.HBox([self.commit_btn, self.push_btn]),
            self.output
        ])

    def check_status(self):
        """Check git repository status"""
        pass

    def commit_changes(self):
        """Commit selected changes"""
        pass

    def push_changes(self):
        """Push to remote repository"""
        pass


# Visual representation:
# +--------------------------------------------------+
# | Publish Changes                                  |
# +--------------------------------------------------+
# | Status: 3 files modified, 2 files added         |
# +--------------------------------------------------+
# | Changes:                                         |
# | [✓] M content/books/gentle-mind/ch01.json      |
# | [✓] M content/books/gentle-mind/audio/ch01.wav |
# | [✓] A content/books/gentle-mind/audio/ch02.wav |
# | [ ] M voices/my-voice.pt                        |
# +--------------------------------------------------+
# | Message:                            [✨ Auto]   |
# | +--------------------------------------------+ |
# | | Add chapter 2 audio for Gentle Mind        | |
# | |                                            | |
# | +--------------------------------------------+ |
# +--------------------------------------------------+
# | [✓ Commit] [☁ Push]                             |
# +--------------------------------------------------+
# | Output:                                          |
# | > Committed: abc1234                            |
# | > Pushing to origin/main...                     |
# | > Success!                                      |
# +--------------------------------------------------+
```

---

## Widget Styling

```python
# Custom CSS for widgets
STUDIO_CSS = """
<style>
/* Global styles */
.studio-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Navigator styles */
.book-tree-item {
    padding: 4px 8px;
    cursor: pointer;
}
.book-tree-item:hover {
    background: #e8f0fe;
}
.book-tree-item.selected {
    background: #1a73e8;
    color: white;
}

/* Waveform styles */
.waveform-container {
    background: #1e1e1e;
    border-radius: 4px;
    padding: 10px;
}
.waveform-bar {
    fill: #4caf50;
}
.waveform-bar:hover {
    fill: #81c784;
}

/* Timeline styles */
.timeline-marker {
    cursor: ew-resize;
    fill: #ff9800;
}
.timeline-sentence {
    fill: rgba(33, 150, 243, 0.3);
    stroke: #2196f3;
}

/* Recording indicator */
.recording-active {
    animation: pulse 1s infinite;
}
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

/* Issue severity colors */
.issue-critical { color: #d32f2f; }
.issue-warning { color: #f57c00; }
.issue-info { color: #1976d2; }
</style>
"""
```

---

## Event System

```python
from typing import Callable, Dict, List

class EventBus:
    """Central event system for widget communication"""

    def __init__(self):
        self._handlers: Dict[str, List[Callable]] = {}

    def on(self, event: str, handler: Callable):
        """Subscribe to an event"""
        if event not in self._handlers:
            self._handlers[event] = []
        self._handlers[event].append(handler)

    def emit(self, event: str, data: any = None):
        """Emit an event to all subscribers"""
        if event in self._handlers:
            for handler in self._handlers[event]:
                handler(data)

# Event types
class Events:
    # Content events
    BOOK_SELECTED = 'book:selected'
    CHAPTER_SELECTED = 'chapter:selected'
    SECTION_SELECTED = 'section:selected'
    CONTENT_CHANGED = 'content:changed'
    CONTENT_SAVED = 'content:saved'

    # Audio events
    AUDIO_PLAY = 'audio:play'
    AUDIO_PAUSE = 'audio:pause'
    AUDIO_SEEK = 'audio:seek'
    AUDIO_GENERATED = 'audio:generated'

    # Voice events
    VOICE_SELECTED = 'voice:selected'
    VOICE_RECORDED = 'voice:recorded'
    VOICE_PROFILE_CREATED = 'voice:profile:created'

    # Timeline events
    MARKER_MOVED = 'timeline:marker:moved'
    SEGMENT_SELECTED = 'timeline:segment:selected'

    # Generation events
    GENERATION_STARTED = 'generation:started'
    GENERATION_PROGRESS = 'generation:progress'
    GENERATION_COMPLETED = 'generation:completed'
    GENERATION_ERROR = 'generation:error'

    # Git events
    GIT_STATUS_CHANGED = 'git:status:changed'
    GIT_COMMITTED = 'git:committed'
    GIT_PUSHED = 'git:pushed'
```

---

## Integration Example

```python
def create_studio():
    """Create and initialize the Audio Editing Studio"""

    # Initialize state and event bus
    state = StudioState()
    events = EventBus()

    # Create widgets
    navigator = BookNavigatorWidget(state)
    voices = VoiceGalleryWidget(state)
    queue = GenerationQueueWidget(state)

    content_editor = ContentEditorWidget(state)
    audio_editor = AudioEditorWidget(state)
    timeline_editor = TimelineEditorWidget(state)
    quality_check = QualityCheckWidget(state)

    recorder = VoiceRecorderWidget(state)
    enhancement = AudioEnhancementWidget(state)
    publisher = GitPublishWidget(state)

    # Wire up events
    events.on(Events.BOOK_SELECTED, lambda book: state.set_book(book))
    events.on(Events.CHAPTER_SELECTED, lambda ch: content_editor.load_chapter(ch))
    events.on(Events.AUDIO_GENERATED, lambda _: quality_check.run_checks())

    # Create layout
    sidebar = widgets.VBox([
        navigator,
        voices,
        queue
    ], layout=widgets.Layout(width='250px'))

    workspace = widgets.Tab([
        content_editor,
        audio_editor,
        timeline_editor,
        quality_check
    ])
    workspace.set_title(0, 'Content')
    workspace.set_title(1, 'Audio')
    workspace.set_title(2, 'Timeline')
    workspace.set_title(3, 'QC')

    properties = widgets.Accordion([
        recorder,
        enhancement,
        publisher
    ])
    properties.set_title(0, 'Record Voice')
    properties.set_title(1, 'Enhancement')
    properties.set_title(2, 'Publish')

    # Main layout
    studio = widgets.HBox([
        sidebar,
        widgets.VBox([workspace, properties])
    ])

    # Apply styling
    display(widgets.HTML(STUDIO_CSS))
    display(studio)

    # Load initial data
    navigator.load_books()
    voices.load_profiles()

    return state, events

# Run the studio
state, events = create_studio()
```
