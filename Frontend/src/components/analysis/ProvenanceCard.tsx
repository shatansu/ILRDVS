'use client';

import React from 'react';
import { ScrollText, CheckCircle2 } from 'lucide-react';
import type { DocumentAnalysisResult } from '@/types';

interface ProvenanceCardProps {
  provenance: DocumentAnalysisResult['provenance'];
}

export default function ProvenanceCard({ provenance }: ProvenanceCardProps) {
  const items = [
    { key: 'Document ID', val: provenance.documentId, isMono: true },
    { key: 'Source', val: provenance.source },
    { key: 'Pages Analyzed', val: `${provenance.pagesAnalyzed} Pages` },
    { key: 'Extraction Engine', val: provenance.extractionEngine },
    { key: 'Processing State', val: provenance.processingState, isSuccess: true },
    { key: 'Timestamp', val: provenance.timestamp },
  ];

  return (
    <div className="intel-card glass-card">
      <div className="intel-card-header">
        <div className="intel-card-title">
          <ScrollText size={18} style={{ color: 'var(--color-primary-light)' }} />
          <span>Extraction Provenance</span>
        </div>
        <span className="card-tag">Audit</span>
      </div>

      <div className="provenance-list">
        {items.map((item, i) => (
          <div key={i} className="provenance-item">
            <span className="provenance-key">{item.key}</span>
            <span
              className={`provenance-val ${item.isMono ? 'mono' : ''}`}
              style={item.isSuccess ? { color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem' } : undefined}
            >
              {item.isSuccess && <CheckCircle2 size={13} />}
              {item.val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
