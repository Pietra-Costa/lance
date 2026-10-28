import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { LotCard } from "../components/domain/LotCard";
import { Search, ArrowRight, Shield, Clock } from "lucide-react";

export const HomePage: React.FC = () => {
  const { lots, navigateTo } = useApp();
  const [searchTerm, setSearchTerm] = useState("");

  const featuredLots = lots
    .filter(l => l.featured || l.status === "LIVE")
    .slice(0, 3);
  const liveLots = lots.filter(l => l.status === "LIVE");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigateTo(`/lotes?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigateTo("/lotes");
    }
  };

  const categories = [
    { name: "Arte", count: "12 obras", query: "cat=Arte" },
    { name: "Esculturas", count: "6 peças", query: "cat=Esculturas" },
    {
      name: "Objetos de coleção",
      count: "9 itens",
      query: "cat=Objetos de coleção",
    },
    { name: "Mobiliário", count: "4 exemplares", query: "cat=Mobiliário" },
    {
      name: "Discos e edições musicais",
      count: "8 títulos",
      query: "cat=Discos",
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* 1. Hero Section - Editorial and Contemporary */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pb-24 border-b border-[#E2DDD2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-[#123D2F] tracking-tight leading-[1.1]">
                Arte, objetos de coleção e discos.
              </h1>

              <p className="text-base sm:text-lg text-[#68716A] leading-relaxed max-w-xl font-body">
                Explore lotes singulares com procedência catalogada, participe
                de disputas em tempo real e acompanhe cada etapa com regras
                claras e auditoria verificável.
              </p>

              {/* Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="max-w-lg w-full relative"
              >
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#68716A] absolute left-3.5 sm:left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por obra, autor, categoria..."
                    className="w-full pl-10 sm:pl-11 pr-20 sm:pr-24 py-3 sm:py-3.5 rounded-xl border border-[#CDC5B4] bg-white text-xs sm:text-sm text-[#222923] placeholder-[#68716A] focus:outline-hidden focus:ring-2 focus:ring-[#123D2F] focus:border-transparent transition-all shadow-xs"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 sm:right-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#123D2F] hover:bg-[#0A2B22] text-[#F5F1E7] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Buscar
                  </button>
                </div>
              </form>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                <button
                  onClick={() => navigateTo("/lotes")}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#123D2F] hover:bg-[#0A2B22] text-[#F5F1E7] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md"
                >
                  <span>Explorar leilões</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById("como-funciona");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#CDC5B4] hover:bg-white text-[#222923] font-semibold text-sm transition-all text-center cursor-pointer"
                >
                  Como funciona
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-[#E2DDD2] flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#68716A]">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#123D2F] shrink-0" />
                  <span>Cadeia de auditoria criptográfica</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#123D2F] shrink-0" />
                  <span>Prorrogação anti-sniping 2 min</span>
                </div>
              </div>
            </div>

            {/* Right Column: Featured Object Spotlight */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative border backdrop */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#123D2F]/15 to-[#C8A96A]/20 rounded-2xl transform rotate-1"></div>

                <div className="relative bg-white p-4 rounded-2xl border border-[#E2DDD2] shadow-xl overflow-hidden">
                  <div className="aspect-4/3 w-full rounded-xl overflow-hidden bg-[#FAF7F2] relative">
                    <img
                      src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80"
                      alt="Destaque: Vaso Art Nouveau em Vidro Favrile"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 bg-[#123D2F] text-[#F5F1E7] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      LOTE EM DESTAQUE
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md">
                      The Met Collection · Louis Comfort Tiffany
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[11px] font-mono text-[#68716A]">
                      LANCE-2026-001
                    </span>
                    <h3 className="font-heading font-semibold text-lg text-[#123D2F] leading-snug">
                      Vaso Art Nouveau em Vidro Favrile Iridescente
                    </h3>
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-[10px] text-[#68716A] block">
                          Lance atual
                        </span>
                        <span className="font-heading font-bold text-xl text-[#123D2F]">
                          R$ 18.000,00
                        </span>
                      </div>
                      <button
                        onClick={() => navigateTo("/lotes/lot-001")}
                        className="px-3.5 py-2 rounded-lg bg-[#123D2F] text-[#F5F1E7] text-xs font-semibold hover:bg-[#0A2B22] transition-colors cursor-pointer"
                      >
                        Participar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Categorias de Catálogo */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
              Categorias em Destaque
            </h2>
            <p className="text-xs text-[#68716A] mt-0.5">
              Acervos mapeados através de adaptadores The Met, AIC e MusicBrainz
            </p>
          </div>
          <button
            onClick={() => navigateTo("/lotes")}
            className="text-xs font-semibold text-[#123D2F] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver catálogo completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => navigateTo(`/lotes?${cat.query}`)}
              className={`p-4 rounded-xl bg-white border border-[#E2DDD2] hover:border-[#123D2F] hover:shadow-xs transition-all text-left group cursor-pointer ${
                idx === 4 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <h4 className="font-heading font-semibold text-sm text-[#222923] group-hover:text-[#123D2F] transition-colors">
                {cat.name}
              </h4>
              <p className="text-[11px] text-[#68716A] mt-1">{cat.count}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Lotes em Disputa (Ao Vivo) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#123D2F]">
              Lotes em Disputa ao Vivo
            </h2>
            <p className="text-xs sm:text-sm text-[#68716A] mt-1">
              Peças recebendo lances concorrentes com atualização de liderança
              em tempo real.
            </p>
          </div>

          <button
            onClick={() => navigateTo("/lotes?status=LIVE")}
            className="px-4 py-2 rounded-lg border border-[#123D2F] text-[#123D2F] hover:bg-[#123D2F] hover:text-[#F5F1E7] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <span>Ver todos os lotes ao vivo ({liveLots.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredLots.map(lot => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      </section>

      {/* 4. Como Funciona (3 Etapas Conforme Manual) */}
      <section
        id="como-funciona"
        className="bg-[#FAF7F2] border-y border-[#E2DDD2] py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs uppercase font-mono tracking-widest text-[#C8A96A] font-bold">
              DINÂMICA OPERACIONAL
            </span>
            <h2 className="font-heading font-bold text-3xl text-[#123D2F]">
              Como Funciona a Lance
            </h2>
            <p className="text-sm text-[#68716A]">
              Sem surpresas ou urgências artificiais. Uma experiência clara de
              leilão desenhada para proteger o licitante e o leiloeiro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 bg-white rounded-2xl border border-[#E2DDD2] space-y-3 relative">
              <span className="font-heading font-black text-3xl text-[#C8A96A]/60">
                01
              </span>
              <h3 className="font-heading font-semibold text-lg text-[#123D2F]">
                Explore os lotes
              </h3>
              <p className="text-xs text-[#68716A] leading-relaxed">
                Navegue pelas categorias, consulte o catálogo de peças com
                procedência registrada de acervos reconhecidos e avalie as
                características antes da abertura do pregão.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-white rounded-2xl border border-[#E2DDD2] space-y-3 relative">
              <span className="font-heading font-black text-3xl text-[#C8A96A]/60">
                02
              </span>
              <h3 className="font-heading font-semibold text-lg text-[#123D2F]">
                Dê seu lance
              </h3>
              <p className="text-xs text-[#68716A] leading-relaxed">
                Confira o próximo valor mínimo e o incremento obrigatório. Ao
                confirmar, o saldo é reservado na sua carteira. Se você for
                superado, sua reserva é liberada de imediato.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-white rounded-2xl border border-[#E2DDD2] space-y-3 relative">
              <span className="font-heading font-black text-3xl text-[#C8A96A]/60">
                03
              </span>
              <h3 className="font-heading font-semibold text-lg text-[#123D2F]">
                Acompanhe o resultado
              </h3>
              <p className="text-xs text-[#68716A] leading-relaxed">
                Veja o encerramento do pregão em tempo real. Caso seu lance seja
                vencedor, consulte o comprovante de arremate digital verificado
                na trilha pública de auditoria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Transparência & Garantias de Arquitetura */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0A2B22] text-[#F5F1E7] rounded-3xl p-8 sm:p-12 border border-[#123D2F] relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#C8A96A] font-bold">
              TRANSPARÊNCIA E AUDITORIA PÚBLICA
            </span>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#F5F1E7]">
              Histórico rastreável e pseudonimizado
            </h2>
            <p className="text-xs sm:text-sm text-[#F5F1E7]/75 leading-relaxed font-body">
              Cada lance, reserva e encerramento homologado gera um bloco
              encadeado criptograficamente com assinatura digital Ed25519 e
              verificação por OpenTimestamps. A identidade dos licitantes
              permanece rigorosamente protegida por pseudônimos.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigateTo("/auditoria")}
                className="px-5 py-3 rounded-xl bg-[#C8A96A] hover:bg-[#C8A96A]/90 text-[#0A2B22] font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Consultar Trilha de Auditoria</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
