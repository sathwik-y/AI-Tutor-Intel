# app/services/audio_service.py
import os
import tempfile
import subprocess

#File transcription using faster whisper
from faster_whisper import WhisperModel
model_whisper = WhisperModel("base", device="cpu", compute_type="int8")

async def transcribe_audio(file) -> str:
    """Accept a full audio file, save to temp, and transcribe using Faster-Whisper."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    # Force English language
    segments, info = model_whisper.transcribe(tmp_path, language="en")
    transcript = " ".join([seg.text for seg in segments])

    os.remove(tmp_path)
    return transcript

# Chunked Transcription
async def transcribe_audio_chunk(data: bytes) -> str:
    """Perform transcription for a chunk of audio data."""
    try:
        # Save the raw audio data to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_input:
            tmp_input.write(data)
            input_path = tmp_input.name

        # Convert to WAV using ffmpeg
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_output:
            output_path = tmp_output.name

        # Use ffmpeg to convert WebM to WAV
        ffmpeg_path = r"D:\ffmpeg-master-latest-win64-gpl-shared\bin\ffmpeg.exe"  # Your path
        
        cmd = [
            ffmpeg_path, '-y', '-i', input_path,
            '-ar', '16000',  # Sample rate
            '-ac', '1',      # Mono
            '-c:a', 'pcm_s16le',  # PCM format
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"FFmpeg error: {result.stderr}")
            return ""

        # Check if the output file was created and has content
        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            print("No valid audio output from ffmpeg")
            return ""

        # Use Faster-Whisper for transcription with FORCED ENGLISH
        segments, info = model_whisper.transcribe(output_path, language="en")
        transcript = " ".join([seg.text for seg in segments])
        
        # Clean up temp files
        try:
            os.remove(input_path)
            os.remove(output_path)
        except:
            pass
        
        return transcript.strip()
        
    except FileNotFoundError:
        print("FFmpeg not found. Please install FFmpeg to process audio.")
        return ""
    except Exception as e:
        print(f"Transcription error: {e}")
        return ""

# Alias for compatibility with audio.py
transcribe_chunk = transcribe_audio_chunk

# Optional Utility
def is_valid_audio(data: bytes) -> bool:
    """Perform basic sanity check on received audio data."""
    return len(data) > 0