import { TheMetAdapter } from './the-met.adapter';

describe('TheMetAdapter', () => {
  let adapter: TheMetAdapter;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    adapter = new TheMetAdapter();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('deve identificar a fonte como THE_MET', () => {
    expect(adapter.source).toBe('THE_MET');
  });

  it('deve retornar null para um identificador inválido', async () => {
    const result = await adapter.getById('abc');

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('deve converter a resposta da API para o formato do catálogo', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        objectID: 123,
        title: 'Vase',
        objectDate: '1900',
        medium: 'Ceramic',
        artistDisplayName: 'Unknown artist',
        objectURL: 'https://example.com/object/123',
        primaryImageSmall: 'https://example.com/image.jpg',
        isPublicDomain: true,
        objectName: 'Vase',
        culture: 'Greek',
        period: 'Classical',
        dimensions: '20 cm',
        creditLine: 'Museum collection',
      }),
    } as Response);

    const result = await adapter.getById('123');

    expect(result).toEqual({
      externalId: '123',
      title: 'Vase',
      description: null,
      creator: 'Unknown artist',
      date: '1900',
      medium: 'Ceramic',
      sourceUrl: 'https://example.com/object/123',
      imageUrl: 'https://example.com/image.jpg',
      attributes: {
        objectName: 'Vase',
        culture: 'Greek',
        period: 'Classical',
        dimensions: '20 cm',
        creditLine: 'Museum collection',
        isPublicDomain: true,
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('deve retornar null quando o objeto não existe', async () => {
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
      'The Met object request failed: HTTP 500',
    );
  });

  it('lista o acervo quando a busca está vazia (paginação)', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ objectIDs: [], data: [], count: 0 }),
    });

    const result = await adapter.search('   ');

    expect(result).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('deve retornar uma lista vazia quando a API não encontra objetos', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        total: 0,
        objectIDs: null,
      }),
    } as Response);

    const result = await adapter.search('painting');

    expect(result).toEqual([]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('deve buscar os detalhes dos objetos encontrados', async () => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          total: 2,
          objectIDs: [123, 456],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          objectID: 123,
          title: 'Vase',
          objectDate: '1900',
          medium: 'Ceramic',
          artistDisplayName: 'Artist A',
          objectURL: 'https://example.com/object/123',
          primaryImageSmall: 'https://example.com/image-123.jpg',
          isPublicDomain: true,
          objectName: 'Vase',
          culture: 'Greek',
          period: 'Classical',
          dimensions: '20 cm',
          creditLine: 'Museum collection',
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          objectID: 456,
          title: 'Sculpture',
          objectDate: '1800',
          medium: 'Marble',
          artistDisplayName: 'Artist B',
          objectURL: 'https://example.com/object/456',
          primaryImageSmall: '',
          isPublicDomain: false,
          objectName: 'Sculpture',
          culture: 'Roman',
          period: 'Ancient',
          dimensions: '30 cm',
          creditLine: 'Museum collection',
        }),
      } as Response);

    const result = await adapter.search('art');

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.externalId)).toEqual(['123', '456']);
    expect(result[0].title).toBe('Vase');
    expect(result[1].title).toBe('Sculpture');
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
