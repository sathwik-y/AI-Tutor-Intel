# Model configuration - general purpose settings
MODEL_CONFIG = {
    "model_path": "models/qwen2.5-optimized-int8", 
    "max_tokens": 1024,
    "max_new_tokens": 400,
    "temperature": 0.2,
    "top_p": 0.9,
    "top_k": 50,
    "repetition_penalty": 1.05
}

# RAG configuration
RAG_CONFIG = {
    "embedding_model": "all-MiniLM-L6-v2",
    "chunk_size": 512,
    "chunk_overlap": 50,
    "retrieval_k": 3,
    "score_threshold": 1.5,
    "min_chunk_length": 50
}

# API configuration
API_CONFIG = {
    "max_workers": 1,
    "timeout": 30
}