-- Detalhes do item que o leiloeiro pode completar manualmente quando a fonte
-- externa não fornece (ou fornece incompleto). Ficam no snapshot imutável do
-- lote, que é o registro histórico publicado.
ALTER TABLE "LotItemSnapshot" ADD COLUMN "medium" TEXT;
ALTER TABLE "LotItemSnapshot" ADD COLUMN "dimensions" TEXT;
ALTER TABLE "LotItemSnapshot" ADD COLUMN "attribution" TEXT;
ALTER TABLE "LotItemSnapshot" ADD COLUMN "period" TEXT;
ALTER TABLE "LotItemSnapshot" ADD COLUMN "imageConditions" TEXT;
