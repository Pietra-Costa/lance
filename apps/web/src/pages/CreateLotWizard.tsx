import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { CatalogItem, CatalogSource, Lot } from "../types/auction";
import { formatBRL } from "../logic/auctionRules";
import { apiGet, apiPost } from "../services/api";
import {
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  LoaderCircle,
} from "lucide-react";

type ApiCatalogSource = "THE_MET" | "ARTIC" | "MUSICBRAINZ";

interface ApiCatalogItem {
  externalId: string;
  title: string;
  description: string | null;
  creator: string | null;
  date: string | null;
  medium: string | null;
  sourceUrl: string;
  imageUrl: string | null;
  attributes: Record<string, unknown>;
}

interface CatalogSearchResponse {
  items: ApiCatalogItem[];
  failedSources: ApiCatalogSource[];
}

interface CatalogImportResponse {
  id: string;
}

interface CreateLotResponse {
  id: string;
  status: string;
  startingPriceCents: number;
  minIncrementCents: number;
  startsAt: string;
  endsAt: string;
}

const SELLER_AGREEMENT_VERSION = "1.0.0-termo-leiloeiro";

const getSourceFromUrl = (sourceUrl: string): CatalogSource | null => {
  try {
    const hostname = new URL(sourceUrl).hostname.toLowerCase();

    if (hostname === "metmuseum.org" || hostname.endsWith(".metmuseum.org")) {
      return "The Met Collection";
    }

    if (hostname === "artic.edu" || hostname.endsWith(".artic.edu")) {
      return "Art Institute of Chicago";
    }

    if (
      hostname === "musicbrainz.org" ||
      hostname.endsWith(".musicbrainz.org") ||
      hostname === "coverartarchive.org" ||
      hostname.endsWith(".coverartarchive.org")
    ) {
      return "MusicBrainz & Cover Art";
    }

    return null;
  } catch {
    return null;
  }
};

const getApiSource = (source: CatalogSource): ApiCatalogSource => {
  switch (source) {
    case "The Met Collection":
      return "THE_MET";
    case "Art Institute of Chicago":
      return "ARTIC";
    case "MusicBrainz & Cover Art":
      return "MUSICBRAINZ";
  }
};

const mapCatalogItem = (item: ApiCatalogItem): CatalogItem | null => {
  const source = getSourceFromUrl(item.sourceUrl);

  if (!source) return null;

  return {
    source,
    externalId: item.externalId,
    title: item.title,
    creator: item.creator ?? "Autoria não informada",
    dateOrYear: item.date ?? "Data não informada",
    category:
      source === "MusicBrainz & Cover Art"
        ? "Discos e edições musicais"
        : "Arte",
    medium: item.medium ?? "Técnica não informada",
    dimensions: "Não informadas",
    description: item.description ?? "A fonte não forneceu uma descrição.",
    primaryImageUrl: item.imageUrl ?? "",
    additionalImages: [],
    licenseNotes:
      "Consulte os termos de uso e as condições de licenciamento da fonte original.",
    sourceUrl: item.sourceUrl,
  };
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado. Tente novamente.";
};

