export type CatalogSource = 'THE_MET' | 'Artic' | 'MUSICBRAINZ';

export interface ExternalCatalogItem {
  externalId: string;
  title: string;
  description: string | null;
  creator: string | null;
  date: string | null;
  medium: string | null;
  sourceUrl: string;
  imageUrl: string | null;
  attributes: Record<string, number>;
}

export interface CatalogSourceAdapter {
  readonly source: CatalogSource;

  search(query: string): Promise<ExternalCatalogItem[]>;

  getById(externalId: string): Promise<ExternalCatalogItem | null>;
}
