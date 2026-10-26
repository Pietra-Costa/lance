import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  BidReservationStatus,
  LotStatus,
  UserRole,
} from '../../generated/prisma/enums';
import { PrismaService } from '../infrastructure/database/prisma.service';

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
      throw new ConflictException('Valor de lance inválido.');
    }

    const requestHash = createHash('sha256')
      .update(JSON.stringify({ lotId, amountCents }))
      .digest('hex');

    // Conflitos de serialização podem ocorrer quando há lances simultâneos.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            // Serializa todos os lances que disputam o mesmo lote.
            const lockedLots = await tx.$queryRaw<Array<{ id: string }>>`
              SELECT "id"
              FROM "Lot"
              WHERE "id" = ${lotId}
              FOR UPDATE
            `;

            if (lockedLots.length === 0) {
              throw new NotFoundException('Lote não encontrado.');
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
                throw new ConflictException(
                  'Esta chave de idempotência já foi usada com outros dados.',
                );
              }

              if (!existingRequest.response) {
                throw new ConflictException(
                  'A solicitação anterior não possui um resultado disponível.',
                );
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
              throw new NotFoundException('Lote não encontrado.');
            }

            if (
              lot.status !== LotStatus.LIVE ||
              lot.startsAt > now ||
              lot.endsAt <= now
            ) {
              throw new ConflictException(
                'Este lote não está aceitando lances.',
              );
            }

            const bidder = await tx.user.findUnique({
              where: { id: bidderId },
              select: { id: true, role: true },
            });

            if (!bidder) {
              throw new NotFoundException('Usuário não encontrado.');
            }

            if (bidder.role !== UserRole.LICITANTE) {
              throw new ForbiddenException(
                'Somente licitantes podem dar lances.',
              );
            }

            if (lot.sellerId === bidderId) {
              throw new ForbiddenException(
                'O vendedor não pode dar lances no próprio lote.',
              );
            }

            const minimumBid =
              lot.currentLeaderId === null
                ? lot.startingPriceCents
                : lot.currentPriceCents + lot.minIncrementCents;

            if (amountCents < minimumBid) {
              throw new ConflictException(
                `O lance mínimo é ${minimumBid} centavos.`,
              );
            }

            if (lot.reservations.length > 1) {
              throw new ConflictException(
                'O lote possui reservas ativas inconsistentes.',
              );
            }

            const previousReservation = lot.reservations[0];

            // Libera a reserva anterior antes de validar o saldo
            // necessário para cobrir integralmente o novo lance.
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
                throw new ConflictException(
                  'Não foi possível liberar a reserva anterior.',
                );
              }

              await tx.bidReservation.update({
                where: { id: previousReservation.id },
                data: { status: BidReservationStatus.RELEASED },
              });
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
              throw new ConflictException(
                'Saldo disponível insuficiente para cobrir o lance integral.',
              );
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
              throw new ConflictException(
                'O saldo mudou durante a operação. Tente novamente.',
              );
            }

            const bid = await tx.bid.create({
              data: {
                lotId,
                bidderId,
                amountCents,
              },
            });

            const reservation = await tx.bidReservation.create({
              data: {
                walletId: wallet.id,
                lotId,
                bidId: bid.id,
                amountCents,
                status: BidReservationStatus.ACTIVE,
              },
            });

            await tx.lot.update({
              where: { id: lotId },
              data: {
                currentLeaderId: bidderId,
                currentPriceCents: amountCents,
              },
            });

            const eventPayload = {
              bidId: bid.id,
              lotId,
              bidderId,
              amountCents,
              reservationId: reservation.id,
              previousReservationId: previousReservation?.id ?? null,
            };

            const eventType = 'BID_PLACED';
            const entityType = 'LOT';
            const createdAt = new Date();

            // Serializa a escrita da cadeia de auditoria.
            await tx.auditChainState.upsert({
              where: { id: 'global' },
              create: { id: 'global' },
              update: {},
            });

            await tx.$queryRaw`
              SELECT "id"
              FROM "AuditChainState"
              WHERE "id" = 'global'
              FOR UPDATE
            `;

            const chainState = await tx.auditChainState.findUniqueOrThrow({
              where: { id: 'global' },
            });

            const previousHash = chainState.lastEventHash;

            const eventHash = createHash('sha256')
              .update(
                JSON.stringify({
                  eventType,
                  entityType,
                  entityId: lotId,
                  payload: eventPayload,
                  previousHash,
                  createdAt: createdAt.toISOString(),
                }),
              )
              .digest('hex');

            const auditEvent = await tx.auditEvent.create({
              data: {
                eventType,
                entityType,
                entityId: lotId,
                payload: eventPayload,
                previousHash,
                eventHash,
                createdAt,
              },
            });

            await tx.auditChainState.update({
              where: { id: 'global' },
              data: {
                lastSequence: auditEvent.sequence,
                lastEventHash: eventHash,
              },
            });

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
        const isSerializationConflict =
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          error.code === 'P2034';

        if (isSerializationConflict && attempt < 3) {
          continue;
        }

        if (isSerializationConflict) {
          throw new ConflictException(
            'O lote recebeu alterações concorrentes. Tente novamente.',
          );
        }

        throw error;
      }
    }

    throw new ConflictException('Não foi possível registrar o lance.');
  }
}
