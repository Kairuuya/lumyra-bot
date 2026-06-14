import type { PrismaClient } from '@prisma/client';
import type { Client } from '../core/client/client.js';
import type { Logger } from '../core/logger/pino.js';
import { isLidUser, isPnUser } from '../utils/index.js';

export class LidMappingService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly client: Client,
    private readonly logger: Logger,
  ) {}
  /**
   * Populate Baileys Internal Cache
   */
  private async populateBaileysCache(pn: string, lid: string): Promise<void> {
    const store = this.client.sock.signalRepository.lidMapping;
    if (store) {
      await store.storeLIDPNMappings([{ lid, pn }]);
    }
  }
  /**
   * Save mapping to Database and populate Baileys Internal Cache.
   */
  public async saveMapping(pn: string, lid: string): Promise<void> {
    if (!isPnUser(pn) || !isLidUser(lid)) return;

    // 1. Save to Database
    await this.prisma.lidMapping.upsert({
      where: { lid },
      update: { pn },
      create: { lid, pn },
    });

    // populate Baileys Internal Cache
    await this.populateBaileysCache(pn, lid);
  }

  /**
   * Find PN by LID (Priority: Baileys Cache -> Database -> Cache Again)
   */
  public async getPn(lid: string): Promise<string | null> {
    if (!isLidUser(lid)) return null;

    // Check internal Baileys cache first
    let pn = await this.client.getPNForLID(lid);
    if (pn) return pn;

    // Not found in cache? Check DB
    const record = await this.prisma.lidMapping.findUnique({
      where: { lid },
      select: { pn: true },
    });

    if (record?.pn) {
      pn = record.pn;
      // Populate cache so next time it's instant
      this.populateBaileysCache(pn, lid).catch((err) =>
        this.logger.error({ err, lid, pn }, 'Failed to populate Baileys cache'),
      );
      return pn;
    }

    return null;
  }

  /**
   * Find LID by PN (Priority: Baileys Cache -> Database -> Cache Again)
   */
  public async getLid(pn: string): Promise<string | null> {
    if (!isPnUser(pn)) return null;

    // Check internal Baileys cache first
    let lid = await this.client.getLIDForPN(pn);
    if (lid) return lid;

    // Not found in cache? Check DB
    const record = await this.prisma.lidMapping.findUnique({
      where: { pn },
      select: { lid: true },
    });

    if (record?.lid) {
      lid = record.lid;
      // Populate cache so next time it's instant
      this.populateBaileysCache(pn, lid).catch((err) =>
        this.logger.error({ err, lid, pn }, 'Failed to populate Baileys cache'),
      );
      return lid;
    }

    return null;
  }
}
