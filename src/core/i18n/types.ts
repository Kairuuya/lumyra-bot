import type { DefaultLocaleMessages } from './__generated.js';

export type Locale = 'id' | 'en';

export type LocaleKey = keyof DefaultLocaleMessages;

export type LocaleMessages = Record<LocaleKey, string>;

export type LocaleMap = Map<Locale, LocaleMessages>;

export type ExtractVariables<T extends string> = T extends `${string}{${infer V}}${infer Rest}`
  ? V | ExtractVariables<Rest>
  : never;

export type MessageVars<K extends LocaleKey> =
  ExtractVariables<DefaultLocaleMessages[K]> extends never
    ? never
    : Record<ExtractVariables<DefaultLocaleMessages[K]>, string | number>;
