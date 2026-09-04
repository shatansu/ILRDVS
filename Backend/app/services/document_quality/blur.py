"""
Blur and Sharpness Analyzer for BhoomiVerify AI.
Uses Laplacian Variance and gradient analysis via OpenCV.
"""

from typing import Dict, Any
import cv2
import numpy as np
from .config import quality_config

def analyze_blur(gray_img: np.ndarray) -> Dict[str, Any]:
    """
    Computes Laplacian variance to measure sharpness and detect blur.
    Higher variance = sharper image.
    """
    laplacian = cv2.Laplacian(gray_img, cv2.CV_64F)
    variance = float(laplacian.var())

    if variance >= quality_config.BLUR_MODERATE_THRESHOLD:
        status = "Good"
        score = 100
        needs_enhancement = False
    elif variance >= quality_config.BLUR_SEVERE_THRESHOLD:
        status = "Acceptable"
        # Scale between 60 and 90
        score = int(60 + (variance - quality_config.BLUR_SEVERE_THRESHOLD) / (quality_config.BLUR_MODERATE_THRESHOLD - quality_config.BLUR_SEVERE_THRESHOLD) * 30)
        needs_enhancement = True
    else:
        status = "Blurry Detected"
        score = max(int((variance / max(quality_config.BLUR_SEVERE_THRESHOLD, 1.0)) * 50), 10)
        needs_enhancement = True

    return {
        "laplacian_variance": round(variance, 2),
        "status": status,
        "score": score,
        "needs_enhancement": needs_enhancement,
        "is_severely_degraded": variance < quality_config.BLUR_SEVERE_THRESHOLD
    }
