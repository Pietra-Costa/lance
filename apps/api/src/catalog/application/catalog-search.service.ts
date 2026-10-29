import { Inject, Injectable } from '@nestjs/common';
import {
  CatalogSource,
  CatalogSourceAdapter,
  CatalogSearchOptions,
  ExternalCatalogItem,
} from '../domain/catalog-source-adapter';

export const CATALOG_SOURCE_ADAPTERS = Symbol('CATALOG_SOURCE_ADAPTERS');

export interface CatalogSearchResult {
  items: ExternalCatalogItem[];
  failedSources: CatalogSource[];
  /** Fonte de cada item, na mesma ordem de `items`. */
  sources: CatalogSource[];
  /** Deslocamento usado nesta página. */
  offset: number;
  /** Tamanho da página solicitada. */
  limit: number;
  /** Indica se há mais itens para buscar na próxima página. */
  hasMore: boolean;
}

@Injectable()
export class CatalogSearchService {
  constructor(
    @Inject(CATALOG_SOURCE_ADAPTERS)
    private readonly adapters: CatalogSourceAdapter[],
  ) {}

  /**
   * Busca no catálogo externo com paginação.
   *
   * - `query` vazio significa "listar o acervo": cada adaptador usa sua própria
   *   varredura ampla (o Met aceita `q=*`, o AIC e o MusicBrainz usam termos
   *   neutros), sempre pedindo apenas itens com imagem.
   * - Cada fonte devolve até `limit` itens a partir de `offset`.
   * - Falha de uma fonte não derruba as outras: ela entra em `failedSources`.
   */
  async search(
    query: string,
    options?: CatalogSearchOptions,
  ): Promise<CatalogSearchResult> {
    const normalizedQuery = query.trim();
    const offset = Math.max(0, options?.offset ?? 0);
    const limit = Math.min(40, Math.max(1, options?.limit ?? 20));

    const outcomes = await Promise.allSettled(
      this.adapters.map((adapter) =>
        adapter.search(normalizedQuery, { offset, limit }),
      ),
    );

    const items: ExternalCatalogItem[] = [];
    const sources: CatalogSource[] = [];
    const failedSources: CatalogSource[] = [];

    outcomes.forEach((outcome, index) => {
      const adapter = this.adapters[index];

      if (outcome.status === 'fulfilled') {
        for (const item of outcome.value) {
          items.push(item);
          sources.push(adapter.source);
        }
      } else {
        failedSources.push(adapter.source);
      }
    });

    return {
      items,
      sources,
      failedSources,
      offset,
      limit,
      hasMore: items.length >= limit,
    };
  }
}
