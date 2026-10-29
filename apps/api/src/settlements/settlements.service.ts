import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { appendAuditEvent } from '../audit/audit-chain';
import { AuthService } from '../auth/auth.service';
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

  /**
   * Liquida um lote encerrado de forma atômica e idempotente.
   *
   * Em caso de falha, a transação principal é revertida (nenhum saldo é criado
   * ou destruído) e o settlement é marcado como FAILED em uma segunda
   * transação curta, para que a inconsistência fique visível e rastreável em
   * vez de desaparecer em um rollback silencioso.
   */
  async closeAndSettle(lotId: string) {
    try {
      return await this.settleInTransaction(lotId);
    } catch (error) {
      await this.markSettlementFailed(lotId, error);
      throw error;
    }
  }

  private async markSettlementFailed(lotId: string, error: unknown) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 1000)
        : 'Erro desconhecido';

    try {
      // A transação principal foi revertida, então o settlement pode não
      // existir. Nesse caso ele é criado já em FAILED, para que a
      // inconsistência fique registrada em vez de desaparecer no rollback.
      const existing = await this.prisma.auctionSettlement.findUnique({
        where: { lotId },
        select: { id: true, status: true },
      });

      if (existing?.status === SettlementStatus.COMPLETED) {
        return;
      }

      const settlement =
        existing ??
        (await this.prisma.auctionSettlement.create({
          data: {
            lotId,
            amountCents: 0,
            status: SettlementStatus.FAILED,
          },
          select: { id: true, status: true },
        }));

      if (existing && existing.status !== SettlementStatus.FAILED) {
        await this.prisma.auctionSettlement.update({
          where: { id: settlement.id },
          data: { status: SettlementStatus.FAILED },
        });
      }

      await this.prisma.$transaction(async (tx) => {
        await appendAuditEvent(tx, 'SETTLEMENT_FAILED', 'LOT', lotId, {
          lotId,
          settlementId: settlement.id,
          reason: message,
        });

        await tx.outboxEvent.create({
          data: {
            eventKey: `settlement-failed:${settlement.id}:${Date.now()}`,
            eventType: 'SETTLEMENT_FAILED',
            aggregateType: 'LOT',
            aggregateId: lotId,
            payload: { lotId, settlementId: settlement.id, reason: message },
          },
        });
      });
    } catch (markError) {
      this.logger.error(
        `Falha ao marcar o settlement do lote ${lotId} como FAILED`,
        markError instanceof Error ? markError.stack : undefined,
      );
    }
  }

  private async settleInTransaction(lotId: string) {
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
        } else if (wasLive) {
          // Lote encerrado sem nenhum lance: evento próprio, sem vencedor
          // e sem qualquer movimentação financeira.
          await appendAuditEvent(tx, 'AUCTION_ENDED_NO_BIDS', 'LOT', lotId, {
            lotId,
            endedAt: new Date().toISOString(),
            startingPriceCents: lot.startingPriceCents,
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

        // Retomada de um settlement que ficou em PROCESSING (processo
        // interrompido no meio da liquidação). Os lançamentos financeiros são
        // idempotentes pelas chaves de idempotência do ledger, então reprocessar
        // é seguro.
        if (settlement.status === SettlementStatus.PROCESSING) {
          this.logger.warn(
            `Retomando settlement ${settlement.id} do lote ${lotId} que estava em PROCESSING`,
          );
        }
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
          throw new Error('Reserva ativa do vencedor não encontrada.');
        const sellerWallet = await tx.wallet.findUnique({
          where: { userId: lot.sellerId },
        });
        if (!sellerWallet)
          throw new Error('Carteira do leiloeiro não encontrada.');
        const amountCents = reservation.amountCents;

        // Notifica o vencedor (evento AUCTION_WON). Gravado na mesma transação
        // da liquidação: ou existe junto do crédito, ou não existe.
        const alreadyNotified = await tx.notification.findFirst({
          where: {
            userId: lot.currentLeaderId,
            type: 'AUCTION_WON',
            payload: { path: ['lotId'], equals: lotId },
          },
          select: { id: true },
        });

        if (!alreadyNotified) {
          await tx.notification.create({
            data: {
              userId: lot.currentLeaderId as string,
              type: 'AUCTION_WON',
              payload: {
                lotId,
                settlementId: settlement.id,
                amountCents,
              },
            },
          });
        }

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
              // Snapshot imutável com os campos exigidos pelo comprovante.
              lotId,
              lotTitle: lot.itemSnapshot?.title ?? 'Lote',
              imageUrl: lot.itemSnapshot?.imageUrl ?? null,
              sourceUrl: lot.itemSnapshot?.sourceUrl ?? null,
              imageAttribution: lot.itemSnapshot?.imageAttribution ?? null,
              houseName: 'Lance Casa de Leilões',
              sellerPublicName: 'Leiloeiro credenciado Lance',
              winnerPseudonym: AuthService.publicPseudonym(
                lot.currentLeaderId as string,
              ),
              endedAt: lot.endsAt.toISOString(),
              settledAt: new Date().toISOString(),
              winningPriceCents: amountCents,
              settlementStatus: 'SIMULATED_COMPLETED',
              // Deixa explícito que não é nota fiscal nem pagamento real.
              disclaimer:
                'Liquidação simulada em plataforma de saldo fictício. Não é nota fiscal, comprovante de pagamento real nem garantia de entrega.',
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
