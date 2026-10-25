import { CoverArtArchiveAdapter } from './cover-art-archive.adapter';

describe('CoverArtArchiveAdapter', () => {
  let adapter: CoverArtArchiveAdapter;
  const validId = '12345678-1234-1234-1234-123456789abc';

  beforeEach(() => {
    adapter = new CoverArtArchiveAdapter();
    jest.restoreAllMocks();
  });

  it('returns null for an invalid UUID without making a request', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(adapter.getFrontCover('invalid-id')).resolves.toBeNull();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns the front cover URL', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          images: [
            {
              front: false,
              image: 'https://example.com/back.jpg',
            },
            {
              front: true,
              image: 'https://example.com/front.jpg',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(adapter.getFrontCover(validId)).resolves.toBe(
      'https://example.com/front.jpg',
    );
  });

  it('returns null when no front cover exists', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          images: [
            {
              front: false,
              image: 'https://example.com/back.jpg',
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await expect(adapter.getFrontCover(validId)).resolves.toBeNull();
  });

  it('returns null when the release group has no cover art', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('Not found', { status: 404 }));

    await expect(adapter.getFrontCover(validId)).resolves.toBeNull();
  });

  it('throws when the API returns an HTTP error', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('Server error', { status: 500 }));

    await expect(adapter.getFrontCover(validId)).rejects.toThrow(
      'Cover Art Archive request failed: HTTP 500',
    );
  });

  it('sends the JSON Accept header', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ images: [] }), { status: 200 }),
      );

    await adapter.getFrontCover(validId);

    expect(fetchSpy).toHaveBeenCalledWith(
      `https://coverartarchive.org/release-group/${validId}`,
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );
  });
});
