import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { DatabaseConfig } from "../../config/index.js";

let client: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
	if (client) {
		return client;
	}

	const adapter = new PrismaPg({
		connectionString: DatabaseConfig.url,
	});

	const prisma = new PrismaClient({
		adapter,
		errorFormat: "pretty",
		log: ["info", "warn", "error", "query"],
	});

	client = prisma;
	return client;
}

export async function disconnectPrisma(): Promise<void> {
	if (!client) {
		return;
	}
	await client.$disconnect();

	client = null;
}
