/**
 * AirAware — AI Subsystem Operational Constants
 */

// Inference & Rate Limits
export const WORKERS_AI_BURST_RATE_LIMIT = 10; // 10 requests per minute burst limit
export const WORKERS_AI_BURST_WINDOW_MS = 60 * 1000; // 1 minute sliding window
export const WORKERS_AI_DAILY_NEURON_LIMIT = 10000; // 10,000 Neurons free daily tier quota
export const AI_CACHE_DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes AI response cache TTL

// Token & Context Budgets
export const MAX_USER_QUERY_CHARS = 200; // 200 character ceiling for prompt injection safety
export const MAX_STORED_CHAT_SESSIONS = 20; // 20 sessions maximum in localStorage
export const MAX_MESSAGES_PER_SESSION = 50; // 50 messages maximum retention per conversation
