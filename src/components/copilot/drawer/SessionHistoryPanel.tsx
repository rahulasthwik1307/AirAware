'use client';

import React from 'react';
import { CopilotChatSession } from '@/lib/ai/chat-storage';
import { CopilotChatMessage } from '@/lib/ai/use-copilot';

interface SessionHistoryPanelProps {
  readonly sessions: readonly CopilotChatSession[];
  readonly activeSessionId: string;
  readonly onSwitchSession: (sessionId: string) => void;
  readonly onDeleteSession: (sessionId: string) => void;
  readonly onClearAllSessions: () => void;
  readonly onCloseHistory: () => void;
}

export function SessionHistoryPanel({
  sessions,
  activeSessionId,
  onSwitchSession,
  onDeleteSession,
  onClearAllSessions,
  onCloseHistory,
}: SessionHistoryPanelProps) {
  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/70 p-4 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 font-sans">
          <span>🕒</span>
          <span>Saved Conversations ({sessions.length})</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Stored Safely on Device</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 select-none">
        {sessions.map((sess) => {
          const isActive = sess.id === activeSessionId;
          const msgCount = sess.messages.filter((m: CopilotChatMessage) => m.sender === 'user').length;
          const formattedDate = new Date(sess.updatedAt).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={sess.id}
              onClick={() => {
                onSwitchSession(sess.id);
                onCloseHistory();
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                isActive
                  ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                  : 'bg-white/90 hover:bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {isActive && <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0 animate-pulse" />}
                  <h4 className="text-xs font-bold text-slate-900 truncate font-sans">
                    {sess.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                  <span>{formattedDate}</span>
                  <span>•</span>
                  <span>{msgCount} {msgCount === 1 ? 'question' : 'questions'}</span>
                </div>
              </div>

              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(sess.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  title="Delete chat thread"
                >
                  🗑️
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => {
            if (confirm('Clear all stored conversation history? This cannot be undone.')) {
              onClearAllSessions();
              onCloseHistory();
            }
          }}
          className="text-[11px] font-mono text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
        >
          🗑️ Clear All History
        </button>
        <button
          type="button"
          onClick={onCloseHistory}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer"
        >
          Back to Active Chat →
        </button>
      </div>
    </div>
  );
}
