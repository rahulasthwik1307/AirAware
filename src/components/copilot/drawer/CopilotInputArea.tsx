'use client';

import React from 'react';

interface CopilotInputAreaProps {
  readonly chips: readonly string[];
  readonly activeWorkspaceLabel: string;
  readonly inputQuery: string;
  readonly setInputQuery: (value: string) => void;
  readonly sendMessage: (query: string) => void;
  readonly isThinking: boolean;
  readonly cooldownSeconds: number | null;
  readonly inputRef: React.RefObject<HTMLInputElement | null>;
}

export function CopilotInputArea({
  chips,
  activeWorkspaceLabel,
  inputQuery,
  setInputQuery,
  sendMessage,
  isThinking,
  cooldownSeconds,
  inputRef,
}: CopilotInputAreaProps) {
  const isInputDisabled = isThinking || (cooldownSeconds !== null && cooldownSeconds > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isInputDisabled) return;
    const query = inputQuery.trim();
    sendMessage(query);
  };

  return (
    <>
      {/* Suggested Context Question Chips */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-[var(--ink-muted)] font-sans">
            Suggested Inquiries ({activeWorkspaceLabel})
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {chips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(chip)}
              disabled={isInputDisabled}
              className="shrink-0 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white hover:bg-[var(--brand-surface)] text-[var(--ink-secondary)] hover:text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 transition-all cursor-pointer tactile-btn disabled:opacity-50 disabled:cursor-not-allowed select-none text-left shadow-2xs"
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
            placeholder={`Ask about ${activeWorkspaceLabel.toLowerCase()}...`}
            disabled={isInputDisabled}
            maxLength={200}
            className="flex-1 px-3 py-2 text-xs text-[var(--ink-primary)] bg-[var(--surface-subtle)] rounded-xl border border-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] disabled:opacity-50"
            aria-label="Ask Copilot a question"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || isInputDisabled}
            className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold rounded-xl shadow-xs transition-all cursor-pointer tactile-btn disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            aria-label="Send message to Copilot"
          >
            Send ➤
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-muted)]">
          <span>🔒 Chats are saved only on this device</span>
          <span>{inputQuery.length}/200</span>
        </div>
      </form>
    </>
  );
}
