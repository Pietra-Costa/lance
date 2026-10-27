import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly prisma: PrismaService) {}
  @Get(':verificationCode')
  async find(@Param('verificationCode') verificationCode: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { verificationCode },
      include: {
        settlement: { include: { lot: { include: { itemSnapshot: true } } } },
      },
    });
    if (!receipt) throw new NotFoundException('Comprovante não encontrado.');
    return {
      verificationCode: receipt.verificationCode,
      issuedAt: receipt.issuedAt,
      snapshot: receipt.snapshot,
      settlement: {
        status: receipt.settlement.status,
        amountCents: receipt.settlement.amountCents,
        settledAt: receipt.settlement.settledAt,
      },
      notice:
        'Comprovante de resultado de liquidação simulada; não é nota fiscal ou pagamento real.',
    };
  }
}
