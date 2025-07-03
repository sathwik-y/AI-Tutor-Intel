# app/api/endpoints/image.py
from fastapi import APIRouter, UploadFile, HTTPException, Form
import pytesseract
from PIL import Image
from app.core.rag import build_index_from_chunks, texts, index
from app.services.gen_service import generate_llm_response
from app.services.utils import maybe_generate_visual
from app.services.vision_service import analyze_image_with_vision
from app.services.analytics_service import record_query
import io

router = APIRouter()

# Store for image texts to avoid overwriting PDF data
image_texts = []

@router.post("/upload-image")
async def upload_image(file: UploadFile):
    """Extract text from image and add to knowledge base (OCR ONLY - unchanged)"""
    try:
        # Read and process the uploaded image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Extract text using OCR
        extracted_text = pytesseract.image_to_string(image, config='--psm 6')
        
        if not extracted_text.strip():
            return {
                "message": "No text could be extracted from this image.",
                "extracted_text": "",
                "chunks_added": 0
            }
        
        # Split into chunks and add to existing knowledge base
        global image_texts
        new_chunks = [chunk.strip() for chunk in extracted_text.split('\n') if chunk.strip() and len(chunk.strip()) > 20]
        
        if new_chunks:
            # Add to existing texts instead of replacing
            all_texts = texts + new_chunks
            build_index_from_chunks(all_texts)
            image_texts.extend(new_chunks)
        
        return {
            "message": f"Successfully extracted and indexed text from image. Added {len(new_chunks)} chunks to knowledge base.",
            "extracted_text": extracted_text.strip(),
            "chunks_added": len(new_chunks)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.post("/query/image")
async def query_image_direct(file: UploadFile, query: str = Form("What information can you extract from this image?")):
    record_query("image")
    """Query image using BOTH OCR and Vision AI (VISION PRIORITIZED)"""
    try:
        # Read and process the uploaded image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # 1. Analyze image using Vision AI FIRST
        vision_analysis = await analyze_image_with_vision(image_bytes, query)
        
        # 2. Extract text using OCR
        extracted_text = pytesseract.image_to_string(image, config='--psm 6')
        
        # 3. Create smart prompt that prioritizes vision
        if extracted_text.strip() and len(extracted_text.strip()) > 10:
            # Has meaningful text
            prompt = f"""You are analyzing an image that contains both visual content and text.

VISUAL ANALYSIS: {vision_analysis}

TEXT CONTENT: {extracted_text.strip()}

USER QUESTION: {query}

INSTRUCTIONS:
- The visual analysis tells you what's actually in the image
- Use the visual analysis as your primary source of information
- Only mention text content if it's relevant to the user's question
- Give a natural, helpful response based on what you can see

RESPONSE:"""
        else:
            # No meaningful text, focus on vision
            prompt = f"""You are analyzing an image for a user.

VISUAL ANALYSIS: {vision_analysis}

USER QUESTION: {query}

INSTRUCTIONS:
- Provide a helpful response based on the visual content
- Be natural and conversational
- Focus on what's actually visible in the image

RESPONSE:"""
        
        # Generate response using the model
        from app.core.model import generate_from_model
        answer = generate_from_model(prompt)
        visual = maybe_generate_visual(answer)

        return {
            "extracted_text": extracted_text.strip(),
            "vision_analysis": vision_analysis,
            "answer": answer,
            "visual": visual
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")