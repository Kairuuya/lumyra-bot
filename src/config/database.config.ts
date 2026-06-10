import { env } from "./env.config.js";

interface IDatabaseConfig {
  url: string;
}

export const DatabaseConfig: IDatabaseConfig = {
  url: env.DATABASE_URL,
};
