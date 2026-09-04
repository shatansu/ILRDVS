"""
Document Layout Classifier for BhoomiVerify AI.
Classifies scanned land records into:
  - "simple_form"        → Key:value field pairs (Bhu-Adhikar Pustika headers)
  - "complex_table"      → Multi-column tabular layout (Khatoni/B1 forms)
  - "handwritten_register" → Primarily handwritten content

Uses horizontal/vertical line detection (HoughLinesP) + connected component
density analysis to distinguish form types. Works on the enhanced grayscale
image output from Phase 2.
"""

from typing import Dict, Any
import cv2
import numpy as np


def classify_layout(gray_img: np.ndarray, handwritten_pct: float = 0.0) -> Dict[str, Any]:
    """
    Classifies a document page into one of three layout types.

    Args:
        gray_img: Grayscale image (enhanced, from Phase 2 pipeline).
        handwritten_pct: Handwritten content percentage from composition analyzer.

    Returns:
        Dict with keys: document_type, table_confidence, line_count, reasoning
    """
    # ------------------------------------------------------------------
    # Step 1: If handwriting dominates (>60%), classify as handwritten register
    # ------------------------------------------------------------------
    if handwritten_pct > 60:
        return {
            "document_type": "handwritten_register",
            "table_confidence": 0.0,
            "line_count": 0,
            "reasoning": f"Handwritten content dominates ({handwritten_pct}%); "
                         "classified as handwritten register for HTR mode."
        }

    # ------------------------------------------------------------------
    # Step 2: Detect horizontal and vertical ruling lines
    #         Tables have many parallel horizontal+vertical lines forming a grid
    # ------------------------------------------------------------------
    h, w = gray_img.shape[:2]

    # Adaptive threshold to get binary image
    binary = cv2.adaptiveThreshold(
        gray_img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 15, 5
    )

    # --- Detect Horizontal lines ---
    # Morphological kernel: wide and short → captures horizontal rules
    horiz_kernel_len = max(w // 8, 40)
    horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (horiz_kernel_len, 1))
    horiz_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horiz_kernel, iterations=2)

    # Count horizontal line segments via HoughLinesP
    horiz_segments = cv2.HoughLinesP(
        horiz_lines, 1, np.pi / 180,
        threshold=80, minLineLength=w // 6, maxLineGap=20
    )
    num_horiz = len(horiz_segments) if horiz_segments is not None else 0

    # --- Detect Vertical lines ---
    # Morphological kernel: tall and narrow → captures vertical rules
    vert_kernel_len = max(h // 8, 40)
    vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, vert_kernel_len))
    vert_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vert_kernel, iterations=2)

    vert_segments = cv2.HoughLinesP(
        vert_lines, 1, np.pi / 180,
        threshold=80, minLineLength=h // 6, maxLineGap=20
    )
    num_vert = len(vert_segments) if vert_segments is not None else 0

    total_lines = num_horiz + num_vert

    # ------------------------------------------------------------------
    # Step 3: Decision logic
    #   - complex_table: Many horizontal + vertical lines forming a grid
    #     (typically ≥ 5 horizontal AND ≥ 3 vertical)
    #   - simple_form: Few or no ruling lines, just key:value text
    # ------------------------------------------------------------------

    # Grid confidence: higher when both horizontal and vertical lines are abundant
    grid_score = 0.0
    if num_horiz >= 5 and num_vert >= 3:
        grid_score = min(1.0, (num_horiz * num_vert) / 100.0)
    elif num_horiz >= 3 and num_vert >= 2:
        grid_score = min(0.7, (num_horiz * num_vert) / 60.0)

    # Classification thresholds
    if grid_score >= 0.35:
        doc_type = "complex_table"
        reasoning = (
            f"Detected {num_horiz} horizontal + {num_vert} vertical ruling lines "
            f"(grid confidence: {grid_score:.2f}). "
            "Classified as complex tabular record for PP-StructureV3 parsing."
        )
    else:
        doc_type = "simple_form"
        reasoning = (
            f"Detected {num_horiz} horizontal + {num_vert} vertical lines "
            f"(grid confidence: {grid_score:.2f}). "
            "Classified as simple field-based form for direct regex extraction."
        )

    return {
        "document_type": doc_type,
        "table_confidence": round(grid_score, 2),
        "line_count": total_lines,
        "horiz_lines": num_horiz,
        "vert_lines": num_vert,
        "reasoning": reasoning
    }
