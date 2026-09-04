'use client';

import React from 'react';
import { ScanSearch, Check, AlertTriangle, Info } from 'lucide-react';
import type { DocumentAnalysisResult } from '@/types';

interface DocumentQualityCardProps {
  quality: DocumentAnalysisResult['quality'];
}

export default function DocumentQualityCard({ quality }: DocumentQualityCardProps) {
  const metrics = [
    { title: 'Resolution', value: quality.resolution.value, status: quality.resolution.status, statusLabel: quality.resolution.label },
    { title: 'Orientation', value: quality.orientation.value, status: quality.orientation.status, statusLabel: quality.orientation.label },
    { title: 'Blur', value: quality.blur.value, status: quality.blur.status, statusLabel: quality.blur.label },
    { title: 'Contrast', value: quality.contrast.value, status: quality.contrast.status, statusLabel: quality.contrast.label },
    { title: 'Page Damage', value: quality.pageDamage.value, status: quality.pageDamage.status, statusLabel: quality.pageDamage.label },
    { title: 'Brightness', value: quality.brightness.value, status: quality.brightness.status, statusLabel: quality.brightness.label },
  ];

  return (
    <div className="intel-card glass-card">
      <div className="intel-card-header">
        <div className="intel-card-title">
          <ScanSearch size={18} style={{ color: 'var(--color-primary-light)' }} />
          <span>Document Quality</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="card-tag">Final Quality</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24' }}>
            {quality.score} / 100 ({quality.statusText})
          </span>
        </div>
      </div>

      <div className="quality-metrics-grid" style={{ marginBottom: '1.25rem' }}>
        {metrics.map((m, i) => {
          const isGood = m.status === 'good';
          const isWarning = m.status === 'warning';

          return (
            <div key={i} className="metric-item">
              <span className="metric-label">{m.title}</span>
              <div className="metric-value-row">
                <span className="metric-value">{m.value}</span>
                <span
                  className={`metric-status-tag ${
                    isGood ? 'good' : isWarning ? 'warning' : 'error'
                  }`}
                >
                  {isGood && <Check size={12} strokeWidth={2.5} />}
                  {isWarning && <AlertTriangle size={12} />}
                  {m.statusLabel === 'Good' || m.statusLabel === 'Fixed' ? `✓ ${m.statusLabel}` : `⚠ ${m.statusLabel}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: '0.75rem 1rem',
          background: 'rgba(37, 99, 235, 0.06)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.78rem',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
        }}
      >
        <Info size={15} style={{ color: 'var(--color-primary-light)', flexShrink: 0, marginTop: '2px' }} />
        <span>{quality.note}</span>
      </div>
    </div>
  );
}
