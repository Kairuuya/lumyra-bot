import type { User } from '@prisma/client';
import type { Logger } from 'pino';
import type { Client } from '../core/client/client.js';
import type { GroupWithRelations } from './group.js';
import type { SerializedMessage } from './serialize.js';

export type ContextOptions = {
  client: Client;
  msg: SerializedMessage;
  user: User;
  group: GroupWithRelations | null;
  logger: Logger;
};
