/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Tracks request counts per IP address within a time window.
 *
 * NOTE: This is an in-memory store, so limits reset on server restart.
 * For a production app with multiple server instances, use Redis instead.
 */

const rateLimitStore = new Map();

/**
 * Rate limiter factory.
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds (e.g. 15 * 60 * 1000 for 15 min)
 * @param {number} options.max - Max requests allowed in the window per IP
 * @returns {(request: Request) => { success: boolean, remaining: number, reset: number }}
 */
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 5 } = {}) {
  return function checkRateLimit(request) {
    // Try to get the real IP from common proxy headers, fallback to a static string
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const now = Date.now();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetAt) {
      // First request, or window has expired — start fresh
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return { success: true, remaining: max - 1, reset: now + windowMs };
    }

    if (record.count >= max) {
      // Limit exceeded
      return { success: false, remaining: 0, reset: record.resetAt };
    }

    // Increment count within the current window
    record.count += 1;
    const remaining = max - record.count;
    return { success: true, remaining, reset: record.resetAt };
  };
}

// Pre-built limiters for commonly used routes
export const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });
export const forgotPasswordLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 3 });
