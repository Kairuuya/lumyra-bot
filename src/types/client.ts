import type { Readable } from 'node:stream';

export type ClientMediaUpload = string | Buffer | Readable | NodeJS.ReadableStream | ReadableStream;
