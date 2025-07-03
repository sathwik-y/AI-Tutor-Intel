# app/services/vision_service.py
import os
import tempfile
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional
from PIL import Image
import io

# Try to import vision models
try:
    from transformers import BlipProcessor, BlipForConditionalGeneration
    import torch
    VISION_AVAILABLE = True
    print("✅ Vision AI dependencies available")
except ImportError:
    VISION_AVAILABLE = False
    print("❌ Vision AI not available - install transformers and torch")

# Global variables for model
vision_processor = None
vision_model = None
executor = ThreadPoolExecutor(max_workers=1)

def initialize_vision():
    """Initialize vision model on startup"""
    global vision_processor, vision_model, VISION_AVAILABLE
    
    if not VISION_AVAILABLE:
        return False
    
    try:
        print("🔄 Loading BLIP vision model...")
        
        # Load BLIP model for image captioning and VQA
        model_name = "Salesforce/blip-image-captioning-base"
        vision_processor = BlipProcessor.from_pretrained(model_name)
        vision_model = BlipForConditionalGeneration.from_pretrained(model_name)
        
        # Move to CPU (you can change to GPU if available)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        vision_model.to(device)
        
        print(f"✅ Vision model loaded successfully on {device}")
        return True
        
    except Exception as e:
        print(f"❌ Vision model initialization failed: {e}")
        VISION_AVAILABLE = False
        return False

def _analyze_image_sync(image_data: bytes, query: str) -> str:
    """Synchronous image analysis"""
    global vision_processor, vision_model, VISION_AVAILABLE
    
    if not VISION_AVAILABLE or not vision_model:
        return "Vision AI not available. Please install required dependencies."
    
    try:
        # Open image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large (for performance)
        if image.width > 512 or image.height > 512:
            image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        
        # Check if query is asking for specific analysis
        query_lower = query.lower()
        
        if any(word in query_lower for word in ['caption', 'describe', 'what is', 'what are', 'what do you see']):
            # Generate image caption
            inputs = vision_processor(image, return_tensors="pt")
            out = vision_model.generate(**inputs, max_length=100, num_beams=5)
            caption = vision_processor.decode(out[0], skip_special_tokens=True)
            
            return f"I can see: {caption}. This appears to be an image showing {caption.lower()}."
            
        else:
            # Answer specific question about the image
            inputs = vision_processor(image, query, return_tensors="pt")
            out = vision_model.generate(**inputs, max_length=150, num_beams=5)
            answer = vision_processor.decode(out[0], skip_special_tokens=True)
            
            # Clean up the answer
            if answer.startswith(query):
                answer = answer[len(query):].strip()
            
            return answer if answer else "I can see the image but cannot provide a specific answer to that question."
        
    except Exception as e:
        print(f"Vision analysis error: {e}")
        return f"Error analyzing image: {str(e)}"

async def analyze_image_with_vision(image_data: bytes, query: str) -> str:
    """Async wrapper for image analysis"""
    if not VISION_AVAILABLE:
        return "Vision AI not available. Install transformers and torch to enable image understanding."
    
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor,
            _analyze_image_sync,
            image_data,
            query
        )
        return result
        
    except Exception as e:
        return f"Vision analysis failed: {str(e)}"

def get_vision_status():
    """Get vision AI status"""
    return {
        "available": VISION_AVAILABLE,
        "model_loaded": vision_model is not None,
        "message": "Vision AI ready" if VISION_AVAILABLE and vision_model else "Vision AI not available"
    }