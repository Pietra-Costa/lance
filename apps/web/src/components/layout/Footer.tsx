import React from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from './Logo';
import { ShieldCheck, BookOpen, ExternalLink, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <footer className="bg-[#0A2B22] text-[#F5F1E7] border-t border-[#123D2F]/80 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Col 1: Brand & Manifesto */}
          <div className="md:col-span-1 space-y-4">
            <Logo variant="dark" size="md" />
            <p className="text-xs text-[#F5F1E7]/70 leading-relaxed font-body">
              A Lance é uma casa de leilões digital que conecta colecionadores a peças singulares
              por meio de uma experiência clara, organizada e confiável.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#123D2F] text-[11px] text-[#C8A96A] border border-[#C8A96A]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auditoria com integridade verificável</span>
            </div>
          </div>

          {/* Col 2: Catálogo & Categorias */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-heading font-semibold text-[#C8A96A]">
              Explorar Catálogo
            </h4>
            <ul className="space-y-2 text-xs text-[#F5F1E7]/80">
              <li>
                <button
                  onClick={() => navigateTo('/lotes')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Todos os Lotes Disponíveis
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/lotes?cat=Arte')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Arte & Pinturas
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/lotes?cat=Esculturas')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Esculturas Clássicas & Modernas
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/lotes?cat=Objetos de coleção')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Objetos de Coleção & Decoração
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/lotes?cat=Mobiliário')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Mobiliário Modernista Brasileiro
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/lotes?cat=Discos')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Discos e Edições Musicais Históricas
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Institucional & Regras */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-heading font-semibold text-[#C8A96A]">
              Institucional
            </h4>
            <ul className="space-y-2 text-xs text-[#F5F1E7]/80">
              <li>
                <button
                  onClick={() => navigateTo('/#como-funciona')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Como Funciona o Pregão Online
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/auditoria')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Trilha de Auditoria & Hashes
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/termos')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Regras Gerais & Termo do Leiloeiro
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/conta/carteira')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Política de Reservas & Carteira
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Fontes Oficiais & Adaptadores */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-heading font-semibold text-[#C8A96A]">
              Fontes de Catálogo
            </h4>
            <p className="text-[11px] text-[#F5F1E7]/60 leading-normal">
              Adaptadores de dados conectados para importação e snapshots imutáveis:
            </p>
            <ul className="space-y-1.5 text-xs text-[#F5F1E7]/80">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]"></span>
                <span>The Metropolitan Museum of Art API</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]"></span>
                <span>Art Institute of Chicago API</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]"></span>
                <span>MusicBrainz & Cover Art Archive</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Prototype Notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#F5F1E7]/60">
          <div>
            <p>© 2026 Lance — Casa de Leilões. Todos os direitos reservados.</p>
            <p className="mt-0.5 text-[#F5F1E7]/40">
              Plataforma com dados e operações persistidos pela API.
            </p>
          </div>

          {/* Mandatory subtle link to internal Design System */}
          <div>
            <button
              onClick={() => navigateTo('/design-system')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-[#C8A96A]/30 text-[#C8A96A] hover:bg-[#123D2F] transition-colors cursor-pointer"
              title="Acessar documentação técnica interna do Design System"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>/design-system</span>
              <span className="text-[9px] text-[#F5F1E7]/40 ml-1 hidden lg:inline">
                (Área interna de protótipo)
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
