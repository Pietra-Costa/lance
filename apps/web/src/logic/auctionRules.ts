/**
 * Core business rules and pure logic for Lance — Casa de Leilões
 * Adheres strictly to the architectural and domain rules defined in:
 * Lance_Arquitetura_Decisoes_Estruturais_38f48dbf.pdf
 * Lance_Brand_Copy_System_Design_Premium_cb725681.pdf
 */

import { Lot, User, Wallet } from '../types/auction';

/**
 * Calculates the next minimum required bid in cents.
 * If no bids have been placed yet, minimum is the starting price.
 * If bids exist, minimum is currentBid + minIncrement.
 */
export function calculateNextMinimumBid(lot: {
  currentBidCents: number;
  startingPriceCents: number;
  minIncrementCents: number;
  bidCount: number;
}): number {
  if (lot.bidCount === 0) {
    return lot.startingPriceCents;
  }
  return lot.currentBidCents + lot.minIncrementCents;
}

export interface BidValidationResult {
  allowed: boolean;
  code?:
    | 'INVALID_ROLE'
    | 'AUCTION_NOT_LIVE'
    | 'AUCTION_EXPIRED'
    | 'ALREADY_LEADING'
    | 'BELOW_MINIMUM'
    | 'INSUFFICIENT_FUNDS';
  reason?: string;
  nextMinimumCents?: number;
}

/**
 * Validates whether a bid can be placed according to domain rules.
 */
export function validateBidSubmission(
  lot: Pick<Lot, 'status' | 'startsAt' | 'endsAt' | 'currentLeaderBidderId' | 'currentBidCents' | 'startingPriceCents' | 'minIncrementCents' | 'bidCount'>,
  bidder: Pick<User, 'id' | 'role'>,
  offerAmountCents: number,
  wallet: Pick<Wallet, 'availableCents'>,
  currentTimeMs: number = Date.now()
): BidValidationResult {
  // Rule: Exclusivity of roles. Auctioneers cannot bid.
  if (bidder.role !== 'LICITANTE') {
    return {
      allowed: false,
      code: 'INVALID_ROLE',
      reason: 'Apenas usuários com papel Licitante podem realizar lances.',
    };
  }

  // Rule: Auction must be actively in LIVE status
  if (lot.status !== 'LIVE') {
    return {
      allowed: false,
      code: 'AUCTION_NOT_LIVE',
      reason:
        lot.status === 'SCHEDULED'
          ? 'Este lote ainda não foi iniciado para disputa.'
          : 'Este lote já se encontra encerrado para lances.',
    };
  }

  // Rule: Time boundary check
  const endsAtMs = new Date(lot.endsAt).getTime();
  if (currentTimeMs >= endsAtMs) {
    return {
      allowed: false,
      code: 'AUCTION_EXPIRED',
      reason: 'O prazo do leilão foi atingido e o lote está em fase de encerramento.',
    };
  }

  // Rule: A leader cannot outbid themselves
  if (lot.currentLeaderBidderId === bidder.id) {
    return {
      allowed: false,
      code: 'ALREADY_LEADING',
      reason: 'Você já possui o lance mais alto e está liderando este lote.',
    };
  }

  // Rule: Price and minimum increment check
  const nextMin = calculateNextMinimumBid(lot);
  if (offerAmountCents < nextMin) {
    return {
      allowed: false,
      code: 'BELOW_MINIMUM',
      nextMinimumCents: nextMin,
      reason: `Seu lance de ${formatBRL(offerAmountCents)} está abaixo do mínimo exigido (${formatBRL(nextMin)}).`,
    };
  }

  // Rule: Financial invariant - available balance must cover full bid amount
  if (wallet.availableCents < offerAmountCents) {
    return {
      allowed: false,
      code: 'INSUFFICIENT_FUNDS',
      reason: `Saldo disponível insuficiente (${formatBRL(wallet.availableCents)}). Necessário ${formatBRL(offerAmountCents)} para reserva.`,
    };
  }

  return { allowed: true };
}

/**
 * Anti-sniping calculation.
 * If a valid bid arrives within the last 2 minutes (120,000ms),
 * the auction end time is extended to bidTimestamp + 2 minutes.
 */
export function evaluateAntiSniping(
  currentEndsAtISO: string,
  bidTimeMs: number = Date.now(),
  windowMs = 120000,
  extensionDurationMs = 120000
): { extended: boolean; newEndsAtISO: string; secondsAdded: number } {
  const currentEndsAtMs = new Date(currentEndsAtISO).getTime();
  const timeRemainingMs = currentEndsAtMs - bidTimeMs;

  if (timeRemainingMs > 0 && timeRemainingMs <= windowMs) {
    const extendedMs = bidTimeMs + extensionDurationMs;
    // Only extend if it actually pushes beyond current end
    if (extendedMs > currentEndsAtMs) {
      return {
        extended: true,
        newEndsAtISO: new Date(extendedMs).toISOString(),
        secondsAdded: Math.round((extendedMs - currentEndsAtMs) / 1000),
      };
    }
  }

  return {
    extended: false,
    newEndsAtISO: currentEndsAtISO,
    secondsAdded: 0,
  };
}

/**
 * Generates a stable anonymized pseudonym per bidder and lot
 * Format: "Licitante •••• 4821"
 * Never exposes user real name, email, or database ID publicly.
 */
export function generateAnonymousPseudonym(userId: string, lotId: string): string {
  let hash = 0;
  const combined = `${userId}:${lotId}:lance_salt_2026`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const positive = Math.abs(hash);
  const suffix = (1000 + (positive % 9000)).toString();
  return `Licitante •••• ${suffix}`;
}

/**
 * Calculates a deterministic SHA-256 style hex hash simulation
 * for chained audit log records.
 */
export function computeAuditRecordHash(
  prevHash: string,
  sequence: number,
  eventType: string,
  timestamp: string,
  payload: Record<string, any>
): string {
  const serialized = JSON.stringify({
    seq: sequence,
    prev: prevHash,
    type: eventType,
    ts: timestamp,
    data: payload,
  });

  // Pure deterministic 64-char hex hash generator
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < serialized.length; i++) {
    const ch = serialized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hexPart1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hexPart2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hexPart3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');
  const hexPart4 = ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
  const prefix = (prevHash || '00000000').slice(0, 16);
  const full = `${prefix}${hexPart1}${hexPart2}${hexPart3}${hexPart4}`.slice(0, 64);
  return full.padEnd(64, 'a');
}

/**
 * Formats a value in cents into Brazilian Real (BRL)
 * Example: 150000 -> "R$ 1.500,00"
 */
export function formatBRL(cents: number): string {
  const value = (cents || 0) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats an ISO date into Brazilian standard date/time
 * Example: "24/10/2026 às 16:30"
 */
export function formatDateTimeBR(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Data a definir';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', ' às');
  } catch {
    return 'Data a definir';
  }
}
