import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback token bucket for dev / tests when Upstash env vars are omitted
class MemoryRatelimit {
  private map = new Map<string, { count: number; resetAt: number }>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowSeconds: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  async limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now();
    const entry = this.map.get(identifier);

    if (!entry || now > entry.resetAt) {
      this.map.set(identifier, { count: 1, resetAt: now + this.windowMs });
      return { success: true, limit: this.maxRequests, remaining: this.maxRequests - 1, reset: now + this.windowMs };
    }

    if (entry.count >= this.maxRequests) {
      return { success: false, limit: this.maxRequests, remaining: 0, reset: entry.resetAt };
    }

    entry.count += 1;
    return { success: true, limit: this.maxRequests, remaining: this.maxRequests - entry.count, reset: entry.resetAt };
  }
}

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const hasUpstash = Boolean(upstashUrl && upstashToken);

let redis: Redis | null = null;
if (hasUpstash && upstashUrl && upstashToken) {
  redis = new Redis({
    url: upstashUrl,
    token: upstashToken,
  });
}

export function createLimiter(requests: number, windowSeconds: number) {
  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, `${windowSeconds} s`),
      analytics: true,
      prefix: "vaulta_rl",
    });

    return {
      limit: async (id: string) => {
        try {
          const res = await ratelimit.limit(id);
          return {
            success: res.success,
            limit: res.limit,
            remaining: res.remaining,
            reset: res.reset,
          };
        } catch {
          // Fall back gracefully if Redis is momentarily unreachable
          return { success: true, limit: requests, remaining: 1, reset: Date.now() + 1000 };
        }
      },
    };
  }

  return new MemoryRatelimit(requests, windowSeconds);
}

// Pre-configured rate limiters
export const authLimiter = createLimiter(10, 60); // 10 attempts per minute per IP
export const otpSendLimiter = createLimiter(5, 3600); // Max 5 sends per hour per email/IP
export const otpVerifyLimiter = createLimiter(5, 600); // 5 attempts per 10 mins
export const apiUploadLimiter = createLimiter(60, 60); // 60 uploads / min
export const publicShareLimiter = createLimiter(30, 60); // 30 share views / min
