import type { UserRole } from '@prisma/client';
import type { ContextOptions } from '../../../types/context.js';

export class UserContext {
  public readonly id: string;
  public readonly pn: string | null;
  public readonly lid: string | null;
  public readonly pushName: string;
  public readonly language: string;
  public readonly role: UserRole;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(user: ContextOptions['user']) {
    this.id = user.id;
    this.pn = user.pn;
    this.lid = user.lid;
    this.pushName = user.pushName;
    this.language = user.language;
    this.role = user.role;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
