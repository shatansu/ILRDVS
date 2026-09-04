'use client';

import React from 'react';
import { Award, Zap, FileSpreadsheet, AlertTriangle } from 'lucide-react';

interface SummaryMetricsRowProps {
  metrics: {
    qualityScore: number;
    qualityStatus: string;
    extractionConfidence: number;
    confidenceStatus: string;
    fieldsExtracted: number;
    totalFields: number;
    fieldsStatus: string;
    fieldsNeedingAttention: number;
    attentionStatus: string;
  };
}

export default function SummaryMetricsRow({ metrics }: SummaryMetricsRowProps) {
  return (
    <div className="metrics-row">
      {/* 1. Quality Score */}
      <div className="metric-card glass-card">
        <div className="metric-card-header">
          <span className="metric-card-title">Quality Score</span>
          <div className="metric-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Award size={18} />
          </div>
        </div>
        <div>
          <div className="metric-card-value">
            {metrics.qualityScore} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>/ 100</span>
          </div>
          <div className="metric-card-status warning">Status: {metrics.qualityStatus}</div>
        </div>
      </div>

      {/* 2. Extraction Confidence */}
      <div className="metric-card glass-card">
        <div className="metric-card-header">
          <span className="metric-card-title">Extraction Confidence</span>
          <div className="metric-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Zap size={18} />
          </div>
        </div>
        <div>
          <div className="metric-card-value">{metrics.extractionConfidence}%</div>
          <div className="metric-card-status good">Status: {metrics.confidenceStatus}</div>
        </div>
      </div>

      {/* 3. Fields Extracted */}
      <div className="metric-card glass-card">
        <div className="metric-card-header">
          <span className="metric-card-title">Fields Extracted</span>
          <div className="metric-card-icon" style={{ background: 'rgba(37, 99, 235, 0.15)', color: 'var(--color-primary-light)' }}>
            <FileSpreadsheet size={18} />
          </div>
        </div>
        <div>
          <div className="metric-card-value">
            {metrics.fieldsExtracted} <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>/ {metrics.totalFields}</span>
          </div>
          <div className="metric-card-status neutral">Status: {metrics.fieldsStatus}</div>
        </div>
      </div>

      {/* 4. Fields Needing Attention */}
      <div className="metric-card glass-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
        <div className="metric-card-header">
          <span className="metric-card-title">Fields Needing Attention</span>
          <div className="metric-card-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <AlertTriangle size={18} />
          </div>
        </div>
        <div>
          <div className="metric-card-value" style={{ color: '#fbbf24' }}>
            {metrics.fieldsNeedingAttention}
          </div>
          <div className="metric-card-status warning">Status: {metrics.attentionStatus}</div>
        </div>
      </div>
    </div>
  );
}
