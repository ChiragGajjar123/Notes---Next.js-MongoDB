import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import Note from '@/lib/models/Note';
import { requireAuth, validateId, enforceApiRateLimit } from '@/lib/auth-helpers';
import { updateNoteSchema } from '@/lib/validations';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, response } = await requireAuth();
    if (response) return response;

    const idError = validateId(id);
    if (idError) return idError;

    const rateLimitResponse = await enforceApiRateLimit(request, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    await connectDB();

    const body = await request.json();
    const validation = updateNoteSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.issues.map((e: { message: string }) => e.message);
      return NextResponse.json(
        { error: errors[0], errors },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    const note = await Note.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, response } = await requireAuth();
    if (response) return response;

    const idError = validateId(id);
    if (idError) return idError;

    const rateLimitResponse = await enforceApiRateLimit(request, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

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
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
