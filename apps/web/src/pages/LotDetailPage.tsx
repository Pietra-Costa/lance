import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { LotStatusBadge } from "../components/domain/LotStatusBadge";
import { CountdownTimer } from "../components/domain/CountdownTimer";
import {
  calculateNextMinimumBid,
  formatBRL,
  formatDateTimeBR,
} from "../logic/auctionRules";
import {
  ChevronRight,
  ShieldCheck,
  Clock,
  Gavel,
  CheckCircle2,
  FileText,
  ZoomIn,
  X,
} from "lucide-react";

export interface LotDetailPageProps {
  lotId: string;
}

export const LotDetailPage: React.FC<LotDetailPageProps> = ({ lotId }) => {
  const {
    getLotById,
    bidsByLot,
    currentUser,
    currentRole,
    navigateTo,
    setSelectedLotForBidModal,
    refreshLotBids,
    refreshLotAudit,
    auditEvents,
    setSelectedReceiptForModal,
    receipts,
  } = useApp();

  const lot = getLotById(lotId);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    void Promise.all([refreshLotBids(lotId), refreshLotAudit(lotId)]).catch(
      error => {
        console.error("Falha ao carregar o histórico do lote:", error);
      },
    );
    // As funções do contexto são recriadas pelo provider; o lote é a dependência real.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId]);

  if (!lot) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
          Lote não encontrado
        </h2>
        <p className="text-xs text-[#68716A]">
          O identificador do lote solicitado não existe ou foi removido do
          catálogo.
        </p>
        <button
          onClick={() => navigateTo("/lotes")}
          className="px-5 py-2.5 rounded-xl bg-[#123D2F] text-white text-xs font-semibold hover:bg-[#0A2B22] cursor-pointer"
        >
          Voltar ao Catálogo de Lotes
        </button>
      </div>
    );
  }

  const allImages = [
    lot.itemSnapshot.primaryImageUrl,
    ...(lot.itemSnapshot.additionalImages || []),
  ];

  const currentImage =
    allImages[selectedImageIndex] || lot.itemSnapshot.primaryImageUrl;
  const bids = bidsByLot[lot.id] || [];
  const minNextBid = calculateNextMinimumBid(lot);

  const isUserLeading =
    lot.status === "LIVE" &&
    currentUser?.id &&
    lot.currentLeaderBidderId === currentUser.id;

  const lotReceipt = receipts.find(r => r.lotCode === lot.code);
  const lotAuditHistory = auditEvents.filter(
    ev => ev.lotId === lot.id || ev.lotCode === lot.code,
  );

  const handleOpenBidModal = () => {
    setSelectedLotForBidModal(lot);
  };

  const renderActionBox = () => (
    <div className="bg-white rounded-2xl border border-[#CDC5B4] p-5 sm:p-6 space-y-5 sm:space-y-6 shadow-md">
      <div>
        <div className="flex items-center justify-between gap-2 text-xs text-[#68716A] mb-1">
          <span className="font-mono text-[#123D2F] font-semibold">
            {lot.code}
          </span>
          <span>{lot.category}</span>
        </div>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#222923] leading-snug">
          {lot.title}
        </h1>
      </div>

      {/* Dynamic Status Alert Banner */}
      {isUserLeading ? (
        <div className="p-3.5 rounded-xl bg-[#EAF7EE] border border-[#1E7E34]/30 flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-[#1E7E34] shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-[#1E7E34]">
              Você está liderando este lote
            </p>
            <p className="text-[#222923]/80 mt-0.5">
              Seu lance de {formatBRL(lot.currentBidCents)} é o maior
              registrado. Acompanhe até o encerramento.
            </p>
          </div>
        </div>
      ) : lot.status === "LIVE" && lot.currentLeaderPseudonym ? (
        <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E2DDD2] flex items-center justify-between text-xs">
          <span className="text-[#68716A]">Líder atual do pregão:</span>
          <span className="font-mono font-bold text-[#123D2F] bg-white px-2 py-0.5 rounded border border-[#E2DDD2]">
            {lot.currentLeaderPseudonym}
          </span>
        </div>
      ) : null}

      {/* Values Grid */}
      <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2] space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-[#68716A]">
            {lot.bidCount > 0 ? "Lance Atual:" : "Lance Inicial:"}
          </span>
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-[#123D2F]">
            {formatBRL(lot.currentBidCents || lot.startingPriceCents)}
          </span>
        </div>

        <div className="pt-2 border-t border-[#E2DDD2]/60 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[#68716A] block text-[11px]">
              Incremento Mínimo:
            </span>
            <span className="font-semibold text-[#222923]">
              {formatBRL(lot.minIncrementCents)}
            </span>
          </div>
          <div>
            <span className="text-[#68716A] block text-[11px]">
              Próximo Mínimo Válido:
            </span>
            <span className="font-mono font-bold text-[#123D2F]">
              {formatBRL(minNextBid)}
            </span>
          </div>
        </div>
      </div>

      {/* Countdown / Ending Info */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs text-[#68716A]">
          <span>
            {lot.status === "LIVE"
              ? "Encerramento em:"
              : lot.status === "SCHEDULED"
                ? "Inicia em:"
                : "Encerramento:"}
          </span>
          <span className="font-medium text-[#222923]">
            {formatDateTimeBR(
              lot.status === "SCHEDULED" ? lot.startsAt : lot.endsAt,
            )}
          </span>
        </div>

        {lot.status === "LIVE" && (
          <div className="w-full">
            <CountdownTimer targetDateISO={lot.endsAt} />
          </div>
        )}
      </div>

      {/* CTA Participation Button */}
      {lot.status === "LIVE" ? (
        <div className="space-y-2">
          {currentRole === "LEILOEIRO" ? (
            <div className="p-3 bg-[#FEF3C7] rounded-xl border border-[#B45309]/30 text-xs text-[#B45309]">
              <p className="font-semibold">Papel Exclusivo de Leiloeiro:</p>
              <p className="mt-0.5">
                Por conformidade regulatória, contas com papel de leiloeiro não
                podem dar lances. Alterne para o perfil Licitante para
                participar.
              </p>
            </div>
          ) : (
            <button
              onClick={handleOpenBidModal}
              className="w-full py-3.5 sm:py-4 rounded-xl bg-[#123D2F] hover:bg-[#0A2B22] text-[#F5F1E7] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
            >
              <Gavel className="w-4 h-4 text-[#C8A96A]" />
              <span>Dar um lance · A partir de {formatBRL(minNextBid)}</span>
            </button>
          )}
        </div>
      ) : lot.status === "SCHEDULED" ? (
        <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#B45309]/30 text-xs text-[#B45309] space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Leilão Agendado</span>
          </p>
          <p>
            O pregão será aberto em {formatDateTimeBR(lot.startsAt)}. Lances não
            são aceitos antes do início oficial.
          </p>
        </div>
      ) : lot.status === "ENDED" ? (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#EFE9DB] border border-[#CDC5B4] text-xs text-[#222923] space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-[#123D2F]">
              <CheckCircle2 className="w-4 h-4 text-[#1E7E34]" />
              <span>Pregão Encerrado</span>
            </p>
            <p className="text-[#68716A]">
              Lote homologado. Valor final de arremate:{" "}
              <strong className="text-[#123D2F]">
                {formatBRL(lot.currentBidCents)}
              </strong>
              .
            </p>
          </div>

          {lotReceipt && (
            <button
              onClick={() => setSelectedReceiptForModal(lotReceipt)}
              className="w-full py-3 rounded-xl border border-[#123D2F] text-[#123D2F] font-semibold text-xs hover:bg-[#F5F1E7] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#123D2F]" />
              <span>Ver Comprovante Oficial de Arremate</span>
            </button>
          )}
        </div>
      ) : null}
    </div>
  );

  const renderBidHistory = () => (
    <div className="bg-white rounded-2xl border border-[#E2DDD2] p-5 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD2]">
        <div className="flex items-center gap-2">
          <Gavel className="w-4 h-4 text-[#123D2F]" />
          <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#123D2F]">
            Histórico de Lances (Público)
          </h3>
        </div>
        <span className="text-[11px] text-[#68716A]">
          {bids.length} {bids.length === 1 ? "lance" : "lances"}
        </span>
      </div>

      {bids.length > 0 ? (
        <div className="divide-y divide-[#E2DDD2]/60 overflow-hidden text-xs">
          {bids.map((b, idx) => (
            <div
              key={b.id}
              className={`py-2.5 flex items-center justify-between ${
                idx === 0 ? "font-semibold" : "text-[#68716A]"
              }`}
            >
              <div>
                <span className="font-mono text-[#123D2F] block">
                  {b.pseudonym}
                </span>
                <span className="text-[10px] text-[#68716A]">
                  {formatDateTimeBR(b.createdAt)}
                </span>
              </div>

              <div className="text-right">
                <span className="font-heading font-bold text-sm text-[#123D2F]">
                  {formatBRL(b.amountCents)}
                </span>
                {idx === 0 && lot.status === "LIVE" && (
                  <span className="block text-[10px] text-[#1E7E34] font-medium">
                    Lance Líder
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[#68716A] py-3 text-center">
          Ainda não foram registrados lances para este lote. Seja o primeiro a
          participar!
        </p>
      )}

      {lotAuditHistory.length > 0 && (
        <div className="pt-3 border-t border-[#E2DDD2]/60 space-y-2">
          <h4 className="font-heading font-bold text-[11px] uppercase tracking-wider text-[#123D2F]">
            Eventos do Leilão
          </h4>
          <div className="space-y-1.5">
            {lotAuditHistory.map(event => (
              <div
                key={event.sequence}
                className={`rounded-lg px-3 py-2 text-[11px] ${
                  event.eventType === "LOT_CANCELED"
                    ? "bg-red-50 border border-red-300 text-red-800"
                    : "bg-[#FAF7F2] border border-[#E2DDD2] text-[#222923]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{event.description}</span>
                  <span className="text-[10px] whitespace-nowrap opacity-70">
                    {formatDateTimeBR(event.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-[#68716A] pt-2 border-t border-[#E2DDD2]/60">
        * Para preservar a privacidade dos participantes, os licitantes são
        identificados por pseudônimos únicos e estáveis.
      </p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[#68716A] overflow-x-auto no-scrollbar">
        <button
          onClick={() => navigateTo("/")}
          className="hover:text-[#123D2F] cursor-pointer whitespace-nowrap shrink-0"
        >
          Início
        </button>
        <ChevronRight className="w-3 h-3 text-[#CDC5B4] shrink-0" />
        <button
          onClick={() => navigateTo("/lotes")}
          className="hover:text-[#123D2F] cursor-pointer whitespace-nowrap shrink-0"
        >
          Catálogo
        </button>
        <ChevronRight className="w-3 h-3 text-[#CDC5B4] shrink-0" />
        <span className="text-[#222923] font-medium font-mono truncate">
          {lot.code}
        </span>
      </nav>

      {/* Main 2-Column Product Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Column (7 cols): Gallery + on mobile: Action Box, Description, Bids, Specs, Audit */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Image Frame */}
          <div className="relative bg-white rounded-2xl border border-[#E2DDD2] p-2 overflow-hidden shadow-xs">
            <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-[#FAF7F2]">
              <img
                src={currentImage}
                alt={lot.title}
                className="w-full h-full object-contain cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              />

              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs flex items-center gap-1.5 backdrop-blur-xs transition-colors cursor-pointer"
                title="Ampliar imagem"
              >
                <ZoomIn className="w-4 h-4" />
                <span className="text-[11px]">Ampliar</span>
              </button>

              <div className="absolute top-3 left-3">
                <LotStatusBadge status={lot.status} size="md" />
              </div>
            </div>

            {/* Thumbnail Row */}
            {allImages.length > 1 && (
              <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIndex === idx
                        ? "border-[#123D2F] ring-2 ring-[#123D2F]/20"
                        : "border-[#E2DDD2] hover:border-[#CDC5B4]"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* On Mobile: Action Box directly after gallery for immediate bidding! */}
          <div className="lg:hidden">{renderActionBox()}</div>

          {/* Item Description & Technical Specifications */}
          <div className="bg-white rounded-2xl border border-[#E2DDD2] p-5 sm:p-6 space-y-4 shadow-2xs">
            <h3 className="font-heading font-bold text-base text-[#123D2F]">
              Descrição do Objeto
            </h3>
            <p className="text-xs sm:text-sm text-[#222923] leading-relaxed font-body">
              {lot.itemSnapshot.description}
            </p>

            <div className="pt-4 border-t border-[#E2DDD2] space-y-2">
              <h4 className="font-heading font-semibold text-xs text-[#123D2F]">
                Ficha Técnica
              </h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                  <dt className="text-[#68716A]">Material / Técnica:</dt>
                  <dd className="font-medium text-[#222923] text-right">
                    {lot.itemSnapshot.medium}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                  <dt className="text-[#68716A]">Dimensões:</dt>
                  <dd className="font-medium text-[#222923] text-right">
                    {lot.itemSnapshot.dimensions}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                  <dt className="text-[#68716A]">Código do Lote:</dt>
                  <dd className="font-mono font-bold text-[#123D2F] text-right">
                    {lot.code}
                  </dd>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAF7F2]">
                  <dt className="text-[#68716A]">Leiloeiro Conducente:</dt>
                  <dd className="font-medium text-[#222923] text-right">
                    {lot.sellerName || "Leiloeiro responsável"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* On Mobile: Bid History table right after description */}
          <div className="lg:hidden">{renderBidHistory()}</div>

          {/* External Source Attribution & Provenance Snapshot */}
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E2DDD2] p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2DDD2]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#123D2F]" />
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#123D2F]">
                  Origem do Item & Snapshot Imutável
                </h4>
              </div>
              <span className="text-[10px] text-[#68716A] font-mono">
                ID: {lot.itemSnapshot.externalId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#68716A] block text-[11px]">
                  Fonte do Acervo:
                </span>
                <span className="font-medium text-[#222923]">
                  {lot.itemSnapshot.source}
                </span>
              </div>
              <div>
                <span className="text-[#68716A] block text-[11px]">
                  Autor / Atribuição:
                </span>
                <span className="font-medium text-[#222923]">
                  {lot.itemSnapshot.creator}
                </span>
              </div>
              <div>
                <span className="text-[#68716A] block text-[11px]">
                  Período / Ano:
                </span>
                <span className="font-medium text-[#222923]">
                  {lot.itemSnapshot.dateOrYear}
                </span>
              </div>
              <div>
                <span className="text-[#68716A] block text-[11px]">
                  Condições da Imagem:
                </span>
                <span className="font-medium text-[#222923]">
                  {lot.itemSnapshot.licenseNotes}
                </span>
              </div>
            </div>
          </div>

          {/* Cryptographic Hash Chain Audit Section for this lot */}
          <div className="bg-white rounded-2xl border border-[#E2DDD2] p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#123D2F]" />
                <h3 className="font-heading font-bold text-sm text-[#123D2F]">
                  Auditoria Criptográfica do Lote
                </h3>
              </div>
              <button
                onClick={() => navigateTo("/auditoria")}
                className="text-[11px] font-semibold text-[#123D2F] hover:underline cursor-pointer"
              >
                Ver cadeia completa
              </button>
            </div>

            <div className="space-y-2">
              {lotAuditHistory.length > 0 ? (
                lotAuditHistory.map(ev => (
                  <div
                    key={ev.sequence}
                    className={`p-2.5 rounded-lg text-xs space-y-1 ${
                      ev.eventType === "LOT_CANCELED"
                        ? "bg-red-50 border border-red-300"
                        : "bg-[#FAF7F2] border border-[#E2DDD2]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        className={`font-mono font-bold ${
                          ev.eventType === "LOT_CANCELED"
                            ? "text-red-800"
                            : "text-[#123D2F]"
                        }`}
                      >
                        Bloco #{ev.sequence} · {ev.eventType.replace(/_/g, " ")}
                      </span>
                      <span className="text-[#68716A]">
                        {formatDateTimeBR(ev.timestamp)}
                      </span>
                    </div>
                    <p className="text-[#222923] text-[11px]">
                      {ev.description}
                    </p>
                    <div className="font-mono text-[9px] text-[#68716A] truncate">
                      Hash: {ev.hash}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#68716A]">
                  Eventos de auditoria registrados com chave Ed25519 e ancoragem
                  pública.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Desktop only): Sticky Bid Panel + Bid History (5 cols) */}
        <div className="hidden lg:block lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {renderActionBox()}
          {renderBidHistory()}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-white/80 p-2"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={currentImage}
            alt={lot.title}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};
