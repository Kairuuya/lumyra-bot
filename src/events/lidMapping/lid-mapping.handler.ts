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

    this.logger.info(mapping, 'handle mapping');

    try {
      if (pn && lid) {
        // handle both keys exist
        await this.lidMappingService.saveMapping(pn, lid);
      } else if (!pn && lid) {
        // check cache first, if found populate back
        const foundPn = await this.lidMappingService.getPn(lid);
        if (foundPn) await this.lidMappingService.saveMapping(foundPn, lid);
      } else if (pn && !lid) {
        // check cache first, if found populate back
        const foundLid = await this.lidMappingService.getLid(pn);
        if (foundLid) await this.lidMappingService.saveMapping(pn, foundLid);
      }
    } catch (err) {
      this.logger.error({ err, mapping }, 'Failed handle lid-mapping');
    }
  }
}
