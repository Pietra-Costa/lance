import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { CatalogSource as PrismaCatalogSource } from '../../../../generated/prisma/enums';
import {
  CatalogSource as DomainCatalogSource,
  ExternalCatalogItem,
} from '../../domain/catalog-source-adapter';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

const PRISMA_SOURCE: Record<DomainCatalogSource, PrismaCatalogSource> = {
  THE_MET: 'MET',
  ARTIC: 'ART_INSTITUTE_CHICAGO',
  MUSICBRAINZ: 'MUSICBRAINZ',
};

@Injectable()
export class PrismaCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveImportedItem(
    source: DomainCatalogSource,
    item: ExternalCatalogItem,
  ) {
    const prismaSource = PRISMA_SOURCE[source];

    const attributes = {
      ...item.attributes,
      date: item.date,
      medium: item.medium,
    } as Prisma.InputJsonValue;

    const catalogItem = await this.prisma.catalogItem.upsert({
      where: {
        source_externalId: {
          source: prismaSource,
          externalId: item.externalId,
        },
      },
      create: {
        source: prismaSource,
        externalId: item.externalId,
        title: item.title,
        description: item.description,
        creator: item.creator,
        sourceUrl: item.sourceUrl,
        attributes,
      },
      update: {
        title: item.title,
        description: item.description,
        creator: item.creator,
        sourceUrl: item.sourceUrl,
        attributes,
      },
    });

    if (item.imageUrl) {
      const existingImage = await this.prisma.catalogItemImage.findFirst({
        where: {
          catalogItemId: catalogItem.id,
          sourceUrl: item.imageUrl,
        },
      });

      if (!existingImage) {
        await this.prisma.catalogItemImage.create({
          data: {
            catalogItemId: catalogItem.id,
            sourceUrl: item.imageUrl,
            usageStatus: 'UNKNOWN',
          },
        });
      }
    }

    return catalogItem;
  }
}
