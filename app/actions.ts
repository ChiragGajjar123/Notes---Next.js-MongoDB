'use server';

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongoose';
import Note from '@/lib/models/Note';
import User from '@/lib/models/User';
import {
  createCategorySchema,
  createNoteSchema,
  forgotPasswordSchema,
  renameCategorySchema,
  resetPasswordSchema,
  updateNoteSchema,
  updateSettingsSchema,
} from '@/lib/validations';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/email';
import type { Note as NoteType } from '@/types';

const RESET_SUCCESS_MESSAGE =
  'A password reset link has been sent to your email address.';

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function validationMessage(error: { issues: { message: string }[] }, fallback: string) {
  return error.issues[0]?.message || fallback;
}

async function getIp() {
  const headerStore = await headers();
  return (
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerStore.get('x-real-ip') ||
    '127.0.0.1'
  );
}

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error('Unauthorized. Please sign in.');
  return session.user.id;
}

async function enforceActionLimit(key: string) {
  const result = await checkRateLimit(key, RATE_LIMITS.passwordReset);
  if (!result.success) {
    const minutes = Math.ceil((result.resetAt - Date.now()) / 60000);
    throw new Error(`Too many attempts. Please try again in ${minutes} minute(s).`);
  }
}

export async function getNotesAction(showArchived = false): Promise<ActionResult<NoteType[]>> {
  try {
    const userId = await requireUserId();
    await connectDB();

    const notes = await Note.find({ userId, isArchived: showArchived })
      .sort({ isPinned: -1, updatedAt: -1 })
      .lean();

    return { ok: true, data: serialize(notes) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch notes' };
  }
}

export async function getCategoriesAction(): Promise<ActionResult<string[]>> {
  try {
    const userId = await requireUserId();
    await connectDB();

    const user = await User.findById(userId).select('categories').lean();
    return { ok: true, data: serialize(user?.categories || []) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to fetch categories' };
  }
}

export async function saveNoteAction(noteData: Partial<NoteType>): Promise<ActionResult<NoteType>> {
  try {
    const userId = await requireUserId();
    await connectDB();

    const validation = noteData._id
      ? updateNoteSchema.safeParse(noteData)
      : createNoteSchema.safeParse(noteData);

    if (!validation.success) {
      return { ok: false, error: validationMessage(validation.error, 'Invalid note') };
    }

    const note = noteData._id
      ? await Note.findOneAndUpdate(
          { _id: noteData._id, userId },
          { $set: validation.data },
          { new: true, runValidators: true }
        )
      : await Note.create({ ...validation.data, userId });

    if (!note) return { ok: false, error: 'Note not found' };
    return { ok: true, data: serialize(note) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to save note' };
  }
}

export async function deleteNoteAction(noteId: string): Promise<ActionResult<true>> {
  try {
    const userId = await requireUserId();
    await connectDB();

    const note = await Note.findOneAndDelete({ _id: noteId, userId });
    if (!note) return { ok: false, error: 'Note not found' };
    return { ok: true, data: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to delete note' };
  }
}

export async function createCategoryAction(name: string): Promise<ActionResult<string[]>> {
  try {
    const userId = await requireUserId();
    const validation = createCategorySchema.safeParse({ name });
    if (!validation.success) {
      return { ok: false, error: validationMessage(validation.error, 'Invalid category') };
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { categories: validation.data.name } },
      { new: true }
    );

    if (!user) return { ok: false, error: 'User not found' };
    return { ok: true, data: serialize(user.categories) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to create category' };
  }
}

export async function renameCategoryAction(oldName: string, newName: string): Promise<ActionResult<true>> {
  try {
    const userId = await requireUserId();
    const validation = renameCategorySchema.safeParse({ oldName, newName });
    if (!validation.success) {
      return { ok: false, error: validationMessage(validation.error, 'Invalid parameters') };
    }

    await connectDB();
    await User.updateOne(
      { _id: userId, categories: validation.data.oldName },
      { $set: { 'categories.$': validation.data.newName } }
    );
    await Note.updateMany(
      { userId, category: validation.data.oldName },
      { $set: { category: validation.data.newName } }
    );

    return { ok: true, data: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to rename category' };
  }
}

export async function deleteCategoryAction(name: string): Promise<ActionResult<true>> {
  try {
    const userId = await requireUserId();
    if (!name.trim()) return { ok: false, error: 'Category name is required.' };

    await connectDB();
    await User.updateOne({ _id: userId }, { $pull: { categories: name } });
    await Note.updateMany({ userId, category: name }, { $set: { category: 'other' } });

    return { ok: true, data: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to delete category' };
  }
}

export async function updateThemeAction(theme: 'light' | 'dark'): Promise<ActionResult<'light' | 'dark'>> {
  try {
    const userId = await requireUserId();
    const validation = updateSettingsSchema.safeParse({ theme });
    if (!validation.success) {
      return { ok: false, error: validationMessage(validation.error, 'Invalid settings') };
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      { theme: validation.data.theme },
      { new: true }
    );

    if (!user) return { ok: false, error: 'User not found' };
    return { ok: true, data: user.theme };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to update settings' };
  }
}

export async function forgotPasswordAction(emailInput: string): Promise<ActionResult<{ message: string; resetUrl?: string }>> {
  try {
    const ip = await getIp();
    
    const cooldownResult = await checkRateLimit(`forgot-password-cooldown:${ip}`, RATE_LIMITS.passwordResetCooldown);
    if (!cooldownResult.success) {
      const seconds = Math.ceil((cooldownResult.resetAt - Date.now()) / 1000);
      throw new Error(`Please wait ${seconds} second(s) before requesting another password reset.`);
    }

    await enforceActionLimit(`forgot-password:${ip}`);

    const validation = forgotPasswordSchema.safeParse({ email: emailInput });
    if (!validation.success) {
      return { ok: false, error: validationMessage(validation.error, 'Invalid email address.') };
    }

    await connectDB();
    const user = await User.findOne({ email: validation.data.email });
    if (!user) return { ok: false, error: 'No account found with this email address.' };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
        },
      }
    );

    const headerStore = await headers();
    const host = headerStore.get('host');
    const proto = headerStore.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const origin = host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL || 'http://localhost:3000');
    const resetUrl = `${origin}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(validation.data.email)}`;
    const emailResult = await sendPasswordResetEmail({
      to: validation.data.email,
      resetUrl,
      userName: user.name,
    });

    const data: { message: string; resetUrl?: string } = { message: RESET_SUCCESS_MESSAGE };
    if (!emailResult.sent && (process.env.NODE_ENV === 'development' || !isEmailConfigured())) {
      data.resetUrl = resetUrl;
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' };
  }
}

export async function resetPasswordAction(params: {
  token: string;
  email: string;
  password: string;
}): Promise<ActionResult<{ message: string }>> {
  try {
    const ip = await getIp();
    await enforceActionLimit(`reset-password:${ip}`);

    if (!params.token || !params.email) {
      return { ok: false, error: 'Token and email are required.' };
    }

    const validation = resetPasswordSchema.safeParse({ password: params.password });
    if (!validation.success) {
      return { ok: false, error: validationMessage(validation.error, 'Invalid password.') };
    }

    await connectDB();
    const user = await User.findOne({ email: params.email }).select(
      '+resetPasswordToken +resetPasswordExpires'
    );

    const hashedToken = crypto.createHash('sha256').update(params.token).digest('hex');
    if (
      !user ||
      user.resetPasswordToken !== hashedToken ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      return { ok: false, error: 'Invalid or expired password reset token.' };
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: await bcrypt.hash(validation.data.password, 12),
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
        $unset: {
          resetPasswordToken: 1,
          resetPasswordExpires: 1,
        },
      }
    );

    return {
      ok: true,
      data: {
        message: 'Your password has been successfully reset. You can now sign in with your new password.',
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.' };
  }
}
