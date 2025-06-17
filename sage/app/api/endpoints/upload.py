from fastapi import APIRouter, UploadFile, File
import os
from app.services.pdf_service import process_pdf_and_build_index

router = APIRouter()

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    # Save file to disk
    file_location = os.path.join("data", file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())

    # Process it for RAG
    process_pdf_and_build_index(file_location)

    return {"status": "PDF uploaded and indexed", "filename": file.filename}
