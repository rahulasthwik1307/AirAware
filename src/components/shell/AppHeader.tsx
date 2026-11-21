'use client';

import React from 'react';
import { WorkspaceKey } from '@/domain/types';

interface AppHeaderProps {
  readonly activeWorkspace: WorkspaceKey;
  readonly onSelectWorkspace: (workspace: WorkspaceKey) => void;
  readonly onOpenCopilot: () => void;
  readonly unreadAlertCount?: number;
  readonly onOpenNotifications?: () => void;
  readonly onOpenWelcome?: () => void;
}

interface WorkspaceTab {
  readonly key: WorkspaceKey;
  readonly label: string;
  readonly icon: string;
  readonly badge?: string;
}

const WORKSPACE_TABS: readonly WorkspaceTab[] = [
  { key: 'air-intelligence', label: 'Air Intelligence', icon: '🌍' },
  { key: 'family-planner', label: 'Family Planner', icon: '📅' },
  { key: 'indoor-air', label: 'Indoor Air', icon: '🏡' },
  { key: 'cleaner-choices', label: 'Choices & Impact', icon: '🌱' },
  { key: 'community-alerts', label: 'Community', icon: '📢' },
];

export function AppHeader({
  activeWorkspace,
  onSelectWorkspace,
  onOpenCopilot,
  unreadAlertCount = 0,
  onOpenNotifications,
  onOpenWelcome,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-xs">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Subtitle */}
        {onOpenWelcome ? (
          <button
            type="button"
            onClick={onOpenWelcome}
            className="flex items-center gap-3 shrink-0 text-left cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded-xl -ml-1 p-1 hover:bg-slate-50 transition-colors"
            title="View Platform Overview & 5-Workspace Guide"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-hover)] text-white font-black text-lg shadow-xs select-none transition-transform group-hover:scale-105"
              aria-hidden="true"
            >
              A
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[var(--ink-primary)] font-sans">
                  AirAware
                </span>
                <span className="inline-flex items-center rounded-full bg-[var(--brand-surface)] px-2 py-0.5 text-[10px] font-mono font-semibold text-[var(--brand-primary)] border border-[var(--border-subtle)]">
                  Open Science
                </span>
              </div>
              <span className="text-[11px] font-medium text-[var(--ink-muted)]">
                Global Environmental Intelligence
              </span>
            </div>
          </button>
        ) : (
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
                <span className="inline-flex items-center rounded-full bg-[var(--brand-surface)] px-2 py-0.5 text-[10px] font-mono font-semibold text-[var(--brand-primary)] border border-[var(--border-subtle)]">
                  Open Science
                </span>
              </div>
              <span className="text-[11px] font-medium text-[var(--ink-muted)]">
                Global Environmental Intelligence
              </span>
            </div>
          </div>
        )}

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

        {/* Action Triggers: Overview, Notification Bell & Copilot */}
        <div className="flex items-center gap-2">
          {/* Platform Overview / Welcome Tour Trigger */}
          {onOpenWelcome && (
            <button
              type="button"
              onClick={onOpenWelcome}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] text-xs font-mono font-semibold border border-[var(--border-subtle)] transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              title="View Platform Overview & 5-Workspace Guide"
            >
              <span>Overview</span>
            </button>
          )}

          {/* Universal Notification Bell */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--ink-primary)] hover:text-[var(--brand-primary)] border border-[var(--border-subtle)] transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              aria-label={`View notifications (${unreadAlertCount} unread)`}
              title="Open Notifications"
            >
              <span className="text-base select-none" aria-hidden="true">
                🔔
              </span>
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold shadow-xs">
                  {unreadAlertCount}
                </span>
              )}
            </button>
          )}

          {/* Global Copilot Drawer Trigger */}
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
          </button>
        </div>
      </div>
    </header>
  );
}
