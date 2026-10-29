import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.type';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { WalletService } from './wallet.service';

type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@Req() request: AuthenticatedRequest) {
    return this.walletService.getWallet(request.user.id);
  }

  @Get('transactions')
  transactions(@Req() request: AuthenticatedRequest) {
    return this.walletService.transactions(request.user.id);
  }

  @Post('deposits')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  createDeposit(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateDepositDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException(
        'O cabeçalho Idempotency-Key é obrigatório.',
      );
    }

    return this.walletService.createDeposit(
      request.user.id,
      dto.amountCents,
      idempotencyKey,
    );
  }
}
