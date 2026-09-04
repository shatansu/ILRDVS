'use client';

import React from 'react';
import { ScanSearch, Check, AlertTriangle } from 'lucide-react';
import type { DocumentQualityScan } from '@/types';

interface QualityScanCardProps {
  scan: DocumentQualityScan;
}

export default function QualityScanCard({ scan }: QualityScanCardProps) {
  const metrics = [
    scan.resolution,
    scan.orientation,
    scan.blur,
    scan.contrast,
    scan.pageDamage,
    scan.brightness,
  ];

  return (
    <div className="quality-card glass-card">
      <div className="card-heading">
        <div className="card-title">
          <ScanSearch size={18} style={{ color: 'var(--color-primary-light)' }} />
          <span>DOCUMENT QUALITY SCAN</span>
        </div>
        <span className="card-tag">Preview</span>
      </div>

      {/* Quality Score Meter */}
      <div className="quality-score-container">
        <div className="quality-score-left">
          <div className="quality-score-label">Quality Score</div>
          <div className="quality-score-status">{scan.statusText}</div>
        </div>
        <div className="quality-score-display">
          <span className="score-number">{scan.score}</span>
          <span className="score-max">/ 100</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="quality-metrics-grid">
        {metrics.map((metric, i) => {
          const isGood = metric.status === 'good';
          const isWarning = metric.status === 'warning';

          return (
            <div key={i} className="metric-item">
              <span className="metric-label">{metric.label}</span>
              <div className="metric-value-row">
                <span className="metric-value">{metric.value}</span>
                <span
                  className={`metric-status-tag ${
                    isGood ? 'good' : isWarning ? 'warning' : 'error'
                  }`}
                >
                  {isGood && <Check size={12} strokeWidth={2.5} />}
                  {isWarning && <AlertTriangle size={12} />}
                  {metric.statusLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '1rem',
          fontSize: '0.72rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        * Prototype preview only. Complete quality inspection report is generated upon pipeline completion.
      </div>
    </div>
  );
}
