import { z } from "zod";

export const envSchema = z.object({
  SUPABASE_URL: z.string(),
  SUPABASE_KEY: z.string(),
});

export const env = envSchema.parse(process.env);