import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongoose';
import User from '@/lib/models/User';
import { forgotPasswordSchema } from '@/lib/validations';
import { enforceRateLimit } from '@/lib/auth-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

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

    // For security reasons, do not reveal if the user exists or not (prevent email enumeration)
    const successResponse = {
      message: 'If an account with that email exists, a password reset link has been generated.'
    };

    if (!user) {
      return NextResponse.json(successResponse);
    }

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
          resetPasswordExpires: expiryDate
        }
      }
    );

    // 6. Generate the reset URL
    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    
    // Log to console for the developer
    console.log(`\n========================================\n[PASSWORD RESET LINK]: ${resetUrl}\n========================================\n`);

    // In local development or staging, we return the reset link in the response to make it easy to test
    const responsePayload = {
      ...successResponse,
      ...(process.env.NODE_ENV === 'development' ? { resetUrl } : {})
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
