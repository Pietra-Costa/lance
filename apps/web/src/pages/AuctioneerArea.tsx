import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import type { Lot } from "../types/auction";
import { SellerAgreementModal } from "../components/domain/SellerAgreementModal";
import { EditLotModal } from "../components/domain/EditLotModal";
import { LotStatusBadge } from "../components/domain/LotStatusBadge";
import { ItemImage } from "../components/domain/ItemImage";
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
  Package,
  ArrowUpRight,
  Search,
  LockKeyhole,
  X,
} from "lucide-react";

const statusFilters = [
  { value: "ALL", label: "Todos" },
  { value: "LIVE", label: "Ao vivo" },
  { value: "SCHEDULED", label: "Agendados" },
  { value: "ENDED", label: "Encerrados" },
  { value: "CANCELED", label: "Cancelados" },
];

const SettlementResultCell: React.FC<{ lot: Lot }> = ({ lot }) => {
  const settlement = lot.settlement;

  if (!settlement) {
    return <span className="text-xs text-text-secondary">—</span>;
  }

  if (settlement.status === "COMPLETED") {
    if (!settlement.amountCents) {
      return (
        <span className="text-xs text-text-secondary">
          Encerrado sem lances
        </span>
      );
    }

    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-semantic-success/10 px-2 py-1 text-[10px] font-semibold text-semantic-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Arrematado
        </span>
        <span className="block font-mono text-sm font-bold text-brand-primary">
          {formatBRL(settlement.amountCents)}
        </span>
        {settlement.settledAt && (
          <span className="block text-[10px] text-text-secondary">
            {formatDateTimeBR(settlement.settledAt)}
          </span>
        )}
      </div>
    );
  }

  if (settlement.status === "FAILED") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-semantic-error-bg px-2 py-1 text-[10px] font-semibold text-semantic-error"
        title="A liquidação falhou. Verifique o histórico de auditoria do lote."
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Falha na liquidação
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-semantic-warning-bg px-2 py-1 text-[10px] font-semibold text-semantic-warning">
      <Clock className="h-3.5 w-3.5" />
      Liquidando...
    </span>
  );
};

