import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongoose';
import User from '@/lib/models/User';
import { forgotPasswordSchema } from '@/lib/validations';
import { enforceRateLimit } from '@/lib/auth-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/email';

const SUCCESS_MESSAGE =
  'If an account with that email exists, a password reset link has been sent to your inbox.';

export async function POST(request: Request) {
  try {
    // 1. Enforce rate limiting
    const rateLimitResponse = await enforceRateLimit(
      request,
      'forgot-password',
      RATE_LIMITS.passwordReset
    );
    if (rateLimitResponse) return rateLimitResponse;

    // 2. Parse and validate email input
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid email address.' },
        { status: 400 }
      );
    }

    const email = validation.data.email;

    // 3. Connect to DB and search for user
    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    const successResponse = { message: SUCCESS_MESSAGE };

    // 4. Generate random secure token and SHA-256 hash it
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    // 5. Save hashed token and expiry in DB
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: expiryDate,
        },
      }
    );

    // 6. Generate the reset URL
    const origin = process.env.NEXTAUTH_URL || new URL(request.url).origin;
    const resetUrl = `${origin}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    const emailResult = await sendPasswordResetEmail({
      to: email,
      resetUrl,
      userName: user.name,
    });

    const responsePayload: { message: string; resetUrl?: string } = {
      ...successResponse,
    };

    if (emailResult.sent) {
      return NextResponse.json(responsePayload);
    }

    console.error('Failed to send password reset email:', emailResult.error);
    console.log(
      `\n========================================\n[PASSWORD RESET LINK]: ${resetUrl}\n========================================\n`
    );

    // Dev fallback when email is not configured or delivery fails
    if (process.env.NODE_ENV === 'development' || !isEmailConfigured()) {
      responsePayload.resetUrl = resetUrl;
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
