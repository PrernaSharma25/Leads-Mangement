import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').default('file:./dev.db'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Environment configuration validation failed:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
