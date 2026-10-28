import React from 'react';
import { Receipt } from '../../types/auction';
import { formatBRL, formatDateTimeBR } from '../../logic/auctionRules';
import { Logo } from '../layout/Logo';
import { X, Printer, ShieldCheck, QrCode, CheckCircle2, FileText, Download } from 'lucide-react';

import { motion } from 'motion/react';

export interface ReceiptModalProps {
  receipt: Receipt;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden border border-[#E2DDD2] shadow-2xl my-8"
      >
        {/* Top Control Bar */}
        <div className="bg-[#0A2B22] text-[#F5F1E7] px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C8A96A]" />
            <span className="font-heading font-medium text-xs tracking-wide">
              Comprovante Oficial de Arremate · Lance
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 rounded bg-[#123D2F] hover:bg-[#123D2F]/80 text-xs text-[#F5F1E7] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Layout */}
        <div className="p-8 sm:p-10 bg-[#FAF7F2] relative border-8 border-double border-[#E2DDD2] m-4 rounded-xl">
          {/* Subtle Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
            <span className="font-heading font-black text-9xl tracking-tighter text-[#123D2F]">
              LANCE
            </span>
          </div>

          {/* Certificate Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD2]">
            <Logo variant="light" size="lg" />
            <div className="text-right">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#68716A] block">
                CÓDIGO DE AUTENTICIDADE
              </span>
              <span className="font-mono font-bold text-sm text-[#123D2F] bg-white px-2.5 py-1 rounded border border-[#E2DDD2]">
                {receipt.verificationCode}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="my-6 text-center space-y-1">
            <h2 className="font-heading font-bold text-2xl text-[#123D2F] tracking-tight">
              Certificado de Arrematação Demonstrativo
            </h2>
            <p className="text-xs text-[#68716A]">
              Pregão Eletrônico Homologado · Registro de Arremate em Plataforma Digital
            </p>
          </div>

          {/* Details Table */}
          <div className="bg-white rounded-xl border border-[#E2DDD2] overflow-hidden p-6 space-y-4 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#68716A] block text-[11px]">Código do Lote:</span>
                <span className="font-mono font-bold text-[#123D2F] text-sm">
                  {receipt.lotCode}
                </span>
              </div>
              <div>
                <span className="text-[#68716A] block text-[11px]">Categoria:</span>
                <span className="font-medium text-[#222923]">{receipt.lotCategory}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#68716A] block text-[11px]">Descrição da Peça:</span>
                <span className="font-heading font-semibold text-sm text-[#222923]">
                  {receipt.lotTitle}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2DDD2] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[#68716A] block text-[11px]">Licitante Vencedor:</span>
                <span className="font-mono font-semibold text-[#123D2F]">
                  {receipt.winnerPseudonym}
                </span>
                <span className="text-[10px] text-[#68716A] block">({receipt.winnerName})</span>
              </div>

              <div>
                <span className="text-[#68716A] block text-[11px]">Data de Encerramento:</span>
                <span className="font-medium text-[#222923]">
                  {formatDateTimeBR(receipt.closedAt)}
                </span>
              </div>

              <div>
                <span className="text-[#68716A] block text-[11px]">Valor de Arremate:</span>
                <span className="font-heading font-bold text-base text-[#123D2F]">
                  {formatBRL(receipt.finalPriceCents)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2DDD2] flex items-center justify-between text-[11px] text-[#68716A]">
              <span>Leiloeiro Conducente: {receipt.sellerName}</span>
              <span className="inline-flex items-center gap-1 text-[#1E7E34] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Liquidação Simulada Concluída</span>
              </span>
            </div>
          </div>

          {/* Mandatory Public Warning */}
          <div className="mt-6 p-4 rounded-xl bg-[#FEF3C7]/40 border border-[#B45309]/30 text-[11px] text-[#222923] space-y-1">
            <p className="font-semibold text-[#B45309]">Aviso Legal Demonstrativo:</p>
            <p className="text-[#68716A] leading-relaxed">
              Este comprovante demonstra o encerramento do lote dentro de uma plataforma com saldo e
              lances simulados. Não constitui nota fiscal, escritura pública, comprovante de
              pagamento real ou garantia de autenticidade material.
            </p>
          </div>

          {/* Signatures & Hash verification Footer */}
          <div className="mt-8 pt-6 border-t border-[#E2DDD2] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg border border-[#E2DDD2] p-1 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-[#123D2F]" />
              </div>
              <div className="text-[10px] text-[#68716A]">
                <p className="font-mono text-[#123D2F] font-bold">VERIFICAÇÃO DIGITAL</p>
                <p>Hash encadeado em trilha de auditoria</p>
                <p>Ancoragem temporal OpenTimestamps</p>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="w-48 h-0.5 bg-[#CDC5B4] mb-1"></div>
              <p className="text-[11px] font-semibold text-[#123D2F]">
                Lance Casa de Leilões Digitais
              </p>
              <p className="text-[10px] text-[#68716A]">Assinatura criptográfica Ed25519</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
