import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNextMinimumBid,
  validateBidSubmission,
  evaluateAntiSniping,
  generateAnonymousPseudonym,
  computeAuditRecordHash,
  formatBRL,
} from './auctionRules';

test('calculateNextMinimumBid returns starting price when no bids exist', () => {
  const lot = {
    currentBidCents: 0,
    startingPriceCents: 50000, // R$ 500,00
    minIncrementCents: 2500, // R$ 25,00
    bidCount: 0,
  };
  assert.equal(calculateNextMinimumBid(lot), 50000);
});

test('calculateNextMinimumBid returns current bid + increment when bids exist', () => {
  const lot = {
    currentBidCents: 75000, // R$ 750,00
    startingPriceCents: 50000,
    minIncrementCents: 5000, // R$ 50,00
    bidCount: 3,
  };
  assert.equal(calculateNextMinimumBid(lot), 80000);
});

test('validateBidSubmission rejects if user is not a LICITANTE (auctioneer exclusivity)', () => {
  const lot = {
    status: 'LIVE' as const,
    startsAt: '2026-10-24T10:00:00Z',
    endsAt: '2026-10-24T20:00:00Z',
    currentLeaderBidderId: 'other-user',
    currentBidCents: 10000,
    startingPriceCents: 5000,
    minIncrementCents: 1000,
    bidCount: 1,
  };
  const bidder = { id: 'leiloeiro-1', role: 'LEILOEIRO' as const };
  const wallet = { availableCents: 100000 };

  const result = validateBidSubmission(lot, bidder, 15000, wallet, Date.parse('2026-10-24T12:00:00Z'));
  assert.equal(result.allowed, false);
  assert.equal(result.code, 'INVALID_ROLE');
});

test('validateBidSubmission rejects if auction is not LIVE', () => {
  const lot = {
    status: 'SCHEDULED' as const,
    startsAt: '2026-10-25T10:00:00Z',
    endsAt: '2026-10-25T20:00:00Z',
    currentLeaderBidderId: undefined,
    currentBidCents: 0,
    startingPriceCents: 10000,
    minIncrementCents: 1000,
    bidCount: 0,
  };
  const bidder = { id: 'licitante-1', role: 'LICITANTE' as const };
  const wallet = { availableCents: 50000 };

  const result = validateBidSubmission(lot, bidder, 10000, wallet, Date.parse('2026-10-24T12:00:00Z'));
  assert.equal(result.allowed, false);
  assert.equal(result.code, 'AUCTION_NOT_LIVE');
});

test('validateBidSubmission rejects if user is already leading', () => {
  const lot = {
    status: 'LIVE' as const,
    startsAt: '2026-10-24T10:00:00Z',
    endsAt: '2026-10-24T20:00:00Z',
    currentLeaderBidderId: 'licitante-1',
    currentBidCents: 20000,
    startingPriceCents: 10000,
    minIncrementCents: 1000,
    bidCount: 2,
  };
  const bidder = { id: 'licitante-1', role: 'LICITANTE' as const };
  const wallet = { availableCents: 100000 };

  const result = validateBidSubmission(lot, bidder, 25000, wallet, Date.parse('2026-10-24T12:00:00Z'));
  assert.equal(result.allowed, false);
  assert.equal(result.code, 'ALREADY_LEADING');
});

test('validateBidSubmission rejects bid below required increment', () => {
  const lot = {
    status: 'LIVE' as const,
    startsAt: '2026-10-24T10:00:00Z',
    endsAt: '2026-10-24T20:00:00Z',
    currentLeaderBidderId: 'other-user',
    currentBidCents: 20000,
    startingPriceCents: 10000,
    minIncrementCents: 2000, // next minimum is 22000
    bidCount: 2,
  };
  const bidder = { id: 'licitante-1', role: 'LICITANTE' as const };
  const wallet = { availableCents: 100000 };

  const result = validateBidSubmission(lot, bidder, 21000, wallet, Date.parse('2026-10-24T12:00:00Z'));
  assert.equal(result.allowed, false);
  assert.equal(result.code, 'BELOW_MINIMUM');
  assert.equal(result.nextMinimumCents, 22000);
});

