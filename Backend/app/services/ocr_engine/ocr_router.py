"""Recognition router for simple forms, tables, and handwritten registers."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from .ocr_base import OCRResult
from .paddle_ocr_engine import PaddleOCREngine
from .table_structure_engine import TableStructureEngine, TableStructureResult


@dataclass
class RoutedOCRResult:
    ocr: OCRResult
    table: Optional[TableStructureResult] = None
    table_error: Optional[str] = None


class OCRRouter:
    def __init__(self) -> None:
        self.ocr_engine = PaddleOCREngine()
        self.table_engine = TableStructureEngine()

    def recognize(self, image_path: Path, document_type: str) -> RoutedOCRResult:
        ocr = self.ocr_engine.recognize(image_path, handwriting=document_type == "handwritten_register")
        if document_type != "complex_table":
            return RoutedOCRResult(ocr=ocr)
        try:
            return RoutedOCRResult(ocr=ocr, table=self.table_engine.analyze(image_path))
        except RuntimeError as exc:
            # OCR text remains real and usable for regex extraction. The table
            # structure result explicitly records that PP-Structure was unavailable.
            return RoutedOCRResult(ocr=ocr, table_error=str(exc))
