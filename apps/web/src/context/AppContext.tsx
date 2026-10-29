import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { io, type Socket } from "socket.io-client";

import {
  apiGet,
  apiPost,
  apiPatch,
  getAccessToken,
  getRefreshToken,
  clearAuthTokens,
  API_URL,
  type ApiUser,
} from "../services/api";

import {
  User,
  Lot,
  Bid,
  Wallet,
  WalletTransaction,
  Receipt,
  AuditEvent,
  SellerAgreement,
  CatalogItem,
} from "../types/auction";

import { formatBRL } from "../logic/auctionRules";

interface ApiLotsResponse {
  id: string;
  status: Lot["status"];
  startingPriceCents: number;
  currentPriceCents: number;
  minIncrementCents: number;
  startsAt: string;
  endsAt: string;
  sellerId: string;
  seller?: { name: string };
  sellerName?: string;
  currentLeaderId?: string | null;
  currentLeaderAlias?: string | null;
  settlement?: {
    id: string;
    status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
    amountCents: number;
    settledAt: string | null;
  } | null;
  category?: string | null;
  specialConditions?: string | null;
  sellerNotes?: string | null;
  _count?: { bids: number };
  bids?: Array<{
    id: string;
    bidderId?: string;
    amountCents: number;
    createdAt: string;
  }>;
  itemSnapshot: {
    title: string;
    description: string | null;
    source: string;
    externalId: string;
    imageUrl: string | null;
    sourceUrl: string | null;
    medium?: string | null;
    dimensions?: string | null;
    attribution?: string | null;
    period?: string | null;
    imageConditions?: string | null;
  };
}

interface ApiPublicLotResponse {
  bids: Array<{
    id: string;
    bidderAlias: string;
    amountCents: number;
    createdAt: string;
  }>;
}

interface ApiMyBidResponse {
  id: string;
  lotId: string;
  amountCents: number;
  createdAt: string;
}

interface ApiWalletResponse {
  balanceCents: number;
  reservedCents: number;
  availableCents: number;
  updatedAt: string;
}

