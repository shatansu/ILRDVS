"""
Rule-based + fuzzy field extraction for Indian land records.

Supports two extraction strategies:
  1. REGEX MODE: Uses configurable state-specific regex patterns (MP by default)
     for key:value pair extraction from OCR text blocks.
  2. TABLE MODE: Maps table column headers to canonical field IDs using fuzzy
     string matching for structured tabular data from PP-StructureV3.

The regex patterns are loaded from land_record_fields.STATE_PATTERN_REGISTRY,
making it trivial to add new state-specific terminology without modifying
this matcher logic.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple

try:
    from thefuzz import fuzz
except ImportError:  # pragma: no cover - keeps basic matching usable during setup
    from difflib import SequenceMatcher

    class _FallbackFuzz:
        @staticmethod
        def partial_ratio(left: str, right: str) -> int:
            return int(SequenceMatcher(None, left, right).ratio() * 100)

    fuzz = _FallbackFuzz()  # type: ignore[assignment]

from ..ocr_engine.ocr_base import TextBlock
from .land_record_fields import (
    FIELD_ALIASES,
    FIELD_BY_ID,
    get_patterns_for_state,
)


@dataclass
class FieldCandidate:
    """A single extracted field candidate with provenance metadata."""
    field_id: str
    value: str
    bbox: Tuple[int, int, int, int]
    source_text: str
    ocr_confidence: float
    match_confidence: float
    page: int


class FieldMatcher:
    """
    Extracts land-record fields from OCR text and structured tables.

    Args:
        state_code: State abbreviation for regex patterns (default "MP").
                    Maps to STATE_PATTERN_REGISTRY in land_record_fields.py.
    """

    _split_pattern = re.compile(r"\s*(?:[:\-–—])\s*", re.UNICODE)

    def __init__(self, state_code: str = "MP") -> None:
        self.state_code = state_code
        self.regex_patterns = get_patterns_for_state(state_code)

    # ─── Fuzzy header → field_id mapping (for table columns) ─────────────
    @staticmethod
    def _field_for_label(label: str) -> Tuple[Optional[str], float]:
        """Maps a table column header to a canonical field_id using fuzzy matching."""
        cleaned = label.lower().strip()
        best_id: Optional[str] = None
        best_score = 0.0
        for field_id, aliases in FIELD_ALIASES.items():
            for alias in aliases:
                # Exact substring match → full confidence
                if alias.lower() in cleaned:
                    return field_id, 1.0
                score = fuzz.partial_ratio(cleaned, alias.lower()) / 100
                if score > best_score:
                    best_id, best_score = field_id, score
        return (best_id, best_score) if best_score >= 0.70 else (None, 0.0)

    # ─── Strategy 1: Regex-based extraction from OCR text blocks ─────────
    def match_blocks(self, blocks: Iterable[TextBlock], page: int) -> List[FieldCandidate]:
        """
        Tries state-specific regex patterns first, then falls back to
        alias-based substring matching for each OCR text block.
        """
        candidates: List[FieldCandidate] = []
        matched_field_ids: set = set()

        # Pass 1: State-specific compiled regex patterns (higher precision)
        for block in blocks:
            text = block.text.strip()
            if not text:
                continue
            for field_id, patterns in self.regex_patterns.items():
                if field_id in matched_field_ids:
                    continue
                for pattern in patterns:
                    m = pattern.search(text)
                    if m:
                        value = m.group("value").strip(" .|,;:\t\n")
                        if value and len(value) >= 1:
                            candidates.append(FieldCandidate(
                                field_id=field_id,
                                value=value,
                                bbox=block.bbox,
                                source_text=text,
                                ocr_confidence=block.confidence,
                                match_confidence=0.95,  # Regex match = high confidence
                                page=page,
                            ))
                            matched_field_ids.add(field_id)
                            break  # Stop trying more patterns for this field

        # Pass 2: Fallback alias-based substring matching for remaining blocks
        # This catches fields the regex didn't pick up
        remaining_blocks = [b for b in blocks if b.text.strip()]
        for block in remaining_blocks:
            text = block.text.strip()
            for field_id, aliases in FIELD_ALIASES.items():
                if field_id in matched_field_ids:
                    continue
                matching_alias = next(
                    (alias for alias in aliases if alias.lower() in text.lower()),
                    None
                )
                if not matching_alias:
                    continue
                value = self._value_from_line(text, matching_alias)
                if value and len(value) >= 1:
                    candidates.append(FieldCandidate(
                        field_id=field_id,
                        value=value,
                        bbox=block.bbox,
                        source_text=text,
                        ocr_confidence=block.confidence,
                        match_confidence=0.80,  # Alias match = slightly lower
                        page=page,
                    ))
                    matched_field_ids.add(field_id)
                    break

        return candidates

    @staticmethod
    def _value_from_line(text: str, label: str) -> str:
        """Extracts the value portion after removing the matched label."""
        without_label = re.sub(re.escape(label), "", text, flags=re.IGNORECASE).strip()
        parts = FieldMatcher._split_pattern.split(without_label, maxsplit=1)
        return (parts[-1] if parts else without_label).strip(" .|,;")

    # ─── Strategy 2: Table-based extraction from structured JSON ─────────
    def match_table(self, table: Dict[str, Any], page: int) -> List[FieldCandidate]:
        """
        Maps table column headers to field IDs using fuzzy matching,
        then extracts cell values from each row.
        """
        candidates: List[FieldCandidate] = []
        for row in table.get("rows", []):
            for header, cell in row.items():
                field_id, confidence = self._field_for_label(header)
                value = str(cell.get("value", "")).strip() if isinstance(cell, dict) else str(cell).strip()
                if field_id and value:
                    candidates.append(FieldCandidate(
                        field_id=field_id,
                        value=value,
                        bbox=(0, 0, 0, 0),
                        source_text=f"{header}: {value}",
                        ocr_confidence=0.75,
                        match_confidence=confidence,
                        page=page,
                    ))
        return candidates

    # ─── Convert candidate to frontend-compatible field dict ─────────────
    def to_frontend_field(
        self, candidate: FieldCandidate, sequence: int, score: Dict[str, object]
    ) -> Dict[str, object]:
        """Converts a FieldCandidate + confidence score into the exact shape
        expected by the frontend ExtractedField TypeScript interface."""
        definition = FIELD_BY_ID[candidate.field_id]
        x1, y1, x2, y2 = candidate.bbox
        if x2 or y2:
            region = f"Page {candidate.page} • bbox ({x1}, {y1}, {x2}, {y2})"
        else:
            region = f"Page {candidate.page} • table cell"
        return {
            "id": f"{candidate.field_id}-{candidate.page}-{sequence}",
            "category": definition["category"],
            "categoryLabel": definition["category_label"],
            "name": definition["label"],
            "value": candidate.value,
            "confidence": score["confidence"],
            "confidenceLevel": score["confidence_level"],
            "sourcePage": candidate.page,
            "sourceRegion": region,
            "boundingSnippetText": candidate.source_text,
            "needsAttention": score["needs_attention"],
        }
