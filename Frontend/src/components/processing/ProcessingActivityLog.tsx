'use client';

import React from 'react';
import { History } from 'lucide-react';
import type { ProcessingActivity } from '@/types';

interface ProcessingActivityLogProps {
  activities: ProcessingActivity[];
}

export default function ProcessingActivityLog({ activities }: ProcessingActivityLogProps) {
  // Sort reverse-chronological (newest first)
  const sortedActivities = [...activities].reverse();

  return (
    <div className="activity-card glass-card">
      <div className="card-heading">
        <div className="card-title">
          <History size={17} style={{ color: 'var(--color-primary-light)' }} />
          <span>Processing Activity</span>
        </div>
        <span className="card-tag">{activities.length} Events</span>
      </div>

      <div className="activity-list">
        {sortedActivities.map((act) => (
          <div key={act.id} className="activity-item">
            <span className="activity-time">{act.time}</span>
            <span className="activity-text">{act.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
