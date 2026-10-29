-- Categoria do lote: define o agrupamento usado nos filtros do catálogo.
-- Persistida no lote (não no item) porque o leiloeiro pode classificar
-- o mesmo item de formas diferentes em pregões distintos.
ALTER TABLE "Lot" ADD COLUMN "category" TEXT;

-- Condições especiais e observações do leiloeiro, publicadas no lote.
ALTER TABLE "Lot" ADD COLUMN "specialConditions" TEXT;
ALTER TABLE "Lot" ADD COLUMN "sellerNotes" TEXT;

CREATE INDEX "Lot_category_idx" ON "Lot"("category");
