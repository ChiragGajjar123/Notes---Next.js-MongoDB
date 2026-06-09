import mongoose from 'mongoose';
import connectDB from '@/lib/mongoose';

/**
 * MongoDB-backed sliding window rate limiter.
 * Fully compatible with Vercel serverless functions.
 */

interface RateLimitEntry {
  key: string;
  count: number;
  resetAt: Date;
}

const rateLimitSchema = new mongoose.Schema<RateLimitEntry>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
  resetAt: { type: Date, required: true },
});

// TTL index to automatically delete expired entries
rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit =
  mongoose.models.RateLimit || mongoose.model<RateLimitEntry>('RateLimit', rateLimitSchema);

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxAttempts: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/** Preset configurations for common use cases */
export const RATE_LIMITS = {
  /** Login: 5 attempts per 15 minutes */
  login: { maxAttempts: 5, windowSeconds: 15 * 60 } as RateLimitConfig,
  /** Signup: 3 attempts per hour */
  signup: { maxAttempts: 3, windowSeconds: 60 * 60 } as RateLimitConfig,
  /** General API: 100 requests per minute */
  api: { maxAttempts: 100, windowSeconds: 60 } as RateLimitConfig,
  /** Password reset: 3 attempts per hour */
  passwordReset: { maxAttempts: 3, windowSeconds: 60 * 60 } as RateLimitConfig,
} as const;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key.
 * @param key Unique identifier (e.g., `login:${ip}` or `api:${userId}`)
 * @param config Rate limit configuration
 * @returns RateLimitResult with success status and remaining attempts
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  await connectDB();
  const now = new Date();

  // Try to increment atomically if the entry is still within the window
  const updatedEntry = await RateLimit.findOneAndUpdate(
    { key, resetAt: { $gt: now } },
    { $inc: { count: 1 } },
    { new: true }
  );

  if (updatedEntry) {
    if (updatedEntry.count > config.maxAttempts) {
      return {
        success: false,
        remaining: 0,
        resetAt: updatedEntry.resetAt.getTime(),
      };
    }
    return {
      success: true,
      remaining: Math.max(0, config.maxAttempts - updatedEntry.count),
      resetAt: updatedEntry.resetAt.getTime(),
    };
  }

  // Not found or expired — create a new window
  const resetAt = new Date(Date.now() + config.windowSeconds * 1000);
  
  try {
    const newEntry = await RateLimit.findOneAndUpdate(
      { key },
      { $set: { count: 1, resetAt } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    return {
      success: true,
      remaining: config.maxAttempts - 1,
      resetAt: newEntry.resetAt.getTime(),
    };
  } catch (error) {
    // Handle concurrent duplicate key inserts gracefully
    const retryEntry = await RateLimit.findOne({ key });
    if (retryEntry) {
      return {
        success: retryEntry.count <= config.maxAttempts,
        remaining: Math.max(0, config.maxAttempts - retryEntry.count),
        resetAt: retryEntry.resetAt.getTime(),
      };
    }
    throw error;
  }
}

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback for local development
  return '127.0.0.1';
}
