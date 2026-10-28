export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4000"
).replace(/\/+$/, "");

const ACCESS_TOKEN_KEY = "lance.accessToken";
const REFRESH_TOKEN_KEY = "lance.refreshToken";

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: "LICITANTE" | "LEILOEIRO";
  publicPseudonym: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer" | string;
  refreshToken: string;
  user: ApiUser;
}

interface ApiErrorBody {
  message?: string | string[];
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveAuthTokens(
  accessToken: string,
  refreshToken: string,
): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

let refreshPromise: Promise<string> | null = null;

function notifySessionExpired(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lance:auth-expired"));
  }
}

function isAuthEndpoint(path: string): boolean {
  const pathname = path.split("?")[0].replace(/\/+$/, "");

  return [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
  ].includes(pathname);
}

async function readErrorMessage(
  response: Response,
  path: string,
): Promise<Error> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;

  const message = Array.isArray(body?.message)
    ? body.message.join(", ")
    : body?.message;

  return new Error(message || `Erro na API (${response.status}) em ${path}`);
}

async function refreshAccessToken(): Promise<string> {
  // Todas as requisições simultâneas compartilham a mesma renovação.
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error("Sessão expirada. Entre novamente.");
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw await readErrorMessage(response, "/auth/refresh");
    }

    const auth = (await response.json()) as AuthResponse;

    if (!auth.accessToken || !auth.refreshToken) {
      throw new Error("A API retornou tokens inválidos.");
    }

    // O backend revoga o refresh token anterior: salvar ambos é obrigatório.
    saveAuthTokens(auth.accessToken, auth.refreshToken);

    return auth.accessToken;
  })()
    .catch(error => {
      clearAuthTokens();
      notifySessionExpired();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  hasRetried = false,
): Promise<T> {
  const tokenUsed = getAccessToken();
  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (tokenUsed) {
    headers.set("Authorization", `Bearer ${tokenUsed}`);
  } else {
    headers.delete("Authorization");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && !hasRetried && !isAuthEndpoint(path)) {
    try {
      const currentToken = getAccessToken();

      // Outra requisição pode já ter renovado o token usado aqui.
      // Nesse caso, não consumimos novamente o refresh token rotacionado.
      if (currentToken && currentToken !== tokenUsed) {
        return apiRequest<T>(path, init, true);
      }

      await refreshAccessToken();

      // Repetição única da requisição original.
      // O corpo e os cabeçalhos funcionais, inclusive Idempotency-Key,
      // são preservados.
      return apiRequest<T>(path, init, true);
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error("Sessão expirada. Entre novamente.");
    }
  }

  if (!response.ok) {
    throw await readErrorMessage(response, path);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export function apiPost<T>(
  path: string,
  body?: unknown,
  extraHeaders?: HeadersInit,
): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    headers: extraHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
