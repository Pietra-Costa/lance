import {
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

  async search(query: string): Promise<ExternalCatalogItem[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const searchUrl = new URL(`${this.baseUrl}/search`);
    searchUrl.searchParams.set('q', normalizedQuery);
    searchUrl.searchParams.set('hasImages', 'true');

    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      throw new Error(`The Met search failed: HTTP ${searchResponse.status}`);
    }

    const searchData = (await searchResponse.json()) as TheMetSearchResponse;

    const objectIDs = (searchData.objectIDs ?? []).slice(0, 10);

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
