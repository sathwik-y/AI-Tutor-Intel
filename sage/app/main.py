from fastapi import FastAPI
from app.api.endpoints import audio, text, image
from app.api.endpoints import upload

app = FastAPI()

app.include_router(audio.router)
app.include_router(text.router)
app.include_router(image.router)
app.include_router(upload.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "🔥 API is live"}