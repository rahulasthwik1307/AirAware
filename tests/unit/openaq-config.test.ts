import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getOpenAqApiKey, isOpenAqConfigured, OPENAQ_PLACEHOLDER } from '@/lib/openaq/config';

describe('OpenAQ Server Configuration & Key Resolver', () => {
  const originalEnv = process.env.OPENAQ_API_KEY;

  beforeEach(() => {
    delete process.env.OPENAQ_API_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.OPENAQ_API_KEY = originalEnv;
    } else {
      delete process.env.OPENAQ_API_KEY;
    }
  });

  it('returns null and isOpenAqConfigured false when key is undefined', () => {
    delete process.env.OPENAQ_API_KEY;
    expect(getOpenAqApiKey()).toBeNull();
    expect(isOpenAqConfigured()).toBe(false);
  });

  it('returns null and isOpenAqConfigured false when key is placeholder', () => {
    process.env.OPENAQ_API_KEY = OPENAQ_PLACEHOLDER;
    expect(getOpenAqApiKey()).toBeNull();
    expect(isOpenAqConfigured()).toBe(false);
  });

  it('returns null when key is empty or whitespace only', () => {
    process.env.OPENAQ_API_KEY = '    ';
    expect(getOpenAqApiKey()).toBeNull();
    expect(isOpenAqConfigured()).toBe(false);
  });

  it('returns trimmed key and isOpenAqConfigured true when valid secret is configured', () => {
    process.env.OPENAQ_API_KEY = '  sec_openaq_live_token_12345  ';
    expect(getOpenAqApiKey()).toBe('sec_openaq_live_token_12345');
    expect(isOpenAqConfigured()).toBe(true);
  });
});
