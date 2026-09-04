/**
 * Analysis & Document Intelligence Types for BhoomiVerify AI (Screen 3)
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ExtractedField {
  id: string;
  category: 'owner' | 'identification' | 'details' | 'location';
  categoryLabel: string;
  name: string;
  value: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  sourcePage: number;
  sourceRegion?: string;
  boundingSnippetText?: string;
  needsAttention?: boolean;
}

export interface DocumentUnderstanding {
  language: string;
  script: string;
  documentType: string;
  recognitionMode: string;
  pages: number;
  layout: string;
  confidence: number;
}

export interface DocumentAnalysisResult {
  documentId: string;
  fileName: string;
  status: 'completed' | 'processing' | 'failed';
  pages: number;
  processingMode: string;
  timestamp: string;

  // Quality assessment
  quality: {
    score: number;
    statusText: string;
    resolution: { value: string; status: 'good' | 'warning' | 'error'; label: string };
    orientation: { value: string; status: 'good' | 'warning' | 'error'; label: string };
    blur: { value: string; status: 'good' | 'warning' | 'error'; label: string };
    contrast: { value: string; status: 'good' | 'warning' | 'error'; label: string };
    pageDamage: { value: string; status: 'good' | 'warning' | 'error'; label: string };
    brightness: { value: string; status: 'good' | 'warning' | 'error'; label: string };
    note: string;
  };

  // Document understanding
  understanding: DocumentUnderstanding;

  // Summary Metrics
  metrics: {
    qualityScore: number;
    qualityStatus: string;
    extractionConfidence: number;
    confidenceStatus: string;
    fieldsExtracted: number;
    totalFields: number;
    fieldsStatus: string;
    fieldsNeedingAttention: number;
    attentionStatus: string;
  };

  // Hero: Extracted land record fields
  fields: ExtractedField[];

  // Insights and alerts
  aiSummary: string;
  lowConfidenceWarning: {
    count: number;
    message: string;
    fields: { name: string; confidence: number }[];
  };

  // Provenance
  provenance: {
    documentId: string;
    source: string;
    pagesAnalyzed: number;
    extractionEngine: string;
    processingState: string;
    timestamp: string;
  };
}
