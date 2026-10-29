import React from "react";
import { useApp } from "../context/AppContext";
import { ShieldCheck, ArrowLeft, Gavel, Wallet, FileText } from "lucide-react";

/**
 * PÃ¡ginas institucionais de regras.
 *
 * ConteÃºdo derivado do documento de arquitetura (seÃ§Ãµes 19 a 26) e do
 * comportamento real da API â€” nÃ£o Ã© texto de marketing: cada regra listada
 * corresponde a algo implementado no backend.
 */

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ title, children, icon }) => (
  <section className="bg-white rounded-2xl border border-border-subtle p-6 sm:p-8 space-y-3 shadow-2xs">
    <h2 className="font-heading font-bold text-lg text-brand-primary flex items-center gap-2">
      {icon}
      {title}
    </h2>
    <div className="text-xs text-text-primary leading-relaxed space-y-2.5">
      {children}
    </div>
  </section>
);

const RuleList: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="space-y-2">
    {items.map((item, index) => (
      <li key={index} className="flex gap-2">
        <span className="text-accent-gold shrink-0 mt-0.5">â€”</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const PageShell: React.FC<{
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}> = ({ eyebrow, title, intro, children }) => {
  const { navigateTo } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigateTo("/")}
        className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand-primary cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar para a vitrine
      </button>

      <header className="bg-brand-deep text-surface-base rounded-2xl p-7 sm:p-9 space-y-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-brand-primary text-accent-gold border border-accent-gold/30">
          <ShieldCheck className="w-3 h-3" />
          {eyebrow}
        </span>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl">{title}</h1>
        <p className="text-xs sm:text-sm text-surface-base/75 leading-relaxed max-w-2xl">
          {intro}
        </p>
      </header>

      {children}

      <p className="text-[10px] text-text-secondary leading-relaxed pt-2">
        Documento informativo da versÃ£o de demonstraÃ§Ã£o. A plataforma opera com
        saldo e liquidaÃ§Ã£o simulados: nÃ£o hÃ¡ pagamento real, nota fiscal,
        revenda entre usuÃ¡rios ou garantia de entrega.
      </p>
    </div>
  );
};

export const RulesPage: React.FC = () => (
  <PageShell
    eyebrow="Regras do pregÃ£o"
    title="Regras Gerais"
    intro="Como um lote nasce, entra ao vivo, recebe lances e Ã© encerrado. As regras abaixo sÃ£o aplicadas pelo servidor â€” a interface apenas reflete o estado oficial."
  >
    <Section title="Ciclo de vida do lote" icon={<Gavel className="w-4 h-4" />}>
      <RuleList
        items={[
          <>
            <strong>Agendado</strong> â€” criado, ainda nÃ£o iniciado. NÃ£o aceita
            lances.
          </>,
          <>
            <strong>Ao vivo</strong> â€” dentro da janela de disputa. Ã‰ o Ãºnico
            estado que aceita lances.
          </>,
          <>
            <strong>Encerrado</strong> â€” janela fechada. A liquidaÃ§Ã£o Ã©
            processada automaticamente.
          </>,
          <>
            <strong>Cancelado</strong> â€” oculto da vitrine; o histÃ³rico de
            auditoria permanece pÃºblico.
          </>,
        ]}
      />
      <p>
        O estado e o horÃ¡rio de encerramento sÃ£o avaliados no servidor. O
        contador da tela Ã© apenas informativo: nenhum cliente decide o
        encerramento.
      </p>
    </Section>

    <Section title="Regras de lance">
      <RuleList
        items={[
          "O primeiro lance deve ser maior ou igual ao preÃ§o inicial.",
          "Os lances seguintes devem ser maiores ou iguais ao preÃ§o atual mais o incremento mÃ­nimo do lote.",
          "O licitante que lidera nÃ£o pode cobrir o prÃ³prio lance.",
          "Lotes fora da janela de disputa recusam lances, com motivo especÃ­fico na resposta.",
          "Valores sÃ£o tratados em centavos inteiros â€” nunca em ponto flutuante.",
        ]}
      />
      <p>
        Cada recusa retorna um cÃ³digo estÃ¡vel e uma mensagem em portuguÃªs com o
        valor em reais: <em>abaixo do mÃ­nimo</em>, <em>saldo insuficiente</em>,{" "}
        <em>vocÃª jÃ¡ estÃ¡ liderando</em>, <em>lote ainda nÃ£o iniciado</em> ou{" "}
        <em>lote encerrado</em>.
      </p>
    </Section>

    <Section title="Anti-sniping">
      <p>
        Um lance vÃ¡lido aceito nos <strong>Ãºltimos 2 minutos</strong> estende o
        encerramento do lote para <strong>2 minutos apÃ³s o lance</strong>. A
        checagem e a extensÃ£o acontecem dentro da mesma transaÃ§Ã£o que confirma o
        lance, usando o horÃ¡rio do servidor. A extensÃ£o nunca encurta o prazo
        nem reabre um lote jÃ¡ encerrado.
      </p>
    </Section>

    <Section title="ConcorrÃªncia e idempotÃªncia">
      <RuleList
        items={[
          "Todos os lances de um mesmo lote sÃ£o serializados por bloqueio no registro do lote, em transaÃ§Ã£o Serializable.",
          "Um lance pode ser recusado se outro licitante confirmar primeiro â€” nesse caso o valor mÃ­nimo Ã© recalculado.",
          "Toda requisiÃ§Ã£o de lance exige uma chave de idempotÃªncia: repetir a mesma solicitaÃ§Ã£o devolve o mesmo resultado, sem duplicar reserva ou lance.",
          "DepÃ³sitos seguem a mesma regra: a chave de idempotÃªncia impede crÃ©dito duplicado.",
        ]}
      />
    </Section>

    <Section title="Encerramento e liquidaÃ§Ã£o">
      <RuleList
        items={[
          "Ao encerrar com vencedor: o valor Ã© debitado do vencedor, creditado ao leiloeiro e um comprovante Ã© emitido â€” tudo atomicamente.",
          "Ao encerrar sem lances: o lote fecha sem vencedor e sem qualquer movimentaÃ§Ã£o financeira.",
          "A liquidaÃ§Ã£o Ã© idempotente: reprocessar nÃ£o duplica dÃ©bito, crÃ©dito ou comprovante.",
          "Se a liquidaÃ§Ã£o falhar, o lote fica marcado com falha e o caso Ã© registrado na trilha de auditoria.",
        ]}
      />
    </Section>

    <Section title="Cancelamento">
      <RuleList
        items={[
          "SÃ³ o leiloeiro responsÃ¡vel pode cancelar, e apenas antes do encerramento.",
          "A justificativa Ã© obrigatÃ³ria.",
          "Todas as reservas ativas sÃ£o liberadas e os licitantes sÃ£o notificados.",
          "Lote cancelado nÃ£o Ã© liquidado e nÃ£o aparece na vitrine comum.",
        ]}
      />
    </Section>

    <Section title="Auditoria e privacidade">
      <RuleList
        items={[
          "Cada evento relevante Ã© gravado em uma cadeia de hashes SHA-256, na mesma transaÃ§Ã£o da operaÃ§Ã£o de negÃ³cio.",
          "Qualquer pessoa, sem login, pode verificar a integridade em /auditoria.",
          "AlteraÃ§Ã£o, remoÃ§Ã£o ou inserÃ§Ã£o direta no banco Ã© detectada pela verificaÃ§Ã£o.",
          "Licitantes aparecem apenas por pseudÃ´nimo estÃ¡vel; nome, e-mail e identificadores internos nunca sÃ£o expostos.",
        ]}
      />
      <p className="text-[11px] text-text-secondary">
        Limite declarado: a cadeia nÃ£o Ã© assinada nem ancorada externamente,
        portanto detecta alteraÃ§Ã£o local, mas nÃ£o impede que alguÃ©m com acesso
        total ao banco reescreva toda a cadeia.
      </p>
    </Section>
  </PageShell>
);

export const SellerTermsPage: React.FC = () => (
  <PageShell
    eyebrow="Termo do leiloeiro"
    title="Termo de Responsabilidade do Leiloeiro"
    intro="Para criar ou administrar lotes, o leiloeiro precisa aceitar este termo. O aceite Ã© registrado de forma imutÃ¡vel, com versÃ£o e hash do conteÃºdo."
  >
    <Section
      title="1. Escopo da atuaÃ§Ã£o"
      icon={<FileText className="w-4 h-4" />}
    >
      <p>
        O leiloeiro declara possuir autorizaÃ§Ã£o para ofertar os itens que
        cadastrar, respondendo pela procedÃªncia, pela descriÃ§Ã£o e pelas imagens
        publicadas em cada lote.
      </p>
      <p>
        O papel <strong>LEILOEIRO</strong> Ã© exclusivo: a mesma conta nÃ£o pode
        dar lances em nenhum lote, incluindo os prÃ³prios.
      </p>
    </Section>

    <Section title="2. ProcedÃªncia e direitos de uso">
      <p>
        Itens importados de acervos pÃºblicos (The Met, Art Institute of Chicago,
        MusicBrainz) mantÃªm a atribuiÃ§Ã£o e a origem registradas no snapshot do
        lote. Acessibilidade tÃ©cnica da imagem nÃ£o equivale a licenÃ§a de uso
        comercial: a verificaÃ§Ã£o de direitos Ã© responsabilidade do leiloeiro
        antes de publicar.
      </p>
      <p>
        O snapshot publicado Ã© imutÃ¡vel: alteraÃ§Ãµes na fonte externa nÃ£o
        modificam o lote jÃ¡ criado.
      </p>
    </Section>

    <Section title="3. ConduÃ§Ã£o do pregÃ£o">
      <RuleList
        items={[
          "Os campos do lote ficam congelados quando ele entra ao vivo, exceto o horÃ¡rio de encerramento, que pode ser estendido pela regra anti-sniping.",
          "O cancelamento exige justificativa e sÃ³ Ã© permitido antes do encerramento.",
          "O leiloeiro recebe o crÃ©dito do arremate na liquidaÃ§Ã£o simulada; nÃ£o hÃ¡ repasse financeiro real nesta versÃ£o.",
        ]}
      />
    </Section>

    <Section title="4. Registro do aceite">
      <p>
        O aceite grava usuÃ¡rio, versÃ£o do termo, hash do conteÃºdo e horÃ¡rio. O
        registro Ã© imutÃ¡vel e uma restriÃ§Ã£o Ãºnica por usuÃ¡rio e versÃ£o impede
        duplicaÃ§Ã£o. Trata-se de evidÃªncia tÃ©cnica dentro da aplicaÃ§Ã£o â€” nÃ£o de
        assinatura digital certificada.
      </p>
    </Section>
  </PageShell>
);

export const ReservationPolicyPage: React.FC = () => (
  <PageShell
    eyebrow="Carteira e reservas"
    title="PolÃ­tica de Reservas e Carteira"
    intro="Como o saldo simulado Ã© comprometido, liberado e consumido ao longo de um pregÃ£o."
  >
    <Section
      title="TrÃªs saldos, uma regra"
      icon={<Wallet className="w-4 h-4" />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border-subtle bg-[#FAF7F2] p-3">
          <span className="text-[10px] text-text-secondary block">Saldo total</span>
          <span className="text-[11px]">Tudo o que jÃ¡ foi depositado.</span>
        </div>
        <div className="rounded-xl border border-semantic-warning/30 bg-semantic-warning-bg/40 p-3">
          <span className="text-[10px] text-semantic-warning block">Comprometido</span>
          <span className="text-[11px]">
            Soma das reservas ativas dos seus lances lÃ­deres.
          </span>
        </div>
        <div className="rounded-xl border border-semantic-success/30 bg-semantic-success-bg p-3">
          <span className="text-[10px] text-semantic-success block">DisponÃ­vel</span>
          <span className="text-[11px]">
            Total menos comprometido. Ã‰ o que pode sustentar um novo lance.
          </span>
        </div>
      </div>
      <p className="font-semibold text-brand-primary">
        DisponÃ­vel = Total âˆ’ Comprometido. O lance sÃ³ Ã© aceito se couber no
        disponÃ­vel.
      </p>
    </Section>

    <Section title="Como a reserva funciona">
      <RuleList
        items={[
          "O licitante precisa cobrir o valor integral do novo lance, nÃ£o apenas a diferenÃ§a em relaÃ§Ã£o ao anterior.",
          "Ao liderar, o valor do lance fica reservado.",
          "Ao ser superado, a reserva Ã© liberada imediatamente e volta ao disponÃ­vel.",
          "Existe no mÃ¡ximo uma reserva ativa por lote â€” garantido por Ã­ndice Ãºnico parcial no banco.",
          "A troca de reserva (liberar a anterior e criar a nova) acontece na mesma transaÃ§Ã£o do lance.",
        ]}
      />
    </Section>

    <Section title="DepÃ³sitos">
      <RuleList
        items={[
          "DepÃ³sitos sÃ£o simulados: crÃ©dito imediato em saldo fictÃ­cio, sem movimentaÃ§Ã£o bancÃ¡ria.",
          "Cada depÃ³sito exige chave de idempotÃªncia; repetir a solicitaÃ§Ã£o nÃ£o duplica o crÃ©dito.",
          "Todo depÃ³sito entra na trilha de auditoria e no extrato da carteira.",
          "NÃ£o hÃ¡ saque nem pagamento real nesta versÃ£o.",
        ]}
      />
    </Section>

    <Section title="LiquidaÃ§Ã£o e consumo da reserva">
      <RuleList
        items={[
          "Ao encerrar com vencedor, o valor reservado Ã© consumido: debitado do vencedor e creditado ao leiloeiro.",
          "Lotes encerrados sem lances nÃ£o movimentam saldo algum.",
          "Se um lote for cancelado, todas as reservas ativas sÃ£o devolvidas aos licitantes.",
          "O dÃ©bito e o crÃ©dito usam chaves de idempotÃªncia: reprocessar a liquidaÃ§Ã£o nÃ£o movimenta o saldo duas vezes.",
        ]}
      />
    </Section>
  </PageShell>
);

