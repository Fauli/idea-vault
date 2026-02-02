import { RateLimiterMemory } from 'rate-limiter-flexible'

// Rate limiter for login attempts: 5 attempts per email per 15 minutes
const loginLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 15 * 60, // 15 minutes
  keyPrefix: 'login',
})

export type RateLimitResult =
  | { success: true }
  | { success: false; retryAfterSeconds: number }

/**
 * Check if a login attempt is allowed for the given email
 * Returns success: true if allowed, or retry info if rate limited
 */
export async function checkLoginRateLimit(
  email: string
): Promise<RateLimitResult> {
  try {
    await loginLimiter.consume(email.toLowerCase())
    return { success: true }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'msBeforeNext' in error &&
      typeof error.msBeforeNext === 'number'
    ) {
      const retryAfterSeconds = Math.ceil(error.msBeforeNext / 1000)
      return { success: false, retryAfterSeconds }
    }
    // Unknown error, allow the request
    return { success: true }
  }
}

/**
 * Reset rate limit for an email (e.g., after successful login)
 */
export async function resetLoginRateLimit(email: string): Promise<void> {
  try {
    await loginLimiter.delete(email.toLowerCase())
  } catch {
    // Ignore errors on reset
  }
}
