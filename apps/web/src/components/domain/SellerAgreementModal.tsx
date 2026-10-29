import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  ShieldAlert,
  CheckCircle2,
  FileText,
  ArrowRight,
  Lock,
  Stamp,
  Check,
} from "lucide-react";
import { Logo } from "../layout/Logo";

export interface SellerAgreementModalProps {
  onClose?: () => void;
}

export const SellerAgreementModal: React.FC<SellerAgreementModalProps> = ({
  onClose,
}) => {
  const { currentUser, acceptSellerAgreement } = useApp();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);
  const [isStamping, setIsStamping] = useState(false);
  const stampTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setHasScrolledToBottom(true);
    }
  };

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;

      if (stampTimeout.current) {
        clearTimeout(stampTimeout.current);
      }
    };
  }, []);

  const handleAccept = () => {
    if (!confirmedCheckbox || isStamping) return;

    setIsStamping(true);

    stampTimeout.current = setTimeout(() => {
      acceptSellerAgreement();
      onClose?.();
    }, 1100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#101812]/75 p-0 backdrop-blur-sm sm:p-5">
      <style>
        {`
          @keyframes contract-enter {
            from {
              opacity: 0;
              transform: translateY(18px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes stamp-impact {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) rotate(-18deg) scale(2.5);
            }
            45% {
              opacity: 1;
              transform: translate(-50%, -50%) rotate(-10deg) scale(0.88);
            }
            62% {
              transform: translate(-50%, -50%) rotate(-12deg) scale(1.08);
            }
            78% {
              transform: translate(-50%, -50%) rotate(-10deg) scale(0.97);
            }
            100% {
              opacity: 1;
              transform: translate(-50%, -50%) rotate(-10deg) scale(1);
            }
          }

          @keyframes stamp-ink {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          .agreement-enter {
            animation: contract-enter 400ms cubic-bezier(.2,.7,.2,1) both;
          }

          .agreement-stamp {
            animation: stamp-impact 650ms cubic-bezier(.2,.8,.2,1) both;
          }

          .agreement-stamp-ink {
            animation: stamp-ink 250ms ease-out 300ms both;
          }

          @media (prefers-reduced-motion: reduce) {
            .agreement-enter,
            .agreement-stamp,
            .agreement-stamp-ink {
              animation: none !important;
            }
          }
        `}
      </style>

      <div className="agreement-enter relative flex max-h-dvh w-full flex-col overflow-hidden border border-[#D9CFBA] bg-[#F8F5EE] shadow-[0_30px_100px_rgba(0,0,0,0.35)] sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl">
        <div className="relative shrink-0 border-b border-[#D9CFBA] bg-brand-deep px-5 py-5 text-surface-base sm:px-8 sm:py-6">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-accent-gold/10 to-transparent" />

          <div className="relative flex items-center justify-between gap-3">
            <Logo variant="dark" size="sm" />

            <div className="flex items-center gap-2 rounded border border-accent-gold/30 bg-black/10 px-2.5 py-1.5">
              <FileText className="h-3.5 w-3.5 text-accent-gold" />
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent-gold sm:text-[10px]">
                Documento oficial
              </span>
            </div>
          </div>

          <div className="relative mt-5 flex items-start gap-3 sm:mt-7">
            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent-gold/25 bg-white/5 text-accent-gold">
              <ShieldAlert className="h-4 w-4" />
            </div>

            <div>
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-accent-gold/80">
                Habilitação de leiloeiro
              </p>
              <h2 className="max-w-xl font-heading text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                Termo de Responsabilidade e Condução de Pregão
              </h2>
              <p className="mt-2 max-w-xl text-xs leading-5 text-surface-base/65 sm:text-sm">
                Leia as condições de habilitação para criação de lotes,
                importação de catálogo e abertura de leilões.
              </p>
            </div>
          </div>

          <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-surface-base/45">
              LANCE · TERMO DO LEILOEIRO
            </span>
            <span className="font-mono text-[9px] text-surface-base/45">
              VERSÃO 1.0
            </span>
          </div>
        </div>

        <div
          onScroll={handleScroll}
          className="relative min-h-0 flex-1 overflow-y-auto bg-[#F8F5EE] px-5 py-5 font-body text-xs leading-6 text-[#393D35] sm:px-9 sm:py-7 sm:text-[13px]"
        >
          <div className="pointer-events-none absolute inset-y-0 left-3 w-px bg-[#E7DFD0] sm:left-5" />

          <div className="relative mb-6 border border-[#DED5C4] bg-white/70 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Lock className="mt-1 h-4 w-4 shrink-0 text-brand-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                  Identificação do responsável
                </p>
                <p className="mt-1 break-words font-heading text-base font-semibold text-brand-primary sm:text-lg">
                  {currentUser?.name || "Leiloeiro autenticado"}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-text-secondary">
                  Usuário autenticado na plataforma Lance
                </p>
              </div>
              <div className="hidden border border-[#D9CFBA] px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-text-secondary sm:block">
                Identificado
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#D9CFBA]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-secondary">
              Condições de responsabilidade
            </span>
            <span className="h-px flex-1 bg-[#D9CFBA]" />
          </div>

          <section className="mb-6">
            <h3 className="mb-2 font-heading text-sm font-bold text-brand-primary sm:text-base">
              01. Objeto e exclusividade de papéis
            </h3>
            <p>
              O presente termo estabelece as diretrizes para atuação como
              Leiloeiro na plataforma Lance. Por regra estrita de negócio, o
              usuário habilitado neste papel está impedido de participar ou
              emitir lances como licitante nos leilões disponibilizados nesta
              mesma conta.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 font-heading text-sm font-bold text-brand-primary sm:text-base">
              02. Importação e snapshots imutáveis
            </h3>
            <p>
              Ao utilizar adaptadores de dados externos (The Metropolitan Museum
              of Art, Art Institute of Chicago e MusicBrainz), os metadados e
              imagens selecionados serão consolidados em um registro local
              imutável (LotItemSnapshot). Eventual alteração ou
              indisponibilidade nas APIs de origem não afeta os lotes
              publicados.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 font-heading text-sm font-bold text-brand-primary sm:text-base">
              03. Verificação de direitos e procedência de imagens
            </h3>
            <p>
              O leiloeiro declara ciência de que a mera disponibilidade de uma
              imagem ou metadado em repositórios abertos não constitui licença
              comercial irrestrita ou certificação material. É obrigação do
              leiloeiro revisar os metadados de licença e procedência antes de
              publicar qualquer lote.
            </p>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 font-heading text-sm font-bold text-brand-primary sm:text-base">
              04. Regras de encerramento e anti-sniping
            </h3>
            <p>
              Todos os lotes sob sua condução observarão a regra de anti-sniping
              (prorrogação automática em 2 minutos para lances válidos recebidos
              na janela final de 2 minutos). Cancelamentos de lotes em andamento
              com lances ativos exigem justificativa formal registrada na trilha
              de auditoria criptográfica pública.
            </p>
          </section>

          <div className="border-l-2 border-accent-gold bg-[#EEE7D8] p-4 text-[#514833]">
            <div className="mb-2 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-[#927642]" />
              <strong className="text-[10px] uppercase tracking-[0.12em]">
                Registro de auditoria
              </strong>
            </div>
            <p className="text-xs leading-5">
              O aceite deste termo gera um registro de auditoria com hash
              criptográfico associado ao seu ID e timestamp imutável no banco de
              dados.
            </p>
          </div>

          <div className="mt-7 flex items-center gap-3 border-t border-dashed border-[#D9CFBA] pt-4">
            <FileText className="h-4 w-4 shrink-0 text-text-secondary/60" />
            <p className="text-[10px] leading-4 text-text-secondary">
              A confirmação eletrônica registra sua concordância com as
              condições descritas neste documento.
            </p>
          </div>

          {isStamping && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-[#F8F5EE]/15">
              <div className="agreement-stamp relative -rotate-12 border-[3px] border-[#A7352A] px-5 py-3 text-center text-[#A7352A] opacity-0 sm:px-8 sm:py-4">
                <div className="agreement-stamp-ink absolute inset-1 border border-[#A7352A]/70" />
                <div className="agreement-stamp-ink relative flex items-center justify-center gap-2">
                  <Check className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={3} />
                  <span className="font-mono text-lg font-black tracking-[0.12em] sm:text-2xl">
                    ASSINADO
                  </span>
                </div>
                <p className="agreement-stamp-ink relative mt-1 font-mono text-[8px] font-bold tracking-[0.2em] sm:text-[10px]">
                  TERMO DE RESPONSABILIDADE · LANCE
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-30 shrink-0 border-t border-[#D9CFBA] bg-white px-5 py-4 sm:px-8 sm:py-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmedCheckbox}
              onChange={e => setConfirmedCheckbox(e.target.checked)}
              disabled={isStamping}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong accent-brand-primary focus:ring-brand-primary"
            />
            <span className="text-xs leading-5 text-text-primary">
              Li e concordo integralmente com os termos de responsabilidade
              técnica, exclusividade de papéis e integridade do pregão na
              plataforma Lance.
            </span>
          </label>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                disabled={isStamping}
                className="rounded-lg px-4 py-3 text-xs font-medium text-text-secondary transition-colors hover:bg-[#F8F5EE] disabled:opacity-40 sm:py-3"
              >
                Decidir depois
              </button>
            ) : (
              <span className="hidden sm:block" />
            )}

            <button
              type="button"
              onClick={handleAccept}
              disabled={!confirmedCheckbox || isStamping}
              className="group flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-3 text-xs font-semibold text-white shadow-md shadow-brand-primary/15 transition-all duration-200 hover:bg-brand-deep hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 sm:flex-initial sm:min-w-64"
            >
              {isStamping ? (
                <>
                  <Stamp className="h-4 w-4 animate-pulse text-accent-gold" />
                  <span>Formalizando documento...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-accent-gold" />
                  <span>Formalizar e assinar termo</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-[9px] text-text-secondary/70">
            <Lock className="h-3 w-3" />
            <span>
              {hasScrolledToBottom
                ? "Documento lido · Confirmação eletrônica"
                : "Confirmação eletrônica · Registro de auditoria"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
