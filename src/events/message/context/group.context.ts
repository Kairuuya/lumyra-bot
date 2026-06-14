import type { GroupParticipant } from '@prisma/client';
import type { GroupWithRelations } from '../../../types/index.js';

export class GroupContext {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly metadata: GroupWithRelations['metadata'];
  public readonly participants: GroupParticipant[];

  constructor(group: GroupWithRelations) {
    this.id = group.id;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
    this.metadata = group.metadata;
    this.participants = group.participants;
  }
}
