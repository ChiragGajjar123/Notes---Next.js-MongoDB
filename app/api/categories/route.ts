import { NextRequest, NextResponse } from 'next/server';
import Note from '@/lib/models/Note';
import User from '@/lib/models/User';
import { authenticateAndConnect } from '@/lib/auth-helpers';
import { createCategorySchema, renameCategorySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;
    const user = await User.findById(session.user.id);
    return NextResponse.json({ categories: user?.categories || [] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const body = await request.json();
    const validation = createCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $addToSet: { categories: validation.data.name } },
      { new: true }
    );
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      categories: user.categories,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const body = await request.json();
    const validation = renameCategorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to rename' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const name = request.nextUrl.searchParams.get('name');
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Category name is required.' },
        { status: 400 }
      );
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    );
  }
}
