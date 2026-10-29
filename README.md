# Lance — Casa de Leilões

Plataforma de leilões online: leiloeiros criam lotes a partir de itens de APIs
públicas de museus, licitantes disputam em tempo real com saldo simulado e
qualquer pessoa pode auditar o histórico sem login.

> **Escopo:** liquidação **simulada**. Não há pagamento real, nota fiscal,
> revenda entre usuários nem garantia de entrega.

---

## Stack

| Camada    | Tecnologia                                    |
| --------- | --------------------------------------------- |
| Front-end | React 19 + Vite + TypeScript + Tailwind CSS 4 |
| Back-end  | NestJS 10 + TypeScript                        |
| Banco     | PostgreSQL 16 + Prisma 7                      |
| Realtime  | Socket.IO (autenticado por JWT)               |
| Testes    | Jest + Supertest (API), Vitest (web)          |
| Infra     | Docker Compose (Postgres + API + Web)         |

Monorepo com npm workspaces: `apps/api`, `apps/web`.

---

## Subir do zero (passo a passo)

### 1. Pré-requisitos

- Node.js 20+
- Docker (para o PostgreSQL)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edite `apps/api/.env` e gere um `JWT_SECRET` real:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Subir o PostgreSQL

```bash
docker compose up -d postgres
```

### 5. Migrar e semear o banco

```bash
npm run db:generate --workspace @lance/api
npm run db:migrate  --workspace @lance/api
npm run db:seed     --workspace @lance/api
```

O seed cria o cenário completo de demonstração (ver abaixo). Ele é
**idempotente**: pode rodar várias vezes sem duplicar dados.

### 6. Rodar as aplicações

```bash
npm run dev:api   # API em http://localhost:4000
npm run dev:web   # Web em http://localhost:5173
```

### Alternativa: tudo em Docker

