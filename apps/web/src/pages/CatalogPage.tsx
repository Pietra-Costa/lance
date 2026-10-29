import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { LotCard } from "../components/domain/LotCard";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  PackageOpen,
  ArrowUpDown,
  ArrowRight,
} from "lucide-react";
import { formatBRL } from "../logic/auctionRules";

type SortOption = "recent" | "closingSoon" | "lowestBid" | "highestBid";

export const CatalogPage: React.FC = () => {
  const { lots, navigateTo, currentRoute } = useApp();

  // Query string real da rota: /lotes?q=...&cat=...&status=...
  const routeParams = useMemo(() => {
    const queryIndex = currentRoute.indexOf("?");

    if (queryIndex === -1) {
      return new URLSearchParams();
    }

    return new URLSearchParams(currentRoute.slice(queryIndex + 1));
  }, [currentRoute]);

  const initialCategoryParam = routeParams.get("cat") ?? "ALL";
  const initialSearchParam = routeParams.get("q") ?? "";
  const initialStatusParam = routeParams.get("status") ?? "ALL";

  const [searchTerm, setSearchTerm] = useState(initialSearchParam);
  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategoryParam);
  const [selectedStatus, setSelectedStatus] =
    useState<string>(initialStatusParam);
  const [sortBy, setSortBy] = useState<SortOption>("closingSoon");
  const [maxPriceCents, setMaxPriceCents] = useState<number>(6000000);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const categories = [
    "ALL",
    "Arte",
    "Esculturas",
    "Objetos de coleção",
    "Mobiliário",
    "Discos e edições musicais",
  ];

  const statuses = [
    { label: "Todos os estados", value: "ALL" },
    { label: "Ao vivo (pregão aberto)", value: "LIVE" },
    { label: "Em breve (agendados)", value: "SCHEDULED" },
    { label: "Encerrados", value: "ENDED" },
  ];

  const filteredLots = useMemo(() => {
    return lots
      .filter((lot) => {
        if (lot.status === "CANCELED") return false;

        if (selectedCategory !== "ALL" && lot.category !== selectedCategory) {
          return false;
        }

        if (selectedStatus !== "ALL" && lot.status !== selectedStatus) {
          return false;
        }

        const effectivePrice =
          lot.currentBidCents > 0
            ? lot.currentBidCents
            : lot.startingPriceCents;

        if (effectivePrice > maxPriceCents) return false;

        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();

          const matchesTitle = lot.title.toLowerCase().includes(query);
          const matchesCode = lot.code.toLowerCase().includes(query);
          const matchesCategory = lot.category.toLowerCase().includes(query);
          const matchesCreator = lot.itemSnapshot.creator
            .toLowerCase()
            .includes(query);

          if (
            !matchesTitle &&
            !matchesCode &&
            !matchesCategory &&
            !matchesCreator
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Lotes encerrados ficam sempre por último.
        const weight: Record<string, number> = {
          LIVE: 0,
          SCHEDULED: 1,
          ENDED: 2,
          CANCELED: 3,
        };

        const byStatus = (weight[a.status] ?? 9) - (weight[b.status] ?? 9);

        if (byStatus !== 0) return byStatus;

        const priceA = a.currentBidCents || a.startingPriceCents;
        const priceB = b.currentBidCents || b.startingPriceCents;

        if (sortBy === "lowestBid") return priceA - priceB;
        if (sortBy === "highestBid") return priceB - priceA;

        if (sortBy === "closingSoon") {
          if (a.status === "ENDED") {
            return new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime();
          }

          return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
        }

        return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
      });
  }, [
    lots,
    selectedCategory,
    selectedStatus,
    maxPriceCents,
    searchTerm,
    sortBy,
  ]);

  const hasActiveFilters =
    selectedCategory !== "ALL" ||
    selectedStatus !== "ALL" ||
    searchTerm.trim() !== "" ||
    maxPriceCents < 6000000;

  const handleResetFilters = () => {
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
    setSearchTerm("");
    setMaxPriceCents(6000000);
    setSortBy("closingSoon");
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary">
      <div className="mx-auto max-w-360 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <nav
          aria-label="Navegação estrutural"
          className="mb-10 flex items-center gap-2 text-xs text-text-secondary"
        >
          <button
            onClick={() => navigateTo("/")}
            className="cursor-pointer transition-colors hover:text-brand-primary"
          >
            Início
          </button>

          <ChevronRight className="h-3 w-3 text-border-strong" />

          <span className="font-medium text-text-primary">
            Catálogo de Lotes
          </span>
        </nav>

        <header className="relative border-b border-border-subtle pb-8 sm:pb-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-accent-gold" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-text-secondary">
                  Acervo · Pregões · Descobertas
                </span>
              </div>

              <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-brand-primary sm:text-5xl lg:text-6xl">
                Catálogo de
                <br className="hidden sm:block" /> Lotes
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-text-secondary sm:text-base">
                Explore peças selecionadas com histórico e documentação
                registrada.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end lg:min-w-85 lg:justify-end">
              <div className="border-l-2 border-accent-gold pl-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                  Peças no catálogo
                </p>
                <p className="mt-1 font-heading text-3xl font-semibold tabular-nums text-brand-primary">
                  {filteredLots.length.toString().padStart(2, "0")}
                </p>
              </div>

              <div className="flex items-center gap-3 border-t border-border-subtle pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                <button
                  onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                  aria-expanded={mobileFilterOpen}
                  className="inline-flex items-center gap-2 border border-border-strong px-3 py-3 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary hover:text-surface-base md:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros {hasActiveFilters ? "(Ativos)" : ""}
                </button>

                <div className="flex min-w-0 items-center gap-2 border-b border-border-strong py-3">
                  <ArrowUpDown className="h-4 w-4 shrink-0 text-brand-primary" />

                  <label htmlFor="catalog-sort" className="sr-only">
                    Ordenar lotes
                  </label>

                  <select
                    id="catalog-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full cursor-pointer bg-transparent text-xs font-medium text-text-primary outline-none sm:w-auto"
                    aria-label="Ordenar lotes"
                  >
                    <option value="closingSoon">
                      Encerramento mais próximo
                    </option>
                    <option value="recent">Mais recentes</option>
                    <option value="lowestBid">Menor valor atual</option>
                    <option value="highestBid">Maior valor atual</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-10 pt-8 md:grid-cols-12 lg:gap-14 lg:pt-10">
          <aside
            aria-label="Filtros do catálogo"
            className={`md:col-span-4 lg:col-span-3 ${
              mobileFilterOpen ? "block" : "hidden md:block"
            }`}
          >
            <div className="md:sticky md:top-8">
              <div className="flex items-center justify-between border-b border-brand-primary pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-secondary">
                    Refinar busca
                  </span>
                  <h2 className="mt-1 font-heading text-xl font-semibold text-brand-primary">
                    Filtros
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 text-text-secondary hover:text-brand-primary md:hidden"
                    aria-label="Fechar filtros"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <section className="border-b border-border-subtle py-6">
                <label
                  htmlFor="catalog-search"
                  className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary"
                >
                  Palavra-chave
                </label>

                <div className="flex items-center gap-3 border-b border-border-strong pb-3 transition-colors focus-within:border-brand-primary">
                  <Search className="h-4 w-4 shrink-0 text-brand-primary" />

                  <input
                    id="catalog-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Título, autor, código..."
                    className="min-w-0 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      aria-label="Limpar busca"
                      className="text-text-secondary hover:text-brand-primary"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </section>

              <section className="border-b border-border-subtle py-6">
                <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                  Categoria
                </h3>

                <div className="space-y-0.5">
                  {categories.map((cat, index) => {
                    const isSelected = selectedCategory === cat;

                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        aria-pressed={isSelected}
                        className={`group flex w-full cursor-pointer items-center justify-between gap-3 border-l-2 px-3 py-3 text-left text-xs transition-colors ${
                          isSelected
                            ? "border-accent-gold bg-brand-primary/5 font-semibold text-brand-primary"
                            : "border-transparent text-text-secondary hover:border-border-strong hover:text-brand-primary"
                        }`}
                      >
                        <span>
                          <span className="mr-3 font-mono text-[10px] text-text-secondary">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {cat === "ALL" ? "Todas as Categorias" : cat}
                        </span>

                        {isSelected && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-gold" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="border-b border-border-subtle py-6">
                <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                  Estado do Leilão
                </h3>

                <div className="space-y-0.5">
                  {statuses.map((status, index) => {
                    const isSelected = selectedStatus === status.value;

                    return (
                      <button
                        key={status.value}
                        onClick={() => setSelectedStatus(status.value)}
                        aria-pressed={isSelected}
                        className={`group flex w-full cursor-pointer items-center justify-between gap-3 border-l-2 px-3 py-3 text-left text-xs transition-colors ${
                          isSelected
                            ? "border-accent-gold bg-brand-primary/5 font-semibold text-brand-primary"
                            : "border-transparent text-text-secondary hover:border-border-strong hover:text-brand-primary"
                        }`}
                      >
                        <span>
                          <span className="mr-3 font-mono text-[10px] text-text-secondary">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {status.label}
                        </span>

                        {isSelected && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-gold" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Price range */}
              <section className="py-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                      Faixa de preço
                    </h3>
                    <p className="mt-2 text-xs text-text-secondary">
                      Valor máximo do lote
                    </p>
                  </div>

                  <span className="font-mono text-sm font-semibold text-brand-primary">
                    {formatBRL(maxPriceCents)}
                  </span>
                </div>

                <input
                  type="range"
                  min="100000"
                  max="6000000"
                  step="100000"
                  value={maxPriceCents}
                  onChange={(e) =>
                    setMaxPriceCents(parseInt(e.target.value, 10))
                  }
                  aria-label="Valor máximo do lote"
                  className="w-full cursor-pointer accent-brand-primary"
                />

                <div className="mt-3 flex justify-between text-[10px] text-text-secondary">
                  <span>R$ 1.000</span>
                  <span>R$ 60.000+</span>
                </div>
              </section>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex w-full items-center justify-center gap-2 border border-border-strong px-4 py-3 text-xs font-semibold text-brand-primary transition-colors hover:bg-brand-primary hover:text-surface-base"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar filtros
                </button>
              )}

              <div className="pt-4 md:hidden">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex w-full items-center justify-center gap-2 bg-brand-primary px-4 py-3.5 text-xs font-semibold text-surface-base transition-colors hover:bg-brand-deep"
                >
                  Ver {filteredLots.length}{" "}
                  {filteredLots.length === 1 ? "lote" : "lotes"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </aside>

          <main className="min-w-0 md:col-span-8 lg:col-span-9">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
                  Acervo disponível
                </p>

                <p className="mt-2 text-sm text-text-primary">
                  <strong className="font-semibold text-brand-primary">
                    {filteredLots.length}
                  </strong>{" "}
                  {filteredLots.length === 1
                    ? "lote encontrado"
                    : "lotes encontrados"}
                </p>
              </div>

              {hasActiveFilters && (
                <span className="text-[10px] uppercase tracking-[0.12em] text-text-secondary">
                  Busca personalizada
                </span>
              )}
            </div>

            {filteredLots.length > 0 ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {filteredLots.map((lot) => (
                  <LotCard key={lot.id} lot={lot} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-105 flex-col items-center justify-center border-y border-border-subtle px-6 py-16 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center border border-border-strong text-brand-primary">
                  <PackageOpen className="h-7 w-7" strokeWidth={1.2} />
                </div>

                <span className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
                  Nenhum resultado
                </span>

                <h2 className="max-w-md font-heading text-2xl font-semibold leading-tight text-brand-primary sm:text-3xl">
                  Não encontramos lotes com esses filtros
                </h2>

                <p className="mt-4 max-w-sm text-sm leading-6 text-text-secondary">
                  Tente ajustar ou limpar seus parâmetros de busca para
                  visualizar as peças em catálogo.
                </p>

                <button
                  onClick={handleResetFilters}
                  className="mt-8 inline-flex items-center gap-3 border-b border-brand-primary pb-2 text-xs font-semibold text-brand-primary transition-colors hover:border-accent-gold hover:text-text-primary"
                >
                  Limpar todos os filtros
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
