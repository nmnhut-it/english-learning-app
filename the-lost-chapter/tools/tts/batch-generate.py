#!/usr/bin/env python3
"""
Batch TTS Generation for TheLostChapter
Generate audio for an entire book from a YAML config.
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("Error: PyYAML not installed. Run: pip install pyyaml")
    sys.exit(1)

from tqdm import tqdm

def load_config(config_path):
    """Load batch generation config."""
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def generate_section(section, default_voice, output_dir, engine='xtts', device='cuda'):
    """Generate audio for a single section."""
    from generate import generate_xtts, generate_edge_tts, generate_timestamps

    voice = section.get('voice', default_voice)
    lang = section.get('lang', 'en')
    section_id = section['id']

    # Get text
    if 'text' in section:
        text = section['text']
    elif 'file' in section:
        with open(section['file'], 'r', encoding='utf-8') as f:
            text = f.read().strip()
    else:
        print(f"Warning: Section {section_id} has no text, skipping")
        return None

    output_path = Path(output_dir) / f"{section_id}.mp3"

    # Generate
    if engine == 'xtts':
        generate_xtts(text, voice, lang, output_path, device)
    else:
        generate_edge_tts(text, voice, output_path)

    # Generate timestamps
    if section.get('timestamps', True):
        generate_timestamps(output_path, text)

    return output_path

def main():
    parser = argparse.ArgumentParser(
        description="Batch generate TTS audio for a book",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Config file format (YAML):
  voice: my-voice
  engine: xtts
  sections:
    - id: ch01-intro
      lang: en
      text: "Welcome to the story..."
    - id: ch01-section1
      lang: en
      file: scripts/ch01-section1.txt
    - id: ch01-vocab
      lang: vi
      voice: my-voice-vi
      text: "Từ vựng..."
        """
    )

    parser.add_argument(
        '--config', '-c',
        type=str,
        required=True,
        help='Path to YAML config file'
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        default='output',
        help='Output directory (default: output)'
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
        '--skip-existing',
        action='store_true',
        help='Skip sections that already have audio files'
    )

    args = parser.parse_args()

    # Load config
    config = load_config(args.config)

    default_voice = config.get('voice', 'default')
    engine = config.get('engine', args.engine)
    sections = config.get('sections', [])

    if not sections:
        print("Error: No sections in config")
        sys.exit(1)

    # Create output directory
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Generate each section
    print(f"Generating {len(sections)} sections...")

    results = []
    for section in tqdm(sections, desc="Generating"):
        section_id = section['id']
        output_path = output_dir / f"{section_id}.mp3"

        # Skip if exists
        if args.skip_existing and output_path.exists():
            print(f"Skipping existing: {section_id}")
            results.append({"id": section_id, "status": "skipped"})
            continue

        try:
            generate_section(
                section=section,
                default_voice=default_voice,
                output_dir=output_dir,
                engine=engine,
                device=args.device
            )
            results.append({"id": section_id, "status": "success"})
        except Exception as e:
            print(f"Error generating {section_id}: {e}")
            results.append({"id": section_id, "status": "error", "error": str(e)})

    # Summary
    success = sum(1 for r in results if r['status'] == 'success')
    skipped = sum(1 for r in results if r['status'] == 'skipped')
    errors = sum(1 for r in results if r['status'] == 'error')

    print(f"\nComplete: {success} generated, {skipped} skipped, {errors} errors")

    # Save manifest
    manifest_path = output_dir / 'manifest.json'
    with open(manifest_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Manifest saved: {manifest_path}")

if __name__ == '__main__':
    main()
