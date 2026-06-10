import { type LoggerOptions, pino } from "pino";
import { BotConfig, env } from "../../config/index.js";

const isProduction = env.NODE_ENV === "production";

const targets = [];

// development
if (!isProduction) {
  targets.push({
    target: "pino-pretty",
    options: {
      singleLine: false,
      translateTime: false,
    },
  });
}

// production
targets.push({
  target: "pino/file",
  options: {
    destination: isProduction ? "logs/app.log" : "logs/app-dev.log",
    append: true,
    mkdir: true,
  },
});

const options: LoggerOptions = {
  level: env.LOG_LEVEL,
  base: null,
  timestamp: () =>
    `,"time":"${new Date().toLocaleString(BotConfig.locale, {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: BotConfig.timezone,
    })}"`,
  transport: {
    targets,
  },
};

export const logger = pino(options);
export type Logger = typeof logger;
