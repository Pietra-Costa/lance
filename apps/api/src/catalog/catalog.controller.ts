import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/enums';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CatalogSearchService } from './application/catalog-search.service';
import { CatalogImportService } from './application/catalog-import.service';

const SUPPORTED_SOURCES = ['THE_MET', 'ARTIC', 'MUSICBRAINZ'] as const;

type SupportedSource = (typeof SUPPORTED_SOURCES)[number];

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly catalogSearchService: CatalogSearchService,
    private readonly catalogImportService: CatalogImportService,
  ) {}

  @Get('search')
  async search(@Query('q') query?: string) {
    if (!query?.trim()) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    return this.catalogSearchService.search(query);
  }

  @Post(':source/:externalId/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEILOEIRO)
  async importItem(
    @Param('source') source: string,
    @Param('externalId') externalId: string,
  ) {
    if (!(SUPPORTED_SOURCES as readonly string[]).includes(source)) {
      throw new BadRequestException(`Unsupported catalog source: ${source}`);
    }

    return this.catalogImportService.importItem(
      source as SupportedSource,
      externalId,
    );
  }
}
