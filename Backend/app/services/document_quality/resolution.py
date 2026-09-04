"""
Resolution Analyzer for BhoomiVerify AI.
Evaluates pixel dimensions, estimated DPI, and sharpness adequacy for OCR.
"""

from typing import Dict, Any
import numpy as np
from PIL import Image
from pathlib import Path
from .config import quality_config

def analyze_resolution(image_path: Path, img_array: np.ndarray) -> Dict[str, Any]:
    """
    Analyzes document spatial resolution and estimated DPI.
    """
    h, w = img_array.shape[:2]
    
    # Try reading physical DPI from EXIF/metadata
    dpi = 300
    try:
        with Image.open(image_path) as pil_img:
            info_dpi = pil_img.info.get("dpi")
            if info_dpi:
                dpi = int(info_dpi[0])
            else:
                # Estimate based on standard A4 dimensions (8.27 x 11.69 inches)
                est_w_dpi = w / 8.27
                est_h_dpi = h / 11.69
                dpi = int(round((est_w_dpi + est_h_dpi) / 2))
    except Exception:
        dpi = 300

    if dpi >= quality_config.RECOMMENDED_DPI or (w >= 2000 and h >= 2500):
        status = "Good"
        score = 100
    elif dpi >= quality_config.MIN_DPI or (w >= quality_config.MIN_WIDTH and h >= quality_config.MIN_HEIGHT):
        status = "Acceptable"
        score = 75
    else:
        status = "Low"
        score = 40

    return {
        "width": w,
        "height": h,
        "dpi": max(dpi, 72),
        "status": status,
        "score": score,
        "is_sufficient_for_ocr": score >= 70
    }
