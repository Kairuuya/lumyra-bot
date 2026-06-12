import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { BotConfig } from '../../config/index.js';
import type { Locale, LocaleKey, LocaleMap, MessageVars } from './types.js';

const LOCALES_DIR = resolve(import.meta.dirname, 'locales');
export const DEFAULT_LOCALE: Locale = (BotConfig.locale.split('-')[0] || 'id') as Locale;

const locales: LocaleMap = new Map();

async function loadLocales(): Promise<void> {
  // Regenerate types automatically in development
  try {
    const { generateI18nTypes } = await import('./scripts/generate-i18n-types.js');
    generateI18nTypes();
  } catch {
    // Ignore if script is missing in prod build
  }
}

const files = readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'));

for (const file of files) {
  const locale = basename(file, '.json') as Locale;
  const content = JSON.parse(readFileSync(join(LOCALES_DIR, file), 'utf-8'));
  locales.set(locale, content);
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}

export function t<K extends LocaleKey>(
  lang: Locale,
  key: K,
  ...args: MessageVars<K> extends never ? [] : [vars: MessageVars<K>]
): string {
  const vars = args[0] as Record<string, string | number> | undefined;
  const messages = locales.get(lang) ?? locales.get(DEFAULT_LOCALE);
  if (!messages) return key;

  const template = messages[key];
  if (!template) return key;

  return interpolate(template, vars);
}

export function getAvailableLocales(): Locale[] {
  return Array.from(locales.keys());
}

export function hasLocale(locale: string): locale is Locale {
  return locales.has(locale as Locale);
}

// Load locales on import
loadLocales();
