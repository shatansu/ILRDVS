'use client';

import React from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { INDIAN_STATES, DOCUMENT_TYPES, SUPPORTED_LANGUAGES } from '@/constants';
import type { DocumentMetadata } from '@/types';

interface MetadataFormProps {
  metadata: DocumentMetadata;
  onChange: (metadata: DocumentMetadata) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function MetadataForm({
  metadata,
  onChange,
  isExpanded,
  onToggle,
}: MetadataFormProps) {
  const handleChange = (field: keyof DocumentMetadata, value: string) => {
    onChange({ ...metadata, [field]: value || undefined });
  };

  return (
    <div className="metadata-section">
      <div className="metadata-header">
        <div className="metadata-title">
          <Info size={16} style={{ color: 'var(--color-info)' }} />
          Document Metadata
          <span className="metadata-optional">(Optional — helps AI accuracy)</span>
        </div>
        <button type="button" className="metadata-toggle" onClick={onToggle}>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="metadata-grid">
          {/* State */}
          <div className="form-group">
            <label className="form-label" htmlFor="meta-state">State</label>
            <select
              id="meta-state"
              className="form-select"
              value={metadata.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div className="form-group">
            <label className="form-label" htmlFor="meta-district">District</label>
            <input
              id="meta-district"
              type="text"
              className="form-input"
              placeholder="Enter district"
              value={metadata.district || ''}
              onChange={(e) => handleChange('district', e.target.value)}
            />
          </div>

          {/* Tehsil */}
          <div className="form-group">
            <label className="form-label" htmlFor="meta-tehsil">Tehsil</label>
            <input
              id="meta-tehsil"
              type="text"
              className="form-input"
              placeholder="Enter tehsil"
              value={metadata.tehsil || ''}
              onChange={(e) => handleChange('tehsil', e.target.value)}
            />
          </div>

          {/* Village */}
          <div className="form-group">
            <label className="form-label" htmlFor="meta-village">Village</label>
            <input
              id="meta-village"
              type="text"
              className="form-input"
              placeholder="Enter village"
              value={metadata.village || ''}
              onChange={(e) => handleChange('village', e.target.value)}
            />
          </div>

          {/* Document Type */}
          <div className="form-group">
            <label className="form-label" htmlFor="meta-doctype">Document Type</label>
            <select
              id="meta-doctype"
              className="form-select"
              value={metadata.documentType || ''}
              onChange={(e) => handleChange('documentType', e.target.value)}
            >
              <option value="">Select Type</option>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="form-group">
            <label className="form-label" htmlFor="meta-year">Year</label>
            <input
              id="meta-year"
              type="text"
              className="form-input"
              placeholder="e.g., 2021"
              maxLength={4}
              value={metadata.year || ''}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                handleChange('year', val);
              }}
            />
          </div>

          {/* Language */}
          <div className="form-group">
            <label className="form-label" htmlFor="meta-language">Language</label>
            <select
              id="meta-language"
              className="form-select"
              value={metadata.language || ''}
              onChange={(e) => handleChange('language', e.target.value)}
            >
              <option value="">Auto-detect</option>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
