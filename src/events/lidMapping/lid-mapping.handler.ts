import type { Logger } from '../../core/logger/pino.js';
import type { LidMappingService } from '../../services/lidMapping.service.js';

export class LidMappingHandler {
  constructor(
    private readonly lidMappingService: LidMappingService,
    private readonly logger: Logger,
  ) {}

  async handle(mapping: { pn?: string; lid?: string }): Promise<void> {
    const { pn, lid } = mapping || {};
    if (!pn && !lid) return;

    try {
      // handle both pn and lid exists
      if (pn && lid) {
        await this.lidMappingService.saveMapping(pn, lid);
        return;
      }

      // handle lid exists but pn not exists
      if (!pn && lid) {
        const foundPn = await this.lidMappingService.getPn(lid);
        if (foundPn) await this.lidMappingService.saveMapping(foundPn, lid);
        return;
      }

      // handle pn exists but lid not exists
      if (pn && !lid) {
        const foundLid = await this.lidMappingService.getLid(pn);
        if (foundLid) await this.lidMappingService.saveMapping(pn, foundLid);
        return;
      }
    } catch (err) {
      this.logger.error({ err, mapping }, 'Failed handling event lid-mapping');
    }
  }
}
