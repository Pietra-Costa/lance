import { createHash } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';

type AuditTransaction = Prisma.TransactionClient;

export async function appendAuditEvent(
  tx: AuditTransaction,
  eventType: string,
  entityType: string,
  entityId: string,
  payload: Prisma.InputJsonValue,
) {
  await tx.$queryRaw`
    SELECT "id"
    FROM "AuditChainState"
    WHERE "id" = 'global'
    FOR UPDATE
  `;

  const state = await tx.auditChainState.findUniqueOrThrow({
    where: { id: 'global' },
  });

  const createdAt = new Date();
  const previousHash = state.lastEventHash;

  const canonicalEvent = JSON.stringify({
    eventType,
    entityType,
    entityId,
    payload,
    previousHash,
    createdAt: createdAt.toISOString(),
  });

  const eventHash = createHash('sha256').update(canonicalEvent).digest('hex');

  const event = await tx.auditEvent.create({
    data: {
      eventType,
      entityType,
      entityId,
      payload,
      previousHash,
      eventHash,
      createdAt,
    },
  });

  await tx.auditChainState.update({
    where: { id: 'global' },
    data: {
      lastSequence: event.sequence,
      lastEventHash: eventHash,
    },
  });

  return event;
}
