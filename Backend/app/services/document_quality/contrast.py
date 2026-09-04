"""
Contrast Analyzer for BhoomiVerify AI.
Measures RMS contrast and intensity spread to detect faded ink or low contrast.
"""

from typing import Dict, Any
import numpy as np
from .config import quality_config

def analyze_contrast(gray_img: np.ndarray) -> Dict[str, Any]:
    """
    Computes RMS contrast (standard deviation of pixel intensities).
    Faded ink / low contrast documents have low standard deviation.
    """
    std_dev = float(np.std(gray_img))

    if std_dev >= quality_config.CONTRAST_GOOD_THRESHOLD:
        status = "Good"
        score = 100
        needs_clahe = False
    elif std_dev >= quality_config.CONTRAST_LOW_THRESHOLD:
        status = "Low"
        score = int(60 + (std_dev - quality_config.CONTRAST_LOW_THRESHOLD) / (quality_config.CONTRAST_GOOD_THRESHOLD - quality_config.CONTRAST_LOW_THRESHOLD) * 30)
        needs_clahe = True
    else:
        status = "Needs Enhancement"
        score = max(int((std_dev / quality_config.CONTRAST_LOW_THRESHOLD) * 50), 20)
        needs_clahe = True

    return {
        "contrast_std": round(std_dev, 2),
        "status": status,
        "score": score,
        "needs_clahe": needs_clahe
    }
