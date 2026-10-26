/*
  Warnings:

  - The values [SIMULATED_DEPOSIT,BID_RESERVATION,BID_RELEASE,AUCTION_SETTLEMENT,REFUND] on the enum `WalletTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `referenceId` to the `WalletTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referenceType` to the `WalletTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WalletTransactionType_new" AS ENUM ('DEPOSIT', 'WINNER_DEBIT', 'SELLER_CREDIT');
ALTER TABLE "WalletTransaction" ALTER COLUMN "type" TYPE "WalletTransactionType_new" USING ("type"::text::"WalletTransactionType_new");
ALTER TYPE "WalletTransactionType" RENAME TO "WalletTransactionType_old";
ALTER TYPE "WalletTransactionType_new" RENAME TO "WalletTransactionType";
DROP TYPE "public"."WalletTransactionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "referenceId" TEXT NOT NULL,
ADD COLUMN     "referenceType" TEXT NOT NULL;
