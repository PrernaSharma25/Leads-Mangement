import { z } from 'zod';

export const createLeadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Invalid email format').toLowerCase(),
  phone: z
    .string()
    .trim()
    .max(30, 'Phone cannot exceed 30 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  status: z.enum(['new', 'contacted', 'qualified', 'lost']).optional().default('new'),
});

export const updateLeadSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').max(100).optional(),
    email: z.string().trim().email('Invalid email format').toLowerCase().optional(),
    phone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .nullable()
      .transform((val) => (val === '' ? null : val)),
    status: z.enum(['new', 'contacted', 'qualified', 'lost']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const leadIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Lead ID must be a positive integer'),
});

export const leadQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'lost']).optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
});
