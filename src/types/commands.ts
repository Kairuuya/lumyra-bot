import type { Context } from '../events/message/context/index.js';

export type CommandConfig = {
  name: string;
  aliases: string[];
  description: string;
  isOwner?: boolean;
  isGroup?: boolean;
  isBot?: boolean;
  isPrivate?: boolean;
  isGroupOwner?: boolean;
  isGroupAdmin?: boolean;
  isBotAdmin?: boolean;
  isPremium?: boolean;
  limit?: number;
  usage?: string;
  example?: string;
  cooldown?: number;
  run: (ctx: Context) => Promise<void> | void;
};
