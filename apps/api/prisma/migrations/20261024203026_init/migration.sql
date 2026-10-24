-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('LEILOEIRO', 'LICITANTE');

-- CreateEnum
CREATE TYPE "CatalogSource" AS ENUM ('MET', 'ART_INSTITUTE_CHICAGO', 'MUSICBRAINZ');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImageUsageStatus" AS ENUM ('UNKNOWN', 'ALLOWED', 'RESTRICTED', 'EXTERNAL_ONLY');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('SIMULATED_DEPOSIT', 'BID_RESERVATION', 'BID_RELEASE', 'AUCTION_SETTLEMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "BidReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CAPTURED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balanceCents" INTEGER NOT NULL DEFAULT 0,
    "reservedCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transactions" "WalletTransactionType"[],

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "dempotencyKey" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "source" "CatalogSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "creator" TEXT,
    "sourceUrl" TEXT,
    "attributes" JSONB,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItemImage" (
    "id" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "storageKey" TEXT,
    "usageStatus" "ImageUsageStatus" NOT NULL DEFAULT 'UNKNOWN',
    "attribution" TEXT,
    "rightsNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogItemImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "LotStatus" NOT NULL DEFAULT 'DRAFT',
    "startingPriceCents" INTEGER NOT NULL,
    "currentPriceCents" INTEGER NOT NULL DEFAULT 0,
    "minIncrementCents" INTEGER NOT NULL DEFAULT 1,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotItemSnapshot" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source" "CatalogSource",
    "externalId" TEXT,
    "attributes" JSONB,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotItemSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidReservation" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "BidReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BidReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionSettlement" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "winningBidId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReceipt" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" JSONB NOT NULL,

    CONSTRAINT "PurchaseReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "previousHash" TEXT,
    "eventHash" TEXT NOT NULL,
    "anchorReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_walletId_key" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_dempotencyKey_key" ON "WalletTransaction"("dempotencyKey");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "CatalogItem_title_idx" ON "CatalogItem"("title");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_source_externalId_key" ON "CatalogItem"("source", "externalId");

-- CreateIndex
CREATE INDEX "CatalogItemImage_catalogItemId_idx" ON "CatalogItemImage"("catalogItemId");

-- CreateIndex
CREATE INDEX "Lot_status_startAt_endAt_idx" ON "Lot"("status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "Lot_sellerId_idx" ON "Lot"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "LotItemSnapshot_lotId_key" ON "LotItemSnapshot"("lotId");

-- CreateIndex
CREATE INDEX "Bid_lotId_amountCents_idx" ON "Bid"("lotId", "amountCents");

-- CreateIndex
CREATE INDEX "Bid_bidderId_createdAt_idx" ON "Bid"("bidderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BidReservation_bidId_key" ON "BidReservation"("bidId");

-- CreateIndex
CREATE INDEX "BidReservation_lotId_status_idx" ON "BidReservation"("lotId", "status");

-- CreateIndex
CREATE INDEX "BidReservation_walletId_status_idx" ON "BidReservation"("walletId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionSettlement_lotId_key" ON "AuctionSettlement"("lotId");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionSettlement_winningBidId_key" ON "AuctionSettlement"("winningBidId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReceipt_settlementId_key" ON "PurchaseReceipt"("settlementId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReceipt_receiptNumber_key" ON "PurchaseReceipt"("receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AuditEvent_eventHash_key" ON "AuditEvent"("eventHash");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItemImage" ADD CONSTRAINT "CatalogItemImage_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotItemSnapshot" ADD CONSTRAINT "LotItemSnapshot_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotItemSnapshot" ADD CONSTRAINT "LotItemSnapshot_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidReservation" ADD CONSTRAINT "BidReservation_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidReservation" ADD CONSTRAINT "BidReservation_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidReservation" ADD CONSTRAINT "BidReservation_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionSettlement" ADD CONSTRAINT "AuctionSettlement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionSettlement" ADD CONSTRAINT "AuctionSettlement_winningBidId_fkey" FOREIGN KEY ("winningBidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReceipt" ADD CONSTRAINT "PurchaseReceipt_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "AuctionSettlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
