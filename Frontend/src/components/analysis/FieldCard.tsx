'use client';

import React from 'react';
import { Check, AlertTriangle, AlertOctagon, Eye } from 'lucide-react';
import type { ExtractedField } from '@/types';

interface FieldCardProps {
  field: ExtractedField;
  onViewEvidence: (field: ExtractedField) => void;
}

export default function FieldCard({ field, onViewEvidence }: FieldCardProps) {
  const isHigh = field.confidenceLevel === 'high';
  const isMedium = field.confidenceLevel === 'medium';
  const isLow = field.confidenceLevel === 'low';

  const badgeClass = isHigh ? 'high' : isMedium ? 'medium' : 'low';
  const badgeLabel = isHigh ? 'High' : isMedium ? 'Medium' : 'Low';

  return (
    <div className={`field-card glass-card ${field.needsAttention ? 'attention-required' : ''}`}>
      <div className="field-card-top">
        <span className="field-card-name">{field.name}</span>
        <span
          className={`confidence-badge ${badgeClass}`}
          title={`Extraction Confidence: ${field.confidence}% (${badgeLabel})`}
        >
          {isHigh && <Check size={12} strokeWidth={2.5} />}
          {isMedium && <AlertTriangle size={12} />}
          {isLow && <AlertOctagon size={12} />}
          {field.confidence}% • {badgeLabel}
        </span>
      </div>

      <div className="field-card-value">{field.value}</div>

      <div className="field-card-meta-row">
        <span className="field-source-label">Source: Page {field.sourcePage}</span>
        {field.needsAttention && (
          <span style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 600 }}>
            ⚠ Review Needed
          </span>
        )}
      </div>

      <button
        type="button"
        className="btn-evidence"
        onClick={() => onViewEvidence(field)}
        aria-label={`View evidence for ${field.name}`}
      >
        <Eye size={14} />
        <span>View Evidence</span>
      </button>
    </div>
  );
}
