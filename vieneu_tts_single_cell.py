# VieNeu-TTS Voice Cloning - Single Cell Version
# Copy and paste this entire cell into a Colab notebook

# ============================================================================
# SETUP & INSTALLATION
# ============================================================================

# Check GPU
!nvidia-smi

# Install dependencies
print("📦 Installing packages...")
!pip install -q vieneu --extra-index-url https://pnnbao97.github.io/llama-cpp-python-v0.3.16/cpu/
!pip install -q soundfile librosa pydub noisereduce
!apt-get install -qq espeak-ng ffmpeg
print("✅ Installation complete!")

# ============================================================================
# IMPORTS & CONFIGURATION
# ============================================================================

import os
import numpy as np
import soundfile as sf
import librosa
import noisereduce as nr
from pathlib import Path
from google.colab import files
from IPython.display import Audio, display
from pydub import AudioSegment
from vieneu import Vieneu
import warnings
warnings.filterwarnings('ignore')

# Constants
class AudioConfig:
    TARGET_SAMPLE_RATE = 24000
    TARGET_DB = -20
    NOISE_REDUCTION_STRENGTH = 0.7
    MIN_SEGMENT_DURATION = 3
    MAX_SEGMENT_DURATION = 10
    FRAME_LENGTH_MS = 0.025
    HOP_LENGTH_MS = 0.010
    RMS_THRESHOLD_MULTIPLIER = 0.5
    MAX_SEGMENTS_TO_SHOW = 5

# Create directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("processed", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

print("✅ Configuration loaded!")

# ============================================================================
# AUDIO PROCESSING FUNCTIONS
# ============================================================================

def convert_to_wav(input_path, output_path="processed/converted.wav"):
    """Convert any audio format to WAV"""
    print(f"🔄 Converting {Path(input_path).suffix} to WAV...")
    audio = AudioSegment.from_file(str(input_path))
    audio = audio.set_channels(1).set_frame_rate(AudioConfig.TARGET_SAMPLE_RATE)
    audio.export(output_path, format="wav")
    print(f"✅ Converted to: {output_path}")
    return output_path

def normalize_audio(audio_data, target_db=None):
    """Normalize audio to target dB level"""
    if target_db is None:
        target_db = AudioConfig.TARGET_DB
    rms = np.sqrt(np.mean(audio_data**2))
    if rms > 0:
        target_rms = 10 ** (target_db / 20)
        audio_data = audio_data * (target_rms / rms)
    return np.clip(audio_data, -1, 1)

def reduce_noise(audio_data, sample_rate):
    """Apply noise reduction"""
    print("🔇 Applying noise reduction...")
    noise_sample = audio_data[:int(sample_rate * 0.5)]
    return nr.reduce_noise(
        y=audio_data,
        sr=sample_rate,
        y_noise=noise_sample,
        prop_decrease=AudioConfig.NOISE_REDUCTION_STRENGTH
    )

def find_speech_segments(audio_data, sample_rate):
    """Find segments with speech activity"""
    print("🔍 Analyzing audio for speech segments...")

    frame_length = int(sample_rate * AudioConfig.FRAME_LENGTH_MS)
    hop_length = int(sample_rate * AudioConfig.HOP_LENGTH_MS)
    rms = librosa.feature.rms(y=audio_data, frame_length=frame_length, hop_length=hop_length)[0]
    threshold = np.mean(rms) * AudioConfig.RMS_THRESHOLD_MULTIPLIER
    is_speech = rms > threshold
    times = librosa.frames_to_time(np.arange(len(rms)), sr=sample_rate, hop_length=hop_length)

    segments = []
    in_speech = False
    start_time = 0

    for i, (t, speech) in enumerate(zip(times, is_speech)):
        if speech and not in_speech:
            start_time = t
            in_speech = True
        elif not speech and in_speech:
            duration = t - start_time
            if duration >= AudioConfig.MIN_SEGMENT_DURATION:
                end = min(t, start_time + AudioConfig.MAX_SEGMENT_DURATION)
                frame_count = int((end - start_time) / AudioConfig.HOP_LENGTH_MS)
                energy = np.mean(rms[max(0, i - frame_count):i])
                segments.append({
                    'start': start_time,
                    'end': end,
                    'duration': end - start_time,
                    'energy': energy
                })
            in_speech = False

    if in_speech:
        duration = times[-1] - start_time
        if duration >= AudioConfig.MIN_SEGMENT_DURATION:
            end = min(times[-1], start_time + AudioConfig.MAX_SEGMENT_DURATION)
            segments.append({
                'start': start_time,
                'end': end,
                'duration': end - start_time,
                'energy': np.mean(rms[-int((end - start_time) / AudioConfig.HOP_LENGTH_MS):])
            })

    # Fallback: create fixed windows
    if not segments:
        print("⚠️ No clear speech segments found, creating fixed windows...")
        total_duration = len(audio_data) / sample_rate
        for start in np.arange(0, max(1, total_duration - AudioConfig.MIN_SEGMENT_DURATION), 5):
            end = min(start + AudioConfig.MAX_SEGMENT_DURATION, total_duration)
            if end - start >= AudioConfig.MIN_SEGMENT_DURATION:
                seg_data = audio_data[int(start * sample_rate):int(end * sample_rate)]
                segments.append({
                    'start': start,
                    'end': end,
                    'duration': end - start,
                    'energy': np.sqrt(np.mean(seg_data**2))
                })

    segments.sort(key=lambda x: x['energy'], reverse=True)
    return segments[:AudioConfig.MAX_SEGMENTS_TO_SHOW]

