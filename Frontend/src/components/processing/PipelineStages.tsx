'use client';

import React from 'react';
import { Check, Circle, Loader2, Layers } from 'lucide-react';
import type { PipelineStage } from '@/types';

interface PipelineStagesProps {
  stages: PipelineStage[];
  currentStageId: number;
}

export default function PipelineStages({ stages, currentStageId }: PipelineStagesProps) {
  const completedCount = stages.filter((s) => s.status === 'completed').length;

  return (
    <div className="pipeline-card glass-card">
      <div className="pipeline-card-header">
        <div className="pipeline-card-title">
          <Layers size={18} style={{ color: 'var(--color-primary-light)' }} />
          <span>AI Document Intelligence Pipeline</span>
        </div>
        <div className="pipeline-stage-counter">
          {completedCount} / {stages.length} Completed
        </div>
      </div>

      <div className="stages-list">
        {stages.map((stage) => {
          const isProcessing = stage.status === 'processing';
          const isCompleted = stage.status === 'completed';
          const isWaiting = stage.status === 'waiting';

          return (
            <div
              key={stage.id}
              className={`stage-item ${isProcessing ? 'processing' : ''} ${
                isCompleted ? 'completed' : ''
              } ${isWaiting ? 'waiting' : ''}`}
            >
              {/* Status Indicator */}
              <div
                className={`stage-indicator ${
                  isCompleted ? 'completed' : isProcessing ? 'processing' : 'waiting'
                }`}
              >
                {isCompleted && <Check size={16} strokeWidth={2.5} />}
                {isProcessing && <Loader2 size={15} className="animate-spin" />}
                {isWaiting && <Circle size={10} strokeWidth={2} />}
              </div>

              {/* Stage Content */}
              <div className="stage-content">
                <div className="stage-header-row">
                  <span className="stage-name">
                    {stage.id}. {stage.name}
                  </span>

                  {isCompleted && (
                    <span className="stage-badge completed">✓ Completed</span>
                  )}
                  {isProcessing && (
                    <span className="stage-badge processing">● Processing</span>
                  )}
                  {isWaiting && (
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                      ○ Waiting
                    </span>
                  )}
                </div>

                <div className="stage-desc">{stage.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
