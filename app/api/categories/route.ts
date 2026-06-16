import { NextRequest, NextResponse } from 'next/server';
import Note from '@/lib/models/Note';
import User from '@/lib/models/User';
import { apiError, authenticateAndConnect, validationError } from '@/lib/auth-helpers';
import { createCategorySchema, renameCategorySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;
    const user = await User.findById(session.user.id);
    return NextResponse.json({ categories: user?.categories || [] });
  } catch {
    return apiError('Failed to fetch categories');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const body = await request.json();
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      return validationError(validation);
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $addToSet: { categories: validation.data.name } },
      { new: true }
    );
    if (!user) {
      return apiError('User not found', 404);
    }
    return NextResponse.json({
      success: true,
      categories: user.categories,
    });
  } catch {
    return apiError('Failed to create category');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const body = await request.json();
    const validation = renameCategorySchema.safeParse(body);

    if (!validation.success) {
      return validationError(validation, 'Invalid parameters');
    }

    const { oldName, newName } = validation.data;

    // Update String uniformly across User schema AND Notes simultaneously
    await User.updateOne(
      { _id: session.user.id, categories: oldName },
      { $set: { 'categories.$': newName } }
    );

    const result = await Note.updateMany(
      { userId: session.user.id, category: oldName },
      { $set: { category: newName } }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch {
    return apiError('Failed to rename');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const name = request.nextUrl.searchParams.get('name');
    if (!name?.trim()) {
      return apiError('Category name is required.', 400);
    }

    await User.updateOne(
      { _id: session.user.id },
      { $pull: { categories: name } }
    );

    await Note.updateMany(
      { userId: session.user.id, category: name },
      { $set: { category: 'other' } }
    );

    return NextResponse.json({ success: true });
  } catch {
    return apiError('Failed to delete');
  }
}
