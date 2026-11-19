'use client';

import React from 'react';
import { WorkspaceKey } from '@/domain/types';

interface MobileBottomNavProps {
  readonly activeWorkspace: WorkspaceKey;
  readonly onSelectWorkspace: (workspace: WorkspaceKey) => void;
}

interface NavItem {
  readonly key: WorkspaceKey;
  readonly label: string;
  readonly icon: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { key: 'air-intelligence', label: 'Air Intel', icon: '🌍' },
  { key: 'family-planner', label: 'Family Plan', icon: '📅' },
  { key: 'indoor-air', label: 'Indoor Air', icon: '🏡' },
  { key: 'cleaner-choices', label: 'Choices', icon: '🌱' },
];

export function MobileBottomNav({
  activeWorkspace,
  onSelectWorkspace,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Mobile Workspaces Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--surface-card)]/95 backdrop-blur-md shadow-lg"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = activeWorkspace === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectWorkspace(item.key)}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] px-2 py-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-[var(--brand-primary)] font-bold bg-[var(--brand-surface)] border border-[var(--border-subtle)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-lg select-none" aria-hidden="true">
                {item.icon}
              </span>
              <span className="text-[10px] font-mono tracking-tight mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
