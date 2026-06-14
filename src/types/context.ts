import type { User } from '@prisma/client';
import type { Logger } from 'pino';
import type { Client } from '../core/client/client.js';
import type { GroupService } from '../services/group.service.js';
import type { LidMappingService } from '../services/lidMapping.service.js';
import type { UserService } from '../services/user.service.js';
import type { GroupWithRelations } from './group.js';
import type { SerializedMessage } from './serialize.js';

export type Services = {
  user: UserService;
  group: GroupService;
  lidMapping: LidMappingService;
};
export type ContextOptions = {
  client: Client;
  msg: SerializedMessage;
  user: User;
  group: GroupWithRelations | null;
  services: Services;
  logger: Logger;
};