def preprocess_audio(input_path, apply_noise_reduction=True):
    """Full preprocessing pipeline"""
    print("\n" + "="*50)
    print("🎛️ AUDIO PREPROCESSING PIPELINE")
    print("="*50)

    # Convert format if needed
    input_path = Path(input_path)
    if input_path.suffix.lower() != '.wav':
        wav_path = convert_to_wav(str(input_path))
    else:
        wav_path = str(input_path)

    # Load audio
    print("\n📂 Loading audio...")
    audio_data, sample_rate = librosa.load(wav_path, sr=AudioConfig.TARGET_SAMPLE_RATE, mono=True)
    print(f"   Duration: {len(audio_data)/sample_rate:.1f}s")
    print(f"   Sample rate: {sample_rate} Hz")

    # Apply noise reduction
    if apply_noise_reduction:
        audio_data = reduce_noise(audio_data, sample_rate)

    # Normalize
    print("📊 Normalizing audio levels...")
    audio_data = normalize_audio(audio_data)

    # Find segments
    segments = find_speech_segments(audio_data, sample_rate)
    print(f"\n✅ Found {len(segments)} candidate segments")

    return audio_data, sample_rate, segments

print("✅ Audio processing functions loaded!")

# ============================================================================
# LOAD TTS MODEL
# ============================================================================

print("🔄 Loading VieNeu-TTS model...")
tts = Vieneu()
print("✅ Model loaded!\n")

# Check capabilities
has_clone_voice = hasattr(tts, 'clone_voice')
has_encode_reference = hasattr(tts, 'encode_reference')
has_create_voice = hasattr(tts, 'create_voice')

print("🔍 Model capabilities:")
print(f"   clone_voice: {'✅' if has_clone_voice else '❌'}")
print(f"   encode_reference: {'✅' if has_encode_reference else '❌'}")
print(f"   create_voice: {'✅' if has_create_voice else '❌'}")

# ============================================================================
# UPLOAD VOICE FILE
# ============================================================================

print("\n📤 Upload your voice file (M4A/MP3/WAV):\n")
uploaded = files.upload()

if not uploaded:
    raise Exception("No file uploaded!")

uploaded_filename = list(uploaded.keys())[0]
original_path = Path("uploads") / uploaded_filename

with open(original_path, "wb") as f:
    f.write(uploaded[uploaded_filename])

size_mb = len(uploaded[uploaded_filename]) / (1024 * 1024)
print(f"\n✅ Uploaded: {uploaded_filename}")
print(f"   Size: {size_mb:.2f} MB")

# ============================================================================
# PREPROCESS AUDIO
# ============================================================================

audio_data, sample_rate, segments = preprocess_audio(original_path, apply_noise_reduction=True)

# Save full processed audio
processed_full_path = "processed/full_processed.wav"
sf.write(processed_full_path, audio_data, sample_rate)

print("\n🔊 Full processed audio:")
display(Audio(processed_full_path))

# ============================================================================
# PREVIEW SEGMENTS
# ============================================================================

print("\n🎵 Extracting candidate segments:\n")
segment_paths = []

for i, seg in enumerate(segments, 1):
    print("="*50)
    print(f"📍 Segment {i}")
    print(f"   Time: {seg['start']:.1f}s - {seg['end']:.1f}s")
    print(f"   Duration: {seg['duration']:.1f}s")

    segment_audio = audio_data[int(seg['start']*sample_rate):int(seg['end']*sample_rate)]
    segment_path = f"processed/segment_{i}.wav"
    sf.write(segment_path, segment_audio, sample_rate)
    segment_paths.append(segment_path)

    display(Audio(segment_path))
    print()

# ============================================================================
# SELECT SEGMENT & CLONE VOICE
# ============================================================================

# Auto-select best segment (highest energy = first one)
selected_segment_index = 1
selected_path = segment_paths[selected_segment_index - 1]
selected_info = segments[selected_segment_index - 1]

