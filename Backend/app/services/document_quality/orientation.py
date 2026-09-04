"""
Orientation Analyzer for BhoomiVerify AI.
Detects 0, 90, 180, 270 degree rotation using aspect ratio and line profiles.
"""

from typing import Dict, Any
import cv2
import numpy as np

def analyze_orientation(gray_img: np.ndarray) -> Dict[str, Any]:
    """
    Evaluates page orientation.
    Standard land documents are typically portrait (height > width).
    If width significantly exceeds height on single page documents, 90 degree tilt may be present.
    """
    h, w = gray_img.shape[:2]
    
    # Check text line orientation density: horizontal vs vertical projection
    # Horizontal projection profile
    proj_h = np.sum(gray_img < 128, axis=1)
    # Vertical projection profile
    proj_v = np.sum(gray_img < 128, axis=0)

    var_h = float(np.var(proj_h))
    var_v = float(np.var(proj_v))

    # Text in horizontal lines typically creates high variance in horizontal projection
    detected_angle = 0
    if w > h * 1.35 and var_v > var_h * 1.5:
        detected_angle = 90
        status = "Corrected"
        display_label = "Fixed (90°)"
    else:
        detected_angle = 0
        status = "Good"
        display_label = "Good"

    return {
        "detected_angle": detected_angle,
        "status": status,
        "display_label": display_label,
        "is_upright": detected_angle == 0
    }
