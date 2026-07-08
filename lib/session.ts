import { cookies } from 'next/headers';
import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-12345';
const COOKIE_NAME = 'session_token';

function signSession(userId: string): string {
  const signature = crypto.createHmac('sha256', SECRET).update(userId).digest('hex');
  return `${userId}.${signature}`;
}

function verifySession(sessionStr: string): string | null {
  if (!sessionStr) return null;
  const [userId, signature] = sessionStr.split('.');
  if (!userId || !signature) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(userId).digest('hex');
  if (signature === expected) return userId;
  return null;
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  return verifySession(sessionCookie.value);
}

export async function setSessionCookie(userId: string): Promise<void> {
  const token = signSession(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    maxAge: 0,
    path: '/',
  });
}
