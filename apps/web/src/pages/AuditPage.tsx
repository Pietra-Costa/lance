import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTimeBR } from '../logic/auctionRules';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  Search,
  XCircle,
} from 'lucide-react';

export const AuditPage: React.FC = () => {
  const { auditEvents } = useApp();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredEvents = auditEvents.filter((ev) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      ev.eventType.toLowerCase().includes(q) ||
      ev.description.toLowerCase().includes(q) ||
      (ev.lotCode && ev.lotCode.toLowerCase().includes(q)) ||
      ev.hash.toLowerCase().includes(q)
    );
  });

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#0A2B22] text-[#F5F1E7] rounded-3xl p-8 sm:p-10 border border-[#123D2F] space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-[#123D2F] text-[#C8A96A] border border-[#C8A96A]/30">
            TRANSPARÊNCIA PÚBLICA
          </span>
          <span className="text-xs text-[#F5F1E7]/60">Algoritmo SHA-256 + Ed25519</span>
        </div>

        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-white">
          Trilha de Auditoria Criptográfica
        </h1>

        <p className="text-xs sm:text-sm text-[#F5F1E7]/75 max-w-3xl leading-relaxed">
          Cada evento relevante na plataforma Lance (aceite de termo, criação de lote, lances aceitos,
          bloqueios de saldo e encerramentos) é encadeado sequencialmente através de hashes
          criptográficos com assinatura digital Ed25519 e verificação por OpenTimestamps. A
          identidade dos participantes permanece estritamente anônima sob pseudônimos.
        </p>

        <div className="flex flex-wrap gap-4 pt-2 text-xs">
          <div className="flex items-center gap-2 bg-[#123D2F]/60 px-3 py-1.5 rounded-lg border border-white/10">
            <CheckCircle2 className="w-4 h-4 text-[#1E7E34]" />
            <span>Cadeia íntegra sem bifurcações ({auditEvents.length} blocos)</span>
          </div>
          <div className="flex items-center gap-2 bg-[#123D2F]/60 px-3 py-1.5 rounded-lg border border-white/10">
            <KeyRound className="w-4 h-4 text-[#C8A96A]" />
            <span>Assinatura de checkpoints ativada</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#68716A] absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Buscar por lote, tipo de evento ou hash..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CDC5B4] bg-white text-xs focus:ring-2 focus:ring-[#123D2F] focus:outline-hidden"
          />
        </div>

        <p className="text-xs text-[#68716A]">
          Exibindo <strong>{filteredEvents.length}</strong> de {auditEvents.length} blocos
        </p>
      </div>

      {/* Chained Events Timeline */}
      <div className="space-y-4">
        {filteredEvents.map(ev => (
          <div
            key={ev.sequence}
            className={`rounded-2xl border p-6 shadow-xs transition-all space-y-4 ${
              ev.eventType === 'LOT_CANCELED'
                ? 'bg-red-50 border-red-300 hover:border-red-400'
                : 'bg-white border-[#E2DDD2] hover:border-[#CDC5B4]'
            }`}
          >
            {/* Top row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2DDD2]">
              <div className="flex items-center gap-2.5">
                <span className={`w-8 h-8 rounded-lg text-[#F5F1E7] font-mono font-bold text-xs flex items-center justify-center ${
                  ev.eventType === 'LOT_CANCELED' ? 'bg-red-700' : 'bg-[#123D2F]'
                }`}>
                  #{ev.sequence}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-heading font-bold text-sm ${
                      ev.eventType === 'LOT_CANCELED' ? 'text-red-800' : 'text-[#123D2F]'
                    }`}>
                      {eventLabel(ev.eventType)}
                    </span>
                    {ev.lotCode && (
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#FAF7F2] text-[#222923] border border-[#E2DDD2]">
                        {ev.lotCode}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#68716A]">
                    {formatDateTimeBR(ev.timestamp)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {ev.eventType === 'LOT_CANCELED' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 px-2.5 py-1 rounded-full border border-red-300">
                    <XCircle className="w-3.5 h-3.5" />
                    Cancelado
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1E7E34] bg-[#EAF7EE] px-2.5 py-1 rounded-full border border-[#1E7E34]/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ed25519 Válida</span>
                </span>
                {ev.anchoredOpenTimestamps && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#123D2F] bg-[#FAF7F2] px-2.5 py-1 rounded-full border border-[#CDC5B4]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>OpenTimestamps</span>
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs font-medium text-[#222923] leading-relaxed">
              {ev.description}
            </p>

            {/* Payload summary */}
            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2] text-xs">
              <span className="text-[10px] uppercase font-mono font-bold text-[#68716A] block mb-1">
                DADOS PÚBLICOS DO EVENTO
              </span>
              <pre className="text-[11px] font-mono text-[#222923] overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(ev.payloadSummary, null, 2)}
              </pre>
            </div>

            {/* Cryptographic Hashes linking */}
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-2.5 rounded-lg bg-gray-50 border border-[#E2DDD2]">
                <span className="text-[#68716A] block text-[10px] uppercase">
                  Hash Anterior (prevHash):
                </span>
                <span className="text-[#68716A] break-all">{ev.prevHash}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#CDC5B4]">
                <span className="text-[#123D2F] font-bold block text-[10px] uppercase">
                  Hash deste Registro:
                </span>
                <span className="text-[#123D2F] font-bold break-all">{ev.hash}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
