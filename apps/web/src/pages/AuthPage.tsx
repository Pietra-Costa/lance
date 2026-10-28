import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Logo } from "../components/layout/Logo";
import {
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { apiPost, AuthResponse, saveAuthTokens } from "../services/api";

export interface AuthPageProps {
  initialMode?: "login" | "register";
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = "login",
}) => {
  const { authenticateApiUser, returnRouteAfterLogin, navigateTo } = useApp();

  const [mode, setMode] = useState<"login" | "register">(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"LICITANTE" | "LEILOEIRO">(
    "LICITANTE",
  );
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setErrorMsg("Preencha e-mail e senha.");
      return;
    }

    if (mode === "register" && name.trim().length < 2) {
      setErrorMsg("Informe seu nome completo.");
      return;
    }

    if (mode === "register" && (password.length < 8 || password.length > 20)) {
      setErrorMsg("A senha deve ter entre 8 e 20 caracteres.");
      return;
    }

    if (mode === "register" && !acceptTerms) {
      setErrorMsg("Aceite a declaração para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      const response =
        mode === "login"
          ? await apiPost<AuthResponse>("/auth/login", {
              email: normalizedEmail,
              password,
            })
          : await apiPost<AuthResponse>("/auth/register", {
              name: name.trim(),
              email: normalizedEmail,
              password,
              role: selectedRole,
            });

      saveAuthTokens(response.accessToken, response.refreshToken);

      await authenticateApiUser(response.user);
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Não foi possível autenticar. Tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <Logo variant="light" size="lg" className="mx-auto" />

        <h1 className="font-heading font-bold text-2xl text-[#123D2F]">
          {mode === "login" ? "Acesse sua Conta" : "Crie sua Conta na Lance"}
        </h1>

        <p className="text-xs text-[#68716A]">
          {returnRouteAfterLogin
            ? "Autentique-se para retornar e continuar sua participação no lote."
            : "Participe de leilões singulares com credibilidade e regras claras."}
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#E2DDD2] shadow-md space-y-5">
        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-[#FEE2E2] border border-[#B91C1C]/30 text-xs text-[#B91C1C] flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1">
              <label
                htmlFor="auth-name"
                className="text-xs font-semibold text-[#222923] block"
              >
                Nome completo
              </label>

              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex.: Nome completo"
                required
                minLength={2}
                maxLength={100}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDC5B4] text-xs focus:ring-2 focus:ring-[#123D2F] focus:outline-hidden disabled:opacity-60"
              />
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="auth-email"
              className="text-xs font-semibold text-[#222923] block"
            >
              E-mail
            </label>

            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com.br"
              required
              maxLength={254}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDC5B4] text-xs focus:ring-2 focus:ring-[#123D2F] focus:outline-hidden disabled:opacity-60"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="auth-password"
              className="text-xs font-semibold text-[#222923] block"
            >
              Senha
            </label>

            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={mode === "register" ? 8 : 1}
                maxLength={20}
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDC5B4] text-xs focus:ring-2 focus:ring-[#123D2F] focus:outline-hidden pr-10 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowPassword(previous => !previous)}
                className="absolute right-3 top-2.5 text-[#68716A] hover:text-[#222923]"
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div className="space-y-3 pt-1">
              <label className="text-xs font-semibold text-[#222923] block">
                Tipo de conta
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("LICITANTE")}
                  disabled={isLoading}
                  aria-pressed={selectedRole === "LICITANTE"}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                    selectedRole === "LICITANTE"
                      ? "border-[#123D2F] bg-[#123D2F]/5 font-semibold text-[#123D2F]"
                      : "border-[#E2DDD2] text-[#68716A]"
                  }`}
                >
                  <span className="flex items-center gap-2 font-bold">
                    <UserCheck className="w-4 h-4" />
                    Licitante
                  </span>
                  <span className="text-[10px] text-[#68716A] block mt-1">
                    Participa de leilões
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("LEILOEIRO")}
                  disabled={isLoading}
                  aria-pressed={selectedRole === "LEILOEIRO"}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                    selectedRole === "LEILOEIRO"
                      ? "border-[#123D2F] bg-[#123D2F]/5 font-semibold text-[#123D2F]"
                      : "border-[#E2DDD2] text-[#68716A]"
                  }`}
                >
                  <span className="flex items-center gap-2 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    Leiloeiro
                  </span>
                  <span className="text-[10px] text-[#68716A] block mt-1">
                    Cadastra e conduz lotes
                  </span>
                </button>
              </div>

              <label className="flex items-start gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  disabled={isLoading}
                  className="mt-0.5 rounded border-[#CDC5B4] text-[#123D2F]"
                />

                <span className="text-[11px] text-[#68716A]">
                  Declaro que li e aceito as condições de cadastro e utilização
                  da plataforma.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#123D2F] hover:bg-[#0A2B22] text-[#F5F1E7] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <span>
                {mode === "login" ? "Entrando..." : "Criando conta..."}
              </span>
            ) : (
              <>
                <span>
                  {mode === "login" ? "Entrar na Plataforma" : "Criar Conta"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-[#E2DDD2] text-center text-xs text-[#68716A]">
          {mode === "login" ? (
            <p>
              Ainda não tem cadastro?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg(null);
                }}
                disabled={isLoading}
                className="font-semibold text-[#123D2F] hover:underline"
              >
                Cadastre-se gratuitamente
              </button>
            </p>
          ) : (
            <p>
              Já possui conta?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                }}
                disabled={isLoading}
                className="font-semibold text-[#123D2F] hover:underline"
              >
                Faça login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
