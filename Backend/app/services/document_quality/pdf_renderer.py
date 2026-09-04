"""
PDF Rendering Service.
Converts multi-page PDF documents to high-resolution images (300 DPI).
Supports pdf2image with PyMuPDF (fitz) seamless fallback for Windows reliability.
"""

from pathlib import Path
from typing import List
import numpy as np
from PIL import Image

def render_pdf_to_images(pdf_path: Path, output_dir: Path, dpi: int = 300) -> List[Path]:
    """
    Renders each page of a PDF document into a high-resolution PNG image.
    Tries pdf2image first; falls back to pymupdf if poppler is not installed.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    generated_images: List[Path] = []
    
    # 1. Try pdf2image
    try:
        from pdf2image import convert_from_path
        images = convert_from_path(str(pdf_path), dpi=dpi)
        for idx, img in enumerate(images):
            out_file = output_dir / f"page_{idx + 1:03d}.png"
            img.save(out_file, "PNG")
            generated_images.append(out_file)
        if generated_images:
            return generated_images
    except Exception as e:
        # Fallback to PyMuPDF (fitz)
        pass

    # 2. PyMuPDF (fitz) fallback - 100% self-contained on Windows
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(str(pdf_path))
        # 300 DPI scaling factor: 300 / 72 = 4.1666667
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)
        
        for idx, page in enumerate(doc):
            pix = page.get_pixmap(matrix=mat, alpha=False)
            out_file = output_dir / f"page_{idx + 1:03d}.png"
            pix.save(str(out_file))
            generated_images.append(out_file)
            
        doc.close()
        return generated_images
    except Exception as err:
        raise RuntimeError(f"Failed to render PDF pages: {str(err)}")
