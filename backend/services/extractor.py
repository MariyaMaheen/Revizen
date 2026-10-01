from typing import Tuple


OCR_SPACE_API_KEY = "K85164985288957"


def _ocr_pdf_bytes(file_bytes: bytes) -> str:
    """Send entire PDF to OCR.space file upload endpoint."""
    import httpx
    try:
        resp = httpx.post(
            "https://api.ocr.space/parse/image",
            files={"file": ("document.pdf", file_bytes, "application/pdf")},
            data={
                "apikey": OCR_SPACE_API_KEY,
                "language": "eng",
                "isOverlayRequired": False,
                "OCREngine": 1,
                "scale": True,
            },
            timeout=60,
        )
        result = resp.json()
        if result.get("IsErroredOnProcessing"):
            return ""
        parsed = result.get("ParsedResults", [])
        return "\n\n".join(p.get("ParsedText", "") for p in parsed if p.get("ParsedText"))
    except Exception:
        return ""


def extract_pdf(file_bytes: bytes) -> Tuple[str, int]:
    """Extract text from PDF. Uses PyMuPDF first, falls back to OCR.space API."""
    import fitz
    pages_processed = 0
    text_parts = []

    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        total_pages = len(doc)
        for page in doc:
            page_text = page.get_text("text")
            if page_text and page_text.strip():
                text_parts.append(page_text.strip())
                pages_processed += 1
            page = None

    if not text_parts:
        # Scanned PDF — send to OCR.space directly (no image rendering in memory)
        ocr_text = _ocr_pdf_bytes(file_bytes)
        if ocr_text and ocr_text.strip():
            text_parts = [ocr_text]
            pages_processed = 1

    return "\n\n".join(text_parts), pages_processed


def extract_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="replace")
