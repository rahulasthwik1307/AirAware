/**
 * AirAware — Deterministic Offline Guidance Engine
 *
 * Authoritative, scientific rule-based environmental guidance engine.
 * Generates verified guidance from EPA/WHO criteria in pure TypeScript with zero network calls.
 * Serves as the reliable foundation when AI is disabled, rate-limited, or unavailable.
 */

export {
  getDeterministicGuidance,
  getDeterministicCopilotAnswer,
} from './deterministic-fallback/index';
