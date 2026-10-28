import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Wallet as WalletIcon,
  Gavel,
  FileCheck,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  User,
  History,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { formatBRL, formatDateTimeBR } from "../logic/auctionRules";
import { LotStatusBadge } from "../components/domain/LotStatusBadge";

export interface BidderAreaProps {
  initialTab?:
    | "dashboard"
    | "lances"
    | "arrematados"
    | "carteira"
    | "transacoes"
    | "perfil";
}

export const BidderArea: React.FC<BidderAreaProps> = ({
  initialTab = "dashboard",
}) => {
  const {
    currentUser,
    wallet,
    transactions,
    receipts,
    lots,
    myBids,
    navigateTo,
    setSelectedReceiptForModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "lances"
    | "arrematados"
    | "carteira"
    | "transacoes"
    | "perfil"
  >(initialTab);

  const myBidsLots = lots.filter(lot =>
    myBids.some(bid => bid.lotId === lot.id),
  );
  const leadingLots = lots.filter(
    lot =>
      lot.status === "LIVE" && lot.currentLeaderBidderId === currentUser?.id,
  );

  const outbidLots = myBidsLots.filter(
    lot =>
      lot.status === "LIVE" && lot.currentLeaderBidderId !== currentUser?.id,
  );

  const wonReceipts = receipts;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Bidder Header */}
      <div className="bg-white rounded-2xl border border-[#E2DDD2] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#123D2F] text-[#F5F1E7] flex items-center justify-center font-bold text-xl overflow-hidden border-2 border-[#C8A96A]/40 shrink-0">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              currentUser?.name.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-2xl text-[#123D2F]">
                {currentUser?.name || "Área do Licitante"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#123D2F]/10 text-[#123D2F] border border-[#123D2F]/20 uppercase">
                Licitante Homologado
              </span>
            </div>
            <p className="text-xs text-[#68716A] mt-0.5 font-mono">
              {currentUser?.email}
            </p>
          </div>
        </div>

        {/* Quick Wallet Summary Pill */}
        <div className="flex items-center justify-between sm:justify-start gap-4 bg-[#FAF7F2] p-3 rounded-xl border border-[#E2DDD2] w-full sm:w-auto">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#68716A] block">
              SALDO DISPONÍVEL
            </span>
            <span className="font-heading font-bold text-xl text-[#123D2F]">
              {formatBRL(wallet.availableCents)}
            </span>
          </div>
          <div className="h-8 w-px bg-[#E2DDD2]" />
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#68716A] block">
              RESERVAS ATIVAS
            </span>
            <span className="font-heading font-semibold text-sm text-[#B45309]">
              {formatBRL(wallet.reservedCents)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[#E2DDD2] overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "dashboard"
              ? "bg-[#123D2F] text-[#F5F1E7]"
              : "text-[#68716A] hover:bg-white hover:text-[#222923]"
          }`}
        >
          <Gavel className="w-3.5 h-3.5" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab("lances")}
          className={`px-4 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "lances"
              ? "bg-[#123D2F] text-[#F5F1E7]"
              : "text-[#68716A] hover:bg-white hover:text-[#222923]"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Meus Lances ({myBidsLots.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("arrematados")}
          className={`px-4 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "arrematados"
              ? "bg-[#123D2F] text-[#F5F1E7]"
              : "text-[#68716A] hover:bg-white hover:text-[#222923]"
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Arrematados & Comprovantes ({wonReceipts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("carteira")}
          className={`px-4 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "carteira"
              ? "bg-[#123D2F] text-[#F5F1E7]"
              : "text-[#68716A] hover:bg-white hover:text-[#222923]"
          }`}
        >
          <WalletIcon className="w-3.5 h-3.5" />
          <span>Carteira</span>
        </button>

        <button
          onClick={() => setActiveTab("transacoes")}
          className={`px-4 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "transacoes"
              ? "bg-[#123D2F] text-[#F5F1E7]"
              : "text-[#68716A] hover:bg-white hover:text-[#222923]"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Extrato & Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab("perfil")}
          className={`px-4 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "perfil"
              ? "bg-[#123D2F] text-[#F5F1E7]"
              : "text-[#68716A] hover:bg-white hover:text-[#222923]"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Perfil & Regras</span>
        </button>
      </div>

      {/* Tab 1: Dashboard */}
      {activeTab === "dashboard" && (
        <div className="space-y-8">
          {/* Metrics 4-Card Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E2DDD2] shadow-2xs space-y-1">
              <span className="text-[11px] text-[#68716A] block">
                Lotes que Você Lidera
              </span>
              <p className="font-heading font-extrabold text-2xl text-[#1E7E34]">
                {leadingLots.length}
              </p>
              <span className="text-[10px] text-[#68716A]">
                Lances ativos no momento
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2DDD2] shadow-2xs space-y-1">
              <span className="text-[11px] text-[#68716A] block">
                Lances Superados
              </span>
              <p className="font-heading font-extrabold text-2xl text-[#B45309]">
                {outbidLots.length}
              </p>
              <span className="text-[10px] text-[#68716A]">
                Aguardando novo lance
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2DDD2] shadow-2xs space-y-1">
              <span className="text-[11px] text-[#68716A] block">
                Lotes Arrematados
              </span>
              <p className="font-heading font-extrabold text-2xl text-[#123D2F]">
                {wonReceipts.length}
              </p>
              <span className="text-[10px] text-[#68716A]">
                Comprovantes emitidos
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E2DDD2] shadow-2xs space-y-1">
              <span className="text-[11px] text-[#68716A] block">
                Saldo Total em Custódia
              </span>
              <p className="font-heading font-extrabold text-2xl text-[#123D2F]">
                {formatBRL(wallet.balanceCents)}
              </p>
              <span className="text-[10px] text-[#68716A]">
                Disponível: {formatBRL(wallet.availableCents)}
              </span>
            </div>
          </div>

          {/* Active Leading Lots Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-[#123D2F] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#1E7E34]" />
                <span>Lotes que você está liderando atualmente</span>
              </h3>
              <button
                onClick={() => setActiveTab("lances")}
                className="text-xs font-semibold text-[#123D2F] hover:underline cursor-pointer"
              >
                Ver todos os lances
              </button>
            </div>

            {leadingLots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leadingLots.map(lot => (
                  <div
                    key={lot.id}
                    className="p-4 bg-white rounded-2xl border border-[#1E7E34]/30 shadow-xs flex items-center justify-between gap-4"
                  >
                    <img
                      src={lot.itemSnapshot.primaryImageUrl}
                      alt={lot.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[10px] text-[#123D2F] font-bold">
                        {lot.code}
                      </span>
                      <h4 className="font-heading font-semibold text-xs text-[#222923] truncate">
                        {lot.title}
                      </h4>
                      <p className="text-xs font-bold text-[#1E7E34] mt-0.5">
                        Seu lance líder: {formatBRL(lot.currentBidCents)}
                      </p>
                    </div>
                    <button
                      onClick={() => navigateTo(`/lotes/${lot.id}`)}
                      className="px-3 py-2 rounded-lg bg-[#123D2F] text-[#F5F1E7] text-xs font-medium hover:bg-[#0A2B22] cursor-pointer shrink-0"
                    >
                      Acompanhar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-white rounded-2xl border border-[#E2DDD2] text-center text-xs text-[#68716A]">
                Você ainda não lidera nenhum lote no momento. Explore o catálogo
                para enviar ofertas!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Meus Lances */}
      {activeTab === "lances" && (
        <div className="bg-white rounded-2xl border border-[#E2DDD2] overflow-hidden shadow-2xs">
          <div className="p-6 border-b border-[#E2DDD2]">
            <h3 className="font-heading font-bold text-lg text-[#123D2F]">
              Histórico de Participação em Lotes
            </h3>
            <p className="text-xs text-[#68716A] mt-0.5">
              Acompanhe a posição dos seus lances e valores vigentes em cada
              pregão.
            </p>
          </div>

          {myBidsLots.length > 0 ? (
            <div>
              {/* Mobile Card List (sm:hidden) */}
              <div className="block sm:hidden divide-y divide-[#E2DDD2]">
                {myBidsLots.map(lot => {
                  const isLeading =
                    lot.status === "LIVE" &&
                    lot.currentLeaderBidderId === currentUser?.id;
                  const isWon =
                    lot.status === "ENDED" &&
                    lot.currentLeaderBidderId === currentUser?.id;

                  return (
                    <div key={lot.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={lot.itemSnapshot.primaryImageUrl}
                          alt={lot.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] text-[#68716A] font-bold">
                              {lot.code}
                            </span>
                            <LotStatusBadge status={lot.status} size="sm" />
                          </div>
                          <h4 className="font-heading font-semibold text-xs text-[#222923] mt-0.5 line-clamp-1">
                            {lot.title}
                          </h4>
                          <div className="mt-1">
                            {isLeading ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1E7E34] bg-[#EAF7EE] px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Liderando
                              </span>
                            ) : isWon ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#123D2F] bg-[#F5F1E7] px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-[#1E7E34]" />
                                Arrematado
                              </span>
                            ) : lot.status === "LIVE" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                Superado
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#68716A]">
                                Não arrematado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2] flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-[#68716A] block">
                            Lance Atual:
                          </span>
                          <span className="font-mono font-bold text-sm text-[#123D2F]">
                            {formatBRL(lot.currentBidCents)}
                          </span>
                        </div>
                        <button
                          onClick={() => navigateTo(`/lotes/${lot.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-[#123D2F] text-[#F5F1E7] font-semibold text-xs hover:bg-[#0A2B22] transition-colors cursor-pointer"
                        >
                          Abrir lote
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#68716A] font-medium border-b border-[#E2DDD2]">
                    <tr>
                      <th className="py-3 px-4">Lote</th>
                      <th className="py-3 px-4">Estado do Pregão</th>
                      <th className="py-3 px-4">Seu Lance</th>
                      <th className="py-3 px-4">Lance Atual</th>
                      <th className="py-3 px-4">Sua Situação</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DDD2]">
                    {myBidsLots.map(lot => {
                      const isLeading =
                        lot.status === "LIVE" &&
                        lot.currentLeaderBidderId === currentUser?.id;
                      const isWon =
                        lot.status === "ENDED" &&
                        lot.currentLeaderBidderId === currentUser?.id;

                      return (
                        <tr
                          key={lot.id}
                          className="hover:bg-[#FAF7F2]/50 transition-colors"
                        >
                          <td className="py-4 px-4 flex items-center gap-3">
                            <img
                              src={lot.itemSnapshot.primaryImageUrl}
                              alt={lot.title}
                              className="w-12 h-12 rounded-lg object-cover shrink-0"
                            />
                            <div>
                              <span className="font-mono text-[10px] text-[#68716A] block">
                                {lot.code}
                              </span>
                              <span className="font-heading font-semibold text-xs text-[#222923]">
                                {lot.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <LotStatusBadge status={lot.status} size="sm" />
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-[#222923]">
                            {formatBRL(lot.currentBidCents)}
                          </td>
                          <td className="py-4 px-4 font-mono text-[#123D2F] font-semibold">
                            {formatBRL(lot.currentBidCents)}
                          </td>
                          <td className="py-4 px-4">
                            {isLeading ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1E7E34] bg-[#EAF7EE] px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                Liderando
                              </span>
                            ) : isWon ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#123D2F] bg-[#F5F1E7] px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-[#1E7E34]" />
                                Arrematado
                              </span>
                            ) : lot.status === "LIVE" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                Superado
                              </span>
                            ) : (
                              <span className="text-[11px] text-[#68716A]">
                                Não arrematado
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => navigateTo(`/lotes/${lot.id}`)}
                              className="px-3 py-1.5 rounded-lg border border-[#123D2F] text-[#123D2F] font-semibold text-xs hover:bg-[#123D2F] hover:text-[#F5F1E7] transition-all cursor-pointer"
                            >
                              Abrir lote
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#68716A]">
              Nenhum lance registrado até o momento.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Arrematados & Comprovantes */}
      {activeTab === "arrematados" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2DDD2] p-6 shadow-2xs">
            <h3 className="font-heading font-bold text-lg text-[#123D2F]">
              Lotes Arrematados & Certificados Digitais
            </h3>
            <p className="text-xs text-[#68716A] mt-0.5">
              Consulte comprovantes com código de verificação emitidos após a
              liquidação.
            </p>
          </div>

          {wonReceipts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wonReceipts.map(rec => (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl border border-[#E2DDD2] p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={rec.itemImageUrl}
                      alt={rec.lotTitle}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs font-bold text-[#123D2F]">
                        {rec.lotCode}
                      </span>
                      <h4 className="font-heading font-semibold text-sm text-[#222923] line-clamp-2">
                        {rec.lotTitle}
                      </h4>
                      <p className="text-xs text-[#68716A] mt-1">
                        Arrematado em: {formatDateTimeBR(rec.closedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#68716A] block text-[10px]">
                        Valor Final:
                      </span>
                      <span className="font-heading font-bold text-base text-[#123D2F]">
                        {formatBRL(rec.finalPriceCents)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#68716A] block text-[10px]">
                        Autenticidade:
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-[#123D2F]">
                        {rec.verificationCode}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedReceiptForModal(rec)}
                    className="w-full py-2.5 rounded-xl bg-[#123D2F] hover:bg-[#0A2B22] text-[#F5F1E7] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4 text-[#C8A96A]" />
                    <span>Visualizar Comprovante Oficial</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2DDD2] p-12 text-center text-xs text-[#68716A] space-y-3">
              <p>Você ainda não arrematou lotes.</p>
              <button
                onClick={() => navigateTo("/lotes")}
                className="px-4 py-2 rounded-xl bg-[#123D2F] text-[#F5F1E7] font-semibold text-xs cursor-pointer"
              >
                Explorar Lotes no Catálogo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Carteira */}
      {activeTab === "carteira" && (
        <div className="space-y-6">
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#CDC5B4] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5 text-[#123D2F]" />
              <h3 className="font-heading font-bold text-lg text-[#123D2F]">
                Carteira & Gestão de Saldos
              </h3>
            </div>
            <p className="text-xs text-[#68716A] leading-relaxed">
              Em conformidade com a especificação técnica da plataforma Lance, o
              valor comprometido no seu maior lance ativo fica reservado. Quando
              superado, a reserva é devolvida automaticamente ao saldo
              disponível.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white p-4 rounded-xl border border-[#E2DDD2]">
                <span className="text-[11px] text-[#68716A] block">
                  Saldo Total em Custódia
                </span>
                <span className="font-heading font-bold text-2xl text-[#222923]">
                  {formatBRL(wallet.balanceCents)}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#E2DDD2]">
                <span className="text-[11px] text-[#68716A] block">
                  Valor Reservado (Lances Ativos)
                </span>
                <span className="font-heading font-bold text-2xl text-[#B45309]">
                  {formatBRL(wallet.reservedCents)}
                </span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#1E7E34]/40">
                <span className="text-[11px] text-[#1E7E34] block font-semibold">
                  Saldo Líquido Disponível
                </span>
                <span className="font-heading font-bold text-2xl text-[#1E7E34]">
                  {formatBRL(wallet.availableCents)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Extrato & Ledger */}
      {activeTab === "transacoes" && (
        <div className="bg-white rounded-2xl border border-[#E2DDD2] overflow-hidden shadow-2xs">
          <div className="p-6 border-b border-[#E2DDD2]">
            <h3 className="font-heading font-bold text-lg text-[#123D2F]">
              Ledger de Transações da Carteira
            </h3>
            <p className="text-xs text-[#68716A] mt-0.5">
              Registro append-only de aportes, bloqueios e liberações de
              reservas com chave de idempotência.
            </p>
          </div>

          {/* Mobile Card List (sm:hidden) */}
          <div className="block sm:hidden divide-y divide-[#E2DDD2]">
            {transactions.map(tx => (
              <div key={tx.id} className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F5F1E7] text-[#123D2F] border border-[#CDC5B4]">
                    {tx.type}
                  </span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      tx.type === "DEPOSIT"
                        ? "text-[#1E7E34]"
                        : tx.type === "RESERVATION_HOLD"
                          ? "text-[#B45309]"
                          : "text-[#222923]"
                    }`}
                  >
                    {tx.type === "DEPOSIT" ? "+" : ""}
                    {formatBRL(tx.amountCents)}
                  </span>
                </div>
                <p className="font-medium text-[#222923] text-xs leading-snug">
                  {tx.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#68716A] pt-1">
                  <span>{formatDateTimeBR(tx.createdAt)}</span>
                  <span className="font-mono truncate max-w-[150px]">
                    {tx.idempotencyKey}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#68716A] font-medium border-b border-[#E2DDD2]">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Chave de Idempotência</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2DDD2]">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#FAF7F2]/50">
                    <td className="py-3 px-4 text-[#68716A] whitespace-nowrap">
                      {formatDateTimeBR(tx.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F5F1E7] text-[#123D2F] border border-[#CDC5B4]">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#222923]">
                      {tx.description}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[#68716A]">
                      {tx.idempotencyKey}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        tx.type === "DEPOSIT"
                          ? "text-[#1E7E34]"
                          : tx.type === "RESERVATION_HOLD"
                            ? "text-[#B45309]"
                            : "text-[#222923]"
                      }`}
                    >
                      {tx.type === "DEPOSIT" ? "+" : ""}
                      {formatBRL(tx.amountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Perfil & Regras */}
      {activeTab === "perfil" && (
        <div className="bg-white rounded-2xl border border-[#E2DDD2] p-8 space-y-6 shadow-2xs">
          <h3 className="font-heading font-bold text-xl text-[#123D2F]">
            Dados Cadastrais & Regras do Licitante
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <span className="text-[#68716A] block">Nome Completo:</span>
              <span className="font-bold text-sm text-[#222923]">
                {currentUser?.name}
              </span>
            </div>
            <div>
              <span className="text-[#68716A] block">E-mail:</span>
              <span className="font-medium text-sm text-[#222923]">
                {currentUser?.email}
              </span>
            </div>
            <div>
              <span className="text-[#68716A] block">
                Pseudônimo Público nos Pregões:
              </span>
              <span className="font-mono font-bold text-sm text-[#123D2F]">
                {currentUser?.publicPseudonym}
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2] text-xs text-[#68716A] space-y-2">
            <h4 className="font-bold text-[#123D2F] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#123D2F]" />
              <span>Regra de Exclusividade de Papéis</span>
            </h4>
            <p className="leading-relaxed">
              Esta conta possui papel exclusivo de <strong>LICITANTE</strong>.
              Conforme regras de negócio da plataforma, um licitante não pode
              administrar nem criar lotes para evitar conflitos de interesse
              durante o pregão.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
