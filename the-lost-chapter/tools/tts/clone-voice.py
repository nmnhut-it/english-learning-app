#!/usr/bin/env python3
"""
Voice Cloning Script for TheLostChapter
Creates a cloned voice model from audio samples.
"""

import argparse
import os
import sys
from pathlib import Path

def setup_paths():
    """Add project root to path."""
    project_root = Path(__file__).parent.parent.parent
    sys.path.insert(0, str(project_root))

def clone_voice_xtts(sample_paths, voice_name, output_dir, language='en'):
    """Clone voice using Coqui XTTS v2."""
    try:
        from TTS.api import TTS
    except ImportError:
        print("Error: TTS not installed. Run: pip install TTS")
        sys.exit(1)

    # Initialize XTTS
    print("Loading XTTS v2 model...")
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2")

    # Create output directory
    voice_dir = Path(output_dir) / voice_name
    voice_dir.mkdir(parents=True, exist_ok=True)

    # For XTTS, we just need to store the reference audio
    # The model uses it at inference time
    import shutil

    for i, sample_path in enumerate(sample_paths):
        dest = voice_dir / f"reference_{i}{Path(sample_path).suffix}"
        shutil.copy(sample_path, dest)
        print(f"Copied reference audio: {dest}")

    # Save voice config
    config_path = voice_dir / "config.json"
    import json
    with open(config_path, 'w') as f:
        json.dump({
            "name": voice_name,
            "engine": "xtts",
            "language": language,
            "references": [f"reference_{i}{Path(p).suffix}" for i, p in enumerate(sample_paths)]
        }, f, indent=2)

    print(f"\nVoice '{voice_name}' created at: {voice_dir}")
    print("Use with: python generate.py --voice", voice_name)

def clone_voice_openvoice(sample_path, voice_name, output_dir):
    """Clone voice using OpenVoice (lightweight alternative)."""
    try:
        from openvoice import se_extractor
        from openvoice.api import ToneColorConverter
    except ImportError:
        print("Error: OpenVoice not installed.")
        print("Run: pip install git+https://github.com/myshell-ai/OpenVoice.git")
        sys.exit(1)

    # TODO: Implement OpenVoice cloning
    print("OpenVoice cloning not yet implemented")

def main():
    parser = argparse.ArgumentParser(
        description="Clone your voice for TTS generation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python clone-voice.py --sample voice.wav --name my-voice
  python clone-voice.py --samples v1.wav v2.wav --name my-voice-hq
  python clone-voice.py --sample voice.wav --name vi-voice --lang vi
        """
    )

    parser.add_argument(
        '--sample',
        type=str,
        help='Path to voice sample audio file'
    )
    parser.add_argument(
        '--samples',
        type=str,
        nargs='+',
        help='Multiple voice sample files (better quality)'
    )
    parser.add_argument(
        '--name', '-n',
        type=str,
        required=True,
        help='Name for the cloned voice'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        default='voices',
        help='Output directory for voice models (default: voices)'
    )
    parser.add_argument(
        '--lang', '-l',
        type=str,
        default='en',
        choices=['en', 'vi', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'tr', 'ru'],
        help='Primary language of the voice (default: en)'
    )
    parser.add_argument(
        '--engine',
        type=str,
        default='xtts',
        choices=['xtts', 'openvoice'],
        help='TTS engine to use (default: xtts)'
    )

    args = parser.parse_args()

    # Get sample paths
    sample_paths = args.samples if args.samples else [args.sample]

    if not sample_paths or not sample_paths[0]:
        parser.error("Either --sample or --samples is required")

    # Validate samples exist
    for path in sample_paths:
        if not os.path.exists(path):
            print(f"Error: Sample file not found: {path}")
            sys.exit(1)

    # Clone based on engine
    if args.engine == 'xtts':
        clone_voice_xtts(sample_paths, args.name, args.output, args.lang)
    elif args.engine == 'openvoice':
        clone_voice_openvoice(sample_paths[0], args.name, args.output)

if __name__ == '__main__':
    main()
