# app/api/endpoints/tts.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os

# Import TTS service
try:
    from app.services.tts_service import (
        generate_speech, 
        cleanup_old_audio_files, 
        get_tts_status,
        update_tts_settings,
        get_available_voices
    )
except ImportError as e:
    print(f"TTS service import error: {e}")
    # Create dummy functions
    async def generate_speech(text: str) -> Optional[str]:
        return None
    def cleanup_old_audio_files():
        pass
    def get_tts_status():
        return {"status": "TTS Service Not Available"}
    def update_tts_settings(**kwargs):
        return False
    def get_available_voices():
        return []

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    cleanup: bool = True

class TTSResponse(BaseModel):
    audio_url: str
    text: str
    message: str

@router.post("/tts/generate", response_model=TTSResponse)
async def generate_text_to_speech(request: TTSRequest):
    """Generate speech from text"""
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if len(request.text) > 1000:
            raise HTTPException(status_code=400, detail="Text too long (max 1000 characters)")
        
        # Clean up old files if requested
        if request.cleanup:
            cleanup_old_audio_files()
        
        # Generate speech
        audio_url = await generate_speech(request.text)
        
        if audio_url is None:
            raise HTTPException(status_code=500, detail="Failed to generate speech - TTS may not be available")
        
        return TTSResponse(
            audio_url=audio_url,
            text=request.text,
            message="Speech generated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

class TTSSettingsRequest(BaseModel):
    rate: Optional[int] = None          # 50-400 (words per minute)
    volume: Optional[float] = None      # 0.0-1.0
    voice_index: Optional[int] = None   # Voice selection

@router.get("/tts/status")
async def get_tts_status_endpoint():
    """Get TTS service status and available voices"""
    return get_tts_status()

@router.post("/tts/settings")
async def update_tts_settings_endpoint(settings: TTSSettingsRequest):
    """Update TTS voice and speed settings"""
    try:
        success = update_tts_settings(
            rate=settings.rate,
            volume=settings.volume,
            voice_index=settings.voice_index
        )
        
        if success:
            return {
                "message": "TTS settings updated successfully",
                "current_settings": get_tts_status()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update TTS settings")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Settings error: {str(e)}")

@router.get("/tts/voices")
async def get_voices():
    """Get list of available voices"""
    return {"voices": get_available_voices()}

@router.get("/tts/audio/{filename}")
async def get_audio_file(filename: str):
    """Serve generated audio files"""
    audio_path = os.path.join("static", "audio", filename)
    
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    
    return FileResponse(
        audio_path,
        media_type="audio/wav",
        filename=filename
    )

@router.delete("/tts/cleanup")
async def cleanup_audio_files():
    """Manually trigger cleanup of old audio files"""
    try:
        cleanup_old_audio_files()
        return {"message": "Audio files cleaned up successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup error: {str(e)}")