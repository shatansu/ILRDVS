'use client';

import React, { useEffect } from 'react';
import { X, FileText, Check, AlertTriangle, AlertOctagon, Scan, ShieldAlert, Sparkles } from 'lucide-react';
import type { ExtractedField } from '@/types';

interface EvidenceDrawerProps {
  field: ExtractedField | null;
  onClose: () => void;
}

export default function EvidenceDrawer({ field, onClose }: EvidenceDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (field) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [field, onClose]);

  if (!field) return null;

  const isHigh = field.confidenceLevel === 'high';
  const isMedium = field.confidenceLevel === 'medium';
  const isLow = field.confidenceLevel === 'low';

  const badgeClass = isHigh ? 'high' : isMedium ? 'medium' : 'low';
  const badgeLabel = isHigh ? 'High' : isMedium ? 'Medium' : 'Low';

  return (
    <div className="evidence-drawer-backdrop" onClick={onClose}>
      <div
        className="evidence-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Drawer Header */}
        <div className="evidence-drawer-header">
          <div className="evidence-drawer-title-group">
            <h3 id="drawer-title">Evidence-Linked Extraction</h3>
            <span className="evidence-drawer-sub">
              Visual provenance & source bounding region
            </span>
          </div>
          <button
            type="button"
            className="evidence-drawer-close"
            onClick={onClose}
            aria-label="Close evidence drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="evidence-drawer-body">
          {/* Field Details Strip */}
          <div className="evidence-field-banner">
            <div>
              <div className="evidence-field-name">Target Field</div>
              <div className="evidence-field-value">{field.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                {field.name} • {field.categoryLabel}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className={`confidence-badge ${badgeClass}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}>
                {isHigh && <Check size={13} strokeWidth={2.5} />}
                {isMedium && <AlertTriangle size={13} />}
                {isLow && <AlertOctagon size={13} />}
                {field.confidence}% • {badgeLabel}
              </span>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                {field.sourceRegion || `Page ${field.sourcePage}`}
              </div>
            </div>
          </div>

          {/* Document Region Visual Viewer */}
          <div className="evidence-viewer-card">
            <div className="evidence-viewer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={15} style={{ color: 'var(--color-primary-light)' }} />
                <span>Original Document Sheet — Page {field.sourcePage}</span>
              </div>
              <span className="card-tag">300 DPI Native</span>
            </div>

            <div className="evidence-viewer-viewport">
              {/* Simulated Paper Document Sheet */}
              <div className="document-page-sheet">
                <div className="sheet-line" style={{ width: '65%' }} />
                <div className="sheet-line" style={{ width: '85%' }} />
                <div className="sheet-line" style={{ width: '40%' }} />

                {/* Target Bounding Box Crop */}
                <div
                  className={`highlight-bounding-box ${
                    field.confidenceLevel === 'low' ? 'warning-highlight' : ''
                  }`}
                >
                  <span
                    className={`bounding-box-badge ${
                      field.confidenceLevel === 'low' ? 'warning' : ''
                    }`}
                  >
                    AI Bounding Box
                  </span>

                  <div className="bounding-field-label">Extracted Region:</div>
                  <div className="bounding-raw-text">
                    {field.boundingSnippetText || `${field.name}: ${field.value}`}
                  </div>
                </div>

                <div className="sheet-line" style={{ width: '92%' }} />
                <div className="sheet-line" style={{ width: '75%' }} />
                <div className="sheet-line short" />
              </div>
            </div>
          </div>

          {/* Explainability Callout */}
          <div className="evidence-explain-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Sparkles size={15} style={{ color: '#60a5fa' }} />
              <strong>AI Extraction Transparency</strong>
            </div>
            <p>
              AI extracted this value from the highlighted document region. This direct link between
              the digital field and original physical document ensures all extracted information is
              traceable, auditable, and ready for validation against state land databases.
            </p>
          </div>

          {/* Attention guidance if low confidence */}
          {field.needsAttention && (
            <div
              style={{
                padding: '0.9rem 1.15rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '0.8rem',
                color: '#fef3c7',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
              }}
            >
              <ShieldAlert size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#fbbf24' }}>Attention Required During Validation:</strong>
                <p style={{ marginTop: '0.2rem', color: '#fde68a' }}>
                  This field was recognized with {field.confidence}% confidence due to handwritten
                  variations or ink degradation. It should be cross-verified in the next validation stage.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
