'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, RotateCcw, Sparkles } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import DropZone from '@/components/document/DropZone';
import FileList from '@/components/document/FileList';
import MetadataForm from '@/components/document/MetadataForm';
import { documentService } from '@/services/documentService';
import type { SelectedFile, DocumentMetadata } from '@/types';

import '@/styles/layout.css';
import '@/styles/upload.css';

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [metadata, setMetadata] = useState<DocumentMetadata>({});
  const [metadataExpanded, setMetadataExpanded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  /** Add new files to selection */
  const handleFilesSelected = useCallback((newFiles: SelectedFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  /** Remove a file from selection */
  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      const removed = prev.find((f) => f.id === id);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
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
    setMetadataExpanded(false);
  }, [files]);

  /** Handle upload & start analysis */
  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      // Calls real FastAPI backend via document service layer
      const res = await documentService.uploadDocuments(
        files.map((f) => f.file),
        metadata
      );
      // Navigate to /processing/:documentId with dynamic server ID
      router.push(`/processing/${encodeURIComponent(res.documentId)}`);
    } catch (err) {
      console.error('Upload failed:', err);
      setIsUploading(false);
    }
  }, [files, metadata, router]);

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

          {/* Drop Zone & Selection */}
          <div className="glass-card" style={{ padding: '2rem' }}>
            <DropZone
              onFilesSelected={handleFilesSelected}
              currentFileCount={files.length}
            />

            {/* Selected Files with Preview & Remove actions */}
            <FileList files={files} onRemove={handleRemoveFile} />

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
                disabled={files.length === 0 || isUploading}
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
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload & Analyze
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

