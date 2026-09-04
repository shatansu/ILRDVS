'use client';

import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface ExtractionSummaryCardProps {
  summary: string;
}

export default function ExtractionSummaryCard({ summary }: ExtractionSummaryCardProps) {
  return (
    <div className="intel-card glass-card" style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(30, 41, 59, 0.7))' }}>
      <div className="intel-card-header">
        <div className="intel-card-title">
          <Sparkles size={18} style={{ color: '#60a5fa' }} />
          <span>AI Extraction Summary</span>
        </div>
        <span className="card-tag">Intelligence</span>
      </div>

      <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.6', marginBottom: '1rem' }}>
        {summary}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.76rem',
          color: 'var(--color-text-muted)',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        }}
      >
        <ShieldCheck size={14} style={{ color: '#10b981' }} />
        <span>
          Note: This represents preliminary AI-extracted information. Validation against land revenue databases occurs in the next phase.
        </span>
      </div>
    </div>
  );
}
