/**
 * Erros de domínio do leilão com mensagens acionáveis.
 *
 * Requisito do desafio (Verzel, "Front-End > Mensagens de feedback"):
 *   "Mensagem clara para cada lance recusado, dizendo o motivo (abaixo do
 *    mínimo, saldo insuficiente, você já está ganhando, lote ainda não
 *    iniciado ou lote encerrado)."
 *
 * Cada recusa tem um `code` estável (consumível pelo front) e uma mensagem
 * em português já formatada com valores em Real.
 */

import { ConflictException, ForbiddenException } from '@nestjs/common';

/**
 * Formata centavos em Real brasileiro: 10500 -> "R$ 105,00".
 * O Intl usa NBSP (U+00A0) depois de "R$"; normalizamos para espaço comum
 * para que a mensagem seja estável em logs, testes e comparações de string.
 */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format((cents || 0) / 100)
    .replace(/\u00a0/g, ' ');
}

export type BidRejectionCode =
  | 'INVALID_AMOUNT'
  | 'LOT_NOT_FOUND'
  | 'AUCTION_NOT_STARTED'
  | 'AUCTION_ENDED'
  | 'AUCTION_NOT_LIVE'
  | 'INVALID_ROLE'
  | 'SELLER_CANNOT_BID'
  | 'ALREADY_LEADING'
  | 'BELOW_MINIMUM'
  | 'INSUFFICIENT_FUNDS'
  | 'RESERVATION_INCONSISTENT'
  | 'CONCURRENCY_CONFLICT'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'IDEMPOTENCY_PENDING';

export interface BidRejectionBody {
  code: BidRejectionCode;
  message: string;
  /** Valor mínimo aceito, quando aplicável (em centavos). */
  minimumCents?: number;
  /** Saldo disponível do licitante, quando aplicável (em centavos). */
  availableCents?: number;
  /** Valor solicitado (em centavos). */
  requestedCents?: number;
}

/**
 * Exceção de recusa de lance com corpo estruturado.
 * O NestJS serializa `getResponse()` no JSON de erro, então o front recebe
 * `{ statusCode, code, message, minimumCents, ... }`.
 */
export class BidRejectionException extends ConflictException {
  constructor(body: BidRejectionBody) {
    super(body);
  }
}

export const bidRejection = {
  invalidAmount(amountCents: number): BidRejectionException {
    return new BidRejectionException({
      code: 'INVALID_AMOUNT',
      message:
        'O valor do lance deve ser um número inteiro de centavos maior que zero.',
      requestedCents: amountCents,
    });
  },

  lotNotFound(): BidRejectionException {
    return new BidRejectionException({
      code: 'LOT_NOT_FOUND',
      message: 'Lote não encontrado.',
    });
  },

  notStarted(startsAt: Date): BidRejectionException {
    return new BidRejectionException({
      code: 'AUCTION_NOT_STARTED',
      message: `Este lote ainda não iniciou. A disputa abre em ${startsAt.toISOString()}.`,
    });
  },

  ended(endsAt: Date): BidRejectionException {
    return new BidRejectionException({
      code: 'AUCTION_ENDED',
      message: `Este lote já foi encerrado em ${endsAt.toISOString()} e não aceita mais lances.`,
    });
  },

  notLive(): BidRejectionException {
    return new BidRejectionException({
      code: 'AUCTION_NOT_LIVE',
      message: 'Este lote não está aberto para lances no momento.',
    });
  },

  invalidRole(): ForbiddenException {
    return new ForbiddenException({
      code: 'INVALID_ROLE',
      message:
        'Somente licitantes podem dar lances. Leiloeiros administram lotes e não disputam.',
    });
  },

  sellerCannotBid(): ForbiddenException {
    return new ForbiddenException({
      code: 'SELLER_CANNOT_BID',
      message: 'Você não pode dar lances no seu próprio lote.',
    });
  },

  alreadyLeading(currentPriceCents: number): BidRejectionException {
    return new BidRejectionException({
      code: 'ALREADY_LEADING',
      message: `Você já é o líder deste lote com o lance de ${formatBRL(currentPriceCents)}. Não é possível cobrir o próprio lance.`,
      minimumCents: currentPriceCents,
    });
  },

  belowMinimum(
    minimumCents: number,
    requestedCents: number,
  ): BidRejectionException {
    return new BidRejectionException({
      code: 'BELOW_MINIMUM',
      message: `Lance abaixo do mínimo. O próximo lance aceito é de ${formatBRL(minimumCents)} ou mais (você enviou ${formatBRL(requestedCents)}).`,
      minimumCents,
      requestedCents,
    });
  },

  insufficientFunds(
    availableCents: number,
    requestedCents: number,
  ): BidRejectionException {
    return new BidRejectionException({
      code: 'INSUFFICIENT_FUNDS',
      message: `Saldo insuficiente. Você tem ${formatBRL(availableCents)} disponíveis e o lance exige ${formatBRL(requestedCents)}. Deposite mais ou reduza o valor.`,
      availableCents,
      requestedCents,
    });
  },

  reservationInconsistent(): BidRejectionException {
    return new BidRejectionException({
      code: 'RESERVATION_INCONSISTENT',
      message:
        'Este lote está com reservas de saldo inconsistentes. Tente novamente em instantes.',
    });
  },

  concurrencyConflict(): BidRejectionException {
    return new BidRejectionException({
      code: 'CONCURRENCY_CONFLICT',
      message:
        'Outro licitante enviou um lance no mesmo instante. Atualize a página e tente novamente.',
    });
  },

  idempotencyKeyReused(): BidRejectionException {
    return new BidRejectionException({
      code: 'IDEMPOTENCY_KEY_REUSED',
      message:
        'Esta chave de idempotência já foi usada em outra solicitação de lance.',
    });
  },

  idempotencyPending(): BidRejectionException {
    return new BidRejectionException({
      code: 'IDEMPOTENCY_PENDING',
      message:
        'A solicitação anterior com esta chave ainda está sendo processada.',
    });
  },
};