test('validateBidSubmission rejects if wallet available balance cannot cover full bid', () => {
  const lot = {
    status: 'LIVE' as const,
    startsAt: '2026-10-24T10:00:00Z',
    endsAt: '2026-10-24T20:00:00Z',
    currentLeaderBidderId: 'other-user',
    currentBidCents: 20000,
    startingPriceCents: 10000,
    minIncrementCents: 2000,
    bidCount: 2,
  };
  const bidder = { id: 'licitante-1', role: 'LICITANTE' as const };
  const wallet = { availableCents: 15000 }; // Only R$ 150 available

  const result = validateBidSubmission(lot, bidder, 22000, wallet, Date.parse('2026-10-24T12:00:00Z'));
  assert.equal(result.allowed, false);
  assert.equal(result.code, 'INSUFFICIENT_FUNDS');
});

test('validateBidSubmission accepts valid bid with sufficient balance', () => {
  const lot = {
    status: 'LIVE' as const,
    startsAt: '2026-10-24T10:00:00Z',
    endsAt: '2026-10-24T20:00:00Z',
    currentLeaderBidderId: 'other-user',
    currentBidCents: 20000,
    startingPriceCents: 10000,
    minIncrementCents: 2000,
    bidCount: 2,
  };
  const bidder = { id: 'licitante-1', role: 'LICITANTE' as const };
  const wallet = { availableCents: 50000 };

  const result = validateBidSubmission(lot, bidder, 25000, wallet, Date.parse('2026-10-24T12:00:00Z'));
  assert.equal(result.allowed, true);
});

test('evaluateAntiSniping extends deadline by 2 minutes when bid in final 2 minutes', () => {
  const endsAtISO = '2026-10-24T15:00:00.000Z';
  const bidTimeMs = new Date('2026-10-24T14:58:30.000Z').getTime(); // 90 seconds before end

  const antiSniping = evaluateAntiSniping(endsAtISO, bidTimeMs, 120000, 120000);
  assert.equal(antiSniping.extended, true);
  // Extended to bid time + 2 minutes = 15:00:30.000Z
  assert.equal(antiSniping.newEndsAtISO, '2026-10-24T15:00:30.000Z');
  assert.equal(antiSniping.secondsAdded, 30);
});

test('evaluateAntiSniping does not extend if more than 2 minutes remain', () => {
  const endsAtISO = '2026-10-24T15:00:00.000Z';
  const bidTimeMs = new Date('2026-10-24T14:50:00.000Z').getTime(); // 10 minutes before end

  const antiSniping = evaluateAntiSniping(endsAtISO, bidTimeMs);
  assert.equal(antiSniping.extended, false);
  assert.equal(antiSniping.newEndsAtISO, endsAtISO);
});

test('generateAnonymousPseudonym produces consistent deterministic anonymized name', () => {
  const p1 = generateAnonymousPseudonym('user-123', 'lot-456');
  const p2 = generateAnonymousPseudonym('user-123', 'lot-456');
  const p3 = generateAnonymousPseudonym('user-999', 'lot-456');

  assert.equal(p1, p2);
  assert.match(p1, /^Licitante •••• \d{4}$/);
  assert.notEqual(p1, p3);
});

test('formatBRL correctly formats cents to Brazilian Real string', () => {
  assert.match(formatBRL(125000), /1\.250,00/);
  assert.match(formatBRL(500), /5,00/);
});

test('computeAuditRecordHash returns deterministic 64-char hex string', () => {
  const hash1 = computeAuditRecordHash('0000000000000000', 1, 'BID_ACCEPTED', '2026-10-24T12:00:00Z', { amountCents: 50000 });
  const hash2 = computeAuditRecordHash('0000000000000000', 1, 'BID_ACCEPTED', '2026-10-24T12:00:00Z', { amountCents: 50000 });
  const hash3 = computeAuditRecordHash(hash1, 2, 'BID_ACCEPTED', '2026-10-24T12:05:00Z', { amountCents: 55000 });

  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64);
  assert.notEqual(hash1, hash3);
});
