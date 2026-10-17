import gc
import os
from typing import Tuple

OCR_SPACE_API_KEY = os.getenv("OCR_SPACE_API_KEY", "")

MAX_OCR_PAGES = 10            # only OCR the first N pages of a scanned PDF
MAX_PAGE_BYTES = 1_000_000    # OCR.space free tier rejects files over ~1MB


def _ocr_single_page(client, page_bytes: bytes) -> str:
    """Send ONE page (as a tiny PDF) to OCR.space. Returns text or ''."""
    try:
        resp = client.post(
            "https://api.ocr.space/parse/image",
            files={"file": ("page.pdf", page_bytes, "application/pdf")},
            data={
                "apikey": OCR_SPACE_API_KEY,
                "language": "eng",
                "isOverlayRequired": "false",
                "OCREngine": "1",
                "scale": "true",
            },
        )
        result = resp.json()
        if result.get("IsErroredOnProcessing"):
            return ""
        parsed = result.get("ParsedResults") or []
        return "\n".join(p.get("ParsedText", "") for p in parsed if p.get("ParsedText"))
    except Exception:
        return ""


def _ocr_pdf_page_by_page(file_bytes: bytes) -> Tuple[str, int]:
    """OCR a scanned PDF one page at a time so memory stays low."""
    import fitz
    import httpx

    if not OCR_SPACE_API_KEY:
        return "", 0

    texts = []
    pages_done = 0

    with httpx.Client(timeout=60) as client, fitz.open(stream=file_bytes, filetype="pdf") as doc:
        limit = min(len(doc), MAX_OCR_PAGES)
        for i in range(limit):
            single = fitz.open()
            single.insert_pdf(doc, from_page=i, to_page=i)
            page_bytes = single.tobytes(garbage=4, deflate=True)
            single.close()

            if len(page_bytes) <= MAX_PAGE_BYTES:
                text = _ocr_single_page(client, page_bytes)
                if text.strip():
                    texts.append(text.strip())
                    pages_done += 1

            del page_bytes
            gc.collect()

    return "\n\n".join(texts), pages_done


def extract_pdf(file_bytes: bytes) -> Tuple[str, int]:
    """Extract text with PyMuPDF; if the PDF has no text layer, OCR page by page."""
    import fitz

    pages_processed = 0
    text_parts = []

    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            page_text = page.get_text("text")
            if page_text and page_text.strip():
                text_parts.append(page_text.strip())
                pages_processed += 1

    if not text_parts:
        ocr_text, pages_processed = _ocr_pdf_page_by_page(file_bytes)
        if ocr_text.strip():
            text_parts = [ocr_text]

    return "\n\n".join(text_parts), pages_processed


def extract_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="replace")
