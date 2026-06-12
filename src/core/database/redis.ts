import { Redis } from "ioredis";
import { RedisConfig } from "../../config/index.js";
import { child } from "../logger/pino.js";

let client: Redis | null = null;
const logger = child({ scope: "redis" });
export function getRedis(): Redis {
  if (client) {
    return client;
  }

  client = new Redis(RedisConfig);

  client.on("error", (err: Error) => {
    logger.error({ err }, "Connection error");
  });

  client.on("connect", () => {
    logger.info("Connected to redis");
  });

  client.on("close", () => {
    logger.debug("Connection closed");
  });

  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (!client) return;

  logger.info("Closing connection");
  try {
    if (client.status === "ready") {
      await Promise.race([
        client.quit(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Quit timeout")), 2000),
        ),
      ]);
      logger.debug("Gracefully closed");
    } else {
      client.disconnect();
      logger.debug(`Disconnected forcefully (status: ${client.status})`);
    }
  } catch (err) {
    logger.error({ err }, "Error during quit, forcing disconnect");
    client.disconnect();
  }

  client = null;
}
