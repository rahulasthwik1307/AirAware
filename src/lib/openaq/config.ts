import { z } from 'zod';

const OpenAqEnvSchema = z.object({
  OPENAQ_API_KEY: z.string().min(1).optional(),
});

export const OPENAQ_PLACEHOLDER = 'your_openaq_api_key_here';

/**
 * Validates and retrieves the OpenAQ API key strictly on the server side.
 * Never logs or exposes the key to client bundles.
 * Degrades gracefully by returning null when the key is missing or set to a placeholder.
 */
export function getOpenAqApiKey(): string | null {
  const result = OpenAqEnvSchema.safeParse(process.env);
  if (!result.success || !result.data.OPENAQ_API_KEY) {
    return null;
  }
  const key = result.data.OPENAQ_API_KEY.trim();
  if (key === '' || key === OPENAQ_PLACEHOLDER) {
    return null;
  }
  return key;
}

export function isOpenAqConfigured(): boolean {
  return getOpenAqApiKey() !== null;
}
