import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BotConfig } from '../../../config/index.js';

export function generateI18nTypes() {
  const LOCALES_DIR = resolve(import.meta.dirname, '../locales');
  const OUTPUT = resolve(import.meta.dirname, '../__generated.ts');
  const DEFAULT_LOCALE = BotConfig.locale.split('-')[0] || 'id';

  const source = JSON.parse(
    readFileSync(resolve(LOCALES_DIR, `${DEFAULT_LOCALE}.json`), 'utf-8'),
  ) as Record<string, string>;

  const entries = Object.entries(source)
    .map(([key, value]) => {
      const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
      return `  readonly '${key}': '${escaped}';`;
    })
    .join('\n');

  const output = `// Auto-generated from ${DEFAULT_LOCALE}.json — do not edit manually.
// Run: pnpm i18n:generate

export interface DefaultLocaleMessages {
${entries}
}
`;

  // prevent generated too many times
  const isChanged = !existsSync(OUTPUT) || readFileSync(OUTPUT, 'utf-8') !== output;
  if (isChanged) {
    writeFileSync(OUTPUT, output, 'utf-8');
    console.log(`[i18n] Generated types → ${OUTPUT}`);
  }
}
