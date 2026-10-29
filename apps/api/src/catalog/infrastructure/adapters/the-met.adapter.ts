import {
  CatalogSearchOptions,
  CatalogSourceAdapter,
  ExternalCatalogItem,
} from '../../domain/catalog-source-adapter';

interface TheMetSearchResponse {
  total: number;
  objectIDs: number[] | null;
}

interface TheMetObjectResponse {
  objectID: number;
  title: string;
  objectDate: string;
  medium: string;
  artistDisplayName: string;
  objectURL: string;
  primaryImageSmall: string;
  isPublicDomain: boolean;
  objectName: string;
  culture: string;
  period: string;
  dimensions: string;
  creditLine: string;
}

export class TheMetAdapter implements CatalogSourceAdapter {
  readonly source = 'THE_MET' as const;

  private readonly baseUrl =
    'https://collectionapi.metmuseum.org/public/collection/v1';

  async search(
    query: string,
    options?: CatalogSearchOptions,
  ): Promise<ExternalCatalogItem[]> {
    const normalizedQuery = query.trim();

    // Listagem sem termo: o Met permite q=* para varrer o acervo com imagem.
    const effectiveQuery = normalizedQuery || '*';
    const offset = Math.max(0, options?.offset ?? 0);
    const limit = Math.min(40, Math.max(1, options?.limit ?? 10));

    const searchUrl = new URL(
      'https://collectionapi.metmuseum.org/public/collection/v1.1/search',
    );
    searchUrl.searchParams.set('q', effectiveQuery);
    searchUrl.searchParams.set('hasImages', 'true');
    searchUrl.searchParams.set('offset', String(offset));
    searchUrl.searchParams.set('limit', String(limit));

    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      throw new Error(`The Met search failed: HTTP ${searchResponse.status}`);
    }

    const searchData = (await searchResponse.json()) as TheMetSearchResponse;

    const objectIDs = (searchData.objectIDs ?? []).slice(0, limit);

    const results = await Promise.all(
      objectIDs.map((id) => this.getById(String(id))),
    );

    return results.filter((item): item is ExternalCatalogItem => item !== null);
  }

  async getById(externalId: string): Promise<ExternalCatalogItem | null> {
    if (!/^\d+$/.test(externalId)) {
      return null;
    }

    const response = await fetch(`${this.baseUrl}/objects/${externalId}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`The Met object request failed: HTTP ${response.status}`);
    }

    const object = (await response.json()) as TheMetObjectResponse;

    return {
      externalId: String(object.objectID),
      title: object.title || 'Untitled object',
      description: null,
      creator: object.artistDisplayName || null,
      date: object.objectDate || null,
      medium: object.medium || null,
      sourceUrl: object.objectURL,
      imageUrl: object.primaryImageSmall || null,
      attributes: {
        objectName: object.objectName || null,
        culture: object.culture || null,
        period: object.period || null,
        dimensions: object.dimensions || null,
        creditLine: object.creditLine || null,
        isPublicDomain: object.isPublicDomain,
      },
    };
  }
}
