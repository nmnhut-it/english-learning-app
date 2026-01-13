#!/usr/bin/env python3
"""
TTS Audio Generation Script for TheLostChapter
Generate narration audio from text using cloned or preset voices.
"""

import argparse
import json
import os
import sys
from pathlib import Path

def generate_xtts(text, voice_name, language, output_path, device='cuda', temperature=0.7):
    """Generate audio using Coqui XTTS v2."""
    try:
        from TTS.api import TTS
    except ImportError:
        print("Error: TTS not installed. Run: pip install TTS")
        sys.exit(1)

    # Load voice config
    voice_dir = Path('voices') / voice_name
    config_path = voice_dir / 'config.json'

    if not config_path.exists():
        print(f"Error: Voice '{voice_name}' not found. Run clone-voice.py first.")
        sys.exit(1)

    with open(config_path) as f:
        voice_config = json.load(f)

    # Get reference audio
    reference_audio = voice_dir / voice_config['references'][0]

    print(f"Loading XTTS v2 model...")
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

    print(f"Generating audio for: '{text[:50]}...'")

    tts.tts_to_file(
        text=text,
        file_path=str(output_path),
        speaker_wav=str(reference_audio),
        language=language,
        split_sentences=True
    )

    print(f"Audio saved: {output_path}")
    return output_path

def generate_edge_tts(text, voice_name, output_path):
    """Generate audio using Microsoft Edge TTS (free, no cloning)."""
    try:
        import edge_tts
        import asyncio
    except ImportError:
        print("Error: edge-tts not installed. Run: pip install edge-tts")
        sys.exit(1)

    async def generate():
        communicate = edge_tts.Communicate(text, voice_name)
        await communicate.save(str(output_path))

    asyncio.run(generate())
    print(f"Audio saved: {output_path}")
    return output_path

def generate_timestamps(audio_path, text, output_path=None):
    """Generate word-level timestamps for audio-text sync."""
    try:
        import librosa
        import numpy as np
    except ImportError:
        print("Warning: librosa not installed, skipping timestamps")
        return None

    # Load audio
    y, sr = librosa.load(str(audio_path))
    duration = librosa.get_duration(y=y, sr=sr)

    # Simple sentence-level timestamps (split on punctuation)
    sentences = []
    current = ""
    for char in text:
        current += char
        if char in '.!?':
            if current.strip():
                sentences.append(current.strip())
            current = ""
    if current.strip():
        sentences.append(current.strip())

    # Distribute time proportionally by character count
    total_chars = sum(len(s) for s in sentences)
    timestamps = []
    current_time = 0.0

    for sentence in sentences:
        sentence_duration = (len(sentence) / total_chars) * duration
        timestamps.append({
            "start": round(current_time, 2),
            "end": round(current_time + sentence_duration, 2),
            "text": sentence
        })
        current_time += sentence_duration

    result = {
        "audio": str(audio_path.name if isinstance(audio_path, Path) else Path(audio_path).name),
        "duration": round(duration, 2),
        "timestamps": timestamps
    }

    # Save timestamps
    if output_path:
        ts_path = Path(output_path).with_suffix('.json')
    else:
        ts_path = Path(audio_path).with_suffix('.json')

    with open(ts_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Timestamps saved: {ts_path}")
    return result

def main():
    parser = argparse.ArgumentParser(
        description="Generate TTS audio for audiobooks",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # With cloned voice
  python generate.py --text "Hello world" --voice my-voice --lang en

  # Vietnamese
  python generate.py --text "Xin chào" --voice my-voice-vi --lang vi

  # From file
  python generate.py --file script.txt --voice my-voice --lang en

  # With Edge TTS (no cloning)
  python generate.py --engine edge --voice en-US-JennyNeural --text "Hello"

  # With timestamps
  python generate.py --text "Hello. World." --voice my-voice --timestamps
        """
    )

    parser.add_argument(
        '--text', '-t',
        type=str,
        help='Text to convert to speech'
    )
    parser.add_argument(
        '--file', '-f',
        type=str,
        help='Read text from file'
    )
    parser.add_argument(
        '--voice', '-v',
        type=str,
        required=True,
        help='Voice name (cloned voice folder name or Edge TTS voice ID)'
    )
    parser.add_argument(
        '--lang', '-l',
        type=str,
        default='en',
        help='Language code (default: en)'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        default='output.mp3',
        help='Output audio file path (default: output.mp3)'
    )
    parser.add_argument(
        '--engine',
        type=str,
        default='xtts',
        choices=['xtts', 'edge'],
        help='TTS engine (default: xtts)'
    )
    parser.add_argument(
        '--device',
        type=str,
        default='cuda',
        choices=['cuda', 'cpu'],
        help='Device for XTTS (default: cuda)'
    )
    parser.add_argument(
        '--timestamps',
        action='store_true',
        help='Generate timestamps JSON file'
    )
    parser.add_argument(
        '--temperature',
        type=float,
        default=0.7,
        help='XTTS temperature (0.1-1.0, default: 0.7)'
    )

    args = parser.parse_args()

    # Get text
    if args.file:
        with open(args.file, 'r', encoding='utf-8') as f:
            text = f.read().strip()
    elif args.text:
        text = args.text
    else:
        parser.error("Either --text or --file is required")

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Generate audio
    if args.engine == 'xtts':
        generate_xtts(
            text=text,
            voice_name=args.voice,
            language=args.lang,
            output_path=output_path,
            device=args.device,
            temperature=args.temperature
        )
    elif args.engine == 'edge':
        generate_edge_tts(
            text=text,
            voice_name=args.voice,
            output_path=output_path
        )

    # Generate timestamps if requested
    if args.timestamps:
        generate_timestamps(output_path, text)

if __name__ == '__main__':
    main()
