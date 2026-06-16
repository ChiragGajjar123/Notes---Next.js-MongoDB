import { NextRequest, NextResponse } from 'next/server';
import Note from '@/lib/models/Note';
import { apiError, authenticateAndConnect, validationError } from '@/lib/auth-helpers';
import { createNoteSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isArchived = searchParams.get('archived') === 'true';

    const query: Record<string, unknown> = {
      userId: session.user.id,
      isArchived,
    };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const notes = await Note.find(query)
      .sort({ isPinned: -1, updatedAt: -1 })
      .lean();

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return apiError('Failed to fetch notes');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, response } = await authenticateAndConnect(request);
    if (response) return response;

    const body = await request.json();
    const validation = createNoteSchema.safeParse(body);

    if (!validation.success) {
      return validationError(validation);
    }

    const { title, content, category, tags, color } = validation.data;

    const note = await Note.create({
      title,
      content,
      category,
      tags,
      color,
      userId: session.user.id,
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return apiError('Failed to create note');
  }
}
