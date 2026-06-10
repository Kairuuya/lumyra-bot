import "dotenv/config";
import { z } from "zod/v4";

const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z.string().default("info"),
  APP_LOCALE: z.string().default("id-ID"),
  APP_TIMEZONE: z.string().default("Asia/Jakarta"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().optional().default(6379),
  ),
  REDIS_PASSWORD: z.string().optional().default(""),
  REDIS_DB: z.preprocess(
    emptyToUndefined,
    z.coerce.number().optional().default(0),
  ),
});
export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
