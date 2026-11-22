'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CopilotResponse, WorkspaceContext, RoomContext } from './types';
import { AirQualityReport, GeoLocation } from '@/domain/types';
import { getPrimaryAqiFacts } from '@/domain/aqi/primary-aqi';
import { HouseholdStorageState, HouseholdMember } from '@/domain/household/types';
import { loadHouseholdState } from '@/domain/household/storage';
import { loadIndoorState } from '@/domain/indoor/storage';
import {
  CopilotChatSession,
  loadChatSessions,
  saveChatSessions,
  createDefaultSession,
  generateSessionTitle,
  sanitizeChatString,
} from './chat-storage';

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
  readonly householdState?: HouseholdStorageState | null;
  readonly activeMember?: HouseholdMember | null;
}

export function deriveUserContextFromHousehold(
  householdState?: HouseholdStorageState | null,
  activeMember?: HouseholdMember | null
): {
  isSensitiveGroup: boolean;
  primaryActivity: 'outdoor_exercise' | 'daily_commute' | 'indoor_resting' | 'general';
  locale: string;
  vulnerabilityTiers: string[];
} {
  const state = householdState || (typeof window !== 'undefined' ? loadHouseholdState() : null);
  const members = state?.members || [];
  const currentMember =
    activeMember ||
    (state?.activeMemberId ? members.find((m) => m.id === state.activeMemberId) : null) ||
    members[0];

  const vulnerabilityTiers: string[] = [];
  let isSensitiveGroup = false;

  if (currentMember) {
    if (currentMember.sensitivityTier !== 'NONE') {
      isSensitiveGroup = true;
    }
    if (currentMember.sensitivityTier === 'PEDIATRIC' || currentMember.archetype === 'CHILD_STUDENT') {
      vulnerabilityTiers.push('pediatric');
    }
    if (currentMember.sensitivityTier === 'SENIOR' || currentMember.archetype === 'SENIOR_VULNERABLE') {
      vulnerabilityTiers.push('senior');
    }
    if (currentMember.sensitivityTier === 'RESPIRATORY' || currentMember.sensitivityTier === 'CARDIOVASCULAR') {
      vulnerabilityTiers.push('respiratory');
    }
    if (currentMember.archetype === 'WORKING_COMMUTER') {
      vulnerabilityTiers.push('commuter');
    }
    if (currentMember.archetype === 'OUTDOOR_ENTHUSIAST') {
      vulnerabilityTiers.push('outdoor_enthusiast');
    }

    const schedules = currentMember.schedules || [];
    const hasCommute = schedules.some((s) => s.activityType === 'COMMUTE' || s.activityType === 'SCHOOL_TRAVEL');
    const hasOutdoor = schedules.some((s) => s.activityType === 'OUTDOOR_EXERCISE');
    const hasIndoor = schedules.some((s) => s.activityType === 'INDOOR_CHORE' || s.activityType === 'VENTILATION');

    let primaryActivity: 'outdoor_exercise' | 'daily_commute' | 'indoor_resting' | 'general' = 'general';
    if (hasCommute || currentMember.archetype === 'WORKING_COMMUTER') {
      primaryActivity = 'daily_commute';
    } else if (hasOutdoor || currentMember.archetype === 'OUTDOOR_ENTHUSIAST') {
      primaryActivity = 'outdoor_exercise';
    } else if (hasIndoor) {
      primaryActivity = 'indoor_resting';
    }

    return {
      isSensitiveGroup,
      primaryActivity,
      locale: 'en',
      vulnerabilityTiers,
    };
  }

  const anySensitive = members.some((m) => m.sensitivityTier !== 'NONE');
  return {
    isSensitiveGroup: anySensitive,
    primaryActivity: 'general',
    locale: 'en',
    vulnerabilityTiers: [],
  };
}

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
      const userMsgId = `user-${Date.now()}`;
      const userMsg: CopilotChatMessage = {
        id: userMsgId,
        sender: 'user',
        text: q.slice(0, 200),
        timestamp: new Date().toISOString(),
      };

      // If this is the first user message in the session, update the session title
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
        const noReportMsg: CopilotChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          text: 'I need a selected location and live environmental telemetry before answering. Please select or detect a location first.',
          timestamp: new Date().toISOString(),
          source: 'deterministic',
        };

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === activeSessionId) {
              return {
                ...s,
                updatedAt: new Date().toISOString(),
                messages: [...s.messages, noReportMsg],
              };
            }
            return s;
          })
        );
        setIsThinking(false);
        return;
      }

      // 3. Build verified privacy-safe payload with authoritative LIVE AQI context (Zero PII)
      const primaryFacts = getPrimaryAqiFacts(report);
      const currentAqi = primaryFacts.aqi;
      const currentCategory = primaryFacts.category as any;
      
      let dominantKey: 'pm25' | 'pm10' | 'o3' | 'no2' | 'so2' | 'co' = 'pm25';
      const rawDominant = (report.dominantPollutant || 'pm25').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (rawDominant.includes('pm10')) dominantKey = 'pm10';
      else if (rawDominant.includes('pm2') || rawDominant.includes('pm25')) dominantKey = 'pm25';
      else if (rawDominant.includes('o3') || rawDominant.includes('ozone')) dominantKey = 'o3';
      else if (rawDominant.includes('no2')) dominantKey = 'no2';
      else if (rawDominant.includes('so2')) dominantKey = 'so2';
      else if (rawDominant.includes('co')) dominantKey = 'co';

      const pollutantMeasurementKey = dominantKey === 'pm25' ? 'pm2_5' : dominantKey;
      const conc =
        report.pollutants?.[pollutantMeasurementKey as keyof typeof report.pollutants]?.concentration ??
        report.pollutants?.pm2_5?.concentration ??
        0;

      const userContext = deriveUserContextFromHousehold(householdState, activeMember);
      const cityName = location?.name || report.location.name;
      const observationTime = report.observedAt || report.localTime || report.modelTimestamp;
      const dataSource = primaryFacts.resolvedDataSource;

      const payload = {
        question: q.slice(0, 200),
        workspace: activeWorkspace,
        roomContext: overrideRoomContext || roomContext || undefined,
        aqi: Math.min(500, Math.max(0, currentAqi)),
        category: currentCategory,
        dominantPollutant: dominantKey,
        pollutantConcentration: conc,
        pollutantUnit: 'µg/m³',
        weather: {
          temperatureC: 22,
          humidityPercent: 50,
          windSpeedKmh: 5,
        },
        userContext,
        cityName,
        observationTime,
        dataSource,
        sourceType: report.sourceType,
        stationName: report.stationName,
        distanceKm: report.distanceKm,
        indoorPm25: typeof window !== 'undefined' ? (loadIndoorState().indoorPm25Reading ?? null) : null,
        scaleName: primaryFacts.scaleName,
        modelFallbackReason: primaryFacts.modelFallbackReason,
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

          const errMessage: CopilotChatMessage = {
            id: `err-${Date.now()}`,
            sender: 'assistant',
            isError: true,
            errorMessage: `Rate limit reached. Please wait ${seconds} seconds before asking another question.`,
            timestamp: new Date().toISOString(),
            source: 'deterministic',
          };

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
          const customMsg = errData?.message || (res.status === 400 ? 'Please enter a valid question.' : `Server returned HTTP ${res.status}`);
          throw new Error(customMsg);
        }

        const data: CopilotResponse = await res.json();

        const assistantMsg: CopilotChatMessage = {
          id: `assistant-${Date.now()}`,
          sender: 'assistant',
          response: data,
          timestamp: new Date().toISOString(),
          source: data.isDeterministicFallback ? 'deterministic' : source,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, updatedAt: new Date().toISOString(), messages: [...s.messages, assistantMsg] }
              : s
          )
        );
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Network connection interrupted. Please try asking your question again.';
        const errMessage: CopilotChatMessage = {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          errorMessage: errMsg,
          timestamp: new Date().toISOString(),
          source: 'deterministic',
        };

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
    [report, activeWorkspace, roomContext, activeSessionId, location?.name, householdState, activeMember]
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
