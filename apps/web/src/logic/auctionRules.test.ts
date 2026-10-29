import { describe, expect, it } from "vitest";
import {
  calculateNextMinimumBid,
  validateBidSubmission,
  evaluateAntiSniping,
  generateAnonymousPseudonym,
  formatBRL,
} from "./auctionRules";

it("calculateNextMinimumBid returns starting price when no bids exist", () => {
  const lot = {
    currentBidCents: 0,
    startingPriceCents: 50000, // R$ 500,00
    minIncrementCents: 2500, // R$ 25,00
    bidCount: 0,
  };
  expect(calculateNextMinimumBid(lot)).toBe(50000);
});

it("calculateNextMinimumBid returns current bid + increment when bids exist", () => {
  const lot = {
    currentBidCents: 75000, // R$ 750,00
    startingPriceCents: 50000,
    minIncrementCents: 5000, // R$ 50,00
    bidCount: 3,
  };
  expect(calculateNextMinimumBid(lot)).toBe(80000);
});

it("validateBidSubmission rejects if user is not a LICITANTE (auctioneer exclusivity)", () => {
  const lot = {
    status: "LIVE" as const,
    startsAt: "2026-10-24T10:00:00Z",
    endsAt: "2026-10-24T20:00:00Z",
    currentLeaderBidderId: "other-user",
    currentBidCents: 10000,
    startingPriceCents: 5000,
    minIncrementCents: 1000,
    bidCount: 1,
  };
  const bidder = { id: "leiloeiro-1", role: "LEILOEIRO" as const };
  const wallet = { availableCents: 100000 };

  const result = validateBidSubmission(
    lot,
    bidder,
    15000,
    wallet,
    Date.parse("2026-10-24T12:00:00Z"),
  );
  expect(result.allowed).toBe(false);
  expect(result.code).toBe("INVALID_ROLE");
});

it("validateBidSubmission rejects if auction is not LIVE", () => {
  const lot = {
    status: "SCHEDULED" as const,
    startsAt: "2026-10-25T10:00:00Z",
    endsAt: "2026-10-25T20:00:00Z",
    currentLeaderBidderId: undefined,
    currentBidCents: 0,
    startingPriceCents: 10000,
    minIncrementCents: 1000,
    bidCount: 0,
  };
  const bidder = { id: "licitante-1", role: "LICITANTE" as const };
  const wallet = { availableCents: 50000 };

  const result = validateBidSubmission(
    lot,
    bidder,
    10000,
    wallet,
    Date.parse("2026-10-24T12:00:00Z"),
  );
  expect(result.allowed).toBe(false);
  expect(result.code).toBe("AUCTION_NOT_LIVE");
});

it("validateBidSubmission rejects if user is already leading", () => {
  const lot = {
    status: "LIVE" as const,
    startsAt: "2026-10-24T10:00:00Z",
    endsAt: "2026-10-24T20:00:00Z",
    currentLeaderBidderId: "licitante-1",
    currentBidCents: 20000,
    startingPriceCents: 10000,
    minIncrementCents: 1000,
    bidCount: 2,
  };
  const bidder = { id: "licitante-1", role: "LICITANTE" as const };
  const wallet = { availableCents: 100000 };

  const result = validateBidSubmission(
    lot,
    bidder,
    25000,
    wallet,
    Date.parse("2026-10-24T12:00:00Z"),
  );
  expect(result.allowed).toBe(false);
  expect(result.code).toBe("ALREADY_LEADING");
});

