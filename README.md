# AI-Tutor-Intel 🚀

A comprehensive AI-powered tutoring system that combines modern web technologies with optimized machine learning models for an enhanced learning experience.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [OpenVINO Optimization](#openvino-optimization)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

AI-Tutor-Intel is a full-stack intelligent tutoring system that leverages cutting-edge AI technologies to provide personalized learning experiences. The project consists of three main components:

- **Frontend**: Modern React-based web application with stunning UI/UX
- **Backend API**: FastAPI-powered REST API with multiple AI services
- **OpenVINO Optimization**: Intel-optimized machine learning models for enhanced performance

## ✨ Features

### 🎨 Frontend Features
- **Modern UI/UX**: Beautiful black hole-themed interface with smooth animations
- **Responsive Design**: Optimized for desktop and mobile devices
- **Interactive Components**: Hover effects, form validation, and dynamic content
- **Authentication System**: Secure signup and login functionality
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
AI-Tutor-Intel/
├── frontend/                 # React web application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   └── public/             # Static assets
├── sage/                    # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration and models
│   │   └── services/       # AI service implementations
│   └── run.py              # Application entry point
└── OpenVino/               # Model optimization tools
    └── OpenVinoQwen.ipynb  # Jupyter notebook for optimization
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form handling and validation
- **Lucide React** - Beautiful icons
- **Zod** - TypeScript-first schema validation

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **PyTorch** - Deep learning framework
- **Transformers** - Hugging Face transformers library
- **OpenCV** - Computer vision library
- **MediaPipe** - Face detection and tracking
- **FAISS** - Vector similarity search
- **PyPDF2** - PDF processing
- **Faster Whisper** - Speech recognition

### AI/ML
- **Intel OpenVINO** - Model optimization toolkit
- **Optimum Intel** - Hugging Face optimization library
- **Sentence Transformers** - Text embeddings
- **Qwen 2.5** - Large language model

## 🚀 Installation

### Prerequisites
- Python 3.8+ (3.13 recommended)
- Node.js 18+
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-Tutor-Intel
   ```

2. **Set up Python environment**
   ```bash
   cd sage
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file in sage/ directory
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the backend server**
   ```bash
   python run.py
   ```
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```
   The frontend will be available at `http://localhost:5173`

## 📖 Usage

### Starting the Application

1. **Start the backend server**
   ```bash
   cd sage
   python run.py
   ```

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser** and navigate to `http://localhost:5173`

### Using the AI Services

The application provides several AI-powered features:

- **Text Chat**: Interact with the AI tutor through text
- **Voice Interaction**: Speak with the AI using speech-to-text
- **Document Analysis**: Upload PDFs for AI-powered analysis
- **Image Recognition**: Upload images for AI analysis
- **Attendance Tracking**: Automated attendance monitoring

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

### Usage

1. **Navigate to OpenVino directory**
   ```bash
   cd OpenVino
   ```

2. **Open the Jupyter notebook**
   ```bash
   jupyter notebook OpenVinoQwen.ipynb
   ```

3. **Follow the optimization process**:
   - Load the original model
   - Benchmark performance
   - Apply OpenVINO optimization
   - Compare results

### Optimized Models

The project uses optimized models available on Hugging Face:
- [ov_llama3.1-8b-int8](https://huggingface.co/minorityhunter/ov_llama3.1-8b-int8)

## 🔧 Configuration

### Backend Configuration

Edit `sage/app/core/config.py` to customize:

```python
MODEL_CONFIG = {
    "model_path": "models/qwen2.5-optimized-int8",
    "max_tokens": 1024,
    "temperature": 0.2,
    # ... other settings
}

RAG_CONFIG = {
    "embedding_model": "all-MiniLM-L6-v2",
    "chunk_size": 512,
    # ... other settings
}
```

### Frontend Configuration

Edit `frontend/vite.config.js` for build settings and `frontend/tailwind.config.js` for styling.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript/React code
- Write comprehensive tests
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Intel OpenVINO** for model optimization tools
- **Hugging Face** for transformer models and libraries
- **FastAPI** for the excellent web framework
- **React** and **Vite** for the frontend ecosystem

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in each component directory
- Review the API documentation at `http://localhost:8000/docs`

---

**Made with ❤️ for the AI education community** 