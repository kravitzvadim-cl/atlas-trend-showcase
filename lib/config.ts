// Every limit that affects cost, time or provider behaviour lives here and can be set from .env.local.
const num = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

export const config = {
  // Models per step (OpenRouter ids). Owner decision 2026-10-16: Haiku 5.5 for every step.
  models: {
    search: process.env.MODEL_SEARCH ?? "anthropic/claude-haiku-5.5",
    judge: process.env.MODEL_JUDGE ?? "anthropic/claude-haiku-5.5",
    kit: process.env.MODEL_KIT ?? "anthropic/claude-haiku-5.5",
    ask: process.env.MODEL_ASK ?? "anthropic/claude-haiku-5.5",
  },
  // Owner decision 2026-10-16: used only when the primary model is unavailable, never after a refusal.
  fallbackModel: process.env.MODEL_FALLBACK ?? "google/gemini-2.5-flash",
  maxRunUsd: num("MAX_RUN_USD", 0.5), // stop starting new paid steps once a run has spent this much
  maxSources: num("MAX_SOURCES", 12), // pages opened per run
  imagesPerPage: num("IMAGES_PER_PAGE", 4), // gallery pages hold the real examples, not just the share image
  // Anthropic rejects >20 images per request when any is over 2000px, so stay at 20.
  maxImages: Math.min(num("MAX_IMAGES", 20), 20), // images sent to the judge per run
  searchMaxResults: num("SEARCH_MAX_RESULTS", 10), // results per web search request
  searchMaxCalls: num("SEARCH_MAX_CALLS", 3), // web searches per run
  maxOutputTokens: num("MAX_OUTPUT_TOKENS", 8000), // per model call
  llmTimeoutMs: num("LLM_TIMEOUT_MS", 90_000),
  fetchTimeoutMs: num("FETCH_TIMEOUT_MS", 6_000),
};
