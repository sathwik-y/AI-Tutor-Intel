from fastapi import APIRouter
from typing import List
from app.core.rag import get_indexed_pdf_names, clear_knowledge_base_on_startup

router = APIRouter()

@router.get("/knowledge/pdfs", response_model=List[str])
async def get_pdfs():
    return get_indexed_pdf_names()

@router.post("/knowledge/clear")
async def clear_knowledge_base():
    """Clear the entire knowledge base"""
    clear_knowledge_base_on_startup()
    return {"message": "Knowledge base cleared successfully"}