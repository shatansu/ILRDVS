'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

import DocumentSummaryBanner from '@/components/analysis/DocumentSummaryBanner';
import SummaryMetricsRow from '@/components/analysis/SummaryMetricsRow';
import DocumentQualityCard from '@/components/analysis/DocumentQualityCard';
import DocumentUnderstandingCard from '@/components/analysis/DocumentUnderstandingCard';
import ExtractedLandRecordGrid from '@/components/analysis/ExtractedLandRecordGrid';
import EvidenceDrawer from '@/components/analysis/EvidenceDrawer';
import LowConfidenceAlert from '@/components/analysis/LowConfidenceAlert';
import ExtractionSummaryCard from '@/components/analysis/ExtractionSummaryCard';
import ProvenanceCard from '@/components/analysis/ProvenanceCard';

import { documentService } from '@/services/documentService';
import type { DocumentAnalysisResult, ExtractedField } from '@/types';

import '@/styles/layout.css';
import '@/styles/analysis.css';

export default function DocumentIntelligencePage() {
  const params = useParams();
  const router = useRouter();

  // Extract dynamic documentId from route
  const rawId = params?.documentId;
  const documentId = Array.isArray(rawId) ? rawId[0] : (rawId as string) || '';

  const [data, setData] = useState<DocumentAnalysisResult | null>(null);
  const [selectedEvidenceField, setSelectedEvidenceField] = useState<ExtractedField | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;

    let isMounted = true;
    // Load document intelligence data from service
    documentService
      .getDocumentAnalysis(documentId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load analysis result:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar activePage="upload" />
        <div className="main-content">
          <Topbar
            breadcrumbs={[
              { label: 'BhoomiVerify AI', href: '/' },
              { label: 'Upload', href: '/upload' },
              { label: 'AI Processing', href: `/processing/${encodeURIComponent(documentId)}` },
              { label: 'Document Intelligence' },
            ]}
          />
          <main className="analysis-page bg-grid" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
            <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
              <div className="animate-spin-slow" style={{ width: '48px', height: '48px', margin: '0 auto 1.5rem', color: 'var(--color-primary-light)' }}>
                <Cpu size={48} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Loading Document Intelligence...
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Compiling extraction results for Document ID: {documentId}
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activePage="upload" />

      <div className="main-content">
        <Topbar
          breadcrumbs={[
            { label: 'BhoomiVerify AI', href: '/' },
            { label: 'Upload', href: '/upload' },
            { label: 'AI Processing', href: `/processing/${encodeURIComponent(documentId)}` },
            { label: 'Document Intelligence' },
          ]}
        />

        <main className="analysis-page bg-grid">
          {/* Header */}
          <div className="analysis-header">
            <div className="analysis-title-group">
              <h1 className="gradient-text">Document Intelligence</h1>
              <p className="analysis-subtitle">
                AI-extracted information, document quality analysis, and field-level confidence breakdown.
              </p>
            </div>

            {/* Status Badge */}
            <div className="status-badge status-badge-completed">
              <CheckCircle2 size={16} />
              <span>ANALYSIS COMPLETE</span>
            </div>
          </div>

          {/* Document Summary Horizontal Banner */}
          <DocumentSummaryBanner
            fileName={data.fileName}
            documentId={data.documentId}
            pages={data.pages}
            processingMode={data.processingMode}
          />

          {/* Top 4 Summary Metrics */}
          <SummaryMetricsRow metrics={data.metrics} />

          {/* Middle Row: Document Quality & Document Understanding */}
          <div className="analysis-middle-grid">
            <DocumentQualityCard quality={data.quality} />
            <DocumentUnderstandingCard understanding={data.understanding} />
          </div>

          {/* Low Confidence Warning Alert */}
          <LowConfidenceAlert warning={data.lowConfidenceWarning} />

          {/* HERO SECTION: Extracted Land Record */}
          <ExtractedLandRecordGrid
            fields={data.fields}
            onViewEvidence={(field) => setSelectedEvidenceField(field)}
          />

          {/* Bottom Grid: AI Summary & Provenance */}
          <div className="analysis-bottom-grid">
            <ExtractionSummaryCard summary={data.aiSummary} />
            <ProvenanceCard provenance={data.provenance} />
          </div>

          {/* Navigation Action Footer */}
          <div className="analysis-footer-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => router.push(`/processing/${encodeURIComponent(documentId)}`)}
            >
              <ArrowLeft size={16} />
              <span>Back to Processing</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-validate-hero"
              onClick={() => router.push(`/validation/${encodeURIComponent(documentId)}`)}
            >
              <span>Validate Extracted Record</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Evidence-Linked Extraction Drawer / Modal */}
          <EvidenceDrawer
            field={selectedEvidenceField}
            onClose={() => setSelectedEvidenceField(null)}
          />
        </main>
      </div>
    </div>
  );
}
