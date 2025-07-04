# Team Spartans - Intel Unnati Industrial Training 
<a href="https://github.com/sathwik-y/AI-Tutor-Intel/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=sathwik-y/AI-Tutor-Intel" />
</a>


# Sage Smart AI Guided for Education 🚀
As part of our Intel Unnati Training Program we built a comprehensive AI-powered tutoring system that combines modern web technologies with optimized machine learning models for an enhanced learning experience.

## 🎯 Overview

Sage is a full-stack intelligent tutoring system that leverages cutting-edge AI technologies to provide personalized learning experiences. The project consists of three main components:

- **Frontend**: Modern React-based web application with stunning UI/UX
- **Backend API**: FastAPI-powered REST API with multiple AI services
- **OpenVINO Optimization**: Intel-optimized machine learning models for enhanced performance

## ✨ Features

### 🎨 Frontend Features
- **Modern UI/UX**: Beautiful black hole-themed interface with smooth animations
- **Responsive Design**: Optimized for desktop and mobile devices
- **Interactive Components**: Hover effects, form validation, and dynamic content
- **Real-time Updates**: Live interaction with AI services

### 🤖 Backend AI Services
- **Text Generation**: Advanced language model responses
- **Audio Processing**: Speech-to-text and text-to-speech capabilities
- **Computer Vision**: Image analysis and face detection
- **Document Processing**: PDF parsing and text extraction
- **Attendance Tracking**: Automated attendance monitoring
- **RAG (Retrieval-Augmented Generation)**: Enhanced context-aware responses

### ⚡ Performance Optimizations
- **Intel OpenVINO**: Optimized model inference for CPU-based systems
- **Model Quantization**: INT8 quantization for reduced memory usage
- **Efficient Processing**: Optimized pipelines for real-time responses

## 🏗️ Architecture

```
Sage/
├── sage-frontend/           # React web application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   └── public/             # Static assets
├── sage-backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration and models
│   │   └── services/       # AI service implementations
│   └── run.py              # Application entry point
├── models/                 # AI models directory
│   └── [Qwen model folder]
├── OpenVino/               # Model optimization tools
│   └── OpenVinoQwen.ipynb  # Jupyter notebook for optimization
└── setup.py               # Automated setup script
```

## 🚀 Quick Start

Run the automated setup script from the root directory:

```bash
python setup.py
```

This will install all dependencies and start both backend and frontend servers automatically.

## 📋 Prerequisites

Before running the setup script, ensure you have the following installed:

### 1. Python 3.8+
Download from [python.org](https://www.python.org/downloads/)

### 2. Node.js 16+
Download from [nodejs.org](https://nodejs.org/)

### 3. FFmpeg
- Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- **Important**: Note the installation path, you'll need to specify it in the code
- Example paths:
  - Windows: `C:\ffmpeg\bin\ffmpeg.exe`
  - macOS: `/usr/local/bin/ffmpeg`
  - Linux: `/usr/bin/ffmpeg`

### 4. Tesseract OCR
- **Windows**: Download from [GitHub releases](https://github.com/UB-Mannheim/tesseract/wiki)
- **macOS**: `brew install tesseract`
- **Linux**: `sudo apt-get install tesseract-ocr`
- Add Tesseract to your system PATH

### 5. Qwen Model
1. Create a `models` folder in the root directory (same level as sage-backend and sage-frontend):
   ```bash
   mkdir models
   ```
2. Download the Qwen model from [Hugging Face](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct)
3. Place the model folder inside `models/`
Note: All the files present in the HF link about should be inside `models/qwen-2.5-optimized-int8/` folder
 
## 🛠️ Manual Setup (Alternative)

If you prefer manual setup:

### Backend Setup
```bash
cd sage-backend
pip install -r requirements.txt
python run.py
```

### Frontend Setup
```bash
cd sage-frontend
npm install
npm run dev
```

## 🎯 Usage

1. **Start the Application**:
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000

2. **Upload Documents**:
   - Support for PDF, images, and audio files
   - Drag and drop or click to upload

3. **Ask Questions**:
   - Use natural language to query your documents
   - Get AI-powered answers with context

4. **Features**:
   - OCR for text extraction from images/PDFs
   - Audio transcription using Faster-Whisper
   - AI-powered question answering with Qwen model
   - Real-time processing and responses

## 🔧 Configuration

### FFmpeg Path Configuration
**Important**: You must specify the FFmpeg path in the code before running the application.

Edit `sage-backend/app/services/audio_service.py` and update the FFmpeg path:

```python
# Find this line in audio_service.py and update it with your FFmpeg path:
ffmpeg_path = r"C:\path\to\your\ffmpeg.exe"  # Windows example
# or
ffmpeg_path = "/usr/local/bin/ffmpeg"  # macOS/Linux example
```

### Model Path
Ensure the Qwen model is placed in the `models` folder and the model files as downloaded from Hugging Face are in the folder `qwen-2.5-optimized-int8` inside the `models` folder.

## 🐛 Troubleshooting

### Common Issues

1. **FFmpeg not found**:
   - Ensure FFmpeg is installed
   - Update the `ffmpeg_path` variable in `sage-backend/app/services/audio_service.py` with the correct path

2. **Tesseract not found**:
   - Install Tesseract OCR
   - Add to system PATH

3. **Model loading errors**:
   - Verify the Qwen model is in the `models` folder
   - Check model folder structure matches Hugging Face format

4. **Port conflicts**:
   - Backend runs on port 8000
   - Frontend runs on port 3000
   - Ensure these ports are available

5. **Setup script not found**:
   - Ensure you're running `python setup.py` from the root directory (same level as sage-backend and sage-frontend folders)

### Performance Tips

- Use GPU acceleration if available (update model configuration)
- For large documents, processing may take time
- Ensure sufficient RAM for model loading

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **PyTorch** - Deep learning framework
- **Transformers** - Hugging Face transformers library
- **OpenCV** - Computer vision library
- **FAISS** - Vector similarity search
- **PyPDF2** - PDF processing
- **Faster Whisper** - Speech recognition

### AI/ML
- **Intel OpenVINO** - Model optimization toolkit
- **Optimum Intel** - Hugging Face optimization library
- **Sentence Transformers** - Text embeddings
- **Qwen 2.5** - Large language model

## 🔌 API Documentation

### Core Endpoints

- `POST /api/text/generate` - Text generation
- `POST /api/audio/transcribe` - Speech-to-text
- `POST /api/tts/generate` - Text-to-speech
- `POST /api/image/analyze` - Image analysis
- `POST /api/upload/process` - Document processing
- `POST /api/attendance/detect` - Attendance detection

### Example API Usage

```python
import requests

# Text generation
response = requests.post("http://localhost:8000/api/text/generate", 
    json={"prompt": "Explain quantum physics"})

# Audio transcription
with open("audio.wav", "rb") as f:
    response = requests.post("http://localhost:8000/api/audio/transcribe", 
        files={"file": f})
```

## ⚡ OpenVINO Optimization

The project includes Intel OpenVINO optimization for enhanced performance:

### Benefits
- **50-55% reduction** in model size
- **4-5% improvement** in inference latency
- **CPU-optimized** inference without specialized hardware
