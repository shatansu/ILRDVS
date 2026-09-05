"""Common, model-independent OCR result contracts."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Tuple

BBox = Tuple[int, int, int, int]


@dataclass
class TextBlock:
    text: str
    bbox: BBox
    confidence: float
    line_number: int


@dataclass
class OCRResult:
    raw_text: str
    text_blocks: List[TextBlock] = field(default_factory=list)
    avg_confidence: float = 0.0
    language_detected: str = "unknown"
    engine_name: str = "unknown"


class BaseOCREngine(ABC):
    """Pluggable recognition interface for future Indic/HTR model adapters."""

    @abstractmethod
    def recognize(self, image_path: Path, handwriting: bool = False) -> OCRResult:
        raise NotImplementedError
