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

    expect(theMetAdapter.search).toHaveBeenCalledWith('vase');
    expect(articAdapter.search).toHaveBeenCalledWith('vase');
    expect(result).toEqual({
      items: [theMetItem],
      failedSources: [],
    });
  });

  it('deve retornar listas vazias para uma consulta vazia', async () => {
    const result = await service.search('   ');

    expect(result).toEqual({
      items: [],
      failedSources: [],
    });
    expect(theMetAdapter.search).not.toHaveBeenCalled();
    expect(articAdapter.search).not.toHaveBeenCalled();
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

    expect(result).toEqual({
      items: [],
      failedSources: ['THE_MET', 'ARTIC'],
    });
  });
});
