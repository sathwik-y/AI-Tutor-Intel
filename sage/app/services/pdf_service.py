from PyPDF2 import PdfReader
from app.core.rag import build_index_from_chunks

def extract_text_chunks_from_pdf(path: str):
    reader = PdfReader(path)
    all_text = ""
    
    # Extract all text first
    for page in reader.pages:
        text = page.extract_text()
        if text:
            all_text += text + " "
    
    # Create better chunks (sentences or paragraphs)
    paragraphs = all_text.split('\n\n')
    chunks = []
    
    current_chunk = ""
    for para in paragraphs:
        para = para.strip()
        if len(para) > 20:  # Ignore very short paragraphs
            if len(current_chunk + para) < 800:  # Larger chunk size
                current_chunk += para + " "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + " "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    # Add overlapping chunks to catch information at boundaries
    overlap_chunks = []
    for i in range(len(chunks) - 1):
        overlap = chunks[i][-200:] + " " + chunks[i+1][:200]
        overlap_chunks.append(overlap)
    
    chunks.extend(overlap_chunks)
    return chunks

def process_pdf_and_build_index(pdf_path: str):
    chunks = extract_text_chunks_from_pdf(pdf_path)
    print(f"Extracted {len(chunks)} chunks from PDF")  # Debug info
    build_index_from_chunks(chunks)
