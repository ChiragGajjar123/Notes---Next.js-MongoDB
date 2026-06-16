import { z } from 'zod';

// ─── Password Policy ─────────────────────────────────────────────
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
} as const;

export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= PASSWORD_RULES.minLength },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  const passed = PASSWORD_REQUIREMENTS.filter((r) => r.test(password)).length;
  const ratio = passed / PASSWORD_REQUIREMENTS.length;
  if (ratio <= 0.2) return { score: ratio * 100, label: 'Very Weak', color: 'bg-red-500' };
  if (ratio <= 0.4) return { score: ratio * 100, label: 'Weak', color: 'bg-orange-500' };
  if (ratio <= 0.6) return { score: ratio * 100, label: 'Fair', color: 'bg-yellow-500' };
  if (ratio <= 0.8) return { score: ratio * 100, label: 'Good', color: 'bg-blue-500' };
  return { score: 100, label: 'Strong', color: 'bg-green-500' };
}

// ─── Auth Schemas ────────────────────────────────────────────────
export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must be 100 characters or fewer.')
    .refine((val) => val.toLowerCase() !== 'undefined', {
      message: 'Please enter a valid name.',
    }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.'),
  password: z
    .string()
    .min(PASSWORD_RULES.minLength, `Password must be at least ${PASSWORD_RULES.minLength} characters.`)
    .max(PASSWORD_RULES.maxLength, `Password must be ${PASSWORD_RULES.maxLength} characters or fewer.`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.'),
});

export const signinSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Password is required.'),
});

// ─── Note Schemas ────────────────────────────────────────────────
export const createNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(200, 'Title must be 200 characters or fewer.'),
  content: z
    .string()
    .default(''),
  category: z
    .string()
    .trim()
    .max(50, 'Category must be 50 characters or fewer.')
    .default('other'),
  tags: z
    .array(z.string().trim().max(50, 'Tag must be 50 characters or fewer.'))
    .max(20, 'Maximum 20 tags allowed.')
    .default([]),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format.')
    .default('#ffffff'),
});

export const updateNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(200, 'Title must be 200 characters or fewer.')
    .optional(),
  content: z
    .string()
    .optional(),
  category: z
    .string()
    .trim()
    .max(50)
    .optional(),
  tags: z
    .array(z.string().trim().max(50))
    .max(20)
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format.')
    .optional(),
  isPinned: z
    .boolean()
    .optional(),
  isArchived: z
    .boolean()
    .optional(),
});

// ─── Category Schemas ────────────────────────────────────────────
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required.')
    .max(50, 'Category name must be 50 characters or fewer.'),
});

export const renameCategorySchema = z.object({
  oldName: z
    .string()
    .trim()
    .min(1, 'Old category name is required.'),
  newName: z
    .string()
    .trim()
    .min(1, 'New category name is required.')
    .max(50, 'Category name must be 50 characters or fewer.'),
});

// ─── Settings Schemas ────────────────────────────────────────────
export const updateSettingsSchema = z.object({
  theme: z
    .enum(['light', 'dark'], {
      error: 'Theme must be "light" or "dark".',
    }),
});

// ─── MongoDB ObjectId Validation ─────────────────────────────────
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export function isValidObjectId(id: string): boolean {
  return OBJECT_ID_PATTERN.test(id);
}

// ─── Forgot/Reset Password Schemas ────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(PASSWORD_RULES.minLength, `Password must be at least ${PASSWORD_RULES.minLength} characters.`)
    .max(PASSWORD_RULES.maxLength, `Password must be ${PASSWORD_RULES.maxLength} characters or fewer.`)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character.'),
});
