import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import {
  sanitizeChatString,
  createDefaultSession,
  generateSessionTitle,
  loadChatSessions,
  saveChatSessions,
  COPILOT_STORAGE_KEY,
  MAX_SESSIONS,
  MAX_MESSAGES_PER_SESSION,
} from '@/lib/ai/chat-storage';

function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe('AirAware Copilot Chat Storage & Security Guard', () => {
  const originalWindow = globalThis.window;
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeAll(() => {
    mockStorage = createMockLocalStorage();
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: mockStorage,
    };
  });

  afterAll(() => {
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });

  beforeEach(() => {
    mockStorage.clear();
    vi.restoreAllMocks();
  });

  describe('sanitizeChatString', () => {
    it('strips <script> tags and malicious payloads', () => {
      const malicious = 'Hello <script>alert("pwned")</script> World';
      expect(sanitizeChatString(malicious)).toBe('Hello  World');
    });

    it('strips javascript: pseudo-protocols', () => {
      const attack = 'Click here: javascript:alert(1)';
      expect(sanitizeChatString(attack)).toBe('Click here: alert(1)');
    });

    it('strips inline event handlers', () => {
      const inlineHandler = '<img src=x onerror=alert(1)>';
      expect(sanitizeChatString(inlineHandler)).toBe('<img src=x alert(1)>');
    });

    it('handles empty or non-string input safely', () => {
      expect(sanitizeChatString('')).toBe('');
      expect(sanitizeChatString('   Clean String   ')).toBe('Clean String');
    });
  });

  describe('createDefaultSession', () => {
    it('initializes a valid session with assistant welcome greeting', () => {
      const session = createDefaultSession();
      expect(session.id).toMatch(/^session-\d+/);
      expect(session.title).toBe('New Conversation');
      expect(session.messages.length).toBe(1);
      expect(session.messages[0].sender).toBe('assistant');
      expect(session.messages[0].text).toContain('Hello! I am your AirAware Copilot');
    });
  });

  describe('generateSessionTitle', () => {
    it('creates concise title from first question', () => {
      const title = generateSessionTitle('Can I open my windows today?');
      expect(title).toBe('Can I open my windows today');
    });

    it('truncates overly long questions to 35 chars + ellipsis', () => {
      const longQuery = 'How does particulate matter PM2.5 affect elderly cardiovascular health during intense winter smog in northern India?';
      const title = generateSessionTitle(longQuery);
      expect(title.length).toBeLessThanOrEqual(38);
      expect(title.endsWith('...')).toBe(true);
    });

    it('falls back to default title on empty input', () => {
      expect(generateSessionTitle('')).toBe('New Conversation');
      expect(generateSessionTitle('???!!!')).toBe('New Conversation');
    });
  });

  describe('loadChatSessions and saveChatSessions', () => {
    it('initializes with default session when storage is empty', () => {
      const sessions = loadChatSessions();
      expect(sessions.length).toBe(1);
      expect(sessions[0].title).toBe('New Conversation');
    });

    it('persists and restores multiple chat sessions', () => {
      const s1 = createDefaultSession('Delhi Smog Check');
      const s2 = createDefaultSession('Purifier Sizing');
      saveChatSessions([s1, s2]);

      const loaded = loadChatSessions();
      expect(loaded.length).toBe(2);
      expect(loaded[0].title).toBe('Delhi Smog Check');
      expect(loaded[1].title).toBe('Purifier Sizing');
    });

    it('enforces maximum session quota limit (MAX_SESSIONS)', () => {
      const excessiveSessions = Array.from({ length: 35 }, (_, i) =>
        createDefaultSession(`Session ${i + 1}`)
      );

      saveChatSessions(excessiveSessions);
      const loaded = loadChatSessions();
      expect(loaded.length).toBeLessThanOrEqual(MAX_SESSIONS);
    });

    it('enforces maximum messages per session limit', () => {
      const session = createDefaultSession('Stress Thread');
      const extraMessages = Array.from({ length: 60 }, (_, i) => ({
        id: `msg-${i}`,
        sender: 'user' as const,
        text: `Message number ${i}`,
        timestamp: new Date().toISOString(),
      }));

      const fullSession = {
        ...session,
        messages: extraMessages,
      };

      saveChatSessions([fullSession]);
      const loaded = loadChatSessions();
      expect(loaded[0].messages.length).toBeLessThanOrEqual(MAX_MESSAGES_PER_SESSION);
    });

    it('handles corrupted localStorage JSON gracefully', () => {
      mockStorage.setItem(COPILOT_STORAGE_KEY, 'INVALID_JSON_CORRUPTED{[');
      const loaded = loadChatSessions();
      expect(loaded.length).toBe(1);
      expect(loaded[0].title).toBe('New Conversation');
    });
  });
});
