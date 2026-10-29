import React from "react";
import { useApp } from "../../context/AppContext";
import { Logo } from "./Logo";
import { ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <footer className="bg-brand-deep text-brand-on-dark border-t border-brand-primary/80 mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 min-[881px]:grid-cols-4 gap-10 pb-12 border-b border-invert">
          <div className="min-[881px]:col-span-1 space-y-4">
            <Logo variant="dark" size="md" />
            <p className="text-xs text-brand-on-dark/80 leading-relaxed font-body">
              A Lance é uma casa de leilões digital que conecta colecionadores a
              peças singulares por meio de uma experiência clara, organizada e
              confiável.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-primary text-[11px] text-accent-gold-ink border border-accent-gold/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Auditoria com integridade verificável</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-heading font-semibold text-accent-gold-ink">
              Explorar Catálogo
            </h4>
            <ul className="space-y-2 text-xs text-brand-on-dark/80">
              <li>
                <button
                  onClick={() => navigateTo("/lotes")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Todos os Lotes Disponíveis
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("/lotes?cat=Arte")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Arte &amp; Pinturas
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("/lotes?cat=Esculturas")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Esculturas Clássicas &amp; Modernas
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("/lotes?cat=Objetos de coleção")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Objetos de Coleção &amp; Decoração
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("/lotes?cat=Mobiliário")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Mobiliário Modernista Brasileiro
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("/lotes?cat=Discos")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Discos e Edições Musicais Históricas
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-heading font-semibold text-accent-gold-ink">
              Institucional
            </h4>
            <ul className="space-y-2 text-xs text-brand-on-dark/80">
              <li>
                <button
                  onClick={() => navigateTo("/#como-funciona")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Como Funciona o Pregão Online
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("/auditoria")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Trilha de Auditoria &amp; Hashes
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("/sobre")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  O que é a Lance?
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("/regras")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Regras Gerais do Pregão
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("/termo-leiloeiro")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Termo do Leiloeiro
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo("/politica-reservas")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Política de Reservas &amp; Carteira
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-heading font-semibold text-accent-gold-ink">
              Fontes de Catálogo
            </h4>
            <ul className="space-y-1.5 text-xs text-brand-on-dark/80">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                <span>The Metropolitan Museum of Art API</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                <span>Art Institute of Chicago API</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                <span>MusicBrainz &amp; Cover Art Archive</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col min-[881px]:flex-row items-center justify-between gap-4 text-[11px] text-brand-on-dark/75">
          <div>
            <p>
              © 2026 Lance — Casa de Leilões. Todos os direitos reservados à
              Pietra.
            </p>
            <p className="mt-0.5 text-brand-on-dark/40">
              Plataforma com dados e operações persistidos pela API.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
