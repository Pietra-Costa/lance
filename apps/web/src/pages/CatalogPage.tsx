import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LotCard } from '../components/domain/LotCard';
import { LotStatus } from '../types/auction';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  PackageOpen,
  ArrowUpDown,
} from 'lucide-react';
import { formatBRL } from '../logic/auctionRules';

export const CatalogPage: React.FC = () => {
  const { lots, navigateTo, currentRoute } = useApp();

  // Parse initial query params if present in currentRoute
  const initialCat = useMemo(() => {
    if (currentRoute.includes('cat=Arte')) return 'Arte';
    if (currentRoute.includes('cat=Esculturas')) return 'Esculturas';
    if (currentRoute.includes('cat=Objetos')) return 'Objetos de coleção';
    if (currentRoute.includes('cat=Mobiliario')) return 'Mobiliário';
    if (currentRoute.includes('cat=Discos')) return 'Discos e edições musicais';
    return 'ALL';
  }, [currentRoute]);

  const initialStatus = useMemo(() => {
    if (currentRoute.includes('status=LIVE')) return 'LIVE';
    if (currentRoute.includes('status=SCHEDULED')) return 'SCHEDULED';
    if (currentRoute.includes('status=ENDED')) return 'ENDED';
    return 'ALL';
  }, [currentRoute]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [sortBy, setSortBy] = useState<'recent' | 'closingSoon' | 'lowestBid' | 'highestBid'>('closingSoon');
  const [maxPriceCents, setMaxPriceCents] = useState<number>(6000000); // R$ 60.000 max
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const categories = [
    'ALL',
    'Arte',
    'Esculturas',
    'Objetos de coleção',
    'Mobiliário',
    'Discos e edições musicais',
  ];

  const statuses = [
    { label: 'Todos os estados', value: 'ALL' },
    { label: 'Ao vivo (pregão aberto)', value: 'LIVE' },
    { label: 'Em breve (agendados)', value: 'SCHEDULED' },
    { label: 'Encerrados', value: 'ENDED' },
  ];

  const filteredLots = useMemo(() => {
    return lots.filter((lot) => {
      // Hide canceled lots from regular catalog as per spec
      if (lot.status === 'CANCELED') return false;

      // Category filter
      if (selectedCategory !== 'ALL' && lot.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && lot.status !== selectedStatus) {
        return false;
      }

      // Max price filter
      const effectivePrice = lot.currentBidCents > 0 ? lot.currentBidCents : lot.startingPriceCents;
      if (effectivePrice > maxPriceCents) {
        return false;
      }

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = lot.title.toLowerCase().includes(query);
        const matchesCode = lot.code.toLowerCase().includes(query);
        const matchesCategory = lot.category.toLowerCase().includes(query);
        const matchesCreator = lot.itemSnapshot.creator.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCode && !matchesCategory && !matchesCreator) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.currentBidCents || a.startingPriceCents;
      const priceB = b.currentBidCents || b.startingPriceCents;

      if (sortBy === 'lowestBid') return priceA - priceB;
      if (sortBy === 'highestBid') return priceB - priceA;
      if (sortBy === 'closingSoon') {
        return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      }
      // 'recent'
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });
  }, [lots, selectedCategory, selectedStatus, maxPriceCents, searchTerm, sortBy]);

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    searchTerm.trim() !== '' ||
    maxPriceCents < 6000000;

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSearchTerm('');
    setMaxPriceCents(6000000);
    setSortBy('closingSoon');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-[#68716A]">
        <button
          onClick={() => navigateTo('/')}
          className="hover:text-[#123D2F] cursor-pointer"
        >
          Início
        </button>
        <ChevronRight className="w-3 h-3 text-[#CDC5B4]" />
        <span className="text-[#222923] font-medium">Catálogo de Lotes</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2DDD2]">
        <div>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-[#123D2F]">
            Catálogo de Lotes
          </h1>
          <p className="text-xs sm:text-sm text-[#68716A] mt-1">
            Explore peças selecionadas com histórico e documentação registrada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden px-3.5 py-2.5 rounded-xl border border-[#CDC5B4] bg-white text-xs font-semibold text-[#222923] flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#123D2F]" />
            <span>Filtros {hasActiveFilters ? '(Ativos)' : ''}</span>
          </button>

          {/* Sort Select */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#CDC5B4] text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#68716A]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-[#222923] focus:outline-hidden cursor-pointer"
              aria-label="Ordenar lotes"
            >
              <option value="closingSoon">Encerramento mais próximo</option>
              <option value="recent">Mais recentes</option>
              <option value="lowestBid">Menor valor atual</option>
              <option value="highestBid">Maior valor atual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Filters Sidebar */}
        <aside
          className={`md:col-span-3 space-y-6 bg-white p-5 rounded-2xl border border-[#E2DDD2] ${
            mobileFilterOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD2]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#123D2F]" />
              <h3 className="font-heading font-bold text-sm text-[#123D2F]">
                Filtros do Catálogo
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-[#B91C1C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="md:hidden p-1 rounded text-[#68716A] hover:text-[#222923] hover:bg-[#FAF7F2]"
                aria-label="Fechar filtros"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search inside catalog */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#222923] block">
              Palavra-chave
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#68716A] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Título, autor, código..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#CDC5B4] focus:ring-1 focus:ring-[#123D2F] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#222923] block">
              Categoria
            </label>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    selectedCategory === cat
                      ? 'bg-[#123D2F] text-[#F5F1E7] font-semibold'
                      : 'text-[#68716A] hover:bg-[#FAF7F2] hover:text-[#222923]'
                  }`}
                >
                  <span>{cat === 'ALL' ? 'Todas as Categorias' : cat}</span>
                  {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#222923] block">
              Estado do Leilão
            </label>
            <div className="space-y-1">
              {statuses.map((st) => (
                <button
                  key={st.value}
                  onClick={() => setSelectedStatus(st.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    selectedStatus === st.value
                      ? 'bg-[#123D2F] text-[#F5F1E7] font-semibold'
                      : 'text-[#68716A] hover:bg-[#FAF7F2] hover:text-[#222923]'
                  }`}
                >
                  <span>{st.label}</span>
                  {selectedStatus === st.value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#222923]">Valor Máximo</span>
              <span className="font-mono font-bold text-[#123D2F]">
                {formatBRL(maxPriceCents)}
              </span>
            </div>
            <input
              type="range"
              min="100000"
              max="6000000"
              step="100000"
              value={maxPriceCents}
              onChange={(e) => setMaxPriceCents(parseInt(e.target.value))}
              className="w-full accent-[#123D2F] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#68716A]">
              <span>R$ 1.000</span>
              <span>R$ 60.000+</span>
            </div>
          </div>

          {/* Mobile Apply Button */}
          <div className="pt-2 md:hidden">
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-2.5 bg-[#123D2F] text-[#F5F1E7] rounded-xl font-semibold text-xs text-center cursor-pointer hover:bg-[#0A2B22] transition-colors"
            >
              Aplicar Filtros ({filteredLots.length} {filteredLots.length === 1 ? 'lote' : 'lotes'})
            </button>
          </div>
        </aside>

        {/* Results Grid */}
        <main className="md:col-span-9 space-y-6">
          {/* Active summary bar */}
          <div className="flex items-center justify-between text-xs text-[#68716A] px-1">
            <span>
              Mostrando <strong className="text-[#222923]">{filteredLots.length}</strong>{' '}
              {filteredLots.length === 1 ? 'lote disponível' : 'lotes disponíveis'}
            </span>
            {hasActiveFilters && (
              <span className="text-[#123D2F] font-medium hidden sm:inline">
                Filtros personalizados aplicados
              </span>
            )}
          </div>

          {/* Grid or Empty State */}
          {filteredLots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLots.map((lot) => (
                <LotCard key={lot.id} lot={lot} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2DDD2] p-12 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF7F2] border border-[#E2DDD2] flex items-center justify-center text-[#68716A]">
                <PackageOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-heading font-bold text-lg text-[#123D2F]">
                  Não encontramos lotes com esses filtros
                </h3>
                <p className="text-xs text-[#68716A]">
                  Tente ajustar ou limpar seus parâmetros de busca para visualizar as peças em
                  catálogo.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2.5 rounded-xl bg-[#123D2F] text-[#F5F1E7] text-xs font-semibold hover:bg-[#0A2B22] transition-colors cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
