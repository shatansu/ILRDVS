'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Fingerprint, ArrowRight, CheckCircle2, AlertOctagon, RotateCcw } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import ProgressBar from '@/components/processing/ProgressBar';
import PipelineStages from '@/components/processing/PipelineStages';
import QualityScanCard from '@/components/processing/QualityScanCard';
import AiInsightCard from '@/components/processing/AiInsightCard';
import ProcessingActivityLog from '@/components/processing/ProcessingActivityLog';
import ProcessingErrorState from '@/components/processing/ProcessingErrorState';

import { documentService } from '@/services/documentService';
import type { ProcessingState } from '@/types';

import '@/styles/layout.css';
import '@/styles/processing.css';

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();

  // Extract dynamic documentId from route
  const rawId = params?.documentId;
  const documentId = Array.isArray(rawId) ? rawId[0] : (rawId as string) || '';

  const [state, setState] = useState<ProcessingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  const fetchRealStatus = useCallback(async () => {
    if (!documentId) return;

    try {
      setLoading(true);
      const res = await documentService.getProcessingStatus(documentId);
      setState(res);
      setLoading(false);

      // If document is completed and not rejected, schedule transition to /analysis
      if (res.status === 'completed' && !res.error) {
        const timer = setTimeout(() => {
          setIsNavigating(true);
          router.push(`/analysis/${encodeURIComponent(documentId)}`);
        }, 2200);
        return () => clearTimeout(timer);
      }
    } catch (err: any) {
      console.error('Failed to get real processing status:', err);
      setLoading(false);
    }
  }, [documentId, router]);

  useEffect(() => {
    fetchRealStatus();
  }, [fetchRealStatus]);

  if (loading || !state) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar activePage="upload" />
        <div className="main-content">
          <Topbar
            breadcrumbs={[
              { label: 'BhoomiVerify AI', href: '/' },
              { label: 'Upload', href: '/upload' },
              { label: 'AI Processing' },
            ]}
          />
          <main className="processing-page bg-grid" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
            <div className="glass-card" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
              <div className="animate-spin-slow" style={{ width: '48px', height: '48px', margin: '0 auto 1.5rem', color: 'var(--color-primary-light)' }}>
                <Fingerprint size={48} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Auditing Document Quality...
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Executing OpenCV quality analyzers and adaptive enhancements for: {documentId}
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isCompleted = state.status === 'completed' && !state.error;
  const isError = state.status === 'error' || Boolean(state.error);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activePage="upload" />

      <div className="main-content">
        <Topbar
          breadcrumbs={[
            { label: 'BhoomiVerify AI', href: '/' },
            { label: 'Upload', href: '/upload' },
            { label: 'AI Processing' },
          ]}
        />

        <main className="processing-page bg-grid">
          {/* Header */}
          <div className="processing-header">
            <div className="processing-header-top">
              <div className="processing-title-group">
                <h1 className="gradient-text">AI Document Processing</h1>
                <p className="processing-subtitle">
                  Autonomous document intelligence, quality scanning, and deep land record extraction.
                </p>
              </div>

              {/* Dynamic Status Badge */}
              <div
                className={`status-badge ${
                  isCompleted
                    ? 'status-badge-completed'
                    : isError
                    ? 'status-badge-error'
                    : 'status-badge-processing'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>QUALITY VERIFIED & ENHANCED</span>
                  </>
                ) : isError ? (
                  <>
                    <AlertOctagon size={16} />
                    <span>DOCUMENT REJECTED</span>
                  </>
                ) : (
                  <>
                    <div className="pulse-dot" />
                    <span>ANALYZING QUALITY</span>
                  </>
                )}
              </div>
            </div>

            {/* Document Info Bar */}
            <div className="doc-meta-card glass-card">
              <div className="doc-meta-item">
                <FileText size={16} className="doc-meta-icon" />
                <span className="doc-meta-label">Document:</span>
                <span className="doc-meta-value">{state.fileName}</span>
              </div>
              <div className="doc-meta-divider" />
              <div className="doc-meta-item">
                <Fingerprint size={16} className="doc-meta-icon" />
                <span className="doc-meta-label">Document ID:</span>
                <span className="doc-meta-value mono">{state.documentId}</span>
              </div>
            </div>
          </div>

          {/* If document was rejected due to severe low quality */}
          {isError && (
            <div
              className="glass-card"
              style={{
                padding: '2rem',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.05)',
                marginBottom: '1.5rem',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    flexShrink: 0,
                  }}
                >
                  <AlertOctagon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f87171', marginBottom: '0.35rem' }}>
                    Document Rejected: Severe Quality Degradation
                  </h3>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                    {state.error || 'The uploaded file does not meet the minimum readability threshold required for reliable OCR extraction. Laplacian blur variance or physical paper degradation is too severe.'}
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push('/upload')}
                    style={{ background: '#ef4444', borderColor: '#ef4444' }}
                  >
                    <RotateCcw size={16} />
                    <span>Upload Clearer Document</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Section */}
          <ProgressBar progress={state.progress} message={state.message} />

          {/* Main 2-Column Processing Grid */}
          <div className="processing-grid">
            {/* Left Column: Stages & Activity Log */}
            <div className="processing-left-col">
              <PipelineStages stages={state.stages} currentStageId={state.currentStageId} />
              <ProcessingActivityLog activities={state.activities} />
            </div>

            {/* Right Column: Real Quality Scan Preview & AI Insight */}
            <div className="processing-right-col">
              <QualityScanCard scan={state.qualityScan as any} />
              <AiInsightCard insight={state.aiInsight} />

              {/* Ready to view CTA if completed */}
              {isCompleted && (
                <div className="glass-card ready-cta-card">
                  <div className="ready-cta-content">
                    <CheckCircle2 size={24} className="ready-check-icon" />
                    <div>
                      <div className="ready-cta-title">Quality Verification Complete</div>
                      <div className="ready-cta-sub">
                        {isNavigating
                          ? 'Opening Document Intelligence dashboard...'
                          : 'Adaptive preprocessing applied. Staged for Phase 3 OCR.'}
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push(`/analysis/${encodeURIComponent(state.documentId)}`)}
                    disabled={isNavigating}
                  >
                    <span>View Document Intelligence</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