it("validateBidSubmission rejects bid below required increment", () => {
  const lot = {
    status: "LIVE" as const,
    startsAt: "2026-10-24T10:00:00Z",
    endsAt: "2026-10-24T20:00:00Z",
    currentLeaderBidderId: "other-user",
    currentBidCents: 20000,
    startingPriceCents: 10000,
    minIncrementCents: 2000, // next minimum is 22000
    bidCount: 2,
  };
  const bidder = { id: "licitante-1", role: "LICITANTE" as const };
  const wallet = { availableCents: 100000 };

  const result = validateBidSubmission(
    lot,
    bidder,
    21000,
    wallet,
    Date.parse("2026-10-24T12:00:00Z"),
  );
  expect(result.allowed).toBe(false);
  expect(result.code).toBe("BELOW_MINIMUM");
  expect(result.nextMinimumCents).toBe(22000);
});

it("validateBidSubmission rejects if wallet available balance cannot cover full bid", () => {
  const lot = {
    status: "LIVE" as const,
    startsAt: "2026-10-24T10:00:00Z",
    endsAt: "2026-10-24T20:00:00Z",
    currentLeaderBidderId: "other-user",
    currentBidCents: 20000,
    startingPriceCents: 10000,
    minIncrementCents: 2000,
    bidCount: 2,
  };
  const bidder = { id: "licitante-1", role: "LICITANTE" as const };
  const wallet = { availableCents: 15000 }; // Only R$ 150 available

  const result = validateBidSubmission(
    lot,
    bidder,
    22000,
    wallet,
    Date.parse("2026-10-24T12:00:00Z"),
  );
  expect(result.allowed).toBe(false);
  expect(result.code).toBe("INSUFFICIENT_FUNDS");
});

it("validateBidSubmission accepts valid bid with sufficient balance", () => {
  const lot = {
    status: "LIVE" as const,
    startsAt: "2026-10-24T10:00:00Z",
    endsAt: "2026-10-24T20:00:00Z",
    currentLeaderBidderId: "other-user",
    currentBidCents: 20000,
    startingPriceCents: 10000,
    minIncrementCents: 2000,
    bidCount: 2,
  };
  const bidder = { id: "licitante-1", role: "LICITANTE" as const };
  const wallet = { availableCents: 50000 };

  const result = validateBidSubmission(
    lot,
    bidder,
    25000,
    wallet,
    Date.parse("2026-10-24T12:00:00Z"),
  );
  expect(result.allowed).toBe(true);
});

it("evaluateAntiSniping extends deadline by 2 minutes when bid in final 2 minutes", () => {
  const endsAtISO = "2026-10-24T15:00:00.000Z";
  const bidTimeMs = new Date("2026-10-24T14:58:30.000Z").getTime(); // 90 seconds before end

  const antiSniping = evaluateAntiSniping(endsAtISO, bidTimeMs, 120000, 120000);
  expect(antiSniping.extended).toBe(true);
  // Extended to bid time + 2 minutes = 15:00:30.000Z
  expect(antiSniping.newEndsAtISO).toBe("2026-10-24T15:00:30.000Z");
  expect(antiSniping.secondsAdded).toBe(30);
});

it("evaluateAntiSniping does not extend if more than 2 minutes remain", () => {
  const endsAtISO = "2026-10-24T15:00:00.000Z";
  const bidTimeMs = new Date("2026-10-24T14:50:00.000Z").getTime(); // 10 minutes before end

  const antiSniping = evaluateAntiSniping(endsAtISO, bidTimeMs);
  expect(antiSniping.extended).toBe(false);
  expect(antiSniping.newEndsAtISO).toBe(endsAtISO);
});

it("generateAnonymousPseudonym produces consistent deterministic anonymized name", () => {
  const p1 = generateAnonymousPseudonym("user-123", "lot-456");
  const p2 = generateAnonymousPseudonym("user-123", "lot-456");
  const p3 = generateAnonymousPseudonym("user-999", "lot-456");

  expect(p1).toBe(p2);
  expect(p1).toMatch(/^Licitante •••• \d{4}$/);
  expect(p1).not.toBe(p3);
});

it("formatBRL correctly formats cents to Brazilian Real string", () => {
  expect(formatBRL(125000)).toMatch(/1\.250,00/);
  expect(formatBRL(500)).toMatch(/5,00/);
});
