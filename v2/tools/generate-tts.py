#!/usr/bin/env python3
"""
Generate TTS audio files for teacher scripts using Edge TTS.

Usage:
    python generate-tts.py <markdown_file> [--output-dir <dir>]
    python generate-tts.py data/voice-lectures/g6/unit-07/getting-started.md

This will:
1. Parse the markdown file for <teacher_script> tags
2. Generate audio files using Edge TTS (Vietnamese voice)
3. Save audio files to output directory
4. Print the href attributes to add to the markdown

Requirements:
    pip install edge-tts

Vietnamese voices available:
    - vi-VN-HoaiMyNeural (female) - recommended
    - vi-VN-NamMinhNeural (male)
"""

import asyncio
import argparse
import hashlib
import os
import re
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Please install edge-tts: pip install edge-tts")
    exit(1)

# Configuration
VOICE = "vi-VN-HoaiMyNeural"  # Female Vietnamese voice
RATE = "+0%"  # Speech rate adjustment
VOLUME = "+0%"  # Volume adjustment


def extract_teacher_scripts(md_content: str) -> list[dict]:
    """Extract all teacher_script tags from markdown content."""
    pattern = r'<teacher_script([^>]*)>([\s\S]*?)</teacher_script>'
    matches = re.findall(pattern, md_content, re.IGNORECASE)

    scripts = []
    for i, (attrs, content) in enumerate(matches):
        text = content.strip()
        if not text:
            continue

        # Parse attributes
        pause = re.search(r'pause="(\d+)"', attrs)
        action = re.search(r'action="(\w+)"', attrs)

        # Generate unique ID based on content hash
        text_hash = hashlib.md5(text.encode()).hexdigest()[:8]

        scripts.append({
            'index': i,
            'text': text,
            'hash': text_hash,
            'pause': pause.group(1) if pause else '0',
            'action': action.group(1) if action else None,
            'attrs': attrs.strip()
        })

    return scripts


async def generate_audio(text: str, output_path: str, voice: str = VOICE):
    """Generate audio file using Edge TTS."""
    communicate = edge_tts.Communicate(text, voice, rate=RATE, volume=VOLUME)
    await communicate.save(output_path)
    return output_path


async def process_markdown(md_path: str, output_dir: str):
    """Process markdown file and generate audio for all teacher scripts."""

    # Read markdown
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract scripts
    scripts = extract_teacher_scripts(content)
    print(f"Found {len(scripts)} teacher scripts in {md_path}")

    if not scripts:
        return

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Generate audio for each script
    results = []
    for script in scripts:
        filename = f"ts_{script['index']:03d}_{script['hash']}.mp3"
        output_path = os.path.join(output_dir, filename)

        print(f"  [{script['index']+1}/{len(scripts)}] Generating: {filename}")
        print(f"      Text: {script['text'][:50]}...")

        try:
            await generate_audio(script['text'], output_path)
            results.append({
                **script,
                'filename': filename,
                'path': output_path
            })
            print(f"      ✓ Saved to {output_path}")
        except Exception as e:
            print(f"      ✗ Error: {e}")

    # Print updated markdown snippets
    print("\n" + "=" * 60)
    print("Updated markdown (copy these to your file):")
    print("=" * 60 + "\n")

    for r in results:
        href = f'href="{r["filename"]}"'
        attrs = r['attrs']
        if 'href=' in attrs:
            # Replace existing href
            new_attrs = re.sub(r'href="[^"]*"', href, attrs)
        else:
            # Add href
            new_attrs = f'{attrs} {href}'.strip()

        print(f'<teacher_script {new_attrs}>')
        print(f'{r["text"]}')
        print(f'</teacher_script>\n')

    return results


def main():
    parser = argparse.ArgumentParser(description='Generate TTS audio for teacher scripts')
    parser.add_argument('markdown_file', help='Path to markdown file')
    parser.add_argument('--output-dir', '-o', help='Output directory for audio files')
    parser.add_argument('--voice', '-v', default=VOICE, help=f'Voice to use (default: {VOICE})')
    args = parser.parse_args()

    md_path = args.markdown_file
    if not os.path.exists(md_path):
        print(f"Error: File not found: {md_path}")
        exit(1)

    # Default output directory: same as markdown file
    if args.output_dir:
        output_dir = args.output_dir
    else:
        md_dir = os.path.dirname(md_path)
        output_dir = os.path.join(md_dir, 'audio')

    global VOICE
    VOICE = args.voice

    print(f"Processing: {md_path}")
    print(f"Output dir: {output_dir}")
    print(f"Voice: {VOICE}")
    print()

    asyncio.run(process_markdown(md_path, output_dir))


if __name__ == '__main__':
    main()
