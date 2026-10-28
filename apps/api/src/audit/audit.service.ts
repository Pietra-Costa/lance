import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { AuthService } from '../auth/auth.service';
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  async history() {
    return this.withPublicPayload(
      await this.prisma.auditEvent.findMany({
        orderBy: { sequence: 'asc' },
      }),
    );
  }

  async lotHistory(lotId: string) {
    return this.withPublicPayload(
      await this.prisma.auditEvent.findMany({
        where: { entityType: 'LOT', entityId: lotId },
        orderBy: { sequence: 'asc' },
      }),
    );
  }

  private async withPublicPayload(
    events: Array<{
      payload: unknown;
      sequence: bigint;
      id: string;
      eventType: string;
      entityType: string;
      entityId: string;
      previousHash: string | null;
      eventHash: string;
      anchorReference: string | null;
      createdAt: Date;
    }>,
  ) {
    const lotIds = [...new Set(events.map((event) => event.entityId))];
    const lots = await this.prisma.lot.findMany({
      where: { id: { in: lotIds } },
      select: {
        id: true,
        itemSnapshot: { select: { title: true } },
      },
    });
    const lotTitles = new Map(
      lots.map((lot) => [lot.id, lot.itemSnapshot?.title ?? null]),
    );

    return events.map(({ payload, ...event }) => {
      const original =
        payload && typeof payload === 'object'
          ? (payload as Record<string, unknown>)
          : {};
      const bidderId =
        typeof original.bidderId === 'string' ? original.bidderId : undefined;
      const winnerId =
        typeof original.winnerId === 'string' ? original.winnerId : undefined;
      const publicPayload = Object.fromEntries(
        Object.entries(original).filter(
          ([key]) =>
            ![
              'actorId',
              'actorName',
              'lotId',
              'bidderId',
              'bidderName',
              'winnerId',
              'winnerName',
              'sellerId',
              'reservationId',
              'previousReservationId',
              'bidId',
              'settlementId',
              'receiptId',
              'catalogItemId',
            ].includes(key),
        ),
      );
      const lotTitle = lotTitles.get(event.entityId);

      if (lotTitle) {
        publicPayload.lotTitle = lotTitle;
      }

      return {
        ...event,
        sequence: event.sequence.toString(),
        payload: {
          ...publicPayload,
          bidderPseudonym: bidderId
            ? AuthService.publicPseudonym(bidderId)
            : undefined,
          winnerPseudonym: winnerId
            ? AuthService.publicPseudonym(winnerId)
            : undefined,
        },
      };
    });
  }
  async verify() {
    const events = await this.prisma.auditEvent.findMany({
      orderBy: { sequence: 'asc' },
    });
    let previousHash: string | null = null;
    for (const event of events) {
      const calculated = createHash('sha256')
        .update(
          JSON.stringify({
            eventType: event.eventType,
            entityType: event.entityType,
            entityId: event.entityId,
            payload: event.payload,
            previousHash,
            createdAt: event.createdAt.toISOString(),
          }),
        )
        .digest('hex');
      if (event.previousHash !== previousHash || event.eventHash !== calculated)
        return {
          valid: false,
          checkedEvents: events.length,
          invalidSequence: event.sequence.toString(),
        };
      previousHash = event.eventHash;
    }
    const state = await this.prisma.auditChainState.findUnique({
      where: { id: 'global' },
    });
    return {
      valid: !state || state.lastEventHash === previousHash,
      checkedEvents: events.length,
      lastHash: previousHash,
    };
  }
}
