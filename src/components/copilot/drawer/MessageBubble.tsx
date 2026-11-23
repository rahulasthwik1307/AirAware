'use client';

import React from 'react';
import { AirQualityReport } from '@/domain/types';
import { CopilotChatMessage } from '@/lib/ai/use-copilot';
import { CopilotRichResponse } from '@/components/copilot/CopilotRichResponse';

interface MessageBubbleProps {
  readonly message: CopilotChatMessage;
  readonly userQuestion?: string;
  readonly report?: AirQualityReport | null;
  readonly onSelectPrompt?: (prompt: string) => void;
}

export function MessageBubble({
  message,
  userQuestion = '',
  report = null,
  onSelectPrompt,
}: MessageBubbleProps) {
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

  const isLiveAi = message.source === 'cloudflare-ai' || (!res.isDeterministicFallback && Boolean(res.modelName));
  const modelName = res.modelName || 'Cloudflare Workers AI';
  const badgeText = isLiveAi ? `AI-generated · ${modelName}` : 'Rule-based answer';

  return (
    <div className="flex justify-start">
      <div className="max-w-[94%] rounded-2xl rounded-tl-xs bg-white border border-[var(--border-subtle)] shadow-xs p-3.5 sm:p-4 text-xs space-y-3">
        {/* Model Provenance Banner */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-[var(--border-subtle)]">
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isLiveAi
                ? 'bg-teal-50 text-teal-800 border-teal-300'
                : 'bg-slate-100 text-slate-800 border-slate-300'
            }`}
          >
            {isLiveAi
              ? '⚡ Cloudflare Workers AI'
              : '🛡️ Deterministic Guidance Engine'}
          </span>

          <div className="flex items-center gap-1.5 text-right flex-wrap">
            {!isLiveAi && res.fallbackReason && (
              <span className="text-[10px] font-mono text-slate-500 italic">
                {res.fallbackReason} ·
              </span>
            )}
            <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              {badgeText}
            </span>
          </div>
        </div>

        {/* Rich Copilot Presentation (A2UI-inspired Zero-Dependency Catalog) */}
        <CopilotRichResponse
          question={userQuestion || ''}
          response={res}
          report={report}
          onSelectPrompt={onSelectPrompt}
          isLiveAi={isLiveAi}
        />
      </div>
    </div>
  );
}
