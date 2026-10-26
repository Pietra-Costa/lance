import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.type';
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

  @Post('deposits')
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
