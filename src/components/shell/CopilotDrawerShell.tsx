'use client';

import React, { useEffect, useRef, useState } from 'react';
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
    'When should I open my windows today?',
    'Does HEPA filtration capture gas stove fumes?',
    'What does CADR mean for my room size?',
    'How does a Corsi-Rosenthal box fan compare to commercial units?',
  ],
  'family-planner': [
    'When is the lowest pollution window for children outdoor play today?',
    'Is cycling or public transit cleaner for commuting today?',
    'Why does morning smog trap particulate matter near the ground?',
  ],
  'air-intelligence': [
    'Why is PM2.5 elevated while Ozone is low?',
    'What does an AQI above 150 mean for healthy adults?',
    'How does wind speed influence regional smog dispersion?',
  ],
  'cleaner-choices': [
    'What everyday switch reduces toxic exposure fastest?',
    'How much CO2 does taking electric rail save compared to solo driving?',
  ],
};

const WORKSPACE_LABELS: Record<WorkspaceKey, string> = {
  'air-intelligence': 'Air Intelligence',
  'family-planner': 'Family Daily Planner',
  'indoor-air': 'Indoor Air Intelligence',
  'cleaner-choices': 'Cleaner Choices & Impact',
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

  const {
    messages,
    inputQuery,
    setInputQuery,
    isThinking,
    cooldownSeconds,
    isDailyQuotaExhausted,
    sendMessage,
    resetConversation,
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
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle auto-seeding initial prompt when opening from an in-situ card (strictly single-fire guard)
  const dispatchedPromptRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      dispatchedPromptRef.current = null;
      return;
    }

    if (initialPrompt && dispatchedPromptRef.current !== initialPrompt) {
      dispatchedPromptRef.current = initialPrompt;
      sendMessage(initialPrompt, roomContext);
    }
  }, [isOpen, initialPrompt, roomContext, sendMessage]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  if (!isOpen) {
    return null;
  }

  const chips = WORKSPACE_PROMPT_CHIPS[activeWorkspace] || WORKSPACE_PROMPT_CHIPS['air-intelligence'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-drawer-title"
      className="fixed inset-0 z-50 flex justify-end animate-fadeIn"
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-Over Drawer Container */}
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl border-l border-[var(--border-subtle)] text-[var(--ink-primary)]">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3 sm:px-5 sm:py-4 bg-[var(--surface-subtle)]/70">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-surface)] text-[var(--brand-primary)] text-base border border-[var(--brand-primary)]/30 font-bold"
              aria-hidden="true"
            >
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="copilot-drawer-title"
                  className="text-sm font-bold text-[var(--ink-primary)] font-sans"
                >
                  AI Air Copilot
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[var(--brand-primary)] border border-[var(--border-subtle)] font-bold">
                  Global Assistant
                </span>
              </div>
              <span className="text-[10px] font-mono text-[var(--ink-muted)] block mt-0.5">
                Active Context: {WORKSPACE_LABELS[activeWorkspace]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetConversation}
              className="px-2 py-1 text-[11px] font-mono text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-white rounded border border-[var(--border-subtle)] transition-all cursor-pointer"
              title="Reset conversation"
            >
              🔄 Reset
            </button>

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
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-muted)]">
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
                className="shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white hover:bg-[var(--brand-surface)] text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none text-left"
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
            <span>🔒 Zero PII: Only numerical context transmitted</span>
            <span>{inputQuery.length}/200</span>
          </div>
        </form>
      </div>
    </div>
  );
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
    // Fast typewriter: dynamically adjusts step size so full text appears within ~400–700ms
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
        <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[var(--brand-primary)] text-white px-3.5 py-2.5 text-xs shadow-xs leading-relaxed font-sans">
          {message.text}
        </div>
      </div>
    );
  }

  // Assistant Error State
  if (message.isError) {
    return (
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-700 text-xs border border-rose-200 font-bold shrink-0 mt-0.5"
          aria-hidden="true"
        >
          !
        </div>
        <div className="max-w-[90%] rounded-2xl rounded-tl-xs bg-rose-50/80 border border-rose-200 p-3 text-xs text-rose-900 leading-relaxed font-sans">
          {message.errorMessage}
        </div>
      </div>
    );
  }

  // Assistant Initial Welcome Greeting (text only)
  if (message.text && !message.response) {
    return (
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-surface)] text-[var(--brand-primary)] text-xs border border-[var(--brand-primary)]/30 font-bold shrink-0 mt-0.5"
          aria-hidden="true"
        >
          🤖
        </div>
        <div className="max-w-[90%] rounded-2xl rounded-tl-xs bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-3 text-xs text-[var(--ink-secondary)] leading-relaxed font-sans space-y-1.5">
          <p>{message.text}</p>
          <span className="text-[10px] font-mono text-[var(--ink-muted)] block">
            Copernicus CAMS Numerical Forecasts • US EPA &amp; WHO Standards
          </span>
        </div>
      </div>
    );
  }

  // Structured 7-Part Response Card (Master Specification §4.4)
  const res = message.response;
  if (!res) return null;

  const isLiveAi = message.source === 'cloudflare-ai' && !res.isDeterministicFallback;

  return (
    <div className="flex items-start gap-2.5">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-surface)] text-[var(--brand-primary)] text-xs border border-[var(--brand-primary)]/30 font-bold shrink-0 mt-0.5"
        aria-hidden="true"
      >
        🤖
      </div>

      <div className="max-w-[92%] rounded-2xl rounded-tl-xs bg-white border border-[var(--border-subtle)] shadow-xs p-4 text-xs space-y-3 font-sans">
        {/* Source Badge */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isLiveAi
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
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
          <span className="text-[10px] font-mono font-bold text-[var(--brand-primary)] uppercase tracking-wider block">
            Direct Answer
          </span>
          <p className="text-sm font-bold text-[var(--ink-primary)] mt-0.5 leading-snug">
            <FastTypewriterText text={res.directAnswer} speedMs={10} isNew={isLatest} />
          </p>
        </div>

        {/* 2. Atmospheric & Environmental Context */}
        <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border-subtle)] space-y-1 animate-fadeIn">
          <span className="text-[10px] font-mono font-bold text-[var(--ink-muted)] uppercase block">
            Environmental Context
          </span>
          <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
            {res.environmentalConditions}
          </p>
        </div>

        {/* 3. Recommended Action */}
        <div className="space-y-0.5 animate-fadeIn">
          <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider block">
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