```bash
docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:4000
- Healthcheck: http://localhost:4000/health

---

## Contas de demonstração

Criadas pelo `db:seed`. A senha é o valor de `SEED_DEMO_PASSWORD` no
`apps/api/.env` (padrão de exemplo: `senhaDemoForte2026`).

| Papel       | E-mail                        | Estado inicial                            |
| ----------- | ----------------------------- | ----------------------------------------- |
| Leiloeira   | `leiloeiro.demo@lance.local`  | Termo do leiloeiro já aceito              |
| Licitante A | `licitante.demo@lance.local`  | R$ 5.000,00 disponíveis                   |
| Licitante B | `licitante2.demo@lance.local` | R$ 5.000,00, R$ 110,00 reservados (líder) |

**Cenário semeado:**

- 1 lote **ao vivo** com 2 lances (A abriu com R$ 100,00, B cobriu com R$ 110,00)
- 1 lote **agendado** para daqui a 2 horas
- 2 itens de catálogo fictícios, com origem declarada

> Nunca reutilize essas credenciais em produção.

---

## Como percorrer o fluxo

1. **Vitrine** (`/`) — lotes ao vivo, agendados e encerrados. Cancelados não aparecem.
2. **Sala do lote** (`/lotes/:id`) — preço atual, histórico com pseudônimos,
   countdown, "você está liderando" / "você foi superado", atualização via Socket.IO.
3. **Login** (`/entrar`) — licitante entra e vai para `/conta`.
4. **Carteira** (`/conta/carteira`) — saldo total, comprometido, disponível e depósito simulado.
5. **Lance** — botão na sala do lote; o valor mínimo é calculado pelo servidor.
6. **Painel do leiloeiro** (`/leiloeiro`) — criar lote pelo assistente
   (`/leiloeiro/lotes/novo`), publicar, cancelar e ver resultados.
7. **Auditoria** (`/auditoria`) — pública, mostra a cadeia de hashes e o
   resultado de `GET /audit/verify` recalculado pela API.
8. **Comprovante** (`/comprovante/:codigo`) — público, acessível pelo link
   compartilhado do arremate.

---

## Regras de negócio implementadas

| Regra                                                                    | Onde                                  |
| ------------------------------------------------------------------------ | ------------------------------------- |
| Lotes `SCHEDULED → LIVE → ENDED` e `CANCELED`                            | `lots.service.ts`, worker             |
| Primeiro lance ≥ preço inicial; seguintes ≥ atual + incremento           | `bids.service.ts`                     |
| O líder não pode cobrir o próprio lance                                  | `bids.service.ts` (`ALREADY_LEADING`) |
| Saldo disponível = total − reservado; lance exige o valor integral       | `bids.service.ts`                     |
| Reserva anterior liberada e nova criada na mesma transação               | `bids.service.ts`                     |
| Anti-sniping: lance nos últimos 2 min estende o fim em +2 min            | `bids.service.ts`                     |
| Liquidação: débito do vencedor + crédito do leiloeiro + recibo           | `settlements.service.ts`              |
| Lote sem lances encerra sem vencedor e sem movimentação                  | `settlements.service.ts`              |
| Cancelamento libera reservas e impede liquidação posterior               | `lots.service.ts`                     |
| Papéis exclusivos: leiloeiro não dá lance, licitante não administra lote | guards + serviços                     |

### Mensagens de recusa

Cada lance recusado devolve um `code` estável e uma mensagem em português com
valores em Real (`R$ 105,00`), nunca em centavos:

`INVALID_AMOUNT`, `LOT_NOT_FOUND`, `AUCTION_NOT_STARTED`, `AUCTION_ENDED`,
`AUCTION_NOT_LIVE`, `INVALID_ROLE`, `SELLER_CANNOT_BID`, `ALREADY_LEADING`,
`BELOW_MINIMUM`, `INSUFFICIENT_FUNDS`, `RESERVATION_INCONSISTENT`,
`CONCURRENCY_CONFLICT`, `IDEMPOTENCY_KEY_REUSED`, `IDEMPOTENCY_PENDING`.

---

## Concorrência e integridade financeira

- Transação `Serializable` com `SELECT ... FOR UPDATE` no lote, serializando
  todos os lances do mesmo lote.
- Retry automático em conflito de serialização (até 3 tentativas).
- Índice único **parcial** no banco impedindo duas reservas `ACTIVE` por lote.
- Débitos/créditos usam `updateMany` condicional: o saldo nunca fica negativo.
- `WalletTransaction.idempotencyKey` único impede depósito ou liquidação duplicados.
- `BidRequest (bidderId, idempotencyKey)` + hash da requisição garante
  idempotência do lance, inclusive em requisições simultâneas.

---

## Auditoria à prova de adulteração

**Técnica:** cadeia de hashes SHA-256 encadeados (`previousHash` → `eventHash`).

- Cada evento relevante grava `sequence`, `eventType`, `entityType`, `entityId`,
  `payload`, `previousHash`, `eventHash` e `createdAt`.
- O hash é calculado sobre uma **representação canônica versionada**:
  chaves ordenadas alfabeticamente, objetos aninhados normalizados e a versão
  da canonicalização incluída no material (`src/audit/audit-chain.ts`).
- A escrita acontece na **mesma transação** da operação de negócio, com lock em
  `AuditChainState` (`SELECT ... FOR UPDATE`), o que impede bifurcações.
- `GET /audit/verify` recalcula a cadeia inteira e confere:
  1. continuidade do encadeamento;
  2. hash recalculado de cada evento;
  3. correspondência com a cabeça da cadeia.

**Eventos gravados:** `LOT_CREATED`, `LOT_LIVE`, `BID_PLACED`, `LOT_CANCELED`,
`AUCTION_ENDED`, `AUCTION_WON`, `AUCTION_ENDED_NO_BIDS`, `SETTLEMENT_COMPLETED`,
`SETTLEMENT_FAILED`, `WALLET_DEPOSITED`.

**Privacidade:** a auditoria pública nunca expõe nome, e-mail, telefone ou ID
interno. Licitantes aparecem como pseudônimo estável (`Licitante •••• 4A2F`).

### Limitações declaradas

- A cadeia **não é assinada** (Ed25519) nem ancorada externamente
  (OpenTimestamps). Isso está fora do escopo desta versão.
- Consequência: a cadeia detecta alteração, remoção ou inserção local no banco,
  mas **não impede** que alguém com acesso total ao banco reescreva todos os
  eventos e recalcule a cadeia inteira. Ancoragem externa resolveria esse
  limite e não está implementada.
- O relógio do servidor é a fonte de tempo; um relógio incorreto afeta a ordem
  dos eventos.

---

## API

Base: `http://localhost:4000`. Autenticação por `Authorization: Bearer <token>`.

