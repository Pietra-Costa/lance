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
import { Throttle } from '@nestjs/throttler';
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

  /**
   * Busca no acervo externo com paginação.
   *
   * `q` é opcional: sem termo, a rota lista o acervo (usado pelos botões de
   * fonte do assistente de criação de lote).
   * `offset` e `limit` controlam a página (padrão 0 / 20, máximo 40).
   */
  @Get('search')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async search(
    @Query('q') query?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedOffset = Number.parseInt(offset ?? '0', 10);
    const parsedLimit = Number.parseInt(limit ?? '20', 10);

    if (Number.isNaN(parsedOffset) || parsedOffset < 0) {
      throw new BadRequestException('Query parameter "offset" inválido.');
    }

    if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 40) {
      throw new BadRequestException(
        'Query parameter "limit" deve estar entre 1 e 40.',
      );
    }

    return this.catalogSearchService.search(query ?? '', {
      offset: parsedOffset,
      limit: parsedLimit,
    });
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
