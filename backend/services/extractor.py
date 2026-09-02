from typing import Tuple
import tempfile
import os


def extract_pdf(file_bytes: bytes) -> Tuple[str, int]:
    """Extract text from PDF bytes using PyMuPDF. Returns (text, pages_processed)."""
    import fitz  # PyMuPDF
    pages_processed = 0
    text_parts = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            page_text = page.get_text("text")
            if page_text and page_text.strip():
                text_parts.append(page_text)
                pages_processed += 1
            page = None  # free memory per page
    return "\n\n".join(text_parts), pages_processed


def extract_txt(file_bytes: bytes) -> str:
    """Extract text from TXT file bytes."""
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="replace")
