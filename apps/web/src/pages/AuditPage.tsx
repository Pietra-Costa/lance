import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { formatDateTimeBR } from "../logic/auctionRules";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  XCircle,
  ArrowDown,
  Fingerprint,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiGet } from "../services/api";

const PAGE_SIZE = 10;

type AuditVerification = {
  valid: boolean;
  checkedEvents: number;
  invalidSequence?: string;
  lastHash?: string | null;
};

export const AuditPage: React.FC = () => {
  const { auditEvents } = useApp();
  const [filterQuery, setFilterQuery] = useState("");
  const [page, setPage] = useState(1);
  const [verification, setVerification] = useState<AuditVerification | null>(
    null,
  );
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [verificationError, setVerificationError] = useState(false);

  useEffect(() => {
    let active = true;

    apiGet<AuditVerification>("/audit/verify")
      .then((result) => {
        if (active) {
          setVerification(result);
          setVerificationError(false);
        }
      })
      .catch((error) => {
        console.error(
          "Não foi possível verificar a cadeia de auditoria:",
          error,
        );

        if (active) {
          setVerificationError(true);
        }
      })
      .finally(() => {
        if (active) {
          setVerificationLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredEvents = auditEvents.filter((ev) => {
    if (!filterQuery.trim()) return true;

    const query = filterQuery.toLowerCase();

    return (
      ev.eventType.toLowerCase().includes(query) ||
      ev.description.toLowerCase().includes(query) ||
      (ev.lotCode && ev.lotCode.toLowerCase().includes(query)) ||
      ev.hash.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));

  const safePage = Math.min(page, totalPages);

  const pagedEvents = filteredEvents.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const eventLabel = (eventType: string) =>
    ({
      LOT_CREATED: "Leilão criado",
      LOT_LIVE: "Leilão aberto",
      BID_PLACED: "Lance registrado",
      AUCTION_ENDED: "Leilão finalizado",
      AUCTION_WON: "Leilão vencido",
      LOT_CANCELED: "Leilão cancelado",
      SETTLEMENT_COMPLETED: "Liquidação concluída",
    })[eventType] ?? eventType;

  const status = verificationLoading
    ? {
        label: "Verificando integridade",
        description: "Consultando a cadeia de registros",
        icon: Clock,
        color: "text-accent-gold",
      }
    : verificationError || !verification
      ? {
          label: "Verificação indisponível",
          description: "Não foi possível confirmar a integridade",
          icon: XCircle,
          color: "text-semantic-warning",
        }
      : verification.valid
        ? {
            label: "Cadeia íntegra",
            description: `${verification.checkedEvents} eventos verificados`,
            icon: CheckCircle2,
            color: "text-semantic-success",
          }
        : {
            label: "Falha de integridade",
            description: verification.invalidSequence
              ? `Falha na sequência ${verification.invalidSequence}`
              : "Foi identificada uma inconsistência",
            icon: XCircle,
            color: "text-semantic-warning",
          };

  const StatusIcon = status.icon;

  return (
    <main className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <header className="relative overflow-hidden border-b border-border-subtle pb-10 lg:pb-14">
          <img
            src="/assets/white.png"
            alt=""
            aria-hidden="true"
            className="absolute -top-25 -right-34.5 w-64 xl:w-100 h-auto object-contain opacity-[0.06] select-none pointer-events-none hidden lg:block"
          />

          <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_300px] lg:items-end lg:gap-16">
            <div>
              <div className="mb-7 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-gold">
                  Transparência pública
                </span>
                <span className="h-px w-8 bg-border-strong" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                  SHA-256 · Registro verificável
                </span>
              </div>

              <h1 className="max-w-3xl font-heading text-4xl font-bold leading-[1.08] tracking-tight text-brand-primary sm:text-5xl lg:text-6xl">
                Cada evento.
                <br />
                <span className="text-text-primary">
                  Um histórico verificável.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
                Trilha de Auditoria Criptográfica. Os eventos registrados são
                encadeados por hashes SHA-256. A verificação da cadeia confere
                os hashes dos registros, a continuidade entre eventos e a
                correspondência com o último hash registrado. A integridade é
                verificada pela API da plataforma.
              </p>
            </div>

            <div className="relative border-l-2 border-brand-primary py-1 pl-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary">
                Estado da verificação
              </span>

              <div className="mt-4 flex items-start gap-3">
                <StatusIcon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${status.color}`}
                  aria-hidden="true"
                />
                <div>
                  <p className="font-heading text-lg font-bold text-brand-primary">
                    {status.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    {status.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-border-subtle pt-4 text-xs text-text-secondary">
                <ShieldCheck
                  className="h-4 w-4 text-accent-gold"
                  aria-hidden="true"
                />
                Verificação criptográfica SHA-256
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border-subtle pt-5">
            <div className="flex items-center gap-3">
              <Fingerprint
                className="h-5 w-5 text-brand-primary"
                aria-hidden="true"
              />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                  Método
                </p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  Encadeamento criptográfico
                </p>
              </div>
            </div>

            <div className="hidden h-8 w-px bg-border-subtle sm:block" />

            <div className="flex items-center gap-3">
              <Database
                className="h-5 w-5 text-brand-primary"
                aria-hidden="true"
              />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                  Registros
                </p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {auditEvents.length} eventos disponíveis
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Consulta dos registros */}
        <section className="py-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-gold">
                Consulta pública
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-brand-primary sm:text-3xl">
                Histórico de eventos
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Pesquise registros por lote, evento ou hash.
              </p>
            </div>

            <div className="w-full sm:max-w-md">
              <label
                htmlFor="audit-search"
                className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-text-secondary"
              >
                Buscar nos registros
              </label>

              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
                  aria-hidden="true"
                />

                <input
                  id="audit-search"
                  type="text"
                  value={filterQuery}
                  onChange={(event) => {
                    setFilterQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Lote, tipo de evento ou hash..."
                  className="w-full border-0 border-b border-border-strong bg-transparent py-3 pl-7 pr-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary/70 focus:border-brand-primary focus:ring-0"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-border-subtle py-3">
            <p className="text-xs text-text-secondary">
              Exibindo{" "}
              <strong className="text-text-primary">
                {pagedEvents.length}
              </strong>{" "}
              de{" "}
              <strong className="text-text-primary">
                {filteredEvents.length}
              </strong>{" "}
              registros
            </p>

            <span className="font-mono text-[10px] uppercase tracking-wider text-text-secondary">
              Ordem de sequência
            </span>
          </div>
        </section>

        {/* Linha do tempo */}
        <section aria-label="Eventos de auditoria">
          {pagedEvents.length > 0 ? (
            <div>
              {pagedEvents.map((ev) => {
                const canceled = ev.eventType === "LOT_CANCELED";

                return (
                  <article
                    key={ev.sequence}
                    className={`relative border-b py-7 transition-colors sm:py-9 ${
                      canceled
                        ? "border-semantic-warning/40"
                        : "border-border-subtle"
                    }`}
                  >
                    <div className="grid gap-5 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-7">
                      <div className="flex items-start gap-3 sm:block">
                        <span
                          className={`font-mono text-2xl font-semibold tracking-tight sm:text-3xl ${
                            canceled
                              ? "text-semantic-warning"
                              : "text-brand-primary"
                          }`}
                        >
                          {String(ev.sequence).padStart(2, "0")}
                        </span>

                        <span className="mt-2 block font-mono text-[9px] uppercase tracking-wider text-text-secondary sm:mt-3">
                          Sequência
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                              <h3
                                className={`font-heading text-lg font-bold sm:text-xl ${
                                  canceled
                                    ? "text-semantic-warning"
                                    : "text-brand-primary"
                                }`}
                              >
                                {eventLabel(ev.eventType)}
                              </h3>

                              {ev.lotCode && (
                                <span className="border border-border-subtle px-2 py-1 font-mono text-[10px] text-text-primary">
                                  {ev.lotCode}
                                </span>
                              )}

                              {canceled && (
                                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-semantic-warning">
                                  <XCircle
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  />
                                  Cancelado
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-xs text-text-secondary">
                              {formatDateTimeBR(ev.timestamp)}
                            </p>
                          </div>

                          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
                            {canceled
                              ? "Evento de atenção"
                              : "Registro público"}
                          </span>
                        </div>

                        <p className="mt-5 max-w-3xl text-sm leading-7 text-text-primary">
                          {ev.description}
                        </p>

                        <details className="group mt-6">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 border-y border-border-subtle py-3 text-xs font-semibold text-brand-primary transition-colors hover:text-accent-gold [&::-webkit-details-marker]:hidden">
                            <span className="flex items-center gap-2">
                              <Database
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Dados públicos e hashes do registro
                            </span>

                            <ArrowDown
                              className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                              aria-hidden="true"
                            />
                          </summary>

                          <div className="space-y-6 py-5">
                            <div>
                              <div className="mb-3 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 bg-accent-gold" />
                                <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
                                  Dados públicos do evento
                                </h4>
                              </div>

                              <pre className="overflow-x-auto border-l-2 border-border-strong bg-surface-base py-3 pl-4 font-mono text-[11px] leading-6 text-text-primary whitespace-pre-wrap wrap-break-word">
                                {JSON.stringify(ev.payloadSummary, null, 2)}
                              </pre>
                            </div>

                            <div className="grid gap-5 lg:grid-cols-2">
                              <div className="min-w-0">
                                <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
                                  Hash anterior · prevHash
                                </h4>

                                <p className="break-all border-l-2 border-border-strong py-2 pl-4 font-mono text-[11px] leading-6 text-text-secondary">
                                  {ev.prevHash}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary">
                                  Hash deste registro
                                </h4>

                                <p className="break-all border-l-2 border-brand-primary py-2 pl-4 font-mono text-[11px] font-semibold leading-6 text-brand-primary">
                                  {ev.hash}
                                </p>
                              </div>
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="border-y border-border-subtle py-16 text-center">
              <Search
                className="mx-auto h-6 w-6 text-text-secondary"
                aria-hidden="true"
              />
              <h3 className="mt-4 font-heading text-lg font-bold text-brand-primary">
                Nenhum evento encontrado
              </h3>
              <p className="mt-2 text-sm text-text-secondary">
                Não há registros correspondentes à sua busca.
              </p>

              {filterQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterQuery("");
                    setPage(1);
                  }}
                  className="mt-5 text-xs font-semibold text-brand-primary underline underline-offset-4 hover:text-accent-gold"
                >
                  Limpar busca
                </button>
              )}
            </div>
          )}
        </section>

        {/* Paginação */}
        {totalPages > 1 && (
          <nav
            aria-label="Paginação do histórico de auditoria"
            className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle py-6"
          >
            <span className="font-mono text-xs text-text-secondary">
              Página {safePage} de {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage <= 1}
                className="inline-flex items-center gap-2 border border-border-strong px-4 py-2.5 text-xs font-semibold text-brand-primary transition-colors hover:border-brand-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Anterior
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={safePage >= totalPages}
                className="inline-flex items-center gap-2 border border-brand-primary bg-brand-primary px-4 py-2.5 text-xs font-semibold text-surface-base transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40"
              >
                Próxima
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        )}

        <footer className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck
              className="h-5 w-5 text-accent-gold"
              aria-hidden="true"
            />
            <p className="text-xs leading-5 text-text-secondary">
              Integridade conferida pela API da plataforma.
            </p>
          </div>

          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-secondary">
            Lance · Transparência e rastreabilidade
          </span>
        </footer>
      </div>
    </main>
  );
};