interface ApiWalletTransaction {
  id: string;
  walletId: string;
  type: string;
  amountCents: number;
  idempotencyKey: string;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

interface ApiBidResponse {
  bid: {
    id: string;
    amountCents: number;
    createdAt: string;
  };
  reservation: unknown;
  currentPriceCents: number;
  availableBalanceCents: number;
}

interface ApiAuditEvent {
  sequence: string | number | bigint;
  eventType: string;
  entityId: string;
  payload: Record<string, unknown>;
  previousHash: string | null;
  eventHash: string;
  createdAt: string;
}

const mapAuditEvent = (event: ApiAuditEvent): AuditEvent => {
  const payload = event.payload ?? {};
  const bidderPseudonym =
    typeof payload.bidderPseudonym === "string"
      ? payload.bidderPseudonym
      : null;
  const winnerPseudonym =
    typeof payload.winnerPseudonym === "string"
      ? payload.winnerPseudonym
      : null;
  const reason = typeof payload.reason === "string" ? payload.reason : null;
  const amountCents =
    typeof payload.amountCents === "number" ? payload.amountCents : null;

  let description = event.eventType;
  if (event.eventType === "LOT_CREATED") {
    const lotTitle =
      typeof payload.lotTitle === "string" ? payload.lotTitle : null;
    description = `Leilão criado${lotTitle ? `: ${lotTitle}` : ""} pelo leiloeiro responsável às ${new Date(event.createdAt).toLocaleTimeString("pt-BR")}.`;
  } else if (event.eventType === "BID_PLACED") {
    description = `Lance de ${bidderPseudonym ?? "licitante identificado"}${amountCents !== null ? ` no valor de ${formatBRL(amountCents)}` : ""}.`;
  } else if (event.eventType === "AUCTION_ENDED") {
    description = `Leilão finalizado às ${new Date(event.createdAt).toLocaleTimeString("pt-BR")}.`;
  } else if (event.eventType === "AUCTION_WON") {
    description = `Leilão vencido por ${winnerPseudonym ?? "licitante identificado"}.`;
  } else if (event.eventType === "LOT_CANCELED") {
    description = `Leilão cancelado pelo leiloeiro responsável às ${new Date(event.createdAt).toLocaleTimeString("pt-BR")}${reason ? `: ${reason}` : "."}`;
  } else if (event.eventType === "SETTLEMENT_COMPLETED") {
    description = "Liquidação do leilão concluída.";
  } else if (event.eventType === "LOT_LIVE") {
    description = "Leilão aberto para lances.";
  }

  return {
    sequence: Number(event.sequence),
    lotId: event.entityId,
    eventType: event.eventType as AuditEvent["eventType"],
    description,
    payloadSummary: payload,
    timestamp: event.createdAt,
    prevHash: event.previousHash ?? "",
    hash: event.eventHash,
  };
};

/** Campos editáveis de um lote antes de entrar ao vivo. */
export interface LotEditPatch {
  category?: string;
  specialConditions?: string | null;
  sellerNotes?: string | null;
  startingPriceCents?: number;
  minIncrementCents?: number;
  startsAt?: string;
  endsAt?: string;
  medium?: string | null;
  dimensions?: string | null;
  attribution?: string | null;
  period?: string | null;
  imageConditions?: string | null;
}

interface PlaceBidResult {
  success: boolean;
  error?: string;
  antiSnipingApplied?: boolean;
}

const mapApiLots = (response: ApiLotsResponse[]): Lot[] =>
  response.map(lot => ({
    id: lot.id,
    code: lot.id,
    title: lot.itemSnapshot.title,
    category: (lot.category ?? "") as Lot["category"],
    itemSnapshot: {
      source: ({
        THE_MET: "The Met Collection",
        MET: "The Met Collection",
        ARTIC: "Art Institute of Chicago",
        MUSICBRAINZ: "MusicBrainz & Cover Art",
      }[lot.itemSnapshot.source] ||
        lot.itemSnapshot.source) as CatalogItem["source"],
      externalId: lot.itemSnapshot.externalId,
      title: lot.itemSnapshot.title,
      // Campos da ficha técnica vêm do snapshot; vazios quando a fonte não
      // forneceu e o leiloeiro não completou.
      creator: lot.itemSnapshot.attribution ?? "",
      dateOrYear: lot.itemSnapshot.period ?? "",
      category: (lot.category ?? "") as CatalogItem["category"],
      medium: lot.itemSnapshot.medium ?? "",
      dimensions: lot.itemSnapshot.dimensions ?? "",
      description: lot.itemSnapshot.description || "",
      primaryImageUrl: lot.itemSnapshot.imageUrl || "",
      additionalImages: [],
      licenseNotes: lot.itemSnapshot.imageConditions ?? "",
      sourceUrl: lot.itemSnapshot.sourceUrl || "",
    },
    startingPriceCents: lot.startingPriceCents,
    currentBidCents: lot.currentPriceCents,
    minIncrementCents: lot.minIncrementCents,
    status: lot.status,
    startsAt: lot.startsAt,
    endsAt: lot.endsAt,
    sellerId: lot.sellerId,
    sellerName: lot.seller?.name ?? lot.sellerName,
    currentLeaderBidderId: lot.currentLeaderId ?? undefined,
    currentLeaderPseudonym: lot.currentLeaderAlias ?? undefined,
    bidCount: lot._count?.bids ?? lot.bids?.length ?? 0,
    settlement: lot.settlement ?? null,
    specialConditions: lot.specialConditions ?? null,
    sellerNotes: lot.sellerNotes ?? null,
  }));

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "error";
  timestamp: string;
}

interface ApiWinResponse {
  id: string;
  lotId: string;
  amountCents: number;
  status: string;
  settledAt: string | null;
  lot: {
    id: string;
    endsAt: string;
    currentPriceCents: number;
    itemSnapshot: {
      title: string;
      imageUrl: string | null;
      source: string | null;
      catalogItem?: {
        category: string | null;
      } | null;
    } | null;
    seller: {
      name: string;
    };
  };
  winningBid: {
    bidder: {
      id: string;
      name: string;
    };
  } | null;
  receipt: {
    id: string;
    verificationCode: string;
    issuedAt: string;
    snapshot: unknown;
  } | null;
}

interface AppContextType {
  currentUser: User | null;
  currentRole: "LICITANTE" | "LEILOEIRO" | "VISITOR";

  subscribeToLot: (lotId: string) => void;
  unsubscribeFromLot: (lotId: string) => void;

  logoutUser: () => void;

  refreshMyWins: () => Promise<void>;

  currentRoute: string;
  navigateTo: (route: string) => void;

  returnRouteAfterLogin: string | null;
  setReturnRouteAfterLogin: (route: string | null) => void;

  lots: Lot[];
  getLotById: (id: string) => Lot | undefined;

