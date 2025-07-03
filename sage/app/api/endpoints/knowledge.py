from fastapi import APIRouter
from typing import List
from app.core.rag import get_indexed_pdf_names

router = APIRouter()

@router.get("/knowledge/pdfs", response_model=List[str])
async def get_pdfs():
    return get_indexed_pdf_names()