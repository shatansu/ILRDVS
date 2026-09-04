"""
Quality Assessment Configuration and Thresholds for BhoomiVerify AI.
Designed specifically for Indian Land Records (Khasra, Khatauni, Deeds).
"""

from dataclasses import dataclass

@dataclass(frozen=True)
class QualityConfig:
    # Resolution (DPI & dimensions)
    MIN_DPI: int = 150
    RECOMMENDED_DPI: int = 300
    MIN_WIDTH: int = 800
    MIN_HEIGHT: int = 1000

    # Blur Detection (Laplacian Variance)
    # < 50: Severely blurry (unreadable)
    # 50 - 120: Moderate blur (requires sharpening)
    # > 120: Sharp & clear
    BLUR_SEVERE_THRESHOLD: float = 40.0
    BLUR_MODERATE_THRESHOLD: float = 100.0

    # Skew Detection (Degrees)
    SKEW_TOLERANCE_DEG: float = 1.0
    MAX_SKEW_CORRECT_DEG: float = 45.0

    # Brightness (0 - 255 grayscale mean)
    BRIGHTNESS_MIN_NORMAL: float = 85.0
    BRIGHTNESS_MAX_NORMAL: float = 215.0

    # Contrast (Standard deviation of pixel intensities)
    # < 35: Very washed out / faded ink
    # 35 - 50: Low contrast (needs CLAHE)
    # > 50: Good contrast
    CONTRAST_LOW_THRESHOLD: float = 40.0
    CONTRAST_GOOD_THRESHOLD: float = 55.0

    # Page Damage Detection
    # Maximum contour area fraction considered stain or blot
    DAMAGE_AREA_RATIO_THRESHOLD: float = 0.015

    # Overall Quality Scoring (0 - 100)
    # Score below REJECTION_SCORE is marked as REJECTED (unreadable for OCR)
    REJECTION_SCORE_THRESHOLD: float = 35.0
    FAIR_SCORE_THRESHOLD: float = 65.0
    GOOD_SCORE_THRESHOLD: float = 85.0

quality_config = QualityConfig()
