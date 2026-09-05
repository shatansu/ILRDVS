"""
Explainable per-field confidence scoring for BhoomiVerify AI.

Combines three independent confidence signals into a weighted composite:
  - OCR confidence (0.5 weight) — from PaddleOCR character recognition
  - Match confidence (0.3 weight) — from regex/fuzzy label matching
  - Context confidence (0.2 weight) — field value format validation

Thresholds:
  - High:   ≥ 85  → Green badge
  - Medium: ≥ 65  → Yellow badge
  - Low:    < 65  → Red badge + needsAttention flag (< 70)
"""

from __future__ import annotations

import re
from typing import Dict


def context_confidence(field_id: str, value: str) -> float:
    """
    Validates the extracted value makes sense for the given field type.
    Returns a confidence score between 0.0 and 1.0.

    Examples:
      - khasra_no "127/2"  → 1.0 (contains digits, valid format)
      - plot_area "unclear" → 0.25 (no numeric data found)
      - owner_name "राम सिंह" → 1.0 (contains Devanagari text)
    """
    normalized = value.strip()
    if not normalized:
        return 0.0

    # Numeric fields: must contain at least one digit
    if field_id in {"khasra_no", "khata_no", "share_fraction"}:
        return 1.0 if re.search(r"\d", normalized) else 0.25

    # Area field: must contain numeric value (possibly with unit)
    if field_id == "plot_area":
        has_number = bool(re.search(r"\d+(?:\.\d+)?", normalized))
        return 1.0 if has_number else 0.25

    # Text fields: must contain alphabetic text (Latin or Devanagari)
    if field_id in {"owner_name", "father_name", "village", "tehsil", "district", "land_class"}:
        has_text = bool(re.search(r"[A-Za-z\u0900-\u097F]", normalized))
        is_reasonable_length = len(normalized) >= 2
        if has_text and is_reasonable_length:
            return 1.0
        elif has_text:
            return 0.6
        else:
            return 0.3

    # Unknown field type: moderate confidence
    return 0.6


def score_field(
    field_id: str,
    value: str,
    ocr_confidence: float,
    match_confidence: float,
) -> Dict[str, object]:
    """
    Computes the weighted composite confidence score for a single extracted field.

    Returns:
        Dict with keys:
          - confidence: int (0-100)
          - confidence_level: "high" | "medium" | "low"
          - needs_attention: bool (True if confidence < 70)
          - context_confidence: float (0.0-1.0) — for explainability
          - ocr_confidence_used: float
          - match_confidence_used: float
    """
    # Clamp inputs to [0, 1]
    ocr_conf = max(0.0, min(float(ocr_confidence), 1.0))
    match_conf = max(0.0, min(float(match_confidence), 1.0))
    context_conf = context_confidence(field_id, value)

    # Weighted composite: OCR(50%) + Match(30%) + Context(20%)
    raw_score = (ocr_conf * 0.5) + (match_conf * 0.3) + (context_conf * 0.2)
    score = round(raw_score * 100)

    # Confidence band classification
    if score >= 85:
        level = "high"
    elif score >= 65:
        level = "medium"
    else:
        level = "low"

    return {
        "confidence": score,
        "confidence_level": level,
        "needs_attention": score < 70,
        "context_confidence": context_conf,
        "ocr_confidence_used": ocr_conf,
        "match_confidence_used": match_conf,
    }