### Autenticação

| Método | Rota             | Descrição                               |
| ------ | ---------------- | --------------------------------------- |
| POST   | `/auth/register` | Cria conta (`LEILOEIRO` ou `LICITANTE`) |
| POST   | `/auth/login`    | Retorna access + refresh token          |
| POST   | `/auth/refresh`  | Rotaciona o refresh token               |
| POST   | `/auth/logout`   | Revoga a sessão                         |
| GET    | `/auth/me`       | Usuário autenticado                     |

### Catálogo

| Método | Rota                                  | Descrição                                       |
| ------ | ------------------------------------- | ----------------------------------------------- |
| GET    | `/catalog/search?q=`                  | Busca nas APIs externas (Met, AIC, MusicBrainz) |
| POST   | `/catalog/:source/:externalId/import` | Importa item (LEILOEIRO)                        |

### Lotes

| Método | Rota                | Descrição                                  |
| ------ | ------------------- | ------------------------------------------ |
| GET    | `/lots`             | Lista (cancelados ocultos)                 |
| GET    | `/lots/:id`         | Detalhe público + histórico pseudonimizado |
| GET    | `/seller/lots`      | Lotes do leiloeiro (LEILOEIRO)             |
| POST   | `/lots`             | Cria lote (LEILOEIRO, exige termo aceito)  |
| PATCH  | `/lots/:id`         | Edita lote `SCHEDULED` (LEILOEIRO)         |
| POST   | `/lots/:id/publish` | Publica o lote ao vivo (LEILOEIRO)         |
| POST   | `/lots/:id/cancel`  | Cancela com justificativa (LEILOEIRO)      |

### Lances

| Método | Rota                | Descrição                                     |
| ------ | ------------------- | --------------------------------------------- |
| POST   | `/lots/:lotId/bids` | Dá lance. Exige `Idempotency-Key` (LICITANTE) |

### Carteira

| Método | Rota                   | Descrição                                  |
| ------ | ---------------------- | ------------------------------------------ |
| GET    | `/wallet`              | Saldo total, reservado e disponível        |
| GET    | `/wallet/transactions` | Extrato                                    |
| POST   | `/wallet/deposits`     | Depósito simulado. Exige `Idempotency-Key` |

### Minha conta

| Método | Rota                     | Descrição                      |
| ------ | ------------------------ | ------------------------------ |
| GET    | `/me/bids`               | Meus lances                    |
| GET    | `/me/wins`               | Meus arremates com comprovante |
| GET    | `/me/notifications`      | Notificações + não lidas       |
| PATCH  | `/me/notifications/read` | Marca todas como lidas         |

### Auditoria, recibos e saúde

| Método | Rota                          | Descrição                       |
| ------ | ----------------------------- | ------------------------------- |
| GET    | `/audit`                      | Histórico global pseudonimizado |
| GET    | `/audit/lots/:lotId`          | Histórico do lote               |
| GET    | `/audit/verify`               | Verifica a cadeia inteira       |
| GET    | `/receipts/:verificationCode` | Comprovante público             |
| GET    | `/health`                     | Healthcheck (API + banco)       |

### Termo do leiloeiro

| Método | Rota                        | Descrição                  |
| ------ | --------------------------- | -------------------------- |
| GET    | `/seller-agreement/current` | Termo aceito (LEILOEIRO)   |
| POST   | `/seller-agreement/accept`  | Aceita o termo (LEILOEIRO) |

---

## Testes

```bash
# API — unitários
npm test --workspace @lance/api

# API — integração + e2e (usa o banco lance_test, nunca o de dev)
npm run test:e2e --workspace @lance/api

# Web — regras de negócio
npm test --workspace @lance/web
```

