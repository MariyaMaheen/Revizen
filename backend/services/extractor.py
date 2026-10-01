from typing import Tuple
import base64


OCR_SPACE_API_KEY = "K85164985288957"
MAX_OCR_PAGES = 15


def _ocr_page_image(image_bytes: bytes) -> str:
    import httpx
    b64 = base64.b64encode(image_bytes).decode()
    payload = {
        "base64Image": f"data:image/png;base64,{b64}",
        "apikey": OCR_SPACE_API_KEY,
        "language": "eng",
        "isOverlayRequired": False,
        "OCREngine": 1,
    }
    try:
        resp = httpx.post("https://api.ocr.space/parse/image", data=payload, timeout=15)
        result = resp.json()
        if result.get("IsErroredOnProcessing"):
            return ""
        parsed = result.get("ParsedResults", [])
        if parsed:
            return parsed[0].get("ParsedText", "")
    except Exception:
        return ""
    return ""


def extract_pdf(file_bytes: bytes) -> Tuple[str, int]:
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
                try:
                    pix = page.get_pixmap(dpi=120)
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

    if not text_parts:
        raise ValueError("No text could be extracted. The PDF may be image-based with no readable content.")

    return "\n\n".join(text_parts), pages_processed


def extract_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        return file_bytes.decode("latin-1", errors="replace")
