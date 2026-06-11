import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const configSettingsSchema = z.object({
  ownerNotifyOnline: z.boolean().default(false),
  autoReadStatus: z.boolean().default(false),
  selfbot: z.boolean().default(false),
  publicMode: z.boolean().default(false),
  autoReadMessage: z.boolean().default(false),
  suggestSimilarCommands: z.boolean().default(false),
  useLimit: z.boolean().default(false),
  usePairingCode: z.boolean().default(true),
});

const configSchema = z.object({
  botName: z.string().min(1),
  botNumber: z.string().min(1),
  customPairingCode: z.string().min(8, "At least 8 characters required"),
  ownerNumber: z.array(z.string()).min(1, "At least one owner number required"),
  timezone: z.string().default("Asia/Jakarta"),
  locale: z.string().default("id-ID"),
  prefix: z.array(z.string()).min(1, "At least one prefix required"),
  settings: configSettingsSchema,
});

export type IBotConfig = z.infer<typeof configSchema> & {
  save: () => void;
};

const configPath = resolve(process.cwd(), "settings/config.json");

function loadConfig(): IBotConfig {
  try {
    const rawJSON = JSON.parse(readFileSync(configPath, "utf-8"));
    const parsed = configSchema.parse(rawJSON);

    return {
      ...parsed,
      save() {
        const { save: _, ...data } = this;
        writeFileSync(configPath, JSON.stringify(data, null, 2));
      },
    };
  } catch (err) {
    console.error("Failed to parse config.json:", err);
    process.exit(1);
  }
}

export const BotConfig = loadConfig();
