import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../infrastructure/database/prisma.service';
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  async lotHistory(lotId: string) {
    const events = await this.prisma.auditEvent.findMany({
      where: { entityType: 'LOT', entityId: lotId },
      orderBy: { sequence: 'asc' },
    });
    return events.map(({ payload, ...event }) => ({ ...event, payload }));
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
