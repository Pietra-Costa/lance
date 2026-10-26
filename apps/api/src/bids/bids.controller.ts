import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBidDto } from './dto/create-bid.dto';
import { BidsService } from './bids.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('lots/:lotId/bids')
@UseGuards(JwtAuthGuard)
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  createBid(
    @Req() request: AuthenticatedRequest,
    @Param('lotId') lotId: string,
    @Body() dto: CreateBidDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (
      !idempotencyKey ||
      idempotencyKey.trim().length === 0 ||
      idempotencyKey.length > 200
    ) {
      throw new BadRequestException(
        'Informe um cabeçalho Idempotency-Key válido.',
      );
    }

    return this.bidsService.createBid(
      request.user.id,
      lotId,
      dto.amountCents,
      idempotencyKey.trim(),
    );
  }
}
