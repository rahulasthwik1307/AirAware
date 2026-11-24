'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CopilotResponse, WorkspaceContext, RoomContext } from './types';
import { AirQualityReport, GeoLocation } from '@/domain/types';
import { HouseholdStorageState, HouseholdMember } from '@/domain/household/types';
import {
  CopilotChatSession,
  loadChatSessions,
  saveChatSessions,
  createDefaultSession,
  generateSessionTitle,
  sanitizeChatString,
} from './chat-storage';
import {
  deriveUserContextFromHousehold,
  buildCopilotApiPayload,
  createNoReportMessage,
  createRateLimitMessage,
  createCatchErrorMessage,
  createAssistantSuccessMessage,
} from './copilot-session';

export { deriveUserContextFromHousehold };

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

export interface UseAirCopilotOptions {
  readonly activeWorkspace: WorkspaceContext;
  readonly report?: AirQualityReport | null;
  readonly location?: GeoLocation | null;
  readonly roomContext?: RoomContext | null;
  readonly householdState?: HouseholdStorageState | null;
  readonly activeMember?: HouseholdMember | null;
}

/**
 * Custom React hook managing conversation session state, burst rate limiting,
 * and asynchronous querying for the AirAware AI Copilot.
 *
 * @param options - Active workspace, telemetry report, location, and household contexts
 */
export function useAirCopilot({
  activeWorkspace,
  report,
  location,
  roomContext,
  householdState,
  activeMember,
}: UseAirCopilotOptions) {
  const initialSession = createDefaultSession();
  const [sessions, setSessions] = useState<CopilotChatSession[]>([initialSession]);
  const [activeSessionId, setActiveSessionId] = useState<string>(initialSession.id);
  const [isHydrated, setIsHydrated] = useState(false);

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [isDailyQuotaExhausted, setIsDailyQuotaExhausted] = useState(false);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isThinkingRef = useRef(false);
  const cooldownRef = useRef<number | null>(null);
  const inputQueryRef = useRef('');

  useEffect(() => {
    isThinkingRef.current = isThinking;
    cooldownRef.current = cooldownSeconds;
    inputQueryRef.current = inputQuery;
  }, [isThinking, cooldownSeconds, inputQuery]);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    const loaded = loadChatSessions();
    if (loaded && loaded.length > 0) {
      setSessions(loaded);
      setActiveSessionId(loaded[0].id);
    }
    setIsHydrated(true);
  }, []);

  // Save sessions to localStorage when updated (after hydration)
  useEffect(() => {
    if (isHydrated && sessions.length > 0) {
      saveChatSessions(sessions);
    }
  }, [sessions, isHydrated]);

  // Current active session & its messages
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || initialSession;
  const messages = activeSession.messages;

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

  // Switch to another session
  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setInputQuery('');
    setIsThinking(false);
  }, []);

  // Create a brand new session thread
  const createNewSession = useCallback((customTitle?: string) => {
    const newSession = createDefaultSession(customTitle || 'New Conversation');
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInputQuery('');
    setIsThinking(false);
    return newSession;
  }, []);

  // Delete a specific session
  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== sessionId);
        if (filtered.length === 0) {
          const fresh = createDefaultSession();
          setActiveSessionId(fresh.id);
          return [fresh];
        }
        if (activeSessionId === sessionId) {
          setActiveSessionId(filtered[0].id);
        }
        return filtered;
      });
    },
    [activeSessionId]
  );

  // Clear all sessions (intentional complete reset)
  const clearAllSessions = useCallback(() => {
    const fresh = createDefaultSession();
    setSessions([fresh]);
    setActiveSessionId(fresh.id);
    setInputQuery('');
    setIsThinking(false);
    saveChatSessions([fresh]);
  }, []);

  // Reset current active conversation messages
  const resetConversation = useCallback(() => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const fresh = createDefaultSession(s.title);
          return {
            ...s,
            updatedAt: new Date().toISOString(),
            messages: fresh.messages,
          };
        }
        return s;
      })
    );
    setInputQuery('');
    setIsThinking(false);
  }, [activeSessionId]);

  // Send message
  const sendMessage = useCallback(
    async (queryToSend?: string, overrideRoomContext?: RoomContext | null) => {
      const q = sanitizeChatString(queryToSend ?? inputQueryRef.current).trim();
      if (!q || isThinkingRef.current || (cooldownRef.current !== null && cooldownRef.current > 0)) {
        return;
      }

      // 1. Append user message
      const userMsg: CopilotChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: q.slice(0, 200),
        timestamp: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            const hasUserMessages = s.messages.some((m) => m.sender === 'user');
            const title = !hasUserMessages ? generateSessionTitle(q) : s.title;
            return {
              ...s,
              title,
              updatedAt: new Date().toISOString(),
              messages: [...s.messages, userMsg],
            };
          }
          return s;
        })
      );

      setInputQuery('');
      setIsThinking(true);

      // 2. Check if a real report is loaded. Never assume mock or default values.
      if (!report || report.providerAqi === null) {
        const noReportMsg = createNoReportMessage();
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, updatedAt: new Date().toISOString(), messages: [...s.messages, noReportMsg] }
              : s
          )
        );
        setIsThinking(false);
        return;
      }

      // 3. Build verified privacy-safe payload
      const payload = buildCopilotApiPayload({
        query: q,
        activeWorkspace,
        report,
        location,
        roomContext: overrideRoomContext || roomContext,
        householdState,
        activeMember,
      });

      try {
        const res = await fetch('/api/ai/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.headers.get('X-AirAware-Quota-Exhausted') === 'true') {
          setIsDailyQuotaExhausted(true);
        }

        const rawSource = res.headers.get('X-AirAware-Response-Source');

        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After');
          const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          setCooldownSeconds(isNaN(seconds) ? 60 : seconds);

          const errMessage = createRateLimitMessage(isNaN(seconds) ? 60 : seconds);
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? { ...s, updatedAt: new Date().toISOString(), messages: [...s.messages, errMessage] }
                : s
            )
          );
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const customMsg =
            errData?.message ||
            (res.status === 400 ? 'Please enter a valid question.' : `Server returned HTTP ${res.status}`);
          throw new Error(customMsg);
        }

        const data: CopilotResponse = await res.json();
        const assistantMsg = createAssistantSuccessMessage(data, rawSource);

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, updatedAt: new Date().toISOString(), messages: [...s.messages, assistantMsg] }
              : s
          )
        );
      } catch (err: unknown) {
        const errMessage = createCatchErrorMessage(err);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, updatedAt: new Date().toISOString(), messages: [...s.messages, errMessage] }
              : s
          )
        );
      } finally {
        setIsThinking(false);
      }
    },
    [report, activeWorkspace, roomContext, activeSessionId, location, householdState, activeMember]
  );

  return {
    sessions,
    activeSessionId,
    activeSession,
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
  };
}
