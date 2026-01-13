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

## Voice Sample Requirements

For best voice cloning results:

| Requirement | Value |
|-------------|-------|
| Duration | 6-30 seconds (10-15 ideal) |
| Format | WAV, MP3, or FLAC |
| Sample rate | 22050 Hz or higher |
| Quality | Clear, no background noise |
| Content | Natural speech, varied tones |

### Recording Tips

1. Use a quiet room
2. Speak naturally, not monotone
3. Include varied sentence types (questions, statements)
4. Avoid plosives (use a pop filter or speak slightly to the side)
5. Record multiple samples for different languages

## Usage Guide

### Clone Voice

```bash
# Basic cloning
python clone-voice.py --sample voice.wav --name my-voice

# With language hint
python clone-voice.py --sample voice.wav --name my-voice-vi --lang vi

# Multiple samples (better quality)
python clone-voice.py \
  --samples voice1.wav voice2.wav voice3.wav \
  --name my-voice-hq
```

### Generate Audio

```bash
# Single text
python generate.py \
  --text "Once upon a time in a distant land..." \
  --voice my-voice \
  --lang en \
  --output chapter1-intro.mp3

# From file
python generate.py \
  --file chapter1-script.txt \
  --voice my-voice \
  --lang en \
  --output chapter1.mp3

# Vietnamese
python generate.py \
  --text "Ngày xửa ngày xưa, ở một vùng đất xa xôi..." \
  --voice my-voice-vi \
  --lang vi \
  --output chapter1-vi.mp3
```

### Batch Generate

```bash
# Generate all audio for a book
python batch-generate.py \
  --config book-config.yaml \
  --output ../content/media/my-book/audio/
```

**book-config.yaml example:**
```yaml
voice: my-voice
sections:
  - id: ch01-intro
    lang: en
    text: "Welcome to The Lost Chapter..."

  - id: ch01-section1
    lang: en
    file: scripts/ch01-section1.txt

  - id: ch01-vocab-vi
    lang: vi
    text: "Từ vựng: adventure - cuộc phiêu lưu"
```

## TTS Engine Options

### 1. Coqui XTTS v2 (Recommended)

Best quality, supports voice cloning, multi-language including Vietnamese.

**Pros:**
- Excellent voice cloning
- Natural prosody
- Multi-language in single model
- Open source

**Cons:**
- Requires GPU for fast generation
- ~4GB model download

```bash
python generate.py --engine xtts --voice my-voice --text "Hello world"
```

### 2. Edge TTS (Free, No Setup)

Microsoft's free TTS API. No cloning but many voices available.

**Pros:**
- No setup needed
- Fast generation
- Many languages
- Free

**Cons:**
- No voice cloning
- Requires internet
- Generic voices

```bash
python generate.py --engine edge --voice vi-VN-HoaiMyNeural --text "Xin chào"
```

**Available Edge voices:**
- English: `en-US-JennyNeural`, `en-US-GuyNeural`, `en-GB-SoniaNeural`
- Vietnamese: `vi-VN-HoaiMyNeural`, `vi-VN-NamMinhNeural`

### 3. OpenVoice (Lightweight Cloning)

Faster cloning, lower quality than XTTS.

```bash
pip install git+https://github.com/myshell-ai/OpenVoice.git
python generate.py --engine openvoice --voice my-voice --text "Hello"
```

## Timestamp Generation

Generate timestamps for text-audio sync:

```bash
python generate.py \
  --text "Once upon a time. In a distant land." \
  --voice my-voice \
  --timestamps \
  --output chapter1.mp3

# Output: chapter1.json with timestamps
{
  "audio": "chapter1.mp3",
  "duration": 4.5,
  "timestamps": [
    { "start": 0.0, "end": 1.8, "text": "Once upon a time." },
    { "start": 1.8, "end": 4.5, "text": "In a distant land." }
  ]
}
```

## Hardware Requirements

| Setup | VRAM | Speed |
|-------|------|-------|
| CPU only | N/A | ~0.1x realtime |
| GTX 1060 | 6GB | ~1x realtime |
| RTX 3060 | 12GB | ~3x realtime |
| RTX 4090 | 24GB | ~10x realtime |

## Troubleshooting

### "CUDA out of memory"

Reduce batch size or use CPU:
```bash
python generate.py --device cpu --text "..."
```

### "Model not found"

First run downloads the model (~4GB):
```bash
python -c "from TTS.api import TTS; TTS('tts_models/multilingual/multi-dataset/xtts_v2')"
```

### Poor Vietnamese quality

Use a Vietnamese voice sample and explicitly set language:
```bash
python generate.py --lang vi --voice vi-sample --text "Xin chào"
```

### Audio sounds robotic

- Use longer voice samples (10-15 seconds)
- Ensure sample has natural prosody
- Try different temperature settings: `--temperature 0.7`

## File Structure

```
tools/tts/
├── README.md           # This file
├── requirements.txt    # Python dependencies
├── clone-voice.py      # Voice cloning script
├── generate.py         # Single audio generation
├── batch-generate.py   # Batch processing
├── voices/             # Cloned voice models
│   └── my-voice/
│       └── voice.pth
└── temp/               # Temporary files (gitignored)
```
