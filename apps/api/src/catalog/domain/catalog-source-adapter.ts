export type CatalogSource = 'THE_MET' | 'ARTIC' | 'MUSICBRAINZ';

export interface ExternalCatalogItem {
  externalId: string;
  title: string;
  description: string | null;
  creator: string | null;
  date: string | null;
  medium: string | null;
  sourceUrl: string;
  imageUrl: string | null;
  attributes: Record<string, unknown>;
}

export interface CatalogSearchOptions {
  /** Deslocamento na lista de resultados (paginação). */
  offset?: number;
  /** Quantidade máxima de itens retornados por página. */
  limit?: number;
}

export interface CatalogSourceAdapter {
  readonly source: CatalogSource;

  search(
    query: string,
    options?: CatalogSearchOptions,
  ): Promise<ExternalCatalogItem[]>;

  getById(externalId: string): Promise<ExternalCatalogItem | null>;
}