export const CreateLotWizard: React.FC = () => {
  const { navigateTo, addNotification } = useApp();

  const [currentStep, setCurrentStep] = useState(1);

  // Busca do catálogo
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState<ApiCatalogItem[]>([]);
  const [failedSources, setFailedSources] = useState<ApiCatalogSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const searchRequestId = useRef(0);

  // Item selecionado
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [verifiedRights, setVerifiedRights] = useState(false);

  // Parâmetros do lote
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Lot["category"]>("Arte");
  const [startingPriceBRL, setStartingPriceBRL] = useState(15000);
  const [minIncrementBRL, setMinIncrementBRL] = useState(1000);
  const [startsAtHours, setStartsAtHours] = useState(1);
  const [durationHours, setDurationHours] = useState(24);
  const [conditions, setConditions] = useState(
    "Peça em perfeito estado de conservação, armazenada sob temperatura e umidade controladas.",
  );

  // Publicação real
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishedLot, setPublishedLot] = useState<CreateLotResponse | null>(
    null,
  );

  // Busca automática com debounce e cancelamento lógico de requisições antigas.
  useEffect(() => {
    const query = searchQuery.trim();
    const requestId = ++searchRequestId.current;

    if (!query) {
      setCatalogResults([]);
      setFailedSources([]);
      setSearchError("");
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");

      try {
        const response = await apiGet<CatalogSearchResponse>(
          `/catalog/search?q=${encodeURIComponent(query)}`,
        );

        if (requestId !== searchRequestId.current) return;

        setCatalogResults(response.items ?? []);
        setFailedSources(response.failedSources ?? []);
        setHasSearched(true);
      } catch (error) {
        if (requestId !== searchRequestId.current) return;

        setCatalogResults([]);
        setFailedSources([]);
        setHasSearched(false);
        setSearchError(getErrorMessage(error));
      } finally {
        if (requestId === searchRequestId.current) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectItem = (item: ApiCatalogItem) => {
    const mappedItem = mapCatalogItem(item);

    if (!mappedItem) {
      setSearchError("Não foi possível identificar a origem deste resultado.");
      return;
    }

    setSelectedItem(mappedItem);
    setTitle(mappedItem.title);
    setCategory(mappedItem.category);
    setVerifiedRights(false);
    setSearchError("");
  };

  const validateLot = (): string | null => {
    if (!selectedItem) {
      return "Selecione um item do catálogo.";
    }

    if (!verifiedRights) {
      return "Confirme a verificação de procedência e direitos.";
    }

    if (!title.trim()) {
      return "Informe o título do lote.";
    }

    if (
      !Number.isFinite(startingPriceBRL) ||
      startingPriceBRL <= 0 ||
      !Number.isFinite(minIncrementBRL) ||
      minIncrementBRL <= 0
    ) {
      return "O lance inicial e o incremento devem ser maiores que zero.";
    }

    if (
      !Number.isFinite(startsAtHours) ||
      startsAtHours < 1 ||
      !Number.isFinite(durationHours) ||
      durationHours <= 0
    ) {
      return "O início deve ser futuro e a duração deve ser positiva.";
    }

    const startingPriceCents = Math.round(startingPriceBRL * 100);
    const minIncrementCents = Math.round(minIncrementBRL * 100);

    if (
      startingPriceCents > 1_000_000_000 ||
      minIncrementCents > 1_000_000_000
    ) {
      return "Os valores excedem o limite aceito pela API.";
    }

    if (startingPriceCents <= 0 || minIncrementCents <= 0) {
      return "Informe valores válidos em reais.";
    }

    return null;
  };

  const handlePublish = async () => {
    if (isPublishing) return;

    setPublishError("");

    const validationError = validateLot();

    if (validationError) {
      setPublishError(validationError);
      return;
    }

    if (!selectedItem) return;

    setIsPublishing(true);

    try {
      /*
       * 1. Importa o item do catálogo externo.
       * O backend retorna o ID interno do CatalogItem persistido.
       */
      const source = getApiSource(selectedItem.source);

      const importedItem = await apiPost<CatalogImportResponse>(
        `/catalog/${source}/${encodeURIComponent(selectedItem.externalId)}/import`,
        {},
      );

      if (!importedItem?.id) {
        throw new Error(
          "A API não retornou o identificador do item importado.",
        );
      }

      /*
       * 2. Calcula o agendamento.
       * O backend exige startsAt estritamente posterior ao horário atual.
       */
      const now = Date.now();

      const startsAt = new Date(
        now + startsAtHours * 60 * 60 * 1000,
      ).toISOString();

      const endsAt = new Date(
        now + (startsAtHours + durationHours) * 60 * 60 * 1000,
      ).toISOString();

      /*
       * 3. Cria o lote persistido no backend.
       * Os valores monetários são enviados em centavos.
       */
      const createdLot = await apiPost<CreateLotResponse>("/lots", {
        catalogItemId: importedItem.id,
        startingPriceCents: Math.round(startingPriceBRL * 100),
        minIncrementCents: Math.round(minIncrementBRL * 100),
        startsAt,
        endsAt,
      });

      setPublishedLot(createdLot);
      setCurrentStep(5);

      addNotification(
        {
          title: "Lote publicado",
          message: "O lote foi cadastrado com sucesso na API.",
          type: "success",
        },
      );
    } catch (error) {
      setPublishError(getErrorMessage(error));
    } finally {
      setIsPublishing(false);
    }
  };

  const renderImage = (imageUrl: string, alt: string, className: string) => {
    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={alt}
          className={className}
          onError={event => {
            event.currentTarget.style.display = "none";
          }}
        />
      );
    }

    return (
      <div
        className={`${className} flex items-center justify-center text-xs text-[#68716A]`}
      >
        Imagem não disponível
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#C8A96A] font-bold">
              CADASTRO DE PREGÃO
            </span>

            <h1 className="font-heading font-bold text-2xl sm:text-3xl text-[#123D2F]">
              Wizard de Criação de Lote
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigateTo("/leiloeiro")}
            className="text-xs text-[#68716A] hover:text-[#222923] font-medium"
          >
            Cancelar e Voltar
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2 text-xs">
          {[
            "1. Fonte & Busca",
            "2. Revisão",
            "3. Parâmetros",
            "4. Prévia",
            "5. Publicação",
          ].map((stepName, index) => {
            const step = index + 1;
            const active = step <= currentStep;

            return (
              <div key={stepName} className="space-y-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    active ? "bg-[#123D2F]" : "bg-[#E2DDD2]"
                  }`}
                />
                <span
                  className={`text-[10px] block ${
                    active ? "text-[#123D2F] font-bold" : "text-[#68716A]"
                  }`}
                >
                  {stepName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ETAPA 1 — Busca */}
      {currentStep === 1 && (
        <section className="bg-white rounded-2xl border border-[#E2DDD2] p-6 space-y-6">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#123D2F]">
              Etapa 1 — Pesquise no Acervo
            </h2>
            <p className="text-xs text-[#68716A] mt-1">
              Os resultados são consultados na API do catálogo.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="catalog-search"
              className="text-xs font-semibold text-[#222923] block"
            >
              Termo de pesquisa
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-[#68716A] absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="catalog-search"
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Título, autor, artista ou obra..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CDC5B4] text-xs focus:ring-2 focus:ring-[#123D2F] focus:outline-hidden"
              />
            </div>
          </div>

          {searchError && (
            <div
              role="alert"
              className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800"
            >
              {searchError}
            </div>
          )}

          {failedSources.length > 0 && (
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900">
              Algumas fontes não responderam: {failedSources.join(", ")}. Os
              resultados disponíveis continuam sendo exibidos.
            </div>
          )}

          <div className="space-y-3">
            <span className="text-xs font-semibold text-[#222923] block">
              Resultados
            </span>

            {isSearching && (
              <p className="text-xs text-[#68716A] py-4">
                Consultando as fontes do catálogo...
              </p>
            )}

            {!isSearching && hasSearched && catalogResults.length === 0 && (
              <div className="p-6 text-center rounded-xl border border-dashed border-[#CDC5B4]">
                <p className="text-xs font-semibold text-[#222923]">
                  Nenhum resultado encontrado
                </p>
                <p className="text-[11px] text-[#68716A] mt-1">
                  Tente outro termo de pesquisa.
                </p>
              </div>
            )}

            {!isSearching && !hasSearched && !searchError && (
              <p className="text-xs text-[#68716A] py-3">
                Digite um termo para pesquisar nas fontes conectadas.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
              {catalogResults.map((item, index) => {
                const mappedItem = mapCatalogItem(item);
                const selectable = mappedItem !== null;

                const selected =
                  selectable &&
                  selectedItem?.externalId === item.externalId &&
                  selectedItem?.source === mappedItem.source;

                return (
                  <button
                    key={`${item.sourceUrl}-${item.externalId}-${index}`}
                    type="button"
                    disabled={!selectable || isSearching}
                    onClick={() => handleSelectItem(item)}
                    className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                      !selectable
                        ? "border-[#E2DDD2] opacity-60 cursor-not-allowed"
                        : selected
                          ? "border-[#123D2F] bg-[#123D2F]/5 ring-1 ring-[#123D2F]"
                          : "border-[#E2DDD2] hover:border-[#CDC5B4]"
                    }`}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-[#FAF7F2] border border-[#E2DDD2] shrink-0 flex items-center justify-center">
                        <Search className="w-5 h-5 text-[#9A9385]" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-[#68716A] block truncate">
                        {mappedItem?.source ?? "Origem não identificada"}
                      </span>
                      <h4 className="font-heading font-semibold text-xs text-[#222923]">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-[#68716A] truncate">
                        {item.creator ?? "Autoria não informada"}
                      </p>
                    </div>

                    {selected && (
                      <CheckCircle2 className="w-4 h-4 text-[#123D2F] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedItem && (
            <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E2DDD2] text-xs">
              <span className="text-[#68716A]">Item selecionado:</span>{" "}
              <strong className="text-[#123D2F]">{selectedItem.title}</strong>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-[#E2DDD2]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!selectedItem}
              className="px-6 py-2.5 rounded-xl bg-[#123D2F] text-[#F5F1E7] font-semibold text-xs disabled:opacity-40 flex items-center gap-2"
            >
              Avançar para Revisão
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ETAPA 2 — Procedência */}
      {currentStep === 2 && selectedItem && (
        <section className="bg-white rounded-2xl border border-[#E2DDD2] p-6 space-y-6">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#123D2F]">
              Etapa 2 — Revisão do Item e Direitos
            </h2>
            <p className="text-xs text-[#68716A] mt-1">
              Confira os metadados antes de prosseguir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#E2DDD2]">
              {renderImage(
                selectedItem.primaryImageUrl,
                selectedItem.title,
                "w-full h-full object-cover",
              )}
            </div>

            <div className="md:col-span-2 space-y-3 text-xs">
              <div>
                <span className="text-[#68716A] block text-[11px]">
                  Fonte identificada
                </span>
                <span className="font-semibold text-[#123D2F]">
                  {selectedItem.source}
                </span>
                <span className="text-[#68716A] text-[10px] ml-2 font-mono">
                  ID externo: {selectedItem.externalId}
                </span>
              </div>

              <div>
                <span className="text-[#68716A] block text-[11px]">Título</span>
                <span className="font-bold text-sm text-[#222923]">
                  {selectedItem.title}
                </span>
              </div>

              <div>
                <span className="text-[#68716A] block text-[11px]">
                  Autor / atribuição
                </span>
                <span className="font-medium text-[#222923]">
                  {selectedItem.creator}
                </span>
              </div>

              <div>
                <span className="text-[#68716A] block text-[11px]">Data</span>
                <span className="text-[#222923]">
                  {selectedItem.dateOrYear}
                </span>
              </div>

              <div>
                <span className="text-[#68716A] block text-[11px]">
                  Descrição
                </span>
                <p className="text-[#68716A] leading-relaxed mt-0.5">
                  {selectedItem.description}
                </p>
              </div>

              <a
                href={selectedItem.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#123D2F] underline underline-offset-2 inline-block"
              >
                Consultar registro na fonte original
              </a>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
              <AlertTriangle className="w-4 h-4" />
              Verificação de direitos e procedência
            </div>

            <p className="text-[11px] text-[#68716A] leading-relaxed">
              {selectedItem.licenseNotes} A existência de uma imagem na API não
              garante autorização para seu uso comercial. Verifique as condições
              da fonte original.
            </p>

            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedRights}
                onChange={event => setVerifiedRights(event.target.checked)}
                className="mt-0.5 rounded border-[#CDC5B4] text-[#123D2F]"
              />
              <span className="text-xs font-medium text-[#222923]">
                Confirmo que verifiquei a adequação das condições de imagem,
                procedência e dados para criação deste lote.
              </span>
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#E2DDD2]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 rounded-xl border border-[#E2DDD2] text-[#68716A] text-xs font-medium flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={!verifiedRights}
              className="px-6 py-2.5 rounded-xl bg-[#123D2F] text-[#F5F1E7] font-semibold text-xs disabled:opacity-40 flex items-center gap-2"
            >
              Configurar Parâmetros
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ETAPA 3 — Parâmetros */}
      {currentStep === 3 && selectedItem && (
        <section className="bg-white rounded-2xl border border-[#E2DDD2] p-6 space-y-6">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#123D2F]">
              Etapa 3 — Parâmetros do Pregão
            </h2>
            <p className="text-xs text-[#68716A] mt-1">
              Os preços serão enviados à API em centavos de real.
            </p>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="lot-title"
              className="text-xs font-semibold text-[#222923] block"
            >
              Título de exibição do lote
            </label>
            <input
              id="lot-title"
              type="text"
              value={title}
              onChange={event => setTitle(event.target.value)}
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDC5B4] text-xs focus:ring-2 focus:ring-[#123D2F] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="lot-category"
                className="text-xs font-semibold text-[#222923] block"
              >
                Categoria
              </label>
              <select
                id="lot-category"
                value={category}
                onChange={event =>
                  setCategory(event.target.value as Lot["category"])
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDC5B4] text-xs bg-white"
              >
                <option value="Arte">Arte</option>
                <option value="Esculturas">Esculturas</option>
                <option value="Objetos de coleção">Objetos de coleção</option>
                <option value="Mobiliário">Mobiliário</option>
                <option value="Discos e edições musicais">
                  Discos e edições musicais
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="starting-price"
                className="text-xs font-semibold text-[#222923] block"
              >
                Lance inicial (R$)
              </label>
              <input
                id="starting-price"
                type="number"
                min="0.01"
                step="0.01"
                value={startingPriceBRL}
                onChange={event =>
                  setStartingPriceBRL(Number(event.target.value))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDC5B4] text-xs"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="minimum-increment"
                className="text-xs font-semibold text-[#222923] block"
              >
                Incremento mínimo (R$)
              </label>
              <input
                id="minimum-increment"
                type="number"
                min="0.01"
                step="0.01"
                value={minIncrementBRL}
                onChange={event =>
                  setMinIncrementBRL(Number(event.target.value))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDC5B4] text-xs"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="auction-start"
                className="text-xs font-semibold text-[#222923] block"
              >
                Início do pregão
              </label>
              <select
                id="auction-start"
                value={startsAtHours}
                onChange={event => setStartsAtHours(Number(event.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDC5B4] text-xs bg-white"
              >
                <option value={1}>Em 1 hora</option>
                <option value={12}>Em 12 horas</option>
                <option value={24}>Em 24 horas</option>
                <option value={48}>Em 48 horas</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label
                htmlFor="auction-duration"
                className="text-xs font-semibold text-[#222923] block"
              >
                Duração do pregão
              </label>
              <select
                id="auction-duration"
                value={durationHours}
                onChange={event => setDurationHours(Number(event.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDC5B4] text-xs bg-white"
              >
                <option value={1}>1 hora</option>
                <option value={6}>6 horas</option>
                <option value={12}>12 horas</option>
                <option value={24}>24 horas</option>
                <option value={48}>48 horas</option>
                <option value={72}>72 horas</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="lot-conditions"
              className="text-xs font-semibold text-[#222923] block"
            >
              Condições especiais e observações do leiloeiro
            </label>
            <textarea
              id="lot-conditions"
              rows={3}
              value={conditions}
              onChange={event => setConditions(event.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDC5B4] text-xs leading-relaxed"
            />
            <p className="text-[10px] text-[#68716A]">
              Observação: o endpoint atual de criação não recebe esse campo. Ele
              permanece na interface, mas ainda não é persistido.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#E2DDD2]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 rounded-xl border border-[#E2DDD2] text-[#68716A] text-xs font-medium flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <button
              type="button"
              onClick={() => {
                const error = validateLot();
                if (error) {
                  setPublishError(error);
                  return;
                }
                setPublishError("");
                setCurrentStep(4);
              }}
              className="px-6 py-2.5 rounded-xl bg-[#123D2F] text-[#F5F1E7] font-semibold text-xs flex items-center gap-2"
            >
              Pré-visualizar Lote
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* ETAPA 4 — Prévia */}
      {currentStep === 4 && selectedItem && (
        <section className="space-y-6">
          <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#CDC5B4]">
            <h2 className="font-heading font-bold text-base text-[#123D2F]">
              Etapa 4 — Pré-visualização do Lote
            </h2>
            <p className="text-xs text-[#68716A] mt-1">
              Revise as informações antes de publicar na API.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2DDD2] p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#E2DDD2]">
              {renderImage(
                selectedItem.primaryImageUrl,
                title,
                "w-full h-full object-cover",
              )}
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-[#68716A] block">
                  PRÉ-VISUALIZAÇÃO
                </span>
                <span className="text-[#68716A] text-[10px] block">
                  {category}
                </span>
                <h3 className="font-heading font-bold text-xl text-[#123D2F] leading-snug mt-1">
                  {title}
                </h3>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2] space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="text-[#68716A]">Lance inicial:</span>
                  <span className="font-mono font-bold text-base text-[#123D2F]">
                    {formatBRL(Math.round(startingPriceBRL * 100))}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-[#68716A]">Incremento mínimo:</span>
                  <span className="font-semibold text-[#222923]">
                    {formatBRL(Math.round(minIncrementBRL * 100))}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-[#68716A]">Início:</span>
                  <span className="font-semibold text-[#222923]">
                    {new Date(
                      Date.now() + startsAtHours * 60 * 60 * 1000,
                    ).toLocaleString("pt-BR")}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-[#68716A]">Duração:</span>
                  <span className="font-semibold text-[#222923]">
                    {durationHours} hora(s)
                  </span>
                </div>
              </div>

              <p className="text-[#68716A] leading-relaxed">
                {selectedItem.description}
              </p>

              {conditions.trim() && (
                <div>
                  <span className="font-semibold text-[#222923] block mb-1">
                    Condições do leiloeiro
                  </span>
                  <p className="text-[#68716A] leading-relaxed">{conditions}</p>
                </div>
              )}
            </div>
          </div>

          {publishError && (
            <div
              role="alert"
              className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800"
            >
              {publishError}
            </div>
          )}

          <div className="flex justify-between pt-4 gap-3">
            <button
              type="button"
              disabled={isPublishing}
              onClick={() => {
                setPublishError("");
                setCurrentStep(3);
              }}
              className="px-4 py-2.5 rounded-xl border border-[#E2DDD2] text-[#68716A] text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Editar Parâmetros
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-6 py-3 rounded-xl bg-[#123D2F] text-[#F5F1E7] font-semibold text-xs disabled:opacity-50 flex items-center gap-2"
            >
              {isPublishing ? (
                <>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#C8A96A]" />
                  Publicar Lote
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* ETAPA 5 — Confirmação da publicação real */}
      {currentStep === 5 && selectedItem && publishedLot && (
        <section className="bg-white rounded-2xl border border-[#E2DDD2] p-8 text-center space-y-5 shadow-lg">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#EAF7EE] text-[#1E7E34] flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="font-heading font-bold text-2xl text-[#123D2F]">
              Lote publicado
            </h2>
            <p className="text-xs text-[#68716A]">
              A API confirmou o cadastro do lote.
            </p>
          </div>

          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E2DDD2] max-w-md mx-auto text-xs text-left space-y-3">
            <div className="flex justify-between gap-3">
              <span className="text-[#68716A]">Identificador:</span>
              <span className="font-mono font-semibold text-[#222923] break-all">
                {publishedLot.id}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#68716A]">Título:</span>
              <span className="font-semibold text-[#222923]">{title}</span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#68716A]">Lance inicial:</span>
              <span className="font-mono font-bold text-[#123D2F]">
                {formatBRL(publishedLot.startingPriceCents)}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#68716A]">Status:</span>
              <span className="font-semibold text-[#123D2F]">
                {publishedLot.status}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#68716A]">Início:</span>
              <span className="text-right">
                {new Date(publishedLot.startsAt).toLocaleString("pt-BR")}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-[#68716A]">Encerramento:</span>
              <span className="text-right">
                {new Date(publishedLot.endsAt).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigateTo("/lotes")}
              className="px-5 py-2.5 rounded-xl bg-[#123D2F] text-[#F5F1E7] font-semibold text-xs"
            >
              Abrir Catálogo de Lotes
            </button>

            <button
              type="button"
              onClick={() => navigateTo("/leiloeiro/lotes")}
              className="px-5 py-2.5 rounded-xl border border-[#123D2F] text-[#123D2F] font-semibold text-xs"
            >
              Voltar à Gestão de Lotes
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
