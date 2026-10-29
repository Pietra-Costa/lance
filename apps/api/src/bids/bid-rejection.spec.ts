import { describe, expect, it } from '@jest/globals';
import {
  BidRejectionException,
  bidRejection,
  formatBRL,
} from './bid-rejection';

/**
 * Cobertura das mensagens de recusa de lance exigidas pelo desafio:
 * "abaixo do mínimo, saldo insuficiente, você já está ganhando,
 *  lote ainda não iniciado ou lote encerrado."
 */
describe('bidRejection', () => {
  const bodyOf = (error: BidRejectionException) =>
    error.getResponse() as Record<string, unknown>;

  it('formata centavos em Real brasileiro', () => {
    expect(formatBRL(10_500)).toBe('R$ 105,00');
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(1_234_567)).toBe('R$ 12.345,67');
  });

  it('recusa lote ainda não iniciado com motivo próprio', () => {
    const startsAt = new Date('2026-11-01T15:00:00.000Z');
    const body = bodyOf(bidRejection.notStarted(startsAt));

    expect(body.code).toBe('AUCTION_NOT_STARTED');
    expect(String(body.message)).toContain('ainda não iniciou');
  });

  it('recusa lote encerrado com motivo próprio', () => {
    const endsAt = new Date('2026-11-01T15:00:00.000Z');
    const body = bodyOf(bidRejection.ended(endsAt));

    expect(body.code).toBe('AUCTION_ENDED');
    expect(String(body.message)).toContain('já foi encerrado');
  });

  it('recusa quando o licitante já é líder', () => {
    const body = bodyOf(bidRejection.alreadyLeading(25_000));

    expect(body.code).toBe('ALREADY_LEADING');
    expect(String(body.message)).toContain('R$ 250,00');
  });

  it('recusa abaixo do mínimo expondo o valor exigido', () => {
    const body = bodyOf(bidRejection.belowMinimum(10_500, 10_000));

    expect(body.code).toBe('BELOW_MINIMUM');
    expect(body.minimumCents).toBe(10_500);
    expect(body.requestedCents).toBe(10_000);
    expect(String(body.message)).toContain('R$ 105,00');
  });

  it('recusa por saldo insuficiente expondo o disponível', () => {
    const body = bodyOf(bidRejection.insufficientFunds(8_000, 10_000));

    expect(body.code).toBe('INSUFFICIENT_FUNDS');
    expect(body.availableCents).toBe(8_000);
    expect(String(body.message)).toContain('R$ 80,00');
    expect(String(body.message)).toContain('R$ 100,00');
  });

  it('cada recusa tem um código distinto e estável', () => {
    const codes = [
      bodyOf(bidRejection.invalidAmount(0)).code,
      bodyOf(bidRejection.lotNotFound()).code,
      bodyOf(bidRejection.notStarted(new Date())).code,
      bodyOf(bidRejection.ended(new Date())).code,
      bodyOf(bidRejection.notLive()).code,
      bodyOf(bidRejection.invalidRole()).code,
      bodyOf(bidRejection.sellerCannotBid()).code,
      bodyOf(bidRejection.alreadyLeading(1)).code,
      bodyOf(bidRejection.belowMinimum(2, 1)).code,
      bodyOf(bidRejection.insufficientFunds(1, 2)).code,
      bodyOf(bidRejection.reservationInconsistent()).code,
      bodyOf(bidRejection.concurrencyConflict()).code,
      bodyOf(bidRejection.idempotencyKeyReused()).code,
      bodyOf(bidRejection.idempotencyPending()).code,
    ];

    expect(new Set(codes).size).toBe(codes.length);
  });
});
