'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WorkspaceKey, AirQualityReport, GeoLocation } from '@/domain/types';
import { RoomContext } from '@/lib/ai/types';
import { HouseholdStorageState, HouseholdMember } from '@/domain/household/types';
import { useAirCopilot } from '@/lib/ai/use-copilot';
import { WORKSPACE_PROMPT_CHIPS, WORKSPACE_LABELS } from '@/components/copilot/drawer/constants';
import { MessageBubble } from '@/components/copilot/drawer/MessageBubble';
import { SessionHistoryPanel } from '@/components/copilot/drawer/SessionHistoryPanel';
import { CopilotInputArea } from '@/components/copilot/drawer/CopilotInputArea';

export { WORKSPACE_PROMPT_CHIPS, WORKSPACE_LABELS } from '@/components/copilot/drawer/constants';

interface CopilotDrawerShellProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly activeWorkspace: WorkspaceKey;
  readonly initialPrompt?: string | null;
  readonly roomContext?: RoomContext | null;
  readonly report?: AirQualityReport | null;
  readonly location?: GeoLocation | null;
  readonly householdState?: HouseholdStorageState | null;
  readonly activeMember?: HouseholdMember | null;
}

export function CopilotDrawerShell({
  isOpen,
  onClose,
  activeWorkspace,
  initialPrompt,
  roomContext,
  report,
  location,
  householdState,
  activeMember,
}: CopilotDrawerShellProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    sessions,
    activeSessionId,
    messages,
    inputQuery,
    setInputQuery,
    isThinking,
    cooldownSeconds,
    isDailyQuotaExhausted,
    sendMessage,
    createNewSession,
    switchSession,
    deleteSession,
    clearAllSessions,
  } = useAirCopilot({
    activeWorkspace,
    report,
    location,
    roomContext,
    householdState,
    activeMember,
  });

  // Handle focus trapping and Escape key
  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement as HTMLElement | null;
      closeButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (isHistoryOpen) {
            setIsHistoryOpen(false);
          } else {
            onClose();
          }
          return;
        }

        if (e.key === 'Tab') {
          const focusables = drawerRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables && focusables.length > 0) {
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    } else if (openerRef.current) {
      openerRef.current.focus();
    }
  }, [isOpen, onClose, isHistoryOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle auto-seeding initial prompt when opening from an in-situ card
  const dispatchedPromptRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      dispatchedPromptRef.current = null;
      return;
    }

    if (initialPrompt && dispatchedPromptRef.current !== initialPrompt) {
      dispatchedPromptRef.current = initialPrompt;
      setIsHistoryOpen(false);
      sendMessage(initialPrompt, roomContext);
    }
  }, [isOpen, initialPrompt, roomContext, sendMessage]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen && !isHistoryOpen) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, isThinking, isOpen, isHistoryOpen]);

  if (!isOpen || !mounted) {
    return null;
  }

  const chips = WORKSPACE_PROMPT_CHIPS[activeWorkspace] || WORKSPACE_PROMPT_CHIPS['air-intelligence'];
  const workspaceLabel = WORKSPACE_LABELS[activeWorkspace];

  const drawerContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-drawer-title"
      className="fixed inset-0 z-[100] flex justify-end animate-fadeIn"
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div
        ref={drawerRef}
        className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out border-l border-[var(--border-subtle)]"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5 bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white text-sm font-bold shadow-xs shrink-0"
              aria-hidden="true"
            >
              🤖
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="copilot-drawer-title"
                  className="text-sm font-bold text-[var(--ink-primary)] font-sans truncate"
                >
                  AI Air Copilot
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[var(--brand-primary)] border border-[var(--border-subtle)] font-bold shrink-0">
                  Global Assistant
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--ink-muted)] block mt-0.5 truncate">
                Context: {workspaceLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Session History Toggle Button */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer tactile-btn flex items-center gap-1.5 ${
                isHistoryOpen
                  ? 'bg-teal-700 text-white border-teal-700 shadow-2xs font-bold'
                  : 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200'
              }`}
              title="View saved conversation history"
            >
              <span>🕒</span>
              <span>History ({sessions.length})</span>
            </button>

            {/* New Chat Button */}
            <button
              type="button"
              onClick={() => {
                createNewSession();
                setIsHistoryOpen(false);
              }}
              className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all cursor-pointer tactile-btn flex items-center gap-1"
              title="Start a new clean chat thread"
            >
              <span>+</span>
              <span>New</span>
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-white text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition-all cursor-pointer tactile-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ml-1"
              aria-label="Close AI Copilot drawer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Daily Quota / Cooldown Status Banners */}
        {isDailyQuotaExhausted && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] font-mono flex items-center gap-2">
            <span>🛡️</span>
            <span>Daily Cloudflare AI free allowance reached. Switched to offline deterministic rule engine.</span>
          </div>
        )}

        {cooldownSeconds !== null && cooldownSeconds > 0 && (
          <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 text-rose-900 text-[11px] font-mono flex items-center justify-between">
            <span>⚠️ Rate limit active (max 30 requests / 10 min)</span>
            <span className="font-bold">Available in {cooldownSeconds}s</span>
          </div>
        )}

        {/* Conditional View: Session History Panel OR Active Message Stream */}
        {isHistoryOpen ? (
          <SessionHistoryPanel
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSwitchSession={switchSession}
            onDeleteSession={deleteSession}
            onClearAllSessions={clearAllSessions}
            onCloseHistory={() => setIsHistoryOpen(false)}
          />
        ) : (
          <>
            {/* Conversation Message Stream */}
            <div
              role="log"
              aria-live="polite"
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
            >
              {messages.map((msg, idx) => {
                const prevUserMsg =
                  idx > 0 && messages[idx - 1]?.sender === 'user' ? messages[idx - 1]?.text : '';
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    userQuestion={prevUserMsg || ''}
                    report={report}
                    onSelectPrompt={(text) => {
                      setInputQuery(text);
                      sendMessage(text);
                      inputRef.current?.focus();
                    }}
                  />
                );
              })}

              {/* Thinking / Generation Indicator */}
              {isThinking && (
                <div
                  className="flex items-start gap-2.5 animate-fadeIn"
                  role="status"
                  aria-live="polite"
                >
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-surface)] text-[var(--brand-primary)] text-xs border border-[var(--brand-primary)]/30 font-bold shrink-0 mt-0.5"
                    aria-hidden="true"
                  >
                    🤖
                  </div>
                  <div className="rounded-2xl rounded-tl-xs bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--ink-muted)] flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-primary)] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-primary)]" />
                    </span>
                    <span className="font-mono text-[11px]">Thinking… Evaluating atmospheric physics &amp; guidance...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input & Suggested Inquiries Area */}
            <CopilotInputArea
              chips={chips}
              activeWorkspaceLabel={workspaceLabel}
              inputQuery={inputQuery}
              setInputQuery={setInputQuery}
              sendMessage={(q) => {
                sendMessage(q);
                inputRef.current?.focus();
              }}
              isThinking={isThinking}
              cooldownSeconds={cooldownSeconds}
              inputRef={inputRef}
            />
          </>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
