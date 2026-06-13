import { type Bindings, type LoggerOptions, pino } from 'pino';
import { BotConfig, env } from '../../config/index.js';

const isProduction = env.NODE_ENV === 'production';

const targets = [];

// development
if (!isProduction) {
  targets.push({
    target: 'pino-pretty',
    options: {
      singleLine: false,
      translateTime: false,
    },
  });
}

const dateStr = new Date().toISOString().split('T')[0];

targets.push({
  target: 'pino/file',
  options: {
    destination: isProduction ? `logs/app-${dateStr}.log` : `logs/app-dev-${dateStr}.log`,
    append: true,
    mkdir: true,
  },
});

const options: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: null,
  timestamp: () =>
    `,"time":"${new Date().toLocaleString(BotConfig.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: BotConfig.timezone,
    })}"`,
  transport: {
    targets,
  },
};

export const logger = pino(options);
export type Logger = typeof logger;

/**
 * Create a child logger with bindings for a module or domain.
 * Example: const authLogger = child({ module: "auth" })
 */
export function child(bindings: Bindings) {
  return logger.child(bindings);
}
