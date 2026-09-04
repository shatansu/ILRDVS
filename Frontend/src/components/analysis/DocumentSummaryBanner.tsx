'use client';

import React from 'react';
import { CheckCircle2, FileText, Fingerprint, Layers, Cpu } from 'lucide-react';

interface DocumentSummaryBannerProps {
  fileName: string;
  documentId: string;
  pages: number;
  processingMode: string;
}

export default function DocumentSummaryBanner({
  fileName,
  documentId,
  pages,
  processingMode,
}: DocumentSummaryBannerProps) {
  return (
    <div className="doc-summary-banner glass-card">
      <div className="summary-item">
        <span className="summary-label">Document</span>
        <span className="summary-value" title={fileName}>
          {fileName}
        </span>
      </div>

      <div className="summary-item">
        <span className="summary-label">Document ID</span>
        <span className="summary-value mono">{documentId}</span>
      </div>

      <div className="summary-item">
        <span className="summary-label">Processing Status</span>
        <span className="summary-value success">
          <CheckCircle2 size={15} />
          Analysis Complete
        </span>
      </div>

      <div className="summary-item">
        <span className="summary-label">Pages</span>
        <span className="summary-value">{pages}</span>
      </div>

      <div className="summary-item">
        <span className="summary-label">Processing Mode</span>
        <span className="summary-value">{processingMode}</span>
      </div>
    </div>
  );
}
