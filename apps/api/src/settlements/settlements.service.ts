import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import {
  BidReservationStatus,
  LotStatus,
  SettlementStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async reconcile() {
    const now = new Date();
    await this.prisma.lot.updateMany({
      where: {
        status: LotStatus.SCHEDULED,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      data: { status: LotStatus.LIVE },
    });
    const lots = await this.prisma.lot.findMany({
      where: { status: LotStatus.LIVE, endsAt: { lte: now } },
      select: { id: true },
    });
    for (const lot of lots) {
      try {
        await this.closeAndSettle(lot.id);
      } catch (error) {
        this.logger.error(
          `Falha ao liquidar lote ${lot.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }
  }

  async closeAndSettle(lotId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<
          Array<{ id: string }>
        >`SELECT "id" FROM "Lot" WHERE "id" = ${lotId} FOR UPDATE`;
        if (!locked.length) return null;
        const lot = await tx.lot.findUniqueOrThrow({
          where: { id: lotId },
          include: { itemSnapshot: true },
        });
        if (lot.status === LotStatus.CANCELED) return null;
        if (lot.status === LotStatus.LIVE && lot.endsAt > new Date())
          return null;
        if (lot.status === LotStatus.SCHEDULED) return null;
        if (lot.status === LotStatus.LIVE)
          await tx.lot.update({
            where: { id: lotId },
            data: { status: LotStatus.ENDED },
          });

        const winningBid = lot.currentLeaderId
          ? await tx.bid.findFirst({
              where: {
                lotId,
                bidderId: lot.currentLeaderId,
                amountCents: lot.currentPriceCents,
              },
              orderBy: { createdAt: 'desc' },
            })
          : null;
        const settlement = await tx.auctionSettlement.upsert({
          where: { lotId },
          update: {},
          create: {
            lotId,
            winningBidId: winningBid?.id,
            amountCents: lot.currentPriceCents,
            status: SettlementStatus.PENDING,
          },
        });
        if (settlement.status === SettlementStatus.COMPLETED) return settlement;
        if (!lot.currentLeaderId) {
          return tx.auctionSettlement.update({
            where: { id: settlement.id },
            data: { status: SettlementStatus.COMPLETED, settledAt: new Date() },
          });
        }
        const reservation = await tx.bidReservation.findFirst({
          where: { lotId, status: BidReservationStatus.ACTIVE },
          include: { wallet: true },
        });
        if (!reservation)
          throw new Error('Reserva ativa do vencedor não encontrada.');
        const sellerWallet = await tx.wallet.findUnique({
          where: { userId: lot.sellerId },
        });
        if (!sellerWallet)
          throw new Error('Carteira do leiloeiro não encontrada.');
        const amountCents = reservation.amountCents;
        await tx.auctionSettlement.update({
          where: { id: settlement.id },
          data: { status: SettlementStatus.PROCESSING },
        });
        await tx.wallet.update({
          where: { id: reservation.walletId },
          data: {
            balanceCents: { decrement: amountCents },
            reservedCents: { decrement: amountCents },
          },
        });
        await tx.wallet.update({
          where: { id: sellerWallet.id },
          data: { balanceCents: { increment: amountCents } },
        });
        await tx.bidReservation.update({
          where: { id: reservation.id },
          data: { status: BidReservationStatus.CONSUMED },
        });
        await tx.walletTransaction.createMany({
          data: [
            {
              walletId: reservation.walletId,
              type: WalletTransactionType.WINNER_DEBIT,
              amountCents: -amountCents,
              idempotencyKey: `settlement:${settlement.id}:winner-debit`,
              referenceType: 'AUCTION_SETTLEMENT',
              referenceId: settlement.id,
              description: 'Débito por arremate simulado',
            },
            {
              walletId: sellerWallet.id,
              type: WalletTransactionType.SELLER_CREDIT,
              amountCents,
              idempotencyKey: `settlement:${settlement.id}:seller-credit`,
              referenceType: 'AUCTION_SETTLEMENT',
              referenceId: settlement.id,
              description: 'Crédito por lote arrematado',
            },
          ],
          skipDuplicates: true,
        });
        const receipt = await tx.receipt.upsert({
          where: { settlementId: settlement.id },
          update: {},
          create: {
            settlementId: settlement.id,
            verificationCode: randomBytes(16).toString('hex'),
            snapshot: {
              lotId,
              title: lot.itemSnapshot?.title ?? 'Lote',
              imageUrl: lot.itemSnapshot?.imageUrl ?? null,
              endedAt: lot.endsAt.toISOString(),
              winningPriceCents: amountCents,
              settlement: 'SIMULATED_COMPLETED',
            },
          },
        });
        const completed = await tx.auctionSettlement.update({
          where: { id: settlement.id },
          data: { status: SettlementStatus.COMPLETED, settledAt: new Date() },
        });
        await this.audit(tx, 'SETTLEMENT_COMPLETED', lotId, {
          settlementId: settlement.id,
          receiptId: receipt.id,
          amountCents,
        });
        await tx.outboxEvent.create({
          data: {
            eventKey: `settlement-completed:${settlement.id}`,
            eventType: 'SETTLEMENT_COMPLETED',
            aggregateType: 'LOT',
            aggregateId: lotId,
            payload: {
              lotId,
              settlementId: settlement.id,
              receiptCode: receipt.verificationCode,
            },
          },
        });
        return completed;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  private async audit(
    tx: any,
    eventType: string,
    entityId: string,
    payload: Record<string, unknown>,
  ) {
    await tx.auditChainState.upsert({
      where: { id: 'global' },
      create: { id: 'global' },
      update: {},
    });
    await tx.$queryRaw`SELECT "id" FROM "AuditChainState" WHERE "id" = 'global' FOR UPDATE`;
    const state = await tx.auditChainState.findUniqueOrThrow({
      where: { id: 'global' },
    });
    const createdAt = new Date();
    const eventHash = createHash('sha256')
      .update(
        JSON.stringify({
          eventType,
          entityType: 'LOT',
          entityId,
          payload,
          previousHash: state.lastEventHash,
          createdAt: createdAt.toISOString(),
        }),
      )
      .digest('hex');
    const event = await tx.auditEvent.create({
      data: {
        eventType,
        entityType: 'LOT',
        entityId,
        payload,
        previousHash: state.lastEventHash,
        eventHash,
        createdAt,
      },
    });
    await tx.auditChainState.update({
      where: { id: 'global' },
      data: { lastSequence: event.sequence, lastEventHash: eventHash },
    });
  }
}
