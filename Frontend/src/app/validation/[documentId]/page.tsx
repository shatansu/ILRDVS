'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, Fingerprint } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

import '@/styles/layout.css';

export default function ValidationPlaceholderPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params?.documentId;
  const documentId = Array.isArray(rawId) ? rawId[0] : (rawId as string) || '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activePage="upload" />

      <div className="main-content">
        <Topbar
          breadcrumbs={[
            { label: 'BhoomiVerify AI', href: '/' },
            { label: 'Upload', href: '/upload' },
            { label: 'Document Intelligence', href: `/analysis/${encodeURIComponent(documentId)}` },
            { label: 'Validation' },
          ]}
        />

        <main className="upload-page bg-grid" style={{ maxWidth: '900px', margin: '3rem auto' }}>
          <div className="glass-card" style={{ padding: '3.5rem 2.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(37, 99, 235, 0.15)',
                color: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <ShieldCheck size={34} />
            </div>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              <span className="gradient-text">Cross-Verification & Validation</span>
            </h1>

            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '540px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
              Screen 4 (Multi-source Cross-Verification, Ownership Validation & Anomaly Detection) will be implemented in the next phase.
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '1rem 1.75rem',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '2.5rem',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Fingerprint size={22} style={{ color: 'var(--color-accent-light)' }} />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Document ID for Validation
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary-light)', fontSize: '0.95rem' }}>
                    {documentId}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => router.push(`/analysis/${encodeURIComponent(documentId)}`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ArrowLeft size={16} />
                Back to Document Intelligence
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
