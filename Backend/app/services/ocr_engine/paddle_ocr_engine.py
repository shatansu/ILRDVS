"""PaddleOCR adapter with lazy model initialization and English fallback."""

from __future__ import annotations

from pathlib import Path
from typing import List

from .ocr_base import BaseOCREngine, OCRResult, TextBlock


class OCRDependencyError(RuntimeError):
    """PaddleOCR is unavailable or could not initialize its model."""


class PaddleOCREngine(BaseOCREngine):
    def __init__(self) -> None:
        self._engines = {}

    @staticmethod
    def _create_engine(language: str, handwriting: bool):
        try:
            from paddleocr import PaddleOCR
        except ImportError as exc:
            raise OCRDependencyError(
                "PaddleOCR is not installed. Install Backend/requirements.txt before processing documents."
            ) from exc

        options = {"use_angle_cls": True, "lang": language, "use_gpu": False, "show_log": False}
        if handwriting:
            options["rec_algorithm"] = "SVTR_LCNet"
        try:
            return PaddleOCR(**options)
        except Exception as exc:
            raise OCRDependencyError(f"PaddleOCR model initialization failed: {exc}") from exc

    def _engine(self, language: str, handwriting: bool):
        key = (language, handwriting)
        if key not in self._engines:
            self._engines[key] = self._create_engine(language, handwriting)
        return self._engines[key]

    @staticmethod
    def _parse(raw_result, language: str) -> OCRResult:
        blocks: List[TextBlock] = []
        line_number = 1
        for page in raw_result or []:
            for item in page or []:
                if not item or len(item) < 2:
                    continue
                points, recognition = item[0], item[1]
                if not recognition or len(recognition) < 2:
                    continue
                xs = [point[0] for point in points]
                ys = [point[1] for point in points]
                blocks.append(TextBlock(
                    text=str(recognition[0]).strip(),
                    bbox=(int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))),
                    confidence=float(recognition[1]),
                    line_number=line_number,
                ))
                line_number += 1
        average = sum(block.confidence for block in blocks) / len(blocks) if blocks else 0.0
        return OCRResult(
            raw_text="\n".join(block.text for block in blocks),
            text_blocks=blocks,
            avg_confidence=round(average, 4),
            language_detected=language,
            engine_name="PaddleOCR",
        )

    def recognize(self, image_path: Path, handwriting: bool = False) -> OCRResult:
        hindi = self._parse(self._engine("hi", handwriting).ocr(str(image_path), cls=True), "hi")
        # Hindi is the primary recognition model. English only runs when Hindi
        # did not obtain usable text, so the two model outputs are never faked
        # into one shared set of confidence values.
        if hindi.text_blocks and hindi.avg_confidence >= 0.45:
            return hindi
        english = self._parse(self._engine("en", handwriting).ocr(str(image_path), cls=True), "en")
        return english if english.avg_confidence > hindi.avg_confidence else hindi
