import { Inject, Injectable } from '@nestjs/common';
import {
  CatalogSource,
  CatalogSourceAdapter,
  ExternalCatalogItem,
} from '../domain/catalog-source-adapter';

export const CATALOG_SOURCE_ADAPTERS = Symbol('CATALOG_SOURCE_ADAPTERS');

export interface CatalogSearchResult {
  items: ExternalCatalogItem[];
  failedSources: CatalogSource[];
}

@Injectable()
export class CatalogSearchService {
  constructor(
    @Inject(CATALOG_SOURCE_ADAPTERS)
    private readonly adapters: CatalogSourceAdapter[],
  ) {}

  async search(query: string): Promise<CatalogSearchResult> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        items: [],
        failedSources: [],
      };
    }

    const outcomes = await Promise.allSettled(
      this.adapters.map((adapter) => adapter.search(normalizedQuery)),
    );

    const items: ExternalCatalogItem[] = [];
    const failedSources: CatalogSource[] = [];

    outcomes.forEach((outcome, index) => {
      if (outcome.status === 'fulfilled') {
        items.push(...outcome.value);
      } else {
        failedSources.push(this.adapters[index].source);
      }
    });

    return {
      items,
      failedSources,
    };
  }
}
