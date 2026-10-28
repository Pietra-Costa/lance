import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { appendAuditEvent } from '../audit/audit-chain';
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
    const scheduledLots = await this.prisma.lot.findMany({
      where: {
        status: LotStatus.SCHEDULED,
        startsAt: { lte: new Date() },
        endsAt: { gt: new Date() },
      },
      select: { id: true },
    });

    for (const candidate of scheduledLots) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const locked = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "Lot"
          WHERE "id" = ${candidate.id}
          FOR UPDATE
        `;

          if (!locked.length) return;

          const lot = await tx.lot.findUnique({
            where: { id: candidate.id },
            select: {
              id: true,
              status: true,
              startsAt: true,
              endsAt: true,
            },
          });

          const transitionAt = new Date();

          if (
            !lot ||
            lot.status !== LotStatus.SCHEDULED ||
            lot.startsAt > transitionAt ||
            lot.endsAt <= transitionAt
          ) {
            return;
          }

          await tx.lot.update({
            where: { id: lot.id },
            data: { status: LotStatus.LIVE },
          });

          await appendAuditEvent(tx, 'LOT_LIVE', 'LOT', lot.id, {
            lotId: lot.id,
            startedAt: transitionAt.toISOString(),
            activation: 'SCHEDULED',
          });

          await tx.outboxEvent.create({
            data: {
              eventKey: `lot-live:${lot.id}`,
              eventType: 'LOT_LIVE',
              aggregateType: 'LOT',
              aggregateId: lot.id,
              payload: {
                lotId: lot.id,
              },
            },
          });
        });
      } catch (error) {
        this.logger.error(
          `Falha ao ativar automaticamente o lote ${candidate.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    const lotsToClose = await this.prisma.lot.findMany({
      where: {
        status: LotStatus.LIVE,
        endsAt: { lte: new Date() },
      },
      select: { id: true },
    });

    for (const lot of lotsToClose) {
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
        const wasLive = lot.status === LotStatus.LIVE;
        if (wasLive)
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
        if (wasLive) {
          await appendAuditEvent(tx, 'AUCTION_ENDED', 'LOT', lotId, {
            lotId,
            endedAt: new Date().toISOString(),
            winningBidId: winningBid?.id ?? null,
          });
        }
        if (winningBid) {
          await appendAuditEvent(tx, 'AUCTION_WON', 'LOT', lotId, {
            lotId,
            winnerId: winningBid.bidderId,
            winningBidId: winningBid.id,
            amountCents: winningBid.amountCents,
          });
        }
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
          const completedWithoutWinner = await tx.auctionSettlement.update({
            where: { id: settlement.id },
            data: { status: SettlementStatus.COMPLETED, settledAt: new Date() },
          });
          await appendAuditEvent(tx, 'SETTLEMENT_COMPLETED', 'LOT', lotId, {
            settlementId: settlement.id,
            amountCents: 0,
          });
          return completedWithoutWinner;
        }
        const reservation = await tx.bidReservation.findFirst({
          where: { lotId, status: BidReservationStatus.ACTIVE },
          include: { wallet: true },
        });
        if (!reservation)
          throw new Error('Reserva ativa do vencedor nÃ£o encontrada.');
        const sellerWallet = await tx.wallet.findUnique({
          where: { userId: lot.sellerId },
        });
        if (!sellerWallet)
          throw new Error('Carteira do leiloeiro nÃ£o encontrada.');
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
              description: 'DÃ©bito por arremate simulado',
            },
            {
              walletId: sellerWallet.id,
              type: WalletTransactionType.SELLER_CREDIT,
              amountCents,
              idempotencyKey: `settlement:${settlement.id}:seller-credit`,
              referenceType: 'AUCTION_SETTLEMENT',
              referenceId: settlement.id,
              description: 'CrÃ©dito por lote arrematado',
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
        await appendAuditEvent(tx, 'SETTLEMENT_COMPLETED', 'LOT', lotId, {
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
}
