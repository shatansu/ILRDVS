'use client';

import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface ProcessingErrorStateProps {
  error?: string;
  onRetry: () => void;
}

export default function ProcessingErrorState({ error, onRetry }: ProcessingErrorStateProps) {
  return (
    <div className="error-card glass-card">
      <div className="error-icon">
        <AlertOctagon size={28} />
      </div>
      <h2 className="error-title">Processing could not be completed</h2>
      <p className="error-desc">
        {error ||
          'An unexpected error occurred while analyzing the document. You can retry the AI pipeline or re-upload your document.'}
      </p>
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        <RotateCcw size={16} />
        Retry Analysis
      </button>
    </div>
  );
}
