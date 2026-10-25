interface CoverArtImage {
  front?: boolean;
  image: string;
  thumbnails?: Record<string, string>;
}

interface CoverArtResponse {
  images: CoverArtImage[];
}

export class CoverArtArchiveAdapter {
  private readonly baseUrl = 'https://coverartarchive.org';

  async getFrontCover(releaseGroupId: string): Promise<string | null> {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(releaseGroupId)) {
      return null;
    }

    const url = `${this.baseUrl}/release-group/${releaseGroupId}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `Cover Art Archive request failed: HTTP ${response.status}`,
      );
    }

    const result = (await response.json()) as CoverArtResponse;

    const frontCover = result.images?.find((image) => image.front === true);

    return frontCover?.image ?? null;
  }
}
