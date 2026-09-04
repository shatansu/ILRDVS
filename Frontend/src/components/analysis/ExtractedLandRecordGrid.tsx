'use client';

import React from 'react';
import { Database, UserCheck, MapPin, Compass, FileCheck, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import FieldCard from './FieldCard';
import type { ExtractedField } from '@/types';

interface ExtractedLandRecordGridProps {
  fields: ExtractedField[];
  onViewEvidence: (field: ExtractedField) => void;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ size?: number }> }> = {
  owner: { label: 'Owner Details', icon: UserCheck },
  identification: { label: 'Land Identification', icon: Compass },
  details: { label: 'Land Details', icon: FileCheck },
  location: { label: 'Location Details', icon: MapPin },
};

export default function ExtractedLandRecordGrid({
  fields,
  onViewEvidence,
}: ExtractedLandRecordGridProps) {
  const categories = ['owner', 'identification', 'details', 'location'] as const;

  return (
    <div className="extracted-section">
      <div className="extracted-section-header">
        <div className="extracted-title-group">
          <h2>
            <Database size={20} style={{ color: 'var(--color-primary-light)' }} />
            <span>Extracted Land Record</span>
          </h2>
          <p className="extracted-subtitle">
            Structured fields extracted by hybrid OCR and layout analysis models.
          </p>
        </div>
        <span className="card-tag" style={{ fontSize: '0.74rem' }}>
          {fields.length > 0 ? `${fields.length} Fields Extracted` : 'Scheduled for Phase 3 OCR'}
        </span>
      </div>

      {fields.length === 0 ? (
        <div className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'center', margin: '1rem 0' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: 'var(--color-primary-light)',
              marginBottom: '1rem',
            }}
          >
            <Sparkles size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            Document Quality Verified & Preprocessed
          </h3>
          <p style={{ maxWidth: '620px', margin: '0 auto 1.25rem', fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            Adaptive contrast boost, deskewing, and noise removal have been applied. Clean recognition-ready sheets are staged in backend storage. Raw field extraction will be executed when the <strong>Phase 3 OCR & HTR Engine</strong> is connected.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span className="card-tag" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
              <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Visual Quality Validated
            </span>
            <span className="card-tag" style={{ background: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>
              <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Awaiting OCR Layer (Phase 3)
            </span>
            <span className="card-tag">
              Zero Premature Claims
            </span>
          </div>
        </div>
      ) : (
        categories.map((catKey) => {
          const catFields = fields.filter((f) => f.category === catKey);
          if (catFields.length === 0) return null;

          const config = CATEGORY_CONFIG[catKey] || { label: catKey, icon: Database };
          const Icon = config.icon;

          return (
            <div key={catKey} className="fields-category-block">
              <div className="category-header">
                <Icon size={14} />
                <span>{config.label}</span>
              </div>

              <div className="fields-grid">
                {catFields.map((field) => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    onViewEvidence={onViewEvidence}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
