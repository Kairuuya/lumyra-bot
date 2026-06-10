import { env } from "./env.config.js";

interface IRedisConfig {
  host: string;
  port: number;
  password: string | undefined;
  db: number;
  enableReadyCheck: boolean;
  retryStrategy: (times: number) => number;
  enableOfflineQueue: boolean;
}

export const RedisConfig: IRedisConfig = {
  host: env.REDIS_HOST ?? "localhost",
  port: env.REDIS_PORT ?? 6379,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB ?? 0,
  enableReadyCheck: true,
  retryStrategy: (times: number) => Math.min(times * 100, 3000),
  enableOfflineQueue: true, // Prevents hanging when Redis is down
};
