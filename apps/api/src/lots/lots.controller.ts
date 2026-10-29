import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { LotStatus, UserRole } from '../../generated/prisma/enums';
import { CancelLotDto, CreateLotDto, UpdateLotDto } from './dto/create-lot.dto';
import { LotsService } from './lots.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };
@Controller()
export class LotsController {
  constructor(private readonly lots: LotsService) {}
  @Get('lots')
  list(
    @Query('status') status?: LotStatus,
    @Query('category') category?: string,
  ) {
    return this.lots.list(status, category);
  }
  @Get('lots/:id') get(@Param('id') id: string) {
    return this.lots.getPublic(id);
  }
  @Get('seller/lots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEILOEIRO)
  mine(@Req() req: AuthenticatedRequest) {
    return this.lots.sellerLots(req.user.id);
  }
  @Post('lots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEILOEIRO)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateLotDto) {
    return this.lots.create(req.user.id, dto);
  }
  @Patch('lots/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEILOEIRO)
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateLotDto,
  ) {
    return this.lots.update(req.user.id, id, dto);
  }
  @Post('lots/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEILOEIRO)
  publish(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.lots.publish(req.user.id, id);
  }
  @Post('lots/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LEILOEIRO)
  cancel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CancelLotDto,
  ) {
    return this.lots.cancel(req.user.id, id, dto);
  }
}
