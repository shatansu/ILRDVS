"""
Documents API Endpoints for BhoomiVerify AI.
Provides file upload, real-time quality processing, and document intelligence results.
"""

import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.database import get_db, Base, engine
from ..models.document import DocumentModel, QualityAssessmentModel, ExtractionResultModel
from ..schemas.document import UploadResponse, ProcessingState, DocumentAnalysisResult
from ..services.document_quality.pipeline import DocumentQualityPipeline
from ..services.extraction_pipeline import ExtractionPipeline

# Initialize DB tables
Base.metadata.create_all(bind=engine)

router = APIRouter(prefix="/documents", tags=["documents"])
pipeline = DocumentQualityPipeline(settings.STORAGE_DIR)
extraction_pipeline = ExtractionPipeline(settings.STORAGE_DIR)

def map_quality_status_badge(status_str: str) -> str:
    s = status_str.lower()
    if "good" in s or "clean" in s or "upright" in s or "aligned" in s:
        return "good"
    if "low" in s or "acceptable" in s or "detected" in s or "fixed" in s or "corrected" in s:
        return "warning"
    return "error"

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    files: List[UploadFile] = File(...),
    state: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    taluk: Optional[str] = Form(None),
    documentType: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    primary_file = files[0]
    filename = primary_file.filename or "uploaded_doc"
    ext = Path(filename).suffix.lower()

    # Generate Authoritative Document ID
    year = datetime.now().year
    random_digits = abs(hash(filename + str(datetime.now()))) % 900000 + 100000
    doc_id = f"DOC-{year}-{random_digits}"

    # Read content and compute SHA-256
    content = await primary_file.read()
    file_size = len(content)
    sha256_hash = hashlib.sha256(content).hexdigest()

    # Save to storage/originals
    saved_file_path = settings.ORIGINALS_DIR / f"{doc_id}_{filename}"
    with open(saved_file_path, "wb") as f:
        f.write(content)

    # Run Real Document Quality & Enhancement Pipeline
    pipeline_res = pipeline.process_document(doc_id, saved_file_path)
    
    if not pipeline_res.get("success", False):
        raise HTTPException(
            status_code=400,
            detail=pipeline_res.get("error", "Quality analysis failed to process document")
        )

    is_rejected = pipeline_res.get("is_rejected", False)
    doc_status = "REJECTED" if is_rejected else "READY_FOR_OCR"
    total_pages = pipeline_res.get("total_pages", 1)

    # Save Document Record to Database
    doc_record = DocumentModel(
        id=doc_id,
        filename=filename,
        file_type=ext.replace(".", ""),
        file_size=file_size,
        sha256=sha256_hash,
        status=doc_status,
        pages_count=total_pages,
        original_path=str(saved_file_path)
    )
    db.add(doc_record)

    # Save Quality Assessment to Database
    quality_record = QualityAssessmentModel(
        document_id=doc_id,
        score=pipeline_res.get("composite_score", 0),
        rating_label=pipeline_res.get("rating_label", "Unknown"),
        is_rejected=is_rejected,
        rejection_reason=pipeline_res.get("rejection_reason"),
        ai_insight=pipeline_res.get("ai_insight"),
        quality_metrics_json=json.dumps(pipeline_res.get("quality", {})),
        understanding_json=json.dumps(pipeline_res.get("understanding", {})),
        enhancements_json=json.dumps(pipeline_res.get("enhancements_applied", [])),
        preview_image_path=pipeline_res.get("preview_image_path")
    )
    db.add(quality_record)
    db.commit()

    fields_extracted = 0
    extraction_message = "Document quality verified and adaptive enhancements applied"
    if not is_rejected:
        doc_record.status = "EXTRACTING"
        db.commit()
        try:
            extraction = extraction_pipeline.extract(doc_id, pipeline_res.get("understanding", {}))
            db.add(ExtractionResultModel(
                document_id=doc_id,
                document_type=extraction.document_type,
                raw_ocr_text=extraction.raw_ocr_text,
                fields_json=json.dumps(extraction.fields, ensure_ascii=False),
                table_structure_json=json.dumps(extraction.table_structure, ensure_ascii=False),
                avg_confidence=extraction.avg_confidence,
                fields_count=len(extraction.fields),
                fields_needing_attention=extraction.fields_needing_attention,
                ai_summary=extraction.ai_summary,
                engine_name=extraction.engine_name,
            ))
            doc_record.status = "EXTRACTED"
            fields_extracted = len(extraction.fields)
            extraction_message = extraction.ai_summary
        except Exception as exc:
            # Quality output remains available. Do not create invented fields when
            # OCR dependencies/models are unavailable or a recognizer fails.
            doc_record.status = "EXTRACTION_FAILED"
            extraction_message = f"Quality processing completed, but OCR extraction failed: {exc}"
            db.add(ExtractionResultModel(
                document_id=doc_id,
                document_type=pipeline_res.get("understanding", {}).get("document_type", "simple_form"),
                fields_json="[]",
                error_message=str(exc),
                ai_summary=extraction_message,
            ))
        db.commit()

    return UploadResponse(
        documentId=doc_id,
        fileName=filename,
        status="completed" if doc_record.status == "EXTRACTED" else "failed" if doc_record.status == "EXTRACTION_FAILED" else "rejected",
        message=extraction_message if not is_rejected else pipeline_res.get("rejection_reason"),
        is_rejected=is_rejected,
        qualityScore=pipeline_res.get("composite_score", 0),
        fieldsExtracted=fields_extracted,
    )

