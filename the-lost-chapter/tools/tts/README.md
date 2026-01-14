# Audio Generation for TheLostChapter

## Quick Start (Local Machine)

```bash
# Install
pip install edge-tts

# Generate Vietnamese audio for all chapters
cd the-lost-chapter/tools/tts
python generate_audio.py --book gentle-mind --lang vi

# Generate English audio
python generate_audio.py --book gentle-mind --lang en

# Generate specific chapter
python generate_audio.py --book gentle-mind --chapter ch01 --lang vi
```

## Available Voices

| Code | Voice | Description |
|------|-------|-------------|
| `vi` | vi-VN-HoaiMyNeural | Vietnamese female, warm |
| `vi-male` | vi-VN-NamMinhNeural | Vietnamese male, calm |
| `en` | en-US-AriaNeural | English female, natural |
| `en-male` | en-US-GuyNeural | English male, professional |

## Output

Audio files are saved to: `content/books/{book-id}/audio/`

```
gentle-mind/
├── audio/
│   ├── ch01-vi.mp3       # Vietnamese audio
│   ├── ch01-vi.json      # Word-level timestamps
│   ├── ch01-en.mp3       # English audio
│   └── ch01-en.json      # Timestamps
```

## One-Liner for All Chapters

```bash
# Vietnamese female voice
pip install edge-tts && python generate_audio.py --book gentle-mind --lang vi

# Both languages
for lang in vi en; do python generate_audio.py --book gentle-mind --lang $lang; done
```

## Using with viXTTS (Colab)

For voice cloning with your own voice, use the Colab notebook:
`tools/tts/TheLostChapter_TTS.ipynb`

This requires GPU but produces personalized audio.
