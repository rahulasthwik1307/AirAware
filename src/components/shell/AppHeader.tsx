'use client';

import React from 'react';
import { WorkspaceKey } from '@/domain/types';

interface AppHeaderProps {
  readonly activeWorkspace: WorkspaceKey;
  readonly onSelectWorkspace: (workspace: WorkspaceKey) => void;
  readonly onOpenCopilot: () => void;
}

interface WorkspaceTab {
  readonly key: WorkspaceKey;
  readonly label: string;
  readonly icon: string;
  readonly badge?: string;
}

const WORKSPACE_TABS: readonly WorkspaceTab[] = [
  { key: 'air-intelligence', label: 'Air Intelligence', icon: '🌍' },
  { key: 'family-planner', label: 'Family Planner', icon: '📅', badge: 'Phase 3' },
  { key: 'indoor-air', label: 'Indoor Air', icon: '🏡', badge: 'Phase 4' },
  { key: 'cleaner-choices', label: 'Choices & Impact', icon: '🌱', badge: 'Phase 6' },
];

export function AppHeader({
  activeWorkspace,
  onSelectWorkspace,
  onOpenCopilot,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--surface-card)]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Subtitle */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-hover)] text-white font-black text-lg shadow-xs select-none"
            aria-hidden="true"
          >
            A
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-[var(--ink-primary)] font-sans">
                AirAware
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-surface)] px-2 py-0.5 text-[10px] font-mono font-semibold text-[var(--brand-primary)] border border-[var(--border-subtle)]">
                Open Science
              </span>
            </div>
            <span className="text-[11px] font-medium text-[var(--ink-muted)]">
              Global Environmental Intelligence
            </span>
          </div>
        </div>

        {/* Desktop / Tablet Segmented Workspace Switcher */}
        <nav
          aria-label="Application Workspaces"
          className="hidden md:inline-flex items-center p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border-subtle)]"
        >
          {WORKSPACE_TABS.map((tab) => {
            const isActive = activeWorkspace === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSelectWorkspace(tab.key)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[var(--brand-primary)] shadow-xs border border-[var(--border-subtle)] font-bold'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-white/50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-sm select-none" aria-hidden="true">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.badge && !isActive && (
                  <span className="hidden lg:inline-block ml-0.5 text-[9px] font-mono font-normal text-[var(--ink-muted)] bg-[var(--surface-subtle)] px-1.5 py-0.2 rounded border border-[var(--border-subtle)]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Global Copilot Drawer Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCopilot}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--brand-surface)] text-[var(--ink-primary)] hover:text-[var(--brand-primary)] text-xs font-mono font-bold border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            aria-label="Open AI Air Copilot panel"
          >
            <span className="text-sm select-none" aria-hidden="true">
              🤖
            </span>
            <span className="hidden sm:inline">Ask Copilot</span>
            <span className="text-[10px] font-mono text-[var(--ink-muted)] border border-[var(--border-subtle)] bg-white px-1 py-0.2 rounded hidden lg:inline">
              Preview
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
