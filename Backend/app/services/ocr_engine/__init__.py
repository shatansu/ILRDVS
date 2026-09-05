"""Pluggable OCR and table-structure adapters for BhoomiVerify AI."""

from .ocr_base import BaseOCREngine, OCRResult, TextBlock
from .ocr_router import OCRRouter, RoutedOCRResult

__all__ = ["BaseOCREngine", "OCRResult", "TextBlock", "OCRRouter", "RoutedOCRResult"]
