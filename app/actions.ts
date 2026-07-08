'use server';

import { goApi } from '@/lib/api-client';
import type { Note as NoteType } from '@/types';

// ─── Shared Types ─────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function getNotesAction(showArchived = false): Promise<ActionResult<NoteType[]>> {
  try {
    const notes = await goApi<NoteType[]>(`/api/notes?archived=${showArchived}`);
    return { ok: true, data: notes };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch notes' };
  }
}

export async function saveNoteAction(noteData: Partial<NoteType>): Promise<ActionResult<NoteType>> {
  try {
    const savedNote = await goApi<NoteType>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
    return { ok: true, data: savedNote };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to save note' };
  }
}

export async function deleteNoteAction(noteId: string): Promise<ActionResult<true>> {
  try {
    await goApi<{ ok: boolean }>(`/api/notes?id=${encodeURIComponent(noteId)}`, {
      method: 'DELETE',
    });
    return { ok: true, data: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to delete note' };
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategoriesAction(): Promise<ActionResult<string[]>> {
  try {
    const categories = await goApi<string[]>('/api/categories');
    return { ok: true, data: categories };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch categories' };
  }
}

export async function createCategoryAction(name: string): Promise<ActionResult<string[]>> {
  try {
    const categories = await goApi<string[]>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return { ok: true, data: categories };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to create category' };
  }
}

export async function renameCategoryAction(oldName: string, newName: string): Promise<ActionResult<true>> {
  try {
    await goApi<{ ok: boolean }>('/api/categories', {
      method: 'PUT',
      body: JSON.stringify({ oldName, newName }),
    });
    return { ok: true, data: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to rename category' };
  }
}

export async function deleteCategoryAction(name: string): Promise<ActionResult<true>> {
  try {
    await goApi<{ ok: boolean }>(`/api/categories?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    return { ok: true, data: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to delete category' };
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function updateThemeAction(theme: 'light' | 'dark'): Promise<ActionResult<'light' | 'dark'>> {
  try {
    const res = await goApi<{ theme: 'light' | 'dark' }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    });
    return { ok: true, data: res.theme };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to update theme' };
  }
}
