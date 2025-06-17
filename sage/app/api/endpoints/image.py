from fastapi import APIRouter, UploadFile, HTTPException, Form
import pytesseract
from PIL import Image
from app.core.rag import build_index_from_chunks, texts, index
from app.services.gen_service import generate_llm_response
from app.services.utils import maybe_generate_visual
import io
# import os
# import platform

# # Configure tesseract path for Windows
# if platform.system() == "Windows":
#     # Try common Windows installation paths
#     possible_paths = [
#         r"C:\Program Files\Tesseract-OCR\tesseract.exe",
#         r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
#         r"C:\Users\{}\AppData\Local\Tesseract-OCR\tesseract.exe".format(os.getenv('USERNAME', '')),
#     ]
    
#     for path in possible_paths:
#         if os.path.exists(path):
#             pytesseract.pytesseract.tesseract_cmd = path
#             break

router = APIRouter()

# Store for image texts to avoid overwriting PDF data
image_texts = []

@router.post("/upload-image")
async def upload_image(file: UploadFile):
    """Extract text from image and add to knowledge base"""
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
    """One-shot: Upload image and query it directly without adding to knowledge base"""
    try:
        # Read and process the uploaded image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Extract text using OCR
        extracted_text = pytesseract.image_to_string(image, config='--psm 6')
        
        if not extracted_text.strip():
            return {
                "extracted_text": "",
                "answer": "No text could be extracted from this image.",
                "visual": None
            }
        
        # Create an intelligent contextual prompt for better responses
        prompt = f"""You are an intelligent AI assistant analyzing text extracted from an image using OCR. Your task is to provide comprehensive, well-structured, and insightful responses based on the extracted content.

EXTRACTED TEXT FROM IMAGE:
{extracted_text}

USER QUERY: {query}

INSTRUCTIONS:
- Analyze the extracted text thoroughly and provide a detailed, intelligent response
- Structure your answer clearly with proper formatting when appropriate
- If the user asks for "exact content" or "without data loss", provide the complete extracted text organized clearly
- Explain concepts, provide context, and elaborate on important points
- Use your knowledge to enhance the response beyond just the raw text
- Be comprehensive and thoughtful in your analysis
- Format lists, sections, and key points clearly
- Provide insights and connections between different parts of the content

RESPONSE:"""
        
        # Generate direct response using the model (not RAG)
        from app.core.model import generate_from_model
        answer = generate_from_model(prompt)
        visual = maybe_generate_visual(answer)

        return {
            "extracted_text": extracted_text.strip(),
            "answer": answer,
            "visual": visual
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
