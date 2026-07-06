import { gqlFetch } from '@/lib/graphql/client';
import type { Note as NoteType } from '@/types';

// ─── Shared Types ─────────────────────────────────────────────────────────────

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function getNotesAction(showArchived = false): Promise<ActionResult<NoteType[]>> {
  try {
    const data = await gqlFetch<{ notes: NoteType[] }>(
      `query GetNotes($archived: Boolean) {
        notes(archived: $archived) {
          _id title content category tags isPinned isArchived color userId createdAt updatedAt
        }
      }`,
      { archived: showArchived }
    );
    return { ok: true, data: data.notes };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch notes' };
  }
}

export async function saveNoteAction(noteData: Partial<NoteType>): Promise<ActionResult<NoteType>> {
  try {
    const data = await gqlFetch<{
      saveNote: { ok: boolean; note: NoteType | null; error: string | null };
    }>(
      `mutation SaveNote($input: NoteInput!) {
        saveNote(input: $input) {
          ok
          error
          note {
            _id title content category tags isPinned isArchived color userId createdAt updatedAt
          }
        }
      }`,
      { input: noteData }
    );

    const result = data.saveNote;
    if (!result.ok || !result.note) {
      return { ok: false, error: result.error ?? 'Failed to save note' };
    }
    return { ok: true, data: result.note };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to save note' };
  }
}

export async function deleteNoteAction(noteId: string): Promise<ActionResult<true>> {
  try {
    const data = await gqlFetch<{ deleteNote: { ok: boolean; error: string | null } }>(
      `mutation DeleteNote($id: ID!) {
        deleteNote(id: $id) { ok error }
      }`,
      { id: noteId }
    );

    const result = data.deleteNote;
    if (!result.ok) return { ok: false, error: result.error ?? 'Failed to delete note' };
    return { ok: true, data: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to delete note' };
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategoriesAction(): Promise<ActionResult<string[]>> {
  try {
    const data = await gqlFetch<{ categories: string[] }>(
      `query GetCategories { categories }`
    );
    return { ok: true, data: data.categories };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch categories' };
  }
}

export async function createCategoryAction(name: string): Promise<ActionResult<string[]>> {
  try {
    const data = await gqlFetch<{ createCategory: { categories: string[] } }>(
      `mutation CreateCategory($name: String!) {
        createCategory(name: $name) { categories }
      }`,
      { name }
    );
    return { ok: true, data: data.createCategory.categories };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to create category' };
  }
}

export async function renameCategoryAction(oldName: string, newName: string): Promise<ActionResult<true>> {
  try {
    const data = await gqlFetch<{ renameCategory: { ok: boolean; error: string | null } }>(
      `mutation RenameCategory($oldName: String!, $newName: String!) {
        renameCategory(oldName: $oldName, newName: $newName) { ok error }
      }`,
      { oldName, newName }
    );

    const result = data.renameCategory;
    if (!result.ok) return { ok: false, error: result.error ?? 'Failed to rename category' };
    return { ok: true, data: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to rename category' };
  }
}

export async function deleteCategoryAction(name: string): Promise<ActionResult<true>> {
  try {
    const data = await gqlFetch<{ deleteCategory: { ok: boolean; error: string | null } }>(
      `mutation DeleteCategory($name: String!) {
        deleteCategory(name: $name) { ok error }
      }`,
      { name }
    );

    const result = data.deleteCategory;
    if (!result.ok) return { ok: false, error: result.error ?? 'Failed to delete category' };
    return { ok: true, data: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to delete category' };
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function updateThemeAction(theme: 'light' | 'dark'): Promise<ActionResult<'light' | 'dark'>> {
  try {
    const data = await gqlFetch<{ updateTheme: { theme: string } }>(
      `mutation UpdateTheme($theme: String!) {
        updateTheme(theme: $theme) { theme }
      }`,
      { theme }
    );
    return { ok: true, data: data.updateTheme.theme as 'light' | 'dark' };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to update theme' };
  }
}
