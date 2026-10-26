import { Module } from '@nestjs/common';
import { TheMetAdapter } from './infrastructure/adapters/the-met.adapter';
import { ArticAdapter } from './infrastructure/adapters/artic.adapter';
import { MusicBrainzAdapter } from './infrastructure/adapters/musicbrainz.adapter';
import { CoverArtArchiveAdapter } from './infrastructure/adapters/cover-art-archive.adapter';
import {
  CATALOG_SOURCE_ADAPTERS,
  CatalogSearchService,
} from './application/catalog-search.service';
import { PrismaCatalogRepository } from './infrastructure/repositories/prisma-catalog.repository';
import { CatalogImportService } from './application/catalog-import.service';
import { CatalogController } from './catalog.controller';

@Module({
  controllers: [CatalogController],
  providers: [
    TheMetAdapter,
    ArticAdapter,
    MusicBrainzAdapter,
    CoverArtArchiveAdapter,
    PrismaCatalogRepository,
    CatalogImportService,
    {
      provide: CATALOG_SOURCE_ADAPTERS,
      useFactory: (
        theMetAdapter: TheMetAdapter,
        articAdapter: ArticAdapter,
        musicBrainzAdapter: MusicBrainzAdapter,
      ) => [theMetAdapter, articAdapter, musicBrainzAdapter],
      inject: [TheMetAdapter, ArticAdapter, MusicBrainzAdapter],
    },
    CatalogSearchService,
  ],
  exports: [
    CatalogSearchService,
    PrismaCatalogRepository,
    CatalogImportService,
  ],
})
export class CatalogModule {}