  bidsByLot: Record<string, Bid[]>;
  myBids: ApiMyBidResponse[];
  refreshLotBids: (lotId: string) => Promise<void>;
  refreshLots: () => Promise<void>;
  refreshLotAudit: (lotId: string) => Promise<void>;
  refreshMyBids: () => Promise<void>;

  wallet: Wallet;
  transactions: WalletTransaction[];
  receipts: Receipt[];
  auditEvents: AuditEvent[];

  sellerAgreement: SellerAgreement | null;
  acceptSellerAgreement: () => Promise<void>;

  authenticateApiUser: (user: ApiUser) => Promise<void>;

  refreshWallet: () => Promise<void>;
  deposit: (amountCents: number) => Promise<void>;

  placeBid: (lotId: string, amountCents: number) => Promise<PlaceBidResult>;

  updateLot: (lotId: string, patch: LotEditPatch) => Promise<void>;
  publishLot: (lotId: string) => Promise<void>;
  cancelLot: (lotId: string, reason: string) => Promise<void>;

  selectedLotForBidModal: Lot | null;
  setSelectedLotForBidModal: (lot: Lot | null) => void;

  selectedReceiptForModal: Receipt | null;
  setSelectedReceiptForModal: (receipt: Receipt | null) => void;

  viewportMode: "native" | "desktop" | "tablet" | "mobile";
  setViewportMode: (mode: "native" | "desktop" | "tablet" | "mobile") => void;

