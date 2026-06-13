import type { CommandConfig } from '../../types/commands.js';
import type { Logger } from '../logger/pino.js';

export class CommandRegistry {
  private commands = new Map<string, CommandConfig>();
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  sync(command: CommandConfig[]) {
    this.clear();
    this.register(command);
  }

  register(command: CommandConfig | CommandConfig[]): void {
    if (!Array.isArray(command)) {
      command = [command];
    }
    for (const cmd of command) {
      for (const alias of cmd.aliases ?? []) {
        const normalizedAlias = alias.toLowerCase();

        if (this.commands.has(normalizedAlias)) {
          const existing = this.commands.get(normalizedAlias);
          this.logger?.warn(
            `Duplicate alias detected: "${normalizedAlias}". It is already registered by command named "${existing?.name}". Command named "${cmd.name}" will overwrite it.`,
          );
        }

        this.commands.set(normalizedAlias, cmd);
      }
    }
  }

  unregister(command: CommandConfig | CommandConfig[]): void {
    if (!Array.isArray(command)) {
      command = [command];
    }
    for (const cmd of command) {
      for (const alias of cmd.aliases ?? []) {
        this.commands.delete(alias.toLowerCase());
      }
    }
  }

  get(name: string): CommandConfig | undefined {
    return this.commands.get(name.toLowerCase());
  }

  has(name: string): boolean {
    return this.commands.has(name.toLowerCase());
  }

  clear(): void {
    this.commands.clear();
  }

  get size(): number {
    return this.commands.size;
  }

  list(): CommandConfig[] {
    return [...new Set(this.commands.values())];
  }

  keys(): string[] {
    return Array.from(this.commands.keys());
  }
}
