import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { LotCard } from "../components/domain/LotCard";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Gavel,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const HomePage: React.FC = () => {
  const { lots, navigateTo } = useApp();
  const [searchTerm, setSearchTerm] = useState("");

  const featuredLots = lots
    .filter(lot => lot.featured || lot.status === "LIVE")
    .slice(0, 3);

  const liveLots = lots.filter(lot => lot.status === "LIVE");

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const query = searchTerm.trim();

    navigateTo(query ? `/lotes?q=${encodeURIComponent(query)}` : "/lotes");
  };

  const categories = useMemo(() => {
    const labels: Record<string, string> = {
      Arte: "obras",
      Esculturas: "peças",
      "Objetos de coleção": "itens",
      Mobiliário: "exemplares",
      "Discos e edições musicais": "títulos",
    };

    const visibleLots = lots.filter(lot => lot.status !== "CANCELED");

    return Object.entries(labels).map(([name, unit]) => {
      const matchingLots = visibleLots.filter(lot => lot.category === name);

      return {
        name,
        unit,
        count: matchingLots.length,
        query: `cat=${encodeURIComponent(name)}`,
      };
    });
  }, [lots]);

  return (
    <main className="overflow-hidden bg-surface-base text-text-primary">
      <section className="relative bg-brand-primary text-brand-on-dark">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-40 h-110 w-110 rounded-full border border-border-subtle border-white/[0.07]" />
          <div className="absolute -right-16 -top-24 h-77.5 w-77.5 rounded-full border border-border-subtle border-white/[0.07]" />
          <div className="absolute bottom-0 left-1/2 h-px w-2/3 bg-linear-to-r from-transparent via-accent-gold/30 to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-350 items-center gap-10 px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-20">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 border border-border-subtle border-invert px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold-ink sm:text-[11px]">
              <Sparkles className="h-3.5 w-3.5" />
              Curadoria · Procedência · Transparência
            </div>

            <h1 className="max-w-3xl font-heading text-[2.8rem] font-medium leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-[4.7rem]">
              Objetos com
              <br />
              <span className="font-normal italic text-accent-gold-ink">
                história.
              </span>
              <br />
              Novos destinos.
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/70 sm:mt-7 sm:text-base sm:leading-8">
              Uma seleção de arte, antiguidades e objetos de coleção. Descubra
              peças singulares e participe de leilões com regras claras e
              acompanhamento transparente.
            </p>

            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 flex w-full max-w-xl items-center gap-2 border border-invert bg-surface-card/6 p-1.5 backdrop-blur-sm transition-colors focus-within:border-accent-gold/70 sm:mt-10"
            >
              <Search className="ml-3 h-5 w-5 shrink-0 text-white/50" />

              <input
                type="search"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Busque por peça, autor ou categoria"
                aria-label="Buscar lotes"
                className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-white outline-none placeholder:text-white/45"
              />

              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-2 bg-accent-gold px-4 py-3 text-xs font-semibold text-brand-deep transition-colors hover:bg-accent-gold/85 sm:px-5"
              >
                Buscar
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/50">
              <span>Explore por categoria</span>
              <span className="text-white/20">/</span>
              <span>Consulte os lotes disponíveis</span>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-2 gap-5 border-t border-invert pt-6 sm:mt-12 sm:gap-8">
              <div>
                <div className="flex items-center gap-2 text-accent-gold-ink">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.13em] sm:text-[11px]">
                    Transparência
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-white/60 sm:text-sm">
                  Trilha pública de auditoria
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-accent-gold-ink">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.13em] sm:text-[11px]">
                    Tempo real
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-white/60 sm:text-sm">
                  Acompanhamento dos lances
                </p>
              </div>
            </div>
          </div>

          {/* Imagem editorial */}
          <div className="relative mx-auto w-full max-w-140 lg:ml-auto">
            <div className="absolute -right-3 -top-3 h-24 w-24 border-r border-t border-accent-gold/60 sm:-right-5 sm:-top-5 sm:h-32 sm:w-32" />

            <div className="relative aspect-[4/4.1] overflow-hidden bg-surface-muted sm:aspect-[4/3.8]">
              <img
                src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1200&q=85"
                alt="Detalhes de uma obra de arte em ambiente de galeria"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                loading="eager"
              />

              <div className="absolute inset-0 bg-linear-to-t from-brand-deep/90 via-brand-deep/10 to-transparent" />

              <div className="absolute left-5 top-5 flex items-center gap-2 border border-invert bg-brand-primary/75 px-3 py-2 backdrop-blur-sm sm:left-7 sm:top-7">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-gold" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white sm:text-[10px]">
                  Um olhar sobre o acervo
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                <p className="text-[10px] uppercase tracking-[0.24em] text-accent-gold-ink sm:text-[11px]">
                  A arte de descobrir
                </p>
                <h2 className="mt-3 max-w-sm font-heading text-2xl leading-tight text-white sm:text-3xl">
                  Cada peça tem algo a contar.
                </h2>
                <button
                  onClick={() => navigateTo("/lotes")}
                  className="mt-5 inline-flex items-center gap-2 border-b border-accent-gold/70 pb-1.5 text-xs font-medium text-white transition-colors hover:text-accent-gold"
                >
                  Explorar o catálogo
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-2 flex items-center gap-3 border border-border-subtle bg-surface-base px-4 py-3 shadow-lg sm:-bottom-5 sm:-left-5 sm:px-5 sm:py-4">
              <div className="flex h-9 w-9 items-center justify-center bg-brand-primary text-accent-gold-ink">
                <Gavel className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">
                  Leilões com regras claras
                </p>
                <p className="mt-1 text-[10px] text-text-secondary">
                  Da oferta ao arremate
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative border-t border-invert">
          <div className="mx-auto flex max-w-350 items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
            <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 sm:text-[10px]">
              LANCE — CASA DE LEILÕES
            </span>
            <span className="text-right text-[9px] uppercase tracking-[0.15em] text-white/40 sm:text-[10px]">
              Colecionar é preservar histórias
            </span>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-350 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold-ink sm:text-[11px]">
              Explore o acervo
            </p>
            <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight text-brand-interactive sm:text-4xl">
              Encontre sua próxima descoberta.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">
              Diferentes universos, reunidos em um único catálogo.
            </p>
          </div>

          <button
            onClick={() => navigateTo("/lotes")}
            className="inline-flex w-fit items-center gap-2 border-b border-brand-primary/30 pb-2 text-xs font-semibold text-brand-interactive transition-colors hover:border-accent-gold hover:text-accent-gold"
          >
            Ver catálogo completo
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-px border border-surface-muted bg-surface-muted sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category, index) => (
            <button
              key={category.name}
              onClick={() => navigateTo(`/lotes?${category.query}`)}
              className="group flex min-h-38.75 flex-col justify-between bg-surface-subtle p-5 text-left transition-colors hover:bg-brand-primary sm:min-h-43.75 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-heading text-3xl font-normal text-text-secondary transition-colors group-hover:text-accent-gold">
                  0{index + 1}
                </span>
                <ArrowUpRight className="h-4 w-4 text-text-secondary transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-gold" />
              </div>

              <div>
                <h3 className="font-heading text-base font-semibold leading-snug text-brand-interactive transition-colors group-hover:text-white sm:text-lg">
                  {category.name}
                </h3>
                <p className="mt-2 text-xs text-text-secondary transition-colors group-hover:text-white/60">
                  {category.count > 0
                    ? `${category.count} ${category.unit}`
                    : "Explorar categoria"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* LOTES EM DESTAQUE */}
      <section className="border-y border-surface-muted bg-surface-muted">
        <div className="mx-auto max-w-350 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-gold-ink sm:text-[11px]">
                <Sparkles className="h-3.5 w-3.5" />
                Seleção do catálogo
              </div>
              <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight text-brand-interactive sm:text-4xl">
                Peças que merecem atenção.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">
                Conheça os lotes em destaque e descubra os detalhes de cada
                peça.
              </p>
            </div>

            <button
              onClick={() => navigateTo("/lotes")}
              className="inline-flex w-fit items-center gap-2 border-b border-brand-primary/30 pb-2 text-xs font-semibold text-brand-interactive transition-colors hover:border-accent-gold hover:text-accent-gold"
            >
              Explorar todos os lotes
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {featuredLots.length > 0 ? (
            <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {featuredLots.map(lot => (
                <LotCard key={lot.id} lot={lot} />
              ))}
            </div>
          ) : (
            <div className="mt-9 border border-dashed border-border-subtle bg-surface-base px-5 py-12 text-center sm:py-16">
              <Gavel className="mx-auto h-8 w-8 text-text-secondary" />
              <h3 className="mt-4 font-heading text-xl text-brand-interactive">
                Novas peças em preparação
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
                Enquanto isso, explore o catálogo completo de lotes disponíveis.
              </p>
              <button
                onClick={() => navigateTo("/lotes")}
                className="mt-5 inline-flex items-center gap-2 bg-brand-primary px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/85"
              >
                Abrir catálogo
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-8 flex flex-col justify-between gap-4 border-t border-border-subtle pt-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-semantic-success opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-semantic-success" />
              </span>
              <span>
                {liveLots.length}{" "}
                {liveLots.length === 1 ? "leilão ao vivo" : "leilões ao vivo"}{" "}
                no catálogo
              </span>
            </div>

            <button
              onClick={() => navigateTo("/lotes?status=LIVE")}
              className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-brand-interactive transition-colors hover:text-accent-gold"
            >
              Acompanhar disputas ao vivo
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section
        id="como-funciona"
        className="mx-auto max-w-350 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24"
      >
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-gold-ink sm:text-[11px]">
              Simplicidade em cada etapa
            </p>
            <h2 className="mt-3 max-w-md font-heading text-3xl font-medium leading-tight tracking-tight text-brand-interactive sm:text-4xl">
              Do primeiro olhar ao arremate.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-text-secondary">
              Uma experiência de leilão pensada para que você saiba o que está
              acontecendo em cada etapa, com informações claras e acompanhamento
              dos resultados.
            </p>

            <button
              onClick={() => navigateTo("/lotes")}
              className="mt-7 inline-flex items-center gap-2 bg-brand-primary px-5 py-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-primary/85"
            >
              Começar a explorar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="border-t border-border-subtle">
            {[
              {
                number: "01",
                title: "Explore os lotes",
                description:
                  "Navegue pelas categorias, examine as informações disponíveis e avalie cada peça antes de participar.",
              },
              {
                number: "02",
                title: "Faça seu lance",
                description:
                  "Confira o próximo valor mínimo e o incremento obrigatório. O sistema gerencia a reserva e a liberação do saldo conforme as regras do leilão.",
              },
              {
                number: "03",
                title: "Acompanhe o resultado",
                description:
                  "Acompanhe a disputa e consulte as informações do arremate caso seu lance seja vencedor.",
              },
            ].map(step => (
              <div
                key={step.number}
                className="group grid grid-cols-[42px_1fr] gap-4 border-b border-border-subtle py-6 sm:grid-cols-[58px_1fr] sm:gap-6 sm:py-8"
              >
                <span className="font-heading text-2xl font-normal text-text-secondary transition-colors group-hover:text-accent-gold sm:text-3xl">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-brand-interactive sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRANSPARÊNCIA */}
      <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
        <div className="relative mx-auto max-w-350 overflow-hidden bg-brand-primary px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-16 lg:py-16">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-border-subtle border-invert sm:-right-10 sm:-top-32 sm:h-96 sm:w-96" />
          <div className="pointer-events-none absolute -right-5 -top-10 h-56 w-56 rounded-full border border-border-subtle border-invert sm:h-72 sm:w-72" />

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-gold-ink sm:text-[11px]">
                <ShieldCheck className="h-4 w-4" />
                Transparência e auditoria pública
              </div>

              <h2 className="mt-4 max-w-2xl font-heading text-3xl font-medium leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Confiança também faz parte do acervo.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">
                Consulte a trilha de auditoria e conheça os registros encadeados
                por hash SHA-256, com mecanismos de verificação pública e
                proteção da identidade dos licitantes por pseudônimos.
              </p>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/70">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent-gold-ink" />
                  Registros verificáveis
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent-gold-ink" />
                  Identidades protegidas
                </span>
              </div>
            </div>

            <button
              onClick={() => navigateTo("/auditoria")}
              className="inline-flex w-fit items-center justify-center gap-3 bg-accent-gold px-5 py-4 text-xs font-semibold text-brand-interactive transition-colors hover:bg-accent-gold/85 sm:px-6"
            >
              Consultar auditoria
              <ArrowDownRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* RODAPÉ DA HOME */}
      <footer className="border-t border-surface-muted bg-surface-muted">
        <div className="mx-auto flex max-w-350 flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-accent-gold-ink" />
            <span className="font-heading text-sm font-semibold tracking-wide text-brand-interactive">
              LANCE
            </span>
            <span className="text-xs text-text-secondary">Casa de Leilões</span>
          </div>
          <p className="text-[10px] leading-5 text-text-secondary sm:text-right sm:text-xs">
            Arte, história e transparência em cada disputa.
          </p>
        </div>
      </footer>
    </main>
  );
};
