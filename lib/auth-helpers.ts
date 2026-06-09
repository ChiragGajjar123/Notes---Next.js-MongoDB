import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { isValidObjectId } from '@/lib/validations';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import type { RateLimitConfig } from '@/lib/rate-limit';

/**
 * Get the authenticated session, or return null.
 * Use this in API routes where you handle 401 yourself.
 */
export async function getAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Get the authenticated session or return a 401 JSON response.
 * Use this in API route handlers for cleaner code.
 * 
 * @returns `{ session }` on success, `{ response }` on failure.
 */
export async function requireAuth(): Promise<
  | { session: { user: { id: string; name: string; email: string; image?: string | null } }; response?: never }
  | { session?: never; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      ),
    };
  }
  return { session };
}

/**
 * Validate a MongoDB ObjectId parameter.
 * Returns a 400 response if invalid.
 */
export function validateId(id: string): NextResponse | null {
  if (!isValidObjectId(id)) {
    return NextResponse.json(
      { error: 'Invalid ID format.' },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Check rate limiting for a request.
 * Returns a 429 response if rate limit exceeded, null otherwise.
 */
export async function enforceRateLimit(
  request: Request,
  prefix: string,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const result = await checkRateLimit(`${prefix}:${ip}`, config);

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
        },
      }
    );
  }

  return null;
}

/**
 * Enforce API-level rate limiting using user's session ID.
 */
export async function enforceApiRateLimit(
  request: Request,
  userId: string
): Promise<NextResponse | null> {
  const result = await checkRateLimit(`api:${userId}`, RATE_LIMITS.api);

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'Too many requests. Please slow down.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
        },
      }
    );
  }

  return null;
}
