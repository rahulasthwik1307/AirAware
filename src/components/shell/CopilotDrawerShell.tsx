'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WorkspaceKey, AirQualityReport, GeoLocation } from '@/domain/types';
import { RoomContext } from '@/lib/ai/types';
import { useAirCopilot, CopilotChatMessage } from '@/lib/ai/use-copilot';

interface CopilotDrawerShellProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly activeWorkspace: WorkspaceKey;
  readonly initialPrompt?: string | null;
  readonly roomContext?: RoomContext | null;
  readonly report?: AirQualityReport | null;
  readonly location?: GeoLocation | null;
}

const WORKSPACE_PROMPT_CHIPS: Record<WorkspaceKey, readonly string[]> = {
  'indoor-air': [
    'Can indoor plants like Snake Plant and Areca Palm reduce indoor smog?',
    'What CADR purifier capacity is needed for my room size?',
    'When should I open my windows today during winter inversions?',
    'How does a Corsi-Rosenthal box fan compare to commercial units?',
  ],
  'family-planner': [
    'Can my child play outside this evening in Delhi?',
    'Is it safe for senior citizens to take a morning walk today?',
    'How should working professionals plan their commute during morning smog?',
    'Why does morning thermal inversion trap toxic particulate near ground?',
  ],
  'air-intelligence': [
    'What does India CPCB NAQI "Very Poor" mean for vulnerable families?',
    'Why does cold winter weather trap vehicle tailpipe exhaust near the ground?',
    'What is the difference between PM2.5 soot and Ozone?',
  ],
  'cleaner-choices': [
    'Why does electric metro save 80% emissions over solo car driving?',
    'How does combining weekend errand trips prevent cold-start smog spikes?',
    'What is the scientific distinction between personal exposure and carbon footprint?',
  ],
  'community-alerts': [
    'What are the mandatory restrictions under CAQM GRAP Stage IV?',
    'When does the daily thermal inversion breakup window occur today?',
    'How do I file an illegal garbage burning complaint on CPCB Sameer?',
    'What clean air advisory should our RWA share with apartment residents?',
  ],
};

const WORKSPACE_LABELS: Record<WorkspaceKey, string> = {
  'air-intelligence': 'Air Intelligence',
  'family-planner': 'Family Daily Planner',
  'indoor-air': 'Indoor Air Intelligence',
  'cleaner-choices': 'Cleaner Choices & Impact',
  'community-alerts': 'Community & Alerts',
};

export function CopilotDrawerShell({
  isOpen,
  onClose,
  activeWorkspace,
  initialPrompt,
  roomContext,
  report,
  location,
}: CopilotDrawerShellProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    resetConversation,
    createNewSession,
    switchSession,
    deleteSession,
    clearAllSessions,
  } = useAirCopilot({
    activeWorkspace,
    report,
    location,
    roomContext,
  });

  // Handle focus trapping and Escape key
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isHistoryOpen) {
          setIsHistoryOpen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

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

      {/* Slide-Over Drawer Container */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl border-l border-[var(--border-subtle)] text-[var(--ink-primary)]">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5 sm:py-4 bg-[var(--surface-subtle)]/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-surface)] text-[var(--brand-primary)] text-base border border-[var(--brand-primary)]/30 font-bold shrink-0"
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
                Context: {WORKSPACE_LABELS[activeWorkspace]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Session History Toggle Button (ChatGPT / Gemini Style) */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen((prev) => !prev)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
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
              className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all cursor-pointer flex items-center gap-1"
              title="Start a new clean chat thread"
            >
              <span>+</span>
              <span>New</span>
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-white text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ml-1"
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
                const msgCount = sess.messages.filter((m) => m.sender === 'user').length;
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
                      switchSession(sess.id);
                      setIsHistoryOpen(false);
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
                          deleteSession(sess.id);
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
                    clearAllSessions();
                    setIsHistoryOpen(false);
                  }
                }}
                className="text-[11px] font-mono text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
              >
                🗑️ Clear All History
              </button>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer"
              >
                Back to Active Chat →
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Conversation Message Stream */}
            <div
              role="log"
              aria-live="polite"
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
            >
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isLatest={idx === messages.length - 1 && msg.sender === 'assistant'}
                />
              ))}

              {/* Thinking / Generation Indicator */}
              {isThinking && (
                <div className="flex items-start gap-2.5 animate-fadeIn">
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
                    <span className="font-mono text-[11px]">Evaluating atmospheric physics &amp; guidance...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Context Question Chips */}
            <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-[var(--ink-muted)] font-sans">
                  Suggested Inquiries ({WORKSPACE_LABELS[activeWorkspace]})
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {chips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessage(chip)}
                    disabled={isThinking || (cooldownSeconds !== null && cooldownSeconds > 0)}
                    className="shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white hover:bg-[var(--brand-surface)] text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none text-left shadow-2xs"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar & Send Form */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-[var(--border-subtle)] bg-white p-3 sm:p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value.slice(0, 200))}
                  placeholder={`Ask about ${WORKSPACE_LABELS[activeWorkspace].toLowerCase()}...`}
                  disabled={isThinking || (cooldownSeconds !== null && cooldownSeconds > 0)}
                  maxLength={200}
                  className="flex-1 px-3 py-2 text-xs text-[var(--ink-primary)] bg-[var(--surface-subtle)] rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] disabled:opacity-50"
                  aria-label="Ask Copilot a question"
                />

                <button
                  type="submit"
                  disabled={
                    !inputQuery.trim() ||
                    isThinking ||
                    (cooldownSeconds !== null && cooldownSeconds > 0)
                  }
                  className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  aria-label="Send message to Copilot"
                >
                  Send ➤
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-muted)]">
                <span>🔒 Zero PII: Local-First Session Memory</span>
                <span>{inputQuery.length}/200</span>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}

