"""
Phase 3 recognition → field extraction → confidence orchestration.

This is the master orchestrator that chains:
  1. Load enhanced image(s) from storage/processed/{doc_id}/
  2. Get document_type from quality assessment understanding
  3. Route to appropriate OCR engine via ocr_router.py
  4. Run field extraction via field_matcher.py (configurable state patterns)
  5. Score each field via confidence_scorer.py
  6. Generate aiSummary describing what was found
  7. Return complete ExtractionPipelineResult

Architecture Notes:
  - PaddleOCR models are lazy-loaded on first use (no startup penalty)
  - If PaddleOCR/PPStructure are unavailable, the pipeline raises RuntimeError
    and the document status becomes EXTRACTION_FAILED (never fake data)
  - State-specific regex patterns are configurable via land_record_fields.py
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List

from .field_extractor.confidence_scorer import score_field
from .field_extractor.field_matcher import FieldCandidate, FieldMatcher
from .ocr_engine.ocr_router import OCRRouter


@dataclass
class ExtractionPipelineResult:
    """Complete extraction result ready for DB persistence and frontend display."""
    document_type: str
    raw_ocr_text: str
    fields: List[Dict[str, Any]] = field(default_factory=list)
    table_structure: Dict[str, Any] = field(default_factory=dict)
    avg_confidence: float = 0.0
    fields_needing_attention: int = 0
    ai_summary: str = ""
    engine_name: str = "PaddleOCR"


class ExtractionPipeline:
    """
    Orchestrates OCR → field extraction → confidence scoring.

    Args:
        storage_root: Path to the storage/ directory containing processed/ subfolder.
        state_code: State abbreviation for regex patterns (default "MP" for Madhya Pradesh).
    """

    def __init__(self, storage_root: Path, state_code: str = "MP") -> None:
        self.processed_dir = storage_root / "processed"
        self.router = OCRRouter()
        self.matcher = FieldMatcher(state_code=state_code)

    @staticmethod
    def _type_from_understanding(understanding: Dict[str, Any]) -> str:
        """Extracts document_type from the quality pipeline's understanding dict."""
        document_type = understanding.get("document_type") or understanding.get("layout")
        valid_types = {"simple_form", "complex_table", "handwritten_register"}
        return document_type if document_type in valid_types else "simple_form"

    def extract(self, document_id: str, understanding: Dict[str, Any]) -> ExtractionPipelineResult:
        """
        Runs the complete extraction pipeline for a document.

        Args:
            document_id: The DOC-YYYY-XXXXXX identifier.
            understanding: The understanding dict from quality pipeline output.

        Returns:
            ExtractionPipelineResult with all extracted fields and metadata.

        Raises:
            RuntimeError: If no enhanced pages found or OCR dependencies missing.
        """
        document_type = self._type_from_understanding(understanding)

        # Find enhanced page images
        doc_dir = self.processed_dir / document_id
        pages = sorted(doc_dir.glob("page_*_enhanced.png")) if doc_dir.exists() else []
        if not pages:
            raise RuntimeError(
                f"No enhanced document pages found in {doc_dir}. "
                "Quality pipeline must run successfully before extraction."
            )

        raw_text_pages: List[str] = []
        candidates: List[FieldCandidate] = []
        table_pages: List[Dict[str, Any]] = []
        page_confidences: List[float] = []
        engine_names: set = set()

        # ── Process each page ────────────────────────────────────────────
        for page_number, page_path in enumerate(pages, start=1):
            # Route to appropriate OCR engine based on document_type
            routed = self.router.recognize(page_path, document_type)

            raw_text_pages.append(routed.ocr.raw_text)
            page_confidences.append(routed.ocr.avg_confidence)
            engine_names.add(routed.ocr.engine_name)

            # Extract fields from OCR text blocks using regex + alias matching
            candidates.extend(
                self.matcher.match_blocks(routed.ocr.text_blocks, page_number)
            )

            # For tables: also extract from structured table data
            if routed.table is not None:
                table_data = routed.table.structured_json
                table_pages.append({
                    "page": page_number,
                    **table_data,
                    "raw_html": routed.table.raw_html,
                })
                # Additionally extract fields from table cell mappings
                candidates.extend(
                    self.matcher.match_table(table_data, page_number)
                )
            elif routed.table_error:
                table_pages.append({
                    "page": page_number,
                    "error": routed.table_error,
                })

        # ── De-duplicate candidates ──────────────────────────────────────
        # For simple_form: keep the highest-confidence occurrence per field_id
        # For complex_table: keep all rows (different values matter for multi-owner)
        selected: List[FieldCandidate] = []
        seen_keys: set = set()

        sorted_candidates = sorted(
            candidates,
            key=lambda c: c.ocr_confidence * c.match_confidence,
            reverse=True,
        )

        for candidate in sorted_candidates:
            if document_type == "complex_table":
                # For tables, use (field_id, page, value) as dedup key
                # so multiple owners/survey numbers from different rows are kept
                key = (candidate.field_id, candidate.page, candidate.value)
            else:
                # For forms, keep only best match per field_id
                key = candidate.field_id  # type: ignore[assignment]

            if key in seen_keys:
                continue
            selected.append(candidate)
            seen_keys.add(key)

        # ── Score each field ─────────────────────────────────────────────
        fields: List[Dict[str, Any]] = []
        for index, candidate in enumerate(selected, start=1):
            field_score = score_field(
                candidate.field_id,
                candidate.value,
                candidate.ocr_confidence,
                candidate.match_confidence,
            )
            fields.append(
                self.matcher.to_frontend_field(candidate, index, field_score)
            )

        # ── Compute aggregate metrics ────────────────────────────────────
        if fields:
            average = round(
                sum(float(f["confidence"]) for f in fields) / len(fields), 1
            )
        else:
            average = 0.0

        attention = sum(1 for f in fields if f.get("needsAttention"))

        # ── Generate AI summary ──────────────────────────────────────────
        if fields:
            type_label = document_type.replace("_", " ")
            summary = (
                f"PaddleOCR processed {len(pages)} page(s) as '{type_label}' "
                f"and extracted {len(fields)} evidence-linked land-record field(s) "
                f"with {average}% average confidence."
            )
            if attention:
                summary += (
                    f" {attention} field(s) have confidence below 70% "
                    f"and need human review before validation."
                )
        else:
            summary = (
                f"PaddleOCR processed {len(pages)} page(s), but no configured "
                f"land-record field labels could be matched in the recognized text. "
                f"Raw OCR output is preserved for manual review; "
                f"no values were fabricated."
            )

        return ExtractionPipelineResult(
            document_type=document_type,
            raw_ocr_text="\n\n".join(raw_text_pages),
            fields=fields,
            table_structure={"pages": table_pages} if table_pages else {},
            avg_confidence=average,
            fields_needing_attention=attention,
            ai_summary=summary,
            engine_name=" + ".join(sorted(engine_names)) or "PaddleOCR",
        )
