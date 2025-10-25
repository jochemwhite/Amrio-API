import { z } from "zod";

export const envSchema = z.object({
  SUPABASE_URL: z.string(),
  SUPABASE_KEY: z.string(),
  NODE_ENV: z.enum(['development', 'production']),
});

export const env = envSchema.parse(process.env);