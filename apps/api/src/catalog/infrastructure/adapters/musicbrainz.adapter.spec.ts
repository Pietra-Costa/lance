import { MusicBrainzAdapter } from './musicbrainz.adapter';

describe('MusicBrainzAdapter', () => {
  let adapter: MusicBrainzAdapter;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    adapter = new MusicBrainzAdapter();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('deve identificar a fonte como MUSICBRAINZ', () => {
    expect(adapter.source).toBe('MUSICBRAINZ');
  });

  it('deve retornar null para um identificador inválido', async () => {
    const result = await adapter.getById('abc');

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('deve mapear um grupo de lançamentos corretamente', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        id: '12345678-1234-1234-1234-123456789abc',
        title: 'Album Example',
        'first-release-date': '1990-01-01',
        'primary-type': 'Album',
        'secondary-types': ['Compilation'],
        'artist-credit': [
          { name: 'Artist A' },
          { artist: { name: 'Artist B' } },
        ],
      }),
    } as Response);

    const result = await adapter.getById(
      '12345678-1234-1234-1234-123456789abc',
    );

    expect(result).toEqual({
      externalId: '12345678-1234-1234-1234-123456789abc',
      title: 'Album Example',
      description: null,
      creator: 'Artist A, Artist B',
      date: '1990-01-01',
      medium: null,
      sourceUrl:
        'https://musicbrainz.org/release-group/12345678-1234-1234-1234-123456789abc',
      imageUrl: null,
      attributes: {
        primaryType: 'Album',
        secondaryTypes: ['Compilation'],
      },
    });
  });

  it('deve retornar null quando o grupo não existe', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response);

    const result = await adapter.getById(
      '12345678-1234-1234-1234-123456789abc',
    );

    expect(result).toBeNull();
  });

  it('deve lançar erro quando a API retorna erro HTTP', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    await expect(
      adapter.getById('12345678-1234-1234-1234-123456789abc'),
    ).rejects.toThrow('MusicBrainz lookup failed: HTTP 500');
  });

  it('lista o acervo quando a busca está vazia (paginação)', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ 'release-groups': [], count: 0 }),
    });

    const result = await adapter.search('   ');

    expect(result).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('deve mapear os resultados da busca', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        'release-groups': [
          {
            id: '12345678-1234-1234-1234-123456789abc',
            title: 'Album A',
            'artist-credit': [{ name: 'Artist A' }],
          },
          {
            id: '87654321-4321-4321-4321-cba987654321',
            title: 'Album B',
            'artist-credit': [],
          },
        ],
      }),
    } as Response);

    const result = await adapter.search('jazz');

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Album A');
    expect(result[1].title).toBe('Album B');
    expect(result[1].creator).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it('deve enviar um User-Agent nas requisições', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        'release-groups': [],
      }),
    } as Response);

    await adapter.search('jazz');

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('LanceAuctionHouse'),
        }),
      }),
    );
  });
});
