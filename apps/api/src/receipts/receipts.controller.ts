import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';

/**
 * Verificação pública de comprovantes de arremate.
 *
 * Público por definição: qualquer pessoa com o código de verificação (que vai
 * no link compartilhado) consulta o resultado. Nenhum dado pessoal é exposto —
 * apenas pseudônimo, título do item, valores e status da liquidação.
 */
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':verificationCode')
  async find(@Param('verificationCode') verificationCode: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { verificationCode },
      include: {
        settlement: {
          include: {
            lot: { include: { itemSnapshot: true } },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Comprovante não encontrado.');
    }

    const snapshot = (receipt.snapshot ?? {}) as Record<string, unknown>;
    const lot = receipt.settlement.lot;

    return {
      verificationCode: receipt.verificationCode,
      issuedAt: receipt.issuedAt,
      snapshot,
      lot: {
        id: lot.id,
        title: lot.itemSnapshot?.title ?? null,
        imageUrl: lot.itemSnapshot?.imageUrl ?? null,
        sourceUrl: lot.itemSnapshot?.sourceUrl ?? null,
        imageAttribution: lot.itemSnapshot?.imageAttribution ?? null,
        endsAt: lot.endsAt,
      },
      settlement: {
        status: receipt.settlement.status,
        amountCents: receipt.settlement.amountCents,
        settledAt: receipt.settlement.settledAt,
      },
      notice:
        'Comprovante de resultado de liquidação simulada. Não é nota fiscal, comprovante de pagamento real ou garantia de entrega.',
    };
  }
}
