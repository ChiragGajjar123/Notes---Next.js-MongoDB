import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongoose';
import User from '@/lib/models/User';
import { resetPasswordSchema } from '@/lib/validations';
import { enforceRateLimit } from '@/lib/auth-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // 1. Enforce rate limiting
    const rateLimitResponse = await enforceRateLimit(
      request,
      'reset-password',
      RATE_LIMITS.passwordReset
    );
    if (rateLimitResponse) return rateLimitResponse;

    // 2. Parse and validate reset body
    const body = await request.json();
    const { token, email, password } = body;

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required.' },
        { status: 400 }
      );
    }

    const validation = resetPasswordSchema.safeParse({ password });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid password.' },
        { status: 400 }
      );
    }

    // 3. Connect to DB and query the user
    await connectDB();
    const user = await User.findOne({ email }).select(
      '+resetPasswordToken +resetPasswordExpires'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset token.' },
        { status: 400 }
      );
    }

    // 4. Verify the reset token and expiration
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    if (
      user.resetPasswordToken !== hashedToken ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset token.' },
        { status: 400 }
      );
    }

    // 5. Hash new password and update the user record (reset lockouts/attempts too)
    const BCRYPT_ROUNDS = 12;
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null
        },
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpires: 1
        }
      }
    );

    return NextResponse.json({
      message: 'Your password has been successfully reset. You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
