'use client';

import React, { useState } from 'react';
import { AlertItem, AlertCategory } from '@/domain/community/types';
import { WorkspaceKey } from '@/domain/types';

interface AirshedAlertFeedCardProps {
  readonly alerts: readonly AlertItem[];
  readonly onMarkRead: (id: string) => void;
  readonly onMarkAllRead: () => void;
  readonly onNavigateWorkspace: (key: WorkspaceKey) => void;
  readonly onAskCopilot: (prompt: string) => void;
}

export function AirshedAlertFeedCard({
  alerts,
  onMarkRead,
  onMarkAllRead,
  onNavigateWorkspace,
  onAskCopilot,
}: AirshedAlertFeedCardProps) {
  const [filter, setFilter] = useState<'ALL' | AlertCategory>('ALL');

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'ALL') return true;
    return alert.category === filter;
  });

  const getWorkspaceActionLabel = (ws: WorkspaceKey) => {
    switch (ws) {
      case 'air-intelligence':
        return 'View Airshed Forecast →';
      case 'family-planner':
        return 'Adjust Family Routines →';
      case 'indoor-air':
        return 'Review Indoor Hacks →';
      case 'cleaner-choices':
        return 'Simulate Transit Savings →';
      default:
        return 'Explore Details →';
    }
  };

  const getSeverityBadge = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-full border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            CRITICAL
          </span>
        );
      case 'VENTILATION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-300">
            <span>🪟</span>
            VENTILATION WINDOW
          </span>
        );
      case 'ADVISORY':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
            <span>⚠️</span>
            ADVISORY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300">
            <span>ℹ️</span>
            COMMUNITY
          </span>
        );
    }
  };

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-4 transition-shadow hover:shadow-md"
      aria-labelledby="airshed-alerts-heading"
    >
      {/* Header with Copilot Trigger */}
      <div className="flex flex-col gap-1.5 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              📢
            </span>
            <h2
              id="airshed-alerts-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] truncate font-sans tracking-tight"
            >
              Verified Atmospheric &amp; Regulatory Alert Stream
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              onAskCopilot(
                'What are the mandatory restrictions under the current CAQM GRAP stage in Delhi NCR? How should our housing society and family handle morning inversion smog?'
              )
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="Ask Copilot about active alerts and GRAP restrictions"
          >
            <span className="text-sm">🤖</span>
            <span>Ask Copilot</span>
          </button>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200 shrink-0">
              Live Airshed Bulletins
            </span>
            <p className="text-xs text-[var(--ink-secondary)] truncate">
              Authoritative triggers derived from Copernicus CAMS, CPCB NAQI, and CAQM mandates.
            </p>
          </div>
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[11px] font-mono font-bold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
          >
            ✓ Mark All Read
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Alerts ({alerts.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('GRAP_REGULATORY')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
            filter === 'GRAP_REGULATORY'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          🚨 GRAP Mandates
        </button>
        <button
          type="button"
          onClick={() => setFilter('VENTILATION_WINDOW')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
            filter === 'VENTILATION_WINDOW'
              ? 'bg-teal-700 text-white shadow-2xs'
              : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
          }`}
        >
          🪟 Airing Windows
        </button>
        <button
          type="button"
          onClick={() => setFilter('FAMILY_HEALTH')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
            filter === 'FAMILY_HEALTH'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          🚸 Family Health
        </button>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
            No active alerts in this category for the current atmospheric conditions.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                alert.isRead
                  ? 'bg-slate-50/70 border-slate-200 opacity-80'
                  : alert.severity === 'CRITICAL'
                  ? 'bg-rose-50/50 border-rose-300 shadow-2xs'
                  : alert.severity === 'VENTILATION'
                  ? 'bg-teal-50/50 border-teal-300 shadow-2xs'
                  : 'bg-amber-50/40 border-amber-300 shadow-2xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(alert.severity)}
                    <span className="text-[10px] font-mono text-slate-400">
                      Provenance: {alert.source}
                    </span>
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="New unread alert" />
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {alert.title}
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {alert.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onMarkRead(alert.id)}
                  className="text-[10px] font-mono text-slate-400 hover:text-slate-700 shrink-0 self-start sm:self-auto cursor-pointer"
                  title="Toggle read status"
                >
                  {alert.isRead ? 'Mark Unread' : 'Dismiss'}
                </button>
              </div>

              {/* Actionable Step & Deep-Link Ribbon */}
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-slate-800 shrink-0 text-[11px]">Action:</span>
                  <p className="text-slate-600 truncate text-[11px]">{alert.actionableStep}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateWorkspace(alert.targetWorkspace)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 transition-colors shrink-0 shadow-2xs cursor-pointer"
                >
                  {getWorkspaceActionLabel(alert.targetWorkspace)}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Provenance Footer */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🛡️</span>
          <span>
            Verified atmospheric telemetry alerts refresh with live Copernicus CAMS and Open-Meteo feeds.
          </span>
        </div>
      </div>
    </article>
  );
}
