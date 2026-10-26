CREATE UNIQUE INDEX "BidReservation_one_active_per_lot"
ON "BidReservation" ("lotId")
WHERE "status" = 'ACTIVE';