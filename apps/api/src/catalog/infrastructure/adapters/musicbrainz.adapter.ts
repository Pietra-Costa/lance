import {
  CatalogSearchOptions,
  CatalogSourceAdapter,
  ExternalCatalogItem,
} from '../../domain/catalog-source-adapter';
import { CoverArtArchiveAdapter } from './cover-art-archive.adapter';

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

type MusicBrainzLookupResponse = MusicBrainzReleaseGroup;

export class MusicBrainzAdapter implements CatalogSourceAdapter {
  readonly source = 'MUSICBRAINZ' as const;

  private readonly baseUrl = 'https://musicbrainz.org/ws/2';

  private readonly userAgent =
    'LanceAuctionHouse/1.0 (contact: admin@lance.local)';

  private readonly coverArtArchive = new CoverArtArchiveAdapter();

  async search(
    query: string,
    options?: CatalogSearchOptions,
  ): Promise<ExternalCatalogItem[]> {
    const normalizedQuery = query.trim();
    const offset = Math.max(0, options?.offset ?? 0);
    const limit = Math.min(40, Math.max(1, options?.limit ?? 10));

    const url = new URL(`${this.baseUrl}/release-group`);
    // Sem termo: varredura ampla por lançamentos com capa.
    url.searchParams.set('query', normalizedQuery || 'type:album');
    url.searchParams.set('fmt', 'json');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));

    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`MusicBrainz search failed: HTTP ${response.status}`);
    }

    const result = (await response.json()) as MusicBrainzSearchResponse;

    return Promise.all(
      result['release-groups'].map((group) => this.mapReleaseGroup(group)),
    );
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

  private async mapReleaseGroup(
    group: MusicBrainzReleaseGroup,
  ): Promise<ExternalCatalogItem> {
    const artistNames = (group['artist-credit'] ?? [])
      .map((credit) => credit.name ?? credit.artist?.name)
      .filter((name): name is string => Boolean(name));

    let imageUrl: string | null = null;

    try {
      imageUrl = await this.coverArtArchive.getFrontCover(group.id);
    } catch {
      // A falha no serviço de capas não deve descartar os metadados.
    }

    return {
      externalId: group.id,
      title: group.title || 'Untitled release',
      description: null,
      creator: artistNames.length > 0 ? artistNames.join(', ') : null,
      date: group['first-release-date'] ?? null,
      medium: null,
      sourceUrl: `https://musicbrainz.org/release-group/${group.id}`,
      imageUrl,
      attributes: {
        primaryType: group['primary-type'] ?? null,
        secondaryTypes: group['secondary-types'] ?? [],
      },
    };
  }
}
