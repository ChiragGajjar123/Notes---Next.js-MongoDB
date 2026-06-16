import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import { authenticateAndConnect } from '@/lib/auth-helpers';
import { updateSettingsSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      theme: user.theme || 'light',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const body = await request.json();
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid settings' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { theme: validation.data.theme },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, theme: user.theme });
  } catch {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
