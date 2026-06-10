import { type Bindings, type LoggerOptions, pino } from "pino";
import { env } from "../../config/env.config.js";

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
    `,"time":"${new Date().toLocaleString(env.APP_LOCALE, {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: env.APP_TIMEZONE,
    })}"`,
  transport: {
    targets,
  },
};

export const logger = pino(options);
export type Logger = typeof logger;
