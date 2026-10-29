import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { apiGet } from "../services/api";
import { formatBRL, formatDateTimeBR } from "../logic/auctionRules";
import { Logo } from "../components/layout/Logo";
import { ItemImage } from "../components/domain/ItemImage";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  FileText,
} from "lucide-react";

interface PublicReceiptResponse {
  verificationCode: string;
  issuedAt: string;
  snapshot: Record<string, unknown>;
  lot: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    sourceUrl: string | null;
    imageAttribution: string | null;
    endsAt: string;
  };
  settlement: {
    status: string;
    amountCents: number;
    settledAt: string | null;
  };
  notice: string;
}

export interface PublicReceiptPageProps {
  verificationCode: string;
}

const str = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;


export const PublicReceiptPage: React.FC<PublicReceiptPageProps> = ({
  verificationCode,
}) => {
  const { navigateTo } = useApp();

  const [receipt, setReceipt] = useState<PublicReceiptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    apiGet<PublicReceiptResponse>(
      `/receipts/${encodeURIComponent(verificationCode)}`,
    )
      .then((result) => {
        if (active) {
          setReceipt(result);
          setError(null);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            "Não encontramos um comprovante com este código. Confira se o link foi copiado por completo.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [verificationCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copie o link:", window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 flex flex-col items-center gap-3 text-text-secondary">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs">Verificando comprovante...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 space-y-5 text-center">
        <ShieldAlert className="w-10 h-10 text-semantic-warning mx-auto" />
        <h1 className="font-heading font-bold text-2xl text-brand-interactive">
          Comprovante não encontrado
        </h1>
        <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
          {error}
        </p>
        <button
          onClick={() => navigateTo("/")}
          className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-deep cursor-pointer"
        >
          Voltar para a vitrine
        </button>
      </div>
    );
  }

  const snapshot = receipt.snapshot ?? {};
  const winnerPseudonym =
    str(snapshot.winnerPseudonym) ?? "Licitante identificado";
  const houseName = str(snapshot.houseName) ?? "Lance Casa de Leilões";
  const settledAt =
    receipt.settlement.settledAt ?? str(snapshot.settledAt) ?? receipt.issuedAt;
  const endedAt = str(snapshot.endedAt) ?? receipt.lot.endsAt;
  const title =
    str(snapshot.lotTitle) ?? receipt.lot.title ?? "Lote sem título";
  const imageUrl = str(snapshot.imageUrl) ?? receipt.lot.imageUrl;
  const amountCents =
    num(snapshot.winningPriceCents) ?? receipt.settlement.amountCents;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <button
        onClick={() => navigateTo("/")}
        className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-interactive cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para a vitrine
      </button>

      <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
        <div className="bg-brand-deep text-brand-on-dark px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent-gold-ink" />
            <span className="text-xs font-semibold">
              Comprovante verificado · {houseName}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-primary/80 text-[11px] flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copiar link
              </>
            )}
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
            <Logo variant="light" size="md" />
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary block">
                Código de verificação
              </span>
              <span className="font-mono font-bold text-sm text-brand-interactive bg-surface-subtle px-2.5 py-1 rounded border border-border-subtle inline-block mt-1">
                {receipt.verificationCode}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="sm:col-span-1">
              <div className="w-full aspect-square rounded-xl border border-border-subtle border-border-subtle overflow-hidden">
                <ItemImage
                  src={imageUrl}
                  alt={title}
                  seed={receipt.verificationCode}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-3 text-xs">
              <div>
                <span className="text-text-secondary block text-[11px]">
                  Item arrematado
                </span>
                <span className="font-heading font-bold text-base text-text-primary">
                  {title}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-text-secondary block text-[11px]">
                    Valor de arremate
                  </span>
                  <span className="font-heading font-bold text-base text-brand-interactive">
                    {formatBRL(amountCents)}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block text-[11px]">
                    Licitante vencedor
                  </span>
                  <span className="font-mono font-semibold text-brand-interactive">
                    {winnerPseudonym}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block text-[11px]">
                    Encerramento
                  </span>
                  <span className="text-text-primary">
                    {formatDateTimeBR(endedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block text-[11px]">
                    Liquidação
                  </span>
                  <span className="text-text-primary">
                    {formatDateTimeBR(settledAt)}
                  </span>
                </div>
              </div>

              <div className="pt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-semantic-success bg-semantic-success-bg px-2.5 py-1 rounded-full border border-semantic-success/20">
                <Check className="w-3.5 h-3.5" />
                {receipt.settlement.status === "COMPLETED"
                  ? "Liquidação simulada concluída"
                  : `Liquidação: ${receipt.settlement.status}`}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-semantic-warning-bg/40 border border-semantic-warning/30 text-[11px] space-y-1">
            <p className="font-semibold text-semantic-warning">
              Aviso legal demonstrativo
            </p>
            <p className="text-text-secondary leading-relaxed">{receipt.notice}</p>
          </div>

          <p className="text-[10px] text-text-secondary leading-relaxed border-t border-border-subtle pt-4">
            Este comprovante é público e não expõe dados pessoais. O histórico
            de eventos deste lote pode ser conferido na página de auditoria, que
            recalcula a cadeia de hashes SHA-256 da plataforma.
          </p>
        </div>
      </div>
    </div>
  );
};

