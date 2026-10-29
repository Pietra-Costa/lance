import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * Reduz o payload do outbox ao que pode ser publicado publicamente.
 * Campos internos (IDs de domínio, valores de reserva, códigos de recibo)
 * nunca saem pelo Socket.IO.
 */
function publicRealtimePayload(
  eventType: string,
  payload: unknown,
): Record<string, unknown> {
  const source =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {};

  const base: Record<string, unknown> = {
    lotId: source.lotId ?? null,
  };

  if (eventType === 'BID_PLACED') {
    return {
      ...base,
      bidId: source.bidId ?? null,
      amountCents: source.amountCents ?? null,
      currentPriceCents: source.currentPriceCents ?? source.amountCents ?? null,
      endsAt: source.endsAt ?? null,
      bidderPseudonym: source.bidderPseudonym ?? null,
    };
  }

  if (eventType === 'SETTLEMENT_COMPLETED') {
    return {
      ...base,
      settlementStatus: 'COMPLETED',
    };
  }

  return base;
}

@Injectable()
export class OutboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async publishPending() {
    const events = await this.prisma.outboxEvent.findMany({
      where: { publishedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    for (const event of events) {
      try {
        if (event.aggregateType === 'WALLET') {
          this.realtime.publishWalletUpdated(event.aggregateId);
        } else {
          // O payload interno carrega identificadores de domínio (bidderId,
          // reservationId, settlementId). Nada disso pode ir para o cliente:
          // o realtime publica apenas a projeção pública do estado.
          this.realtime.publishLot(
            event.aggregateId,
            event.eventType,
            publicRealtimePayload(event.eventType, event.payload),
          );
        }

        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            publishedAt: new Date(),
            attempts: { increment: 1 },
            lastError: null,
          },
        });
      } catch (error) {
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            attempts: { increment: 1 },
            lastError:
              error instanceof Error
                ? error.message.slice(0, 1000)
                : 'Erro desconhecido',
          },
        });
      }
    }
  }
}
