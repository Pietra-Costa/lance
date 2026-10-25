import { Module } from '@nestjs/common';
import { TheMetAdapter } from './infrastructure/adapters/the-met.adapter';
import { ArticAdapter } from './infrastructure/adapters/artic.adapter';
import {
  CATALOG_SOURCE_ADAPTERS,
  CatalogSearchService,
} from './application/catalog-search.service';

@Module({
  providers: [
    TheMetAdapter,
    ArticAdapter,
    {
      provide: CATALOG_SOURCE_ADAPTERS,
      useFactory: (
        theMetAdapter: TheMetAdapter,
        articAdapter: ArticAdapter,
      ) => [theMetAdapter, articAdapter],
      inject: [TheMetAdapter, ArticAdapter],
    },
    CatalogSearchService,
  ],
  exports: [CatalogSearchService],
})
export class CatalogModule {}