Os testes de integração exigem `localhost:5432/lance_test`. O setup
(`test/jest-e2e.setup.ts`) valida a URL e troca o banco automaticamente; se a
URL não for a esperada, a suíte **aborta** em vez de rodar contra o banco de
desenvolvimento.

Cenários cobertos em `test/flow.integration.e2e-spec.ts`:

- liquidação com vencedor (débito + crédito + recibo)
- liquidação sem lances (sem vencedor, sem movimentação)
- liquidação repetida (idempotência de saldo e recibo)
- retomada de settlement preso em `PROCESSING`
- settlement marcado como `FAILED` quando o estado está inconsistente
- cancelamento com reserva ativa (estorno)
- concorrência entre licitantes distintos
- líder não cobre o próprio lance
- **adulteração direta no banco detectada** por `/audit/verify`
- **remoção de evento** detectada por `/audit/verify`

---

## Estrutura

```
apps/
  api/
    prisma/            schema, migrations, seed
    src/
      audit/           cadeia de hashes + verificacao
      auth/            registro, login, refresh rotativo, guards
      bids/            transacao de lance, recusas de dominio
      catalog/         adaptadores (Met, AIC, MusicBrainz, CAA)
      lots/            ciclo de vida do lote
      me/              lances, arremates, notificacoes
      outbox/          publicacao pos-commit
      realtime/        gateway Socket.IO autenticado
      receipts/        comprovantes
      seller-agreements/ termo do leiloeiro
      settlements/     liquidacao + worker de reconciliacao
      wallet/          carteira e ledger
    test/              integracao e2e
  web/
    src/
      components/      layout e dominio
      context/         AppContext (sessao, API, realtime)
      logic/           regras puras + testes
      pages/           telas
      services/        cliente HTTP com refresh automatico
```

---

## Limitações conhecidas

| Limitação                       | Consequência                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| Liquidação simulada             | Nenhum valor real é movimentado; sem nota fiscal                                           |
| Sem Ed25519 / ancoragem externa | Cadeia detecta adulteração local, não reescrita total                                      |
| Sem notificações por e-mail     | Avisos apenas dentro da plataforma (sino)                                                  |
| Worker roda dentro da API       | Em hospedagem que suspende o processo, a liquidação atrasa até a próxima execução          |
| Sem lock distribuído no worker  | Duas instâncias podem reconciliar ao mesmo tempo; o efeito financeiro continua idempotente |
| Sem OpenTelemetry/métricas      | Diagnóstico por logs da aplicação e `/health`                                              |
| Filtro de categoria do catálogo | Depende do campo `category` do item importado, hoje frequentemente vazio                   |

---

## Scripts

| Comando                                      | O que faz                            |
| -------------------------------------------- | ------------------------------------ |
| `npm run dev:api`                            | API em modo watch                    |
| `npm run dev:web`                            | Vite dev server                      |
| `npm run db:generate --workspace @lance/api` | Gera o Prisma Client                 |
| `npm run db:migrate --workspace @lance/api`  | Aplica migrations (`migrate deploy`) |
| `npm run db:seed --workspace @lance/api`     | Semeia o cenário de demonstração     |
| `npm test --workspace @lance/api`            | Testes unitários da API              |
| `npm run test:e2e --workspace @lance/api`    | Integração/e2e da API                |
| `npm test --workspace @lance/web`            | Testes das regras do front           |

---

## Deploy

### Backend (Render, Railway, Fly.io…)

1. Build: `npm ci && npm run db:generate --workspace @lance/api && npm run build --workspace @lance/api`
2. Start: `npx prisma migrate deploy --schema prisma/schema.prisma && node dist/src/main.js`
3. Variáveis: `DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `SEED_DEMO_PASSWORD`

### Frontend (Vercel, Netlify…)

1. Build: `npm ci && npm run build --workspace @lance/web`
2. Publish directory: `apps/web/dist`
3. Variável: `VITE_API_URL` apontando para a API publicada

### Docker

```bash
docker compose up --build
```

---

## Uso de IA

Este projeto foi construído com apoio de assistência de IA para geração de
código, revisão e auditoria. Todo o código foi revisado e validado por build,
testes unitários e testes de integração contra PostgreSQL real antes de ser
considerado concluído.
