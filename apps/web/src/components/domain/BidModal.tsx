import React, { useState, useEffect } from "react";
import { Lot } from "../../types/auction";
import { useApp } from "../../context/AppContext";
import { ItemImage } from "./ItemImage";
import {
  calculateNextMinimumBid,
  formatBRL,
  validateBidSubmission,
} from "../../logic/auctionRules";
import {
  X,
  ShieldAlert,
  AlertCircle,
  CheckCircle,
  Wallet,
  ArrowRight,
  Info,
  Gavel,
  LoaderCircle,
} from "lucide-react";
import { motion } from "motion/react";

export interface BidModalProps {
  lot: Lot;
  onClose: () => void;
}

type BidSubmissionStep = "idle" | "submitting" | "completed";

export const BidModal: React.FC<BidModalProps> = ({ lot, onClose }) => {
  const {
    currentUser,
    wallet,
    placeBid,
    refreshLots,
    navigateTo,
    setReturnRouteAfterLogin,
  } = useApp();

  const minNextBidCents = calculateNextMinimumBid(lot);

  const [offerCents, setOfferCents] = useState<number>(minNextBidCents);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submissionStep, setSubmissionStep] =
    useState<BidSubmissionStep>("idle");
  const [successResult, setSuccessResult] = useState<{
    antiSniping: boolean;
  } | null>(null);

  const isProcessing = submissionStep === "submitting";

  useEffect(() => {
    if (submissionStep !== "idle") return;

    setOfferCents(minNextBidCents);
    setValidationError(null);
  }, [minNextBidCents, submissionStep]);

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bid-auth-title"
          className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-base shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
        >
          <div className="relative shrink-0 overflow-hidden bg-brand-primary px-5 py-5 text-surface-base sm:px-6">
            <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border border-white/10" />
            <div className="absolute -right-2 -top-4 h-24 w-24 rounded-full border border-white/10" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <span className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-gold">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Acesso à disputa
                </span>

                <h3
                  id="bid-auth-title"
                  className="font-heading text-xl font-semibold tracking-tight"
                >
                  Autenticação Necessária
                </h3>

                <p className="mt-2 max-w-xs text-sm leading-relaxed text-surface-base/75">
                  Entre na plataforma para participar deste leilão.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 p-2 text-surface-base/80 transition-colors hover:bg-white/10 hover:text-surface-base"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-text-secondary">
                Para enviar um lance, você precisa entrar com uma conta de{" "}
                <strong className="font-semibold text-text-primary">
                  Licitante
                </strong>
                .
              </p>

              <div className="rounded-xl border border-border-subtle bg-white p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-text-secondary">Lote</span>
                  <span className="font-mono text-xs font-semibold text-brand-primary">
                    {lot.code}
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {lot.title}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setReturnRouteAfterLogin(`/lotes/${lot.id}`);
                    onClose();
                    navigateTo("/entrar");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-surface-base transition-colors hover:bg-brand-deep"
                >
                  Entrar como Licitante
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-white hover:text-text-primary"
                >
                  Voltar ao lote
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleQuickAdd = (addCents: number) => {
    if (isProcessing) return;

    const updated = Math.max(minNextBidCents, offerCents + addCents);

    setOfferCents(updated);
    setValidationError(null);
  };

  const handleConfirmBid = async () => {
    if (isProcessing || submissionStep === "completed") return;

    setValidationError(null);

    await refreshLots();

    const validation = validateBidSubmission(
      lot,
      currentUser,
      offerCents,
      wallet,
    );

    if (!validation.allowed) {
      setValidationError(validation.reason || "Lance inválido.");
      return;
    }

    setSubmissionStep("submitting");

    try {
      const result = await placeBid(lot.id, offerCents);

      if (!result.success) {
        setValidationError(
          result.error || "Não foi possível registrar o lance.",
        );
        setSubmissionStep("idle");
        return;
      }

      setSuccessResult({
        antiSniping: result.antiSnipingApplied === true,
      });

      setSubmissionStep("completed");
    } catch (error) {
      setValidationError(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao enviar o lance.",
      );

      setSubmissionStep("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 14 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bid-modal-title"
        className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-base shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="relative shrink-0 overflow-hidden bg-brand-primary px-5 py-4 text-surface-base sm:px-6 sm:py-5">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full border border-white/[0.07]" />
          <div className="absolute -right-4 -top-8 h-28 w-28 rounded-full border border-white/[0.07]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-gold">
                  <Gavel className="h-3.5 w-3.5" />
                  Lance eletrônico
                </span>

                <span className="h-1 w-1 rounded-full bg-surface-base/40" />

                <span className="font-mono text-[11px] text-surface-base/65">
                  {lot.code}
                </span>
              </div>

              <h3
                id="bid-modal-title"
                className="font-heading text-lg font-semibold tracking-tight sm:text-xl"
              >
                {successResult
                  ? "Lance Registrado"
                  : isProcessing
                    ? "Enviando Lance..."
                    : "Confirmar seu Lance"}
              </h3>

              <p className="mt-1 text-xs text-surface-base/65">
                {successResult
                  ? "A confirmação foi recebida pela plataforma."
                  : isProcessing
                    ? "Estamos processando sua oferta."
                    : "Revise os dados antes de confirmar sua oferta."}
              </p>
            </div>

            {!isProcessing && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full border border-white/15 p-2 text-surface-base/75 transition-colors hover:bg-white/10 hover:text-surface-base"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative mt-4 h-px bg-white/10">
            <div className="h-px w-16 bg-accent-gold" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <div className="space-y-5">
            {isProcessing ? (
              <div className="space-y-5 py-3">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-border-subtle bg-white">
                    <div className="absolute inset-2 rounded-full border border-accent-gold/40" />
                    <LoaderCircle className="h-7 w-7 animate-spin text-brand-primary" />
                  </div>

                  <div>
                    <h4 className="font-heading text-lg font-semibold text-brand-primary">
                      Enviando seu lance
                    </h4>

                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
                      Aguardando a validação e a confirmação do servidor.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 font-medium text-text-primary">
                      <Gavel className="h-4 w-4 text-accent-gold" />
                      Registrando lance na plataforma
                    </span>

                    <span className="font-mono text-text-secondary">
                      Em andamento
                    </span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
                    <motion.div
                      className="h-full rounded-full bg-linear-to-r from-brand-primary via-semantic-success to-accent-gold"
                      initial={{ width: "5%" }}
                      animate={{ width: "90%" }}
                      transition={{
                        duration: 1.5,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 border-l-2 border-accent-gold bg-white px-3.5 py-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-gold" />
                  <p className="text-xs leading-relaxed text-text-secondary">
                    Não feche esta janela enquanto aguardamos a resposta do
                    servidor.
                  </p>
                </div>
              </div>
            ) : successResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="py-1 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-semantic-success/20 bg-semantic-success-bg">
                    <CheckCircle className="h-8 w-8 text-semantic-success" />
                  </div>

                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-semantic-success">
                    Confirmação recebida
                  </p>

                  <h4 className="mt-2 font-heading text-xl font-semibold tracking-tight text-brand-primary">
                    Lance Registrado com Sucesso!
                  </h4>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                    Seu lance de{" "}
                    <strong className="font-semibold text-text-primary">
                      {formatBRL(offerCents)}
                    </strong>{" "}
                    foi confirmado pelo servidor.
                  </p>

                  <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-text-secondary">
                    A posição na disputa pode mudar se outro licitante enviar um
                    lance superior.
                  </p>

                  {successResult.antiSniping && (
                    <div className="mt-4 flex items-start gap-3 border border-semantic-warning/20 bg-semantic-warning-bg p-3.5 text-left">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-semantic-warning" />
                      <div>
                        <p className="text-xs font-semibold text-semantic-warning">
                          Prazo prorrogado
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-semantic-warning">
                          O prazo do lote foi prorrogado pela regra
                          anti-sniping.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border border-border-subtle bg-white">
                  <div className="border-b border-border-subtle px-4 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                      Resumo da operação
                    </p>
                  </div>

                  <div className="space-y-0 px-4">
                    <div className="flex items-start justify-between gap-4 border-b border-border-subtle/70 py-2.5 text-xs">
                      <span className="shrink-0 text-text-secondary">Lote</span>
                      <span className="max-w-60 truncate text-right font-medium text-text-primary">
                        {lot.title}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4 border-b border-border-subtle/70 py-2.5 text-xs">
                      <span className="shrink-0 text-text-secondary">
                        Identidade pública
                      </span>
                      <span className="text-right font-medium text-brand-primary">
                        Protegida pela plataforma
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2.5 text-xs">
                      <span className="text-text-secondary">
                        Valor do lance
                      </span>
                      <span className="font-mono text-sm font-bold text-brand-primary">
                        {formatBRL(offerCents)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigateTo("/conta/lances");
                    }}
                    className="flex-1 border border-brand-primary px-4 py-3 text-xs font-semibold text-brand-primary transition-colors hover:bg-white"
                  >
                    Ver Meus Lances
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-brand-primary px-4 py-3 text-xs font-semibold text-surface-base transition-colors hover:bg-brand-deep"
                  >
                    Continuar no Lote
                  </button>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-b border-border-subtle pb-4 sm:grid-cols-[80px_minmax(0,1fr)]">
                  <div className="h-20 w-18 overflow-hidden bg-white sm:h-22 sm:w-20">
                    <ItemImage
                      src={lot.itemSnapshot.primaryImageUrl}
                      alt={lot.title}
                      seed={lot.id}
                      className="h-full w-full object-cover"
                      showLabel={false}
                    />
                  </div>

                  <div className="flex min-w-0 flex-col justify-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                      {lot.category}
                    </p>

                    <h4 className="mt-1 line-clamp-2 font-heading text-sm font-semibold leading-snug text-text-primary sm:text-base">
                      {lot.title}
                    </h4>

                    <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-[11px] text-text-secondary">
                        Lance atual
                      </span>

                      <span className="font-mono text-sm font-bold text-brand-primary">
                        {formatBRL(
                          lot.currentBidCents || lot.startingPriceCents,
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                        Sua oferta
                      </p>

                      <h4 className="mt-1 font-heading text-base font-semibold text-text-primary">
                        Defina o valor do lance
                      </h4>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-text-secondary">
                        Mínimo válido
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-brand-primary">
                        {formatBRL(minNextBidCents)}
                      </p>
                    </div>
                  </div>

                  <div className="relative border border-border-subtle bg-white transition-colors focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary/20">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      R$
                    </div>

                    <input
                      type="number"
                      step="50"
                      min={(minNextBidCents / 100).toString()}
                      value={(offerCents / 100).toString()}
                      disabled={isProcessing}
                      aria-label="Valor do lance em reais"
                      onChange={(event) => {
                        const num = Number.parseFloat(event.target.value) || 0;

                        setOfferCents(Math.round(num * 100));
                        setValidationError(null);
                      }}
                      className="w-full bg-transparent py-3 pl-12 pr-4 font-mono text-xl font-bold tracking-tight text-brand-primary outline-hidden disabled:opacity-60 sm:text-2xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                      Aumentar oferta
                    </span>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleQuickAdd(lot.minIncrementCents)}
                        className="border border-border-subtle bg-white px-2 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
                      >
                        +{formatBRL(lot.minIncrementCents)}
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() =>
                          handleQuickAdd(lot.minIncrementCents * 2)
                        }
                        className="border border-border-subtle bg-white px-2 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
                      >
                        +{formatBRL(lot.minIncrementCents * 2)}
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleQuickAdd(500000)}
                        className="border border-border-subtle bg-white px-2 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
                      >
                        +R$ 5.000
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 border border-border-subtle bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-surface-base text-brand-primary">
                      <Wallet className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        Saldo disponível para reserva
                      </p>
                      <p className="mt-0.5 text-[10px] text-text-secondary">
                        Valor disponível na sua carteira
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-base font-bold ${
                      wallet.availableCents >= offerCents
                        ? "text-semantic-success"
                        : "text-semantic-error"
                    }`}
                  >
                    {formatBRL(wallet.availableCents)}
                  </span>
                </div>

                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="flex items-start gap-3 border border-semantic-error/30 bg-semantic-error-bg p-3.5 text-semantic-error"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                    <div>
                      <p className="text-xs font-semibold">
                        Não foi possível confirmar o lance
                      </p>
                      <p className="mt-1 text-xs leading-relaxed">
                        {validationError}
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="border-l-2 border-accent-gold bg-white px-3.5 py-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-accent-gold" />
                    Validação e reserva do lance
                  </p>

                  <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                    Ao confirmar, o servidor validará o valor, as condições do
                    lote e seu saldo disponível. Se o lance for aceito, o valor
                    correspondente será reservado conforme as regras da
                    plataforma. A operação depende da confirmação do servidor.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-border-subtle pt-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-3 text-xs font-medium text-text-secondary transition-colors hover:bg-white hover:text-text-primary sm:min-w-28"
                  >
                    Voltar ao lote
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmBid}
                    disabled={isProcessing}
                    className="flex flex-1 items-center justify-center gap-2 bg-brand-primary px-4 py-3 text-xs font-semibold text-surface-base shadow-sm transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>Confirmar lance de {formatBRL(offerCents)}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
