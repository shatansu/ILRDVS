/**
 * Processing Pipeline Types for BhoomiVerify AI
 */

export type StageStatus = 'waiting' | 'processing' | 'completed';

export interface PipelineStage {
  id: number;
  name: string;
  description: string;
  status: StageStatus;
}

export type QualityMetricStatus = 'good' | 'warning' | 'error';

export interface QualityMetric {
  label: string;
  value: string;
  status: QualityMetricStatus;
  statusLabel: string;
}

export interface DocumentQualityScan {
  resolution: QualityMetric;
  orientation: QualityMetric;
  blur: QualityMetric;
  contrast: QualityMetric;
  pageDamage: QualityMetric;
  brightness: QualityMetric;
  score: number;
  statusText: string;
}

export interface ProcessingActivity {
  id: string;
  time: string;
  message: string;
  stageId?: number;
}

export interface ProcessingState {
  documentId: string;
  fileName: string;
  status: 'processing' | 'completed' | 'error';
  currentStageId: number;
  progress: number;
  message: string;
  stages: PipelineStage[];
  qualityScan: DocumentQualityScan;
  aiInsight: string;
  activities: ProcessingActivity[];
  error?: string;
}

export interface UploadResponse {
  documentId: string;
  fileName: string;
  status: 'completed' | 'failed' | 'rejected';
  message?: string;
  is_rejected?: boolean;
  qualityScore?: number;
  fieldsExtracted?: number;
}