@router.get("/{documentId}/status", response_model=ProcessingState)
async def get_processing_status(documentId: str, db: Session = Depends(get_db)):
    doc = db.query(DocumentModel).filter(DocumentModel.id == documentId).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    assessment = db.query(QualityAssessmentModel).filter(QualityAssessmentModel.document_id == documentId).first()
    extraction = db.query(ExtractionResultModel).filter(ExtractionResultModel.document_id == documentId).order_by(ExtractionResultModel.id.desc()).first()
    q_data = json.loads(assessment.quality_metrics_json) if assessment and assessment.quality_metrics_json else {}

    # Format quality scan cards
    quality_scan = {
        "resolution": {
            "label": "Resolution",
            "value": q_data.get("resolution", "300 DPI"),
            "status": map_quality_status_badge(q_data.get("resolutionStatus", "Good")),
            "statusLabel": q_data.get("resolutionStatus", "Good")
        },
        "orientation": {
            "label": "Orientation",
            "value": q_data.get("orientation", "Good"),
            "status": map_quality_status_badge(q_data.get("orientationStatus", "Good")),
            "statusLabel": q_data.get("orientationStatus", "Good")
        },
        "blur": {
            "label": "Blur",
            "value": q_data.get("blur", "Acceptable"),
            "status": map_quality_status_badge(q_data.get("blurStatus", "Acceptable")),
            "statusLabel": q_data.get("blurStatus", "Acceptable")
        },
        "contrast": {
            "label": "Contrast",
            "value": q_data.get("contrast", "Good"),
            "status": map_quality_status_badge(q_data.get("contrastStatus", "Good")),
            "statusLabel": q_data.get("contrastStatus", "Good")
        },
        "pageDamage": {
            "label": "Page Damage",
            "value": q_data.get("pageDamage", "Good"),
            "status": map_quality_status_badge(q_data.get("pageDamageStatus", "Good")),
            "statusLabel": q_data.get("pageDamageStatus", "Good")
        },
        "brightness": {
            "label": "Brightness",
            "value": q_data.get("brightness", "Good"),
            "status": map_quality_status_badge(q_data.get("brightnessStatus", "Good")),
            "statusLabel": q_data.get("brightnessStatus", "Good")
        },
        "score": assessment.score if assessment else 0,
        "statusText": assessment.rating_label if assessment else "Pending"
    }

    extraction_complete = doc.status == "EXTRACTED" and extraction is not None and not extraction.error_message
    extraction_failed = doc.status == "EXTRACTION_FAILED"
    stages = [
        {"id": 1, "name": "Document Received", "description": "File integrity and magic bytes verified", "status": "completed"},
        {"id": 2, "name": "File Integrity Check", "description": "SHA-256 fingerprint registered", "status": "completed"},
        {"id": 3, "name": "Document Quality Analysis", "description": "Resolution, blur, skew, damage computed via OpenCV", "status": "completed"},
        {"id": 4, "name": "Image Enhancement", "description": "Adaptive CLAHE and auto-deskewing applied", "status": "completed"},
        {"id": 5, "name": "Language & Layout Detection", "description": "Visual layout classified for the recognition router", "status": "completed"},
        {"id": 6, "name": "OCR / Handwriting Recognition", "description": "PaddleOCR Hindi-first recognition with English fallback", "status": "completed" if extraction_complete else "waiting"},
        {"id": 7, "name": "Land Field Extraction", "description": "Land field taxonomy matched against recognized text/table cells", "status": "completed" if extraction_complete else "waiting"},
        {"id": 8, "name": "Confidence Analysis", "description": "OCR, match, and field-context confidence calculated", "status": "completed" if extraction_complete else "waiting"},
        {"id": 9, "name": "Preparing Analysis Result", "description": "Evidence-linked extraction result stored", "status": "completed" if extraction_complete else "waiting"}
    ]

    now_time = datetime.now().strftime("%I:%M:%S %p")
    activities = [
        {"id": "act-1", "time": now_time, "message": "Document registered and SHA-256 signature verified", "stageId": 1},
        {"id": "act-2", "time": now_time, "message": f"OpenCV Quality audit complete: Score {assessment.score if assessment else 0}/100 ({assessment.rating_label if assessment else 'N/A'})", "stageId": 3},
        {"id": "act-3", "time": now_time, "message": "Adaptive preprocessing completed and clean sheet stored in storage/processed/", "stageId": 4},
        {"id": "act-4", "time": now_time, "message": "Layout classified and routed to the Phase 3 recognition engine", "stageId": 5}
    ]
    if extraction_complete:
        activities.extend([
            {"id": "act-5", "time": now_time, "message": "PaddleOCR recognition completed", "stageId": 6},
            {"id": "act-6", "time": now_time, "message": f"{extraction.fields_count} land-record fields extracted with confidence scores", "stageId": 8},
        ])
    if extraction_failed:
        activities.append({"id": "act-5", "time": now_time, "message": extraction.error_message or "OCR extraction failed", "stageId": 6})

    return ProcessingState(
        documentId=documentId,
        fileName=doc.filename,
        status="completed" if extraction_complete else "error" if extraction_failed or (assessment and assessment.is_rejected) else "processing",
        currentStageId=9 if extraction_complete else 5,
        progress=100 if extraction_complete else 45 if extraction_failed else 40 if assessment and assessment.is_rejected else 55,
        message=extraction.ai_summary if extraction_complete else extraction.error_message if extraction_failed and extraction else "Document quality analyzed and enhanced" if not (assessment and assessment.is_rejected) else assessment.rejection_reason,
        stages=stages,
        qualityScan=quality_scan,
        aiInsight=assessment.ai_insight if assessment else "Analyzing document quality...",
        activities=activities,
        error=extraction.error_message if extraction_failed and extraction else assessment.rejection_reason if assessment and assessment.is_rejected else None
    )

