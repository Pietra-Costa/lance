import {
  CatalogSourceAdapter,
  ExternalCatalogItem,
} from '../../domain/catalog-source-adapter';

interface ArticArtwork {
  id: number;
  title: string;
  artist_title: string | null;
  date_display: string | null;
  medium_display: string | null;
  is_public_domain: boolean;
  image_id: string | null;
  main_reference_number: string | null;
}

interface ArticSearchResponse {
  data: ArticArtwork[];
}

interface ArticArtworkResponse {
  data: ArticArtwork;
}

export class ArticAdapter implements CatalogSourceAdapter {
  readonly source = 'ARTIC' as const;

  private readonly baseUrl = 'https://api.artic.edu/api/v1';

  private readonly fields = [
    'id',
    'title',
    'artist_title',
    'date_display',
    'medium_display',
    'is_public_domain',
    'image_id',
    'main_reference_number',
  ].join(',');

  async search(query: string): Promise<ExternalCatalogItem[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const url = new URL(`${this.baseUrl}/artworks/search`);
    url.searchParams.set('q', normalizedQuery);
    url.searchParams.set('limit', '10');
    url.searchParams.set('fields', this.fields);

    const response = await fetch(url);

    if (!response.ok) {
      const contentType = response.headers?.get('content-type') ?? 'unknown';
      throw new Error(
        `ARTIC search failed: HTTP ${response.status}, content-type: ${contentType}`,
      );
    }

    const result = (await response.json()) as ArticSearchResponse;

    return result.data.map((artwork) => this.mapArtwork(artwork));
  }

  async getById(externalId: string): Promise<ExternalCatalogItem | null> {
    if (!/^\d+$/.test(externalId)) {
      return null;
    }

    const url = new URL(`${this.baseUrl}/artworks/${externalId}`);
    url.searchParams.set('fields', this.fields);

    const response = await fetch(url);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const contentType = response.headers?.get('content-type') ?? 'unknown';

      throw new Error(
        `ARTIC artwork request failed: HTTP ${response.status}, content-type: ${contentType}`,
      );
    }

    const result = (await response.json()) as ArticArtworkResponse;

    return this.mapArtwork(result.data);
  }

  private mapArtwork(artwork: ArticArtwork): ExternalCatalogItem {
    return {
      externalId: String(artwork.id),
      title: artwork.title || 'Untitled artwork',
      description: null,
      creator: artwork.artist_title || null,
      date: artwork.date_display || null,
      medium: artwork.medium_display || null,
      sourceUrl: `https://www.artic.edu/artworks/${artwork.id}`,
      imageUrl: artwork.image_id
        ? `https://www.artic.edu/iiif/2/${artwork.image_id}/full/843,/0/default.jpg`
        : null,
      attributes: {
        isPublicDomain: artwork.is_public_domain,
        mainReferenceNumber: artwork.main_reference_number,
      },
    };
  }
}
