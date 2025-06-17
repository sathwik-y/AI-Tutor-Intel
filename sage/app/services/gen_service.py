import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.core.rag import get_relevant_context
from app.core.model import generate_from_model  # Correct function name

# Create a thread pool for CPU-intensive tasks
executor = ThreadPoolExecutor(max_workers=1)

def _generate_response_with_context(query: str) -> str:
    """Generate response using RAG - retrieves PDF context first"""
    
    # Step 1: Retrieve relevant context from uploaded PDFs
    relevant_context = get_relevant_context(query, k=3)  # Reduced k to avoid token overflow
    
    # Step 2: Create simple, general prompts
    if relevant_context and "No knowledge base loaded" not in relevant_context:
        prompt = f"""Context: {relevant_context}

Question: {query}

Answer based on the context provided above. Be accurate and complete in your response."""
    else:
        prompt = f"""Question: {query}

Provide a helpful and accurate answer."""
    
    # Step 3: Generate response using the optimized model
    response = generate_from_model(prompt)
    
    return response

async def generate_llm_response(query: str) -> str:
    """Async wrapper for RAG-based response generation"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _generate_response_with_context, query)
