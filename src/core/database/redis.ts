import { Redis } from "ioredis";
import { RedisConfig } from "../../config/index.js";
import { logger } from "../logger/pino.js";

const log = logger.child({ scope: "redis" });

let client: Redis | null = null;

export function getRedis(): Redis {
	if (client) {
		return client;
	}

	client = new Redis(RedisConfig);

	client.on("error", (err: Error) => {
		log.error({ err }, "Connection error");
	});

	client.on("connect", () => {
		log.info("Connected");
	});

	client.on("close", () => {
		log.debug("Connection closed");
	});

	return client;
}

export async function disconnectRedis(): Promise<void> {
	if (!client) return;

	log.info("Closing connection");
	try {
		if (client.status === "ready") {
			await Promise.race([
				client.quit(),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Quit timeout")), 2000),
				),
			]);
			log.debug("Gracefully closed");
		} else {
			client.disconnect();
			log.debug(`Disconnected forcefully (status: ${client.status})`);
		}
	} catch (err) {
		log.error({ err }, "Error during quit, forcing disconnect");
		client.disconnect();
	}

	client = null;
}
