'use client';

import React from 'react';
import { Database, UserCheck, MapPin, Compass, FileCheck } from 'lucide-react';
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
  // Group fields by category
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
          {fields.length} Fields Extracted
        </span>
      </div>

      {categories.map((catKey) => {
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
      })}
    </div>
  );
}
