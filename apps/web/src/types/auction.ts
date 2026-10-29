export type UserRole = "LICITANTE" | "LEILOEIRO";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  publicPseudonym: string;
  avatarUrl?: string;
  agreementAcceptedAt?: string;
}

export interface SellerAgreement {
  userId: string;
  version: string;
  title: string;
  acceptedAt: string;
  contentHash: string;
}

export type WalletTransactionType =
  | "DEPOSIT"
  | "WINNER_DEBIT"
  | "SELLER_CREDIT"
  | "RESERVATION_HOLD"
  | "RESERVATION_RELEASE";

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amountCents: number;
  description: string;
  referenceId: string;
  idempotencyKey: string;
  createdAt: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
}

export interface Wallet {
  userId: string;
  balanceCents: number; // total materializado
  reservedCents: number; // valor comprometido no maior lance ativo
  availableCents: number; // balanceCents - reservedCents
}

export interface BidReservation {
  id: string;
  lotId: string;
  userId: string;
  amountCents: number;
  status: "ACTIVE" | "RELEASED" | "CONSUMED";
  createdAt: string;
  updatedAt: string;
}

export type CatalogSource =
  "The Met Collection" | "Art Institute of Chicago" | "MusicBrainz & Cover Art";

export interface CatalogItem {
  source: CatalogSource;
  externalId: string;
  title: string;
  creator: string;
  dateOrYear: string;
  /** Categoria do lote. Vazia quando o leiloeiro não classificou. */
  category:
    | "Arte"
    | "Esculturas"
    | "Objetos de coleção"
    | "Mobiliário"
    | "Discos e edições musicais"
    | "";
  medium: string;
  dimensions: string;
  description: string;
  primaryImageUrl: string;
  additionalImages: string[];
  licenseNotes: string;
  sourceUrl: string;
}

export type LotStatus = "SCHEDULED" | "LIVE" | "ENDED" | "CANCELED";

export interface Lot {
  id: string;
  code: string; // e.g. LANCE-2026-042
  title: string;
  /** Categoria do lote. Vazia quando o leiloeiro não classificou. */
  category:
    | "Arte"
    | "Esculturas"
    | "Objetos de coleção"
    | "Mobiliário"
    | "Discos e edições musicais"
    | "";
  itemSnapshot: CatalogItem;
  startingPriceCents: number;
  currentBidCents: number;
  minIncrementCents: number;
  status: LotStatus;
  startsAt: string;
  endsAt: string;
  currentLeaderBidderId?: string;
  currentLeaderPseudonym?: string;
  sellerId: string;
  sellerName?: string;
  winnerId?: string;
  bidCount: number;
  cancellationReason?: string;
  featured?: boolean;
  specialConditions?: string | null;
  sellerNotes?: string | null;
  settlement?: {
    id: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    amountCents: number;
    settledAt: string | null;
  } | null;
}

export interface Bid {
  id: string;
  lotId: string;
  bidderId: string;
  pseudonym: string;
  amountCents: number;
  createdAt: string;
  status: "ACCEPTED" | "OUTBID" | "WON" | "REJECTED";
}

export interface AuctionSettlement {
  id: string;
  lotId: string;
  winnerId: string;
  sellerId: string;
  finalPriceCents: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  settledAt: string;
  receiptId?: string;
}

export interface Receipt {
  id: string;
  settlementId: string;
  lotCode: string;
  lotTitle: string;
  lotCategory: string;
  itemImageUrl: string;
  winnerPseudonym: string;
  winnerName: string;
  sellerName: string;
  finalPriceCents: number;
  closedAt: string;
  verificationCode: string;
}

export interface AuditEvent {
  sequence: number;
  eventType:
    | "LOT_CREATED"
    | "LOT_LIVE"
    | "BID_ACCEPTED"
    | "BID_PLACED"
    | "AUCTION_ENDED"
    | "AUCTION_WON"
    | "LOT_CANCELED"
    | "RESERVATION_ACTIVE"
    | "RESERVATION_RELEASED"
    | "AUCTION_SETTLED"
    | "SETTLEMENT_COMPLETED"
    | "SELLER_AGREEMENT_ACCEPTED"
    | "CHECKPOINT";
  lotId?: string;
  lotCode?: string;
  description: string;
  payloadSummary: Record<string, unknown>;
  timestamp: string;
  prevHash: string;
  hash: string;
}
