/**
 * Real Document Service Layer for BhoomiVerify AI.
 * Connects Frontend directly to FastAPI Backend on http://127.0.0.1:8000
 */

import type { DocumentMetadata, UploadResponse, ProcessingState, DocumentAnalysisResult } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

// Ephemeral client cache for session-based filename recovery across route transitions
const documentMetaCache = new Map<string, { fileName: string; metadata?: DocumentMetadata }>();

export const documentService = {
  /**
   * Uploads real document (PDF or Image) to FastAPI backend.
   * Backend runs DocumentQualityPipeline and saves record to DB.
   */
  async uploadDocuments(
    files: File[],
    metadata?: DocumentMetadata
  ): Promise<UploadResponse> {
    if (files.length === 0) {
      throw new Error('No files provided for upload');
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    if (metadata) {
      if (metadata.state) formData.append('state', metadata.state);
      if (metadata.district) formData.append('district', metadata.district);
      if (metadata.tehsil) formData.append('tehsil', metadata.tehsil);
      if (metadata.documentType) formData.append('documentType', metadata.documentType);
      if (metadata.language) formData.append('language', metadata.language);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed with status: ${response.status}`);
      }

      const res: UploadResponse = await response.json();

      // Cache metadata
      documentMetaCache.set(res.documentId, {
        fileName: res.fileName,
        metadata,
      });

      return res;
    } catch (err: any) {
      console.error('[DocumentService] Upload failed:', err);
      throw err;
    }
  },

  /**
   * Retrieves cached or initial metadata for a documentId.
   */
  getDocumentMeta(documentId: string): { fileName: string; metadata?: DocumentMetadata } | undefined {
    return documentMetaCache.get(documentId);
  },

  /**
   * Retrieves real document intelligence / quality analysis results from Backend.
   */
  async getDocumentAnalysis(documentId: string): Promise<DocumentAnalysisResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/analysis`);
      if (!response.ok) {
        throw new Error(`Failed to fetch analysis: ${response.statusText}`);
      }
      return await response.json();
    } catch (err: any) {
      console.error('[DocumentService] getDocumentAnalysis error:', err);
      throw err;
    }
  },

  /**
   * Retrieves real-time processing status and quality metrics from Backend.
   */
  async getProcessingStatus(documentId: string): Promise<ProcessingState> {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/status`);
      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }
      return await response.json();
    } catch (err: any) {
      console.error('[DocumentService] getProcessingStatus error:', err);
      throw err;
    }
  },
};
