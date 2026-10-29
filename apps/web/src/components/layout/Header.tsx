import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  Menu,
  X,
  User,
  Wallet,
  Gavel,
  ChevronDown,
  LogOut,
  Layers,
  PlusCircle,
  FileCheck,
} from "lucide-react";
import { formatBRL } from "../../logic/auctionRules";
import { NotificationBell } from "./NotificationBell";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { AnimatePresence, motion } from "motion/react";

export const Header: React.FC = () => {
  const { currentRoute, navigateTo, currentUser, wallet, logoutUser } =
    useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && currentRoute === "/") return true;
    if (path !== "/" && currentRoute.startsWith(path)) return true;
    return false;
  };

  const handleNav = (path: string) => {
    navigateTo(path);
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  };

  const toggleAccountMenu = () => {
    setAccountMenuOpen((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface-base/95 backdrop-blur-md border-b border-border-subtle transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Logo
          variant="light"
          size="md"
          onClick={() => handleNav("/")}
          className="hover:opacity-90"
        />

        <nav className="hidden lg:flex items-center gap-8 text-m font-medium text-text-primary">
          <button
            onClick={() => handleNav("/lotes")}
            className={`relative py-2 transition-colors cursor-pointer ${
              isActive("/lotes")
                ? "text-brand-interactive font-semibold"
                : "text-text-primary/80 hover:text-brand-interactive"
            }`}
          >
            Explorar Lotes
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-brand-primary transition-all duration-300 ease-out ${
                isActive("/lotes") ? "w-full opacity-100" : "w-0 opacity-0"
              }`}
            />
          </button>

          <button
            onClick={() => handleNav("/auditoria")}
            className={`relative py-2 transition-colors cursor-pointer ${
              isActive("/auditoria")
                ? "text-brand-interactive font-semibold"
                : "text-text-primary/80 hover:text-brand-interactive"
            }`}
          >
            Auditoria Pública
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-brand-primary transition-all duration-300 ease-out ${
                isActive("/auditoria") ? "w-full opacity-100" : "w-0 opacity-0"
              }`}
            />
          </button>

          <button
            onClick={() => handleNav("/sobre")}
            className={`relative py-2 transition-colors cursor-pointer ${
              isActive("/sobre")
                ? "text-brand-interactive font-semibold"
                : "text-text-primary/80 hover:text-brand-interactive"
            }`}
          >
            Sobre a Lance
            <span
              className={`absolute bottom-0 left-0 h-0.5 bg-brand-primary transition-all duration-300 ease-out ${
                isActive("/sobre") ? "w-full opacity-100" : "w-0 opacity-0"
              }`}
            />
          </button>
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          {currentUser && currentUser.role === "LICITANTE" && (
            <button
              onClick={() => handleNav("/conta/carteira")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-card hover:border-border-strong transition-colors cursor-pointer"
              title="Saldo disponível na carteira"
            >
              <Wallet className="w-3.5 h-3.5 text-brand-interactive" />
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[9px] uppercase tracking-wide text-text-secondary">
                  Disponível
                </span>
                <span className="text-[11px] font-bold text-brand-interactive font-mono">
                  {formatBRL(wallet.availableCents)}
                </span>
              </span>
            </button>
          )}

          <div onClick={() => setAccountMenuOpen(false)}>
            <NotificationBell />
          </div>

          <ThemeToggle />

          {currentUser ? (
            <div className="relative">
              <button
                onClick={toggleAccountMenu}
                className="flex items-center gap-3 p-1.5 pl-3 rounded-lg border border-border-subtle bg-surface-card hover:border-border-strong transition-all cursor-pointer shadow-xs"
              >
                <div className="flex flex-col text-right leading-tight">
                  <span className="text-xs font-semibold text-brand-interactive max-w-32.5 truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-text-secondary uppercase font-medium tracking-wide">
                    {currentUser.role === "LEILOEIRO"
                      ? "Leiloeiro Oficial"
                      : "Licitante"}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-brand-primary text-brand-on-dark flex items-center justify-center font-bold text-xs overflow-hidden border border-brand-primary">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
              </button>

              {accountMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-surface-card rounded-xl shadow-lg border border-border-subtle py-2 z-50 origin-top-right animate-[dropdown-enter_180ms_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none"
                >
                  <div className="px-4 py-2 border-b border-border-subtle/60">
                    <p className="text-xs text-text-secondary">
                      Conectado como
                    </p>
                    <p className="text-sm font-semibold text-brand-interactive truncate">
                      {currentUser.email}
                    </p>
                    {currentUser.role === "LICITANTE" && (
                      <div className="mt-2 p-2 bg-surface-base rounded-md text-xs">
                        <div className="flex justify-between text-text-secondary">
                          <span>Saldo Disponível:</span>
                          <span className="font-semibold text-brand-interactive">
                            {formatBRL(wallet.availableCents)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {currentUser.role === "LICITANTE" ? (
                    <div className="py-1">
                      <button
                        onClick={() => handleNav("/conta")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-text-primary hover:bg-surface-base flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-brand-interactive" />
                        <span>Visão Geral da Conta</span>
                      </button>
                      <button
                        onClick={() => handleNav("/conta/lances")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-text-primary hover:bg-surface-base flex items-center gap-2 cursor-pointer"
                      >
                        <Gavel className="w-3.5 h-3.5 text-brand-interactive" />
                        <span>Meus Lances</span>
                      </button>
                      <button
                        onClick={() => handleNav("/conta/arrematados")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-text-primary hover:bg-surface-base flex items-center gap-2 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-brand-interactive" />
                        <span>Lotes Arrematados</span>
                      </button>
                      <button
                        onClick={() => handleNav("/conta/carteira")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-text-primary hover:bg-surface-base flex items-center gap-2 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5 text-brand-interactive" />
                        <span>Carteira</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-1">
                      <button
                        onClick={() => handleNav("/leiloeiro")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-text-primary hover:bg-surface-base flex items-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-brand-interactive" />
                        <span>Painel do Leiloeiro</span>
                      </button>
                      <button
                        onClick={() => handleNav("/leiloeiro/lotes/novo")}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-brand-interactive hover:bg-surface-base flex items-center gap-2 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-brand-interactive" />
                        <span>Criar Novo Lote</span>
                      </button>
                      <button
                        onClick={() => handleNav("/leiloeiro/lotes")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-text-primary hover:bg-surface-base flex items-center gap-2 cursor-pointer"
                      >
                        <Gavel className="w-3.5 h-3.5 text-brand-interactive" />
                        <span>Gestão de Lotes</span>
                      </button>
                    </div>
                  )}

                  <div className="py-1 border-t border-border-subtle/60">
                    <ThemeToggle variant="menu" />
                  </div>

                  <div className="pt-1 border-t border-border-subtle/60">
                    <button
                      onClick={logoutUser}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-semantic-error hover:bg-semantic-error-bg/40 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair da conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNav("/entrar")}
                className="px-4 py-2 text-sm font-medium text-brand-interactive hover:text-brand-deep transition-colors cursor-pointer"
              >
                Entrar
              </button>
              <button
                onClick={() => handleNav("/cadastro")}
                className="px-4 py-2 text-sm font-semibold text-brand-on-dark bg-brand-primary hover:text-brand-deep rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Cadastrar
              </button>
            </div>
          )}
        </div>

        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />

          <button
            onClick={() => {
              setMobileMenuOpen((prev) => !prev);
              setAccountMenuOpen(false);
            }}
            className="p-2 rounded-lg text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
            aria-label={
              mobileMenuOpen ? "Fechar menu principal" : "Abrir menu principal"
            }
            aria-expanded={mobileMenuOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileMenuOpen ? "close" : "menu"}
                initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="flex"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="lg:hidden bg-surface-base border-b border-border-subtle px-4 pt-3 pb-6 space-y-4 shadow-inner"
          >
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => handleNav("/lotes")}
                className={`text-left py-2 font-medium transition-colors ${
                  isActive("/lotes")
                    ? "text-brand-interactive font-semibold"
                    : "text-text-primary hover:text-brand-interactive"
                }`}
              >
                Explorar Catálogo de Lotes
              </button>

              <button
                onClick={() => handleNav("/auditoria")}
                className={`text-left py-2 font-medium transition-colors ${
                  isActive("/auditoria")
                    ? "text-brand-interactive font-semibold"
                    : "text-text-primary hover:text-brand-interactive"
                }`}
              >
                Auditoria Pública Verificável
              </button>

              <button
                onClick={() => handleNav("/sobre")}
                className={`text-left py-2 font-medium transition-colors ${
                  isActive("/sobre")
                    ? "text-brand-interactive font-semibold"
                    : "text-text-primary hover:text-brand-interactive"
                }`}
              >
                Sobre a Lance
              </button>
            </div>

            <div className="pt-4 border-t border-border-subtle">
              {currentUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-border-subtle">
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-brand-on-dark flex items-center justify-center font-bold text-xs">
                      {currentUser.name.charAt(0)}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-brand-interactive">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-text-secondary uppercase font-medium">
                        {currentUser.role}
                      </p>
                    </div>
                  </div>

                  {currentUser.role === "LICITANTE" ? (
                    <>
                      <button
                        onClick={() => handleNav("/conta")}
                        className="w-full text-left py-1.5 text-xs font-medium text-brand-interactive"
                      >
                        Minha Conta & Saldo
                      </button>

                      <button
                        onClick={() => handleNav("/conta/lances")}
                        className="w-full text-left py-1.5 text-xs font-medium text-brand-interactive"
                      >
                        Meus Lances
                      </button>

                      <button
                        onClick={() => handleNav("/conta/arrematados")}
                        className="w-full text-left py-1.5 text-xs font-medium text-brand-interactive"
                      >
                        Comprovantes de Arremate
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleNav("/leiloeiro")}
                        className="w-full text-left py-1.5 text-xs font-medium text-brand-interactive"
                      >
                        Painel do Leiloeiro
                      </button>

                      <button
                        onClick={() => handleNav("/leiloeiro/lotes/novo")}
                        className="w-full text-left py-1.5 text-xs font-semibold text-brand-interactive"
                      >
                        Criar Novo Lote (Wizard)
                      </button>
                    </>
                  )}

                  <button
                    onClick={logoutUser}
                    className="w-full text-left py-2 text-xs font-semibold text-semantic-error"
                  >
                    Sair da Conta
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleNav("/entrar")}
                    className="py-2.5 text-center text-xs font-semibold rounded-lg border border-brand-primary text-brand-interactive bg-surface-card/50"
                  >
                    Entrar
                  </button>

                  <button
                    onClick={() => handleNav("/cadastro")}
                    className="py-2.5 text-center text-xs font-semibold rounded-lg bg-brand-primary text-brand-on-dark"
                  >
                    Cadastrar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
