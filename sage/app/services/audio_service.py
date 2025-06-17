import tempfile
import os
from faster_whisper import WhisperModel
from app.core.model import generate_from_model
from app.core.rag import query_with_context

model_whisper = WhisperModel("base", device="cpu", compute_type="int8")

async def transcribe_audio(file):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        contents = await file.read()
        tmp.write(contents)
        tmp_path = tmp.name

    segments, info = model_whisper.transcribe(tmp_path)
    transcript = " ".join([segment.text for segment in segments])
    os.remove(tmp_path)
    return transcript

async def generate_response(prompt: str):
    context = query_with_context(prompt)
    full_prompt = f"Context:\n{context}\n\nQuestion:\n{prompt}\n\nAnswer:"
    return generate_from_model(full_prompt)
