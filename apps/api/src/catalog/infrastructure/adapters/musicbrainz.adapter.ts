import {
  CatalogSourceAdapter,
  ExternalCatalogItem,
} from '../../domain/catalog-source-adapter';

interface MusicBrainzArtistCredit {
  name?: string;
  artist?: {
    name?: string;
  };
}

interface MusicBrainzReleaseGroup {
  id: string;
  title: string;
  'first-release-date'?: string;
  'primary-type'?: string;
  'secondary-types'?: string[];
  'artist-credit'?: MusicBrainzArtistCredit[];
}

interface MusicBrainzSearchResponse {
  'release-groups': MusicBrainzReleaseGroup[];
}

interface MusicBrainzLookupResponse extends MusicBrainzReleaseGroup {}

export class MusicBrainzAdapter implements CatalogSourceAdapter {
  readonly source = 'MUSICBRAINZ' as const;

  private readonly baseUrl = 'https://musicbrainz.org/ws/2';

  private readonly userAgent =
    'LanceAuctionHouse/1.0 (contact: pietracosta.dev@gmail.com)';

  async search(query: string): Promise<ExternalCatalogItem[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const url = new URL(`${this.baseUrl}/release-group`);
    url.searchParams.set('query', normalizedQuery);
    url.searchParams.set('fmt', 'json');
    url.searchParams.set('limit', '10');

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz search failed: HTTP ${response.status}`);
    }

    const result = (await response.json()) as MusicBrainzSearchResponse;

    return result['release-groups'].map((group) => this.mapReleaseGroup(group));
  }

  async getById(externalId: string): Promise<ExternalCatalogItem | null> {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(externalId)) {
      return null;
    }

    const url = new URL(`${this.baseUrl}/release-group/${externalId}`);
    url.searchParams.set('fmt', 'json');

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`MusicBrainz lookup failed: HTTP ${response.status}`);
    }

    const result = (await response.json()) as MusicBrainzLookupResponse;

    return this.mapReleaseGroup(result);
  }

  private mapReleaseGroup(group: MusicBrainzReleaseGroup): ExternalCatalogItem {
    const artistNames = (group['artist-credit'] ?? [])
      .map((credit) => credit.name ?? credit.artist?.name)
      .filter((name): name is string => Boolean(name));

    return {
      externalId: group.id,
      title: group.title || 'Untitled release',
      description: null,
      creator: artistNames.length > 0 ? artistNames.join(', ') : null,
      date: group['first-release-date'] ?? null,
      medium: null,
      sourceUrl: `https://musicbrainz.org/release-group/${group.id}`,
      imageUrl: null,
      attributes: {
        primaryType: group['primary-type'] ?? null,
        secondaryTypes: group['secondary-types'] ?? [],
      },
    };
  }
}
