import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  BidReservationStatus,
  LotStatus,
  UserRole,
} from '../../generated/prisma/enums';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { bidRejection } from './bid-rejection';
import { AuthService } from '../auth/auth.service';
import { appendAuditEvent } from '../audit/audit-chain';

function isSerializationConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const err = error as {
    code?: unknown;
    meta?: {
      code?: unknown;
      message?: unknown;
    };
    message?: unknown;
  };

  return (
    err.code === 'P2034' ||
    (err.code === 'P2010' && err.meta?.code === '40001') ||
    String(err.message ?? '').includes(
      'could not serialize access due to concurrent update',
    ) ||
    String(err.meta?.message ?? '').includes('40001')
  );
}

@Injectable()
export class BidsService {
  constructor(private readonly prisma: PrismaService) {}

  async createBid(
    bidderId: string,
    lotId: string,
    amountCents: number,
    idempotencyKey: string,
  ) {
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw bidRejection.invalidAmount(amountCents);
    }

    const requestHash = createHash('sha256')
      .update(JSON.stringify({ lotId, amountCents }))
      .digest('hex');

    // Conflitos de serialização podem ocorrer quando há lances simultâneos.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // Serializa os lances que disputam o mesmo lote.
            const lockedLots = await tx.$queryRaw<Array<{ id: string }>>`
              SELECT "id"
              FROM "Lot"
              WHERE "id" = ${lotId}
              FOR UPDATE
            `;

            if (lockedLots.length === 0) {
              throw bidRejection.lotNotFound();
            }

            const existingRequest = await tx.bidRequest.findUnique({
              where: {
                bidderId_idempotencyKey: {
                  bidderId,
                  idempotencyKey,
                },
              },
            });

            if (existingRequest) {
              if (
                existingRequest.lotId !== lotId ||
                existingRequest.requestHash !== requestHash
              ) {
                throw bidRejection.idempotencyKeyReused();
              }

              if (!existingRequest.response) {
                throw bidRejection.idempotencyPending();
              }

              return existingRequest.response;
            }

            const bidRequest = await tx.bidRequest.create({
              data: {
                bidderId,
                lotId,
                idempotencyKey,
                requestHash,
              },
            });

            const now = new Date();

            const lot = await tx.lot.findUnique({
              where: { id: lotId },
              include: {
                reservations: {
                  where: {
                    status: BidReservationStatus.ACTIVE,
                  },
                },
              },
            });

            if (!lot) {
              throw bidRejection.lotNotFound();
            }

            // Recusas com motivo específico (Verzel: mensagem por motivo).
            if (lot.status === LotStatus.CANCELED) {
              throw bidRejection.notLive();
            }

            if (lot.status === LotStatus.ENDED) {
              throw bidRejection.ended(lot.endsAt);
            }

            if (lot.status === LotStatus.SCHEDULED || lot.startsAt > now) {
              throw bidRejection.notStarted(lot.startsAt);
            }

            if (lot.status !== LotStatus.LIVE) {
              throw bidRejection.notLive();
            }

            if (lot.endsAt <= now) {
              throw bidRejection.ended(lot.endsAt);
            }

            const bidder = await tx.user.findUnique({
              where: { id: bidderId },
              select: { id: true, role: true },
            });

            if (!bidder) {
              throw new NotFoundException('Usuário não encontrado.');
            }

            if (bidder.role !== UserRole.LICITANTE) {
              throw bidRejection.invalidRole();
            }

            if (lot.sellerId === bidderId) {
              throw bidRejection.sellerCannotBid();
            }

            // O líder não pode cobrir o próprio lance.
            if (lot.currentLeaderId === bidderId) {
              throw bidRejection.alreadyLeading(lot.currentPriceCents);
            }

            const minimumBid =
              lot.currentLeaderId === null
                ? lot.startingPriceCents
                : lot.currentPriceCents + lot.minIncrementCents;

            if (amountCents < minimumBid) {
              throw bidRejection.belowMinimum(minimumBid, amountCents);
            }

            if (lot.reservations.length > 1) {
              throw bidRejection.reservationInconsistent();
            }

            const previousReservation = lot.reservations[0];

            let previousBidderId: string | null = null;

            if (previousReservation) {
              const previousWallet = await tx.wallet.findUnique({
                where: { id: previousReservation.walletId },
                select: { userId: true },
              });

              if (!previousWallet) {
                throw bidRejection.reservationInconsistent();
              }

              previousBidderId = previousWallet.userId;
            }

            if (previousReservation) {
              const released = await tx.wallet.updateMany({
                where: {
                  id: previousReservation.walletId,
                  reservedCents: {
                    gte: previousReservation.amountCents,
                  },
                },
                data: {
                  reservedCents: {
                    decrement: previousReservation.amountCents,
                  },
                },
              });

              if (released.count !== 1) {
                throw bidRejection.reservationInconsistent();
              }

              await tx.bidReservation.update({
                where: { id: previousReservation.id },
                data: { status: BidReservationStatus.RELEASED },
              });

              // Notifica o líder superado (evento BID_OUTBID).
              // Não notifica quando o próprio licitante cobre o seu lance.
              if (previousBidderId && previousBidderId !== bidderId) {
                await tx.notification.create({
                  data: {
                    userId: previousBidderId,
                    type: 'BID_OUTBID',
                    payload: {
                      lotId,
                      amountCents,
                      outbidAt: now.toISOString(),
                    },
                  },
                });
              }
            }

