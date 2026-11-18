/**
 * AirAware — Cloudflare Workers AI Configuration
 * 
 * Strictly server-side configuration management.
 * Validates environment variables and enforces least-privilege credential access.
 * Credentials must NEVER be exposed to client bundles or logged.
 */

export interface CloudflareAiConfig {
  accountId: string;
  apiToken: string;
  models: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

export const CLOUDFLARE_DEFAULTS = {
  ACCOUNT_ID: '9e8dabba6e5bbe92479af9cd1f49aa74',
  MODEL_PRIMARY: '@cf/google/gemma-4-26b-a4b-it',
  MODEL_SECONDARY: '@cf/zai-org/glm-4.7-flash',
  MODEL_TERTIARY: '@cf/ibm-granite/granite-4.0-h-micro',
  PLACEHOLDER_TOKEN: 'PASTE_YOUR_CLOUDFLARE_API_TOKEN_HERE',
} as const;

/**
 * Returns true if Cloudflare AI credentials have been configured with a non-placeholder token.
 */
export function isCloudflareConfigured(): boolean {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  return Boolean(
    token &&
    token.trim() !== '' &&
    token.trim() !== CLOUDFLARE_DEFAULTS.PLACEHOLDER_TOKEN
  );
}

/**
 * Retrieves the validated Cloudflare AI configuration.
 * Throws a sanitized error if credentials or account IDs are missing.
 */
export function getCloudflareAiConfig(): CloudflareAiConfig {
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || CLOUDFLARE_DEFAULTS.ACCOUNT_ID).trim();
  const apiToken = (process.env.CLOUDFLARE_API_TOKEN || '').trim();

  if (!apiToken || apiToken === CLOUDFLARE_DEFAULTS.PLACEHOLDER_TOKEN) {
    throw new Error(
      'Cloudflare API token is not configured. Please paste your token into .env.local on the CLOUDFLARE_API_TOKEN line.'
    );
  }

  if (!accountId) {
    throw new Error('Cloudflare Account ID is missing from environment configuration.');
  }

  return {
    accountId,
    apiToken,
    models: {
      primary: (process.env.CLOUDFLARE_AI_MODEL_PRIMARY || CLOUDFLARE_DEFAULTS.MODEL_PRIMARY).trim(),
      secondary: (process.env.CLOUDFLARE_AI_MODEL_SECONDARY || CLOUDFLARE_DEFAULTS.MODEL_SECONDARY).trim(),
      tertiary: (process.env.CLOUDFLARE_AI_MODEL_TERTIARY || CLOUDFLARE_DEFAULTS.MODEL_TERTIARY).trim(),
    },
  };
}
