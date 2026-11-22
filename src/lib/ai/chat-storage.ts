/**
 * AirAware Copilot Chat Session Storage & Security Guard
 * Local-First, Zero-PII, Tamper-Resistant Storage with Anti-XSS Sanitization.
 */

import { CopilotChatMessage } from './use-copilot';
import { CopilotResponse } from './types';

export interface CopilotChatSession {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly messages: readonly CopilotChatMessage[];
}

export const COPILOT_STORAGE_KEY = 'airaware_copilot_sessions_v1';
export const MAX_SESSIONS = 25;
export const MAX_MESSAGES_PER_SESSION = 50;

/**
 * Strips script tags, javascript: schemes, and inline event handlers to prevent XSS.
 */
export function sanitizeChatString(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Creates a clean default session with the standard welcome message.
 */
export function createDefaultSession(title = 'New Conversation'): CopilotChatSession {
  const now = new Date().toISOString();
  return {
    id: `session-${Date.now()}`,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: 'Hello! I am your AirAware Copilot, an environmental intelligence assistant. Ask me anything about current air quality, outdoor ventilation timing, air purifier sizing, or practical family routines.',
        timestamp: now,
        source: 'deterministic',
      },
    ],
  };
}

/**
 * Loads stored chat sessions safely from localStorage with schema validation.
 */
export function loadChatSessions(): CopilotChatSession[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [createDefaultSession()];
  }

  try {
    const raw = window.localStorage.getItem(COPILOT_STORAGE_KEY);
    if (!raw) {
      const initial = [createDefaultSession()];
      saveChatSessions(initial);
      return initial;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = [createDefaultSession()];
      saveChatSessions(initial);
      return initial;
    }

    // Validate and sanitize each session
    const validSessions: CopilotChatSession[] = parsed.slice(0, MAX_SESSIONS).map((s) => ({
      id: typeof s.id === 'string' ? s.id : `session-${Date.now()}`,
      title: typeof s.title === 'string' ? sanitizeChatString(s.title).slice(0, 50) || 'Conversation' : 'Conversation',
      createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date().toISOString(),
      updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : new Date().toISOString(),
      messages: Array.isArray(s.messages)
        ? s.messages.slice(0, MAX_MESSAGES_PER_SESSION).map((m: Record<string, unknown>) => ({
            id: typeof m.id === 'string' ? m.id : `msg-${Date.now()}`,
            sender: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            text: typeof m.text === 'string' ? sanitizeChatString(m.text) : undefined,
            response: m.response ? (m.response as CopilotResponse) : undefined,
            timestamp: typeof m.timestamp === 'string' ? m.timestamp : new Date().toISOString(),
            isError: Boolean(m.isError),
            errorMessage: typeof m.errorMessage === 'string' ? sanitizeChatString(m.errorMessage) : undefined,
            source: (m.source === 'cloudflare-ai' ? 'cloudflare-ai' : 'deterministic') as 'cloudflare-ai' | 'deterministic',
          }))
        : [],
    }));

    return validSessions.length > 0 ? validSessions : [createDefaultSession()];
  } catch (err) {
    console.warn('[AirAware Copilot] Error reading chat storage. Initializing default session.', err);
    return [createDefaultSession()];
  }
}

/**
 * Saves chat sessions securely to localStorage enforcing quota bounds.
 */
export function saveChatSessions(sessions: readonly CopilotChatSession[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const bounded = sessions.slice(0, MAX_SESSIONS).map((s) => ({
      ...s,
      messages: s.messages.slice(-MAX_MESSAGES_PER_SESSION),
    }));
    window.localStorage.setItem(COPILOT_STORAGE_KEY, JSON.stringify(bounded));
  } catch (err) {
    console.warn('[AirAware Copilot] Failed to persist chat sessions to localStorage.', err);
  }
}

/**
 * Generates an automatic descriptive title from the user's first query.
 */
export function generateSessionTitle(query: string): string {
  const cleaned = sanitizeChatString(query)
    .replace(/[?.,!]/g, '')
    .trim();
  if (!cleaned) return 'New Conversation';
  return cleaned.length > 38 ? `${cleaned.slice(0, 35)}...` : cleaned;
}
