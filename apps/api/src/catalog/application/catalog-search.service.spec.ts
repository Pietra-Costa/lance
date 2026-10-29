import {
  CatalogSourceAdapter,
  ExternalCatalogItem,
} from '../domain/catalog-source-adapter';
import { CatalogSearchService } from './catalog-search.service';

describe('CatalogSearchService', () => {
  let service: CatalogSearchService;

  const theMetItem: ExternalCatalogItem = {
    externalId: '123',
    title: 'Vase',
    description: null,
    creator: 'Unknown artist',
    date: '1900',
    medium: 'Ceramic',
    sourceUrl: 'https://example.com/object/123',
    imageUrl: null,
    attributes: {},
  };

  const theMetAdapter: jest.Mocked<CatalogSourceAdapter> = {
    source: 'THE_MET',
    search: jest.fn(),
    getById: jest.fn(),
  };

  const articAdapter: jest.Mocked<CatalogSourceAdapter> = {
    source: 'ARTIC',
    search: jest.fn(),
    getById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new CatalogSearchService([theMetAdapter, articAdapter]);
  });

  it('deve combinar os resultados das fontes', async () => {
    theMetAdapter.search.mockResolvedValue([theMetItem]);
    articAdapter.search.mockResolvedValue([]);

    const result = await service.search(' vase ');

    expect(theMetAdapter.search).toHaveBeenCalledWith('vase', {
      offset: 0,
      limit: 20,
    });
    expect(articAdapter.search).toHaveBeenCalledWith('vase', {
      offset: 0,
      limit: 20,
    });
    expect(result.items).toEqual([theMetItem]);
    expect(result.failedSources).toEqual([]);
    expect(result.sources).toEqual(['THE_MET']);
    expect(result.hasMore).toBe(false);
  });

  it('lista o acervo quando a consulta está vazia', async () => {
    theMetAdapter.search.mockResolvedValue([theMetItem]);
    articAdapter.search.mockResolvedValue([]);

    const result = await service.search('   ');

    expect(theMetAdapter.search).toHaveBeenCalledWith('', {
      offset: 0,
      limit: 20,
    });
    expect(result.items).toEqual([theMetItem]);
    expect(result.failedSources).toEqual([]);
  });

  it('repassa offset e limit para as fontes', async () => {
    theMetAdapter.search.mockResolvedValue([]);
    articAdapter.search.mockResolvedValue([]);

    await service.search('vase', { offset: 40, limit: 10 });

    expect(theMetAdapter.search).toHaveBeenCalledWith('vase', {
      offset: 40,
      limit: 10,
    });
  });

  it('deve preservar resultados quando uma fonte falha', async () => {
    theMetAdapter.search.mockResolvedValue([theMetItem]);
    articAdapter.search.mockRejectedValue(
      new Error('Art Institute indisponível'),
    );

    const result = await service.search('vase');

    expect(result.items).toEqual([theMetItem]);
    expect(result.failedSources).toEqual(['ARTIC']);
  });

  it('deve informar todas as fontes que falharam', async () => {
    theMetAdapter.search.mockRejectedValue(new Error('The Met indisponível'));
    articAdapter.search.mockRejectedValue(
      new Error('Art Institute indisponível'),
    );

    const result = await service.search('vase');

    expect(result.items).toEqual([]);
    expect(result.failedSources).toEqual(['THE_MET', 'ARTIC']);
  });
});
