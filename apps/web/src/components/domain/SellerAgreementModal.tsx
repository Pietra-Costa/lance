import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, CheckCircle2, FileText, ArrowRight, Lock } from 'lucide-react';
import { Logo } from '../layout/Logo';

export interface SellerAgreementModalProps {
  onClose?: () => void;
}

export const SellerAgreementModal: React.FC<SellerAgreementModalProps> = ({ onClose }) => {
  const { currentUser, sellerAgreement, acceptSellerAgreement } = useApp();
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    acceptSellerAgreement();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden border border-[#E2DDD2] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0A2B22] text-[#F5F1E7] p-6 border-b border-[#123D2F]">
          <div className="flex items-center justify-between">
            <Logo variant="dark" size="sm" />
            <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-[#123D2F] text-[#C8A96A] border border-[#C8A96A]/30">
              REQUISITO REGULATÓRIO
            </span>
          </div>
          <h3 className="font-heading font-bold text-xl text-[#F5F1E7] mt-3">
            Termo de Responsabilidade e Condução de Pregão
          </h3>
          <p className="text-xs text-[#F5F1E7]/70 mt-1">
            Habilitação da conta para criação de lotes, importação de catálogo e abertura de leilões.
          </p>
        </div>

        {/* Scrollable Terms Content */}
        <div
          onScroll={handleScroll}
          className="p-6 overflow-y-auto space-y-4 text-xs text-[#222923] leading-relaxed bg-[#FAF7F2] font-body"
        >
          <div className="p-3 bg-white rounded-xl border border-[#E2DDD2] flex items-center gap-3">
            <Lock className="w-5 h-5 text-[#123D2F] shrink-0" />
            <div>
              <p className="font-semibold text-[#123D2F]">Leiloeiro Identificado:</p>
              <p className="text-[#68716A]">
                {currentUser?.name || 'Leiloeiro autenticado'}
              </p>
            </div>
          </div>

          <h4 className="font-heading font-bold text-sm text-[#123D2F]">
            1. Objeto e Exclusividade de Papéis
          </h4>
          <p>
            O presente termo estabelece as diretrizes para atuação como Leiloeiro na plataforma Lance.
            Por regra estrita de negócio, o usuário habilitado neste papel está impedido de participar
            ou emitir lances como licitante nos leilões disponibilizados nesta mesma conta.
          </p>

          <h4 className="font-heading font-bold text-sm text-[#123D2F]">
            2. Importação e Snapshots Imutáveis
          </h4>
          <p>
            Ao utilizar adaptadores de dados externos (The Metropolitan Museum of Art, Art Institute of
            Chicago e MusicBrainz), os metadados e imagens selecionados serão consolidados em um
            registro local imutável (LotItemSnapshot). Eventual alteração ou indisponibilidade nas APIs
            de origem não afeta os lotes publicados.
          </p>

          <h4 className="font-heading font-bold text-sm text-[#123D2F]">
            3. Verificação de Direitos e Procedência de Imagens
          </h4>
          <p>
            O leiloeiro declara ciência de que a mera disponibilidade de uma imagem ou metadado em
            repositórios abertos não constitui licença comercial irrestrita ou certificação material. É
            obrigação do leiloeiro revisar os metadados de licença e procedência antes de publicar
            qualquer lote.
          </p>

          <h4 className="font-heading font-bold text-sm text-[#123D2F]">
            4. Regras de Encerramento e Anti-Sniping
          </h4>
          <p>
            Todos os lotes sob sua condução observarão a regra de anti-sniping (prorrogação automática
            em 2 minutos para lances válidos recebidos na janela final de 2 minutos). Cancelamentos de
            lotes em andamento com lances ativos exigem justificativa formal registrada na trilha de
            auditoria criptográfica pública.
          </p>

          <div className="p-3 bg-[#FEF3C7] rounded-xl text-[#B45309] border border-[#B45309]/30">
            <strong>Evidência Técnica:</strong> O aceite deste termo gera um registro de auditoria com
            hash criptográfico associado ao seu ID e timestamp imutável no banco de dados.
          </div>
        </div>

        {/* Footer with Checkbox & Acceptance Action */}
        <div className="p-6 bg-white border-t border-[#E2DDD2] space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedCheckbox}
              onChange={(e) => setConfirmedCheckbox(e.target.checked)}
              className="mt-0.5 rounded border-[#CDC5B4] text-[#123D2F] focus:ring-[#123D2F]"
            />
            <span className="text-xs text-[#222923]">
              Li e concordo integralmente com os termos de responsabilidade técnica, exclusividade de
              papéis e integridade do pregão na plataforma Lance.
            </span>
          </label>

          <div className="flex gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E2DDD2] text-[#68716A] text-xs font-medium hover:bg-[#FAF7F2] cursor-pointer"
              >
                Decidir depois
              </button>
            )}
            <button
              type="button"
              onClick={handleAccept}
              disabled={!confirmedCheckbox}
              className="flex-1 py-3 px-4 rounded-xl bg-[#123D2F] text-[#F5F1E7] font-semibold text-xs hover:bg-[#0A2B22] disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-[#C8A96A]" />
              <span>Formalizar e Assinar Termo (v1.0)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
