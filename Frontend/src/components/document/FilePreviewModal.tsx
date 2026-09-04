'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';
import { formatFileSize, getFileCategory } from '@/lib/file-utils';
import type { SelectedFile } from '@/types';

interface FilePreviewModalProps {
  file: SelectedFile | null;
  onClose: () => void;
}

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (file) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [file, onClose]);

  if (!file) return null;

  const category = getFileCategory(file.file.name);
  const previewUrl = file.preview || (typeof window !== 'undefined' ? URL.createObjectURL(file.file) : '');

  return (
    <div className="preview-modal-backdrop" onClick={onClose}>
      <div
        className="preview-modal-content glass-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
      >
        {/* Header */}
        <div className="preview-modal-header">
          <div className="preview-modal-info">
            {category === 'pdf' ? (
              <FileText size={20} className="preview-type-icon pdf" />
            ) : (
              <ImageIcon size={20} className="preview-type-icon img" />
            )}
            <div>
              <div id="preview-title" className="preview-modal-filename" title={file.file.name}>
                {file.file.name}
              </div>
              <div className="preview-modal-filesize">
                {formatFileSize(file.file.size)} • {category.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="preview-modal-actions">
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-file-action"
                title="Open in new window"
              >
                <ExternalLink size={14} />
                Open External
              </a>
            )}
            <button
              type="button"
              className="preview-modal-close"
              onClick={onClose}
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="preview-modal-body">
          {category === 'pdf' && previewUrl ? (
            <iframe
              src={previewUrl}
              className="preview-iframe"
              title={`Preview of ${file.file.name}`}
            />
          ) : category === 'image' && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={file.file.name}
              className="preview-image"
            />
          ) : (
            <div className="preview-unsupported">
              <FileText size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
              <p>Direct preview is not available for this format.</p>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  <ExternalLink size={16} />
                  Open File
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
