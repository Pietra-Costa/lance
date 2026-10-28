import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from '../components/layout/Logo';
import { LotStatusBadge } from '../components/domain/LotStatusBadge';
import { CountdownTimer } from '../components/domain/CountdownTimer';
import { formatBRL } from '../logic/auctionRules';
import {
  Palette,
  Type,
  Maximize,
  Compass,
  SquareCheck,
  MousePointer,
  FormInput,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Gavel,
  Wallet,
  FileCheck,
  ArrowRight,
  ExternalLink,
  Code2,
  Eye,
  Search,
} from 'lucide-react';

export const DesignSystemPage: React.FC = () => {
  const { navigateTo } = useApp();
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', name: '1. Visão Geral & Princípios', icon: Compass },
    { id: 'logo', name: '2. Logotipo & Variantes', icon: Layers },
    { id: 'colors', name: '3. Cores & Tokens Semânticos', icon: Palette },
    { id: 'typography', name: '4. Tipografia Sora & Inter', icon: Type },
    { id: 'spacing', name: '5. Espaçamento & Grid', icon: Maximize },
    { id: 'icons', name: '6. Catálogo de Ícones (Lucide)', icon: SquareCheck },
    { id: 'buttons', name: '7. Botões & Variantes', icon: MousePointer },
    { id: 'forms', name: '8. Formulários & Controles', icon: FormInput },
    { id: 'domain', name: '9. Componentes de Domínio', icon: Gavel },
    { id: 'states', name: '10. Estados & Feedback', icon: AlertTriangle },
    { id: 'tokens', name: '11. Mapeamento de Tokens CSS', icon: Code2 },
    { id: 'accessibility', name: '12. Acessibilidade (WCAG AA)', icon: ShieldCheck },
    { id: 'routes', name: '13. Inventário de Rotas', icon: Layers },
    { id: 'interactions', name: '14. Inventário de Interações', icon: CheckCircle2 },
    { id: 'pendings', name: '15. Decisões & Pendências', icon: Clock },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Required Prototype Notice Banner */}
      <div className="p-4 rounded-2xl bg-[#0A2B22] text-[#F5F1E7] border border-[#C8A96A]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#123D2F] text-[#C8A96A] border border-[#C8A96A]/30">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-[#F5F1E7]">
                Design System · Lance Casa de Leilões
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8A96A] text-[#0A2B22] uppercase">
                v1.1 Oficial
              </span>
            </div>
            <p className="text-[11px] text-[#F5F1E7]/70 font-mono">
              Área interna de protótipo — não incluir no produto final
            </p>
          </div>
        </div>

        <button
          onClick={() => navigateTo('/')}
          className="px-4 py-2 rounded-xl bg-[#123D2F] hover:bg-[#123D2F]/80 text-[#F5F1E7] text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <span>Retornar ao Site Público</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mobile Section Nav (lg:hidden) */}
      <div className="lg:hidden bg-white p-3 rounded-2xl border border-[#E2DDD2] shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-[#68716A]">
            Seção do Design System:
          </span>
          <select
            value={activeSection}
            onChange={(e) => {
              setActiveSection(e.target.value);
            }}
            className="text-xs bg-[#FAF7F2] border border-[#CDC5B4] rounded-lg px-2.5 py-1 text-[#123D2F] font-semibold"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {sections.map((s) => {
            const isSelected = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#123D2F] text-[#F5F1E7] font-semibold'
                    : 'bg-[#FAF7F2] text-[#68716A] hover:text-[#222923]'
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout: Sidebar Nav + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Navigation Sidebar (hidden lg:block) */}
        <aside className="hidden lg:block lg:col-span-3 bg-white p-4 rounded-2xl border border-[#E2DDD2] shadow-xs space-y-1 lg:sticky lg:top-24 max-h-[80vh] overflow-y-auto">
          <span className="text-[10px] uppercase font-mono font-bold text-[#68716A] px-3 pb-2 block">
            SUMÁRIO DO SISTEMA
          </span>
          {sections.map((s) => {
            const Icon = s.icon;
            const isSelected = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSection(s.id);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#123D2F] text-[#F5F1E7] font-semibold shadow-xs'
                    : 'text-[#68716A] hover:bg-[#FAF7F2] hover:text-[#222923]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#C8A96A]' : 'text-[#68716A]'}`} />
                <span className="truncate">{s.name}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Body */}
        <main className="lg:col-span-9 space-y-10">
          {/* 1. Visão Geral */}
          {activeSection === 'overview' && (
            <section className="bg-white p-8 rounded-2xl border border-[#E2DDD2] space-y-6 shadow-xs">
              <div className="space-y-1 border-b border-[#E2DDD2] pb-4">
                <span className="text-[10px] font-mono text-[#C8A96A] font-bold uppercase">SEÇÃO 15.1</span>
                <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
                  Visão Geral & Princípios do Sistema
                </h2>
                <p className="text-xs text-[#68716A]">
                  Diretrizes de produto, arquitetura e linguagem de design da plataforma Lance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DDD2] space-y-2">
                  <h4 className="font-heading font-bold text-sm text-[#123D2F]">1. Clareza</h4>
                  <p className="text-xs text-[#68716A] leading-relaxed">
                    Informação e regras apresentadas de forma direta, sem termos rebuscados ou
                    letramento excessivo.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DDD2] space-y-2">
                  <h4 className="font-heading font-bold text-sm text-[#123D2F]">2. Confiança</h4>
                  <p className="text-xs text-[#68716A] leading-relaxed">
                    Estados, lances, reservas financeiras e resultados comunicados com precisão
                    transacional.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DDD2] space-y-2">
                  <h4 className="font-heading font-bold text-sm text-[#123D2F]">3. Descoberta</h4>
                  <p className="text-xs text-[#68716A] leading-relaxed">
                    Um catálogo que valoriza a imagem e a procedência do objeto sem distrações
                    cosméticas.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FEF3C7]/40 border border-[#B45309]/30 text-xs text-[#222923] space-y-1">
                <p className="font-bold text-[#B45309]">Regra de Ouro Editorial:</p>
                <p className="text-[#68716A] leading-relaxed">
                  Nunca comunicar vitória, reserva, liberação de saldo ou liquidação antes da
                  confirmação real do sistema. A copy precisa refletir fielmente o estado do backend.
                </p>
              </div>
            </section>
          )}

          {/* 2. Logotipo */}
          {activeSection === 'logo' && (
            <section className="bg-white p-8 rounded-2xl border border-[#E2DDD2] space-y-6 shadow-xs">
              <div className="space-y-1 border-b border-[#E2DDD2] pb-4">
                <span className="text-[10px] font-mono text-[#C8A96A] font-bold uppercase">SEÇÃO 15.2</span>
                <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
                  Logotipo Oficial — 4 Variantes
                </h2>
                <p className="text-xs text-[#68716A]">
                  Símbolo abstrato geométrico baseado no corte arquitetural da letra L com losango
                  institucional.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Variant 1 */}
                <div className="p-6 rounded-2xl bg-[#F5F1E7] border border-[#E2DDD2] space-y-3">
                  <span className="text-[10px] font-mono font-bold text-[#68716A] block">
                    VARIANTE 1: PRINCIPAL (Fundo Claro)
                  </span>
                  <div className="p-4 bg-white/60 rounded-xl flex items-center justify-center">
                    <Logo variant="light" size="lg" />
                  </div>
                  <p className="text-[11px] text-[#68716A]">
                    Aplicação prioritária na navegação e documentos com fundo claro (#F5F1E7).
                  </p>
                </div>

                {/* Variant 2 */}
                <div className="p-6 rounded-2xl bg-[#0A2B22] border border-[#123D2F] space-y-3 text-white">
                  <span className="text-[10px] font-mono font-bold text-[#C8A96A] block">
                    VARIANTE 2: FUNDO ESCURO (Verde Profundo)
                  </span>
                  <div className="p-4 bg-black/20 rounded-xl flex items-center justify-center">
                    <Logo variant="dark" size="lg" />
                  </div>
                  <p className="text-[11px] text-white/70">
                    Aplicação no rodapé institucional, cartões escuros e áreas de destaque solenes.
                  </p>
                </div>

                {/* Variant 3 */}
                <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E2DDD2] space-y-3">
                  <span className="text-[10px] font-mono font-bold text-[#68716A] block">
                    VARIANTE 3: SÍMBOLO ISOLADO
                  </span>
                  <div className="p-4 bg-white rounded-xl flex items-center justify-center">
                    <Logo variant="isolated" size="xl" />
                  </div>
                  <p className="text-[11px] text-[#68716A]">
                    Destinado a favicon, avatares, carimbos de validação e marcas d’água de documentos.
                  </p>
                </div>

                {/* Variant 4 */}
                <div className="p-6 rounded-2xl bg-white border border-[#E2DDD2] space-y-3">
                  <span className="text-[10px] font-mono font-bold text-[#68716A] block">
                    VARIANTE 4: MONOCROMÁTICA (Grafite)
                  </span>
                  <div className="p-4 bg-[#FAF7F2] rounded-xl flex items-center justify-center">
                    <Logo variant="monochrome" size="lg" />
                  </div>
                  <p className="text-[11px] text-[#68716A]">
                    Para impressões físicas, notas fiscais simuladas e mídias sem suporte a cor.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 3. Cores & Tokens */}
          {activeSection === 'colors' && (
            <section className="bg-white p-8 rounded-2xl border border-[#E2DDD2] space-y-6 shadow-xs">
              <div className="space-y-1 border-b border-[#E2DDD2] pb-4">
                <span className="text-[10px] font-mono text-[#C8A96A] font-bold uppercase">SEÇÃO 15.3</span>
                <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
                  Paleta Cromática Oficial & Tokens Semânticos
                </h2>
                <p className="text-xs text-[#68716A]">
                  Cores oficiais da marca e tokens funcionais de estado com taxa de contraste WCAG AA.
                </p>
              </div>

              {/* Brand Colors */}
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-sm text-[#123D2F]">
                  Cores Primárias da Marca
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      name: 'Verde Lance',
                      hex: '#123D2F',
                      rgb: '18, 61, 47',
                      role: 'Cor primária / Ação principal',
                      bg: '#123D2F',
                      text: '#F5F1E7',
                      contrast: '9.8:1 (AAA)',
                    },
                    {
                      name: 'Verde Profundo',
                      hex: '#0A2B22',
                      rgb: '10, 43, 34',
                      role: 'Fundos solenes e rodapé',
                      bg: '#0A2B22',
                      text: '#F5F1E7',
                      contrast: '12.4:1 (AAA)',
                    },
                    {
                      name: 'Off-white',
                      hex: '#F5F1E7',
                      rgb: '245, 241, 231',
                      role: 'Fundo principal da aplicação',
                      bg: '#F5F1E7',
                      text: '#222923',
                      contrast: '11.2:1 (AAA)',
                    },
                    {
                      name: 'Grafite',
                      hex: '#222923',
                      rgb: '34, 41, 35',
                      role: 'Textos principais e títulos',
                      bg: '#222923',
                      text: '#F5F1E7',
                      contrast: '11.5:1 (AAA)',
                    },
                    {
                      name: 'Cinza Funcional',
                      hex: '#68716A',
                      rgb: '104, 113, 106',
                      role: 'Metadados e textos secundários',
                      bg: '#68716A',
                      text: '#FFFFFF',
                      contrast: '4.6:1 (AA)',
                    },
                    {
                      name: 'Dourado Suave',
                      hex: '#C8A96A',
                      rgb: '200, 169, 106',
                      role: 'Acento visual discreto (sem excesso)',
                      bg: '#C8A96A',
                      text: '#0A2B22',
                      contrast: '5.2:1 (AA)',
                    },
                  ].map((color) => (
                    <div
                      key={color.hex}
                      className="rounded-xl border border-[#E2DDD2] overflow-hidden bg-white shadow-2xs"
                    >
                      <div
                        className="h-20 p-3 flex flex-col justify-end"
                        style={{ backgroundColor: color.bg, color: color.text }}
                      >
                        <span className="font-mono font-bold text-xs">{color.hex}</span>
                      </div>
                      <div className="p-3 text-xs space-y-1">
                        <span className="font-heading font-semibold text-[#222923] block">
                          {color.name}
                        </span>
                        <p className="text-[11px] text-[#68716A]">{color.role}</p>
                        <span className="text-[10px] text-[#123D2F] font-mono font-medium block">
                          Contraste: {color.contrast}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Semantic States */}
              <div className="space-y-3 pt-4 border-t border-[#E2DDD2]">
                <h3 className="font-heading font-bold text-sm text-[#123D2F]">
                  Tokens Semânticos de Interface
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#EAF7EE] border border-[#1E7E34]/30 text-[#1E7E34]">
                    <span className="font-bold block">Sucesso</span>
                    <span className="font-mono text-[10px]">#1E7E34 / #EAF7EE</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FEF3C7] border border-[#B45309]/30 text-[#B45309]">
                    <span className="font-bold block">Alerta / Anti-sniping</span>
                    <span className="font-mono text-[10px]">#B45309 / #FEF3C7</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#B91C1C]/30 text-[#B91C1C]">
                    <span className="font-bold block">Erro / Rejeição</span>
                    <span className="font-mono text-[10px]">#B91C1C / #FEE2E2</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#1D4ED8]/30 text-[#1D4ED8]">
                    <span className="font-bold block">Informativo</span>
                    <span className="font-mono text-[10px]">#1D4ED8 / #EFF6FF</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 4. Tipografia */}
          {activeSection === 'typography' && (
            <section className="bg-white p-8 rounded-2xl border border-[#E2DDD2] space-y-6 shadow-xs">
              <div className="space-y-1 border-b border-[#E2DDD2] pb-4">
                <span className="text-[10px] font-mono text-[#C8A96A] font-bold uppercase">SEÇÃO 15.4</span>
                <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
                  Tipografia Oficial: Sora & Inter
                </h2>
                <p className="text-xs text-[#68716A]">
                  Sora para títulos, identidades e chamadas institucionais; Inter para textos de corpo,
                  valores, botões e tabelas.
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2] space-y-2">
                  <span className="text-xs font-mono font-bold text-[#123D2F]">
                    DISPLAY (Sora Bold 48px)
                  </span>
                  <p className="font-heading font-bold text-4xl text-[#123D2F] leading-tight">
                    Arte, objetos de coleção e discos.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2DDD2] space-y-2">
                  <span className="text-xs font-mono font-bold text-[#123D2F]">
                    H1 (Sora Semibold 32px)
                  </span>
                  <p className="font-heading font-semibold text-2xl text-[#222923]">
                    Catálogo de Lotes & Pregão Oficial
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2DDD2] space-y-2">
                  <span className="text-xs font-mono font-bold text-[#123D2F]">
                    H2 (Sora Medium 24px)
                  </span>
                  <p className="font-heading font-medium text-xl text-[#222923]">
                    Vaso Art Nouveau em Vidro Favrile Iridescente
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2DDD2] space-y-2">
                  <span className="text-xs font-mono font-bold text-[#123D2F]">
                    VALOR MONETÁRIO BRL (Inter Bold 24px / Sora Numbers)
                  </span>
                  <p className="font-heading font-bold text-2xl text-[#123D2F]">
                    R$ 18.000,00 <span className="text-xs text-[#68716A] font-normal">(Lance atual)</span>
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2DDD2] space-y-2">
                  <span className="text-xs font-mono font-bold text-[#123D2F]">
                    BODY (Inter Regular 16px / line-height 24px)
                  </span>
                  <p className="font-body text-base text-[#222923] leading-relaxed max-w-2xl">
                    A Lance aproxima a dinâmica dos leilões da simplicidade de uma boa plataforma
                    digital. A identidade deve inspirar confiança, facilitar decisões e valorizar cada
                    lote sem excesso de formalidade ou códigos visuais de luxo.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-[#E2DDD2] space-y-2">
                  <span className="text-xs font-mono font-bold text-[#123D2F]">
                    METADATA & PSEUDÔNIMO (Inter Medium 12px)
                  </span>
                  <p className="font-mono text-xs text-[#68716A]">
                    Licitante •••• 4821 · 24/10/2026 às 11:45
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 7. Botões */}
          {activeSection === 'buttons' && (
            <section className="bg-white p-8 rounded-2xl border border-[#E2DDD2] space-y-6 shadow-xs">
              <div className="space-y-1 border-b border-[#E2DDD2] pb-4">
                <span className="text-[10px] font-mono text-[#C8A96A] font-bold uppercase">SEÇÃO 15.7</span>
                <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
                  Matriz de Botões & Estados
                </h2>
                <p className="text-xs text-[#68716A]">
                  Componente Button com variantes Primary, Secondary, Outline, Ghost e Destructive nos
                  tamanhos Small, Medium e Large.
                </p>
              </div>

              <div className="space-y-6 text-xs">
                {/* Primary */}
                <div className="space-y-2">
                  <span className="font-bold text-[#123D2F] block">Primary Button (Verde Lance)</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <button className="px-5 py-2.5 rounded-xl bg-[#123D2F] text-white font-semibold hover:bg-[#0A2B22] cursor-pointer">
                      Confirmar Lance
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-[#123D2F] text-white font-semibold opacity-50 cursor-not-allowed">
                      Disabled
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-[#123D2F] text-white font-semibold animate-pulse">
                      Processando...
                    </button>
                  </div>
                </div>

                {/* Secondary */}
                <div className="space-y-2">
                  <span className="font-bold text-[#123D2F] block">Secondary Button (Borda Neutra)</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <button className="px-5 py-2.5 rounded-xl border border-[#CDC5B4] bg-white text-[#222923] font-semibold hover:bg-[#FAF7F2] cursor-pointer">
                      Ver detalhes
                    </button>
                    <button className="px-5 py-2.5 rounded-xl border border-[#CDC5B4] bg-white text-[#222923] font-semibold opacity-50 cursor-not-allowed">
                      Disabled
                    </button>
                  </div>
                </div>

                {/* Destructive */}
                <div className="space-y-2">
                  <span className="font-bold text-[#B91C1C] block">Destructive Button</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <button className="px-5 py-2.5 rounded-xl bg-[#B91C1C] text-white font-semibold hover:bg-[#991B1B] cursor-pointer">
                      Cancelar Lote
                    </button>
                    <button className="px-5 py-2.5 rounded-xl border border-[#B91C1C]/40 text-[#B91C1C] font-semibold hover:bg-[#FEE2E2] cursor-pointer">
                      Cancelar Oferta
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 9. Componentes de Domínio */}
          {activeSection === 'domain' && (
            <section className="bg-white p-8 rounded-2xl border border-[#E2DDD2] space-y-6 shadow-xs">
              <div className="space-y-1 border-b border-[#E2DDD2] pb-4">
                <span className="text-[10px] font-mono text-[#C8A96A] font-bold uppercase">SEÇÃO 15.9</span>
                <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
                  Componentes de Domínio de Leilões
                </h2>
                <p className="text-xs text-[#68716A]">
                  Estruturas específicas do modelo Lance: Badges de pregão, cronômetro com
                  anti-sniping, e identificadores anonimizados.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-xs text-[#123D2F] mb-2">LotStatusBadge</h4>
                  <div className="flex flex-wrap gap-3">
                    <LotStatusBadge status="LIVE" />
                    <LotStatusBadge status="SCHEDULED" />
                    <LotStatusBadge status="ENDED" />
                    <LotStatusBadge status="CANCELED" />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-[#123D2F] mb-2">
                    CountdownTimer (com Alerta Anti-sniping)
                  </h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <CountdownTimer targetDateISO={new Date(Date.now() + 4 * 3600 * 1000).toISOString()} />
                    <CountdownTimer targetDateISO={new Date(Date.now() + 90 * 1000).toISOString()} />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-[#123D2F] mb-2">AnonymousBidder</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="font-mono bg-[#FAF7F2] border border-[#E2DDD2] px-3 py-1 rounded-lg text-[#123D2F] font-bold">
                      Licitante •••• 4821 (Você)
                    </span>
                    <span className="font-mono bg-[#FAF7F2] border border-[#E2DDD2] px-3 py-1 rounded-lg text-[#68716A]">
                      Licitante •••• 1904
                    </span>
                    <span className="font-mono bg-[#FAF7F2] border border-[#E2DDD2] px-3 py-1 rounded-lg text-[#68716A]">
                      Licitante •••• 6310
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 11. Tokens CSS */}
          {activeSection === 'tokens' && (
            <section className="bg-white p-8 rounded-2xl border border-[#E2DDD2] space-y-6 shadow-xs">
              <div className="space-y-1 border-b border-[#E2DDD2] pb-4">
                <span className="text-[10px] font-mono text-[#C8A96A] font-bold uppercase">SEÇÃO 15.12</span>
                <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
                  Mapeamento de Tokens & Variáveis CSS
                </h2>
                <p className="text-xs text-[#68716A]">
                  Correspondência entre propriedades do Figma, CSS Variables e classes utilitárias
                  Tailwind.
                </p>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FAF7F2] border-b border-[#E2DDD2] text-[#68716A]">
                    <tr>
                      <th className="py-2.5 px-3">Token Semântico</th>
                      <th className="py-2.5 px-3">CSS Variable</th>
                      <th className="py-2.5 px-3">Valor Oficial</th>
                      <th className="py-2.5 px-3">Uso no Produto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2DDD2] font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-[#123D2F]">color.brand.primary</td>
                      <td className="py-2.5 px-3">--color-brand-primary</td>
                      <td className="py-2.5 px-3">#123D2F</td>
                      <td className="py-2.5 px-3 font-sans">Cor principal, CTAs, títulos</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-[#123D2F]">color.brand.deep</td>
                      <td className="py-2.5 px-3">--color-brand-deep</td>
                      <td className="py-2.5 px-3">#0A2B22</td>
                      <td className="py-2.5 px-3 font-sans">Fundos escuros, rodapé</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-[#123D2F]">color.surface.base</td>
                      <td className="py-2.5 px-3">--color-surface-base</td>
                      <td className="py-2.5 px-3">#F5F1E7</td>
                      <td className="py-2.5 px-3 font-sans">Fundo de tela neutro acolhedor</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-[#123D2F]">color.accent.gold</td>
                      <td className="py-2.5 px-3">--color-accent-gold</td>
                      <td className="py-2.5 px-3">#C8A96A</td>
                      <td className="py-2.5 px-3 font-sans">Acentos visuais e detalhes pontuais</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-[#123D2F]">font.heading</td>
                      <td className="py-2.5 px-3">--font-heading</td>
                      <td className="py-2.5 px-3">'Sora', sans-serif</td>
                      <td className="py-2.5 px-3 font-sans">Títulos e destaques numéricos</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-[#123D2F]">font.body</td>
                      <td className="py-2.5 px-3">--font-body</td>
                      <td className="py-2.5 px-3">'Inter', sans-serif</td>
                      <td className="py-2.5 px-3 font-sans">Interface, formulários e tabelas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 13. Rotas */}
          {activeSection === 'routes' && (
            <section className="bg-white p-8 rounded-2xl border border-[#E2DDD2] space-y-6 shadow-xs">
              <div className="space-y-1 border-b border-[#E2DDD2] pb-4">
                <span className="text-[10px] font-mono text-[#C8A96A] font-bold uppercase">SEÇÃO 15.14</span>
                <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
                  Inventário Completo de Rotas
                </h2>
                <p className="text-xs text-[#68716A]">
                  Mapeamento de rotas públicas, restritas ao licitante, ao leiloeiro e de documentação.
                </p>
              </div>

              <div className="divide-y divide-[#E2DDD2] text-xs">
                {[
                  { path: '/', role: 'Público', purpose: 'Homepage com hero, busca, categorias e lotes ao vivo' },
                  { path: '/lotes', role: 'Público', purpose: 'Catálogo geral com busca, filtros de categoria e preço' },
                  { path: '/lotes/:id', role: 'Público / Licitante', purpose: 'Detalhe do lote, galeria ampliada, painel de lances e histórico' },
                  { path: '/entrar', role: 'Visitante', purpose: 'Autenticação com preservação da rota de origem' },
                  { path: '/cadastro', role: 'Visitante', purpose: 'Cadastro com escolha exclusiva de papel (Licitante ou Leiloeiro)' },
                  { path: '/conta', role: 'Licitante', purpose: 'Dashboard do licitante com lotes liderados e resumo de carteira' },
                  { path: '/conta/lances', role: 'Licitante', purpose: 'Histórico dos lances do usuário e status da liderança' },
                  { path: '/conta/arrematados', role: 'Licitante', purpose: 'Certificados e comprovantes oficiais de arremate' },
                  { path: '/conta/carteira', role: 'Licitante', purpose: 'Gestão de saldo disponível, reservas e aportes simulados' },
                  { path: '/conta/transacoes', role: 'Licitante', purpose: 'Ledger de transações da carteira com idempotência' },
                  { path: '/leiloeiro', role: 'Leiloeiro', purpose: 'Painel operacional com métricas e gestão de lotes' },
                  { path: '/leiloeiro/lotes/novo', role: 'Leiloeiro', purpose: 'Wizard em 5 etapas para importação e publicação de lote' },
                  { path: '/auditoria', role: 'Público', purpose: 'Trilha de auditoria criptográfica e verificação Ed25519' },
                  { path: '/design-system', role: 'Interno', purpose: 'Documentação viva do sistema de design e componentes' },
                ].map((r) => (
                  <div key={r.path} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#123D2F] text-xs">{r.path}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF7F2] border border-[#CDC5B4]">
                        {r.role}
                      </span>
                    </div>
                    <p className="text-[#68716A] text-[11px] sm:max-w-md">{r.purpose}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 15. Pendências */}
          {activeSection === 'pendings' && (
            <section className="bg-white p-8 rounded-2xl border border-[#E2DDD2] space-y-6 shadow-xs">
              <div className="space-y-1 border-b border-[#E2DDD2] pb-4">
                <span className="text-[10px] font-mono text-[#C8A96A] font-bold uppercase">SEÇÃO 15.15 / CAPÍTULO 43</span>
                <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
                  Decisões Arquiteturais & Pendências de Homologação
                </h2>
                <p className="text-xs text-[#68716A]">
                  Registro fiel dos pontos pendentes de validação técnica/jurídica, tratados no
                  protótipo como comportamentos demonstrativos.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  {
                    title: 'Regras Definitivas de Depósito e Saque Real',
                    desc: 'Operações financeiras reais exigem licenças BACEN ou integração de Gateway bancário/PIX real. No protótipo, a carteira opera em modo demonstrativo.',
                  },
                  {
                    title: 'Política Definitiva de Direitos de Imagem Comerciais',
                    desc: 'Acessibilidade de APIs como The Met ou AIC sob CC0 não confere direito automático de exploração comercial irrestrita. O leiloeiro deve validar caso a caso.',
                  },
                  {
                    title: 'Serviço Externo de Ancoragem Temporal',
                    desc: 'OpenTimestamps e carimbos de tempo em blockchain pública exigem serviço assíncrono em produção; simulado localmente através de checkpoints de auditoria.',
                  },
                  {
                    title: 'Ordenação de Concorrência em Alta Escala',
                    desc: 'O bloqueio por lote em PostgreSQL atende ao monólito modular do MVP; disputas em milissegundos com milhares de licitantes exigiriam Redis Lock.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E2DDD2] space-y-1">
                    <span className="font-bold text-[#123D2F] block">{item.title}</span>
                    <p className="text-[#68716A] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Other sections fallback */}
          {!['overview', 'logo', 'colors', 'typography', 'buttons', 'domain', 'tokens', 'routes', 'pendings'].includes(
            activeSection
          ) && (
            <section className="bg-white p-8 rounded-2xl border border-[#E2DDD2] space-y-4">
              <h3 className="font-heading font-bold text-xl text-[#123D2F]">
                Documentação de {activeSection}
              </h3>
              <p className="text-xs text-[#68716A]">
                Consulte as seções principais no menu lateral para visualizar os fundamentos
                consolidados.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
