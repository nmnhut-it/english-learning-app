#!/usr/bin/env python3
"""
Voice Cloning Script for TheLostChapter
Creates a cloned voice model from audio samples.
"""

import argparse
import os
import sys
from pathlib import Path

def clone_voice_xtts(sample_paths, voice_name, output_dir, language='en'):
    """Clone voice using Coqui XTTS v2."""
    try:
        from TTS.api import TTS
    except ImportError:
        print("Error: TTS not installed. Run: pip install TTS")
        sys.exit(1)

    # Initialize XTTS
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")

    # Create output directory
    voice_dir = Path(output_dir) / voice_name
    voice_dir.mkdir(parents=True, exist_ok=True)

    # Copy sample files to voice directory
    for sample in sample_paths:
        sample_path = Path(sample)
        if sample_path.exists():
            import shutil
            dest = voice_dir / f"sample_{sample_path.name}"
            shutil.copy(sample_path, dest)
            print(f"Copied sample: {dest}")

    # Save voice config
    config = {
        "name": voice_name,
        "language": language,
        "samples": [str(p) for p in voice_dir.glob("sample_*")],
        "engine": "xtts_v2"
    }

    import json
    with open(voice_dir / "config.json", "w") as f:
        json.dump(config, f, indent=2)

    print(f"\nVoice '{voice_name}' created successfully!")
    print(f"Location: {voice_dir}")
    print(f"\nTo generate audio:")
    print(f"  python generate.py --text 'Hello world' --voice {voice_name} --lang {language}")

def main():
    parser = argparse.ArgumentParser(description="Clone a voice for TTS generation")
    parser.add_argument("--sample", "-s", required=True, nargs="+",
                        help="Path to voice sample audio file(s)")
    parser.add_argument("--name", "-n", required=True,
                        help="Name for the cloned voice")
    parser.add_argument("--lang", "-l", default="en",
                        help="Language code (en, vi, etc.)")
    parser.add_argument("--output", "-o", default="voices",
                        help="Output directory for voice models")

    args = parser.parse_args()

    # Validate samples exist
    for sample in args.sample:
        if not os.path.exists(sample):
            print(f"Error: Sample file not found: {sample}")
            sys.exit(1)

    clone_voice_xtts(args.sample, args.name, args.output, args.lang)

if __name__ == "__main__":
    main()
