import { z } from 'zod';

/**
 * Validates international and national phone numbers.
 * - Allows optional leading '+'
 * - Allows digits, spaces, hyphens, dots, and balanced parentheses
 * - Enforces ITU E.164 standard length: 7 to 15 digits
 * - Rejects malformed separators (-- or .. or leading/trailing separators)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;

  // Must only contain valid phone characters
  const allowedCharsRegex = /^\+?[0-9\s\-().]+$/;
  if (!allowedCharsRegex.test(trimmed)) {
    return false;
  }

  // Reject consecutive separators (e.g., '--', '..', multiple spaces)
  if (/[-.]{2,}|\s{2,}/.test(trimmed)) {
    return false;
  }

  // Balanced parentheses check: if present, must be exactly one pair '(' ... ')' enclosing only digits
  const openCount = (trimmed.match(/\(/g) || []).length;
  const closeCount = (trimmed.match(/\)/g) || []).length;
  if (openCount !== closeCount || openCount > 1) {
    return false;
  }
  if (openCount === 1) {
    const openIdx = trimmed.indexOf('(');
    const closeIdx = trimmed.indexOf(')');
    if (closeIdx <= openIdx + 1) return false;
    const insideParen = trimmed.substring(openIdx + 1, closeIdx);
    if (!/^\d+$/.test(insideParen)) return false;
  }

  // Count total digits: E.164 standard allows 7 to 15 digits
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return false;
  }

  // Must not start or end with a hyphen or dot
  if (/^[-.]|[-.]$/.test(trimmed)) {
    return false;
  }

  return true;
}

export const phoneSchema = z
  .string()
  .trim()
  .max(30, 'Phone cannot exceed 30 characters')
  .optional()
  .nullable()
  .refine((val) => val === undefined || val === null || val === '' || isValidPhoneNumber(val), {
    message:
      'Invalid phone number format. Must contain 7 to 15 digits (e.g., +1-555-0101, (555) 123-4567, or +44-20-7946-0912)',
  })
  .transform((val) => (val === '' ? null : val));

export const createLeadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email format')
    .toLowerCase()
    .max(255, 'Email cannot exceed 255 characters'),
  phone: phoneSchema,
  status: z.enum(['new', 'contacted', 'qualified', 'lost']).optional().default('new'),
});

export const updateLeadSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name cannot be empty')
      .max(100, 'Name cannot exceed 100 characters')
      .optional(),
    email: z
      .string()
      .trim()
      .email('Invalid email format')
      .toLowerCase()
      .max(255, 'Email cannot exceed 255 characters')
      .optional(),
    phone: phoneSchema,
    status: z.enum(['new', 'contacted', 'qualified', 'lost']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const leadIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Lead ID must be a positive integer'),
});

export const leadQuerySchema = z.object({
  search: z.string().trim().max(100, 'Search query cannot exceed 100 characters').optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'lost']).optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
});
