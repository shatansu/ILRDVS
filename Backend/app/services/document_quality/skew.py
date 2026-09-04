"""
Skew Detection and Angle Estimator for BhoomiVerify AI.
Uses text line edge detection and Hough Transform to find rotational skew.
"""

from typing import Dict, Any, Tuple
import cv2
import numpy as np
from .config import quality_config

def detect_skew_angle(gray_img: np.ndarray) -> Tuple[float, float]:
    """
    Detects document skew angle in degrees using Hough lines and contour analysis.
    Returns: (angle_degrees, confidence)
    """
    # Invert image: text becomes white, background black
    thresh = cv2.adaptiveThreshold(
        gray_img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 8
    )

    # Detect horizontal lines / text flow using morphological kernel
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 3))
    dilated = cv2.dilate(thresh, kernel, iterations=2)

    # Find contours of text lines
    contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    
    angles = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 400:
            continue
        rect = cv2.minAreaRect(cnt)
        angle = rect[-1]
        
        # Normalize angle between -45 and 45
        if angle < -45:
            angle = 90 + angle
        elif angle > 45:
            angle = angle - 90
            
        if -30 <= angle <= 30:
            angles.append(angle)

    if not angles:
        # Fallback to Hough Lines
        edges = cv2.Canny(gray_img, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=10)
        if lines is not None:
            for line in lines:
                x1, y1, x2, y2 = line[0]
                rad = np.arctan2(y2 - y1, x2 - x1)
                deg = np.degrees(rad)
                if abs(deg) <= 30:
                    angles.append(deg)

    if angles:
        median_angle = float(np.median(angles))
        return round(median_angle, 2), 0.95
    return 0.0, 0.50

def analyze_skew(gray_img: np.ndarray) -> Dict[str, Any]:
    """
    Analyzes skew angle and assigns status.
    """
    angle, confidence = detect_skew_angle(gray_img)
    abs_angle = abs(angle)

    if abs_angle <= quality_config.SKEW_TOLERANCE_DEG:
        status = "Good"
        score = 100
        needs_deskew = False
        display_label = "Aligned (0°)"
    else:
        status = f"Skew Detected ({angle:+.1f}°)"
        score = max(int(100 - (abs_angle * 5)), 40)
        needs_deskew = True
        display_label = f"Corrected ({angle:+.1f}°)"

    return {
        "skew_angle": angle,
        "status": status,
        "score": score,
        "needs_deskew": needs_deskew,
        "display_label": display_label
    }
