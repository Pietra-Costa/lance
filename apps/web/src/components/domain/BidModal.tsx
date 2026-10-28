import React, { useState, useEffect } from "react";
import { Lot } from "../../types/auction";
import { useApp } from "../../context/AppContext";
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
  Lock,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E2DDD2] shadow-2xl space-y-4"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-heading font-bold text-lg text-[#123D2F]">
              Autenticação Necessária
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="text-[#68716A] hover:text-[#222923] p-1 rounded-md cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-[#222923]">
            Para enviar um lance, você precisa entrar com uma conta de{" "}
            <strong>Licitante</strong>.
          </p>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setReturnRouteAfterLogin(`/lotes/${lot.id}`);
                onClose();
                navigateTo("/entrar");
              }}
              className="w-full py-2.5 rounded-lg bg-[#123D2F] text-white font-medium text-sm hover:bg-[#0A2B22] transition-colors cursor-pointer"
            >
              Entrar como Licitante
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-lg border border-[#E2DDD2] text-[#68716A] text-sm hover:bg-[#F5F1E7] cursor-pointer"
            >
              Voltar ao lote
            </button>
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

    // Validação preliminar no frontend.
    // O backend continua sendo a autoridade final para aceitar o lance.
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
      // Envia o lance para a API e aguarda a resposta.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden border border-[#E2DDD2] shadow-2xl my-6"
      >
        {/* Cabeçalho */}
        <div className="bg-[#FAF7F2] px-6 py-4 border-b border-[#E2DDD2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#123D2F] text-[#F5F1E7]">
              {lot.code}
            </span>

            <h3 className="font-heading font-bold text-base text-[#123D2F]">
              {successResult
                ? "Lance Registrado"
                : isProcessing
                  ? "Enviando Lance..."
                  : "Confirmar seu Lance"}
            </h3>
          </div>

          {!isProcessing && (
            <button
              type="button"
              onClick={onClose}
              className="text-[#68716A] hover:text-[#222923] p-1 rounded-md cursor-pointer transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Estado de envio */}
          {isProcessing ? (
            <div className="py-8 space-y-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#F5F1E7] text-[#123D2F] flex items-center justify-center">
                  <LoaderCircle className="w-8 h-8 animate-spin" />
                </div>

                <div>
                  <h4 className="font-heading font-bold text-lg text-[#123D2F]">
                    Enviando seu lance
                  </h4>

                  <p className="text-sm text-[#68716A] mt-1">
                    Aguardando a validação e a confirmação do servidor.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#68716A]">
                  <span className="flex items-center gap-2 font-medium text-[#123D2F]">
                    <Gavel className="w-4 h-4 text-[#C8A96A]" />
                    Registrando lance na plataforma
                  </span>

                  <span className="font-mono">Em andamento</span>
                </div>

                <div className="h-2.5 w-full bg-[#E2DDD2] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#123D2F] via-[#1E7E34] to-[#C8A96A] rounded-full"
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

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2] text-center text-xs text-[#68716A]">
                Não feche esta janela enquanto aguardamos a resposta do
                servidor.
              </div>
            </div>
          ) : successResult ? (
            /* Sucesso */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="space-y-5 text-center py-2"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-[#EAF7EE] text-[#1E7E34] flex items-center justify-center shadow-xs">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-heading font-bold text-xl text-[#123D2F]">
                  Lance Registrado com Sucesso!
                </h4>

                <p className="text-sm text-[#68716A] mt-1">
                  Seu lance de{" "}
                  <strong className="text-[#222923]">
                    {formatBRL(offerCents)}
                  </strong>{" "}
                  foi confirmado pelo servidor.
                </p>

                <p className="text-xs text-[#68716A] mt-2">
                  A posição na disputa pode mudar se outro licitante enviar um
                  lance superior.
                </p>

                {successResult.antiSniping && (
                  <div className="mt-3 p-3 bg-[#FEF3C7] rounded-lg text-xs text-[#B45309] font-medium text-left flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      O prazo do lote foi prorrogado pela regra anti-sniping.
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-[#F5F1E7] rounded-xl text-xs text-left space-y-2 border border-[#E2DDD2]">
                <div className="flex justify-between gap-3">
                  <span className="text-[#68716A]">Lote:</span>
                  <span className="font-medium text-[#222923] truncate max-w-[240px]">
                    {lot.title}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-[#68716A]">Identidade pública:</span>
                  <span className="font-medium text-[#123D2F]">
                    Protegida pela plataforma
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-[#68716A]">Valor do lance:</span>
                  <span className="font-semibold text-[#123D2F]">
                    {formatBRL(offerCents)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigateTo("/conta/lances");
                  }}
                  className="flex-1 py-2.5 rounded-lg border border-[#123D2F] text-[#123D2F] font-semibold text-xs hover:bg-[#F5F1E7] cursor-pointer transition-colors"
                >
                  Ver Meus Lances
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg bg-[#123D2F] text-[#F5F1E7] font-semibold text-xs hover:bg-[#0A2B22] cursor-pointer transition-colors"
                >
                  Continuar no Lote
                </button>
              </div>
            </motion.div>
          ) : (
            /* Formulário do lance */
            <>
              {/* Resumo do lote */}
              <div className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2]">
                {lot.itemSnapshot.primaryImageUrl ? (
                  <img
                    src={lot.itemSnapshot.primaryImageUrl}
                    alt={lot.title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-[#E2DDD2] shrink-0 flex items-center justify-center">
                    <Gavel className="w-6 h-6 text-[#68716A]" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#68716A] truncate">
                    {lot.category}
                  </p>

                  <h4 className="text-sm font-heading font-semibold text-[#222923] line-clamp-1">
                    {lot.title}
                  </h4>

                  <p className="text-xs text-[#123D2F] font-bold">
                    Lance atual:{" "}
                    {formatBRL(lot.currentBidCents || lot.startingPriceCents)}
                  </p>
                </div>
              </div>

              {/* Valor do lance */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#68716A]">
                    Próximo lance mínimo válido:
                  </span>

                  <span className="font-bold text-[#123D2F] font-mono">
                    {formatBRL(minNextBidCents)}
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sm font-bold text-[#68716A]">
                    R$
                  </div>

                  <input
                    type="number"
                    step="50"
                    min={(minNextBidCents / 100).toString()}
                    value={(offerCents / 100).toString()}
                    disabled={isProcessing}
                    onChange={event => {
                      const num = Number.parseFloat(event.target.value) || 0;

                      setOfferCents(Math.round(num * 100));
                      setValidationError(null);
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E2DDD2] font-mono text-xl font-bold text-[#123D2F] focus:outline-hidden focus:ring-2 focus:ring-[#123D2F] focus:border-transparent transition-all disabled:opacity-60"
                  />
                </div>

                {/* Atalhos */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-[#68716A] self-center mr-1">
                    Atalhos:
                  </span>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleQuickAdd(lot.minIncrementCents)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-[#E2DDD2] bg-white text-[#222923] hover:border-[#123D2F] font-medium cursor-pointer transition-colors disabled:opacity-50"
                  >
                    +{formatBRL(lot.minIncrementCents)}
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleQuickAdd(lot.minIncrementCents * 2)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-[#E2DDD2] bg-white text-[#222923] hover:border-[#123D2F] font-medium cursor-pointer transition-colors disabled:opacity-50"
                  >
                    +{formatBRL(lot.minIncrementCents * 2)}
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleQuickAdd(500000)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-[#E2DDD2] bg-white text-[#222923] hover:border-[#123D2F] font-medium cursor-pointer transition-colors disabled:opacity-50"
                  >
                    +R$ 5.000
                  </button>
                </div>
              </div>

              {/* Carteira */}
              <div className="p-3 bg-[#F5F1E7] rounded-xl border border-[#E2DDD2] flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2 text-[#68716A]">
                  <Wallet className="w-4 h-4 text-[#123D2F] shrink-0" />
                  <span>Saldo disponível para reserva:</span>
                </div>

                <span
                  className={`font-mono font-bold shrink-0 ${
                    wallet.availableCents >= offerCents
                      ? "text-[#1E7E34]"
                      : "text-[#B91C1C]"
                  }`}
                >
                  {formatBRL(wallet.availableCents)}
                </span>
              </div>

              {/* Erro */}
              {validationError && (
                <div
                  role="alert"
                  className="p-3 bg-[#FEE2E2] border border-[#B91C1C]/30 rounded-xl text-xs text-[#B91C1C] flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Informação sobre a operação */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2]/80 text-[11px] text-[#68716A] space-y-1">
                <p className="font-semibold text-[#222923] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#C8A96A]" />
                  <span>Validação e reserva do lance</span>
                </p>

                <p className="leading-relaxed">
                  Ao confirmar, o servidor validará o valor, as condições do
                  lote e seu saldo disponível. Se o lance for aceito, o valor
                  correspondente será reservado conforme as regras da
                  plataforma. A operação depende da confirmação do servidor.
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl border border-[#E2DDD2] text-[#68716A] font-medium text-xs hover:bg-[#FAF7F2] cursor-pointer transition-colors"
                >
                  Voltar ao lote
                </button>

                <button
                  type="button"
                  onClick={handleConfirmBid}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#123D2F] text-[#F5F1E7] font-semibold text-xs hover:bg-[#0A2B22] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>Confirmar lance de {formatBRL(offerCents)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
