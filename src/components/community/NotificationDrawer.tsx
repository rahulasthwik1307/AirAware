'use client';

import React, { useEffect } from 'react';
import { AlertItem } from '@/domain/community/types';
import { WorkspaceKey } from '@/domain/types';

interface NotificationDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly alerts: readonly AlertItem[];
  readonly unreadCount: number;
  readonly onMarkRead: (id: string) => void;
  readonly onMarkAllRead: () => void;
  readonly onNavigateWorkspace: (key: WorkspaceKey) => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  alerts,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onNavigateWorkspace,
}: NotificationDrawerProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Notification Centre"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
    >
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} aria-hidden="true" />

      {/* Slide-Over Drawer Panel */}
      <div className="w-full max-w-md bg-white border-l border-slate-200 h-full flex flex-col justify-between shadow-2xl p-5 sm:p-6 space-y-4 animate-slideLeft">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔔</span>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-[11px] font-mono font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Mark Read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 text-lg cursor-pointer"
              aria-label="Close notifications panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <span className="text-2xl block">✨</span>
              <p className="font-semibold text-slate-700">All clear!</p>
              <p>No active atmospheric warnings or alerts right now.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-2xl border text-xs space-y-2 transition-all ${
                  alert.isRead
                    ? 'bg-slate-50/70 border-slate-200 opacity-75'
                    : alert.severity === 'CRITICAL'
                    ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
                    : alert.severity === 'VENTILATION'
                    ? 'bg-teal-50/70 border-teal-300 shadow-2xs'
                    : 'bg-amber-50/70 border-amber-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      {alert.category.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-slate-900 leading-snug">
                      {alert.title}
                    </h3>
                  </div>

                  {!alert.isRead && (
                    <button
                      type="button"
                      onClick={() => onMarkRead(alert.id)}
                      className="text-[10px] font-mono text-slate-400 hover:text-slate-700 shrink-0 cursor-pointer"
                      title="Dismiss"
                    >
                      ✓
                    </button>
                  )}
                </div>

                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {alert.message}
                </p>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {alert.source}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onMarkRead(alert.id);
                      onNavigateWorkspace(alert.targetWorkspace);
                      onClose();
                    }}
                    className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                  >
                    Open Workspace →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>In-app notifications only</span>
          <span>Zero push tracking</span>
        </div>
      </div>
    </div>
  );
}
