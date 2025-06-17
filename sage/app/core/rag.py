import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("all-MiniLM-L6-v2")

texts = []
index = None

def build_index_from_chunks(chunks: list[str]):
    global texts, index

    texts = chunks
    vectors = np.array(embedder.encode(texts)).astype("float32")

    index = faiss.IndexFlatL2(vectors.shape[1])
    index.add(vectors)

def query_with_context(query: str, k: int = 3):
    if index is None:
        return "No knowledge base loaded. Upload a PDF first."

    q_vec = embedder.encode([query])[0].astype("float32")
    D, I = index.search(np.array([q_vec]), k=k)
    return " ".join([texts[i] for i in I[0]])

def get_relevant_context(query: str, k: int = 3) -> str:
    """Get relevant context from vector database with improved filtering"""
    if index is None:
        return "No knowledge base loaded. Upload a PDF first."

    q_vec = embedder.encode([query])[0].astype("float32")
    D, I = index.search(np.array([q_vec]), k=k)
    
    # Debug: Print what we're retrieving
    print(f"Query: {query}")
    print(f"Top {k} scores: {D[0]}")
    
    # Filter results by relevance score threshold
    score_threshold = 1.5  # Adjust based on your data
    results = []
    
    for i, (idx, score) in enumerate(zip(I[0], D[0])):
        if score < score_threshold:  # Lower score = more similar
            chunk = texts[idx].strip()
            if len(chunk) > 50:  # Only include substantial chunks
                results.append(chunk)
                print(f"Chunk {i+1} (score: {score:.2f}): {chunk[:150]}...")
        else:
            print(f"Chunk {i+1} (score: {score:.2f}): FILTERED OUT - too dissimilar")
    
    # Join with clear separators
    context = "\n\n---\n\n".join(results)
    print(f"Final context: {len(results)} chunks, {len(context)} chars")
    
    return context if context else "No relevant context found in documents."
