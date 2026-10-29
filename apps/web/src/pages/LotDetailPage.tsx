import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { LotStatusBadge } from "../components/domain/LotStatusBadge";
import { ItemImage } from "../components/domain/ItemImage";
import { CountdownTimer } from "../components/domain/CountdownTimer";
import { LotAuditModal } from "../components/domain/LotAuditModal";
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
  AlertTriangle,
  ArrowUpRight,
  Fingerprint,
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
    myBids,
    subscribeToLot,
    unsubscribeFromLot,
  } = useApp();

  const lot = getLotById(lotId);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  useEffect(() => {
    subscribeToLot(lotId);

    void Promise.all([refreshLotBids(lotId), refreshLotAudit(lotId)]).catch(
      (error) => {
        console.error("Falha ao carregar o histórico do lote:", error);
      },
    );

    return () => {
      unsubscribeFromLot(lotId);
    };
  }, [
    lotId,
    subscribeToLot,
    unsubscribeFromLot,
    refreshLotBids,
    refreshLotAudit,
  ]);

  if (!lot) {
    return (
      <div className="min-h-[65vh] bg-surface-base px-5 py-24">
        <div className="mx-auto max-w-3xl border-y border-border-subtle py-12 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-secondary">
            Catálogo de lotes
          </span>
          <h2 className="mt-4 font-heading text-3xl font-bold text-brand-interactive">
            Lote não encontrado
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-secondary">
            O identificador do lote solicitado não existe ou foi removido do
            catálogo.
          </p>
          <button
            onClick={() => navigateTo("/lotes")}
            className="mt-8 inline-flex cursor-pointer items-center gap-3 bg-brand-primary px-5 py-3 text-xs font-semibold text-brand-on-dark transition-colors hover:bg-brand-deep"
          >
            Voltar ao Catálogo de Lotes
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
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

  // A presença do lote no histórico pessoal indica participação.
  const hasBidInLot = myBids.some((bid) => bid.lotId === lot.id);
  const isUserOutbid =
    lot.status === "LIVE" &&
    !!currentUser?.id &&
    currentRole === "LICITANTE" &&
    !isUserLeading &&
    hasBidInLot &&
    !!lot.currentLeaderBidderId;

  const lotReceipt = receipts.find((r) => r.lotCode === lot.code);
  const lotAuditHistory = auditEvents.filter(
    (ev) => ev.lotId === lot.id || ev.lotCode === lot.code,
  );

  const handleOpenBidModal = () => {
    setSelectedLotForBidModal(lot);
  };

  const renderActionBox = () => (
    <section className="border border-border-subtle bg-surface-base">
      <div className="border-b border-border-subtle px-5 py-5 sm:px-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="font-mono text-xs font-semibold text-brand-interactive">
            {lot.code}
          </span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary">
            {lot.category}
          </span>
        </div>

        <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight text-brand-interactive sm:text-3xl">
          {lot.title}
        </h1>
      </div>

      <div className="space-y-6 px-5 py-6 sm:px-7">
        {isUserOutbid ? (
          <div className="flex items-start gap-3 border-l-2 border-semantic-warning bg-semantic-warning-bg p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-semantic-warning" />
            <div className="text-xs leading-5">
              <p className="font-bold text-semantic-warning">
                Você foi superado
              </p>
              <p className="mt-1 text-text-primary">
                Outro licitante assumiu a liderança com{" "}
                {formatBRL(lot.currentBidCents)}. Seu saldo reservado foi
                liberado — dê um novo lance para voltar a liderar.
              </p>
            </div>
          </div>
        ) : null}

        {isUserLeading ? (
          <div className="flex items-start gap-3 border-l-2 border-semantic-success bg-semantic-success-bg p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-semantic-success" />
            <div className="text-xs leading-5">
              <p className="font-bold text-semantic-success">
                Você está liderando este lote
              </p>
              <p className="mt-1 text-text-primary">
                Seu lance de {formatBRL(lot.currentBidCents)} é o maior
                registrado. Acompanhe até o encerramento.
              </p>
            </div>
          </div>
        ) : lot.status === "LIVE" && lot.currentLeaderPseudonym ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border-subtle py-3 text-xs">
            <span className="text-text-secondary">Líder atual do pregão</span>
            <span className="border border-border-subtle bg-surface-muted px-3 py-1 font-mono font-bold text-brand-interactive">
              {lot.currentLeaderPseudonym}
            </span>
          </div>
        ) : null}

        <div className="border border-border-subtle bg-surface-muted p-5 sm:p-6">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
            {lot.bidCount > 0 ? "Lance atual" : "Lance inicial"}
          </span>

          <p className="mt-2 wrap-break-word font-heading text-3xl font-bold tracking-tight text-brand-interactive sm:text-4xl">
            {formatBRL(lot.currentBidCents || lot.startingPriceCents)}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border-subtle pt-4">
            <div>
              <span className="block text-[10px] leading-4 text-text-secondary">
                Incremento mínimo
              </span>
              <span className="mt-1 block text-sm font-semibold text-text-primary">
                {formatBRL(lot.minIncrementCents)}
              </span>
            </div>

            <div>
              <span className="block text-[10px] leading-4 text-text-secondary">
                Próximo mínimo válido
              </span>
              <span className="mt-1 block wrap-break-word font-mono text-sm font-bold text-brand-interactive">
                {formatBRL(minNextBid)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 text-xs">
            <span className="text-text-secondary">
              {lot.status === "LIVE"
                ? "Encerramento em"
                : lot.status === "SCHEDULED"
                  ? "Inicia em"
                  : "Encerramento"}
            </span>
            <span className="text-right font-medium text-text-primary">
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

        {lot.status === "LIVE" ? (
          <div className="space-y-3">
            {currentRole === "LEILOEIRO" ? (
              <div className="border border-semantic-warning/30 bg-semantic-warning-bg p-4 text-xs leading-5 text-semantic-warning">
                <p className="font-semibold">Papel exclusivo de leiloeiro</p>
                <p className="mt-1">
                  Por conformidade regulatória, contas com papel de leiloeiro
                  não podem dar lances. Alterne para o perfil Licitante para
                  participar.
                </p>
              </div>
            ) : (
              <button
                onClick={handleOpenBidModal}
                className="group flex w-full cursor-pointer items-center justify-between gap-3 bg-brand-primary px-5 py-4 text-left text-brand-on-dark transition-colors hover:bg-brand-deep"
              >
                <span className="flex items-center gap-3">
                  <Gavel className="h-5 w-5 shrink-0 text-accent-gold-ink" />
                  <span>
                    <span className="block text-sm font-semibold">
                      Dar um lance
                    </span>
                    <span className="mt-1 block text-[11px] text-brand-on-dark/75">
                      A partir de {formatBRL(minNextBid)}
                    </span>
                  </span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        ) : lot.status === "SCHEDULED" ? (
          <div className="border-l-2 border-semantic-warning bg-semantic-warning-bg p-4 text-xs leading-5 text-semantic-warning">
            <p className="flex items-center gap-2 font-bold">
              <Clock className="h-4 w-4" />
              Leilão agendado
            </p>
            <p className="mt-2">
              O pregão será aberto em {formatDateTimeBR(lot.startsAt)}. Lances
              não são aceitos antes do início oficial.
            </p>
          </div>
        ) : lot.status === "ENDED" ? (
          <div className="space-y-4">
            <div className="border-l-2 border-semantic-success bg-surface-muted p-4 text-xs leading-5">
              <p className="flex items-center gap-2 font-bold text-brand-interactive">
                <CheckCircle2 className="h-4 w-4 text-semantic-success" />
                Pregão encerrado
              </p>
              <p className="mt-2 text-text-secondary">
                Lote homologado. Valor final de arremate:{" "}
                <strong className="text-brand-interactive">
                  {formatBRL(lot.currentBidCents)}
                </strong>
                .
              </p>
            </div>

            {lotReceipt && (
              <button
                onClick={() => setSelectedReceiptForModal(lotReceipt)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 border border-border-subtle border-brand-primary px-4 py-3 text-xs font-semibold text-brand-interactive transition-colors hover:bg-surface-muted"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Ver comprovante oficial de arremate
                </span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );

  /**
   * Histórico unificado: lances aceitos e eventos do ciclo do lote,
   * ordenados do mais recente para o mais antigo.
   */
  const renderBidHistory = () => {
    type TimelineEntry = {
      key: string;
      kind: "BID" | "EVENT";
      title: string;
      subtitle: string | null;
      amountCents: number | null;
      timestamp: string;
      isLeader: boolean;
      isCanceled: boolean;
    };

    const bidEntries: TimelineEntry[] = bids.map((bid, index) => ({
      key: `bid-${bid.id}`,
      kind: "BID",
      title: bid.pseudonym,
      subtitle: null,
      amountCents: bid.amountCents,
      timestamp: bid.createdAt,
      isLeader: index === 0 && lot.status === "LIVE",
      isCanceled: false,
    }));

    const eventEntries: TimelineEntry[] = lotAuditHistory
      .filter((event) => event.eventType !== "BID_PLACED")
      .map((event) => ({
        key: `evt-${event.sequence}`,
        kind: "EVENT",
        title: event.description,
        subtitle: event.eventType,
        amountCents: null,
        timestamp: event.timestamp,
        isLeader: false,
        isCanceled: event.eventType === "LOT_CANCELED",
      }));

    const timeline = [...bidEntries, ...eventEntries].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return (
      <section className="border border-border-subtle bg-surface-base">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-surface-muted text-brand-interactive">
              <Gavel className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-brand-interactive">
                Histórico de lances
              </h3>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-text-secondary">
                Registro público
              </p>
            </div>
          </div>
          <span className="shrink-0 font-mono text-xs text-text-secondary">
            {bids.length.toString().padStart(2, "0")}
          </span>
        </div>

        <div className="px-5 py-2 sm:px-6">
          {timeline.length > 0 ? (
            <div className="divide-y divide-border-subtle/60 text-xs">
              {timeline.map((entry) => (
                <div
                  key={entry.key}
                  className={`flex items-start justify-between gap-3 py-4 ${
                    entry.kind === "BID" && entry.isLeader
                      ? "font-semibold"
                      : ""
                  }`}
                >
                  <div className="min-w-0">
                    <span
                      className={`block truncate ${
                        entry.isCanceled
                          ? "font-mono text-semantic-error"
                          : entry.kind === "BID"
                            ? "font-mono text-brand-interactive"
                            : "font-medium text-text-primary"
                      }`}
                    >
                      {entry.title}
                    </span>
                    <span className="mt-1 block text-[10px] text-text-secondary">
                      {formatDateTimeBR(entry.timestamp)}
                    </span>
                  </div>

                  {entry.amountCents !== null && (
                    <div className="shrink-0 text-right">
                      <span className="font-heading text-sm font-bold text-brand-interactive">
                        {formatBRL(entry.amountCents)}
                      </span>
                      {entry.isLeader && (
                        <span className="mt-1 block text-[10px] font-medium text-semantic-success">
                          Lance líder
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs leading-5 text-text-secondary">
              Ainda não foram registrados lances para este lote. Seja o primeiro
              a participar!
            </p>
          )}
        </div>

        <p className="border-t border-border-subtle px-5 py-4 text-[10px] leading-5 text-text-secondary sm:px-6">
          Para preservar a privacidade dos participantes, os licitantes são
          identificados por pseudônimos únicos e estáveis.
        </p>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto max-w-360 px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        <nav
          aria-label="Navegação estrutural"
          className="mb-8 flex items-center gap-2 overflow-x-auto text-xs text-text-secondary no-scrollbar sm:mb-10"
        >
          <button
            onClick={() => navigateTo("/")}
            className="shrink-0 cursor-pointer whitespace-nowrap transition-colors hover:text-brand-interactive"
          >
            Início
          </button>
          <ChevronRight className="h-3 w-3 shrink-0 text-border-strong" />
          <button
            onClick={() => navigateTo("/lotes")}
            className="shrink-0 cursor-pointer whitespace-nowrap transition-colors hover:text-brand-interactive"
          >
            Catálogo
          </button>
          <ChevronRight className="h-3 w-3 shrink-0 text-border-strong" />
          <span className="truncate font-mono font-medium text-text-primary">
            {lot.code}
          </span>
        </nav>

        <div className="mb-8 flex flex-col gap-4 border-b border-border-subtle pb-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-accent-gold" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
                Acervo · Registro · Procedência
              </span>
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-interactive sm:text-4xl lg:text-5xl">
              Detalhes do lote
            </h2>
          </div>
          <div className="flex min-w-0 max-w-full flex-col items-start gap-1 self-start border-l-2 border-accent-gold pl-3 sm:flex-row sm:items-center sm:gap-3 sm:pl-4">
            <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary">
              Identificação
            </span>
            <span className="max-w-full break-all font-mono text-sm font-semibold text-brand-interactive">
              {lot.code}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 space-y-8 lg:col-span-7">
            {/* Imagem principal e miniaturas */}
            <section>
              <div className="relative overflow-hidden border border-border-subtle bg-surface-muted p-2 sm:p-3">
                <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-muted">
                  <div
                    className="h-full w-full cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <ItemImage
                      src={currentImage}
                      alt={lot.title}
                      seed={lot.id}
                      className="h-full w-full object-contain"
                      loading="eager"
                    />
                  </div>

                  <div className="absolute left-3 top-3">
                    <LotStatusBadge status={lot.status} size="md" />
                  </div>

                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-2 border border-invert bg-brand-deep/90 px-3 py-2 text-xs text-brand-on-dark backdrop-blur-sm transition-colors hover:bg-brand-primary"
                    title="Ampliar imagem"
                  >
                    <ZoomIn className="h-4 w-4" />
                    Ampliar imagem
                  </button>
                </div>

                {allImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto px-1 pb-1 pt-3 no-scrollbar">
                    {allImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        aria-label={`Ver imagem ${idx + 1}`}
                        aria-pressed={selectedImageIndex === idx}
                        className={`h-16 w-16 shrink-0 cursor-pointer overflow-hidden border transition-colors sm:h-20 sm:w-20 ${
                          selectedImageIndex === idx
                            ? "border-brand-primary ring-1 ring-brand-primary"
                            : "border-border-subtle hover:border-border-strong"
                        }`}
                      >
                        <ItemImage
                          src={imgUrl}
                          alt={`Miniatura ${idx + 1}`}
                          className="h-full w-full object-cover"
                          showLabel={false}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-text-secondary">
                {allImages.length}{" "}
                {allImages.length === 1
                  ? "imagem disponível"
                  : "imagens disponíveis"}
                {" · "}
                Selecione para ampliar
              </p>
            </section>

            <div className="lg:hidden">{renderActionBox()}</div>

            {/* Descrição e ficha técnica */}
            <section className="border-y border-border-subtle py-6 sm:py-8">
              <div className="mb-6 flex items-start gap-4">
                <span className="font-mono text-xs text-accent-gold-ink">01</span>
                <div>
                  <h3 className="font-heading text-xl font-bold text-brand-interactive sm:text-2xl">
                    Descrição do objeto
                  </h3>
                  <p className="mt-2 text-xs text-text-secondary">
                    Informações fornecidas para identificação da peça
                  </p>
                </div>
              </div>

              <p className="text-sm leading-7 text-text-primary">
                {lot.itemSnapshot.description}
              </p>

              {(lot.specialConditions || lot.sellerNotes) && (
                <div className="mt-7 grid grid-cols-1 gap-6 border-t border-border-subtle pt-6 sm:grid-cols-2">
                  {lot.specialConditions && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold text-brand-interactive">
                        Condições especiais
                      </h4>
                      <p className="whitespace-pre-line text-xs leading-6 text-text-secondary">
                        {lot.specialConditions}
                      </p>
                    </div>
                  )}
                  {lot.sellerNotes && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold text-brand-interactive">
                        Observações do leiloeiro
                      </h4>
                      <p className="whitespace-pre-line text-xs leading-6 text-text-secondary">
                        {lot.sellerNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 border-t border-border-subtle pt-6">
                <h4 className="mb-4 font-heading text-base font-semibold text-brand-interactive">
                  Ficha técnica
                </h4>
                <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  <div className="flex items-start justify-between gap-4 border-b border-border-subtle py-3">
                    <dt className="text-xs text-text-secondary">
                      Material / Técnica
                    </dt>
                    <dd className="text-right text-xs font-medium text-text-primary">
                      {lot.itemSnapshot.medium || "Não informado"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-b border-border-subtle py-3">
                    <dt className="text-xs text-text-secondary">Dimensões</dt>
                    <dd className="text-right text-xs font-medium text-text-primary">
                      {lot.itemSnapshot.dimensions || "Não informado"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-b border-border-subtle py-3">
                    <dt className="text-xs text-text-secondary">
                      Código do lote
                    </dt>
                    <dd className="text-right font-mono text-xs font-bold text-brand-interactive">
                      {lot.code}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-b border-border-subtle py-3">
                    <dt className="text-xs text-text-secondary">
                      Leiloeiro conducente
                    </dt>
                    <dd className="text-right text-xs font-medium text-text-primary">
                      {lot.sellerName || "Leiloeiro responsável"}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <div className="lg:hidden">{renderBidHistory()}</div>

            {/* Origem e snapshot */}
            <section className="border border-border-subtle bg-surface-muted p-5 sm:p-6">
              <div className="flex flex-col gap-4 border-b border-border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-brand-interactive" />
                  <div>
                    <h4 className="font-heading text-sm font-bold text-brand-interactive">
                      Origem do item
                    </h4>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-text-secondary">
                      Snapshot imutável
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-text-secondary">
                  ID: {lot.itemSnapshot.externalId}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-x-8 gap-y-5 pt-5 sm:grid-cols-2">
                <div>
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-text-secondary">
                    Fonte do acervo
                  </span>
                  <span className="text-xs font-medium text-text-primary">
                    {lot.itemSnapshot.source}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-text-secondary">
                    Autor / Atribuição
                  </span>
                  <span className="text-xs font-medium text-text-primary">
                    {lot.itemSnapshot.creator}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-text-secondary">
                    Período / Ano
                  </span>
                  <span className="text-xs font-medium text-text-primary">
                    {lot.itemSnapshot.dateOrYear}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-text-secondary">
                    Condições da imagem
                  </span>
                  <span className="text-xs font-medium text-text-primary">
                    {lot.itemSnapshot.licenseNotes}
                  </span>
                </div>
              </div>
            </section>

            {/* Auditoria: acesso com destaque visual */}
            <section className="overflow-hidden border border-border-subtle border-brand-primary">
              <div className="flex items-start gap-4 bg-brand-deep p-5 text-brand-on-dark sm:p-7">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-surface-base/20 bg-surface-base/10">
                  <Fingerprint className="h-5 w-5 text-accent-gold-ink" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-gold-ink">
                    Integridade e rastreabilidade
                  </p>
                  <h3 className="mt-2 font-heading text-lg font-bold leading-snug sm:text-xl">
                    Auditoria Criptográfica do Lote
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-brand-on-dark/75">
                    {lotAuditHistory.length > 0
                      ? `${lotAuditHistory.length} evento(s) registrados para este lote. Consulte hashes, descrições e verificações.`
                      : "Eventos de auditoria encadeados por hash SHA-256 e verificáveis na página de auditoria."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 bg-surface-muted p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-brand-interactive" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      Registro de verificação
                    </p>
                    <p className="mt-1 text-[10px] text-text-secondary">
                      {lotAuditHistory.length}{" "}
                      {lotAuditHistory.length === 1
                        ? "evento disponível"
                        : "eventos disponíveis"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAuditModalOpen(true)}
                  className="group flex w-full cursor-pointer items-center justify-between gap-4 bg-brand-primary px-5 py-4 text-left text-brand-on-dark transition-colors hover:bg-brand-deep sm:w-auto sm:min-w-55"
                >
                  <span>
                    <span className="block text-sm font-bold">
                      Abrir auditoria
                    </span>
                    <span className="mt-1 block text-[10px] text-brand-on-dark/75">
                      Consultar registro completo
                    </span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 shrink-0 text-accent-gold-ink transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
              </div>
            </section>
          </div>

          <div className="hidden space-y-6 lg:sticky lg:top-8 lg:col-span-5 lg:block">
            {renderActionBox()}
            {renderBidHistory()}
          </div>
        </div>
      </div>

      {auditModalOpen && (
        <LotAuditModal
          lotTitle={lot.title}
          lotCode={lot.code}
          events={lotAuditHistory}
          onClose={() => setAuditModalOpen(false)}
        />
      )}

      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4"
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Fechar imagem ampliada"
            className="absolute right-4 top-4 cursor-pointer p-2 text-brand-on-dark transition-colors hover:text-accent-gold"
          >
            <X className="h-7 w-7" />
          </button>

          <div className="h-[80vh] max-h-[90vh] w-[90vw] max-w-[90vw]">
            <ItemImage
              src={currentImage}
              alt={lot.title}
              className="mx-auto max-h-[90vh] max-w-[90vw] rounded-sm object-contain"
              loading="eager"
            />
          </div>
        </div>
      )}
    </div>
  );
};
