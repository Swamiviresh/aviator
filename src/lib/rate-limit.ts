// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function rateLimit(config: RateLimitConfig): (identifier: string) => { allowed: boolean; retryAfter?: number } {
  return (identifier: string) => {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(identifier, { count: 1, resetTime: now + config.windowMs });
      return { allowed: true };
    }

    record.count++;
    if (record.count > config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    return { allowed: true };
  };
}

// Pre-configured limiters
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 20 }); // 20 per 15 min
export const betLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 30 }); // 30 per min
export const apiLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 60 }); // 60 per min

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);