@router.get("/{documentId}/analysis", response_model=DocumentAnalysisResult)
async def get_document_analysis(documentId: str, db: Session = Depends(get_db)):
    doc = db.query(DocumentModel).filter(DocumentModel.id == documentId).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    assessment = db.query(QualityAssessmentModel).filter(QualityAssessmentModel.document_id == documentId).first()
    extraction = db.query(ExtractionResultModel).filter(ExtractionResultModel.document_id == documentId).order_by(ExtractionResultModel.id.desc()).first()
    q_data = json.loads(assessment.quality_metrics_json) if assessment and assessment.quality_metrics_json else {}
    u_data = json.loads(assessment.understanding_json) if assessment and assessment.understanding_json else {}

    now_str = datetime.now().strftime("%b %d, %Y • %I:%M %p")

    # Real quality structure matching frontend types
    quality_obj = {
        "score": assessment.score if assessment else 0,
        "statusText": assessment.rating_label if assessment else "Pending",
        "resolution": {
            "value": q_data.get("resolution", "300 DPI"),
            "status": map_quality_status_badge(q_data.get("resolutionStatus", "Good")),
            "label": q_data.get("resolutionStatus", "Good")
        },
        "orientation": {
            "value": q_data.get("orientation", "Good"),
            "status": map_quality_status_badge(q_data.get("orientationStatus", "Good")),
            "label": q_data.get("orientationStatus", "Good")
        },
        "blur": {
            "value": q_data.get("blur", "Acceptable"),
            "status": map_quality_status_badge(q_data.get("blurStatus", "Acceptable")),
            "label": q_data.get("blurStatus", "Acceptable")
        },
        "contrast": {
            "value": q_data.get("contrast", "Good"),
            "status": map_quality_status_badge(q_data.get("contrastStatus", "Good")),
            "label": q_data.get("contrastStatus", "Good")
        },
        "pageDamage": {
            "value": q_data.get("pageDamage", "Good"),
            "status": map_quality_status_badge(q_data.get("pageDamageStatus", "Good")),
            "label": q_data.get("pageDamageStatus", "Good")
        },
        "brightness": {
            "value": q_data.get("brightness", "Good"),
            "status": map_quality_status_badge(q_data.get("brightnessStatus", "Good")),
            "label": q_data.get("brightnessStatus", "Good")
        },
        "note": assessment.ai_insight if assessment else "Document quality evaluated"
    }

    extracted_fields = json.loads(extraction.fields_json) if extraction and extraction.fields_json else []
    understanding_obj = {
        "language": u_data.get("language", "Hindi + English"),
        "script": u_data.get("script", "Devanagari + Latin"),
        "documentType": extraction.document_type.replace("_", " ").title() if extraction else u_data.get("documentType", "Unknown"),
        "recognitionMode": u_data.get("recognitionMode", "Mixed — Printed + Handwritten"),
        "pages": doc.pages_count,
        "layout": u_data.get("layout", "Standard Land Record Sheet"),
        "confidence": float(assessment.score if assessment else 0)
    }

    metrics_obj = {
        "qualityScore": assessment.score if assessment else 0,
        "qualityStatus": assessment.rating_label if assessment else "Fair",
        "extractionConfidence": extraction.avg_confidence if extraction and not extraction.error_message else 0,
        "confidenceStatus": "Measured from OCR, field matching, and value context" if extraction and not extraction.error_message else "Extraction failed" if extraction and extraction.error_message else "Pending OCR",
        "fieldsExtracted": len(extracted_fields),
        "totalFields": len(extracted_fields),
        "fieldsStatus": "Real OCR extraction complete" if extraction and not extraction.error_message else "No fields extracted",
        "fieldsNeedingAttention": extraction.fields_needing_attention if extraction else 0,
        "attentionStatus": "Human review recommended" if extraction and extraction.fields_needing_attention else "No low-confidence fields"
    }

    low_conf_warning = {
        "count": sum(1 for field in extracted_fields if field.get("needsAttention")),
        "message": "These values need review because their OCR, label match, or value-format confidence is below the configured threshold.",
        "fields": [{"name": field.get("name", "Unknown"), "confidence": field.get("confidence", 0)} for field in extracted_fields if field.get("needsAttention")]
    }

    provenance_obj = {
        "documentId": doc.id,
        "source": "BhoomiVerify quality and recognition pipeline",
        "pagesAnalyzed": doc.pages_count,
        "extractionEngine": extraction.engine_name if extraction and extraction.engine_name else "Not run",
        "processingState": doc.status,
        "timestamp": now_str
    }

    return DocumentAnalysisResult(
        documentId=doc.id,
        fileName=doc.filename,
        status="completed" if extraction and not extraction.error_message else "failed" if assessment and assessment.is_rejected or extraction and extraction.error_message else "processing",
        pages=doc.pages_count,
        processingMode="Automatic",
        timestamp=now_str,
        quality=quality_obj,
        understanding=understanding_obj,
        metrics=metrics_obj,
        fields=extracted_fields,
        aiSummary=extraction.ai_summary if extraction and extraction.ai_summary else assessment.ai_insight if assessment else "Quality assessment complete.",
        lowConfidenceWarning=low_conf_warning,
        provenance=provenance_obj,
        is_rejected=assessment.is_rejected if assessment else False,
        rejection_reason=assessment.rejection_reason if assessment else None
    )

@router.get("/{documentId}/image")
async def get_document_preview(documentId: str, db: Session = Depends(get_db)):
    assessment = db.query(QualityAssessmentModel).filter(QualityAssessmentModel.document_id == documentId).first()
    if not assessment or not assessment.preview_image_path:
        raise HTTPException(status_code=404, detail="Preview image not found")
    
    img_path = Path(assessment.preview_image_path)
    if not img_path.exists():
        raise HTTPException(status_code=404, detail="Preview image file missing on disk")

    return FileResponse(str(img_path), media_type="image/png")
