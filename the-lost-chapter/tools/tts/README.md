# TheLostChapter - TTS Voice Cloning Setup

Generate audiobook narration with your own cloned voice in English and Vietnamese.

## Quick Start

```bash
# 1. Create virtual environment
cd tools/tts/
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Clone your voice (one-time setup)
python clone-voice.py --sample your-voice-sample.wav --name my-voice

# 4. Generate audio
python generate.py --text "Hello, this is my audiobook" --voice my-voice --lang en
```

## Voice Cloning with Coqui XTTS v2

XTTS v2 is the recommended engine for high-quality voice cloning.

### Requirements

- Python 3.9+
- NVIDIA GPU with 4GB+ VRAM (recommended) or CPU (slower)
- 6-30 seconds of clear voice sample audio

### Prepare Voice Sample

For best results, your voice sample should be:

1. **Clean**: No background noise, music, or other speakers
2. **Clear**: Natural speaking pace, good pronunciation
3. **Length**: 6-30 seconds (longer samples can improve quality)
4. **Format**: WAV, 16kHz or higher sample rate

### Clone Your Voice

```bash
python clone-voice.py \
  --sample /path/to/your-voice.wav \
  --name my-voice \
  --lang en  # or 'vi' for Vietnamese
```

The cloned voice will be saved in `voices/my-voice/`.

### Generate Audio

Single text:
```bash
python generate.py \
  --text "Welcome to chapter one." \
  --voice my-voice \
  --lang en \
  --output chapter1-intro.mp3
```

From file:
```bash
python generate.py \
  --file script.txt \
  --voice my-voice \
  --lang en \
  --output narration.mp3
```

### Batch Generation

Generate all audio for a book chapter:

```bash
python batch-generate.py \
  --book sample-book \
  --chapter ch01 \
  --voice my-voice
```

This reads the chapter JSON and generates audio for all audio sections.

## Edge TTS (Free, No Cloning)

For quick generation without voice cloning, use Microsoft Edge TTS:

```bash
python generate.py \
  --text "Hello world" \
  --engine edge \
  --voice en-US-GuyNeural \
  --output hello.mp3
```

### Available Edge Voices

**English:**
- `en-US-GuyNeural` - Male, US
- `en-US-JennyNeural` - Female, US
- `en-GB-RyanNeural` - Male, UK
- `en-AU-WilliamNeural` - Male, Australia

**Vietnamese:**
- `vi-VN-HoaiMyNeural` - Female
- `vi-VN-NamMinhNeural` - Male

List all voices:
```bash
python -c "import edge_tts; import asyncio; asyncio.run(edge_tts.list_voices())"
```

## Generating Timestamps

For transcript synchronization, generate timestamps:

```bash
python generate.py \
  --text "First sentence. Second sentence. Third sentence." \
  --voice my-voice \
  --output narration.mp3 \
  --timestamps  # Generates narration.timestamps.json
```

Output:
```json
[
  { "start": 0.0, "end": 2.5, "text": "First sentence." },
  { "start": 2.5, "end": 5.0, "text": "Second sentence." },
  { "start": 5.0, "end": 7.5, "text": "Third sentence." }
]
```

## Tips for Best Quality

1. **Voice Sample Quality**: The better your input sample, the better the output
2. **GPU Acceleration**: Use CUDA for faster generation
3. **Temperature**: Lower values (0.5-0.7) for consistent output, higher (0.8-1.0) for more expressive
4. **Sentence Splitting**: For long texts, the system automatically splits by sentences

## Troubleshooting

### CUDA Out of Memory
Reduce batch size or use CPU:
```bash
python generate.py --text "..." --device cpu
```

### Audio Quality Issues
- Ensure voice sample is high quality
- Try different temperature values
- Check input text for unusual characters

### Vietnamese Diacritics
Ensure your text file is UTF-8 encoded for proper Vietnamese character support.
