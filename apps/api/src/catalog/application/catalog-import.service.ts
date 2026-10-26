import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CATALOG_SOURCE_ADAPTERS } from './catalog-search.service';
import { CatalogSourceAdapter } from '../domain/catalog-source-adapter';
import { PrismaCatalogRepository } from '../infrastructure/repositories/prisma-catalog.repository';
import { CatalogSource } from 'generated/prisma/enums';

@Injectable()
export class CatalogImportService {
  constructor(
    @Inject(CATALOG_SOURCE_ADAPTERS)
    private readonly adapters: CatalogSourceAdapter[],
    private readonly catalogRepository: PrismaCatalogRepository,
  ) {}

  async importItem(source: CatalogSource, externalId: string) {
    const normalizedId = externalId.trim();

    if (!normalizedId) {
      throw new BadRequestException('External ID is required');
    }

    const adapter = this.adapters.find(
      (candidate) => candidate.source === source,
    );

    if (!adapter) {
      throw new NotFoundException(
        `Item ${normalizedId} was not found in ${source}`,
      );
    }

    const item = await adapter.getById(normalizedId);

    if (!item) {
      throw new NotFoundException(
        `Item ${normalizedId} was not found in ${source}`,
      );
    }

    return this.catalogRepository.saveImportedItem(source, item);
  }
}