export const AuctioneerArea: React.FC = () => {
  const {
    currentUser,
    sellerAgreement,
    lots,
    navigateTo,
    publishLot,
    cancelLot,
  } = useApp();

  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("ALL");
  const [cancelModalLotId, setCancelModalLotId] = useState<string | null>(null);
  const [editLotId, setEditLotId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const isAgreementSigned = !!sellerAgreement;
  const myLots = lots.filter(lot => lot.sellerId === currentUser?.id);

  const filteredLots = myLots.filter(lot => {
    const matchesStatus =
      selectedStatusFilter === "ALL" || lot.status === selectedStatusFilter;

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      lot.title.toLowerCase().includes(term) ||
      lot.code.toLowerCase().includes(term) ||
      lot.category.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  const liveCount = myLots.filter(lot => lot.status === "LIVE").length;
  const scheduledCount = myLots.filter(
    lot => lot.status === "SCHEDULED",
  ).length;
  const endedCount = myLots.filter(lot => lot.status === "ENDED").length;

  const totalRaisedCents = myLots.reduce((total, lot) => {
    const settlement = lot.settlement;

    if (
      settlement &&
      settlement.status === "COMPLETED" &&
      settlement.settledAt
    ) {
      return total + settlement.amountCents;
    }

    return total;
  }, 0);

  const handleConfirmCancel = () => {
    if (cancelModalLotId && cancellationReason.trim()) {
      cancelLot(cancelModalLotId, cancellationReason.trim());
      setCancelModalLotId(null);
      setCancellationReason("");
    }
  };

  const selectedCancelLot = myLots.find(lot => lot.id === cancelModalLotId);

  const statCards = [
    {
      label: "Pregões ao vivo",
      value: liveCount,
      description: "Recebendo novos lances",
      iconColor: "text-semantic-success",
      iconBackground: "bg-semantic-success/10",
      accent: "border-l-semantic-success",
    },
    {
      label: "Lotes agendados",
      value: scheduledCount,
      description: "Aguardando abertura",
      iconColor: "text-semantic-warning",
      iconBackground: "bg-semantic-warning-bg",
      accent: "border-l-accent-gold",
    },
    {
      label: "Lotes encerrados",
      value: endedCount,
      description: "Pregões finalizados",
      iconColor: "text-brand-primary",
      iconBackground: "bg-brand-primary/8",
      accent: "border-l-brand-primary",
    },
    {
      label: "Volume arrematado",
      value: formatBRL(totalRaisedCents),
      description: "Liquidações concluídas",
      iconColor: "text-accent-gold",
      iconBackground: "bg-accent-gold/15",
      accent: "border-l-accent-gold",
      monetary: true,
    },
  ];

  return (
    <div className="min-h-full bg-surface-base">
      {!isAgreementSigned && <SellerAgreementModal />}

      <div className="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-5 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
        <section className="relative isolate overflow-hidden rounded-2xl bg-brand-deep text-surface-base shadow-lg shadow-brand-deep/10 sm:rounded-3xl">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-28 -z-10 h-72 w-72 rounded-full border border-accent-gold/15 sm:-right-12 sm:-top-36 sm:h-96 sm:w-96"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 right-1/4 -z-10 h-56 w-56 rounded-full bg-brand-primary/50 blur-3xl"
          />

          <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-10">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-gold/30 bg-accent-gold/10 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.17em] text-accent-gold sm:text-[10px]">
                  <Gavel className="h-3.5 w-3.5" />
                  Painel operacional
                </span>
                <span className="inline-flex items-center gap-1.5 text-[10px] text-surface-base/60 sm:text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-semantic-success" />
                  Leiloeiro autenticado
                </span>
              </div>

              <h1 className="break-words font-heading text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Olá, {currentUser?.name || "Leiloeiro"}
              </h1>

              <p className="mt-2 max-w-xl text-xs leading-6 text-surface-base/65 sm:text-sm sm:leading-7">
                Gerencie seus lotes, acompanhe os pregões e monitore os
                resultados das suas operações em um só lugar.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-surface-base/55 sm:text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-accent-gold" />
                  {myLots.length}{" "}
                  {myLots.length === 1
                    ? "lote cadastrado"
                    : "lotes cadastrados"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent-gold" />
                  Operações auditáveis
                </span>
              </div>
            </div>

            <button
              onClick={() => navigateTo("/leiloeiro/lotes/novo")}
              className="group inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2.5 rounded-xl bg-accent-gold px-5 py-3 text-sm font-semibold text-brand-deep shadow-md shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d6b979] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep sm:w-auto sm:px-6"
            >
              <PlusCircle className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
              Criar novo lote
              <ArrowUpRight className="h-4 w-4 opacity-70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="relative grid grid-cols-3 border-t border-white/10 bg-black/10">
            <div className="px-3 py-3.5 text-center sm:px-5 sm:py-4">
              <p className="font-mono text-lg font-bold text-white sm:text-2xl">
                {liveCount}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-wider text-surface-base/55 sm:text-[10px]">
                Ao vivo
              </p>
            </div>
            <div className="border-x border-white/10 px-3 py-3.5 text-center sm:px-5 sm:py-4">
              <p className="font-mono text-lg font-bold text-white sm:text-2xl">
                {scheduledCount}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-wider text-surface-base/55 sm:text-[10px]">
                Agendados
              </p>
            </div>
            <div className="px-3 py-3.5 text-center sm:px-5 sm:py-4">
              <p className="font-mono text-lg font-bold text-white sm:text-2xl">
                {endedCount}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-wider text-surface-base/55 sm:text-[10px]">
                Encerrados
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {statCards.map(stat => {
            return (
              <div
                key={stat.label}
                className={`relative min-w-0 overflow-hidden rounded-2xl border border-border-subtle border-l-[3px] ${stat.accent} bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5`}
              >
                <p
                  className={`mt-4 break-words font-heading font-bold tracking-tight text-brand-primary ${
                    stat.monetary
                      ? "text-lg sm:text-2xl"
                      : "text-2xl sm:text-3xl"
                  }`}
                >
                  {stat.value}
                </p>

                <p className="mt-1.5 text-[9px] leading-4 text-text-secondary sm:text-[10px]">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-sm sm:rounded-3xl">
          <div className="border-b border-border-subtle p-4 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/8 text-brand-primary">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-heading text-base font-bold text-brand-primary sm:text-lg">
                      Gestão de lotes
                    </h2>
                    <p className="mt-0.5 text-[10px] text-text-secondary sm:text-xs">
                      Acompanhe o ciclo de vida dos seus pregões.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative w-full xl:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar por lote, código ou categoria"
                  aria-label="Buscar lotes"
                  className="h-11 w-full rounded-xl border border-border-subtle bg-surface-base/50 pl-9 pr-3 text-xs text-text-primary outline-none transition-colors placeholder:text-text-secondary/70 focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-1">
                {statusFilters.map(filter => {
                  const isActive = selectedStatusFilter === filter.value;

                  return (
                    <button
                      key={filter.value}
                      onClick={() => setSelectedStatusFilter(filter.value)}
                      aria-pressed={isActive}
                      className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-semibold transition-colors sm:text-xs ${
                        isActive
                          ? "bg-brand-primary text-white shadow-sm"
                          : "border border-border-subtle bg-white text-text-secondary hover:border-brand-primary/30 hover:text-brand-primary"
                      }`}
                    >
                      {filter.label}
                      {filter.value === "ALL" && (
                        <span className="ml-1.5 opacity-70">
                          {myLots.length}
                        </span>
                      )}
                      {filter.value === "LIVE" && (
                        <span className="ml-1.5 opacity-70">{liveCount}</span>
                      )}
                      {filter.value === "SCHEDULED" && (
                        <span className="ml-1.5 opacity-70">
                          {scheduledCount}
                        </span>
                      )}
                      {filter.value === "ENDED" && (
                        <span className="ml-1.5 opacity-70">{endedCount}</span>
                      )}
                      {filter.value === "CANCELED" && (
                        <span className="ml-1.5 opacity-70">
                          {
                            myLots.filter(lot => lot.status === "CANCELED")
                              .length
                          }
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredLots.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-14 text-center sm:py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border-subtle bg-surface-base text-text-secondary">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-heading text-base font-semibold text-brand-primary">
                {myLots.length === 0
                  ? "Você ainda não tem lotes"
                  : "Nenhum lote encontrado"}
              </h3>
              <p className="mt-2 max-w-sm text-xs leading-5 text-text-secondary sm:text-sm">
                {myLots.length === 0
                  ? "Crie seu primeiro lote para começar a organizar seus pregões."
                  : "Tente alterar os filtros ou usar outro termo de busca."}
              </p>
              {myLots.length === 0 ? (
                <button
                  onClick={() => navigateTo("/leiloeiro/lotes/novo")}
                  className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-deep"
                >
                  <PlusCircle className="h-4 w-4" />
                  Criar primeiro lote
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedStatusFilter("ALL");
                    setSearchTerm("");
                  }}
                  className="mt-4 rounded-lg px-4 py-2 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary/5"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-border-subtle lg:hidden">
                {filteredLots.map(lot => (
                  <article key={lot.id} className="p-4 sm:p-5">
                    <div className="flex min-w-0 gap-3 sm:gap-4">
                      <div className="h-[88px] w-[76px] shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-surface-base sm:h-24 sm:w-24">
                        <ItemImage
                          src={lot.itemSnapshot.primaryImageUrl}
                          alt={lot.title}
                          seed={lot.id}
                          className="h-full w-full object-cover"
                          showLabel={false}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-brand-primary">
                            {lot.code}
                          </span>
                          <LotStatusBadge status={lot.status} size="sm" />
                        </div>

                        <h3 className="mt-1.5 line-clamp-2 font-heading text-sm font-semibold leading-5 text-text-primary sm:text-base">
                          {lot.title}
                        </h3>

                        <p className="mt-1 text-[10px] text-text-secondary">
                          {lot.category}
                        </p>

                        <span className="mt-2 inline-flex max-w-full items-center truncate rounded-md border border-border-subtle bg-surface-base px-2 py-1 text-[9px] text-text-secondary">
                          {lot.itemSnapshot.source}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="min-w-0 rounded-xl border border-border-subtle bg-surface-base/70 p-3">
                        <span className="text-[10px] text-text-secondary">
                          Lance atual
                        </span>
                        <p className="mt-1 break-words font-mono text-sm font-bold text-brand-primary">
                          {formatBRL(
                            lot.currentBidCents || lot.startingPriceCents,
                          )}
                        </p>
                        <p className="mt-1 text-[10px] text-text-secondary">
                          {lot.bidCount}{" "}
                          {lot.bidCount === 1 ? "lance" : "lances"}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl border border-border-subtle bg-surface-base/70 p-3">
                        <span className="text-[10px] text-text-secondary">
                          Líder atual
                        </span>
                        <p className="mt-1 truncate font-mono text-xs font-semibold text-brand-primary">
                          {lot.currentLeaderPseudonym || "—"}
                        </p>
                        <p className="mt-1 text-[10px] text-text-secondary">
                          Inicial: {formatBRL(lot.startingPriceCents)}
                        </p>
                      </div>
                    </div>

                    {lot.settlement && (
                      <div className="mt-3 rounded-xl border border-border-subtle bg-white p-3">
                        <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-text-secondary">
                          Resultado do pregão
                        </p>
                        <SettlementResultCell lot={lot} />
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => navigateTo(`/lotes/${lot.id}`)}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-border-strong px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-base"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver sala
                      </button>

                      {lot.status === "SCHEDULED" && (
                        <button
                          onClick={() => setEditLotId(lot.id)}
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-brand-primary/25 bg-brand-primary/5 px-3 py-2 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary/10"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Editar lote
                        </button>
                      )}

                      {lot.status === "SCHEDULED" && (
                        <button
                          onClick={() => publishLot(lot.id)}
                          className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-deep"
                        >
                          <Gavel className="h-3.5 w-3.5" />
                          Abrir pregão ao vivo
                        </button>
                      )}

                      {lot.status === "LIVE" && (
                        <button
                          onClick={() => setCancelModalLotId(lot.id)}
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-semantic-error/30 px-3 py-2 text-xs font-semibold text-semantic-error transition-colors hover:bg-semantic-error-bg"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancelar lote
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1120px] text-left text-xs">
                  <thead className="border-b border-border-subtle bg-surface-base/80 text-[10px] uppercase tracking-wider text-text-secondary">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Lote e item</th>
                      <th className="px-4 py-4 font-semibold">Fonte</th>
                      <th className="px-4 py-4 font-semibold">Estado</th>
                      <th className="px-4 py-4 font-semibold">Lance inicial</th>
                      <th className="px-4 py-4 font-semibold">Lance atual</th>
                      <th className="px-4 py-4 font-semibold">Líder atual</th>
                      <th className="px-4 py-4 font-semibold">Resultado</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Ações operacionais
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border-subtle">
                    {filteredLots.map(lot => (
                      <tr
                        key={lot.id}
                        className="transition-colors hover:bg-surface-base/60"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-surface-base">
                              <ItemImage
                                src={lot.itemSnapshot.primaryImageUrl}
                                alt={lot.title}
                                seed={lot.id}
                                className="h-full w-full object-cover"
                                showLabel={false}
                              />
                            </div>
                            <div className="min-w-0 max-w-[220px]">
                              <span className="font-mono text-[10px] font-bold text-brand-primary">
                                {lot.code}
                              </span>
                              <h3 className="mt-1 truncate font-heading text-xs font-semibold text-text-primary">
                                {lot.title}
                              </h3>
                              <p className="mt-1 truncate text-[10px] text-text-secondary">
                                {lot.category}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-block max-w-32 truncate rounded-md border border-border-subtle bg-surface-base px-2 py-1 text-[10px] text-text-secondary">
                            {lot.itemSnapshot.source}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <LotStatusBadge status={lot.status} size="sm" />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-mono text-text-secondary">
                          {formatBRL(lot.startingPriceCents)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <p className="font-mono font-bold text-brand-primary">
                            {formatBRL(
                              lot.currentBidCents || lot.startingPriceCents,
                            )}
                          </p>
                          <p className="mt-1 text-[10px] text-text-secondary">
                            {lot.bidCount}{" "}
                            {lot.bidCount === 1 ? "lance" : "lances"}
                          </p>
                        </td>

                        <td className="max-w-32 px-4 py-4">
                          <span className="block truncate font-mono text-xs font-medium text-brand-primary">
                            {lot.currentLeaderPseudonym || "—"}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <SettlementResultCell lot={lot} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigateTo(`/lotes/${lot.id}`)}
                              title="Abrir sala pública de lances"
                              className="inline-flex items-center gap-1 rounded-lg border border-border-strong px-2.5 py-2 text-[10px] font-semibold text-text-primary transition-colors hover:bg-surface-base"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Sala
                            </button>

                            {lot.status === "SCHEDULED" && (
                              <button
                                onClick={() => setEditLotId(lot.id)}
                                title="Editar lote antes de abrir o pregão"
                                className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/25 px-2.5 py-2 text-[10px] font-semibold text-brand-primary transition-colors hover:bg-brand-primary/5"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Editar
                              </button>
                            )}

                            {lot.status === "SCHEDULED" && (
                              <button
                                onClick={() => publishLot(lot.id)}
                                title="Abrir pregão imediatamente"
                                className="inline-flex items-center gap-1 rounded-lg bg-brand-primary px-2.5 py-2 text-[10px] font-semibold text-white transition-colors hover:bg-brand-deep"
                              >
                                <Gavel className="h-3.5 w-3.5" />
                                Abrir
                              </button>
                            )}

                            {lot.status === "LIVE" && (
                              <button
                                onClick={() => setCancelModalLotId(lot.id)}
                                title="Cancelar lote com justificativa formal"
                                className="inline-flex items-center gap-1 rounded-lg border border-semantic-error/30 px-2.5 py-2 text-[10px] font-semibold text-semantic-error transition-colors hover:bg-semantic-error-bg"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {filteredLots.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border-subtle bg-surface-base/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-[10px] text-text-secondary sm:text-xs">
                Exibindo{" "}
                <span className="font-semibold text-text-primary">
                  {filteredLots.length}
                </span>{" "}
                {filteredLots.length === 1 ? "lote" : "lotes"}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-text-secondary sm:text-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />
                Dados operacionais da sua conta
              </span>
            </div>
          )}
        </section>

        <div className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-white/70 p-4 sm:items-center sm:p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/8 text-brand-primary">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-primary">
              Operações com rastreabilidade
            </p>
            <p className="mt-1 text-[10px] leading-5 text-text-secondary sm:text-xs">
              Publicações, cancelamentos e resultados seguem as regras
              operacionais da plataforma e os registros de auditoria aplicáveis.
            </p>
          </div>
        </div>
      </div>

      {editLotId && (
        <EditLotModal
          lot={lots.find(item => item.id === editLotId) as Lot}
          onClose={() => setEditLotId(null)}
        />
      )}

      {cancelModalLotId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle bg-semantic-error-bg/50 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-semantic-error-bg text-semantic-error">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-base font-bold text-text-primary sm:text-lg">
                    Cancelar lote em andamento
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    Esta ação exige uma justificativa formal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCancelModalLotId(null);
                  setCancellationReason("");
                }}
                aria-label="Fechar modal"
                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-white hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {selectedCancelLot && (
                <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-base/60 p-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-white">
                    <ItemImage
                      src={selectedCancelLot.itemSnapshot.primaryImageUrl}
                      alt={selectedCancelLot.title}
                      seed={selectedCancelLot.id}
                      className="h-full w-full object-cover"
                      showLabel={false}
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] font-bold text-brand-primary">
                      {selectedCancelLot.code}
                    </span>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-text-primary">
                      {selectedCancelLot.title}
                    </p>
                    <p className="mt-1 text-[10px] text-text-secondary">
                      Lance atual:{" "}
                      {formatBRL(
                        selectedCancelLot.currentBidCents ||
                          selectedCancelLot.startingPriceCents,
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl border border-semantic-error/20 bg-semantic-error-bg/50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-semantic-error" />
                <p className="text-[11px] leading-5 text-text-primary">
                  O cancelamento de um lote ao vivo que já recebeu lances exige
                  justificativa formal. As reservas dos licitantes serão
                  liberadas conforme as regras da plataforma, e o evento será
                  registrado na cadeia de auditoria.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="cancellation-reason"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Motivo do cancelamento
                  <span className="ml-1 text-semantic-error">*</span>
                </label>
                <textarea
                  id="cancellation-reason"
                  rows={4}
                  value={cancellationReason}
                  onChange={e => setCancellationReason(e.target.value)}
                  placeholder="Descreva a justificativa oficial para o cancelamento..."
                  className="w-full resize-y rounded-xl border border-border-strong bg-white p-3 text-xs leading-5 text-text-primary outline-none transition-colors placeholder:text-text-secondary/60 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                />
                <p className="text-[10px] text-text-secondary">
                  Informe um motivo claro e verificável para registro.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-border-subtle pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCancelModalLotId(null);
                    setCancellationReason("");
                  }}
                  className="min-h-11 rounded-xl border border-border-strong px-4 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-base"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={!cancellationReason.trim()}
                  onClick={handleConfirmCancel}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-semantic-error px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <XCircle className="h-4 w-4" />
                  Confirmar cancelamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
