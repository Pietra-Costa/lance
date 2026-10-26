import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { CatalogSource } from 'generated/prisma/enums';
import { ExternalCatalogItem } from 'src/catalog/domain/catalog-source-adapter';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

const PRISMA_SOURCE: Record<
  CatalogSource,
  'MET' | 'ART_INSTITUTE_CHICAGO' | 'MUSICBRAINZ'
> = {
  MET: 'MET',
  ART_INSTITUTE_CHICAGO: 'ART_INSTITUTE_CHICAGO',
  MUSICBRAINZ: 'MUSICBRAINZ',
};

@Injectable()
export class PrismaCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveImportedItem(source: CatalogSource, item: ExternalCatalogItem) {
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
            sourceUrl: item.sourceUrl,
            usageStatus: 'UNKNOWN',
          },
        });
      }
    }
    return catalogItem;
  }
}
