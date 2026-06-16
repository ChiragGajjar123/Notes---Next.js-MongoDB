import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import { apiError, authenticateAndConnect, validationError } from '@/lib/auth-helpers';
import { updateSettingsSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;
    const user = await User.findById(session.user.id);
    if (!user) {
      return apiError('User not found', 404);
    }

    return NextResponse.json({
      theme: user.theme || 'light',
    });
  } catch {
    return apiError('Failed to fetch settings');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const body = await request.json();
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return validationError(validation, 'Invalid settings');
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { theme: validation.data.theme },
      { new: true }
    );

    if (!user) {
      return apiError('User not found', 404);
    }

    return NextResponse.json({ success: true, theme: user.theme });
  } catch {
    return apiError('Failed to update settings');
  }
}
