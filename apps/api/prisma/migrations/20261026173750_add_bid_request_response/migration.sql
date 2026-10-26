/*
  Warnings:

  - You are about to drop the column `response` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BidRequest" ADD COLUMN     "response" JSONB;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "response";
