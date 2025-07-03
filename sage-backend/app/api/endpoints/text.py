from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gen_service import generate_llm_response
from app.services.utils import maybe_generate_visual
from app.services.analytics_service import record_query

router = APIRouter()

from typing import List, Dict

class QueryRequest(BaseModel):
    query: str
    history: List[Dict[str, str]] = []

class QueryResponse(BaseModel):
    query: str
    answer: str
    visual: str | None = None

@router.post("/query/text", response_model=QueryResponse)
async def query_text(request: QueryRequest):
    record_query("text")
    answer = await generate_llm_response(request.query, request.history)
    visual = maybe_generate_visual(answer)
    
    return QueryResponse(
        query=request.query,
        answer=answer,
        visual=visual
    )