            const wallet = await tx.wallet.findUnique({
              where: { userId: bidderId },
            });

            if (!wallet) {
              throw new NotFoundException(
                'Carteira do licitante não encontrada.',
              );
            }

            const availableCents = wallet.balanceCents - wallet.reservedCents;

            if (availableCents < amountCents) {
              throw bidRejection.insufficientFunds(availableCents, amountCents);
            }

            const updatedWallet = await tx.wallet.updateMany({
              where: {
                id: wallet.id,
                balanceCents: {
                  gte: amountCents + wallet.reservedCents,
                },
              },
              data: {
                reservedCents: { increment: amountCents },
              },
            });

            if (updatedWallet.count !== 1) {
              throw bidRejection.concurrencyConflict();
            }

            const bid = await tx.bid.create({
              data: {
                lotId,
                bidderId,
                amountCents,
              },
            });

            const walletUserIds = new Set<string>([bidderId]);

            if (previousBidderId) {
              walletUserIds.add(previousBidderId);
            }

            for (const userId of walletUserIds) {
              await tx.outboxEvent.create({
                data: {
                  eventKey: `wallet-updated:bid:${bid.id}:${userId}`,
                  eventType: 'WALLET_UPDATED',
                  aggregateType: 'WALLET',
                  aggregateId: userId,
                  payload: {
                    bidId: bid.id,
                  },
                },
              });
            }

            const reservation = await tx.bidReservation.create({
              data: {
                walletId: wallet.id,
                lotId,
                bidId: bid.id,
                amountCents,
                status: BidReservationStatus.ACTIVE,
              },
            });

            const shouldExtendAuction =
              lot.endsAt.getTime() - now.getTime() <= 120_000;

            // Anti-sniping: nos últimos 2 minutos, o fim passa a ser
            // (instante do lance + 2 minutos). Nunca encurta o prazo.
            const newEndsAt = shouldExtendAuction
              ? new Date(now.getTime() + 120_000)
              : lot.endsAt;

            await tx.lot.update({
              where: { id: lotId },
              data: {
                currentLeaderId: bidderId,
                currentPriceCents: amountCents,
                endsAt: newEndsAt,
              },
            });

            // Payload do evento: `bidderId` é interno (fica na auditoria) e
            // `bidderPseudonym` é o que pode ser publicado para os clientes.
            const eventPayload = {
              bidId: bid.id,
              lotId,
              bidderId,
              bidderPseudonym: AuthService.publicPseudonym(bidderId),
              amountCents,
              currentPriceCents: amountCents,
              endsAt: newEndsAt.toISOString(),
              currentLeaderId: bidderId,
              reservationId: reservation.id,
              previousReservationId: previousReservation?.id ?? null,
            };

            const eventType = 'BID_PLACED';

            await appendAuditEvent(tx, eventType, 'LOT', lotId, eventPayload);

            await tx.outboxEvent.create({
              data: {
                eventKey: `bid-created:${bid.id}`,
                eventType,
                aggregateType: 'LOT',
                aggregateId: lotId,
                payload: eventPayload,
              },
            });

            const result = {
              bid,
              reservation,
              currentPriceCents: amountCents,
              availableBalanceCents:
                wallet.balanceCents - wallet.reservedCents - amountCents,
            };

            const storedResponse = JSON.parse(JSON.stringify(result));

            await tx.bidRequest.update({
              where: { id: bidRequest.id },
              data: {
                bidId: bid.id,
                response: storedResponse,
              },
            });

            return result;
          },
          {
            isolationLevel: 'Serializable',
          },
        );
      } catch (error: unknown) {
        if (isSerializationConflict(error)) {
          if (attempt < 3) {
            // Aguarda a transação concorrente antes de tentar novamente.
            await new Promise((resolve) => setTimeout(resolve, 50 * attempt));

            continue;
          }

          throw bidRejection.concurrencyConflict();
        }

        const isUniqueConstraintConflict =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2002';

        if (isUniqueConstraintConflict) {
          const existingRequest = await this.prisma.bidRequest.findUnique({
            where: {
              bidderId_idempotencyKey: {
                bidderId,
                idempotencyKey,
              },
            },
          });

          if (existingRequest) {
            if (
              existingRequest.lotId !== lotId ||
              existingRequest.requestHash !== requestHash
            ) {
              throw bidRejection.idempotencyKeyReused();
            }

            if (existingRequest.response) {
              return existingRequest.response;
            }

            if (attempt < 3) {
              continue;
            }

            throw bidRejection.idempotencyPending();
          }
        }

        throw error;
      }
    }

    throw bidRejection.concurrencyConflict();
  }
}
