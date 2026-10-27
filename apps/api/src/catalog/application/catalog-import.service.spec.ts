import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CatalogImportService } from './catalog-import.service';
import {
  CatalogSourceAdapter,
  ExternalCatalogItem,
} from '../domain/catalog-source-adapter';
import { PrismaCatalogRepository } from '../infrastructure/repositories/prisma-catalog.repository';

describe('CatalogImportService', () => {
  let service: CatalogImportService;
  let repository: jest.Mocked<PrismaCatalogRepository>;
  let adapter: jest.Mocked<CatalogSourceAdapter>;

  const item: ExternalCatalogItem = {
    externalId: '123',
    title: 'Test artwork',
    description: null,
    creator: 'Test artist',
    date: '1900',
    medium: 'Oil on canvas',
    sourceUrl: 'https://example.com/item/123',
    imageUrl: 'https://example.com/item/123.jpg',
    attributes: {
      isPublicDomain: true,
    },
  };

  beforeEach(() => {
    adapter = {
      source: 'THE_MET',
      search: jest.fn(),
      getById: jest.fn(),
    };

    repository = {
      saveImportedItem: jest.fn(),
    } as unknown as jest.Mocked<PrismaCatalogRepository>;

    service = new CatalogImportService([adapter], repository);
  });

  it('imports an item and persists it', async () => {
    adapter.getById.mockResolvedValue(item);
    repository.saveImportedItem.mockResolvedValue({
      id: 'local-1',
    } as never);

    const result = await service.importItem('THE_MET', '123');

    expect(adapter.getById).toHaveBeenCalledWith('123');
    expect(repository.saveImportedItem).toHaveBeenCalledWith('THE_MET', item);
    expect(result).toEqual({ id: 'local-1' });
  });

  it('rejects an empty external ID', async () => {
    await expect(service.importItem('THE_MET', '   ')).rejects.toThrow(
      BadRequestException,
    );

    expect(adapter.getById).not.toHaveBeenCalled();
    expect(repository.saveImportedItem).not.toHaveBeenCalled();
  });

  it('rejects a source that is not enabled', async () => {
    await expect(service.importItem('ARTIC', '123')).rejects.toThrow(
      BadRequestException,
    );

    expect(repository.saveImportedItem).not.toHaveBeenCalled();
  });

  it('returns not found when the external item does not exist', async () => {
    adapter.getById.mockResolvedValue(null);

    await expect(service.importItem('THE_MET', '999')).rejects.toThrow(
      NotFoundException,
    );

    expect(repository.saveImportedItem).not.toHaveBeenCalled();
  });

  it('does not persist when the external API fails', async () => {
    adapter.getById.mockRejectedValue(new Error('External API unavailable'));

    await expect(service.importItem('THE_MET', '123')).rejects.toThrow(
      'External API unavailable',
    );

    expect(repository.saveImportedItem).not.toHaveBeenCalled();
  });
});
