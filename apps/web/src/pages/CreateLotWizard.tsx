import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useApp } from "../context/AppContext";
import type { CatalogItem, CatalogSource, Lot } from "../types/auction";
import { formatBRL } from "../logic/auctionRules";
import { apiGet, apiPost } from "../services/api";
import { ItemImage } from "../components/domain/ItemImage";
import {
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  LoaderCircle,
  Image as ImageIcon,
  ShieldCheck,
  FileCheck2,
  Gavel,
  Clock3,
  CircleDollarSign,
  CalendarClock,
  ExternalLink,
  RefreshCw,
  PackageCheck,
  ArrowUpRight,
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
  sources?: ApiCatalogSource[];
  offset?: number;
  limit?: number;
  hasMore?: boolean;
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

const RESULTS_PER_PAGE = 20;

const LOT_CATEGORIES = [
  "Arte",
  "Esculturas",
  "Objetos de coleção",
  "Mobiliário",
  "Discos e edições musicais",
] as const;

const STEPS = [
  { number: 1, label: "Acervo", description: "Escolha a peça", icon: Search },
  {
    number: 2,
    label: "Procedência",
    description: "Revise os dados",
    icon: ShieldCheck,
  },
  {
    number: 3,
    label: "Configuração",
    description: "Defina o pregão",
    icon: Gavel,
  },
  {
    number: 4,
    label: "Prévia",
    description: "Confira o lote",
    icon: FileCheck2,
  },
  {
    number: 5,
    label: "Publicação",
    description: "Conclua o cadastro",
    icon: PackageCheck,
  },
];

const SOURCES = [
  { value: "ALL", label: "Todas as fontes", shortLabel: "Todas" },
  { value: "THE_MET", label: "The Met", shortLabel: "The Met" },
  { value: "ARTIC", label: "Art Institute", shortLabel: "Art Institute" },
  { value: "MUSICBRAINZ", label: "MusicBrainz", shortLabel: "MusicBrainz" },
] as const;

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

const getApiSourceFromItem = (
  item: ApiCatalogItem,
): ApiCatalogSource | null => {
  const url = item.sourceUrl ?? "";

  if (url.includes("metmuseum.org")) return "THE_MET";
  if (url.includes("artic.edu")) return "ARTIC";
  if (url.includes("musicbrainz.org") || url.includes("coverartarchive.org")) {
    return "MUSICBRAINZ";
  }

  return null;
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

const inputClassName =
  "w-full rounded-xl border border-border-strong bg-surface-card px-4 py-3 text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-text-secondary/70 hover:border-brand-primary/50 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10";

const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-brand-on-dark shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-deep hover:shadow-md focus:outline-none focus:ring-4 focus:ring-brand-primary/20 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0";

const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-card px-4 py-3 text-sm font-semibold text-text-primary transition-all duration-200 hover:border-brand-primary hover:bg-brand-primary/5 focus:outline-none focus:ring-4 focus:ring-brand-primary/10 disabled:pointer-events-none disabled:opacity-50";

const SectionHeading: React.FC<{
  eyebrow?: string;
  title: string;
  description?: string;
}> = ({ eyebrow, title, description }) => (
  <div className="space-y-2">
    {eyebrow && (
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-gold-ink">
        {eyebrow}
      </span>
    )}
    <h2 className="font-heading text-xl font-bold tracking-tight text-brand-interactive sm:text-2xl">
      {title}
    </h2>
    {description && (
      <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
    )}
  </div>
);

const FormField: React.FC<{
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, hint, children }) => (
  <div className="space-y-2">
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold text-text-primary"
    >
      {label}
    </label>
    {children}
    {hint && (
      <p className="text-[11px] leading-relaxed text-text-secondary">{hint}</p>
    )}
  </div>
);

const AlertMessage: React.FC<{
  children: React.ReactNode;
  variant?: "error" | "warning" | "success";
}> = ({ children, variant = "error" }) => {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-relaxed ${styles[variant]}`}
    >
      {variant === "warning" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : variant === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div>{children}</div>
    </div>
  );
};

const SummaryRow: React.FC<{
  label: string;
  value: React.ReactNode;
  emphasized?: boolean;
}> = ({ label, value, emphasized = false }) => (
  <div className="flex items-start justify-between gap-4 border-b border-border-subtle py-3 last:border-b-0 last:pb-0">
    <span className="text-xs text-text-secondary">{label}</span>
    <span
      className={`max-w-[65%] break-words text-right text-xs ${
        emphasized
          ? "font-mono text-base font-bold text-brand-interactive"
          : "font-medium text-text-primary"
      }`}
    >
      {value}
    </span>
  </div>
);

export const CreateLotWizard: React.FC = () => {
  const { navigateTo, addNotification } = useApp();

  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState<ApiCatalogItem[]>([]);
  const [failedSources, setFailedSources] = useState<ApiCatalogSource[]>([]);
  const [sourceFilter, setSourceFilter] = useState<ApiCatalogSource | "ALL">(
    "ALL",
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const searchRequestId = useRef(0);
  const selectionActionsRef = useRef<HTMLDivElement | null>(null);

  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [verifiedRights, setVerifiedRights] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Lot["category"]>("Arte");
  const [startingPriceBRL, setStartingPriceBRL] = useState(15000);
  const [minIncrementBRL, setMinIncrementBRL] = useState(1000);
  const [startsAtHours, setStartsAtHours] = useState(1);
  const [durationHours, setDurationHours] = useState(24);
  const [conditions, setConditions] = useState(
    "Peça em perfeito estado de conservação, armazenada sob temperatura e umidade controladas.",
  );
  const [sellerNotes, setSellerNotes] = useState("");

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishedLot, setPublishedLot] = useState<CreateLotResponse | null>(
    null,
  );

  const loadCatalogPage = useCallback(
    async (options: {
      query: string;
      offset: number;
      mode: "replace" | "append";
    }) => {
      const requestId = ++searchRequestId.current;

      if (options.mode === "append") {
        setIsLoadingMore(true);
      } else {
        setIsSearching(true);
        setSearchError("");
      }

      try {
        const params = new URLSearchParams({
          offset: String(options.offset),
          limit: String(RESULTS_PER_PAGE),
        });

        if (options.query.trim()) {
          params.set("q", options.query.trim());
        }

        const response = await apiGet<CatalogSearchResponse>(
          `/catalog/search?${params.toString()}`,
        );

        if (requestId !== searchRequestId.current) return;

        setCatalogResults(previous =>
          options.mode === "append"
            ? [...previous, ...(response.items ?? [])]
            : (response.items ?? []),
        );

        setFailedSources(response.failedSources ?? []);
        setHasSearched(true);
        setHasMore(Boolean(response.hasMore));
      } catch (error) {
        if (requestId !== searchRequestId.current) return;

        if (options.mode === "replace") {
          setCatalogResults([]);
          setFailedSources([]);
          setHasSearched(false);
        }

        setSearchError(getErrorMessage(error));
      } finally {
        if (requestId === searchRequestId.current) {
          setIsSearching(false);
          setIsLoadingMore(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setCatalogResults([]);
      setHasSearched(false);
      setHasMore(false);
      setFailedSources([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadCatalogPage({ query, offset: 0, mode: "replace" });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, loadCatalogPage]);

  const filteredCatalogResults = useMemo(() => {
    if (sourceFilter === "ALL") return catalogResults;

    return catalogResults.filter(
      item => getApiSourceFromItem(item) === sourceFilter,
    );
  }, [catalogResults, sourceFilter]);

  useEffect(() => {
    if (!selectedItem || currentStep !== 1) return;

    selectionActionsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [selectedItem, currentStep]);

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
      startsAtHours < 0 ||
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

      const now = Date.now();

      const startsAt = new Date(
        now + startsAtHours * 60 * 60 * 1000,
      ).toISOString();

      const endsAt = new Date(
        now + (startsAtHours + durationHours) * 60 * 60 * 1000,
      ).toISOString();

      const createdLot = await apiPost<CreateLotResponse>("/lots", {
        catalogItemId: importedItem.id,
        category: category || undefined,
        specialConditions: conditions.trim() || undefined,
        sellerNotes: sellerNotes.trim() || undefined,
        startingPriceCents: Math.round(startingPriceBRL * 100),
        minIncrementCents: Math.round(minIncrementBRL * 100),
        startsAt,
        endsAt,
      });

      setPublishedLot(createdLot);
      setCurrentStep(5);

      addNotification({
        title: "Lote publicado",
        message: "O lote foi cadastrado com sucesso na API.",
        type: "success",
      });
    } catch (error) {
      setPublishError(getErrorMessage(error));
    } finally {
      setIsPublishing(false);
    }
  };

  const goToStep = (step: number) => {
    if (isPublishing) return;
    setPublishError("");
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderStepNavigation = () => (
    <div className="rounded-2xl border border-border-subtle bg-surface-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
            Etapa {currentStep} de 5
          </p>
          <p className="mt-1 text-sm font-semibold text-brand-interactive">
            {STEPS[currentStep - 1].label}
          </p>
        </div>
        <span className="font-mono text-xs text-text-secondary">
          {String(Math.round((currentStep / STEPS.length) * 100)).padStart(
            2,
            "0",
          )}
          %
        </span>
      </div>

      <div
        className="mb-5 h-1.5 overflow-hidden rounded-full bg-border-subtle"
        aria-label={`Progresso: ${currentStep} de 5 etapas`}
      >
        <div
          className="h-full rounded-full bg-accent-gold transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-5 gap-2">
        {STEPS.map(step => {
          const StepIcon = step.icon;
          const isComplete = step.number < currentStep;
          const isActive = step.number === currentStep;

          return (
            <button
              key={step.number}
              type="button"
              disabled={step.number > currentStep || isPublishing}
              onClick={() => {
                if (step.number < currentStep && step.number !== 5) {
                  goToStep(step.number);
                }
              }}
              className="group min-w-0 text-left disabled:cursor-default"
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 sm:mx-0 ${
                  isComplete
                    ? "border-brand-primary bg-brand-primary text-white"
                    : isActive
                      ? "border-accent-gold bg-brand-primary text-accent-gold shadow-md shadow-brand-primary/10"
                      : "border-border-subtle bg-surface-base text-text-secondary"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </span>
              <span
                className={`mt-2 hidden text-[11px] font-semibold sm:block ${
                  isActive || isComplete
                    ? "text-brand-interactive"
                    : "text-text-secondary"
                }`}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-surface-base">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="relative overflow-hidden rounded-3xl bg-brand-deep p-6 text-white shadow-xl shadow-brand-deep/10 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-border-subtle border-invert" />
          <div className="pointer-events-none absolute -right-1 -top-8 h-44 w-44 rounded-full border border-border-subtle border-accent-gold/20" />
          <div className="pointer-events-none absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-accent-gold/5 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-surface-card/5 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-gold" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-gold-ink">
                  Lance · Área do leiloeiro
                </span>
              </div>

              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Criar novo lote<span className="text-accent-gold-ink">.</span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                Selecione uma peça do acervo, revise sua procedência e configure
                os parâmetros do pregão antes da publicação.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigateTo("/leiloeiro")}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-border-subtle border-invert px-4 py-3 text-xs font-semibold text-white/80 transition-all duration-200 hover:border-invert hover:bg-surface-card/10 hover:text-white sm:self-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao painel
            </button>
          </div>
        </header>

        {renderStepNavigation()}

        <div
          key={currentStep}
          className="space-y-6 transition-opacity duration-300 motion-reduce:transition-none"
        >
          {currentStep === 1 && (
            <section className="space-y-6 rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm sm:p-7">
              <SectionHeading
                eyebrow="01 · Seleção"
                title="Explore o acervo"
                description="Pesquise em coleções públicas e selecione o item que deseja cadastrar como lote."
              />

              <div className="space-y-2">
                <label
                  htmlFor="catalog-search"
                  className="block text-xs font-semibold text-text-primary"
                >
                  Buscar no catálogo
                </label>
                <div className="group relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-brand-interactive" />
                  <input
                    id="catalog-search"
                    type="search"
                    value={searchQuery}
                    onChange={event => {
                      setSearchQuery(event.target.value);
                      setSearchError("");
                    }}
                    placeholder="Título, autor, artista ou obra..."
                    className={`${inputClassName} pl-11`}
                  />
                  {isSearching && (
                    <LoaderCircle className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-interactive" />
                  )}
                </div>
                <p className="text-[11px] text-text-secondary">
                  A pesquisa é atualizada automaticamente enquanto você digita.
                </p>
              </div>

              {searchError && <AlertMessage>{searchError}</AlertMessage>}

              <div className="space-y-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-heading text-base font-bold text-brand-interactive">
                      Resultados do acervo
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
                      {hasSearched
                        ? `${filteredCatalogResults.length} itens nesta seleção`
                        : "Escolha uma fonte ou inicie uma pesquisa"}
                    </p>
                  </div>

                  {hasSearched && catalogResults.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {SOURCES.map(option => {
                        const count =
                          option.value === "ALL"
                            ? catalogResults.length
                            : catalogResults.filter(
                                item =>
                                  getApiSourceFromItem(item) === option.value,
                              ).length;

                        const isActive = sourceFilter === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            disabled={count === 0}
                            onClick={() => setSourceFilter(option.value)}
                            className={`rounded-lg border px-2.5 py-2 text-[10px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                              isActive
                                ? "border-brand-primary bg-brand-primary text-white"
                                : "border-border-subtle bg-surface-card text-text-secondary hover:border-brand-primary/50 hover:text-brand-interactive"
                            }`}
                          >
                            {option.shortLabel}
                            <span
                              className={`ml-1.5 font-mono ${
                                isActive ? "text-accent-gold" : "opacity-70"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {isSearching && catalogResults.length === 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex animate-pulse gap-3 rounded-xl border border-border-subtle border-border-subtle p-3"
                      >
                        <div className="h-20 w-20 shrink-0 rounded-lg bg-border-subtle" />
                        <div className="flex flex-1 flex-col justify-center gap-2">
                          <div className="h-2 w-1/3 rounded bg-border-subtle" />
                          <div className="h-3 w-4/5 rounded bg-border-subtle" />
                          <div className="h-2 w-1/2 rounded bg-border-subtle" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isSearching && hasSearched && catalogResults.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border-strong bg-surface-base px-5 py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-card text-text-secondary shadow-sm">
                      <Search className="h-5 w-5" />
                    </div>
                    <h4 className="mt-4 font-heading text-base font-bold text-brand-interactive">
                      Nenhum resultado encontrado
                    </h4>
                    <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-text-secondary">
                      Tente outro termo ou escolha uma fonte diferente para
                      explorar o acervo.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        void loadCatalogPage({
                          query: searchQuery,
                          offset: 0,
                          mode: "replace",
                        })
                      }
                      className={`${secondaryButtonClassName} mt-5`}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Tentar novamente
                    </button>
                  </div>
                )}

                {!isSearching && !hasSearched && !searchError && (
                  <div className="rounded-2xl border border-dashed border-border-strong bg-surface-base px-5 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-card text-brand-interactive shadow-sm">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 font-heading text-sm font-bold text-brand-interactive">
                      Seu próximo lote começa aqui
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-text-secondary">
                      Escolha uma das coleções acima ou digite um termo para
                      consultar os itens disponíveis.
                    </p>
                  </div>
                )}

                {filteredCatalogResults.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {filteredCatalogResults.map((item, index) => {
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
                          className={`group relative flex min-w-0 gap-3 rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${
                            selected
                              ? "border-brand-primary bg-brand-primary/[0.04] ring-2 ring-brand-primary/10"
                              : "border-border-subtle bg-surface-card hover:border-brand-primary/40"
                          }`}
                        >
                          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-base sm:h-28 sm:w-28">
                            <ItemImage
                              src={item.imageUrl}
                              alt={item.title}
                              seed={`${item.externalId}-${item.title}`}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              showLabel={false}
                            />
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col py-1">
                            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-accent-gold-ink">
                              {mappedItem?.source ?? "Origem não identificada"}
                            </span>
                            <h4 className="mt-1 line-clamp-2 font-heading text-sm font-bold leading-snug text-brand-interactive">
                              {item.title}
                            </h4>
                            <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
                              {item.creator ?? "Autoria não informada"}
                            </p>
                            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                              <span className="text-[10px] text-text-secondary">
                                {item.date ?? "Data não informada"}
                              </span>
                              {selected ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-interactive" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-interactive" />
                              )}
                            </div>
                          </div>

                          {selected && (
                            <span className="absolute right-2 top-2 rounded-full bg-brand-primary px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                              Selecionado
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {hasSearched &&
                  filteredCatalogResults.length > 0 &&
                  hasMore && (
                    <div className="flex justify-center border-t border-border-subtle pt-4">
                      <button
                        type="button"
                        disabled={isLoadingMore || isSearching}
                        onClick={() =>
                          void loadCatalogPage({
                            query: searchQuery,
                            offset: catalogResults.length,
                            mode: "append",
                          })
                        }
                        className={primaryButtonClassName}
                      >
                        {isLoadingMore ? (
                          <>
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Carregando...
                          </>
                        ) : (
                          <>
                            Carregar mais
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
              </div>

              {selectedItem && (
                <div className="flex flex-col gap-4 rounded-2xl border border-brand-primary/15 bg-brand-primary/[0.04] p-4 sm:flex-row sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-card text-brand-interactive shadow-sm">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-interactive">
                      Item selecionado
                    </p>
                    <p className="mt-1 truncate font-heading text-sm font-bold text-text-primary">
                      {selectedItem.title}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {selectedItem.source}
                    </p>
                  </div>
                </div>
              )}

              <div
                ref={selectionActionsRef}
                className="flex scroll-mt-8 flex-col-reverse justify-between gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center"
              >
                <p className="text-[11px] text-text-secondary">
                  A procedência e os direitos da peça serão revisados na próxima
                  etapa.
                </p>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  disabled={!selectedItem}
                  className={primaryButtonClassName}
                >
                  Avançar para revisão
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {currentStep === 2 && selectedItem && (
            <section className="space-y-6 rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm sm:p-7">
              <SectionHeading
                eyebrow="02 · Verificação"
                title="Revise a peça e sua procedência"
                description="Confira os dados fornecidos pela coleção de origem antes de criar o lote."
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-base">
                  <div className="aspect-[4/3]">
                    <ItemImage
                      src={selectedItem.primaryImageUrl}
                      alt={selectedItem.title}
                      seed={`${selectedItem.externalId}-${selectedItem.title}`}
                      className="h-full w-full object-cover"
                      showLabel={false}
                    />
                  </div>
                  <div className="space-y-2 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-gold-ink">
                      Registro de origem
                    </span>
                    <p className="font-heading text-base font-bold text-brand-interactive">
                      {selectedItem.title}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {selectedItem.source}
                    </p>
                    <a
                      href={selectedItem.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 pt-2 text-xs font-semibold text-brand-interactive underline decoration-brand-primary/30 underline-offset-4 transition-colors hover:decoration-brand-primary"
                    >
                      Abrir registro original
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
                      Título da obra
                    </p>
                    <h3 className="mt-1 font-heading text-xl font-bold leading-snug text-brand-interactive">
                      {selectedItem.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-surface-base p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        Autor / atribuição
                      </p>
                      <p className="mt-1 text-sm font-semibold text-text-primary">
                        {selectedItem.creator}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-base p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        Data
                      </p>
                      <p className="mt-1 text-sm font-semibold text-text-primary">
                        {selectedItem.dateOrYear}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-base p-3 sm:col-span-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        Técnica / material
                      </p>
                      <p className="mt-1 text-sm font-semibold text-text-primary">
                        {selectedItem.medium}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-text-primary">
                      Descrição fornecida pela fonte
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {selectedItem.description}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border-subtle border-border-subtle p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                      Identificador externo
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-text-primary">
                      {selectedItem.externalId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-card text-amber-800 shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">
                      Verificação de direitos e procedência
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                      {selectedItem.licenseNotes} A existência de uma imagem na
                      API não garante autorização para uso comercial. Verifique
                      as condições da fonte original antes de prosseguir.
                    </p>
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200/80 bg-surface-card/70 p-4 transition-colors hover:bg-surface-card">
                  <input
                    type="checkbox"
                    checked={verifiedRights}
                    onChange={event => setVerifiedRights(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border-strong accent-brand-primary"
                  />
                  <span className="text-xs leading-relaxed text-text-primary">
                    Confirmo que verifiquei a adequação das condições de imagem,
                    procedência e dados para a criação deste lote.
                  </span>
                </label>
              </div>

              <div className="flex flex-col-reverse justify-between gap-3 border-t border-border-subtle pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className={secondaryButtonClassName}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao acervo
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  disabled={!verifiedRights}
                  className={primaryButtonClassName}
                >
                  Configurar lote
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {currentStep === 3 && selectedItem && (
            <section className="space-y-6 rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm sm:p-7">
              <SectionHeading
                eyebrow="03 · Configuração"
                title="Defina os parâmetros do pregão"
                description="Configure preço, incremento mínimo, agenda e condições que serão vinculadas ao lote."
              />

              {publishError && <AlertMessage>{publishError}</AlertMessage>}

              <div className="flex items-center gap-4 rounded-2xl bg-surface-base p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-card">
                  <ItemImage
                    src={selectedItem.primaryImageUrl}
                    alt={selectedItem.title}
                    seed={`${selectedItem.externalId}-${selectedItem.title}`}
                    className="h-full w-full object-cover"
                    showLabel={false}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-gold-ink">
                    Peça selecionada
                  </p>
                  <p className="mt-1 truncate font-heading text-sm font-bold text-brand-interactive">
                    {selectedItem.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-text-secondary">
                    {selectedItem.source}
                  </p>
                </div>
              </div>

              <FormField label="Título de exibição do lote" htmlFor="lot-title">
                <input
                  id="lot-title"
                  type="text"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  maxLength={200}
                  className={inputClassName}
                  placeholder="Digite o título que será exibido"
                />
                <div className="flex justify-end">
                  <span className="text-[10px] text-text-secondary">
                    {title.length}/200
                  </span>
                </div>
              </FormField>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  label="Categoria"
                  htmlFor="lot-category"
                  hint="A categoria é gravada no lote e utilizada pelos filtros do catálogo."
                >
                  <select
                    id="lot-category"
                    value={category}
                    onChange={event =>
                      setCategory(event.target.value as Lot["category"])
                    }
                    className={inputClassName}
                  >
                    {!LOT_CATEGORIES.includes(
                      category as (typeof LOT_CATEGORIES)[number],
                    ) &&
                      category !== "" && (
                        <option value={category}>{category}</option>
                      )}
                    {LOT_CATEGORIES.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    <option value="">Sem categoria</option>
                  </select>
                </FormField>

                <FormField
                  label="Lance inicial (R$)"
                  htmlFor="starting-price"
                  hint="Valor mínimo para iniciar os lances."
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-secondary">
                      R$
                    </span>
                    <input
                      id="starting-price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={startingPriceBRL}
                      onChange={event =>
                        setStartingPriceBRL(Number(event.target.value))
                      }
                      className={`${inputClassName} pl-11 font-mono`}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Incremento mínimo (R$)"
                  htmlFor="minimum-increment"
                  hint="Diferença mínima entre lances consecutivos."
                >
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-secondary">
                      R$
                    </span>
                    <input
                      id="minimum-increment"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={minIncrementBRL}
                      onChange={event =>
                        setMinIncrementBRL(Number(event.target.value))
                      }
                      className={`${inputClassName} pl-11 font-mono`}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Início do pregão"
                  htmlFor="auction-start"
                  hint="O horário é calculado a partir do momento da publicação."
                >
                  <select
                    id="auction-start"
                    value={startsAtHours}
                    onChange={event =>
                      setStartsAtHours(Number(event.target.value))
                    }
                    className={inputClassName}
                  >
                    <option value={0}>Agora</option>
                    <option value={0.0833}>Em 5 minutos</option>
                    <option value={1}>Em 1 hora</option>
                    <option value={12}>Em 12 horas</option>
                    <option value={24}>Em 24 horas</option>
                    <option value={48}>Em 48 horas</option>
                  </select>
                </FormField>

                <FormField
                  label="Duração do pregão"
                  htmlFor="auction-duration"
                  hint="Tempo total entre o início e o encerramento."
                >
                  <select
                    id="auction-duration"
                    value={durationHours}
                    onChange={event =>
                      setDurationHours(Number(event.target.value))
                    }
                    className={inputClassName}
                  >
                    <option value={0.0833}>5 minutos · teste</option>
                    <option value={0.5}>30 minutos · teste</option>
                    <option value={1}>1 hora</option>
                    <option value={6}>6 horas</option>
                    <option value={12}>12 horas</option>
                    <option value={24}>24 horas</option>
                    <option value={48}>48 horas</option>
                    <option value={72}>72 horas</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <FormField
                  label="Condições especiais do lote"
                  htmlFor="lot-conditions"
                  hint="Inclua informações relevantes para o arremate, como forma de pagamento, prazo de retirada, envio ou laudos."
                >
                  <textarea
                    id="lot-conditions"
                    rows={4}
                    value={conditions}
                    onChange={event => setConditions(event.target.value)}
                    className={`${inputClassName} resize-y leading-relaxed`}
                    placeholder="Informe as condições de venda e retirada..."
                  />
                </FormField>

                <FormField
                  label="Observações do leiloeiro (opcional)"
                  htmlFor="lot-seller-notes"
                  hint="Observações adicionais para complementar o cadastro."
                >
                  <textarea
                    id="lot-seller-notes"
                    rows={3}
                    value={sellerNotes}
                    onChange={event => setSellerNotes(event.target.value)}
                    placeholder="Ex.: retirada apenas em São Paulo, mediante agendamento."
                    className={`${inputClassName} resize-y leading-relaxed`}
                  />
                </FormField>
              </div>

              <div className="rounded-2xl border border-border-subtle bg-surface-base p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-accent-gold-ink" />
                  <h3 className="text-xs font-bold text-brand-interactive">
                    Resumo financeiro
                  </h3>
                </div>
                <SummaryRow
                  label="Lance inicial"
                  value={formatBRL(Math.round(startingPriceBRL * 100))}
                  emphasized
                />
                <SummaryRow
                  label="Incremento mínimo"
                  value={formatBRL(Math.round(minIncrementBRL * 100))}
                />
                <SummaryRow
                  label="Categoria"
                  value={category || "Sem categoria"}
                />
              </div>

              <div className="flex flex-col-reverse justify-between gap-3 border-t border-border-subtle pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className={secondaryButtonClassName}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar à revisão
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
                    goToStep(4);
                  }}
                  className={primaryButtonClassName}
                >
                  Pré-visualizar lote
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          )}

          {currentStep === 4 && selectedItem && (
            <section className="space-y-6">
              <div className="rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-sm sm:p-7">
                <SectionHeading
                  eyebrow="04 · Conferência final"
                  title="Pré-visualização do lote"
                  description="Confira os dados e os valores antes de enviar o cadastro para a API."
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative min-h-64 bg-surface-base sm:min-h-80">
                    <ItemImage
                      src={selectedItem.primaryImageUrl}
                      alt={title}
                      seed={`${selectedItem.externalId}-${title}`}
                      className="absolute inset-0 h-full w-full object-cover"
                      showLabel={false}
                    />
                    <div className="absolute left-4 top-4 rounded-full border border-invert bg-brand-deep/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-accent-gold-ink backdrop-blur">
                      Prévia do lote
                    </div>
                  </div>

                  <div className="space-y-6 p-5 sm:p-7 lg:p-8">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-gold-ink">
                        {category || "Sem categoria"}
                      </p>
                      <h2 className="mt-2 font-heading text-2xl font-bold leading-tight text-brand-interactive sm:text-3xl">
                        {title}
                      </h2>
                      <p className="mt-2 text-xs text-text-secondary">
                        {selectedItem.creator} · {selectedItem.dateOrYear}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-brand-deep p-5 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                        Lance inicial
                      </p>
                      <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-accent-gold-ink">
                        {formatBRL(Math.round(startingPriceBRL * 100))}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-invert pt-4">
                        <span className="text-xs text-white/60">
                          Incremento mínimo
                        </span>
                        <span className="font-mono text-sm font-semibold text-white">
                          {formatBRL(Math.round(minIncrementBRL * 100))}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-accent-gold-ink" />
                        <div>
                          <p className="text-xs font-semibold text-text-primary">
                            Início previsto
                          </p>
                          <p className="mt-1 text-xs text-text-secondary">
                            {new Date(
                              Date.now() + startsAtHours * 60 * 60 * 1000,
                            ).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-accent-gold-ink" />
                        <div>
                          <p className="text-xs font-semibold text-text-primary">
                            Duração do pregão
                          </p>
                          <p className="mt-1 text-xs text-text-secondary">
                            {durationHours < 1
                              ? `${Math.round(durationHours * 60)} minutos`
                              : `${durationHours} ${
                                  durationHours === 1 ? "hora" : "horas"
                                }`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        Sobre a peça
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                        {selectedItem.description}
                      </p>
                    </div>

                    {conditions.trim() && (
                      <div className="border-t border-border-subtle pt-4">
                        <p className="text-xs font-semibold text-text-primary">
                          Condições do leiloeiro
                        </p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                          {conditions}
                        </p>
                      </div>
                    )}

                    {sellerNotes.trim() && (
                      <div className="border-t border-border-subtle pt-4">
                        <p className="text-xs font-semibold text-text-primary">
                          Observações adicionais
                        </p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                          {sellerNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-border-subtle bg-surface-base p-5 sm:p-7">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-interactive" />
                    <div>
                      <p className="text-xs font-bold text-brand-interactive">
                        Procedência revisada
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                        Você confirmou a verificação das condições de imagem,
                        procedência e dados da peça. A publicação enviará o
                        cadastro para a API.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {publishError && <AlertMessage>{publishError}</AlertMessage>}

              {isPublishing && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-2xl border border-brand-primary/15 bg-brand-primary/[0.04] p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-card text-brand-interactive shadow-sm">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-interactive">
                        Publicando seu lote
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                        Importando a peça e registrando os parâmetros do pregão.
                        Não feche esta página até a confirmação.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-brand-primary/10">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-accent-gold" />
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-card p-4 sm:flex-row sm:items-center sm:p-5">
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={() => goToStep(3)}
                  className={secondaryButtonClassName}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Editar parâmetros
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className={`${primaryButtonClassName} min-w-44`}
                >
                  {isPublishing ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-accent-gold-ink" />
                      Publicar lote
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {currentStep === 5 && selectedItem && publishedLot && (
            <section className="overflow-hidden rounded-3xl border border-border-subtle bg-surface-card shadow-xl shadow-brand-deep/5">
              <div className="relative overflow-hidden bg-brand-deep px-5 py-10 text-center text-white sm:px-10 sm:py-14">
                <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border border-border-subtle border-invert" />
                <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full border border-border-subtle border-accent-gold/20" />

                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-accent-gold/30 bg-surface-card/5 text-accent-gold-ink shadow-lg shadow-black/10">
                  <CheckCircle2 className="h-10 w-10" />
                </div>

                <p className="relative mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-accent-gold-ink">
                  Cadastro concluído
                </p>
                <h2 className="relative mt-2 font-heading text-3xl font-bold sm:text-4xl">
                  Lote publicado<span className="text-accent-gold-ink">.</span>
                </h2>
                <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
                  A API confirmou o cadastro. Os dados do lote estão registrados
                  e disponíveis para consulta.
                </p>
              </div>

              <div className="space-y-6 p-5 sm:p-8">
                <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                  <div className="h-32 overflow-hidden rounded-2xl bg-surface-base sm:h-32">
                    <ItemImage
                      src={selectedItem.primaryImageUrl}
                      alt={title}
                      seed={`${selectedItem.externalId}-${title}`}
                      className="h-full w-full object-cover"
                      showLabel={false}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent-gold-ink">
                      {category || "Sem categoria"}
                    </span>
                    <h3 className="mt-1 font-heading text-xl font-bold text-brand-interactive">
                      {title}
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
                      Identificador:{" "}
                      <span className="break-all font-mono text-text-primary">
                        {publishedLot.id}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mx-auto max-w-3xl rounded-2xl border border-border-subtle bg-surface-base p-4 sm:p-6">
                  <SummaryRow
                    label="Lance inicial"
                    value={formatBRL(publishedLot.startingPriceCents)}
                    emphasized
                  />
                  <SummaryRow
                    label="Incremento mínimo"
                    value={formatBRL(publishedLot.minIncrementCents)}
                  />
                  <SummaryRow label="Status" value={publishedLot.status} />
                  <SummaryRow
                    label="Início do pregão"
                    value={new Date(publishedLot.startsAt).toLocaleString(
                      "pt-BR",
                    )}
                  />
                  <SummaryRow
                    label="Encerramento"
                    value={new Date(publishedLot.endsAt).toLocaleString(
                      "pt-BR",
                    )}
                  />
                </div>

                <div className="flex flex-col justify-center gap-3 border-t border-border-subtle pt-6 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigateTo("/lotes")}
                    className={primaryButtonClassName}
                  >
                    Abrir catálogo de lotes
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/leiloeiro/lotes")}
                    className={secondaryButtonClassName}
                  >
                    Voltar à gestão de lotes
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        {currentStep < 5 && (
          <footer className="flex flex-col items-center justify-center gap-2 py-2 text-center">
            <div className="flex items-center gap-2 text-text-secondary">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium">
                Cadastro integrado ao acervo e à API da Lance
              </span>
            </div>
            <p className="text-[10px] text-text-secondary/70">
              Revise as informações antes de concluir a publicação.
            </p>
          </footer>
        )}
      </div>
    </main>
  );
};
