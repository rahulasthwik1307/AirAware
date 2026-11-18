import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getCloudflareAiConfig,
  isCloudflareConfigured,
  CLOUDFLARE_DEFAULTS,
} from '@/lib/ai/config';

describe('Cloudflare AI Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('detects placeholder token as not configured', () => {
    process.env.CLOUDFLARE_API_TOKEN = CLOUDFLARE_DEFAULTS.PLACEHOLDER_TOKEN;
    expect(isCloudflareConfigured()).toBe(false);
  });

  it('detects empty or unset token as not configured', () => {
    delete process.env.CLOUDFLARE_API_TOKEN;
    expect(isCloudflareConfigured()).toBe(false);

    process.env.CLOUDFLARE_API_TOKEN = '   ';
    expect(isCloudflareConfigured()).toBe(false);
  });

  it('detects real user-pasted token as configured', () => {
    process.env.CLOUDFLARE_API_TOKEN = 'test_token_cf_12345';
    expect(isCloudflareConfigured()).toBe(true);
  });

  it('throws descriptive error if getCloudflareAiConfig called without configured token', () => {
    process.env.CLOUDFLARE_API_TOKEN = CLOUDFLARE_DEFAULTS.PLACEHOLDER_TOKEN;
    expect(() => getCloudflareAiConfig()).toThrow(
      /Cloudflare API token is not configured.*CLOUDFLARE_API_TOKEN/
    );
  });

  it('loads verified default account ID and models when valid token is present', () => {
    process.env.CLOUDFLARE_API_TOKEN = 'valid_secret_token';
    const config = getCloudflareAiConfig();

    expect(config.accountId).toBe(CLOUDFLARE_DEFAULTS.ACCOUNT_ID);
    expect(config.apiToken).toBe('valid_secret_token');
    expect(config.models.primary).toBe(CLOUDFLARE_DEFAULTS.MODEL_PRIMARY);
    expect(config.models.secondary).toBe(CLOUDFLARE_DEFAULTS.MODEL_SECONDARY);
    expect(config.models.tertiary).toBe(CLOUDFLARE_DEFAULTS.MODEL_TERTIARY);
  });
});
