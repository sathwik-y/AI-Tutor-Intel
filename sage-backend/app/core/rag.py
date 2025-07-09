import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import os
import pickle

embedder = SentenceTransformer("all-MiniLM-L6-v2")

# File paths for persistence
KB_DIR = "knowledge_base"
FAISS_INDEX_PATH = os.path.join(KB_DIR, "faiss.index")
TEXTS_PATH = os.path.join(KB_DIR, "texts.pkl")
PDF_NAMES_PATH = os.path.join(KB_DIR, "pdf_names.pkl")

texts = []
index = None
indexed_pdf_names = []

def save_knowledge_base():
    os.makedirs(KB_DIR, exist_ok=True)
    if index is not None:
        faiss.write_index(index, FAISS_INDEX_PATH)
    with open(TEXTS_PATH, "wb") as f:
        pickle.dump(texts, f)
    with open(PDF_NAMES_PATH, "wb") as f:
        pickle.dump(indexed_pdf_names, f)
    print("Knowledge base saved.")

def load_knowledge_base():
    global texts, index, indexed_pdf_names
    if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(TEXTS_PATH) and os.path.exists(PDF_NAMES_PATH):
        try:
            index = faiss.read_index(FAISS_INDEX_PATH)
            with open(TEXTS_PATH, "rb") as f:
                texts = pickle.load(f)
            with open(PDF_NAMES_PATH, "rb") as f:
                indexed_pdf_names = pickle.load(f)
            print("Knowledge base loaded.")
        except Exception as e:
            print(f"Error loading knowledge base: {e}")
            texts = []
            index = None
            indexed_pdf_names = []
    else:
        print("No existing knowledge base found.")

def build_index_from_chunks(chunks: list[str], pdf_name: str):
    global texts, index, indexed_pdf_names

    # Append new chunks and update PDF names
    texts.extend(chunks)
    if pdf_name not in indexed_pdf_names:
        indexed_pdf_names.append(pdf_name)

    vectors = np.array(embedder.encode(texts)).astype("float32")

    index = faiss.IndexFlatL2(vectors.shape[1])
    index.add(vectors)
    save_knowledge_base() # Save after building/updating index

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
    score_threshold = 5.0  # Increased threshold to be more lenient
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

def get_indexed_pdf_names() -> list[str]:
    return indexed_pdf_names

def clear_knowledge_base_on_startup():
    """Clear knowledge base files and in-memory data when application starts"""
    global texts, index, indexed_pdf_names
    
    # Clear in-memory data first
    texts = []
    index = None
    indexed_pdf_names = []
    
    # Clear persisted files
    try:
        if os.path.exists(FAISS_INDEX_PATH):
            os.remove(FAISS_INDEX_PATH)
            print(f"Removed {FAISS_INDEX_PATH}")
        if os.path.exists(TEXTS_PATH):
            os.remove(TEXTS_PATH)
            print(f"Removed {TEXTS_PATH}")
        if os.path.exists(PDF_NAMES_PATH):
            os.remove(PDF_NAMES_PATH)
            print(f"Removed {PDF_NAMES_PATH}")
        print("Knowledge base completely cleared - both memory and files")
    except Exception as e:
        print(f"Error clearing knowledge base on startup: {e}")

# Initialize module variables - will be properly loaded after startup clearing
# load_knowledge_base()  # Don't auto-load on import