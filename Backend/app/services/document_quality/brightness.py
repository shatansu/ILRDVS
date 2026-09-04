"""
Brightness Analyzer for BhoomiVerify AI.
Evaluates mean illumination and exposure levels across document pages.
"""

from typing import Dict, Any
import numpy as np
from .config import quality_config

def analyze_brightness(gray_img: np.ndarray) -> Dict[str, Any]:
    """
    Measures average luminance of the document.
    """
    mean_val = float(np.mean(gray_img))

    if mean_val < quality_config.BRIGHTNESS_MIN_NORMAL:
        status = "Too Dark"
        score = max(int((mean_val / quality_config.BRIGHTNESS_MIN_NORMAL) * 70), 30)
        needs_correction = True
    elif mean_val > quality_config.BRIGHTNESS_MAX_NORMAL:
        status = "Washed Out"
        score = 60
        needs_correction = True
    else:
        status = "Good"
        score = 100
        needs_correction = False

    return {
        "mean_intensity": round(mean_val, 1),
        "status": status,
        "score": score,
        "needs_correction": needs_correction
    }
