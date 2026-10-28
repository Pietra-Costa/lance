import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { SellerAgreementModal } from "../components/domain/SellerAgreementModal";
import { LotStatusBadge } from "../components/domain/LotStatusBadge";
import { formatBRL, formatDateTimeBR } from "../logic/auctionRules";
import {
  Layers,
  PlusCircle,
  Gavel,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  FileText,
  Filter,
} from "lucide-react";

export const AuctioneerArea: React.FC = () => {
  const {
    currentUser,
    currentRole,
    sellerAgreement,
    lots,
    navigateTo,
    publishLot,
    cancelLot,
  } = useApp();

  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("ALL");
  const [cancelModalLotId, setCancelModalLotId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState<string>("");

  // Enforce Seller Agreement check
  const isAgreementSigned = !!sellerAgreement;

  // Filter lots
  const filteredLots = lots.filter(lot => {
    if (selectedStatusFilter === "ALL") return true;
    return lot.status === selectedStatusFilter;
  });

  const liveCount = lots.filter(l => l.status === "LIVE").length;
  const scheduledCount = lots.filter(l => l.status === "SCHEDULED").length;
  const endedCount = lots.filter(l => l.status === "ENDED").length;
  const totalRaisedCents = lots.reduce(
    (acc, l) => acc + (l.status === "ENDED" ? l.currentBidCents : 0),
    0,
  );

  const handleConfirmCancel = () => {
    if (cancelModalLotId && cancellationReason.trim()) {
      cancelLot(cancelModalLotId, cancellationReason.trim());
      setCancelModalLotId(null);
      setCancellationReason("");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* If seller agreement not signed, block with modal */}
      {!isAgreementSigned && <SellerAgreementModal />}

      {/* Header Bar */}
      <div className="bg-[#0A2B22] text-[#F5F1E7] rounded-2xl p-6 sm:p-8 border border-[#123D2F] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-[#123D2F] text-[#C8A96A] border border-[#C8A96A]/30">
              PAINEL OPERACIONAL
            </span>
            <span className="text-xs text-[#F5F1E7]/60">
              Leiloeiro autenticado
            </span>
          </div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
            {currentUser?.name || "Leiloeiro autenticado"}
          </h1>
          <p className="text-xs text-[#F5F1E7]/70">
            Condução de pregões, gestão de lotes e importação de acervos
            culturais.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo("/leiloeiro/lotes/novo")}
            className="px-5 py-3 rounded-xl bg-[#C8A96A] hover:bg-[#C8A96A]/90 text-[#0A2B22] font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Criar Novo Lote</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2DDD2] shadow-2xs space-y-1">
          <span className="text-[11px] text-[#68716A] block">
            Lotes em Pregão (Ao Vivo)
          </span>
          <p className="font-heading font-bold text-2xl text-[#1E7E34]">
            {liveCount}
          </p>
          <span className="text-[10px] text-[#68716A]">
            Recebendo lances concorrentes
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2DDD2] shadow-2xs space-y-1">
          <span className="text-[11px] text-[#68716A] block">
            Lotes Agendados
          </span>
          <p className="font-heading font-bold text-2xl text-[#B45309]">
            {scheduledCount}
          </p>
          <span className="text-[10px] text-[#68716A]">Início programado</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2DDD2] shadow-2xs space-y-1">
          <span className="text-[11px] text-[#68716A] block">
            Lotes Encerrados
          </span>
          <p className="font-heading font-bold text-2xl text-[#123D2F]">
            {endedCount}
          </p>
          <span className="text-[10px] text-[#68716A]">
            Comprovantes homologados
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2DDD2] shadow-2xs space-y-1">
          <span className="text-[11px] text-[#68716A] block">
            Volume Arrematado
          </span>
          <p className="font-heading font-bold text-2xl text-[#123D2F]">
            {formatBRL(totalRaisedCents)}
          </p>
          <span className="text-[10px] text-[#68716A]">
            Liquidações concluídas
          </span>
        </div>
      </div>

      {/* Lot Management Table */}
      <div className="bg-white rounded-2xl border border-[#E2DDD2] shadow-xs overflow-hidden space-y-4">
        <div className="p-6 border-b border-[#E2DDD2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-lg text-[#123D2F]">
              Gestão Geral de Lotes do Leiloeiro
            </h3>
            <p className="text-xs text-[#68716A] mt-0.5">
              Visualize estados, acompanhe lances líderes e controle o ciclo de
              vida de cada lote.
            </p>
          </div>

          {/* Status Filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs bg-[#FAF7F2] p-1 rounded-xl border border-[#E2DDD2] max-w-full">
            {["ALL", "LIVE", "SCHEDULED", "ENDED", "CANCELED"].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                  selectedStatusFilter === st
                    ? "bg-[#123D2F] text-[#F5F1E7] font-semibold"
                    : "text-[#68716A] hover:text-[#222923]"
                }`}
              >
                {st === "ALL"
                  ? "Todos"
                  : st === "LIVE"
                    ? "Ao vivo"
                    : st === "SCHEDULED"
                      ? "Em breve"
                      : st === "ENDED"
                        ? "Encerrados"
                        : "Cancelados"}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Card View (block sm:hidden) */}
        <div className="block sm:hidden divide-y divide-[#E2DDD2]">
          {filteredLots.map(lot => (
            <div key={lot.id} className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={lot.itemSnapshot.primaryImageUrl}
                  alt={lot.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] text-[#123D2F] font-bold">
                      {lot.code}
                    </span>
                    <LotStatusBadge status={lot.status} size="sm" />
                  </div>
                  <h4 className="font-heading font-semibold text-xs text-[#222923] mt-0.5 line-clamp-1">
                    {lot.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[#68716A]">
                    <span className="px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#E2DDD2]">
                      {lot.itemSnapshot.source}
                    </span>
                    <span>{lot.category}</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2] space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#68716A] text-[11px]">
                    Lance Atual:
                  </span>
                  <span className="font-mono font-bold text-[#123D2F]">
                    {formatBRL(lot.currentBidCents || lot.startingPriceCents)}
                    <span className="text-[10px] font-normal text-[#68716A] ml-1">
                      ({lot.bidCount} {lot.bidCount === 1 ? "lance" : "lances"})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-[#68716A]">Líder:</span>
                  <span className="font-mono text-[#123D2F]">
                    {lot.currentLeaderPseudonym || "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => navigateTo(`/lotes/${lot.id}`)}
                  className="flex-1 py-2 rounded-lg border border-[#CDC5B4] text-[#222923] hover:bg-[#FAF7F2] transition-colors cursor-pointer text-xs font-medium text-center"
                >
                  Ver Sala
                </button>

                {lot.status === "SCHEDULED" && (
                  <button
                    onClick={() => publishLot(lot.id)}
                    className="flex-1 py-2 rounded-lg bg-[#123D2F] text-white hover:bg-[#0A2B22] transition-colors cursor-pointer text-xs font-semibold text-center"
                  >
                    Abrir ao Vivo
                  </button>
                )}

                {lot.status === "LIVE" && (
                  <button
                    onClick={() => setCancelModalLotId(lot.id)}
                    className="py-2 px-3 rounded-lg border border-[#B91C1C]/40 text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors cursor-pointer text-xs"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-[#68716A] font-medium border-b border-[#E2DDD2]">
              <tr>
                <th className="py-3 px-4">Lote & Item</th>
                <th className="py-3 px-4">Fonte Externa</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Lance Inicial</th>
                <th className="py-3 px-4">Lance Atual</th>
                <th className="py-3 px-4">Líder Atual</th>
                <th className="py-3 px-4 text-right">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DDD2]">
              {filteredLots.map(lot => (
                <tr
                  key={lot.id}
                  className="hover:bg-[#FAF7F2]/60 transition-colors"
                >
                  <td className="py-4 px-4 flex items-center gap-3">
                    <img
                      src={lot.itemSnapshot.primaryImageUrl}
                      alt={lot.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-[#123D2F] font-bold block">
                        {lot.code}
                      </span>
                      <h4 className="font-heading font-semibold text-xs text-[#222923] truncate max-w-xs">
                        {lot.title}
                      </h4>
                      <span className="text-[10px] text-[#68716A]">
                        {lot.category}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-[#68716A]">
                    <span className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E2DDD2] text-[10px] font-medium">
                      {lot.itemSnapshot.source}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <LotStatusBadge status={lot.status} size="sm" />
                  </td>

                  <td className="py-4 px-4 font-mono text-[#68716A]">
                    {formatBRL(lot.startingPriceCents)}
                  </td>

                  <td className="py-4 px-4 font-mono font-bold text-[#123D2F]">
                    {formatBRL(lot.currentBidCents || lot.startingPriceCents)}
                    <span className="text-[10px] text-[#68716A] block font-sans font-normal">
                      ({lot.bidCount} {lot.bidCount === 1 ? "lance" : "lances"})
                    </span>
                  </td>

                  <td className="py-4 px-4 font-mono text-xs">
                    {lot.currentLeaderPseudonym ? (
                      <span className="text-[#123D2F] font-semibold">
                        {lot.currentLeaderPseudonym}
                      </span>
                    ) : (
                      <span className="text-[#68716A]">—</span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => navigateTo(`/lotes/${lot.id}`)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#CDC5B4] text-[#222923] hover:bg-[#FAF7F2] transition-colors cursor-pointer text-[11px]"
                      title="Abrir sala de lances pública"
                    >
                      Ver Sala
                    </button>

                    {lot.status === "SCHEDULED" && (
                      <button
                        onClick={() => publishLot(lot.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#123D2F] text-white hover:bg-[#0A2B22] transition-colors cursor-pointer text-[11px] font-semibold"
                        title="Abrir pregão imediatamente"
                      >
                        Abrir ao Vivo
                      </button>
                    )}

                    {lot.status === "LIVE" && (
                      <button
                        onClick={() => setCancelModalLotId(lot.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#B91C1C]/40 text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors cursor-pointer text-[11px]"
                        title="Cancelar lote com justificativa formal"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation Modal */}
      {cancelModalLotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2DDD2] shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-[#B91C1C]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-heading font-bold text-base">
                Cancelar Lote em Andamento
              </h3>
            </div>
            <p className="text-xs text-[#68716A] leading-relaxed">
              Conforme a arquitetura da plataforma Lance, o cancelamento de um
              lote ao vivo que já recebeu lances exige justificativa formal. As
              reservas dos licitantes serão liberadas imediatamente e o evento
              será registrado na cadeia de auditoria.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#222923] block">
                Motivo / Justificativa Oficial do Cancelamento
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                placeholder="Ex.: Solicitação judicial do proprietário original ou inconsistência cadastral."
                className="w-full p-2.5 rounded-xl border border-[#CDC5B4] text-xs focus:ring-1 focus:ring-[#B91C1C]"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCancelModalLotId(null)}
                className="px-4 py-2 rounded-xl border border-[#CDC5B4] text-xs text-[#68716A] hover:bg-[#FAF7F2] cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={!cancellationReason.trim()}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-[#B91C1C] text-white text-xs font-semibold hover:bg-[#991B1B] disabled:opacity-40 cursor-pointer"
              >
                Confirmar Cancelamento e Liberar Reservas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
