#!/usr/bin/env python3
"""
Download viXTTS model for Vietnamese TTS.
Models available:
  - capleaf/viXTTS (recommended, better quality)
  - drewThomasson/fineTunedTTSModels/Viet-xtts-v2
"""

import argparse
import os
from pathlib import Path

def download_vixtts(output_dir="models/vixtts", source="capleaf"):
    """Download viXTTS model from HuggingFace."""
    try:
        from huggingface_hub import hf_hub_download, snapshot_download
    except ImportError:
        print("Error: huggingface_hub not installed.")
        print("Run: pip install huggingface_hub")
        return False

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    if source == "capleaf":
        # capleaf/viXTTS - recommended
        repo_id = "capleaf/viXTTS"
        files = ["config.json", "model.pth", "vocab.json"]

        print(f"Downloading viXTTS from {repo_id}...")
        for filename in files:
            print(f"  Downloading {filename}...")
            try:
                hf_hub_download(
                    repo_id=repo_id,
                    filename=filename,
                    local_dir=str(output_path),
                    local_dir_use_symlinks=False
                )
            except Exception as e:
                print(f"  Error downloading {filename}: {e}")
                return False

    elif source == "drew":
        # drewThomasson/fineTunedTTSModels
        repo_id = "drewThomasson/fineTunedTTSModels"
        subfolder = "Viet-xtts-v2"
        files = ["config.json", "model.pth", "vocab.json"]

        print(f"Downloading Viet-xtts-v2 from {repo_id}...")
        for filename in files:
            print(f"  Downloading {filename}...")
            try:
                hf_hub_download(
                    repo_id=repo_id,
                    filename=f"{subfolder}/{filename}",
                    local_dir=str(output_path.parent),
                    local_dir_use_symlinks=False
                )
                # Move from subfolder to output_path
                src = output_path.parent / subfolder / filename
                dst = output_path / filename
                if src.exists():
                    src.rename(dst)
            except Exception as e:
                print(f"  Error downloading {filename}: {e}")
                return False

    print(f"\nModel downloaded to: {output_path}")
    print("\nFiles:")
    for f in output_path.iterdir():
        size = f.stat().st_size / (1024 * 1024)
        print(f"  {f.name}: {size:.1f} MB")

    return True


def verify_model(model_dir="models/vixtts"):
    """Verify the downloaded model."""
    model_path = Path(model_dir)
    required_files = ["config.json", "model.pth", "vocab.json"]

    print(f"\nVerifying model in {model_path}...")

    missing = []
    for f in required_files:
        if not (model_path / f).exists():
            missing.append(f)

    if missing:
        print(f"Missing files: {', '.join(missing)}")
        return False

    # Check model.pth size (should be ~1.8GB)
    model_size = (model_path / "model.pth").stat().st_size / (1024 * 1024 * 1024)
    if model_size < 1.0:
        print(f"Warning: model.pth seems too small ({model_size:.2f} GB)")
        print("Expected ~1.8 GB. Download may be incomplete.")
        return False

    print("Model verified successfully!")
    return True


def main():
    parser = argparse.ArgumentParser(description="Download viXTTS Vietnamese TTS model")
    parser.add_argument("--output", "-o", default="models/vixtts",
                        help="Output directory for model files")
    parser.add_argument("--source", "-s", default="capleaf",
                        choices=["capleaf", "drew"],
                        help="Model source: capleaf (recommended) or drew")
    parser.add_argument("--verify-only", action="store_true",
                        help="Only verify existing model, don't download")

    args = parser.parse_args()

    if args.verify_only:
        success = verify_model(args.output)
    else:
        success = download_vixtts(args.output, args.source)
        if success:
            verify_model(args.output)

    if success:
        print("\n" + "=" * 50)
        print("viXTTS ready! Example usage:")
        print("=" * 50)
        print(f"""
python generate.py \\
    --engine vixtts \\
    --speaker-wav your-voice-sample.wav \\
    --text "Xin chào, đây là giọng nói của tôi." \\
    --output output.wav

Note: For best results with Vietnamese:
  - Use sentences with 10+ words
  - Speaker sample should be 6-30 seconds
  - Clear audio without background noise
""")


if __name__ == "__main__":
    main()
