# app/services/tts_service.py
import os
import uuid
from typing import Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

try:
    import pyttsx3
    TTS_AVAILABLE = True
    print("pyttsx3 imported successfully")
except ImportError:
    TTS_AVAILABLE = False
    print("pyttsx3 not available")

executor = ThreadPoolExecutor(max_workers=1)
tts_engine = None

# TTS Settings (can be modified)
TTS_SETTINGS = {
    'rate': 180,        # Speech rate (words per minute)
    'volume': 0.9,      # Volume (0.0 to 1.0)
    'voice_index': 0    # Voice index (0 = first available voice)
}

def initialize_tts():
    """Initialize TTS engine"""
    global tts_engine, TTS_AVAILABLE
    
    if not TTS_AVAILABLE:
        print("❌ TTS not available - pyttsx3 not installed")
        return False
    
    try:
        tts_engine = pyttsx3.init()
        
        # Set properties from settings
        tts_engine.setProperty('rate', TTS_SETTINGS['rate'])
        tts_engine.setProperty('volume', TTS_SETTINGS['volume'])
        
        # Configure voice
        voices = tts_engine.getProperty('voices')
        if voices and len(voices) > 0:
            # Try to use the configured voice index
            voice_index = min(TTS_SETTINGS['voice_index'], len(voices) - 1)
            tts_engine.setProperty('voice', voices[voice_index].id)
            print(f"✅ Using voice: {voices[voice_index].name}")
        
        print(f"✅ TTS initialized - Rate: {TTS_SETTINGS['rate']}, Volume: {TTS_SETTINGS['volume']}")
        return True
        
    except Exception as e:
        print(f"❌ TTS initialization failed: {e}")
        TTS_AVAILABLE = False
        tts_engine = None
        return False

def update_tts_settings(rate: int = None, volume: float = None, voice_index: int = None):
    """Update TTS settings dynamically"""
    global tts_engine, TTS_SETTINGS
    
    if not TTS_AVAILABLE or not tts_engine:
        return False
    
    try:
        if rate is not None:
            TTS_SETTINGS['rate'] = max(50, min(400, rate))  # Clamp between 50-400
            tts_engine.setProperty('rate', TTS_SETTINGS['rate'])
        
        if volume is not None:
            TTS_SETTINGS['volume'] = max(0.0, min(1.0, volume))  # Clamp between 0-1
            tts_engine.setProperty('volume', TTS_SETTINGS['volume'])
        
        if voice_index is not None:
            voices = tts_engine.getProperty('voices')
            if voices and 0 <= voice_index < len(voices):
                TTS_SETTINGS['voice_index'] = voice_index
                tts_engine.setProperty('voice', voices[voice_index].id)
                print(f"✅ Voice changed to: {voices[voice_index].name}")
        
        return True
    except Exception as e:
        print(f"Error updating TTS settings: {e}")
        return False

def get_available_voices():
    """Get list of available voices"""
    if not TTS_AVAILABLE or not tts_engine:
        return []
    
    try:
        voices = tts_engine.getProperty('voices')
        return [{'index': i, 'name': voice.name, 'id': voice.id} for i, voice in enumerate(voices)]
    except:
        return []

def _generate_speech_sync(text: str, output_path: str) -> bool:
    """Generate speech synchronously"""
    global tts_engine, TTS_AVAILABLE
    
    if not TTS_AVAILABLE or not tts_engine:
        return False
    
    try:
        # Clean text
        text = text.strip()
        if not text:
            return False
        
        # Limit text length
        if len(text) > 500:
            text = text[:497] + "..."
        
        # Generate speech
        tts_engine.save_to_file(text, output_path)
        tts_engine.runAndWait()
        
        # Check if file was created
        return os.path.exists(output_path) and os.path.getsize(output_path) > 0
        
    except Exception as e:
        print(f"TTS generation error: {e}")
        return False

async def generate_speech(text: str) -> Optional[str]:
    """Generate speech from text and return file path"""
    global TTS_AVAILABLE
    
    if not TTS_AVAILABLE:
        print("TTS not available")
        return None
    
    try:
        # Create unique filename
        audio_filename = f"tts_{uuid.uuid4().hex[:8]}.wav"
        audio_path = os.path.join("static", "audio", audio_filename)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(audio_path), exist_ok=True)
        
        # Generate speech in thread pool
        loop = asyncio.get_event_loop()
        success = await loop.run_in_executor(
            executor, 
            _generate_speech_sync, 
            text, 
            audio_path
        )
        
        if success:
            return f"/static/audio/{audio_filename}"
        else:
            return None
            
    except Exception as e:
        print(f"Async TTS error: {e}")
        return None

def cleanup_old_audio_files():
    """Clean up old TTS files"""
    try:
        audio_dir = os.path.join("static", "audio")
        if not os.path.exists(audio_dir):
            return
        
        import time
        current_time = time.time()
        
        for filename in os.listdir(audio_dir):
            if filename.startswith("tts_"):
                file_path = os.path.join(audio_dir, filename)
                if current_time - os.path.getctime(file_path) > 3600:  # 1 hour
                    try:
                        os.remove(file_path)
                    except OSError:
                        pass
    except Exception as e:
        print(f"Cleanup error: {e}")

def get_tts_status():
    """Get TTS status"""
    if TTS_AVAILABLE and tts_engine:
        return {
            "status": "Ready",
            "settings": TTS_SETTINGS,
            "voices": get_available_voices()
        }
    else:
        return {"status": "Not Available"}