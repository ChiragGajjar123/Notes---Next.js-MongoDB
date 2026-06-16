import { NextRequest, NextResponse } from 'next/server';
import Note from '@/lib/models/Note';
import { apiError, authenticateAndConnect, validateId, validationError } from '@/lib/auth-helpers';
import { updateNoteSchema } from '@/lib/validations';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const idError = validateId(id);
    if (idError) return idError;

    const body = await request.json();
    const validation = updateNoteSchema.safeParse(body);

    if (!validation.success) {
      return validationError(validation);
    }

    const updateData = validation.data;

    const note = await Note.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!note) {
      return apiError('Note not found', 404);
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return apiError('Failed to update note');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const idError = validateId(id);
    if (idError) return idError;

    const note = await Note.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!note) {
      return apiError('Note not found', 404);
    }

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return apiError('Failed to delete note');
  }
}
