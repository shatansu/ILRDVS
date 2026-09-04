'use client';

import React from 'react';
import { Activity, CheckCircle2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number;
  message: string;
  isCompleted?: boolean;
}

export default function ProgressBar({
  progress,
  message,
  isCompleted = false,
}: ProgressBarProps) {
  return (
    <div className="progress-card glass-card">
      <div className="progress-header">
        <div className="progress-title">
          {isCompleted ? (
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          ) : (
            <Activity size={18} className="animate-pulse" style={{ color: 'var(--color-primary-light)' }} />
          )}
          <span>AI Processing Progress</span>
        </div>
        <div className="progress-percent">{progress}%</div>
      </div>

      <div className="progress-track">
        <div
          className={`progress-fill ${isCompleted ? 'completed' : ''}`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>

      <div className="progress-message">
        <span className="text-muted">Current status:</span>
        <span className="progress-message-text">{message}</span>
      </div>
    </div>
  );
}
