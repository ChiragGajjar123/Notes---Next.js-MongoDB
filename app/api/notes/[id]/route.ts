import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Note from '@/lib/models/Note';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { title, content, category, tags, color, isPinned, isArchived } = body;

    const note = await Note.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        ...(title && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(category && { category }),
        ...(tags && { tags }),
        ...(color && { color }),
        ...(isPinned !== undefined && { isPinned }),
        ...(isArchived !== undefined && { isArchived }),
      },
      { new: true, runValidators: true }
    );

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const note = await Note.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
