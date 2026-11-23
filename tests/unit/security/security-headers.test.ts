import { describe, it, expect } from 'vitest';
import nextConfig from '../../../next.config';

describe('Security Headers in next.config', () => {
  it('disables the poweredByHeader', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it('configures strict security headers for all routes', async () => {
    expect(nextConfig.headers).toBeDefined();
    if (!nextConfig.headers) return;

    const headerConfigs = await nextConfig.headers();
    expect(headerConfigs.length).toBeGreaterThan(0);

    const rootConfig = headerConfigs.find((c) => c.source === '/(.*)');
    expect(rootConfig).toBeDefined();

    const headersMap = new Map(rootConfig!.headers.map((h) => [h.key, h.value]));

    expect(headersMap.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headersMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headersMap.get('X-Frame-Options')).toBe('DENY');
    expect(headersMap.get('Permissions-Policy')).toContain('geolocation=(self)');
    expect(headersMap.get('Permissions-Policy')).toContain('camera=()');
    expect(headersMap.get('Permissions-Policy')).toContain('microphone=()');
    expect(headersMap.get('Cross-Origin-Opener-Policy')).toBe('same-origin');

    // CSP must be Report-Only
    const cspReportOnly = headersMap.get('Content-Security-Policy-Report-Only');
    expect(cspReportOnly).toBeDefined();
    expect(cspReportOnly).toContain("default-src 'self'");
    expect(cspReportOnly).toContain('https://air-quality-api.open-meteo.com');
  });
});
