import { ArticAdapter } from './artic.adapter';

describe('ArticAdapter', () => {
  let adapter: ArticAdapter;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    adapter = new ArticAdapter();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('deve identificar a fonte como ARTIC', () => {
    expect(adapter.source).toBe('ARTIC');
  });

  it('deve retornar null para um identificador inválido', async () => {
    const result = await adapter.getById('abc');

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('deve mapear uma obra corretamente', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          id: 123,
          title: 'A Sunday on La Grande Jatte',
          artist_title: 'Georges Seurat',
          date_display: '1884–1886',
          medium_display: 'Oil on canvas',
          is_public_domain: true,
          image_id: 'abc123',
          main_reference_number: '1926.224',
        },
      }),
    } as Response);

    const result = await adapter.getById('123');

    expect(result).toEqual({
      externalId: '123',
      title: 'A Sunday on La Grande Jatte',
      description: null,
      creator: 'Georges Seurat',
      date: '1884–1886',
      medium: 'Oil on canvas',
      sourceUrl: 'https://www.artic.edu/artworks/123',
      imageUrl: 'https://www.artic.edu/iiif/2/abc123/full/843,/0/default.jpg',
      attributes: {
        isPublicDomain: true,
        mainReferenceNumber: '1926.224',
      },
    });
  });

  it('deve retornar null quando a obra não existe', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response);

    const result = await adapter.getById('999');

    expect(result).toBeNull();
  });

  it('deve lançar erro quando a API retorna erro HTTP', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    await expect(adapter.getById('123')).rejects.toThrow(
      'ARTIC artwork request failed: HTTP 500',
    );
  });

  it('deve retornar lista vazia quando a busca é vazia', async () => {
    const result = await adapter.search('   ');

    expect(result).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('deve mapear os resultados da busca', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 123,
            title: 'Artwork A',
            artist_title: 'Artist A',
            date_display: '1900',
            medium_display: 'Oil',
            is_public_domain: true,
            image_id: 'image-a',
            main_reference_number: 'A1',
          },
          {
            id: 456,
            title: 'Artwork B',
            artist_title: null,
            date_display: null,
            medium_display: null,
            is_public_domain: false,
            image_id: null,
            main_reference_number: null,
          },
        ],
      }),
    } as Response);

    const result = await adapter.search('art');

    expect(result).toHaveLength(2);
    expect(result[0].externalId).toBe('123');
    expect(result[1].externalId).toBe('456');
    expect(result[1].creator).toBeNull();
    expect(result[1].imageUrl).toBeNull();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
