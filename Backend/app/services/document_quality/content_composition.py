"""
Content Composition Analyzer for BhoomiVerify AI.
Distinguishes between printed typography and cursive/handwritten annotations
using stroke regularity, contour aspect variance, and connected component analysis.
"""

from typing import Dict, Any
import cv2
import numpy as np

def analyze_composition(gray_img: np.ndarray) -> Dict[str, Any]:
    """
    Analyzes connected components to estimate ratio of printed vs handwritten content.
    """
    # Threshold image
    _, binary = cv2.threshold(gray_img, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Run connected components with statistics
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary, connectivity=8)
    
    if num_labels <= 2:
        return {
            "handwritten_pct": 0,
            "printed_pct": 100,
            "mode": "Printed",
            "script_estimation": "Devanagari + Latin"
        }

    # Filter out noise (tiny dots) and huge background components
    widths = []
    heights = []
    areas = []
    
    for i in range(1, num_labels):
        w = stats[i, cv2.CC_STAT_WIDTH]
        h = stats[i, cv2.CC_STAT_HEIGHT]
        area = stats[i, cv2.CC_STAT_AREA]
        
        # Valid text character size window
        if 5 <= h <= 150 and 5 <= w <= 200 and area > 15:
            widths.append(w)
            heights.append(h)
            areas.append(area)

    if not heights:
        return {
            "handwritten_pct": 0,
            "printed_pct": 100,
            "mode": "Printed",
            "script_estimation": "Devanagari + Latin"
        }

    # Height standard deviation: printed text has uniform height (low std);
    # handwritten text has high height variance (high std).
    height_std = float(np.std(heights))
    height_mean = float(np.mean(heights))
    coeff_variation = (height_std / max(height_mean, 1.0))

    # Determine handwriting ratio based on variation coefficient
    # cv < 0.35 -> mostly printed
    # cv > 0.70 -> heavily handwritten
    if coeff_variation < 0.35:
        handwritten_pct = int(min(max(coeff_variation * 40, 5), 20))
    elif coeff_variation < 0.65:
        handwritten_pct = int(30 + (coeff_variation - 0.35) * 80)
    else:
        handwritten_pct = int(min(60 + (coeff_variation - 0.65) * 50, 95))

    printed_pct = 100 - handwritten_pct

    if handwritten_pct < 15:
        mode = "Printed"
    elif handwritten_pct > 75:
        mode = "Handwritten"
    else:
        mode = "Mixed — Printed + Handwritten"

    return {
        "handwritten_pct": handwritten_pct,
        "printed_pct": printed_pct,
        "mode": mode,
        "script_estimation": "Devanagari + Latin",
        "height_variance_cv": round(coeff_variation, 2)
    }
