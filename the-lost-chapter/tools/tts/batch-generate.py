#!/usr/bin/env python3
"""
Batch TTS Generation for TheLostChapter
Generate audio for an entire book from chapter JSON files.
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    from tqdm import tqdm
except ImportError:
    def tqdm(iterable, **kwargs):
        return iterable

def load_chapter(book_id, chapter_id, content_dir):
    """Load chapter JSON file."""
    chapter_path = Path(content_dir) / "books" / book_id / "chapters" / f"{chapter_id}.json"

    if not chapter_path.exists():
        raise FileNotFoundError(f"Chapter not found: {chapter_path}")

    with open(chapter_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_audio_sections(chapter):
    """Extract sections that need audio generation."""
    sections = chapter.get("sections", [])
    audio_sections = []

    for i, section in enumerate(sections):
        if section.get("type") == "audio":
            # Only include sections without existing audio or marked for regeneration
            if section.get("transcript") and not section.get("skip_generation"):
                audio_sections.append({
                    "index": i,
                    "src": section.get("src", f"section-{i}.mp3"),
                    "transcript": section["transcript"],
                    "language": section.get("language", "en")
                })

    return audio_sections

def generate_audio(text, voice, language, output_path, engine="xtts"):
    """Generate audio using the TTS engine."""
    if engine == "edge":
        from generate import generate_edge
        generate_edge(text, voice, output_path)
    else:
        from generate import generate_xtts
        generate_xtts(text, voice, language, output_path)

def main():
    parser = argparse.ArgumentParser(description="Batch generate TTS for a book")
    parser.add_argument("--book", "-b", required=True, help="Book ID")
    parser.add_argument("--chapter", "-c", help="Chapter ID (or all if not specified)")
    parser.add_argument("--voice", "-v", required=True, help="Voice name")
    parser.add_argument("--engine", "-e", default="xtts", choices=["xtts", "edge"])
    parser.add_argument("--content-dir", default="../../content", help="Content directory")
    parser.add_argument("--output-dir", default=None, help="Output directory for audio")
    parser.add_argument("--force", "-f", action="store_true", help="Regenerate existing files")

    args = parser.parse_args()

    content_dir = Path(args.content_dir).resolve()

    # Determine output directory
    if args.output_dir:
        output_dir = Path(args.output_dir)
    else:
        output_dir = content_dir / "media" / args.book / "audio"

    output_dir.mkdir(parents=True, exist_ok=True)

    # Get chapters to process
    if args.chapter:
        chapters = [args.chapter]
    else:
        # Load all chapters from book.json
        book_path = content_dir / "books" / args.book / "book.json"
        if not book_path.exists():
            print(f"Error: Book not found: {args.book}")
            sys.exit(1)

        with open(book_path) as f:
            book = json.load(f)
        chapters = book.get("chapters", [])

    total_generated = 0

    for chapter_id in chapters:
        print(f"\nProcessing chapter: {chapter_id}")

        try:
            chapter = load_chapter(args.book, chapter_id, content_dir)
        except FileNotFoundError as e:
            print(f"  Skipping: {e}")
            continue

        audio_sections = get_audio_sections(chapter)
        print(f"  Found {len(audio_sections)} audio sections")

        for section in tqdm(audio_sections, desc=f"  Generating"):
            output_path = output_dir / section["src"]

            # Skip if exists and not forcing
            if output_path.exists() and not args.force:
                print(f"    Skipping (exists): {section['src']}")
                continue

            try:
                generate_audio(
                    text=section["transcript"],
                    voice=args.voice,
                    language=section["language"],
                    output_path=str(output_path),
                    engine=args.engine
                )
                total_generated += 1
            except Exception as e:
                print(f"    Error generating {section['src']}: {e}")

    print(f"\nDone! Generated {total_generated} audio files.")
    print(f"Output directory: {output_dir}")

if __name__ == "__main__":
    main()
