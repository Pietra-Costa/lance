import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CANONICALIZATION_VERSION, computeEventHash } from './audit-chain';
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
    const lotIds = [
      ...new Set(
        events
          .filter((event) => event.entityType === 'LOT')
          .map((event) => event.entityId),
      ),
    ];
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
      const pseudonymFor = (userId: string | undefined) =>
        userId ? AuthService.publicPseudonym(userId) : null;
      const bidderPseudonym = pseudonymFor(bidderId);
      const winnerPseudonym = pseudonymFor(winnerId);

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
              'walletId',
              'userId',
              'transactionId',
              'reason',
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
          bidderPseudonym,
          winnerPseudonym,
        },
      };
    });
  }
  /**
   * Verifica a integridade da cadeia de auditoria.
   *
   * Confere, para cada evento em ordem de sequência:
   *  1. continuidade do encadeamento (`previousHash` = hash do anterior);
   *  2. recálculo do hash a partir dos dados persistidos.
   *
   * Também compara a cabeça da cadeia com o `AuditChainState`, o que detecta
   * remoção do último evento ou avanço indevido do estado global.
   *
   * Limite conhecido (documentado no README): uma cadeia de hashes sem
   * ancoragem externa detecta alteração local, mas não impede que alguém com
   * acesso ao banco reescreva todos os eventos e recalcule a cadeia inteira.
   */
  async verify() {
    const events = await this.prisma.auditEvent.findMany({
      orderBy: { sequence: 'asc' },
    });

    let previousHash: string | null = null;
    let previousSequence = 0n;

    for (const event of events) {
      // Buracos na sequência indicam evento removido.
      if (event.sequence <= previousSequence) {
        return {
          valid: false,
          checkedEvents: events.length,
          invalidSequence: event.sequence.toString(),
          reason: 'SEQUENCE_OUT_OF_ORDER',
        };
      }

      const calculated = computeEventHash({
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        payload: event.payload,
        previousHash,
        createdAt: event.createdAt,
      });

      if (
        event.previousHash !== previousHash ||
        event.eventHash !== calculated
      ) {
        return {
          valid: false,
          checkedEvents: events.length,
          invalidSequence: event.sequence.toString(),
          reason:
            event.previousHash !== previousHash
              ? 'BROKEN_LINK'
              : 'HASH_MISMATCH',
        };
      }

      previousHash = event.eventHash;
      previousSequence = event.sequence;
    }

    const state = await this.prisma.auditChainState.findUnique({
      where: { id: 'global' },
    });

    const headMatches = !state || state.lastEventHash === previousHash;

    return {
      valid: headMatches,
      checkedEvents: events.length,
      lastHash: previousHash,
      canonicalizationVersion: CANONICALIZATION_VERSION,
      reason: headMatches ? null : 'HEAD_MISMATCH',
    };
  }
}
