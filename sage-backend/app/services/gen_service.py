import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.core.rag import get_relevant_context
from app.core.model import generate_from_model  

# Create a thread pool for CPU-intensive tasks
executor = ThreadPoolExecutor(max_workers=1)

def _generate_response_with_context(query: str, history: list[dict]) -> str:
    """Generate response using RAG - retrieves PDF context first"""
    
    # Step 1: Only retrieve context for educational/academic queries
    educational_keywords = ["explain", "what is", "how does", "define", "algorithm", "learning", "agent", "search", "heuristic", "ai", "artificial intelligence", "machine learning", "neural", "optimization", "problem solving", "knowledge", "reasoning", "logic", "probability", "statistics", "data", "model", "training", "prediction", "classification", "clustering", "regression", "supervised", "unsupervised", "reinforcement"]
    
    query_lower = query.lower()
    is_educational_query = any(keyword in query_lower for keyword in educational_keywords) or len(query.split()) > 3
    
    if is_educational_query:
        relevant_context = get_relevant_context(query, k=3)
    else:
        relevant_context = "No knowledge base loaded"  # Skip context for simple queries
    
    # Step 2: Create simple, general prompts
    conversation_history_str = ""
    for turn in history:
        if turn["role"] == "user":
            conversation_history_str += f"User: {turn["content"]}\n"
        elif turn["role"] == "assistant":
            conversation_history_str += f"Assistant: {turn["content"]}\n"

    if relevant_context and "No knowledge base loaded" not in relevant_context:
        prompt = f"""Context: {relevant_context}

{conversation_history_str}Question: {query}

Answer based on the context provided above. Be accurate and complete in your response."""
    else:
        prompt = f"""{conversation_history_str}Question: {query}

Provide a helpful and accurate answer."""
    
    # Step 3: Generate response using the optimized model
    response = generate_from_model(prompt)
    
    return response

async def generate_llm_response(query: str, history: list[dict]) -> str:
    """Async wrapper for RAG-based response generation"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _generate_response_with_context, query, history)
