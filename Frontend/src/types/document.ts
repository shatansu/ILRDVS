/**
 * Core document types for BhoomiVerify AI
 */

/** Supported upload file formats */
export type SupportedFileType = 'pdf' | 'jpg' | 'jpeg' | 'png' | 'tiff' | 'tif';

/** Document categories detected by AI */
export type DocumentCategory =
  | 'PRINTED'
  | 'HANDWRITTEN'
  | 'MIXED'
  | 'REGISTER'
  | 'CADASTRAL_MAP'
  | 'SCANNED_PDF'
  | 'UNKNOWN';

/** Processing state machine states */
export type ProcessingStatus =
  | 'UPLOADED'
  | 'ANALYZING'
  | 'PREPROCESSING'
  | 'ROUTING'
  | 'RECOGNIZING'
  | 'EXTRACTING'
  | 'EVIDENCE_LINKING'
  | 'VALIDATING'
  | 'RISK_SCORING'
  | 'PASSED'
  | 'REVIEW_REQUIRED'
  | 'HIGH_RISK'
  | 'FAILED'
  | 'VERIFIED'
  | 'EXPORTED';

/** Metadata captured at upload time */
export interface DocumentMetadata {
  state?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  documentType?: string;
  year?: string;
  language?: string;
}

/** A document entity in the system */
export interface LandDocument {
  id: string;
  documentId: string;       // e.g., "LR-2026-000184"
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  metadata: DocumentMetadata;
  status: ProcessingStatus;
  uploadedAt: string;       // ISO datetime
  uploadedBy: string;
}

/** Selected file before upload */
export interface SelectedFile {
  file: File;
  id: string;               // client-side unique ID
  preview?: string;          // object URL for image preview
}
