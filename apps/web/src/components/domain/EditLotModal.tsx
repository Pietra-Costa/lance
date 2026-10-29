import React, { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import type { LotEditPatch } from "../../context/AppContext";
import type { Lot } from "../../types/auction";
import { formatBRL, formatDateTimeBR } from "../../logic/auctionRules";
import {
  X,
  Save,
  Loader2,
  Info,
  Gavel,
  CalendarDays,
  Tag,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { motion } from "motion/react";

const LOT_CATEGORIES = [
  "Arte",
  "Esculturas",
  "Objetos de coleção",
  "Mobiliário",
  "Discos e edições musicais",
] as const;

const toLocalInput = (iso: string): string => {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export interface EditLotModalProps {
  lot: Lot;
  onClose: () => void;
}

const inputClassName =
  "w-full rounded-lg border border-border-subtle bg-surface-card px-3.5 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-secondary hover:border-border-strong focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-secondary";

const labelClassName =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary";

const SectionHeading = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) => (
  <div className="mb-4 flex items-start gap-3">
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-primary/[0.07] text-brand-interactive">
      {icon}
    </div>
    <div>
      <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
      {description && (
        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
          {description}
        </p>
      )}
    </div>
  </div>
);

export const EditLotModal: React.FC<EditLotModalProps> = ({ lot, onClose }) => {
  const { updateLot } = useApp();

  const [category, setCategory] = useState(lot.category || "");
  const [startingPrice, setStartingPrice] = useState(
    (lot.startingPriceCents / 100).toFixed(2).replace(".", ","),
  );
  const [minIncrement, setMinIncrement] = useState(
    (lot.minIncrementCents / 100).toFixed(2).replace(".", ","),
  );
  const [startsAt, setStartsAt] = useState(toLocalInput(lot.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(lot.endsAt));
  const [specialConditions, setSpecialConditions] = useState(
    lot.specialConditions ?? "",
  );
  const [sellerNotes, setSellerNotes] = useState(lot.sellerNotes ?? "");

  const [medium, setMedium] = useState(lot.itemSnapshot.medium ?? "");
  const [dimensions, setDimensions] = useState(
    lot.itemSnapshot.dimensions ?? "",
  );
  const [attribution, setAttribution] = useState(
    lot.itemSnapshot.creator ?? "",
  );
  const [period, setPeriod] = useState(lot.itemSnapshot.dateOrYear ?? "");
  const [imageConditions, setImageConditions] = useState(
    (
      lot.itemSnapshot as unknown as {
        imageConditions?: string | null;
      }
    ).imageConditions ?? "",
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLocked = lot.status !== "SCHEDULED";

  const parseMoney = (value: string): number | null => {
    const parsed = Number(value.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return Math.round(parsed * 100);
  };

  const handleSave = async () => {
    setError(null);

    const startingPriceCents = parseMoney(startingPrice);
    const minIncrementCents = parseMoney(minIncrement);

    if (startingPriceCents === null || minIncrementCents === null) {
      setError("Informe valores válidos para o lance inicial e o incremento.");
      return;
    }

    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError("Informe datas válidas de início e encerramento.");
      return;
    }

    if (endDate <= startDate) {
      setError("O encerramento deve ser posterior ao início.");
      return;
    }

    const patch: LotEditPatch = {
      category: category || undefined,
      startingPriceCents,
      minIncrementCents,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
      specialConditions,
      sellerNotes,
      medium,
      dimensions,
      attribution,
      period,
      imageConditions,
    };

    try {
      setSubmitting(true);
      await updateLot(lot.id, patch);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar as alterações.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#101711]/65 p-0 backdrop-blur-sm sm:p-5"
      onClick={event => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.985 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-modal="true"
        aria-label="Editar lote"
        className="flex max-h-dvh w-full flex-col overflow-hidden bg-surface-subtle shadow-2xl sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl sm:border sm:border-invert"
      >
        {/* Header */}
        <header className="relative shrink-0 overflow-hidden bg-brand-deep px-5 py-5 text-brand-on-dark sm:px-7">
          <div className="pointer-events-none absolute -right-8 -top-16 h-48 w-48 rounded-full border border-border-subtle border-white/[0.07]" />
          <div className="pointer-events-none absolute -right-1 -top-9 h-32 w-32 rounded-full border border-border-subtle border-white/[0.07]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-gold-ink">
                  Gestão de leilões
                </span>
                <span className="text-white/25">/</span>
                <span className="font-mono text-[10px] tracking-wider text-white/60">
                  {lot.code}
                </span>
              </div>

              <h3 className="font-heading text-xl font-medium leading-snug sm:text-2xl">
                Editar lote
              </h3>
              <p className="mt-1 max-w-xl truncate text-xs text-white/60 sm:text-sm">
                {lot.title}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-subtle border-invert text-white/75 transition hover:bg-surface-card/10 hover:text-white disabled:opacity-40"
              aria-label="Fechar edição"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-invert pt-4 text-[11px] text-white/65">
            <span className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isLocked ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
              {isLocked ? "Edição bloqueada" : "Lote agendado"}
            </span>
            <span className="flex items-center gap-1.5">
              <Gavel className="h-3.5 w-3.5" />
              Lance atual: {formatBRL(lot.currentBidCents)}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              Encerra em {formatDateTimeBR(lot.endsAt)}
            </span>
          </div>
        </header>

        {/* Form content */}
        <main className="flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
          {isLocked ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-amber-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Edição indisponível</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-800/80">
                  Este lote já entrou ao vivo. Os campos estão bloqueados; o
                  encerramento segue as regras de extensão anti-sniping.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-semantic-success/25 bg-semantic-success-bg px-4 py-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-interactive" />
              <p className="text-xs leading-relaxed text-semantic-success">
                As alterações serão registradas no histórico de auditoria do
                lote, com os valores anteriores e atualizados.
              </p>
            </div>
          )}

          {/* General information */}
          <section>
            <SectionHeading
              icon={<Tag className="h-4 w-4" />}
              title="Informações do lote"
              description="Classificação, valores e período do leilão."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-category" className={labelClassName}>
                  Categoria
                </label>
                <select
                  id="edit-category"
                  value={category}
                  disabled={isLocked}
                  onChange={event => setCategory(event.target.value)}
                  className={inputClassName}
                >
                  <option value="">Sem categoria</option>
                  {LOT_CATEGORIES.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-period" className={labelClassName}>
                  Período / ano
                </label>
                <input
                  id="edit-period"
                  value={period}
                  disabled={isLocked}
                  onChange={event => setPeriod(event.target.value)}
                  placeholder="Ex.: 1889"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
                <label htmlFor="edit-starting" className={labelClassName}>
                  Lance inicial
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-secondary">R$</span>
                  <input
                    id="edit-starting"
                    inputMode="decimal"
                    value={startingPrice}
                    disabled={isLocked}
                    onChange={event => setStartingPrice(event.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent py-1 font-mono text-xl font-semibold text-brand-interactive outline-none placeholder:text-text-secondary disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-card p-4">
                <label htmlFor="edit-increment" className={labelClassName}>
                  Incremento mínimo
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-secondary">R$</span>
                  <input
                    id="edit-increment"
                    inputMode="decimal"
                    value={minIncrement}
                    disabled={isLocked}
                    onChange={event => setMinIncrement(event.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent py-1 font-mono text-xl font-semibold text-brand-interactive outline-none placeholder:text-text-secondary disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-surface-muted" />

          {/* Schedule */}
          <section>
            <SectionHeading
              icon={<CalendarDays className="h-4 w-4" />}
              title="Agenda do leilão"
              description="Defina quando os lances poderão ser realizados."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-starts" className={labelClassName}>
                  Data e hora de início
                </label>
                <input
                  id="edit-starts"
                  type="datetime-local"
                  value={startsAt}
                  disabled={isLocked}
                  onChange={event => setStartsAt(event.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="edit-ends" className={labelClassName}>
                  Data e hora de encerramento
                </label>
                <input
                  id="edit-ends"
                  type="datetime-local"
                  value={endsAt}
                  disabled={isLocked}
                  onChange={event => setEndsAt(event.target.value)}
                  className={inputClassName}
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-surface-muted" />

          {/* Item technical details */}
          <section>
            <SectionHeading
              icon={<ImageIcon className="h-4 w-4" />}
              title="Ficha técnica"
              description="Detalhes de identificação e conservação da peça."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-medium" className={labelClassName}>
                  Material / técnica
                </label>
                <input
                  id="edit-medium"
                  value={medium}
                  disabled={isLocked}
                  onChange={event => setMedium(event.target.value)}
                  placeholder="Ex.: Óleo sobre tela"
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="edit-dimensions" className={labelClassName}>
                  Dimensões
                </label>
                <input
                  id="edit-dimensions"
                  value={dimensions}
                  disabled={isLocked}
                  onChange={event => setDimensions(event.target.value)}
                  placeholder="Ex.: 60 × 80 cm"
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="edit-attribution" className={labelClassName}>
                  Autor / atribuição
                </label>
                <input
                  id="edit-attribution"
                  value={attribution}
                  disabled={isLocked}
                  onChange={event => setAttribution(event.target.value)}
                  placeholder="Nome do artista ou atribuição"
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="edit-image-conditions"
                  className={labelClassName}
                >
                  Condições de uso da imagem
                </label>
                <input
                  id="edit-image-conditions"
                  value={imageConditions}
                  disabled={isLocked}
                  onChange={event => setImageConditions(event.target.value)}
                  placeholder="Ex.: Domínio público"
                  className={inputClassName}
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-surface-muted" />

          {/* Notes */}
          <section>
            <SectionHeading
              icon={<FileText className="h-4 w-4" />}
              title="Observações e condições"
              description="Informações adicionais para os participantes do leilão."
            />

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-conditions" className={labelClassName}>
                  Condições especiais
                </label>
                <textarea
                  id="edit-conditions"
                  rows={3}
                  value={specialConditions}
                  disabled={isLocked}
                  onChange={event => setSpecialConditions(event.target.value)}
                  placeholder="Informe condições específicas de venda, retirada ou entrega..."
                  className={`${inputClassName} resize-y`}
                />
              </div>

              <div>
                <label htmlFor="edit-notes" className={labelClassName}>
                  Observações do leiloeiro
                </label>
                <textarea
                  id="edit-notes"
                  rows={3}
                  value={sellerNotes}
                  disabled={isLocked}
                  onChange={event => setSellerNotes(event.target.value)}
                  placeholder="Anotações adicionais sobre o lote..."
                  className={`${inputClassName} resize-y`}
                />
              </div>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <p className="font-semibold">Não foi possível salvar</p>
              <p className="mt-1 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <p className="border-t border-surface-muted pt-4 text-[11px] leading-relaxed text-text-secondary">
            As modificações ficam vinculadas ao lote{" "}
            <span className="font-mono font-semibold text-text-primary">
              {lot.code}
            </span>{" "}
            e seguem as regras de edição da plataforma.
          </p>
        </main>

        {/* Fixed footer */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border-subtle bg-surface-card px-5 py-4 sm:px-7">
          <p className="hidden text-[11px] text-text-secondary sm:block">
            {isLocked
              ? "Lote bloqueado para edição"
              : "Revise os dados antes de salvar"}
          </p>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-border-subtle border-border-subtle px-4 py-2.5 text-xs font-semibold text-text-primary transition hover:bg-surface-muted disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={submitting || isLocked}
              className="flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar alterações
                </>
              )}
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};
