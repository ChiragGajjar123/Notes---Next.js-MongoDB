import { GraphQLError } from 'graphql';
import Note from '@/lib/models/Note';
import User from '@/lib/models/User';
import {
  createNoteSchema,
  updateNoteSchema,
  createCategorySchema,
  renameCategorySchema,
  updateSettingsSchema,
} from '@/lib/validations';
import type { GraphQLContext } from './context';

function requireAuth(ctx: GraphQLContext): string {
  if (!ctx.userId) {
    throw new GraphQLError('Unauthorized. Please sign in.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.userId;
}

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

interface NoteInput {
  _id?: string;
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const resolvers = {
  Query: {
    // ── notes ─────────────────────────────────────────────────────
    notes: async (_: unknown, args: { archived?: boolean }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const isArchived = args.archived ?? false;

      const notes = await Note.find({ userId, isArchived })
        .sort({ isPinned: -1, updatedAt: -1 })
        .lean();

      return serialize(notes);
    },

    // ── categories ────────────────────────────────────────────────
    categories: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const user = await User.findById(userId).select('categories').lean();
      return serialize(user?.categories ?? []);
    },

    // ── settings ──────────────────────────────────────────────────
    settings: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const user = await User.findById(userId).select('theme').lean();
      if (!user) {
        throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
      }
      return { theme: user.theme ?? 'light' };
    },
  },

  Mutation: {
    // ── saveNote ──────────────────────────────────────────────────
    saveNote: async (_: unknown, args: { input: NoteInput }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      const { input } = args;

      const validation = input._id
        ? updateNoteSchema.safeParse(input)
        : createNoteSchema.safeParse(input);

      if (!validation.success) {
        return {
          ok: false,
          note: null,
          error: validation.error.issues[0]?.message ?? 'Invalid note data',
        };
      }

      try {
        const note = input._id
          ? await Note.findOneAndUpdate(
              { _id: input._id, userId },
              { $set: validation.data },
              { new: true, runValidators: true }
            )
          : await Note.create({ ...validation.data, userId });

        if (!note) return { ok: false, note: null, error: 'Note not found' };
        return { ok: true, note: serialize(note), error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save note';
        return { ok: false, note: null, error: msg };
      }
    },

    // ── deleteNote ────────────────────────────────────────────────
    deleteNote: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);

      try {
        const note = await Note.findOneAndDelete({ _id: args.id, userId });
        if (!note) return { ok: false, error: 'Note not found' };
        return { ok: true, error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete note';
        return { ok: false, error: msg };
      }
    },

    // ── createCategory ────────────────────────────────────────────
    createCategory: async (_: unknown, args: { name: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);

      const validation = createCategorySchema.safeParse({ name: args.name });
      if (!validation.success) {
        throw new GraphQLError(
          validation.error.issues[0]?.message ?? 'Invalid category name',
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { categories: validation.data.name } },
        { new: true }
      );

      if (!user) {
        throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
      }

      return { categories: serialize(user.categories) };
    },

    // ── renameCategory ────────────────────────────────────────────
    renameCategory: async (
      _: unknown,
      args: { oldName: string; newName: string },
      ctx: GraphQLContext
    ) => {
      const userId = requireAuth(ctx);

      const validation = renameCategorySchema.safeParse({
        oldName: args.oldName,
        newName: args.newName,
      });
      if (!validation.success) {
        return {
          ok: false,
          error: validation.error.issues[0]?.message ?? 'Invalid parameters',
        };
      }

      try {
        await User.updateOne(
          { _id: userId, categories: validation.data.oldName },
          { $set: { 'categories.$': validation.data.newName } }
        );
        await Note.updateMany(
          { userId, category: validation.data.oldName },
          { $set: { category: validation.data.newName } }
        );
        return { ok: true, error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to rename category';
        return { ok: false, error: msg };
      }
    },

    // ── deleteCategory ────────────────────────────────────────────
    deleteCategory: async (_: unknown, args: { name: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);

      if (!args.name?.trim()) {
        return { ok: false, error: 'Category name is required.' };
      }

      try {
        await User.updateOne({ _id: userId }, { $pull: { categories: args.name } });
        await Note.updateMany(
          { userId, category: args.name },
          { $set: { category: 'other' } }
        );
        return { ok: true, error: null };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete category';
        return { ok: false, error: msg };
      }
    },

    // ── updateTheme ───────────────────────────────────────────────
    updateTheme: async (_: unknown, args: { theme: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);

      const validation = updateSettingsSchema.safeParse({ theme: args.theme });
      if (!validation.success) {
        throw new GraphQLError(
          validation.error.issues[0]?.message ?? 'Invalid theme',
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { theme: validation.data.theme },
        { new: true }
      );

      if (!user) {
        throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
      }

      return { theme: user.theme };
    },
  },
};
