from fastapi import APIRouter, UploadFile, File
from app.services.audio_service import transcribe_audio, generate_response

router = APIRouter()

@router.post("/query")
async def query_from_audio(file: UploadFile = File(...)):
    transcript = await transcribe_audio(file)
    response = await generate_response(transcript)
    return {
        "transcript": transcript,
        "response": response
    }
