"""
Master Document Quality Pipeline Orchestrator for BhoomiVerify AI.
Coordinates validation, PDF rendering, computer-vision assessments,
adaptive image enhancement, and OCR-readiness scoring.
"""

from pathlib import Path
from typing import Dict, Any, List
import cv2
import shutil

from .file_validator import validate_file
from .pdf_renderer import render_pdf_to_images
from .resolution import analyze_resolution
from .blur import analyze_blur
from .skew import analyze_skew
from .brightness import analyze_brightness
from .contrast import analyze_contrast
from .orientation import analyze_orientation
from .damage import analyze_damage
from .content_composition import analyze_composition
from .layout_classifier import classify_layout
from .enhancement import enhance_page
from .scoring import evaluate_quality

class DocumentQualityPipeline:
    def __init__(self, storage_root: Path):
        self.storage_root = storage_root
        self.normalized_dir = storage_root / "normalized"
        self.processed_dir = storage_root / "processed"
        self.normalized_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    def process_document(self, document_id: str, raw_file_path: Path) -> Dict[str, Any]:
        """
        Executes end-to-end quality analysis and adaptive enhancement for a document.
        """
        # 1. File Validation
        is_valid, detected_type, error_msg = validate_file(raw_file_path)
        if not is_valid:
            return {
                "success": False,
                "error": error_msg,
                "status": "REJECTED"
            }

        # Subfolders for this specific document
        doc_norm_dir = self.normalized_dir / document_id
        doc_proc_dir = self.processed_dir / document_id
        doc_norm_dir.mkdir(parents=True, exist_ok=True)
        doc_proc_dir.mkdir(parents=True, exist_ok=True)

        # 2. Extract / Normalize Pages to Images
        page_image_paths: List[Path] = []
        if detected_type == "pdf":
            page_image_paths = render_pdf_to_images(raw_file_path, doc_norm_dir, dpi=300)
        else:
            # Image file: copy and ensure standard format
            out_img = doc_norm_dir / "page_001.png"
            # Read with OpenCV and write as standardized PNG
            bgr = cv2.imread(str(raw_file_path))
            if bgr is not None:
                cv2.imwrite(str(out_img), bgr)
                page_image_paths = [out_img]
            else:
                shutil.copyfile(raw_file_path, out_img)
                page_image_paths = [out_img]

        if not page_image_paths:
            return {
                "success": False,
                "error": "No pages could be extracted from document",
                "status": "REJECTED"
            }

        total_pages = len(page_image_paths)
        per_page_results = []
        all_enhancements: List[str] = []

        # Analyze each page
        for idx, page_path in enumerate(page_image_paths):
            page_num = idx + 1
            bgr = cv2.imread(str(page_path))
            if bgr is None:
                continue
            gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

            # Computer Vision Analyzers
            res_result = analyze_resolution(page_path, bgr)
            blur_result = analyze_blur(gray)
            skew_result = analyze_skew(gray)
            bright_result = analyze_brightness(gray)
            contrast_result = analyze_contrast(gray)
            orient_result = analyze_orientation(gray)
            damage_result = analyze_damage(gray)
            comp_result = analyze_composition(gray)

            # Layout classification: simple_form / complex_table / handwritten_register
            layout_result = classify_layout(gray, handwritten_pct=comp_result.get("handwritten_pct", 0))

            # Adaptive Enhancement
            enhanced_page_path = doc_proc_dir / f"page_{page_num:03d}_enhanced.png"
            enh_result = enhance_page(
                image_path=page_path,
                output_path=enhanced_page_path,
                skew_angle=skew_result["skew_angle"],
                needs_clahe=contrast_result["needs_clahe"],
                needs_sharpening=blur_result["needs_enhancement"],
                detected_orientation_angle=orient_result["detected_angle"]
            )
            all_enhancements.extend(enh_result["operations_applied"])

            page_metrics = {
                "resolution": res_result,
                "blur": blur_result,
                "skew": skew_result,
                "brightness": bright_result,
                "contrast": contrast_result,
                "orientation": orient_result,
                "damage": damage_result,
                "composition": comp_result,
                "layout": layout_result
            }

            page_eval = evaluate_quality(page_metrics, enh_result["operations_applied"])
            
            per_page_results.append({
                "page_number": page_num,
                "raw_image_path": str(page_path),
                "enhanced_image_path": str(enhanced_page_path),
                "metrics": page_metrics,
                "evaluation": page_eval
            })

        # Calculate Aggregate Document Metrics (averaged across pages)
        primary_page = per_page_results[0]
        avg_score = int(round(sum(p["evaluation"]["score"] for p in per_page_results) / total_pages))
        
        # If any page is rejected due to severe unreadable blur/damage
        any_rejected = any(p["evaluation"]["is_rejected"] for p in per_page_results)
        
        # Primary page metrics for high-level card display
        pri_metrics = primary_page["metrics"]
        
        # Overall quality decision
        eval_result = evaluate_quality(pri_metrics, list(set(all_enhancements)))
        eval_result["score"] = avg_score
        if any_rejected or avg_score < 35:
            eval_result["is_rejected"] = True
            eval_result["pipeline_status"] = "REJECTED"
            eval_result["rejection_reason"] = "Document quality is severely degraded or unreadable. Please upload a clearer scan."
            eval_result["rating_label"] = "Degraded / Rejected"

        # Unique deduplicated enhancement operations
        unique_enhancements = sorted(list(set(all_enhancements)))

        # Format strictly matching the Frontend UI requirements
        quality_ui_data = {
            "resolution": f"{pri_metrics['resolution']['dpi']} DPI",
            "resolutionStatus": pri_metrics["resolution"]["status"],
            "orientation": pri_metrics["orientation"]["status"],
            "orientationStatus": pri_metrics["orientation"]["status"],
            "blur": pri_metrics["blur"]["status"],
            "blurStatus": pri_metrics["blur"]["status"],
            "contrast": pri_metrics["contrast"]["status"],
            "contrastStatus": pri_metrics["contrast"]["status"],
            "pageDamage": pri_metrics["damage"]["status"],
            "pageDamageStatus": pri_metrics["damage"]["status"],
            "brightness": pri_metrics["brightness"]["status"],
            "brightnessStatus": pri_metrics["brightness"]["status"],
            "skew": f"{pri_metrics['skew']['skew_angle']:+.1f}°",
            "skewStatus": pri_metrics["skew"]["status"],
            "overallScore": eval_result["score"],
            "qualityRating": eval_result["rating_label"]
        }

        # Determine document type from primary page layout classification
        pri_layout = pri_metrics.get("layout", {})
        detected_doc_type = pri_layout.get("document_type", "simple_form")

        understanding_ui_data = {
            "language": "Hindi + English",
            "script": pri_metrics["composition"]["script_estimation"],
            "documentType": "Land Revenue Record (Khasra / RoR)",
            "recognitionMode": pri_metrics["composition"]["mode"],
            "pages": total_pages,
            "handwrittenRatio": f"{pri_metrics['composition']['handwritten_pct']}%",
            "printedRatio": f"{pri_metrics['composition']['printed_pct']}%",
            "layout": detected_doc_type,
            "layoutReasoning": pri_layout.get("reasoning", "")
        }

        return {
            "success": True,
            "document_id": document_id,
            "total_pages": total_pages,
            "is_rejected": eval_result["is_rejected"],
            "rejection_reason": eval_result.get("rejection_reason"),
            "pipeline_status": eval_result["pipeline_status"],
            "composite_score": eval_result["score"],
            "rating_label": eval_result["rating_label"],
            "ai_insight": eval_result["ai_insight"],
            "enhancements_applied": unique_enhancements,
            "quality": quality_ui_data,
            "understanding": understanding_ui_data,
            "per_page": per_page_results,
            "preview_image_path": str(per_page_results[0]["enhanced_image_path"])
        }
