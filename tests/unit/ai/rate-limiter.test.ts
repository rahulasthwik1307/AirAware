import { describe, it, expect, beforeEach } from 'vitest';
import {
  localRateLimiter,
  validateRequestSecurity,
  getClientHash,
} from '@/lib/ai/rate-limiter';

describe('Route Rate Limiter & Origin Security', () => {
  beforeEach(() => {
    localRateLimiter.clear();
  });

  it('rejects requests with payload size over 2KB', () => {
    const req = new Request('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '3000',
      },
    });

    expect(() => validateRequestSecurity(req)).toThrow(/Payload too large/);
  });

  it('rejects unsupported Content-Type', () => {
    const req = new Request('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
      },
    });

    expect(() => validateRequestSecurity(req)).toThrow(/Unsupported Content-Type/);
  });

  it('rejects cross-site requests via Sec-Fetch-Site', () => {
    const req = new Request('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'sec-fetch-site': 'cross-site',
      },
    });

    expect(() => validateRequestSecurity(req)).toThrow(/Cross-origin request rejected/);
  });

  it('permits valid same-origin requests under 2KB', () => {
    const req = new Request('http://localhost/api/ai/guidance', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '500',
        'sec-fetch-site': 'same-origin',
      },
    });

    expect(() => validateRequestSecurity(req)).not.toThrow();
  });

  it('hashes client identifiers into fixed 16-character hex strings without storing raw IP', () => {
    const hash1 = localRateLimiter.hashClientId('192.168.1.100');
    const hash2 = localRateLimiter.hashClientId('192.168.1.100');
    const hash3 = localRateLimiter.hashClientId('10.0.0.1');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).not.toContain('192');
    expect(hash1.length).toBe(16);
  });

  it('enforces sliding-window limit (allows 10, rejects 11th)', () => {
    const client = 'client-test-hash';

    for (let i = 0; i < 10; i++) {
      const res = localRateLimiter.check(client);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(9 - i);
    }

    const blocked = localRateLimiter.check(client);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.reason).toContain('Rate limit exceeded');
  });
});
