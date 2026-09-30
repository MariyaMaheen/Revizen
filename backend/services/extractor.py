from typing import Tuple
import base64
import httpx
import os
OCR_SPACE_API_KEY = os.environ.get("OCR_SPACE_API_KEY", "")
MAX_OCR_PAGES = 20
def _ocr_page_image(image_bytes: bytes) -> str:
    """Send a page image to OCR.space API and return extracted text."""
    b64 = base64.b64encode(image_bytes).decode()
    payload = {
        "base64Image": f"data:image/png;base64,{b64}",
        "apikey": OCR_SPACE_API_KEY,
        "language": "eng",
        "isOverlayRequired": False,
        "OCREngine": 2,
    }
    try:
        resp = httpx.post("https://api.ocr.space/parse/image", data=payload, timeout=30)
        result = resp.json()
        if result.get("IsErroredOnProcessing"):
            return ""
        parsed = result.get("ParsedResults", [])
        if parsed:
            return parsed[0].get("ParsedText", "")
    except Exception:
        pass
    return ""
def extract_pdf(file_bytes: bytes) -> Tuple[str, int]:
    """Extract text from PDF bytes. Falls back to OCR.space for image-based pages."""
    import fitz
    pages_processed = 0
    text_parts = []
    ocr_pages_used = 0
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page_num, page in enumerate(doc):
            page_text = page.get_text("text")
            if page_text and page_text.strip():
                text_parts.append(page_text.strip())
                pages_processed += 1
            elif ocr_pages_used < MAX_OCR_PAGES:
                # Render page as image and send to OCR.space
                try:
                    pix = page.get_pixmap(dpi=150)
                    img_bytes = pix.tobytes("png")
                    del pix
                    ocr_text = _ocr_page_image(img_bytes)
                    if ocr_text and ocr_text.strip():
                        text_parts.append(ocr_text.strip())
                        pages_processed += 1
                    ocr_pages_used += 1
                except Exception:
                    pass
            page = None
    return "\n\n".join(text_parts), pages_processed
def extract_txt(file_bytes: bytes) -> str:
    """Extract text from TXT file bytes."""
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="replace")
