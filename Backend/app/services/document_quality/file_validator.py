"""
File Validation Service for BhoomiVerify AI.
Checks format, magic bytes, and readable headers.
"""

from pathlib import Path
from typing import Tuple

SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp"}
MAGIC_SIGNATURES = {
    b"%PDF-": "pdf",
    b"\x89PNG\r\n\x1a\n": "png",
    b"\xff\xd8\xff": "jpg",
    b"II*\x00": "tiff",
    b"MM\x00*": "tiff",
    b"BM": "bmp",
}

def validate_file(file_path: Path) -> Tuple[bool, str, str]:
    """
    Validates file existence, format, and magic bytes.
    Returns: (is_valid, detected_type, error_message)
    """
    if not file_path.exists():
        return False, "unknown", f"File does not exist: {file_path.name}"
        
    ext = file_path.suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        return False, "unknown", f"Unsupported file extension: {ext}. Allowed: {', '.join(SUPPORTED_EXTENSIONS)}"

    try:
        with open(file_path, "rb") as f:
            header = f.read(16)
            
        detected_type = "unknown"
        for sig, ftype in MAGIC_SIGNATURES.items():
            if header.startswith(sig):
                detected_type = ftype
                break
                
        if detected_type == "unknown":
            # Fallback for extensions
            if ext == ".pdf":
                detected_type = "pdf"
            elif ext in {".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp"}:
                detected_type = "image"
            else:
                return False, "unknown", "Corrupted or invalid file header signature"
                
        return True, detected_type, ""
    except Exception as e:
        return False, "unknown", f"Failed to read file header: {str(e)}"
