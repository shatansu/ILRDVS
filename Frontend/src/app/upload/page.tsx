'use client';

import React, { useState, useCallback } from 'react';
import { Upload, RotateCcw, Fingerprint, Info, Sparkles } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DropZone from '@/components/document/DropZone';
import FileList from '@/components/document/FileList';
import MetadataForm from '@/components/document/MetadataForm';
import { generateDocumentId } from '@/lib/file-utils';
import type { SelectedFile, DocumentMetadata } from '@/types';

import '@/styles/layout.css';
import '@/styles/upload.css';

export default function UploadPage() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [metadata, setMetadata] = useState<DocumentMetadata>({});
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  /** Add new files to selection */
  const handleFilesSelected = useCallback((newFiles: SelectedFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    // Generate document ID on first file selection
    if (!documentId) {
      setDocumentId(generateDocumentId());
    }
  }, [documentId]);

  /** Remove a file from selection */
  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      // Revoke object URL to prevent memory leaks
      const removed = prev.find((f) => f.id === id);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      // Clear doc ID if no files left
      if (updated.length === 0) {
        setDocumentId(null);
      }
      return updated;
    });
  }, []);

  /** Reset entire form */
  const handleReset = useCallback(() => {
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
    setMetadata({});
    setDocumentId(null);
    setMetadataExpanded(false);
  }, [files]);

  /** Handle upload (will connect to backend API later) */
  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    // TODO: Connect to backend API
    // For now, simulate a brief delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In the future, this will:
    // 1. POST files + metadata to /api/documents/upload
    // 2. Receive document IDs and processing job IDs
    // 3. Navigate to processing status page

    setIsUploading(false);
    alert(`Upload initiated!\n\nDocument ID: ${documentId}\nFiles: ${files.length}\n\nThis will connect to the backend API in the next phase.`);
  }, [files, documentId]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activePage="upload" />

      <div className="main-content">
        <Topbar
          breadcrumbs={[
            { label: 'BhoomiVerify AI', href: '/' },
            { label: 'Upload Document' },
          ]}
        />

        <main className="upload-page bg-grid">
          {/* Page Header */}
          <div className="upload-page-header">
            <h1 className="upload-page-title">
              <span className="gradient-text">Upload Land Records</span>
            </h1>
            <p className="upload-page-subtitle">
              Upload scanned documents, handwritten records, maps, or legacy PDFs.
              Our AI will automatically detect document type, language, and extract land record information.
            </p>
          </div>

          {/* Drop Zone */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <DropZone
              onFilesSelected={handleFilesSelected}
              currentFileCount={files.length}
            />

            {/* File List */}
            <FileList files={files} onRemove={handleRemoveFile} />

            {/* Document ID Banner */}
            {documentId && (
              <div className="doc-id-banner">
                <Fingerprint size={18} style={{ color: 'var(--color-primary-light)', flexShrink: 0 }} />
                <div>
                  <div className="doc-id-label">Document ID</div>
                  <div className="doc-id-value">{documentId}</div>
                </div>
              </div>
            )}

            {/* Metadata Form */}
            <MetadataForm
              metadata={metadata}
              onChange={setMetadata}
              isExpanded={metadataExpanded}
              onToggle={() => setMetadataExpanded(!metadataExpanded)}
            />

            {/* Info Note */}
            <div className="upload-note">
              <Sparkles size={14} className="upload-note-icon" />
              <span>
                <strong>No mode selection needed</strong> — The AI engine will automatically detect
                whether your document is printed, handwritten, or mixed, and choose the appropriate
                recognition pipeline. Language and layout are also detected automatically.
              </span>
            </div>

            {/* Actions */}
            <div className="upload-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleReset}
                disabled={files.length === 0}
              >
                <RotateCcw size={16} />
                Reset
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="animate-spin-slow" style={{ display: 'inline-flex' }}>
                      <Upload size={16} />
                    </span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload & Process
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
