import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { logger } from "../core/logger/pino.js";

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

const configPath = resolve(process.cwd(), "settings/config.json");
const rawJSON = JSON.parse(readFileSync(configPath, "utf-8"));
const parsed = (() => {
  try {
    return configSchema.parse(rawJSON);
  } catch (err) {
    logger.error({ err }, "Failed to parse config.json");
    process.exit(1);
  }
})();

//  type ConfigSettings = z.infer<typeof configSettingsSchema>;
export type IBotConfig = z.infer<typeof configSchema> & {
  save: () => void;
};
export const BotConfig: IBotConfig = {
  ...parsed,
  save() {
    const { save: _, ...data } = this;
    writeFileSync(configPath, JSON.stringify(data, null, 2));
  },
};
