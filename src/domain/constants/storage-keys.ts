/**
 * AirAware — Central Storage Keys & Privacy Sanitization
 *
 * Defines authoritative local storage keys and privacy clearing logic.
 */

export const AIRAWARE_STORAGE_KEYS = [
  'airaware_household_v1',
  'airaware_saved_locations',
  'airaware_last_location',
  'airaware_copilot_sessions_v1',
  'airaware_indoor_v1',
  'airaware_onboarding_completed_v1',
  'airaware_cleaner_choices_v1',
  'airaware_community_v1',
  'airaware_personalization_banner_dismissed',
  'airaware_active_plan',
] as const;

export type AirAwareStorageKey = (typeof AIRAWARE_STORAGE_KEYS)[number];

/**
 * Removes all AirAware data from localStorage and sessionStorage.
 * Guarantees zero residual profile, cities, chats, or cached telemetry.
 */
export function clearAllAirAwareData(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Explicit removal of registered keys
    for (const key of AIRAWARE_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }

    // 2. Clear any dynamic or prefixed keys in localStorage
    const localKeysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith('airaware_') || k.startsWith('plan_'))) {
        localKeysToRemove.push(k);
      }
    }
    for (const k of localKeysToRemove) {
      window.localStorage.removeItem(k);
    }

    // 3. Clear all cached telemetry in sessionStorage
    window.sessionStorage.clear();
  } catch {
    // Graceful degradation in restricted sandbox environments
  }
}
