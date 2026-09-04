'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FileText, Fingerprint, ArrowRight, CheckCircle2 } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import ProgressBar from '@/components/processing/ProgressBar';
import PipelineStages from '@/components/processing/PipelineStages';
import QualityScanCard from '@/components/processing/QualityScanCard';
import AiInsightCard from '@/components/processing/AiInsightCard';
import ProcessingActivityLog from '@/components/processing/ProcessingActivityLog';
import ProcessingErrorState from '@/components/processing/ProcessingErrorState';

import {
  getInitialProcessingState,
  startMockProcessing,
} from '@/services/mockProcessingService';
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

  // Retrieve cached filename if available from upload step
  const meta = documentService.getDocumentMeta(documentId);
  const initialFileName = meta?.fileName || 'Land-Record-Document.pdf';

  const [state, setState] = useState<ProcessingState>(() =>
    getInitialProcessingState(documentId, initialFileName)
  );

  const [isNavigating, setIsNavigating] = useState(false);
  const cancelProcessingRef = useRef<(() => void) | null>(null);

  const handleComplete = useCallback(
    (completedDocId: string) => {
      // Auto-navigate to /analysis/:documentId after a short 1.4s delay so user sees completion
      setTimeout(() => {
        setIsNavigating(true);
        router.push(`/analysis/${encodeURIComponent(completedDocId)}`);
      }, 1400);
    },
    [router]
  );

  const startPipeline = useCallback(() => {
    if (!documentId) return;

    // Clean up previous run if any
    if (cancelProcessingRef.current) {
      cancelProcessingRef.current();
    }

    const cancel = startMockProcessing(
      documentId,
      initialFileName,
      (updatedState) => setState(updatedState),
      handleComplete
    );

    cancelProcessingRef.current = cancel;
  }, [documentId, initialFileName, handleComplete]);

  useEffect(() => {
    startPipeline();
    return () => {
      if (cancelProcessingRef.current) {
        cancelProcessingRef.current();
      }
    };
  }, [startPipeline]);

  const handleRetry = () => {
    setState(getInitialProcessingState(documentId, initialFileName));
    startPipeline();
  };

  const isCompleted = state.status === 'completed';
  const isError = state.status === 'error';

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
                <span className={`badge-dot ${!isCompleted && !isError ? 'pulse' : ''}`} />
                {isCompleted ? 'ANALYSIS COMPLETE' : isError ? 'FAILED' : 'PROCESSING'}
              </div>
            </div>

            {/* Document Metadata Banner (Dynamic Name, ID, Status) */}
            <div className="document-meta-banner">
              <div className="meta-item">
                <div className="meta-icon-box doc">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="meta-label">Document Name</div>
                  <div className="meta-value" title={state.fileName}>
                    {state.fileName}
                  </div>
                </div>
              </div>

              <div className="meta-item">
                <div className="meta-icon-box id">
                  <Fingerprint size={20} />
                </div>
                <div>
                  <div className="meta-label">Document ID</div>
                  <div className="meta-value mono">{state.documentId}</div>
                </div>
              </div>

              <div className="meta-item">
                <div>
                  <div className="meta-label">Current Pipeline Stage</div>
                  <div className="meta-value" style={{ fontSize: '0.9rem', color: '#93c5fd' }}>
                    {isCompleted
                      ? 'Analysis Ready'
                      : `${state.currentStageId}. ${
                          state.stages.find((s) => s.id === state.currentStageId)?.name || 'Processing'
                        }`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error View if triggered */}
          {isError && <ProcessingErrorState error={state.error} onRetry={handleRetry} />}

          {/* Main 2-Column Processing Grid */}
          {!isError && (
            <div className="processing-grid">
              {/* Left Column: Progress & Pipeline Stages */}
              <div className="pipeline-column">
                <ProgressBar
                  progress={state.progress}
                  message={state.message}
                  isCompleted={isCompleted}
                />

                <PipelineStages
                  stages={state.stages}
                  currentStageId={state.currentStageId}
                />

                {/* Completion notification banner */}
                {isCompleted && (
                  <div className="completion-banner">
                    <div className="completion-left">
                      <div className="completion-icon">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <div className="completion-title">AI Processing Completed</div>
                        <div className="completion-sub">
                          {isNavigating
                            ? 'Redirecting to Document Intelligence...'
                            : 'All 9 stages verified. Preparing analysis report...'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        router.push(`/analysis/${encodeURIComponent(state.documentId)}`)
                      }
                    >
                      <span>View Analysis</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Quality Scan Preview, AI Insight & Activity */}
              <div className="insight-column">
                <QualityScanCard scan={state.qualityScan} />

                <AiInsightCard insight={state.aiInsight} />

                <ProcessingActivityLog activities={state.activities} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
