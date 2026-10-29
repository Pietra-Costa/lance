import { createHash } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';

/**
 * Representação canônica de um evento de auditoria.
 *
 * Regras:
 * - As chaves do objeto são serializadas em ordem alfabética fixa, de forma
 *   que a mesma informação sempre produz o mesmo hash.
 * - Objetos aninhados também são ordenados recursivamente.
 * - `undefined` é omitido, `null` é preservado.
 *
 * A canonicalização é versionada por `CANONICALIZATION_VERSION`, que entra no
 * material hasheado. Alterar as regras exige subir a versão, para que a
 * verificação continue distinguindo o que foi gravado sob qual versão.
 */
export const CANONICALIZATION_VERSION = 1;

type JsonLike =
  null | boolean | number | string | JsonLike[] | { [key: string]: JsonLike };

/**
 * Serializa um valor JSON de forma determinística.
 * Arrays preservam a ordem; objetos têm as chaves ordenadas.
 */
export function canonicalizeJson(value: unknown): string {
  const normalize = (input: unknown): JsonLike | undefined => {
    if (input === null) return null;
    if (input === undefined) return undefined;

    if (Array.isArray(input)) {
      return input
        .map((item) => normalize(item))
        .filter((item): item is JsonLike => item !== undefined);
    }

    if (input instanceof Date) {
      return input.toISOString();
    }

    if (typeof input === 'object') {
      const source = input as Record<string, unknown>;
      const result: Record<string, JsonLike> = {};

      for (const key of Object.keys(source).sort()) {
        const normalized = normalize(source[key]);

        if (normalized !== undefined) {
          result[key] = normalized;
        }
      }

      return result;
    }

    if (
      typeof input === 'boolean' ||
      typeof input === 'number' ||
      typeof input === 'string'
    ) {
      return input;
    }

    return undefined;
  };

  return JSON.stringify(normalize(value) ?? null);
}

export interface AuditHashInput {
  eventType: string;
  entityType: string;
  entityId: string;
  payload: unknown;
  previousHash: string | null;
  createdAt: Date | string;
}

/**
 * Calcula o hash de um evento da cadeia.
 *
 * IMPORTANTE: esta é a única implementação de cálculo de hash da plataforma.
 * Escrita (appendAuditEvent) e verificação (AuditService.verify) usam
 * exatamente esta função — qualquer divergência entre as duas quebraria a
 * auditoria inteira.
 */
export function computeEventHash(input: AuditHashInput): string {
  const createdAt =
    input.createdAt instanceof Date
      ? input.createdAt.toISOString()
      : new Date(input.createdAt).toISOString();

  const material = canonicalizeJson({
    v: CANONICALIZATION_VERSION,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload ?? null,
    previousHash: input.previousHash,
    createdAt,
  });

  return createHash('sha256').update(material).digest('hex');
}

type AuditTransaction = Prisma.TransactionClient;

/**
 * Acrescenta um evento à cadeia de auditoria.
 *
 * Deve ser chamado SEMPRE dentro da mesma transação da operação de negócio:
 * ou o efeito de domínio e a evidência existem juntos, ou nenhum existe.
 *
 * O estado global (`AuditChainState`) é travado com `SELECT ... FOR UPDATE`
 * antes da leitura, o que serializa a escrita da cadeia e impede bifurcações.
 */
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

  const eventHash = computeEventHash({
    eventType,
    entityType,
    entityId,
    payload,
    previousHash,
    createdAt,
  });

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
