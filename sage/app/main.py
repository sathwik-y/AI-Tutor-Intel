# app/main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import audio, text, image, upload, tts, attendance
from contextlib import asynccontextmanager
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    print("🚀 SAGE - Smart Classroom Assistant Starting...")
    
    # Create necessary directories
    os.makedirs("static/audio", exist_ok=True)
    os.makedirs("static/attendance", exist_ok=True)
    os.makedirs("static/exports", exist_ok=True)
    os.makedirs("data", exist_ok=True)
    
    # Initialize TTS service
    from app.services.tts_service import initialize_tts
    initialize_tts()
    
    print("✅ All services initialized successfully")
    
    yield
    
    # Cleanup on shutdown
    print("🛑 SAGE shutting down...")

app = FastAPI(
    title="SAGE - Smart Classroom Assistant", 
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(audio.router, tags=["Audio"])  # Remove prefix for WebSocket
app.include_router(text.router, prefix="/api", tags=["Text"])
app.include_router(image.router, prefix="/api", tags=["Image"])
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(tts.router, prefix="/api", tags=["Text-to-Speech"])
app.include_router(attendance.router, prefix="/api", tags=["Attendance"])

@app.get("/")
def root():
    return {
        "status": "🔥 SAGE API is live",
        "version": "1.0.0",
        "features": [
            "Speech-to-Text (STT)",
            "Text-to-Speech (TTS)", 
            "Multimodal Query (Text/Audio/Image)",
            "RAG System (PDF Knowledge Base)",
            "Attendance/Headcount Detection"
        ]
    }

@app.get("/client")
async def get_client():
    """Serve the client HTML page"""
    return FileResponse("client.html")

@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "SAGE is running smoothly"}