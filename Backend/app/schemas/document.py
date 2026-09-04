"""
Pydantic Schemas for API Serialization.
Mirrors the Next.js Frontend types for 100% interoperability.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class UploadResponse(BaseModel):
    documentId: str
    fileName: str
    status: str
    message: Optional[str] = None
    is_rejected: bool = False
    qualityScore: Optional[int] = None

class QualityMetric(BaseModel):
    label: str
    value: str
    status: str # 'good' | 'warning' | 'error'
    statusLabel: str

class DocumentQualityScan(BaseModel):
    resolution: QualityMetric
    orientation: QualityMetric
    blur: QualityMetric
    contrast: QualityMetric
    pageDamage: QualityMetric
    brightness: QualityMetric
    score: int = 0
    statusText: str = "Good"

class PipelineStage(BaseModel):
    id: int
    name: str
    description: str
    status: str # 'waiting' | 'processing' | 'completed'

class ProcessingActivity(BaseModel):
    id: str
    time: str
    message: str
    stageId: Optional[int] = None

class ProcessingState(BaseModel):
    documentId: str
    fileName: str
    status: str # 'processing' | 'completed' | 'error'
    currentStageId: int
    progress: int
    message: str
    stages: List[PipelineStage]
    qualityScan: Dict[str, Any]
    aiInsight: str
    activities: List[ProcessingActivity]
    error: Optional[str] = None

class ExtractedField(BaseModel):
    id: str
    category: str # 'owner' | 'identification' | 'details' | 'location'
    categoryLabel: str
    name: str
    value: str
    confidence: float
    confidenceLevel: str # 'high' | 'medium' | 'low'
    sourcePage: int
    sourceRegion: Optional[str] = None
    boundingSnippetText: Optional[str] = None
    needsAttention: Optional[bool] = False

class DocumentUnderstanding(BaseModel):
    language: str
    script: str
    documentType: str
    recognitionMode: str
    pages: int
    layout: str
    confidence: float

class DocumentAnalysisResult(BaseModel):
    documentId: str
    fileName: str
    status: str
    pages: int
    processingMode: str
    timestamp: str
    quality: Dict[str, Any]
    understanding: DocumentUnderstanding
    metrics: Dict[str, Any]
    fields: List[ExtractedField] # Clean - zero fake mock data
    aiSummary: str
    lowConfidenceWarning: Dict[str, Any]
    provenance: Dict[str, Any]
    is_rejected: bool = False
    rejection_reason: Optional[str] = None
