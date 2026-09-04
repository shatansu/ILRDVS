'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface LowConfidenceAlertProps {
  warning: {
    count: number;
    message: string;
    fields: { name: string; confidence: number }[];
  };
}

export default function LowConfidenceAlert({ warning }: LowConfidenceAlertProps) {
  if (warning.count === 0) return null;

  return (
    <div className="low-confidence-alert">
      <div className="alert-icon-box">
        <AlertTriangle size={18} />
      </div>

      <div className="alert-body">
        <div className="alert-title">
          {warning.count} field{warning.count !== 1 ? 's' : ''} require attention
        </div>
        <p className="alert-message">{warning.message}</p>

        <div className="alert-pills">
          {warning.fields.map((f, i) => (
            <span key={i} className="alert-pill">
              <span>⚠</span>
              <span>
                {f.name} (Confidence: {f.confidence}%)
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
