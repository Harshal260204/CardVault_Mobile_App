import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const contactSearchSchema = z.object({
  q: z.string().optional(),
  mode: z.enum(['visitor', 'exhibitor', 'quick_capture', 'legacy']).optional(),
  leadQualifier: z.enum(['hot', 'warm', 'cold']).optional(),
  sessionId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ContactSearchParams = z.infer<typeof contactSearchSchema>;

export const createContactSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(200),
  company: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal('')),
  captureMode: z
    .enum(['visitor', 'exhibitor', 'quick_capture', 'legacy'])
    .optional(),
  leadQualifier: z.enum(['hot', 'warm', 'cold']).optional(),
});

export type CreateContactFormValues = z.infer<typeof createContactSchema>;
