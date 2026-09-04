'use client';

import React from 'react';
import { ChevronRight, Bell, Zap } from 'lucide-react';

interface TopbarProps {
  breadcrumbs: { label: string; href?: string }[];
}

export default function Topbar({ breadcrumbs }: TopbarProps) {
  return (
    <header className="topbar">
      {/* Breadcrumbs */}
      <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={14} />}
            {i === breadcrumbs.length - 1 ? (
              <span className="topbar-breadcrumb-active">{crumb.label}</span>
            ) : (
              <a href={crumb.href || '#'} style={{ color: 'inherit', textDecoration: 'none' }}>
                {crumb.label}
              </a>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="topbar-actions">
        <div className="topbar-status">
          <span className="topbar-status-dot" />
          <Zap size={14} />
          <span>AI Engine Online</span>
        </div>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}
