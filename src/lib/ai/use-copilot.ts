'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CopilotResponse, WorkspaceContext, RoomContext } from './types';
import { AirQualityReport, GeoLocation } from '@/domain/types';

export interface CopilotChatMessage {
  readonly id: string;
  readonly sender: 'user' | 'assistant';
  readonly text?: string;
  readonly response?: CopilotResponse;
  readonly timestamp: string;
  readonly isError?: boolean;
  readonly errorMessage?: string;
  readonly source?: 'cloudflare-ai' | 'deterministic';
}

interface UseAirCopilotOptions {
  readonly activeWorkspace: WorkspaceContext;
  readonly report?: AirQualityReport | null;
  readonly location?: GeoLocation | null;
  readonly roomContext?: RoomContext | null;
}

const DEFAULT_WELCOME_MESSAGE: CopilotChatMessage = {
  id: 'welcome-0',
  sender: 'assistant',
  text: 'Hello! I am your AirAware Copilot, an environmental intelligence assistant. Ask me anything about current air quality, outdoor ventilation timing, air purifier sizing, or practical family routines.',
  timestamp: new Date().toISOString(),
  source: 'deterministic',
};

export function useAirCopilot({
  activeWorkspace,
  report,
  location,
  roomContext,
}: UseAirCopilotOptions) {
  const [messages, setMessages] = useState<CopilotChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [isDailyQuotaExhausted, setIsDailyQuotaExhausted] = useState(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer for burst rate limit
  useEffect(() => {
    if (cooldownSeconds === null || cooldownSeconds <= 0) return;

    cooldownTimerRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, [cooldownSeconds]);

  const resetConversation = useCallback(() => {
    setMessages([
      {
        ...DEFAULT_WELCOME_MESSAGE,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setInputQuery('');
    setIsThinking(false);
  }, []);

  const sendMessage = useCallback(
    async (queryToSend?: string, overrideRoomContext?: RoomContext | null) => {
      const q = (queryToSend ?? inputQuery).trim();
      if (!q || isThinking || (cooldownSeconds !== null && cooldownSeconds > 0)) {
        return;
      }

      // 1. Append user message
      const userMsgId = `user-${Date.now()}`;
      const userMsg: CopilotChatMessage = {
        id: userMsgId,
        sender: 'user',
        text: q.slice(0, 200),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputQuery('');
      setIsThinking(true);

      // 2. Build verified privacy-safe payload (Zero PII)
      // Defaults to realistic environmental baseline if report is still loading
      const currentAqi = report?.providerAqi ?? 100;
      const currentCategory = (report?.tier?.label as any) ?? 'Moderate';
      const dominant = (report?.dominantPollutant as any) || 'pm25';
      const conc = report?.pollutants?.pm2_5?.concentration ?? 35;
      const temp = report?.forecast?.[0]?.temperature ?? 22;
      const humidity = 50;
      const wind = report?.forecast?.[0]?.windSpeed ?? 8;

      const payload = {
        question: q.slice(0, 200),
        workspace: activeWorkspace,
        roomContext: overrideRoomContext || roomContext || undefined,
        aqi: Math.min(500, Math.max(0, currentAqi)),
        category: currentCategory,
        dominantPollutant: dominant,
        pollutantConcentration: conc,
        pollutantUnit: 'µg/m³',
        weather: {
          temperatureC: temp,
          humidityPercent: humidity,
          windSpeedKmh: wind,
        },
        userContext: {
          isSensitiveGroup: false,
          primaryActivity: 'general' as const,
          locale: 'en',
        },
      };

      try {
        const res = await fetch('/api/ai/copilot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        // Check quota headers
        if (res.headers.get('X-AirAware-Quota-Exhausted') === 'true') {
          setIsDailyQuotaExhausted(true);
        }

        // Check response source
        const rawSource = res.headers.get('X-AirAware-Response-Source');
        const source: 'cloudflare-ai' | 'deterministic' =
          rawSource === 'cloudflare-ai' ? 'cloudflare-ai' : 'deterministic';

        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After');
          const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          setCooldownSeconds(isNaN(seconds) ? 60 : seconds);

          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              sender: 'assistant',
              isError: true,
              errorMessage: `Rate limit reached. Please wait ${seconds} seconds before asking another question.`,
              timestamp: new Date().toISOString(),
              source: 'deterministic',
            },
          ]);
          return;
        }

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data: CopilotResponse = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            response: data,
            timestamp: new Date().toISOString(),
            source: data.isDeterministicFallback ? 'deterministic' : source,
          },
        ]);
      } catch (err: unknown) {
        // Fallback message
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            isError: true,
            errorMessage: 'Network connection interrupted. Please try asking your question again.',
            timestamp: new Date().toISOString(),
            source: 'deterministic',
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [inputQuery, isThinking, cooldownSeconds, report, activeWorkspace, roomContext]
  );

  return {
    messages,
    inputQuery,
    setInputQuery,
    isThinking,
    cooldownSeconds,
    isDailyQuotaExhausted,
    sendMessage,
    resetConversation,
  };
}
