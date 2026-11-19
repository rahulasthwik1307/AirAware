'use client';

import React, { useEffect, useRef } from 'react';

interface CopilotDrawerShellProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const SAMPLE_PROMPT_CHIPS: readonly string[] = [
  'Why is pollution higher this morning?',
  'How does thermal inversion trap particulate matter?',
  'When is the best window to ventilate indoor rooms?',
  'Is electric rail cleaner than solo driving today?',
  'What is the difference between PM2.5 and PM10?',
];

export function CopilotDrawerShell({ isOpen, onClose }: CopilotDrawerShellProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-drawer-title"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-[var(--border-subtle)] text-[var(--ink-primary)]">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4 bg-[var(--surface-subtle)]/70">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-surface)] text-[var(--brand-primary)] text-base border border-[var(--border-subtle)]"
              aria-hidden="true"
            >
              🤖
            </div>
            <div>
              <h2
                id="copilot-drawer-title"
                className="text-sm font-bold text-[var(--ink-primary)] font-sans"
              >
                AI Air Copilot
              </h2>
              <span className="text-[10px] font-mono text-[var(--brand-primary)] font-bold uppercase tracking-wider">
                Phase 5 Architecture Preview
              </span>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-white text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            aria-label="Close AI Copilot drawer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Phase 5 Implementation Boundary Callout */}
          <div className="rounded-xl border border-[var(--brand-primary)]/30 bg-[var(--brand-surface)]/60 p-4 text-xs leading-relaxed text-[var(--ink-secondary)]">
            <div className="flex items-center gap-2 font-bold font-mono text-[var(--brand-primary)] uppercase text-[11px] mb-1">
              <span>⚡ Phase Boundary Governance</span>
            </div>
            <p>
              In accordance with the approved Master Specification, live conversational inference via Cloudflare Workers AI is scheduled for <strong>Phase 5</strong>.
            </p>
            <p className="mt-2 text-[11px] text-[var(--ink-muted)]">
              In this current <strong>Phase 2 release</strong>, all environmental intelligence is deterministic and grounded directly in verified Copernicus CAMS atmospheric model outputs.
            </p>
          </div>

          {/* Phase 5 Privacy Architecture Plan */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/50 p-4 text-xs text-[var(--ink-secondary)] space-y-1.5">
            <span className="font-bold text-[var(--ink-primary)] block font-sans">
              🔒 Phase 5 Privacy Architecture (Planned)
            </span>
            <p className="text-[11px] leading-relaxed">
              When remote AI inference is connected in Phase 5, an explicit server-side allowlist in <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-[var(--border-subtle)]">/api/ai/copilot</code> will enforce that only general city-level environmental context is transmitted. Zero personal names, household member schedules, exact residential coordinates, or health sensitivity data will ever be sent to Cloudflare Workers AI.
            </p>
            <p className="text-[10px] font-mono text-[var(--ink-muted)]">
              Current Phase 2 Status: Interface preview shell only. Zero network requests or AI inference calls are initiated from this component.
            </p>
          </div>

          {/* Sample Questions & Capabilities */}
          <div>
            <h3 className="text-xs font-bold font-mono text-[var(--ink-primary)] uppercase tracking-wider mb-2.5">
              Sample Inquiries (Phase 5 Pipeline)
            </h3>
            <div className="space-y-2">
              {SAMPLE_PROMPT_CHIPS.map((chip, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-[var(--border-subtle)] bg-white p-2.5 text-xs text-[var(--ink-secondary)] font-medium hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-surface)]/30 transition-all select-none"
                >
                  <span className="text-[var(--brand-primary)] font-bold mr-1.5 font-mono">Q:</span>
                  {chip}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]/50 p-4 text-center">
          <p className="text-[11px] font-mono text-[var(--ink-muted)]">
            Deterministic Rule Engine Active • Strict ₹0 Architecture
          </p>
        </div>
      </div>
    </div>
  );
}
