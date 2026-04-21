import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Note from '@/lib/models/Note';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.user.id);
    return NextResponse.json({ categories: user?.categories || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $addToSet: { categories: name.trim() } },
      { new: true }
    );
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, categories: user.categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { oldName, newName } = await request.json();
    if (!oldName || !newName?.trim()) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });

    // Update String uniformly across User schema AND Notes simultaneously 
    await User.updateOne(
      { _id: session.user.id, categories: oldName },
      { $set: { 'categories.$': newName.trim() } }
    );

    const result = await Note.updateMany(
      { userId: session.user.id, category: oldName },
      { $set: { category: newName.trim() } }
    );

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to rename' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const name = request.nextUrl.searchParams.get('name');
    if (!name) return NextResponse.json({ error: 'Invalid parameter' }, { status: 400 });

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
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
