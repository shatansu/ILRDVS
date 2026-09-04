"""
Page Damage and Artifact Detector for BhoomiVerify AI.
Detects corner tears, water stains, heavy ink blots, and folds on legacy land records.
"""

from typing import Dict, Any, List
import cv2
import numpy as np
from .config import quality_config

def analyze_damage(gray_img: np.ndarray) -> Dict[str, Any]:
    """
    Detects irregular dark regions, border tears, or massive ink stains.
    """
    h, w = gray_img.shape[:2]
    total_area = h * w

    # Apply Otsu thresholding to separate foreground and potential stains
    _, binary = cv2.threshold(gray_img, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Detect large non-text irregular contours (blots, stains, corner dark shadows)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    damage_regions: List[Dict[str, Any]] = []
    damaged_area = 0

    for cnt in contours:
        area = cv2.contourArea(cnt)
        # Large blob > 0.5% of total page area that is unlikely to be normal character text
        if area > total_area * 0.005:
            x, y, cw, ch = cv2.boundingRect(cnt)
            aspect_ratio = cw / float(ch) if ch > 0 else 1.0
            
            # Text lines are very wide; stains or tears tend to be blocky/circular
            if 0.3 <= aspect_ratio <= 3.0:
                damaged_area += area
                damage_regions.append({
                    "x": int(x),
                    "y": int(y),
                    "width": int(cw),
                    "height": int(ch),
                    "area_px": int(area)
                })

    damage_ratio = damaged_area / float(total_area)
    has_damage = damage_ratio > quality_config.DAMAGE_AREA_RATIO_THRESHOLD

    if not has_damage and len(damage_regions) == 0:
        status = "Good"
        score = 100
        display_label = "Clean"
    elif damage_ratio < 0.04:
        status = "Detected"
        score = 70
        display_label = "Detected (Review)"
    else:
        status = "Severe"
        score = 35
        display_label = "Severe Damage"

    return {
        "has_damage": has_damage,
        "damage_ratio": round(damage_ratio * 100, 2),
        "detected_regions_count": len(damage_regions),
        "status": status,
        "display_label": display_label,
        "score": score
    }
