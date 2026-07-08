'use server';

import { headers } from 'next/headers';
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations';
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/email';
import { setSessionCookie, clearSessionCookie } from '@/lib/session';

const RESET_SUCCESS_MESSAGE =
  'A password reset link has been sent to your email address.';

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function getIp() {
  const headerStore = await headers();
  return (
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerStore.get('x-real-ip') ||
    '127.0.0.1'
  );
}

async function callGoAuthApi<T>(path: string, body: any): Promise<T> {
  const ip = await getIp();
  const VERCEL_URL = process.env.VERCEL_URL;
  const isLocal = !VERCEL_URL || VERCEL_URL.includes('localhost') || VERCEL_URL.includes('127.0.0.1');
  const API_BASE = isLocal
    ? `http://${VERCEL_URL || 'localhost:3000'}`
    : `https://${VERCEL_URL}`;

  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) {
    throw new Error('INTERNAL_API_KEY is not configured on the server');
  }

  const url = `${API_BASE}${path}`;
  console.log(`[callGoAuthApi] Fetching: ${url}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': internalKey,
        'X-Client-IP': ip,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Authentication server error');
    }

    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`[callGoAuthApi] Fetch error for ${url}:`, err);
    throw err;
  }
}

export async function signInAction(credentials: { email: string; password?: string }): Promise<ActionResult<{ id: string; name: string; email: string }>> {
  try {
    const email = credentials.email?.trim().toLowerCase();
    const password = credentials.password;

    if (!email || !password) {
      return { ok: false, error: 'Email and password are required' };
    }

    const user = await callGoAuthApi<{ id: string; name: string; email: string }>('/api/signin', {
      email,
      password,
    });

    await setSessionCookie(user.id);

    return { ok: true, data: user };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Invalid email or password.' };
  }
}

export async function signUpAction(params: { name: string; email: string; password?: string }): Promise<ActionResult<{ id: string; name: string; email: string }>> {
  try {
    const name = params.name?.trim();
    const email = params.email?.trim().toLowerCase();
    const password = params.password;

    if (!name || !email || !password) {
      return { ok: false, error: 'Name, email, and password are required' };
    }

    if (password.length < 8) {
      return { ok: false, error: 'Password must be at least 8 characters long.' };
    }

    const user = await callGoAuthApi<{ id: string; name: string; email: string }>('/api/signup', {
      name,
      email,
      password,
    });

    await setSessionCookie(user.id);

    return { ok: true, data: user };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to register account.' };
  }
}

export async function signOutAction(): Promise<ActionResult<true>> {
  try {
    await clearSessionCookie();
    return { ok: true, data: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to sign out.' };
  }
}

export async function forgotPasswordAction(emailInput: string): Promise<ActionResult<{ message: string; resetUrl?: string }>> {
  try {
    const validation = forgotPasswordSchema.safeParse({ email: emailInput });
    if (!validation.success) {
      return { ok: false, error: validation.error.issues[0]?.message ?? 'Invalid email address.' };
    }

    const goRes = await callGoAuthApi<{
      message: string;
      userName: string;
      rawToken: string;
      userEmail: string;
    }>('/api/forgot-password', { email: validation.data.email });

    const headerStore = await headers();
    const host = headerStore.get('host');
    const proto = headerStore.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const origin = host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL || 'http://localhost:3000');
    const resetUrl = `${origin}/auth/reset-password?token=${goRes.rawToken}&email=${encodeURIComponent(goRes.userEmail)}`;

    const emailResult = await sendPasswordResetEmail({
      to: goRes.userEmail,
      resetUrl,
      userName: goRes.userName,
    });

    const data: { message: string; resetUrl?: string } = { message: RESET_SUCCESS_MESSAGE };
    if (!emailResult.sent && (process.env.NODE_ENV === 'development' || !isEmailConfigured())) {
      data.resetUrl = resetUrl;
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' };
  }
}

export async function resetPasswordAction(params: {
  token: string;
  email: string;
  password: string;
}): Promise<ActionResult<{ message: string }>> {
  try {
    if (!params.token || !params.email) {
      return { ok: false, error: 'Token and email are required.' };
    }

    const validation = resetPasswordSchema.safeParse({ password: params.password });
    if (!validation.success) {
      return { ok: false, error: validation.error.issues[0]?.message ?? 'Invalid password.' };
    }

    const goRes = await callGoAuthApi<{ message: string }>('/api/reset-password', {
      token: params.token,
      email: params.email,
      password: validation.data.password,
    });

    return {
      ok: true,
      data: {
        message: goRes.message,
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' };
  }
}
