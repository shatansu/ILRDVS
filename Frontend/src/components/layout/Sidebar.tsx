'use client';

import React from 'react';
import {
  LayoutDashboard,
  Upload,
  FileStack,
  ShieldCheck,
  Database,
  Map,
  BarChart3,
  ScrollText,
  Settings,
} from 'lucide-react';
import { NAV_ITEMS } from '@/constants';

/** Icon map for sidebar navigation */
const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Upload,
  FileStack,
  ShieldCheck,
  Database,
  Map,
  BarChart3,
  ScrollText,
  Settings,
};

interface SidebarProps {
  activePage: string;
}

export default function Sidebar({ activePage }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">BV</div>
          <div>
            <div className="sidebar-title">BhoomiVerify AI</div>
            <div className="sidebar-subtitle">Land Record Intelligence</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Main</span>
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const Icon = IconMap[item.icon];
          const isActive = activePage === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              {Icon && <Icon className="sidebar-icon" />}
              <span>{item.label}</span>
              {'badge' in item && item.badge && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </a>
          );
        })}

        <span className="sidebar-section-label">Intelligence</span>
        {NAV_ITEMS.slice(4, 7).map((item) => {
          const Icon = IconMap[item.icon];
          const isActive = activePage === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              {Icon && <Icon className="sidebar-icon" />}
              <span>{item.label}</span>
            </a>
          );
        })}

        <span className="sidebar-section-label">System</span>
        {NAV_ITEMS.slice(7).map((item) => {
          const Icon = IconMap[item.icon];
          const isActive = activePage === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              {Icon && <Icon className="sidebar-icon" />}
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">RS</div>
          <div>
            <div className="sidebar-user-name">Rahul Sharma</div>
            <div className="sidebar-user-role">Revenue Officer</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
