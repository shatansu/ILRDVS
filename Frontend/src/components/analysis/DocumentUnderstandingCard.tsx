'use client';

import React from 'react';
import { BookOpen, Check } from 'lucide-react';
import type { DocumentUnderstanding } from '@/types';

interface DocumentUnderstandingCardProps {
  understanding: DocumentUnderstanding;
}

export default function DocumentUnderstandingCard({ understanding }: DocumentUnderstandingCardProps) {
  const items = [
    { key: 'Language', val: understanding.language },
    { key: 'Script', val: understanding.script },
    { key: 'Document Type', val: understanding.documentType },
    { key: 'Recognition Mode', val: understanding.recognitionMode },
    { key: 'Pages', val: `${understanding.pages} Pages` },
    { key: 'Layout', val: understanding.layout },
    { key: 'Overall Confidence', val: `${understanding.confidence}%` },
  ];

  return (
    <div className="intel-card glass-card">
      <div className="intel-card-header">
        <div className="intel-card-title">
          <BookOpen size={18} style={{ color: 'var(--color-primary-light)' }} />
          <span>Document Understanding</span>
        </div>
        <span className="card-tag">Classification</span>
      </div>

      <div className="understanding-list">
        {items.map((item, i) => (
          <div key={i} className="understanding-item">
            <span className="understanding-key">{item.key}</span>
            <span className="understanding-val">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
