import { z } from 'zod';

export const createNoteSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Note content cannot be empty')
    .max(2000, 'Note content cannot exceed 2000 characters'),
});

export const leadNoteParamsSchema = z.object({
  id: z.coerce.number().int().positive('Lead ID must be a positive integer'),
});
