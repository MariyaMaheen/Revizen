from typing import Tuple


def extract_pdf(file_bytes: bytes) -> Tuple[str, int]:
    """Extract text from PDF bytes using PyMuPDF with OCR fallback for image-based PDFs."""
    import fitz
    pages_processed = 0
    text_parts = []

    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            page_text = page.get_text("text")
            if page_text and page_text.strip():
                text_parts.append(page_text)
                pages_processed += 1
            else:
                # OCR fallback for image-based pages
                try:
                    import pytesseract
                    from PIL import Image
                    import io
                    pix = page.get_pixmap(dpi=200)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    ocr_text = pytesseract.image_to_string(img)
                    if ocr_text and ocr_text.strip():
                        text_parts.append(ocr_text)
                        pages_processed += 1
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