print(f"✅ Selected Segment {selected_segment_index}")
print(f"   Time: {selected_info['start']:.1f}s - {selected_info['end']:.1f}s")
print("\n🔊 Selected audio:")
display(Audio(selected_path))

# Get transcript
sample_transcript = input("\n📝 Enter the transcript of what was said in this segment: ")
print(f"Transcript: {sample_transcript}")

# Clone voice
print("\n🔄 Cloning voice...\n")
cloned_voice = None

# Try different cloning methods
if has_clone_voice:
    try:
        print("Trying clone_voice method...")
        cloned_voice = tts.clone_voice(audio_path=selected_path, text=sample_transcript, name="MyVoice")
        print("✅ clone_voice succeeded!")
    except Exception as e:
        print(f"❌ clone_voice failed: {e}")

if not cloned_voice and has_create_voice:
    try:
        print("Trying create_voice method...")
        cloned_voice = tts.create_voice(audio_path=selected_path, text=sample_transcript)
        print("✅ create_voice succeeded!")
    except Exception as e:
        print(f"❌ create_voice failed: {e}")

if not cloned_voice and has_encode_reference:
    try:
        print("Trying encode_reference method...")
        cloned_voice = tts.encode_reference(selected_path)
        print("✅ encode_reference succeeded!")
    except Exception as e:
        print(f"❌ encode_reference failed: {e}")

if not cloned_voice:
    try:
        print("Trying direct path method...")
        tts.infer(text="Test", voice=selected_path)
        cloned_voice = selected_path
        print("✅ Direct path works!")
    except Exception as e:
        print(f"❌ Direct path failed: {e}")

if not cloned_voice:
    try:
        print("Trying ref_audio parameter...")
        tts.infer(text="Test", ref_audio=selected_path, ref_text=sample_transcript)
        cloned_voice = {"ref_audio": selected_path, "ref_text": sample_transcript}
        print("✅ ref_audio parameter works!")
    except Exception as e:
        print(f"❌ ref_audio failed: {e}")

if not cloned_voice:
    print("⚠️ All cloning methods failed. Using default voice.")
    cloned_voice = None

print(f"\n✅ Voice setup complete!")
print(f"   Voice type: {type(cloned_voice)}")

# ============================================================================
# GENERATE SPEECH
# ============================================================================

def generate_speech(text, voice_data, output_path):
    """Generate speech with cloned voice"""
    try:
        if isinstance(voice_data, dict) and "ref_audio" in voice_data:
            audio = tts.infer(text=text, ref_audio=voice_data["ref_audio"], ref_text=voice_data["ref_text"])
        elif voice_data is not None:
            try:
                audio = tts.infer(text=text, voice=voice_data, temperature=1.0, top_k=50)
            except:
                audio = tts.infer(text=text, voice=voice_data)
        else:
            audio = tts.infer(text=text)

        sf.write(output_path, audio, AudioConfig.TARGET_SAMPLE_RATE)
        return True
    except Exception as e:
        print(f"❌ Generation failed: {e}")
        return False

# Generate test speech
test_text = "Xin chào mọi người. Tôi là trợ lý ảo được tạo bởi VieNeu TTS. Rất vui được gặp các bạn."
print(f"\n📝 Test text: {test_text}")
print("🔄 Generating speech...")

output_path = "outputs/cloned_speech.wav"
if generate_speech(test_text, cloned_voice, output_path):
    print("\n✅ Speech generated!")
    print("\n🔊 Your cloned voice:")
    display(Audio(output_path))
else:
    print("❌ Generation failed")

# ============================================================================
# INTERACTIVE MODE
# ============================================================================

print("\n" + "="*50)
print("🎤 INTERACTIVE MODE")
print("="*50)
print("Enter text to generate speech with your cloned voice.")
print("Type 'quit' to exit.\n")

counter = 1
while True:
    user_text = input(f"\n[{counter}] Enter text (or 'quit'): ")
    if user_text.lower() == 'quit':
        break

    if user_text.strip():
        output_path = f"outputs/interactive_{counter}.wav"
        if generate_speech(user_text, cloned_voice, output_path):
            print(f"✅ Generated: {output_path}")
            display(Audio(output_path))
            counter += 1

# ============================================================================
# DOWNLOAD RESULTS
# ============================================================================

import zipfile

zip_path = "vieneu_outputs.zip"
with zipfile.ZipFile(zip_path, 'w') as zipf:
    for file in Path("outputs").glob("*.wav"):
        zipf.write(file, f"outputs/{file.name}")
    for file in Path("processed").glob("*.wav"):
        zipf.write(file, f"processed/{file.name}")

print("\n📦 Downloading results...")
files.download(zip_path)

# Cleanup
tts.close()
print("\n✅ Done! 🎉")
