/*
  Warnings:

  - The values [CAPTURED] on the enum `BidReservationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [DRAFT,OPEN,CLOSED,SETTLED,CANCELLED] on the enum `LotStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `endAt` on the `Lot` table. All the data in the column will be lost.
  - You are about to drop the column `startAt` on the `Lot` table. All the data in the column will be lost.
  - You are about to drop the column `transactions` on the `Wallet` table. All the data in the column will be lost.
  - You are about to drop the column `dempotencyKey` on the `WalletTransaction` table. All the data in the column will be lost.
  - You are about to drop the `PurchaseReceipt` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sequence]` on the table `AuditEvent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `WalletTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endsAt` to the `Lot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startsAt` to the `Lot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idempotencyKey` to the `WalletTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BidReservationStatus_new" AS ENUM ('ACTIVE', 'RELEASED', 'CONSUMED');
ALTER TABLE "public"."BidReservation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "BidReservation" ALTER COLUMN "status" TYPE "BidReservationStatus_new" USING ("status"::text::"BidReservationStatus_new");
ALTER TYPE "BidReservationStatus" RENAME TO "BidReservationStatus_old";
ALTER TYPE "BidReservationStatus_new" RENAME TO "BidReservationStatus";
DROP TYPE "public"."BidReservationStatus_old";
ALTER TABLE "BidReservation" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LotStatus_new" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELED');
ALTER TABLE "public"."Lot" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Lot" ALTER COLUMN "status" TYPE "LotStatus_new" USING ("status"::text::"LotStatus_new");
ALTER TYPE "LotStatus" RENAME TO "LotStatus_old";
ALTER TYPE "LotStatus_new" RENAME TO "LotStatus";
DROP TYPE "public"."LotStatus_old";
ALTER TABLE "Lot" ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';
COMMIT;

-- AlterEnum
ALTER TYPE "SettlementStatus" ADD VALUE 'PROCESSING';

-- DropForeignKey
ALTER TABLE "PurchaseReceipt" DROP CONSTRAINT "PurchaseReceipt_settlementId_fkey";

-- DropIndex
DROP INDEX "Lot_status_startAt_endAt_idx";

-- DropIndex
DROP INDEX "WalletTransaction_dempotencyKey_key";

-- DropIndex
DROP INDEX "WalletTransaction_walletId_key";

-- AlterTable
ALTER TABLE "AuditEvent" ADD COLUMN     "sequence" BIGSERIAL NOT NULL;

-- AlterTable
ALTER TABLE "Lot" DROP COLUMN "endAt",
DROP COLUMN "startAt",
ADD COLUMN     "currentLeaderId" TEXT,
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "LotItemSnapshot" ADD COLUMN     "imageAttribution" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "transactions";

-- AlterTable
ALTER TABLE "WalletTransaction" DROP COLUMN "dempotencyKey",
ADD COLUMN     "idempotencyKey" TEXT NOT NULL;

-- DropTable
DROP TABLE "PurchaseReceipt";

-- CreateTable
CREATE TABLE "SellerAgreement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditChainState" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "lastSequence" BIGINT NOT NULL DEFAULT 0,
    "lastEventHash" TEXT,
    "checkpointHash" TEXT,
    "signature" TEXT,
    "anchoredAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditChainState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "lastError" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SellerAgreement_userId_acceptedAt_idx" ON "SellerAgreement"("userId", "acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerAgreement_userId_version_key" ON "SellerAgreement"("userId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_settlementId_key" ON "Receipt"("settlementId");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_verificationCode_key" ON "Receipt"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_eventKey_key" ON "OutboxEvent"("eventKey");

-- CreateIndex
CREATE INDEX "OutboxEvent_publishedAt_createdAt_idx" ON "OutboxEvent"("publishedAt", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_idx" ON "OutboxEvent"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuditEvent_sequence_key" ON "AuditEvent"("sequence");

-- CreateIndex
CREATE INDEX "CatalogItem_category_idx" ON "CatalogItem"("category");

-- CreateIndex
CREATE INDEX "Lot_status_startsAt_endsAt_idx" ON "Lot"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Lot_currentLeaderId_idx" ON "Lot"("currentLeaderId");

-- CreateIndex
CREATE INDEX "LotItemSnapshot_catalogItemId_idx" ON "LotItemSnapshot"("catalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_idempotencyKey_key" ON "WalletTransaction"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "SellerAgreement" ADD CONSTRAINT "SellerAgreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_currentLeaderId_fkey" FOREIGN KEY ("currentLeaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "AuctionSettlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
