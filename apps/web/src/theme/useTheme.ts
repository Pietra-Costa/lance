import React from "react";

/**
 * Tipos e helpers de tema.
 *
 * Fica fora do contexto React para que o script anti-flash do `index.html`
 * e o ThemeProvider compartilhem a mesma chave de armazenamento.
 */

export type ThemeMode = "light" | "dark" | "system";

export type ResolvedTheme = "light" | "dark";

/** Chave usada no localStorage. Mantida em sincronia com o index.html. */
export const THEME_STORAGE_KEY = "lance:theme";

export const prefersDarkQuery = "(prefers-color-scheme: dark)";

/** Lê o tema salvo, ignorando valores inválidos. */
export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
  } catch {
    return "system";
  }
}

/** Resolve `system` a partir da preferência do sistema operacional. */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode !== "system") return mode;

  if (typeof window === "undefined" || !window.matchMedia) return "light";

  return window.matchMedia(prefersDarkQuery).matches ? "dark" : "light";
}

/** Aplica o tema no <html>: classe `.dark` + `color-scheme`. */
export function applyTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/**
 * Cria a função que assina mudanças de tema.
 *
 * Existe para `useSyncExternalStore`: a fonte de verdade do tema é o
 * localStorage + a media query, não um estado React duplicado.
 */
export function subscribeToTheme(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const media = window.matchMedia?.(prefersDarkQuery);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) onChange();
  };

  const handleMedia = () => onChange();

  window.addEventListener("storage", handleStorage);
  media?.addEventListener?.("change", handleMedia);

  // Evento próprio: disparado quando outra aba ou o próprio app muda o tema.
  window.addEventListener("lance:theme-changed", onChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    media?.removeEventListener?.("change", handleMedia);
    window.removeEventListener("lance:theme-changed", onChange);
  };
}

/**
 * Liga a transição suave de cores por um instante, só durante a troca.
 *
 * Evita animar a página inteira no carregamento (o que causaria um "flash"
 * de cores) e respeita `prefers-reduced-motion` via CSS.
 */
export function flashThemeTransition() {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.classList.add("theme-transition");
  window.setTimeout(() => root.classList.remove("theme-transition"), 260);
}

/**
 * Hook de tema.
 *
 * Devolve o modo escolhido (`light` | `dark` | `system`) e o tema efetivo,
 * além de um `setTheme` que persiste a escolha.
 */
export function useTheme() {
  const mode = React.useSyncExternalStore(
    subscribeToTheme,
    readStoredTheme,
    () => "system" as ThemeMode,
  );

  const resolved = React.useSyncExternalStore(
    subscribeToTheme,
    () => resolveTheme(readStoredTheme()),
    () => "light" as ResolvedTheme,
  );

  const setTheme = React.useCallback((next: ThemeMode) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Modo privado / storage bloqueado: aplica mesmo sem persistir.
    }

    flashThemeTransition();
    applyTheme(resolveTheme(next));
    window.dispatchEvent(new Event("lance:theme-changed"));
  }, []);

  /** Alterna direto entre claro e escuro (usado pelo botão do header). */
  const toggleTheme = React.useCallback(() => {
    setTheme(resolveTheme(readStoredTheme()) === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { mode, resolved, setTheme, toggleTheme } as const;
}
