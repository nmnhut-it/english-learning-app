#!/usr/bin/env python3
"""
Audio Generator for TheLostChapter
Generates audio from book content using Edge TTS (free, no GPU needed)

Usage:
    pip install edge-tts
    python generate_audio.py --book gentle-mind --chapter ch01

Vietnamese voices:
    vi-VN-HoaiMyNeural (female) - warm, clear
    vi-VN-NamMinhNeural (male) - calm, professional
"""

import asyncio
import json
import argparse
import re
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Please install edge-tts: pip install edge-tts")
    exit(1)

# Configuration
CONTENT_DIR = Path(__file__).parent.parent.parent / "content" / "books"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "content" / "books"

VOICES = {
    "vi": "vi-VN-HoaiMyNeural",      # Vietnamese female
    "vi-male": "vi-VN-NamMinhNeural", # Vietnamese male
    "en": "en-US-AriaNeural",         # English female
    "en-male": "en-US-GuyNeural"      # English male
}

def extract_vietnamese_text(content: str) -> str:
    """Extract Vietnamese portions from bilingual content"""
    lines = content.split('\n')
    vi_lines = []
    
    for line in lines:
        line = line.strip()
        # Skip English (italic) lines
        if line.startswith('*') and line.endswith('*'):
            continue
        # Skip markdown headers with English
        if '|' in line:
            line = line.split('|')[0].strip()
        # Skip empty lines and decorators
        if not line or line == '---' or line.startswith('#'):
            # Keep headers but clean them
            if line.startswith('#'):
                clean = line.lstrip('#').strip()
                if '|' in clean:
                    clean = clean.split('|')[0].strip()
                if clean:
                    vi_lines.append(clean)
            continue
        # Skip pure English lines (heuristic: contains common English words)
        if re.match(r'^[A-Za-z\s\.,\-:]+$', line):
            continue
        vi_lines.append(line)
    
    return '\n'.join(vi_lines)

def extract_english_text(content: str) -> str:
    """Extract English portions from bilingual content"""
    lines = content.split('\n')
    en_lines = []
    
    for line in lines:
        line = line.strip()
        # Get italic lines (English)
        if line.startswith('*') and line.endswith('*'):
            en_lines.append(line.strip('*').strip())
            continue
        # Get English part of headers
        if '|' in line and line.startswith('#'):
            parts = line.split('|')
            if len(parts) > 1:
                en_lines.append(parts[1].strip())
    
    return '\n'.join(en_lines)

async def generate_audio(text: str, output_path: Path, voice: str, rate: str = "+0%"):
    """Generate audio using Edge TTS"""
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(str(output_path))
    print(f"  ✓ Generated: {output_path.name}")

async def generate_with_timestamps(text: str, output_path: Path, voice: str):
    """Generate audio with word-level timestamps"""
    communicate = edge_tts.Communicate(text, voice)
    
    timestamps = []
    audio_data = b""
    
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
        elif chunk["type"] == "WordBoundary":
            timestamps.append({
                "text": chunk["text"],
                "start": chunk["offset"] / 10_000_000,  # Convert to seconds
                "end": (chunk["offset"] + chunk["duration"]) / 10_000_000
            })
    
    # Save audio
    with open(output_path, "wb") as f:
        f.write(audio_data)
    
    # Save timestamps
    ts_path = output_path.with_suffix(".json")
    with open(ts_path, "w", encoding="utf-8") as f:
        json.dump(timestamps, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ Generated: {output_path.name} + timestamps")
    return timestamps

def load_chapter(book_id: str, chapter_id: str) -> dict:
    """Load chapter content"""
    chapter_path = CONTENT_DIR / book_id / "chapters" / f"{chapter_id}.json"
    if not chapter_path.exists():
        raise FileNotFoundError(f"Chapter not found: {chapter_path}")
    
    with open(chapter_path, encoding="utf-8") as f:
        return json.load(f)

async def process_chapter(book_id: str, chapter_id: str, language: str = "vi"):
    """Process a chapter and generate audio"""
    print(f"\n📖 Processing: {book_id}/{chapter_id}")
    
    chapter = load_chapter(book_id, chapter_id)
    output_dir = OUTPUT_DIR / book_id / "audio"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    voice = VOICES.get(language, VOICES["vi"])
    
    # Collect all markdown sections
    all_text = []
    for i, section in enumerate(chapter.get("sections", [])):
        if section.get("type") == "markdown":
            content = section.get("content", "")
            if language == "vi":
                text = extract_vietnamese_text(content)
            else:
                text = extract_english_text(content)
            if text.strip():
                all_text.append(text)
    
    # Combine and generate
    full_text = "\n\n".join(all_text)
    
    if not full_text.strip():
        print("  ⚠ No text found for selected language")
        return
    
    print(f"  📝 Text length: {len(full_text)} chars")
    print(f"  🎤 Voice: {voice}")
    
    # Generate full chapter audio
    output_path = output_dir / f"{chapter_id}-{language}.mp3"
    await generate_with_timestamps(full_text, output_path, voice)
    
    print(f"  ✅ Done!")

async def main():
    parser = argparse.ArgumentParser(description="Generate audio for TheLostChapter books")
    parser.add_argument("--book", required=True, help="Book ID (e.g., gentle-mind)")
    parser.add_argument("--chapter", help="Chapter ID (e.g., ch01). If omitted, process all.")
    parser.add_argument("--lang", default="vi", choices=["vi", "vi-male", "en", "en-male"])
    parser.add_argument("--list-voices", action="store_true", help="List available voices")
    
    args = parser.parse_args()
    
    if args.list_voices:
        voices = await edge_tts.list_voices()
        for v in voices:
            if "vi" in v["Locale"].lower() or "en-US" in v["Locale"]:
                print(f"{v['ShortName']:30} {v['Locale']:10} {v['Gender']}")
        return
    
    book_path = CONTENT_DIR / args.book / "book.json"
    if not book_path.exists():
        print(f"❌ Book not found: {args.book}")
        return
    
    with open(book_path) as f:
        book = json.load(f)
    
    chapters = [args.chapter] if args.chapter else book.get("chapters", [])
    
    for chapter_id in chapters:
        await process_chapter(args.book, chapter_id, args.lang)

if __name__ == "__main__":
    asyncio.run(main())
