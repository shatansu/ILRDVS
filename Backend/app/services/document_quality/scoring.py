"""
Scoring and Decision Engine for BhoomiVerify AI.
Calculates composite 0-100 quality score, determines rejection vs acceptance,
and generates explainable AI diagnostic insight messages.
"""

from typing import Dict, Any, List
from .config import quality_config

def calculate_composite_score(
    resolution_score: int,
    blur_score: int,
    skew_score: int,
    brightness_score: int,
    contrast_score: int,
    damage_score: int
) -> int:
    """
    Weighted scoring formula:
    - Resolution: 20%
    - Sharpness / Blur: 25% (Critical for OCR)
    - Contrast: 20% (Critical for faded text)
    - Damage: 15%
    - Skew: 10%
    - Brightness: 10%
    """
    composite = (
        resolution_score * 0.20 +
        blur_score * 0.25 +
        contrast_score * 0.20 +
        damage_score * 0.15 +
        skew_score * 0.10 +
        brightness_score * 0.10
    )
    return int(round(max(min(composite, 100), 0)))

def generate_ai_insight(
    score: int,
    status: str,
    contrast_status: str,
    blur_status: str,
    skew_angle: float,
    damage_status: str,
    enhancements_applied: List[str]
) -> str:
    """
    Generates dynamic, human-readable AI diagnostic message for the UI cards.
    """
    if status == "REJECTED":
        return f"Document quality is critically degraded (Score: {score}/100). The image is too blurry or damaged for reliable text recognition. Please upload a clearer or higher-resolution scan."

    observations = []
    if "Low" in contrast_status or "Enhancement" in contrast_status:
        observations.append("Low contrast / faded ink detected")
    if abs(skew_angle) >= 1.0:
        observations.append(f"rotational skew of {skew_angle:+.1f}° detected")
    if blur_status == "Acceptable":
        observations.append("mild edge softening detected")
    if damage_status in {"Detected", "Severe"}:
        observations.append("surface damage/stains noted")

    if not observations:
        return "Document visual quality is optimal. High sharpness and balanced contrast detected across all pages."

    obs_str = ", and ".join(observations[:2])
    return f"{obs_str.capitalize()}. Adaptive AI enhancement and contrast restoration were automatically applied before passing to the recognition engine."

def evaluate_quality(
    metrics: Dict[str, Any],
    enhancements: List[str]
) -> Dict[str, Any]:
    """
    Evaluates final quality state, score rating, and rejection criteria.
    """
    res = metrics["resolution"]
    blur = metrics["blur"]
    skew = metrics["skew"]
    bright = metrics["brightness"]
    contrast = metrics["contrast"]
    damage = metrics["damage"]

    composite_score = calculate_composite_score(
        res["score"],
        blur["score"],
        skew["score"],
        bright["score"],
        contrast["score"],
        damage["score"]
    )

    # Rejection check
    is_rejected = (
        composite_score < quality_config.REJECTION_SCORE_THRESHOLD or
        blur.get("is_severely_degraded", False)
    )

    if is_rejected:
        rating_label = "Unusable / Degraded"
        pipeline_status = "REJECTED"
        rejection_reason = "Document quality is too low for reliable OCR. Severe blur or damage detected."
    elif composite_score >= quality_config.GOOD_SCORE_THRESHOLD:
        rating_label = "Good"
        pipeline_status = "READY_FOR_OCR"
        rejection_reason = None
    elif composite_score >= quality_config.FAIR_SCORE_THRESHOLD:
        rating_label = "Fair"
        pipeline_status = "READY_FOR_OCR"
        rejection_reason = None
    else:
        rating_label = "Poor (Enhanced)"
        pipeline_status = "READY_FOR_OCR"
        rejection_reason = None

    ai_insight = generate_ai_insight(
        composite_score,
        pipeline_status,
        contrast["status"],
        blur["status"],
        skew["skew_angle"],
        damage["status"],
        enhancements
    )

    return {
        "score": composite_score,
        "rating_label": rating_label,
        "pipeline_status": pipeline_status,
        "is_rejected": is_rejected,
        "rejection_reason": rejection_reason,
        "ai_insight": ai_insight
    }
