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
  Gavel,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { apiPost, AuthResponse, saveAuthTokens } from "../services/api";

export interface AuthPageProps {
  initialMode?: "login" | "register";
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = "login",
}) => {
  const { authenticateApiUser, returnRouteAfterLogin } = useApp();

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
    <main className="relative isolate flex-1 w-full overflow-x-clip bg-surface-base">
      <style>{`
        @keyframes lance-fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes lance-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes lance-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        @keyframes lance-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .lance-fade-up {
          animation: lance-fade-up 550ms cubic-bezier(.2,.7,.2,1) both;
        }

        .lance-fade-in {
          animation: lance-fade-in 450ms ease-out both;
        }

        .lance-float {
          animation: lance-float 6s ease-in-out infinite;
        }

        .lance-orbit {
          animation: lance-orbit 32s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .lance-fade-up,
          .lance-fade-in,
          .lance-float,
          .lance-orbit {
            animation: none !important;
          }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 -z-10 h-128 w-lg rounded-full bg-accent-gold/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 -z-10 h-120 w-120 rounded-full bg-brand-primary/10 blur-3xl"
      />
      <div className="grid h-full w-full grid-cols-1 bg-surface-card lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="relative isolate flex min-h-0 flex-col overflow-hidden bg-brand-deep px-5 py-5 text-brand-on-dark sm:px-8 sm:py-7 lg:min-h-dvh lg:justify-between lg:px-12 lg:py-10 xl:px-16 xl:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full border border-border-subtle border-invert"
          />
          <div
            aria-hidden="true"
            className="lance-orbit pointer-events-none absolute -right-12 top-8 -z-10 hidden h-64 w-64 rounded-full border border-border-subtle border-accent-gold/20 sm:block lg:top-16"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-24 -z-10 h-80 w-80 rounded-full bg-brand-primary blur-3xl"
          />

          <div className="lance-fade-in relative z-10">
            <Logo variant="light" size="lg" />

            <div className="mt-5 max-w-md sm:mt-8 lg:mt-16">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-invert bg-surface-card/6 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-accent-gold-ink sm:mb-5 sm:text-[10px]">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Uma nova experiência
              </div>

              <h2 className="font-heading text-2xl font-medium leading-tight tracking-tight sm:text-3xl lg:text-5xl lg:leading-[1.15]">
                Grandes oportunidades
                <span className="ml-1 font-normal italic text-accent-gold-ink sm:mt-1 sm:block">
                  começam aqui.
                </span>
              </h2>

              <p className="mt-3 max-w-sm text-xs leading-5 text-brand-on-dark/80 sm:mt-4 sm:text-sm sm:leading-6 lg:mt-5 lg:text-base lg:leading-7">
                Um espaço para descobrir peças singulares, participar de
                disputas e conduzir negócios com mais transparência.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-6 hidden lg:block">
            <div className="max-w-xs border-l border-accent-gold/50 pl-4">
              <p className="font-heading text-lg italic text-brand-on-dark/90">
                O valor está nos detalhes.
              </p>
              <p className="mt-1 text-xs leading-5 text-brand-on-dark/80">
                Encontre o próximo lote que merece a sua atenção.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-brand-on-dark/40">
              <span className="h-px w-8 bg-accent-gold/60" />
              Lance · Casa de Leilões
            </div>
          </div>

          <div className="relative z-10 mt-4 hidden items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-brand-on-dark/45 max-[380px]:flex sm:flex lg:hidden">
            <LockKeyhole className="h-3 w-3" />
            Acesso à plataforma Lance
          </div>
        </aside>
        {/* Formulário */}
        <section className="flex min-w-0 items-center justify-center bg-surface-card px-5 py-7 sm:px-8 sm:py-9 lg:min-h-dvh lg:px-10 lg:py-8 xl:px-16">
          <div key={mode} className="lance-fade-up w-full max-w-md">
            <div className="mb-6 sm:mb-8">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/5 text-brand-interactive sm:mb-4 sm:h-11 sm:w-11 sm:rounded-2xl">
                {mode === "login" ? (
                  <LockKeyhole className="h-5 w-5" strokeWidth={1.7} />
                ) : (
                  <UserCheck className="h-5 w-5" strokeWidth={1.7} />
                )}
              </div>

              <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-accent-gold-ink sm:mb-2 sm:text-[10px]">
                {mode === "login"
                  ? "Bem-vindo de volta"
                  : "Faça parte da Lance"}
              </p>

              <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-interactive sm:text-3xl lg:text-4xl">
                {mode === "login" ? "Acesse sua conta" : "Crie sua conta"}
              </h1>

              <p className="mt-2 text-xs leading-5 text-text-secondary sm:mt-3 sm:text-sm sm:leading-6">
                {returnRouteAfterLogin
                  ? "Entre para retornar e continuar sua participação no lote."
                  : mode === "login"
                    ? "Entre para acompanhar oportunidades e participar de leilões."
                    : "Cadastre-se para descobrir oportunidades e participar da plataforma."}
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="lance-fade-in mb-4 flex items-start gap-3 rounded-xl border border-semantic-error/20 bg-semantic-error-bg p-3 text-xs text-semantic-error sm:mb-5 sm:p-4 sm:text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-5">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {mode === "register" && (
                <div className="space-y-1.5 sm:space-y-2">
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-semibold text-text-primary"
                  >
                    Nome completo
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Como podemos chamar você?"
                    required
                    minLength={2}
                    maxLength={100}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-border-strong bg-surface-base/30 px-3.5 py-3 text-sm text-text-primary outline-none transition duration-200 placeholder:text-text-secondary/60 hover:border-brand-primary/40 focus:border-brand-primary focus:bg-surface-card focus:ring-4 focus:ring-brand-primary/10 disabled:opacity-60 sm:px-4 sm:py-3.5"
                  />
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-text-primary"
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
                  className="w-full rounded-xl border border-border-strong bg-surface-base/30 px-3.5 py-3 text-sm text-text-primary outline-none transition duration-200 placeholder:text-text-secondary/60 hover:border-brand-primary/40 focus:border-brand-primary focus:bg-surface-card focus:ring-4 focus:ring-brand-primary/10 disabled:opacity-60 sm:px-4 sm:py-3.5"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold text-text-primary"
                  >
                    Senha
                  </label>
                  <span className="text-[10px] text-text-secondary">
                    {mode === "register"
                      ? "8 a 20 caracteres"
                      : "Acesso seguro"}
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    minLength={mode === "register" ? 8 : 1}
                    maxLength={20}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-border-strong bg-surface-base/30 px-3.5 py-3 pr-12 text-sm text-text-primary outline-none transition duration-200 placeholder:text-text-secondary/60 hover:border-brand-primary/40 focus:border-brand-primary focus:bg-surface-card focus:ring-4 focus:ring-brand-primary/10 disabled:opacity-60 sm:px-4 sm:py-3.5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(previous => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-text-secondary transition-colors hover:bg-brand-primary/5 hover:text-brand-interactive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="space-y-3 pt-1">
                  <label className="block text-xs font-semibold text-text-primary">
                    Tipo de conta
                  </label>

                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRole("LICITANTE")}
                      disabled={isLoading}
                      aria-pressed={selectedRole === "LICITANTE"}
                      className={`group rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-3.5 ${
                        selectedRole === "LICITANTE"
                          ? "border-brand-primary bg-brand-primary/5 shadow-sm shadow-brand-primary/5"
                          : "border-border-subtle bg-surface-card hover:border-brand-primary/30"
                      }`}
                    >
                      <span
                        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg transition-colors sm:mb-3 sm:h-9 sm:w-9 sm:rounded-xl ${
                          selectedRole === "LICITANTE"
                            ? "bg-brand-primary text-white"
                            : "bg-surface-base text-text-secondary group-hover:text-brand-interactive"
                        }`}
                      >
                        <UserCheck className="h-4 w-4" />
                      </span>
                      <span className="block text-xs font-semibold text-text-primary">
                        Licitante
                      </span>
                      <span className="mt-1 block text-[10px] leading-4 text-text-secondary">
                        Participa de leilões
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole("LEILOEIRO")}
                      disabled={isLoading}
                      aria-pressed={selectedRole === "LEILOEIRO"}
                      className={`group rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-3.5 ${
                        selectedRole === "LEILOEIRO"
                          ? "border-brand-primary bg-brand-primary/5 shadow-sm shadow-brand-primary/5"
                          : "border-border-subtle bg-surface-card hover:border-brand-primary/30"
                      }`}
                    >
                      <span
                        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg transition-colors sm:mb-3 sm:h-9 sm:w-9 sm:rounded-xl ${
                          selectedRole === "LEILOEIRO"
                            ? "bg-brand-primary text-white"
                            : "bg-surface-base text-text-secondary group-hover:text-brand-interactive"
                        }`}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <span className="block text-xs font-semibold text-text-primary">
                        Leiloeiro
                      </span>
                      <span className="mt-1 block text-[10px] leading-4 text-text-secondary">
                        Cadastra e conduz lotes
                      </span>
                    </button>
                  </div>

                  <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border-subtle bg-surface-base/30 p-3 transition-colors hover:border-brand-primary/30 sm:gap-3 sm:p-3.5">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={e => setAcceptTerms(e.target.checked)}
                      disabled={isLoading}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand-primary"
                    />
                    <span className="text-[11px] leading-5 text-text-secondary">
                      Declaro que li e aceito as condições de cadastro e
                      utilização da plataforma.
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-3 rounded-xl bg-brand-primary px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-primary/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-deep hover:shadow-xl hover:shadow-brand-primary/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/20 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:py-4"
              >
                <span>
                  {isLoading
                    ? mode === "login"
                      ? "Entrando..."
                      : "Criando conta..."
                    : mode === "login"
                      ? "Entrar na plataforma"
                      : "Criar minha conta"}
                </span>
                {!isLoading && (
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                )}
              </button>
            </form>

            <div className="mt-5 border-t border-border-subtle pt-5 text-center sm:mt-7 sm:pt-6">
              <p className="text-xs text-text-secondary sm:text-sm">
                {mode === "login"
                  ? "Ainda não tem cadastro?"
                  : "Já possui conta?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setErrorMsg(null);
                  }}
                  disabled={isLoading}
                  className="font-semibold text-brand-interactive underline-offset-4 transition-colors hover:text-brand-deep hover:underline disabled:opacity-60"
                >
                  {mode === "login"
                    ? "Cadastre-se gratuitamente"
                    : "Faça login"}
                </button>
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-text-secondary/70 sm:mt-7">
              <LockKeyhole className="h-3.5 w-3.5" />
              <span>Seus dados são tratados com segurança.</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
