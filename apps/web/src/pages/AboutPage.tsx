import React from "react";
import { useApp } from "../context/AppContext";
import {
  Gavel,
  ShieldCheck,
  Wallet,
  Search,
  ArrowUpRight,
  Database,
  Lock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const processSteps = [
  {
    number: "01",
    icon: Search,
    title: "Acervo",
    description:
      "A busca consulta The Met, Art Institute of Chicago e MusicBrainz. Se uma fonte cair, as outras continuam respondendo.",
  },
  {
    number: "02",
    icon: Database,
    title: "Snapshot",
    description:
      "Ao criar o lote, título, imagem, atribuição e ficha técnica são congelados. Mudanças na fonte externa não alteram o lote publicado.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Disputa",
    description:
      "Lances válidos exigem valor mínimo e saldo disponível. O valor do lance fica reservado; se você for superado, a reserva volta na hora.",
  },
  {
    number: "04",
    icon: ShieldCheck,
    title: "Anti-sniping",
    description:
      "Lance nos últimos dois minutos estende o encerramento em dois minutos, sempre pelo relógio do servidor.",
  },
  {
    number: "05",
    icon: Lock,
    title: "Liquidação",
    description:
      "Ao encerrar com vencedor, o valor é debitado, creditado ao leiloeiro e um comprovante é emitido — tudo em uma transação.",
  },
  {
    number: "06",
    icon: ShieldCheck,
    title: "Auditoria",
    description:
      "Cada evento entra numa cadeia de hashes SHA-256. A página de auditoria recalcula a cadeia e mostra se algo foi alterado.",
  },
];

const roles = [
  {
    number: "01",
    icon: Gavel,
    title: "Leiloeiro",
    description:
      "Pesquisa itens em acervos públicos, cria e administra lotes, define lance inicial, incremento e janela de disputa. Aceita o termo de responsabilidade antes de publicar. Não pode dar lances.",
  },
  {
    number: "02",
    icon: Wallet,
    title: "Licitante",
    description:
      "Recebe saldo simulado na carteira, disputa lotes ao vivo, acompanha o histórico dos seus lances e recebe um comprovante de arremate com link público de verificação. Não administra lotes.",
  },
];

export const AboutPage: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <main className="bg-surface-base text-text-primary">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <header className="relative py-14 sm:py-20 lg:py-28 border-b border-border-subtle">
          <div className="flex items-center gap-3 mb-10">
            <span className="w-8 h-px bg-accent-gold" />
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-text-secondary">
              Lance · Sobre a plataforma
            </span>
          </div>

          <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-10 lg:gap-20 items-end">
            <div>
              <h1 className="font-heading text-5xl sm:text-6xl lg:text-8xl font-medium tracking-[-0.055em] leading-[0.98] text-brand-primary">
                O que é
                <br />a Lance<span className="text-accent-gold">?</span>
              </h1>

              <p className="mt-8 max-w-2xl text-sm sm:text-base leading-7 text-text-secondary">
                A Lance é uma casa de leilões digital. Leiloeiros montam lotes a
                partir de acervos públicos de museus e bases culturais,
                licitantes disputam em tempo real com saldo simulado, e qualquer
                pessoa — mesmo sem conta — pode auditar o histórico de cada
                lote.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <button
                  onClick={() => navigateTo("/lotes")}
                  className="inline-flex items-center gap-3 bg-brand-primary text-surface-base px-5 py-3.5 text-xs font-semibold hover:bg-brand-deep transition-colors cursor-pointer"
                >
                  Explorar lotes
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => navigateTo("/auditoria")}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary border-b border-accent-gold pb-2 hover:text-text-secondary transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Ver auditoria
                </button>
              </div>
            </div>

            <aside className="lg:justify-self-end w-full max-w-sm">
              <div className="border-t-2 border-brand-primary pt-5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-secondary">
                  Princípio da plataforma
                </span>
                <p className="font-heading text-2xl sm:text-3xl leading-snug text-brand-primary mt-4">
                  Disputa pública.
                  <br />
                  Histórico verificável.
                </p>
                <div className="mt-6 flex items-center gap-3 text-xs text-text-secondary">
                  <ShieldCheck className="w-5 h-5 text-accent-gold shrink-0" />
                  Auditoria com integridade verificável
                </div>
              </div>
            </aside>
          </div>

          <img
            src="/assets/white.png"
            alt=""
            aria-hidden="true"
            className="absolute top-5 -right-24.5 w-64 xl:w-100 h-auto object-contain opacity-[0.06] select-none pointer-events-none hidden lg:block"
          />
        </header>

        <section className="py-16 sm:py-20 lg:py-24 border-b border-border-subtle">
          <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-10 lg:gap-20">
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-accent-gold font-semibold">
                01 / Participação
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl text-brand-primary mt-5 leading-tight">
                Dois papéis,
                <br />
                uma regra de exclusividade
              </h2>
              <p className="mt-5 text-sm leading-6 text-text-secondary max-w-sm">
                Cada perfil tem responsabilidades e permissões próprias dentro
                do pregão.
              </p>
            </div>

            <div className="border-t border-brand-primary">
              {roles.map((role) => {
                const Icon = role.icon;

                return (
                  <article
                    key={role.number}
                    className="grid grid-cols-[2.5rem_1fr] sm:grid-cols-[3.5rem_1fr] gap-4 sm:gap-6 py-7 border-b border-border-subtle"
                  >
                    <span className="font-mono text-xs text-accent-gold pt-1">
                      {role.number}
                    </span>
                    <div>
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-brand-primary" />
                        <h3 className="font-heading text-xl sm:text-2xl font-semibold text-brand-primary">
                          {role.title}
                        </h3>
                      </div>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary">
                        {role.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 lg:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12">
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-accent-gold font-semibold">
                02 / Por dentro do pregão
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl text-brand-primary mt-5">
                Como o pregão funciona
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-text-secondary">
              Da consulta aos acervos à verificação do histórico: as etapas que
              estruturam cada lote.
            </p>
          </div>

          <div className="border-t border-brand-primary">
            {processSteps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  className="group grid grid-cols-[2.5rem_1fr] sm:grid-cols-[4rem_1fr_1.5fr] gap-x-4 sm:gap-x-8 gap-y-3 py-6 sm:py-8 border-b border-border-subtle"
                >
                  <span className="font-mono text-xs text-accent-gold pt-1">
                    {step.number}
                  </span>

                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-brand-primary shrink-0" />
                    <h3 className="font-heading text-lg sm:text-xl text-brand-primary">
                      {step.title}
                    </h3>
                  </div>

                  <p className="col-start-2 sm:col-start-3 text-sm leading-7 text-text-secondary sm:pl-0 pl-0">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-10 lg:gap-20">
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-semantic-warning font-semibold">
                03 / Limites da plataforma
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl text-brand-primary mt-5 leading-tight">
                O que a Lance
                <br />
                não é
              </h2>
              <p className="mt-5 text-sm leading-6 text-text-secondary max-w-sm">
                Transparência também significa deixar claro o que o sistema não
                oferece.
              </p>
            </div>

            <div className="border-t border-semantic-warning/50">
              {[
                "Não é sistema de pagamentos: o saldo e a liquidação são simulados.",
                "Não emite nota fiscal, escritura ou garantia de entrega.",
                "Não permite revenda entre usuários nem saque do saldo.",
                "A trilha de auditoria prova integridade local, não autenticidade material do objeto.",
              ].map((item, index) => (
                <div
                  key={item}
                  className="grid grid-cols-[2rem_1fr] gap-4 py-5 border-b border-border-subtle"
                >
                  <span className="font-mono text-xs text-semantic-warning pt-1">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-7 text-text-primary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <nav className="border-t border-brand-primary py-8 sm:py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <p className="font-heading text-lg text-brand-primary">
            Consulte os documentos da plataforma.
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <button
              onClick={() => navigateTo("/regras")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary hover:text-text-secondary transition-colors cursor-pointer"
            >
              Regras gerais do pregão
              <ArrowRight className="w-3.5 h-3.5 text-accent-gold" />
            </button>

            <button
              onClick={() => navigateTo("/politica-reservas")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary hover:text-text-secondary transition-colors cursor-pointer"
            >
              Política de reservas
              <ArrowRight className="w-3.5 h-3.5 text-accent-gold" />
            </button>

            <button
              onClick={() => navigateTo("/termo-leiloeiro")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-brand-primary hover:text-text-secondary transition-colors cursor-pointer"
            >
              Termo do leiloeiro
              <ArrowRight className="w-3.5 h-3.5 text-accent-gold" />
            </button>
          </div>
        </nav>
      </div>
    </main>
  );
};
