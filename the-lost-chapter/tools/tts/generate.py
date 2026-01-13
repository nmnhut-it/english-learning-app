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
    voice_dir = Path("voices") / voice_name
    config_path = voice_dir / "config.json"

    if not config_path.exists():
        print(f"Error: Voice not found: {voice_name}")
        print(f"Run: python clone-voice.py --sample your-audio.wav --name {voice_name}")
        sys.exit(1)

    with open(config_path) as f:
        voice_config = json.load(f)

    # Get speaker reference
    speaker_wav = voice_config["samples"][0] if voice_config["samples"] else None

    if not speaker_wav:
        print("Error: No speaker samples found in voice config")
        sys.exit(1)

    # Initialize TTS
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(device)

    # Generate
    tts.tts_to_file(
        text=text,
        speaker_wav=speaker_wav,
        language=language,
        file_path=output_path
    )

    print(f"Generated: {output_path}")
    return output_path


def generate_vixtts(text, speaker_wav, output_path, device='cuda'):
    """Generate Vietnamese audio using viXTTS (fine-tuned for Vietnamese).

    Model: capleaf/viXTTS or drewThomasson/fineTunedTTSModels/Viet-xtts-v2
    Better quality for Vietnamese than standard XTTS.
    Note: Sentences under 10 words may produce inconsistent output.
    """
    try:
        from TTS.tts.configs.xtts_config import XttsConfig
        from TTS.tts.models.xtts import Xtts
        import torch
    except ImportError:
        print("Error: TTS not installed. Run: pip install TTS")
        sys.exit(1)

    # Model paths - download from HuggingFace first
    model_dir = Path("models/vixtts")
    config_path = model_dir / "config.json"
    model_path = model_dir / "model.pth"
    vocab_path = model_dir / "vocab.json"

    if not model_path.exists():
        print("viXTTS model not found. Download it first:")
        print("  python download-vixtts.py")
        print("Or manually from: https://huggingface.co/capleaf/viXTTS")
        sys.exit(1)

    # Load config and model
    config = XttsConfig()
    config.load_json(str(config_path))

    model = Xtts.init_from_config(config)
    model.load_checkpoint(config, checkpoint_path=str(model_path), vocab_path=str(vocab_path))

    if device == 'cuda' and torch.cuda.is_available():
        model.cuda()

    # Compute speaker latents from reference audio
    gpt_cond_latent, speaker_embedding = model.get_conditioning_latents(audio_path=speaker_wav)

    # Generate audio
    out = model.inference(
        text,
        "vi",
        gpt_cond_latent,
        speaker_embedding,
        temperature=0.7
    )

    # Save audio
    import soundfile as sf
    sf.write(output_path, out["wav"], 24000)

    print(f"Generated (viXTTS): {output_path}")
    return output_path

def generate_edge(text, voice, output_path):
    """Generate audio using Edge TTS (no cloning)."""
    try:
        import edge_tts
        import asyncio
    except ImportError:
        print("Error: edge-tts not installed. Run: pip install edge-tts")
        sys.exit(1)

    async def _generate():
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_path)

    asyncio.run(_generate())
    print(f"Generated: {output_path}")
    return output_path

def split_sentences(text):
    """Split text into sentences for timestamp generation."""
    import re
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s for s in sentences if s]

def generate_timestamps(text, audio_path, output_path):
    """Estimate timestamps for sentences (basic implementation)."""
    try:
        from pydub import AudioSegment
    except ImportError:
        print("Warning: pydub not installed, skipping timestamps")
        return

    audio = AudioSegment.from_file(audio_path)
    duration = len(audio) / 1000.0  # seconds

    sentences = split_sentences(text)
    if not sentences:
        return

    # Simple estimation: divide duration by sentence count
    time_per_sentence = duration / len(sentences)

    timestamps = []
    current_time = 0.0

    for sentence in sentences:
        timestamps.append({
            "start": round(current_time, 2),
            "end": round(current_time + time_per_sentence, 2),
            "text": sentence
        })
        current_time += time_per_sentence

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(timestamps, f, indent=2, ensure_ascii=False)

    print(f"Timestamps: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Generate TTS audio")
    parser.add_argument("--text", "-t", help="Text to synthesize")
    parser.add_argument("--file", "-f", help="Text file to synthesize")
    parser.add_argument("--voice", "-v",
                        help="Voice name (cloned) or Edge voice ID")
    parser.add_argument("--speaker-wav", "-s",
                        help="Speaker reference audio (for vixtts engine)")
    parser.add_argument("--lang", "-l", default="en",
                        help="Language code (en, vi, etc.)")
    parser.add_argument("--output", "-o", default="output.wav",
                        help="Output audio file path")
    parser.add_argument("--engine", "-e", default="xtts",
                        choices=["xtts", "vixtts", "edge"],
                        help="TTS engine: xtts (multilingual), vixtts (Vietnamese), edge (no cloning)")
    parser.add_argument("--device", "-d", default="cuda",
                        help="Device for XTTS (cuda or cpu)")
    parser.add_argument("--temperature", default=0.7, type=float,
                        help="XTTS temperature (0.5-1.0)")
    parser.add_argument("--timestamps", action="store_true",
                        help="Generate timestamp file")

    args = parser.parse_args()

    # Get text
    if args.file:
        with open(args.file, 'r', encoding='utf-8') as f:
            text = f.read()
    elif args.text:
        text = args.text
    else:
        print("Error: Provide --text or --file")
        sys.exit(1)

    # Generate audio
    if args.engine == "edge":
        if not args.voice:
            print("Error: --voice required for edge engine (e.g., vi-VN-HoaiMyNeural)")
            sys.exit(1)
        generate_edge(text, args.voice, args.output)
    elif args.engine == "vixtts":
        if not args.speaker_wav:
            print("Error: --speaker-wav required for vixtts engine")
            sys.exit(1)
        generate_vixtts(text, args.speaker_wav, args.output, device=args.device)
    else:
        if not args.voice:
            print("Error: --voice required for xtts engine")
            sys.exit(1)
        generate_xtts(text, args.voice, args.lang, args.output,
                      device=args.device, temperature=args.temperature)

    # Generate timestamps if requested
    if args.timestamps:
        ts_path = Path(args.output).with_suffix('.timestamps.json')
        generate_timestamps(text, args.output, str(ts_path))

if __name__ == "__main__":
    main()
