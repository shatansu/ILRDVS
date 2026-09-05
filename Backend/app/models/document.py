"""
SQLAlchemy Data Models for BhoomiVerify AI.
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..core.database import Base

class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String(64), primary_key=True, index=True) # e.g. DOC-2026-123456
    filename = Column(String(255), nullable=False)
    file_type = Column(String(32), nullable=False) # pdf, png, jpg
    file_size = Column(Integer, nullable=False)
    sha256 = Column(String(64), nullable=True)
    status = Column(String(32), default="PROCESSING") # UPLOADED, QUALITY_CHECKED, READY_FOR_OCR, REJECTED
    pages_count = Column(Integer, default=1)
    original_path = Column(String(512), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    quality_assessment = relationship("QualityAssessmentModel", back_populates="document", uselist=False)

class QualityAssessmentModel(Base):
    __tablename__ = "document_quality_assessments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(64), ForeignKey("documents.id"), nullable=False, index=True)
    
    score = Column(Integer, default=0)
    rating_label = Column(String(64), default="Pending")
    is_rejected = Column(Boolean, default=False)
    rejection_reason = Column(Text, nullable=True)
    ai_insight = Column(Text, nullable=True)
    
    # Serialized JSON representations
    quality_metrics_json = Column(Text, nullable=True)
    understanding_json = Column(Text, nullable=True)
    enhancements_json = Column(Text, nullable=True)
    preview_image_path = Column(String(512), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("DocumentModel", back_populates="quality_assessment")


class ExtractionResultModel(Base):
    """Persisted Phase 3 result. Original files and raw OCR are never overwritten."""
    __tablename__ = "extraction_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(64), ForeignKey("documents.id"), nullable=False, index=True)
    document_type = Column(String(32), nullable=False)
    raw_ocr_text = Column(Text, nullable=True)
    fields_json = Column(Text, nullable=False, default="[]")
    table_structure_json = Column(Text, nullable=True)
    avg_confidence = Column(Float, default=0.0)
    fields_count = Column(Integer, default=0)
    fields_needing_attention = Column(Integer, default=0)
    ai_summary = Column(Text, nullable=True)
    engine_name = Column(String(128), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("DocumentModel")
