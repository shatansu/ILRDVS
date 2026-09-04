'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface AiInsightCardProps {
  insight: string;
}

export default function AiInsightCard({ insight }: AiInsightCardProps) {
  return (
    <div className="ai-insight-card">
      <div className="ai-insight-header">
        <Sparkles size={16} style={{ color: '#60a5fa' }} />
        <span className="ai-insight-title">AI Insight</span>
      </div>
      <p className="ai-insight-text">{insight}</p>
    </div>
  );
}
