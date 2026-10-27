import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import type { Request } from 'express';
import { createHash } from 'node:crypto';
import { UserRole } from '../../generated/prisma/enums';
import { AuthenticatedUser } from '../auth/auth.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../infrastructure/database/prisma.service';

class AcceptSellerAgreementDto {
  @IsString() @MinLength(1) @MaxLength(100) version!: string;
  @IsString() @MinLength(16) content!: string;
}
type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('seller-agreement')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LEILOEIRO)
export class SellerAgreementsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('current')
  current(@Req() req: AuthenticatedRequest) {
    return this.prisma.sellerAgreement.findFirst({
      where: { userId: req.user.id },
      orderBy: { acceptedAt: 'desc' },
    });
  }

  @Post('accept')
  accept(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AcceptSellerAgreementDto,
  ) {
    const version = dto.version.trim();
    const contentHash = createHash('sha256').update(dto.content).digest('hex');
    return this.prisma.sellerAgreement.upsert({
      where: { userId_version: { userId: req.user.id, version } },
      update: {},
      create: { userId: req.user.id, version, contentHash },
    });
  }
}
