import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Logo } from "./Logo";
import {
  Menu,
  X,
  User,
  Wallet,
  Gavel,
  Shield,
  ChevronDown,
  LogOut,
  Layers,
  PlusCircle,
  FileCheck,
} from "lucide-react";
import { formatBRL } from "../../logic/auctionRules";

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

  return (
    <header className="sticky top-0 z-40 bg-[#F5F1E7]/95 backdrop-blur-md border-b border-[#E2DDD2] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Logo
          variant="light"
          size="md"
          onClick={() => handleNav("/")}
          className="hover:opacity-90"
        />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#222923]">
          <button
            onClick={() => handleNav("/lotes")}
            className={`transition-colors cursor-pointer py-1 relative ${
              isActive("/lotes")
                ? "text-[#123D2F] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#123D2F]"
                : "text-[#222923]/80 hover:text-[#123D2F]"
            }`}
          >
            Explorar Lotes
          </button>

          <button
            onClick={() => handleNav("/auditoria")}
            className={`flex items-center gap-1 transition-colors cursor-pointer ${
              isActive("/auditoria")
                ? "text-[#123D2F] font-semibold"
                : "text-[#222923]/80 hover:text-[#123D2F]"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#123D2F]" />
            <span>Auditoria Pública</span>
          </button>
        </nav>

        {/* Right CTA / User Account Area */}
        <div className="hidden md:flex items-center gap-4">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-3 p-1.5 pl-3 rounded-lg border border-[#E2DDD2] bg-white hover:border-[#CDC5B4] transition-all cursor-pointer shadow-xs"
              >
                <div className="flex flex-col text-right leading-tight">
                  <span className="text-xs font-semibold text-[#123D2F] max-w-[130px] truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-[#68716A] uppercase font-medium tracking-wide">
                    {currentUser.role === "LEILOEIRO"
                      ? "Leiloeiro Oficial"
                      : "Licitante"}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#123D2F] text-[#F5F1E7] flex items-center justify-center font-bold text-xs overflow-hidden border border-[#123D2F]">
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
                <ChevronDown className="w-3.5 h-3.5 text-[#68716A]" />
              </button>

              {/* Account Dropdown */}
              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-[#E2DDD2] py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-[#E2DDD2]/60">
                    <p className="text-xs text-[#68716A]">Conectado como</p>
                    <p className="text-sm font-semibold text-[#123D2F] truncate">
                      {currentUser.email}
                    </p>
                    {currentUser.role === "LICITANTE" && (
                      <div className="mt-2 p-2 bg-[#F5F1E7] rounded-md text-xs">
                        <div className="flex justify-between text-[#68716A]">
                          <span>Saldo Disponível:</span>
                          <span className="font-semibold text-[#123D2F]">
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
                        className="w-full px-4 py-2 text-left text-xs font-medium text-[#222923] hover:bg-[#F5F1E7] flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-[#123D2F]" />
                        <span>Visão Geral da Conta</span>
                      </button>
                      <button
                        onClick={() => handleNav("/conta/lances")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-[#222923] hover:bg-[#F5F1E7] flex items-center gap-2 cursor-pointer"
                      >
                        <Gavel className="w-3.5 h-3.5 text-[#123D2F]" />
                        <span>Meus Lances</span>
                      </button>
                      <button
                        onClick={() => handleNav("/conta/arrematados")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-[#222923] hover:bg-[#F5F1E7] flex items-center gap-2 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-[#123D2F]" />
                        <span>Lotes Arrematados</span>
                      </button>
                      <button
                        onClick={() => handleNav("/conta/carteira")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-[#222923] hover:bg-[#F5F1E7] flex items-center gap-2 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5 text-[#123D2F]" />
                        <span>Carteira</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-1">
                      <button
                        onClick={() => handleNav("/leiloeiro")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-[#222923] hover:bg-[#F5F1E7] flex items-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#123D2F]" />
                        <span>Painel do Leiloeiro</span>
                      </button>
                      <button
                        onClick={() => handleNav("/leiloeiro/lotes/novo")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-[#123D2F] font-semibold hover:bg-[#F5F1E7] flex items-center gap-2 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-[#123D2F]" />
                        <span>Criar Novo Lote</span>
                      </button>
                      <button
                        onClick={() => handleNav("/leiloeiro/lotes")}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-[#222923] hover:bg-[#F5F1E7] flex items-center gap-2 cursor-pointer"
                      >
                        <Gavel className="w-3.5 h-3.5 text-[#123D2F]" />
                        <span>Gestão de Lotes</span>
                      </button>
                    </div>
                  )}

                  <div className="pt-1 border-t border-[#E2DDD2]/60">
                    <button
                      onClick={logoutUser}
                      className="w-full px-4 py-2 text-left text-xs font-medium text-[#B91C1C] hover:bg-[#FEE2E2]/40 flex items-center gap-2 cursor-pointer"
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
                className="px-4 py-2 text-sm font-medium text-[#123D2F] hover:text-[#0A2B22] transition-colors cursor-pointer"
              >
                Entrar
              </button>
              <button
                onClick={() => handleNav("/cadastro")}
                className="px-4 py-2 text-sm font-semibold text-[#F5F1E7] bg-[#123D2F] hover:bg-[#0A2B22] rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Cadastrar
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#222923] hover:bg-[#E2DDD2]/50 transition-colors"
            aria-label="Menu principal"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F5F1E7] border-b border-[#E2DDD2] px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleNav("/lotes")}
              className="text-left py-2 font-medium text-[#222923] hover:text-[#123D2F]"
            >
              Explorar Catálogo de Lotes
            </button>
            <button
              onClick={() => handleNav("/lotes?cat=Arte")}
              className="text-left py-2 font-medium text-[#222923] hover:text-[#123D2F]"
            >
              Arte & Coleções
            </button>
            <button
              onClick={() => handleNav("/lotes?cat=Discos")}
              className="text-left py-2 font-medium text-[#222923] hover:text-[#123D2F]"
            >
              Edições Musicais
            </button>
            <button
              onClick={() => handleNav("/auditoria")}
              className="text-left py-2 font-medium text-[#222923] hover:text-[#123D2F]"
            >
              Auditoria Pública Verificável
            </button>
          </div>

          <div className="pt-4 border-t border-[#E2DDD2]">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-2">
                  <div className="w-7 h-7 rounded-full bg-[#123D2F] text-[#F5F1E7] flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#123D2F]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-[#68716A] uppercase">
                      {currentUser.role}
                    </p>
                  </div>
                </div>

                {currentUser.role === "LICITANTE" ? (
                  <>
                    <button
                      onClick={() => handleNav("/conta")}
                      className="w-full text-left py-1.5 text-xs font-medium text-[#123D2F]"
                    >
                      Minha Conta & Saldo
                    </button>
                    <button
                      onClick={() => handleNav("/conta/lances")}
                      className="w-full text-left py-1.5 text-xs font-medium text-[#123D2F]"
                    >
                      Meus Lances
                    </button>
                    <button
                      onClick={() => handleNav("/conta/arrematados")}
                      className="w-full text-left py-1.5 text-xs font-medium text-[#123D2F]"
                    >
                      Comprovantes de Arremate
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleNav("/leiloeiro")}
                      className="w-full text-left py-1.5 text-xs font-medium text-[#123D2F]"
                    >
                      Painel do Leiloeiro
                    </button>
                    <button
                      onClick={() => handleNav("/leiloeiro/lotes/novo")}
                      className="w-full text-left py-1.5 text-xs font-semibold text-[#123D2F]"
                    >
                      Criar Novo Lote (Wizard)
                    </button>
                  </>
                )}

                <button
                  onClick={logoutUser}
                  className="w-full text-left py-2 text-xs font-semibold text-[#B91C1C]"
                >
                  Sair da Conta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNav("/entrar")}
                  className="py-2.5 text-center text-xs font-semibold rounded-lg border border-[#123D2F] text-[#123D2F]"
                >
                  Entrar
                </button>
                <button
                  onClick={() => handleNav("/cadastro")}
                  className="py-2.5 text-center text-xs font-semibold rounded-lg bg-[#123D2F] text-[#F5F1E7]"
                >
                  Cadastrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
