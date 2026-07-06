'use server';

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongoose';
import User from '@/lib/models/User';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/email';

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

async function enforceActionLimit(key: string) {
  const result = await checkRateLimit(key, RATE_LIMITS.passwordReset);
  if (!result.success) {
    const minutes = Math.ceil((result.resetAt - Date.now()) / 60000);
    throw new Error(`Too many attempts. Please try again in ${minutes} minute(s).`);
  }
}

export async function forgotPasswordAction(emailInput: string): Promise<ActionResult<{ message: string; resetUrl?: string }>> {
  try {
    const ip = await getIp();

    const cooldownResult = await checkRateLimit(`forgot-password-cooldown:${ip}`, RATE_LIMITS.passwordResetCooldown);
    if (!cooldownResult.success) {
      const seconds = Math.ceil((cooldownResult.resetAt - Date.now()) / 1000);
      throw new Error(`Please wait ${seconds} second(s) before requesting another password reset.`);
    }

    await enforceActionLimit(`forgot-password:${ip}`);

    const validation = forgotPasswordSchema.safeParse({ email: emailInput });
    if (!validation.success) {
      return { ok: false, error: validation.error.issues[0]?.message ?? 'Invalid email address.' };
    }

    await connectDB();
    const user = await User.findOne({ email: validation.data.email });
    if (!user) return { ok: false, error: 'No account found with this email address.' };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
        },
      }
    );

    const headerStore = await headers();
    const host = headerStore.get('host');
    const proto = headerStore.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const origin = host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL || 'http://localhost:3000');
    const resetUrl = `${origin}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(validation.data.email)}`;
    const emailResult = await sendPasswordResetEmail({
      to: validation.data.email,
      resetUrl,
      userName: user.name,
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
    const ip = await getIp();
    await enforceActionLimit(`reset-password:${ip}`);

    if (!params.token || !params.email) {
      return { ok: false, error: 'Token and email are required.' };
    }

    const validation = resetPasswordSchema.safeParse({ password: params.password });
    if (!validation.success) {
      return { ok: false, error: validation.error.issues[0]?.message ?? 'Invalid password.' };
    }

    await connectDB();
    const user = await User.findOne({ email: params.email }).select(
      '+resetPasswordToken +resetPasswordExpires'
    );

    const hashedToken = crypto.createHash('sha256').update(params.token).digest('hex');
    if (
      !user ||
      user.resetPasswordToken !== hashedToken ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      return { ok: false, error: 'Invalid or expired password reset token.' };
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: await bcrypt.hash(validation.data.password, 12),
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpires: 1,
        },
      }
    );

    return {
      ok: true,
      data: {
        message: 'Your password has been successfully reset. You can now sign in with your new password.',
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' };
  }
}
