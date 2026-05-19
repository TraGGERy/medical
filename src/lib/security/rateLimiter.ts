type RateLimitState = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitState>();

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export function enforceRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const state = rateLimitStore.get(key);

  if (!state || now >= state.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (state.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: state.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000)),
    };
  }

  state.count += 1;
  rateLimitStore.set(key, state);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - state.count),
    resetAt: state.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000)),
  };
}

export function buildRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
    'Retry-After': String(result.retryAfterSeconds),
  };
}
