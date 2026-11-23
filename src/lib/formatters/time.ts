/**
 * Shared time formatting utilities for environmental telemetry provenance and data age.
 */

/**
 * Formats an ISO or standard timestamp string into human-readable data age (e.g. "just now", "12m ago", "2h 15m ago").
 */
export function formatDataAge(timestampStr?: string | null): string {
  if (!timestampStr) return 'recent';
  try {
    const iso = timestampStr.includes('T') ? timestampStr : timestampStr.replace(' ', 'T');
    const time = new Date(iso).getTime();
    if (isNaN(time)) return 'recent';
    const diffMs = Date.now() - time;
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ${diffMin % 60}m ago`;
  } catch {
    return 'recent';
  }
}
