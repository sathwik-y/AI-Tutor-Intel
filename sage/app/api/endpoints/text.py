from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gen_service import generate_llm_response
from app.services.utils import maybe_generate_visual

router = APIRouter()

class QueryRequest(BaseModel):
    query: str

class QueryResponse(BaseModel):
    query: str
    answer: str
    visual: str | None = None

@router.post("/query/text", response_model=QueryResponse)
async def query_text(request: QueryRequest):
    answer = await generate_llm_response(request.query)
    visual = maybe_generate_visual(answer)
    
    return QueryResponse(
        query=request.query,
        answer=answer,
        visual=visual
    )
