import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { isValidObjectId } from '@/lib/validations';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import type { RateLimitConfig } from '@/lib/rate-limit';
import connectDB from '@/lib/mongoose';

export async function getAuthSession() {
  return getServerSession(authOptions);
}

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

export function validateId(id: string): NextResponse | null {
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid ID format.' }, { status: 400 });
  }
  return null;
}

async function handleLimit(key: string, config: RateLimitConfig, errorMsg: string): Promise<NextResponse | null> {
  const result = await checkRateLimit(key, config);
  if (result.success) return null;

  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: errorMsg, retryAfter },
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

export function enforceRateLimit(request: Request, prefix: string, config: RateLimitConfig) {
  return handleLimit(`${prefix}:${getClientIp(request)}`, config, 'Too many requests. Please try again later.');
}

export function enforceApiRateLimit(request: Request, userId: string) {
  return handleLimit(`api:${userId}`, RATE_LIMITS.api, 'Too many requests. Please slow down.');
}

export async function authenticateAndConnect(request: Request): Promise<
  | { session: { user: { id: string; name: string; email: string; image?: string | null } }; response?: never }
  | { session?: never; response: NextResponse }
> {
  const { session, response } = await requireAuth();
  if (response) return { response };

  const limitResponse = await enforceApiRateLimit(request, session.user.id);
  if (limitResponse) return { response: limitResponse };

  await connectDB();
  return { session };
}
