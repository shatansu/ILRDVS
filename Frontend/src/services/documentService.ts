/**
 * Document Service Layer for BhoomiVerify AI
 *
 * This layer abstracts backend communication.
 * When the real backend (FastAPI / Node) is connected, only this file
 * needs to point to real API endpoints (e.g., POST /documents, GET /documents/:id/status).
 * The UI screens remain completely unchanged.
 */

import type { DocumentMetadata, UploadResponse, ProcessingState, DocumentAnalysisResult } from '@/types';
import { getInitialProcessingState } from './mockProcessingService';
import { getMockAnalysisResult } from './mockAnalysisService';

// Ephemeral client cache for session-based filename recovery across route transitions
const documentMetaCache = new Map<string, { fileName: string; metadata?: DocumentMetadata }>();

export const documentService = {
  /**
   * Uploads documents to the backend.
   * Future Real API:
   *   const formData = new FormData();
   *   files.forEach(f => formData.append('files', f));
   *   const res = await fetch('/api/documents', { method: 'POST', body: formData });
   *   return await res.json();
   */
  async uploadDocuments(
    files: File[],
    metadata?: DocumentMetadata
  ): Promise<UploadResponse> {
    // Simulated network latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (files.length === 0) {
      throw new Error('No files provided for upload');
    }

    // In mock mode: Simulate the backend receiving document & creating record
    const primaryFile = files[0];
    const mockBackendGeneratedId = `DOC-${new Date().getFullYear()}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    // Store filename in session cache so Screen 2 can read original name if needed
    documentMetaCache.set(mockBackendGeneratedId, {
      fileName: primaryFile.name,
      metadata,
    });

    return {
      documentId: mockBackendGeneratedId,
      fileName: primaryFile.name,
      status: 'processing',
      message: 'Document successfully registered and queued for AI analysis',
    };
  },

  /**
   * Retrieves cached or initial metadata for a documentId.
   */
  getDocumentMeta(documentId: string): { fileName: string; metadata?: DocumentMetadata } | undefined {
    return documentMetaCache.get(documentId);
  },

  /**
   * Retrieves document intelligence / analysis results.
   * Future Real API:
   *   const res = await fetch(`/api/documents/${documentId}/analysis`);
   *   return await res.json();
   */
  async getDocumentAnalysis(documentId: string): Promise<DocumentAnalysisResult> {
    const cached = documentMetaCache.get(documentId);
    return getMockAnalysisResult(documentId, cached?.fileName);
  },

  /**
   * Future Real API:
   *   const res = await fetch(`/api/documents/${documentId}/status`);
   *   return await res.json();
   */
  async getProcessingStatus(documentId: string): Promise<ProcessingState> {
    const cached = documentMetaCache.get(documentId);
    return getInitialProcessingState(documentId, cached?.fileName);
  },
};