interface FastTypewriterTextProps {
  readonly text: string;
  readonly speedMs?: number;
  readonly isNew?: boolean;
  readonly className?: string;
}

function FastTypewriterText({
  text,
  speedMs = 10,
  isNew = false,
  className = '',
}: FastTypewriterTextProps) {
  const [displayedLength, setDisplayedLength] = useState(isNew ? 0 : text.length);
  const [isTyping, setIsTyping] = useState(isNew);

  useEffect(() => {
    if (!isNew) {
      setDisplayedLength(text.length);
      setIsTyping(false);
      return;
    }

    setDisplayedLength(0);
    setIsTyping(true);

    let current = 0;
    const step = text.length > 120 ? 3 : text.length > 60 ? 2 : 1;

    const timer = setInterval(() => {
      current = Math.min(text.length, current + step);
      setDisplayedLength(current);

      if (current >= text.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, speedMs);

    return () => clearInterval(timer);
  }, [text, speedMs, isNew]);

  return (
    <span className={className}>
      {text.slice(0, displayedLength)}
      {isTyping && (
        <span
          className="inline-block w-1.5 h-3.5 ml-0.5 bg-[var(--brand-primary)] animate-pulse rounded-xs align-middle"
          aria-hidden="true"
        />
      )}
    </span>
  );
}

function MessageBubble({
  message,
  isLatest = false,
}: {
  readonly message: CopilotChatMessage;
  readonly isLatest?: boolean;
}) {
  if (message.sender === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[var(--brand-primary)] text-white px-3.5 py-2.5 text-xs shadow-xs leading-relaxed font-sans break-words whitespace-pre-wrap">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.isError) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl rounded-tl-xs bg-rose-50 border border-rose-200 text-rose-900 p-3 text-xs shadow-xs leading-relaxed font-mono">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <span>⚠️</span>
            <span>Guidance System Alert</span>
          </div>
          <p>{message.errorMessage}</p>
        </div>
      </div>
    );
  }

  const res = message.response;
  if (!res) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl rounded-tl-xs bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--ink-primary)] p-3 text-xs shadow-xs leading-relaxed font-sans">
          {message.text}
        </div>
      </div>
    );
  }

  const isLiveAi = message.source === 'cloudflare-ai';

  return (
    <div className="flex justify-start">
      <div className="max-w-[94%] rounded-2xl rounded-tl-xs bg-white border border-[var(--border-subtle)] shadow-xs p-3.5 sm:p-4 text-xs space-y-3">
        {/* Model Provenance Banner */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isLiveAi
                ? 'bg-teal-50 text-teal-800 border-teal-300'
                : 'bg-slate-100 text-slate-800 border-slate-300'
            }`}
          >
            {isLiveAi
              ? '⚡ Cloudflare Workers AI • Gemma 4'
              : '🛡️ Deterministic Guidance Engine'}
          </span>

          <span className="text-[10px] font-mono text-[var(--ink-muted)]">
            Verified Response
          </span>
        </div>

        {/* 1. Direct Answer */}
        <div>
          <span className="text-[11px] font-semibold text-[var(--brand-primary)] font-sans block">
            Direct Answer
          </span>
          <p className="text-sm font-bold text-[var(--ink-primary)] mt-0.5 leading-snug">
            <FastTypewriterText text={res.directAnswer} speedMs={10} isNew={isLatest} />
          </p>
        </div>

        {/* 2. Atmospheric & Environmental Context */}
        <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1 animate-fadeIn">
          <span className="text-[11px] font-semibold text-[var(--ink-muted)] font-sans block">
            Environmental Context
          </span>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            {res.environmentalConditions}
          </p>
        </div>

        {/* 3. Recommended Action */}
        <div className="space-y-0.5 animate-fadeIn">
          <span className="text-[11px] font-semibold text-emerald-800 font-sans block">
            Primary Action
          </span>
          <p className="text-xs font-semibold text-[var(--ink-primary)] leading-relaxed">
            {res.recommendedAction}
          </p>
        </div>

        {/* 4. Scientific Explanation */}
        <div className="space-y-0.5 animate-fadeIn">
          <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider block">
            Scientific Reasoning
          </span>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            {res.explanation}
          </p>
        </div>

        {/* 5. Practical Alternatives */}
        {res.practicalAlternatives && res.practicalAlternatives.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider block">
              Practical Alternatives
            </span>
            <ul className="space-y-1">
              {res.practicalAlternatives.map((alt, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-1.5 text-[11px] text-[var(--ink-secondary)]"
                >
                  <span className="text-[var(--brand-primary)] font-bold">›</span>
                  <span>{alt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 6. Data Source & 7. Limitations */}
        <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--ink-muted)] space-y-1">
          <div className="flex items-center gap-1.5">
            <strong>Source:</strong> <span>{res.dataSourceAndFreshness}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <strong>Notice:</strong> <span className="italic">{res.limitationsOrUncertainty}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
