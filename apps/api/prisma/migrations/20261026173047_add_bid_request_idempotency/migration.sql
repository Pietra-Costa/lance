-- CreateTable
CREATE TABLE "BidRequest" (
    "id" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "bidId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BidRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BidRequest_bidId_key" ON "BidRequest"("bidId");

-- CreateIndex
CREATE INDEX "BidRequest_lotId_createdAt_idx" ON "BidRequest"("lotId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BidRequest_bidderId_idempotencyKey_key" ON "BidRequest"("bidderId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "BidRequest" ADD CONSTRAINT "BidRequest_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidRequest" ADD CONSTRAINT "BidRequest_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidRequest" ADD CONSTRAINT "BidRequest_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