  notifications: AppNotification[];
  addNotification: (notif: Omit<AppNotification, "id" | "timestamp">) => void;
  dismissNotification: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const SELLER_AGREEMENT_VERSION = "1.0.0";

export const SELLER_AGREEMENT_CONTENT =
  "Termo de Responsabilidade e Condução de Pregão Lance. Ao aceitar, o leiloeiro declara que possui autorização para ofertar o item, que as informações e imagens fornecidas são verdadeiras segundo seu conhecimento, que verificou a procedência e os direitos de uso, e que cumprirá as regras aplicáveis ao leilão e à plataforma. Este texto provisório deve ser revisado e aprovado pelo responsável jurídico antes de produção.";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }

    return "/";
  });

  const socketRef = useRef<Socket | null>(null);
  const subscribedLotIdsRef = useRef<Set<string>>(new Set());

  const subscribeToLot = useCallback((lotId: string) => {
    if (!lotId) return;

    subscribedLotIdsRef.current.add(lotId);
    socketRef.current?.emit("lot.subscribe", { lotId });
  }, []);

  const unsubscribeFromLot = useCallback((lotId: string) => {
    if (!lotId) return;

    subscribedLotIdsRef.current.delete(lotId);
    socketRef.current?.emit("lot.unsubscribe", { lotId });
  }, []);

  const [returnRouteAfterLogin, setReturnRouteAfterLogin] = useState<
    string | null
  >(null);

  const [lots, setLots] = useState<Lot[]>([]);
  const [bidsByLot, setBidsByLot] = useState<Record<string, Bid[]>>({});
  const [myBids, setMyBids] = useState<ApiMyBidResponse[]>([]);

  const [wallet, setWallet] = useState<Wallet>({
    userId: "",
    balanceCents: 0,
    reservedCents: 0,
    availableCents: 0,
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  const [sellerAgreement, setSellerAgreement] =
    useState<SellerAgreement | null>(null);

  const [selectedLotForBidModal, setSelectedLotForBidModal] =
    useState<Lot | null>(null);

  const [selectedReceiptForModal, setSelectedReceiptForModal] =
    useState<Receipt | null>(null);

  const [viewportMode, setViewportMode] = useState<
    "native" | "desktop" | "tablet" | "mobile"
  >("native");

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = (
    notif: Omit<AppNotification, "id" | "timestamp">,
  ) => {
    const id = `notif-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 6)}`;

    const newNotification: AppNotification = {
      ...notif,
      id,
      timestamp: new Date().toISOString(),
    };

    setNotifications(previous => [newNotification, ...previous.slice(0, 4)]);

    window.setTimeout(() => {
      setNotifications(previous =>
        previous.filter(notification => notification.id !== id),
      );
    }, 7000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(previous =>
      previous.filter(notification => notification.id !== id),
    );
  };

  const navigateTo = (route: string) => {
    if (typeof window !== "undefined") {
      try {
        if (window.location.pathname !== route) {
          window.history.pushState({}, "", route);
        }

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch {}
    }

    setCurrentRoute(route);
  };

  const currentRole: "LICITANTE" | "LEILOEIRO" | "VISITOR" =
    currentUser?.role ?? "VISITOR";

  const refreshWallet = async (): Promise<void> => {
    if (!currentUser) {
      setWallet({
        userId: "",
        balanceCents: 0,
        reservedCents: 0,
        availableCents: 0,
      });

      setTransactions([]);
      return;
    }

    const [walletResponse, transactionResponse] = await Promise.all([
      apiGet<ApiWalletResponse>("/wallet"),
      apiGet<ApiWalletTransaction[]>("/wallet/transactions"),
    ]);

    setWallet({
      userId: currentUser.id,
      balanceCents: walletResponse.balanceCents,
      reservedCents: walletResponse.reservedCents,
      availableCents: walletResponse.availableCents,
    });

    setTransactions(
      transactionResponse.map(transaction => ({
        ...transaction,
        status: "COMPLETED",
      })) as WalletTransaction[],
    );
  };

  /**
   * Recarrega a lista de lotes direto da API — o estado oficial do leilão.
   * Usada após qualquer mutação (lance, cancelamento, publicação, evento
   * realtime) para que `currentLeaderBidderId` e `currentPriceCents` fiquem
   * sempre coerentes com o servidor.
   */
  const refreshLots = useCallback(async (): Promise<void> => {
    try {
      const response = await apiGet<ApiLotsResponse[]>(
        currentUser?.role === "LEILOEIRO" ? "/seller/lots" : "/lots",
      );

      setLots(mapApiLots(response));
    } catch (error) {
      console.error("Não foi possível recarregar os lotes:", error);
    }
  }, [currentUser?.role]);

  const refreshLotBids = useCallback(async (lotId: string): Promise<void> => {
    const response = await apiGet<ApiPublicLotResponse>(
      `/lots/${encodeURIComponent(lotId)}`,
    );

    setBidsByLot(previous => ({
      ...previous,
      [lotId]: response.bids.map(bid => ({
        id: bid.id,
        lotId,
        bidderId: "",
        pseudonym: bid.bidderAlias,
        amountCents: bid.amountCents,
        createdAt: bid.createdAt,
        status: "ACCEPTED",
      })),
    }));
  }, []);

  const refreshLotAudit = useCallback(async (lotId: string): Promise<void> => {
    const response = await apiGet<ApiAuditEvent[]>(
      `/audit/lots/${encodeURIComponent(lotId)}`,
    );

    setAuditEvents(previous => {
      const current = new Map(
        previous.map(event => [`${event.lotId}:${event.sequence}`, event]),
      );

      response.map(mapAuditEvent).forEach(event => {
        current.set(`${event.lotId}:${event.sequence}`, event);
      });

      return [...current.values()].sort((a, b) => a.sequence - b.sequence);
    });
  }, []);
  const refreshMyBids = async (): Promise<void> => {
    if (!currentUser || currentUser.role !== "LICITANTE") {
      setMyBids([]);
      return;
    }

    const response = await apiGet<ApiMyBidResponse[]>("/me/bids");
    setMyBids(response);
  };

  const refreshMyWins = async (): Promise<void> => {
    if (!currentUser || currentUser.role !== "LICITANTE") {
      setReceipts([]);
      return;
    }

    const wins = await apiGet<ApiWinResponse[]>("/me/wins");

    const mappedReceipts: Receipt[] = wins.flatMap(win => {
      const receipt = win.receipt;
      const lot = win.lot;
      const snapshot = lot.itemSnapshot;
      const bidder = win.winningBid?.bidder;

      if (!receipt || !bidder) {
        return [];
      }

      return [
        {
          id: receipt.id,
          settlementId: win.id,
          lotCode: lot.id,
          lotTitle: snapshot?.title ?? "Lote sem título",
          lotCategory: snapshot?.catalogItem?.category ?? "Não informada",
          itemImageUrl: snapshot?.imageUrl ?? "",
          winnerPseudonym: bidder.name,
          winnerName: bidder.name,
          sellerName: lot.seller.name,
          finalPriceCents: win.amountCents,
          closedAt: win.settledAt ?? receipt.issuedAt,
          verificationCode: receipt.verificationCode,
        },
      ];
    });

    setReceipts(mappedReceipts);
  };

  const deposit = async (amountCents: number): Promise<void> => {
    if (!currentUser) {
      throw new Error("Entre na sua conta para realizar um depósito.");
    }

    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new Error("Informe um valor de depósito válido.");
    }

    await apiPost(
      "/wallet/deposits",
      { amountCents },
      { "Idempotency-Key": crypto.randomUUID() },
    );

    try {
      await refreshWallet();
    } catch (error) {
      console.error(
        "Depósito registrado, mas a carteira não foi atualizada:",
        error,
      );

      addNotification({
        title: "Depósito registrado",
        message:
          "O servidor registrou o depósito, mas não foi possível atualizar o saldo exibido. Atualize a carteira.",
        type: "warning",
      });

      return;
    }

    addNotification({
      title: "Depósito registrado",
      message: "O saldo e o extrato foram atualizados.",
      type: "success",
    });
  };

  const authenticateApiUser = async (apiUser: ApiUser,  options: { redirect?: boolean } = {},
): Promise<void> => {
    const authenticatedUser = {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      role: apiUser.role,
      publicPseudonym: apiUser.publicPseudonym,
    } satisfies User;

    setCurrentUser(authenticatedUser);

    try {
      if (apiUser.role === "LEILOEIRO") {
        const agreement = await apiGet<{
          version: string;
          contentHash: string;
          acceptedAt: string;
          userId: string;
        } | null>("/seller-agreement/current");

        setSellerAgreement(
          agreement
            ? {
                userId: agreement.userId,
                version: agreement.version,
                title: "Termo de Responsabilidade e Condução de Pregão Lance",
                acceptedAt: agreement.acceptedAt,
                contentHash: agreement.contentHash,
              }
            : null,
        );
      } else {
        setSellerAgreement(null);
      }
    } catch (error) {
      setSellerAgreement(null);
      console.error("Falha ao consultar o termo do leiloeiro:", error);
    }

    if (options.redirect !== false) {
      const destination =
        returnRouteAfterLogin ??
        (apiUser.role === "LICITANTE" ? "/conta" : "/leiloeiro");

      setReturnRouteAfterLogin(null);
      navigateTo(destination);
    }

    addNotification({
      title: "Login realizado",
      message: `Sessão iniciada para ${apiUser.name}.`,
      type: "success",
    });
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null);
      setSellerAgreement(null);
      setMyBids([]);
      setBidsByLot({});
      setReceipts([]);

      const isProtectedRoute =
        currentRoute === "/conta" ||
        currentRoute.startsWith("/conta/") ||
        currentRoute === "/leiloeiro" ||
        currentRoute.startsWith("/leiloeiro/");

      if (isProtectedRoute) {
        navigateTo("/entrar");
      }
    };

    window.addEventListener("lance:auth-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("lance:auth-expired", handleSessionExpired);
    };
  }, [currentRoute]);

  useEffect(() => {
    let active = true;

    if (!currentUser || currentUser.role !== "LICITANTE") {
      setMyBids([]);
      return;
    }

    apiGet<ApiMyBidResponse[]>("/me/bids")
      .then(response => {
        if (active) setMyBids(response);
      })
      .catch(error => {
        if (!active) return;
        console.error("Falha ao carregar meus lances:", error);
      });

    return () => {
      active = false;
    };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    let active = true;

    if (!currentUser || currentUser.role !== "LICITANTE") {
      setReceipts([]);
      return;
    }

    apiGet<ApiWinResponse[]>("/me/wins")
      .then(wins => {
        if (!active) return;

        const mappedReceipts: Receipt[] = wins.flatMap(win => {
          const receipt = win.receipt;
          const lot = win.lot;
          const snapshot = lot.itemSnapshot;
          const bidder = win.winningBid?.bidder;

          if (!receipt || !bidder) return [];

          return [
            {
              id: receipt.id,
              settlementId: win.id,
              lotCode: lot.id,
              lotTitle: snapshot?.title ?? "Lote sem título",
              lotCategory: snapshot?.catalogItem?.category ?? "Não informada",
              itemImageUrl: snapshot?.imageUrl ?? "",
              winnerPseudonym: bidder.name,
              winnerName: bidder.name,
              sellerName: lot.seller.name,
              finalPriceCents: win.amountCents,
              closedAt: win.settledAt ?? receipt.issuedAt,
              verificationCode: receipt.verificationCode,
            },
          ];
        });

        setReceipts(mappedReceipts);
      })
      .catch(error => {
        if (active) {
          console.error("Falha ao carregar arremates:", error);
        }
      });

    return () => {
      active = false;
    };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    let active = true;
    const loadAuditEvents = () =>
      apiGet<ApiAuditEvent[]>("/audit")
        .then(response => {
          if (active) setAuditEvents(response.map(mapAuditEvent));
        })
        .catch(error => {
          if (active)
            console.error("Não foi possível carregar o histórico:", error);
        });

    void loadAuditEvents();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!getAccessToken()) return;

    apiGet<ApiUser>("/auth/me")
      .then(async user => {
        if (active) {
          await authenticateApiUser(user, { redirect: false });        }
      })
      .catch(error => {
        if (!active) return;

        clearAuthTokens();
        setCurrentUser(null);
        console.error("Não foi possível restaurar a sessão:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const sellerOnly = currentUser?.role === "LEILOEIRO";

    const loadLots = async () => {
      try {
        const response = await apiGet<ApiLotsResponse[]>(
          sellerOnly ? "/seller/lots" : "/lots",
        );

        if (active) {
          setLots(mapApiLots(response));
        }
      } catch (error) {
        if (!active) return;

        console.error("Não foi possível carregar os lotes da API:", error);
        setLots([]);
      }
    };
    const loadAuditEvents = async () => {
      try {
        const response = await apiGet<ApiAuditEvent[]>("/audit");
        if (active) setAuditEvents(response.map(mapAuditEvent));
      } catch (error) {
        if (active) {
          console.error("Não foi possível atualizar o histórico:", error);
        }
      }
    };

    void loadLots();

    const token = getAccessToken();

    const socket = io(API_URL, {
      transports: ["websocket"],
      ...(token ? { auth: { token } } : {}),
    });

    socketRef.current = socket;

    socket.on("bid.outbid", () => {
      window.dispatchEvent(new CustomEvent("lance:notifications-changed"));
    });
    socket.on("auction.won", () => {
      window.dispatchEvent(new CustomEvent("lance:notifications-changed"));
    });
    socket.on("lot.canceled", () => {
      window.dispatchEvent(new CustomEvent("lance:notifications-changed"));
    });

    socket.on("wallet.updated", () => {
      if (currentUser) {
        void refreshWallet().catch(error => {
          console.error("Não foi possível atualizar a carteira:", error);
        });
      }
    });

    socket.on("connect", () => {
      for (const lotId of subscribedLotIdsRef.current) {
        socket.emit("lot.subscribe", { lotId });
      }
      void loadLots();
      void loadAuditEvents();

      if (currentUser) {
        void refreshWallet().catch(error => {
          console.error("Não foi possível sincronizar a carteira:", error);
        });
      }

      if (currentUser?.role === "LICITANTE") {
        void refreshMyWins().catch(error => {
          console.error(
            "Não foi possível sincronizar os leilões ganhos:",
            error,
          );
        });

        void apiGet<ApiMyBidResponse[]>("/me/bids")
          .then(response => {
            if (active) setMyBids(response);
          })
          .catch(error => {
            if (active) {
              console.error("Não foi possível sincronizar meus lances:", error);
            }
          });
      }
    });

    socket.on("lot.created", () => {
      void loadLots();
      void loadAuditEvents();
    });
    socket.on("lot.live", () => {
      void loadLots();
      void loadAuditEvents();
    });
    socket.on("lot.canceled", () => {
      void loadLots();
      void loadAuditEvents();
    });
    socket.on("settlement.completed", () => {
      void loadLots();
      void loadAuditEvents();

      if (currentUser?.role === "LICITANTE") {
        void refreshMyWins().catch(error => {
          console.error(
            "Não foi possível atualizar os leilões ganhos após a liquidação:",
            error,
          );
        });
      }
    });

    socket.on("bid.placed", event => {
      const payload = event as {
        lotId?: string;
        amountCents?: number;
        currentPriceCents?: number;
        bidderPseudonym?: string | null;
        endsAt?: string | null;
      };

      if (!payload.lotId) return;

      const { lotId } = payload;

      // O evento NÃO é a fonte de verdade: aplicamos uma projeção otimista
      // (preço e líder público) e em seguida recarregamos o estado oficial
      // da API. Sem isso, o `currentLeaderBidderId` fica desatualizado e o
      // licitante recebe "você já é o líder" por engano até dar refresh.
      if (
        typeof payload.currentPriceCents === "number" ||
        typeof payload.amountCents === "number" ||
        typeof payload.endsAt === "string"
      ) {
        const nextPrice =
          payload.currentPriceCents ?? payload.amountCents ?? null;

        setLots(previousLots =>
          previousLots.map(lot =>
            lot.id === lotId
              ? {
                  ...lot,
                  currentBidCents:
                    nextPrice !== null
                      ? Math.max(lot.currentBidCents, nextPrice)
                      : lot.currentBidCents,
                  currentLeaderPseudonym:
                    typeof payload.bidderPseudonym === "string"
                      ? payload.bidderPseudonym
                      : lot.currentLeaderPseudonym,
                  endsAt:
                    typeof payload.endsAt === "string"
                      ? payload.endsAt
                      : lot.endsAt,
                }
              : lot,
          ),
        );
      }

      // Sincroniza o estado oficial (inclui o líder real do lote).
      void loadLots();

      void refreshLotBids(lotId).catch(error => {
        if (active) {
          console.error(
            "Não foi possível atualizar o histórico de lances:",
            error,
          );
        }
      });

      if (currentUser?.role === "LICITANTE") {
        void refreshMyBids().catch(error => {
          if (active) {
            console.error("Não foi possível atualizar meus lances:", error);
          }
        });
      }
    });

    return () => {
      active = false;
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      socket.disconnect();
    };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || "/");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const logoutUser = () => {
    const refreshToken = getRefreshToken();

    clearAuthTokens();
    setCurrentUser(null);
    setSellerAgreement(null);
    setMyBids([]);
    setBidsByLot({});

    if (refreshToken) {
      void apiPost<void>("/auth/logout", {
        refreshToken,
      }).catch(error => {
        console.error("Falha ao encerrar a sessão no servidor:", error);
      });
    }

    navigateTo("/");

    addNotification({
      title: "Sessão encerrada",
      message: "Você saiu da sua conta.",
      type: "info",
    });
  };

  const getLotById = (id: string) =>
    lots.find(
      lot => lot.id === id || lot.code.toLowerCase() === id.toLowerCase(),
    );

  const acceptSellerAgreement = async (): Promise<void> => {
    if (!currentUser || currentUser.role !== "LEILOEIRO") {
      throw new Error(
        "Somente um leiloeiro autenticado pode aceitar este termo.",
      );
    }

    const accepted = await apiPost<{
      userId: string;
      version: string;
      contentHash: string;
      acceptedAt: string;
    }>("/seller-agreement/accept", {
      version: SELLER_AGREEMENT_VERSION,
      content: SELLER_AGREEMENT_CONTENT,
    });

    setSellerAgreement({
      userId: accepted.userId,
      version: accepted.version,
      title: "Termo de Responsabilidade e Condução de Pregão Lance",
      acceptedAt: accepted.acceptedAt,
      contentHash: accepted.contentHash,
    });

    addNotification({
      title: "Termo registrado",
      message: "O aceite foi registrado pela API.",
      type: "success",
    });
  };

  const placeBid = async (
    lotId: string,
    amountCents: number,
  ): Promise<PlaceBidResult> => {
    const lotBeforeBid = lots.find(item => item.id === lotId);

    if (!lotBeforeBid) {
      return { success: false, error: "Lote não encontrado." };
    }

    if (!currentUser) {
      setReturnRouteAfterLogin(`/lotes/${lotBeforeBid.id}`);
      navigateTo("/entrar");

      return {
        success: false,
        error: "Entre na sua conta para participar do leilão.",
      };
    }

    if (currentUser.role !== "LICITANTE") {
      return {
        success: false,
        error: "Somente um licitante pode enviar lances.",
      };
    }

    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      return {
        success: false,
        error: "Informe um valor de lance válido.",
      };
    }

    let result: ApiBidResponse;

    try {
      result = await apiPost<ApiBidResponse>(
        `/lots/${encodeURIComponent(lotId)}/bids`,
        { amountCents },
        { "Idempotency-Key": crypto.randomUUID() },
      );
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível registrar o lance. Tente novamente.",
      };
    }

    // O servidor confirmou o lance. Falhas de sincronização não desfazem a operação.
    let antiSnipingApplied = false;

    try {
      const latestLots = await apiGet<ApiLotsResponse[]>("/lots");
      const updatedLots = mapApiLots(latestLots);
      const updatedLot = updatedLots.find(item => item.id === lotId);

      if (updatedLot) {
        antiSnipingApplied =
          new Date(updatedLot.endsAt).getTime() >
          new Date(lotBeforeBid.endsAt).getTime();

        setLots(previousLots =>
          previousLots.map(
            previousLot =>
              updatedLots.find(item => item.id === previousLot.id) ??
              previousLot,
          ),
        );
      }
    } catch (error) {
      console.error(
        "Lance registrado, mas não foi possível atualizar os lotes:",
        error,
      );
    }

    const syncResults = await Promise.allSettled([
      refreshLotBids(lotId),
      refreshMyBids(),
      refreshWallet(),
      refreshLots(),
    ]);

    syncResults.forEach((syncResult, index) => {
      if (syncResult.status === "rejected") {
        const labels = ["histórico público", "histórico pessoal", "carteira"];

        console.error(
          `Lance registrado, mas não foi possível atualizar ${labels[index]}:`,
          syncResult.reason,
        );
      }
    });

    addNotification({
      title: "Lance registrado",
      message: `Seu lance de ${formatBRL(result.bid.amountCents)} foi registrado pelo servidor.`,
      type: "success",
    });

    if (antiSnipingApplied) {
      addNotification({
        title: "Prazo do lote prorrogado",
        message: "O prazo foi estendido pela regra anti-sniping.",
        type: "info",
      });
    }

    return {
      success: true,
      antiSnipingApplied,
    };
  };

  /**
   * Edita um lote ainda não iniciado.
   * O backend registra cada alteração na trilha de auditoria (LOT_UPDATED),
   * com o valor anterior e o novo — é isso que aparece no histórico público.
   */
  const updateLot = async (
    lotId: string,
    patch: LotEditPatch,
  ): Promise<void> => {
    try {
      const updated = await apiPatch<ApiLotsResponse>(
        `/lots/${encodeURIComponent(lotId)}`,
        patch,
      );

      setLots(previous =>
        previous.map(lot =>
          lot.id === lotId
            ? updated.itemSnapshot
              ? mapApiLots([updated])[0]
              : ({ ...lot, ...patch } as typeof lot)
            : lot,
        ),
      );

      await refreshLots();

      addNotification({
        title: "Lote atualizado",
        message: "As alterações foram registradas na auditoria.",
        type: "success",
      });
    } catch (error) {
      addNotification({
        title: "Não foi possível salvar",
        message: error instanceof Error ? error.message : "Tente novamente.",
        type: "error",
      });

      throw error;
    }
  };

  const publishLot = async (lotId: string): Promise<void> => {
    try {
      const published = await apiPost<ApiLotsResponse>(
        `/lots/${encodeURIComponent(lotId)}/publish`,
      );

      setLots(previous =>
        previous.map(lot =>
          lot.id === lotId ? mapApiLots([published])[0] : lot,
        ),
      );

      addNotification({
        title: "Lote publicado",
        message: "O lote foi aberto ao vivo",
        type: "success",
      });
    } catch (error) {
      addNotification({
        title: "Não foi possível publicar",
        message: error instanceof Error ? error.message : "Tente novamente.",
        type: "error",
      });

      throw error;
    }
  };

  const cancelLot = async (lotId: string, reason: string): Promise<void> => {
    try {
      const cancelled = await apiPost<ApiLotsResponse>(
        `/lots/${encodeURIComponent(lotId)}/cancel`,
        { reason },
      );

      setLots(previous =>
        previous.map(lot =>
          lot.id === lotId
            ? cancelled.itemSnapshot
              ? mapApiLots([cancelled])[0]
              : { ...lot, status: cancelled.status }
            : lot,
        ),
      );

      addNotification({
        title: "Lote cancelado",
        message: "O cancelamento foi persistido pela API.",
        type: "warning",
      });
    } catch (error) {
      addNotification({
        title: "Não foi possível cancelar",
        message: error instanceof Error ? error.message : "Tente novamente.",
        type: "error",
      });

      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        logoutUser,

        refreshMyWins,

        currentRoute,
        navigateTo,
        returnRouteAfterLogin,
        setReturnRouteAfterLogin,

        lots,
        getLotById,
        bidsByLot,
        myBids,
        refreshLotBids,
        refreshLots,
        refreshLotAudit,
        refreshMyBids,
        subscribeToLot,
        unsubscribeFromLot,

        wallet,
        transactions,
        receipts,
        auditEvents,

        sellerAgreement,
        acceptSellerAgreement,
        authenticateApiUser,

        placeBid,
        updateLot,
        publishLot,
        cancelLot,

        selectedLotForBidModal,
        setSelectedLotForBidModal,

        selectedReceiptForModal,
        setSelectedReceiptForModal,

        viewportMode,
        setViewportMode,

        notifications,
        addNotification,
        dismissNotification,

        refreshWallet,
        deposit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }

  return context;
};
