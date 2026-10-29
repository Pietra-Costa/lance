 <div align="center">
  
<img width="100%" height="724" alt="Banner luxuoso da Lance Casa de Leilões" src="https://github.com/user-attachments/assets/abf903b4-ee01-4665-ba1b-afcdf8ab3f05" />

# LANCE

### Casa de Leilões · Plataforma SaaS em tempo real

**Pregões ao vivo. Segurança transacional. Auditoria criptográfica.**



[**Acessar plataforma ↗**](https://lance-leiloes.vercel.app/) · [API](https://lance-api-rfiz.onrender.com) · [Healthcheck](https://lance-api-rfiz.onrender.com/health)

</div>

---

> **Aviso de escopo:** esta plataforma utiliza liquidação financeira simulada para demonstração e homologação. Não realiza cobranças bancárias reais nem remessas físicas.

## Sobre o projeto

O **Lance** é uma plataforma SaaS para gestão, catalogação e realização de leilões online. Combina a elegância de uma casa de leilões tradicional com uma arquitetura moderna para processamento de lances em tempo real, gestão de saldos, governança e rastreabilidade criptográfica.

O sistema contempla fluxos transacionais, concorrência controlada, comunicação em tempo real e mecanismos de verificação da integridade dos eventos registrados.


<img width="1920" height="1440" alt="427shots_so" src="https://github.com/user-attachments/assets/27c60381-d177-4eba-b58d-07b440f61c62" />


</div>

## Ambientes em produção

| Serviço               | Tecnologia               | Endereço                                                    |
| --------------------- | ------------------------ | ----------------------------------------------------------- |
| Aplicação web         | React · Vite · Vercel    | [Abrir aplicação](https://lance-leiloes.vercel.app/)        |
| API REST e WebSockets | NestJS · Render          | [Abrir API](https://lance-api-rfiz.onrender.com)            |
| Healthcheck           | Render                   | [Verificar API](https://lance-api-rfiz.onrender.com/health) |
| Banco de dados        | PostgreSQL 16 · Supabase | PostgreSQL gerenciado                                       |

## Diferenciais da plataforma

- **Pregão em tempo real:** sincronização de lances, liderança e cronômetros por WebSockets.
- **Integridade criptográfica:** cadeia de eventos baseada em hashes SHA-256, com mecanismo de verificação.
- **Gestão financeira simulada:** reservas de saldo, liberação de valores e registro de movimentações.
- **Curadoria cultural:** integração com catálogos públicos de instituições culturais.
- **Governança:** separação de permissões, termos digitais e registros de operações relevantes.
- **Comprovantes verificáveis:** consulta pública de comprovantes de arremate.
- **Design responsivo:** interface adaptada para diferentes tamanhos de tela.

<img width="1920" height="1440" alt="236shots_so" src="https://github.com/user-attachments/assets/f85c4751-6988-4833-bb21-b4cd1ab68e59" />

## Funcionalidades

### 1. Sala de pregão ao vivo

- Sincronização de lances, liderança e contagem regressiva com Socket.IO.
- Extensão automática do pregão quando um lance é enviado nos dois minutos finais.
- Validação no backend do incremento mínimo permitido.
- Notificações de liderança e de lance superado.
- Liberação da reserva quando outro participante supera o lance.
- Proteção contra lances desnecessários do próprio líder.

### 2. Curadoria e cadastro de lotes

- Busca e importação de itens de acervos públicos e de bases musicais.
- Fluxo guiado para seleção, procedência, condições do lote, detalhes do item e prévia.
- Registro dos metadados e das referências das imagens no momento da publicação.
- Completável pelo leiloeiro quando a fonte externa não traz material, dimensões, período ou condições da imagem.

#### Fontes de catálogo

| Fonte                     | API utilizada                                     | O que fornece                                        | Observações                                                       |
| ------------------------- | ------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| The Metropolitan Museum   | `collectionapi.metmuseum.org/public/collection/v1` | Objetos, autor, data, técnica, dimensões, imagem     | `hasImages=true`; aceita `q=*` para varrer o acervo com imagem    |
| Art Institute of Chicago  | `api.artic.edu/api/v1`                            | Obras, artista, data, técnica, imagem IIIF           | Só itens com imagem pública                                       |
| MusicBrainz               | `musicbrainz.org/ws/2` (release-groups)            | Álbuns, artista, data do primeiro lançamento, tipo    | `User-Agent` identificando a aplicação e ~1 req/s (política deles) |
| Cover Art Archive         | `coverartarchive.org`                             | Capa frontal do release group                         | Complementa o MusicBrainz; 404 significa "sem capa" e não é erro  |

As fontes são independentes: se uma cair ou estourar o tempo de resposta, ela entra em `failedSources` e as demais continuam respondendo. Cada item devolvido carrega a sua fonte, e a busca é paginada (`offset`/`limit`, máximo 40 por página). O MusicBrainz e o Cover Art Archive são a base da categoria **Discos e edições musicais**.

### 3. Carteira digital e ledger

- Consulta de saldo total, reservado e disponível.
- Reserva de saldo associada a lances líderes.
- Liberação de reservas quando um lance é superado.
- Depósitos simulados para demonstração.
- Extrato de transações e movimentações financeiras.

### 4. Auditoria criptográfica

- Encadeamento de eventos com SHA-256 e referência ao hash anterior.
- Verificação da cadeia para identificar possíveis alterações ou exclusões.
- Registro de ações críticas, como criação de lotes, lances e arremates.
- Histórico público com pseudônimos para reduzir a exposição de dados pessoais.

### 5. Comprovantes digitais

- Geração de comprovantes de arremate com código de verificação.
- Consulta pública por código, sem exigir login.
- Registro das informações relevantes para conferência posterior.

### 6. Gestão do leiloeiro

- Painel de lotes agendados, ao vivo, arrematados e cancelados.
- Termo digital de compromisso do leiloeiro.
- Registro de justificativas para cancelamentos.
- Tratamento das reservas de saldo associadas aos lotes cancelados.

### 7. Experiência e design system

- Interface responsiva para desktop, tablet e smartphone.
- Componentes visuais consistentes.
- Animações e notificações dentro da aplicação.
- Identidade visual inspirada em casas de leilões tradicionais.
- **Tema claro e escuro** com preferência persistida (`light` / `dark` / `system`).

### 8. Notificações

- Central de notificações no cabeçalho, com contador de não lidas.
- Eventos notificados: lance superado (`BID_OUTBID`), lote arrematado (`AUCTION_WON`) e lote cancelado (`LOT_CANCELED`).
- Marcação de leitura individual ou em lote, sempre restrita ao dono da notificação.
- A API é a fonte de verdade; o evento em tempo real apenas sinaliza que algo mudou.

### 9. Proteções de abuso

- Rate limit global de 120 requisições por minuto por IP.
- Limites mais restritos em rotas sensíveis: cadastro/login (10/min), renovação de sessão (30/min), criação de lance e busca no catálogo (60/min) e depósito (20/min).
- Cabeçalhos de segurança via `helmet` e corpo JSON limitado a 64 kB.
- Sessões de acesso curtas com refresh token rotativo e logout que revoga a sessão.
- Socket.IO recusa conexão sem token válido e valida o lote antes de entrar na sala.

## Capturas de tela

As imagens ficam em `docs/images/` (`lance-banner.png` e as capturas citadas na
visão geral). Se a pasta não existir no clone, os blocos de imagem do topo
aparecem quebrados — rode a aplicação e salve as capturas nesse caminho.

<img width="1920" height="1440" alt="856shots_so" src="https://github.com/user-attachments/assets/746112c9-c9d9-433b-a206-86735b49b7fb" />


## Identidade visual

A paleta combina verde profundo, dourado e tons de creme, com contraste editorial e aparência institucional.

| Cor                                                                                               | Código    | Aplicação                       |
| ------------------------------------------------------------------------------------------------- | --------- | ------------------------------- |
| <img src="https://singlecolorimage.com/get/123d2f/24x24" alt="Verde principal"> Verde principal   | `#123D2F` | Marca e elementos principais    |
| <img src="https://singlecolorimage.com/get/0a2b22/24x24" alt="Verde profundo"> Verde profundo     | `#0A2B22` | Contraste e superfícies escuras |
| <img src="https://singlecolorimage.com/get/c8a96a/24x24" alt="Dourado"> Dourado                   | `#C8A96A` | Destaques e acentos             |
| <img src="https://singlecolorimage.com/get/f5f1e7/24x24" alt="Creme"> Creme                       | `#F5F1E7` | Fundos e superfícies claras     |
| <img src="https://singlecolorimage.com/get/222923/24x24" alt="Texto principal"> Texto principal   | `#222923` | Conteúdo e títulos              |
| <img src="https://singlecolorimage.com/get/68716a/24x24" alt="Texto secundário"> Texto secundário | `#68716A` | Informações auxiliares          |

## Stack tecnológica

| Camada         | Tecnologia                       | Responsabilidade                   |
| -------------- | -------------------------------- | ---------------------------------- |
| Frontend       | React 19 · TypeScript · Vite     | Interface e experiência do usuário |
| Estilização    | Tailwind CSS 4 · Motion          | Layout, componentes e animações    |
| Backend        | NestJS 10 · TypeScript           | API e regras de negócio            |
| Banco de dados | PostgreSQL 16 · Prisma ORM       | Persistência e transações          |
| Tempo real     | Socket.IO · WebSockets           | Comunicação entre participantes    |
| Segurança      | Argon2id · JWT · SHA-256         | Senhas, sessões e integridade      |
| Abuso          | helmet · @nestjs/throttler       | Cabeçalhos e limites por rota      |
| Catálogo       | The Met · ArtIC · MusicBrainz    | Acervo externo e capas             |
| Infraestrutura | Docker Compose · Vercel · Render | Execução e implantação             |
| Testes         | Jest · Supertest · Vitest        | Testes automatizados               |

## Temas (claro e escuro)

A interface tem dois temas, escolhidos pelo usuário e persistidos em `localStorage` na chave `lance:theme` (`light`, `dark` ou `system`). O padrão é `system`, que segue `prefers-color-scheme`.

| Peça                    | Onde                                                          | Papel                                                                 |
| ----------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| Tokens de tema          | `apps/web/src/index.css` (`--app-*`)                          | Superfícies, texto, bordas e cores semânticas de cada tema            |
| Utilitários             | `apps/web/src/index.css` (`@theme`, `@custom-variant dark`)     | Ligam `bg-surface-card`, `text-primary` etc. aos tokens do tema ativo |
| Estado do tema          | `apps/web/src/theme/useTheme.ts`                              | `useSyncExternalStore` sobre storage + media query                    |
| Aplicação               | classe `.dark` no `<html>`                                    | Um único interruptor para toda a árvore                              |
| Sem flash                | script inline no `index.html`                                 | Aplica o tema antes do primeiro paint                                 |
| Botão                   | `components/layout/ThemeToggle.tsx`                           | Cabeçalho (desktop e mobile) e menu da conta                          |

**Regras de cor.** Cores de marca (`brand-primary`, `brand-deep`, `accent-gold`) são fixas nos dois temas. Texto de detalhe usa tokens que mudam de tema:

| Token                  | Uso                                                                       |
| ---------------------- | ------------------------------------------------------------------------- |
| `surface-base/card/muted/subtle` | Fundo da página, cards, áreas rebaixadas e blocos internos        |
| `text-primary/secondary`         | Texto de conteúdo e texto auxiliar                                |
| `border-subtle/strong`           | Divisores e bordas de controle                                    |
| `brand-interactive`              | Verde de destaque em texto, ícones e hover (clareia no tema escuro) |
| `brand-on-dark`                  | Creme fixo para texto sobre bloco verde escuro (hero, rodapé, modais) |
| `accent-gold-ink`                | Dourado escurecido para texto sobre superfície clara               |
| `border-invert`                  | Borda translúcida dentro de blocos invertidos                     |

Para código que não usa classe utilitária (canvas, SVG, Three.js) existe `readThemeColors()` em `theme/colors.ts`, que lê os mesmos tokens do CSS.

## Arquitetura do monorepo

```text
lance/
├── apps/
│   ├── api/
│   │   ├── prisma/            # Schema, migrations e seed
│   │   ├── src/
│   │   │   ├── audit/         # Auditoria criptográfica
│   │   │   ├── auth/          # Autenticação e autorização (JWT + refresh)
│   │   │   ├── bids/          # Processamento de lances e recusas
│   │   │   ├── catalog/       # Adapters The Met, ArtIC, MusicBrainz, CAA
│   │   │   ├── lots/          # Ciclo de vida dos lotes
│   │   │   ├── me/            # Dados do usuário e notificações
│   │   │   ├── outbox/        # Publicação de eventos
│   │   │   ├── realtime/      # Gateway Socket.IO
│   │   │   ├── receipts/      # Comprovantes digitais públicos
│   │   │   ├── seller-agreements/
│   │   │   ├── settlements/   # Liquidação e reconciliação
│   │   │   └── wallet/        # Carteira e ledger
│   │   └── test/              # E2E e integração (PostgreSQL real)
│   └── web/
│       └── src/
│           ├── components/    # Componentes e design system
│           ├── context/       # Sessão, carteira e estado realtime
│           ├── logic/         # Regras de negócio do frontend
│           ├── pages/         # Páginas da plataforma
│           ├── services/      # Cliente HTTP e refresh de token
│           └── theme/         # Tokens e preferência de tema
├── scripts/                   # Utilitários de diagnóstico e codemods
├── docker-compose.yml
└── package.json
```

### Por que um monorepo

O produto tem duas aplicações que evoluem **juntas**: a API define os contratos
(lote, lance, reserva, liquidação, auditoria) e o web consome exatamente esses
contratos. Um monorepo com npm workspaces resolve isso com custo próximo de
zero:

| Motivo                          | O que ganha                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Contrato único                  | Uma mudança de endpoint entra no mesmo commit/PR que o cliente e o teste — sem versionar pacote    |
| Ambiente único                  | Um `npm ci` na raiz, um `package-lock.json`, mesmas versões de TypeScript/ESLint/Vitest            |
| Scripts coordenados             | `dev:api` e `dev:web` na raiz; o CI roda os dois conjuntos de testes com um comando                |
| Docker e deploy juntos          | Um `docker-compose.yml` sobe Postgres + API + Web; migrations versionadas junto do código         |
| Refatoração segura              | Renomear um campo é uma busca única no repositório, não um upgrade coordenado entre repositórios   |

**Trade-off aceito:** npm workspaces faz *hoisting* de dependências, o que pode
mascarar uma dependência não declarada. A mitigação é usar sempre escopo
(`--workspace @lance/api`), como os scripts do projeto já fazem. Ferramentas
como Nx ou Turborepo só se pagam com mais aplicações e cache remoto — não é o
caso de duas apps.

## Executar com Docker

### Pré-requisitos

- Docker instalado e em execução.
- Docker Compose disponível.

### Iniciar a aplicação

Na raiz do repositório:

```bash
docker compose up --build
```

Para executar em segundo plano:

```bash
docker compose up -d --build
```

### Serviços locais

| Serviço     | Endereço                     |
| ----------- | ---------------------------- |
| Frontend    | http://localhost:8080        |
| API         | http://localhost:4000        |
| Healthcheck | http://localhost:4000/health |
| PostgreSQL  | `localhost:5432`             |

Para encerrar os serviços:

```bash
docker compose down
```

## Desenvolvimento local

### 1. Instalar dependências

Requer Node.js 20 ou superior.

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Gere uma chave JWT para o ambiente local:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Configure as variáveis necessárias nos arquivos de ambiente. Não envie credenciais ou segredos ao repositório.

### 3. Iniciar o banco de dados

```bash
docker compose up -d postgres
```

### 4. Gerar o cliente e executar as migrações

```bash
npm run db:generate --workspace @lance/api
npm run db:migrate --workspace @lance/api
```

### 5. Iniciar a API e o frontend

Execute em terminais separados:

**Terminal 1 — API**

```bash
npm run dev:api
```

**Terminal 2 — Frontend**

```bash
npm run dev:web
```

## Jornada de uso

1. **Cadastro:** acesse `/cadastro` e crie uma conta com perfil de licitante ou leiloeiro.
2. **Carteira:** como licitante, acesse `/conta/carteira` e utilize o depósito simulado.
3. **Participação:** navegue pelos lotes e envie lances nos pregões disponíveis.
4. **Gestão:** como leiloeiro, acesse `/leiloeiro` e crie lotes em `/leiloeiro/lotes/novo`.
5. **Auditoria:** consulte `/auditoria` para verificar a cadeia de eventos.
6. **Comprovantes:** acesse `/comprovante/:codigo` para consultar um comprovante pelo código.

## Regras de negócio

### Ciclo de vida do lote

```text
SCHEDULED ──(startsAt chegou / publish)──> LIVE ──(endsAt)──> ENDED ──> settlement
     │                                       │
     └──────────── cancel ───────────────────┴──> CANCELED
```

| Status          | Regra                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| `SCHEDULED`     | Lote criado com início no futuro; não aceita lance                                    |
| `LIVE`          | Aceita lances entre `startsAt` e `endsAt`; criado já `LIVE` se o início já passou      |
| `ENDED`         | Fora da janela; o worker liquida e grava o resultado                                  |
| `CANCELED`      | Oculta do catálogo por padrão; reservas ativas são estornadas e o motivo é registrado  |

### Anti-sniping (extensão de prazo)

Quando um lance é aceito e faltam **2 minutos ou menos** para o fim, o prazo do
lote passa a ser **instante do lance + 2 minutos**. A regra nunca encurta o
prazo, e cada novo lance dentro da janela renova os 2 minutos. O novo `endsAt`
vai no payload do evento de auditoria `BID_PLACED`, então a extensão é
verificável depois. Coberto por `apps/api/test/anti-sniping.integration.e2e-spec.ts`
(extensão, fora da janela, janela inteira com 10s restantes, renovação e auditoria).

### Recusa de lance

Toda recusa devolve `code` estável + mensagem em português com os valores já
formatados em Real:

| `code`              | Quando acontece                                         |
| ------------------- | ------------------------------------------------------- |
| `INVALID_AMOUNT`    | Valor não inteiro ou menor que 1 centavo                 |
| `BELOW_MINIMUM`     | Abaixo de `preço atual + incremento`                     |
| `ALREADY_LEADING`   | O líder tentando cobrir o próprio lance                  |
| `INSUFFICIENT_FUNDS`| Saldo disponível insuficiente                            |
| `LOT_NOT_LIVE`      | Lote ainda não iniciado ou já encerrado                  |
| `LOT_NOT_FOUND`     | Lote inexistente                                         |
| `IDEMPOTENCY_*`     | Chave repetida com outro conteúdo ou ainda sem resposta  |

### Reserva de saldo

```text
saldo total = disponível + reservado
```

Cada lance líder cria uma `BidReservation` `ACTIVE`. Quando outro licitante
supera o lance, a reserva anterior vira `RELEASED` e o valor volta ao
disponível; na liquidação, a reserva do vencedor vira `CONSUMED` e é
debitada. Existe índice único garantindo **uma reserva ativa por lote**.

### Liquidação

| Status       | Significado                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| `PENDING`    | Lote encerrado, aguardando processamento                                    |
| `PROCESSING` | Em andamento; se a API cair, o reconcile retoma (catch-up)                  |
| `COMPLETED`  | Débito do vencedor, crédito do leiloeiro e recibo emitido, na mesma transação |
| `FAILED`     | A transação principal foi revertida e a falha ficou registrada para análise  |

### Pseudônimos

Lances e trilha de auditoria pública nunca expõem nome ou e-mail: cada usuário
tem um pseudônimo estável derivado do seu id (`AuthService.publicPseudonym`),
que é o que aparece para os demais licitantes na sala e no histórico público.

## Engenharia transacional

| Mecanismo                   | Solução técnica                                  | Objetivo                                     |
| --------------------------- | ------------------------------------------------ | -------------------------------------------- |
| Concorrência de lances      | Transações serializáveis e `SELECT ... FOR UPDATE` | Reduzir condições de corrida               |
| Reserva de fundos           | Operações transacionais de reserva e liberação   | Preservar a consistência dos saldos          |
| Prevenção de saldo negativo | Validações condicionais no banco                 | Evitar débitos acima do saldo disponível     |
| Idempotência                | `BidRequest` com hash da requisição              | Evitar processamento duplicado               |
| Transactional Outbox        | Persistência dos eventos antes da publicação     | Reduzir divergências entre banco e mensagens |
| Retomada de liquidação      | Reconcile periódico dentro da API                | Fechar settlements parados em `PROCESSING`   |

## Eventos de auditoria

A cadeia recebe um evento por ação relevante. O hash é calculado sobre uma
serialização canônica do payload (chaves ordenadas) com `CANONICALIZATION_VERSION`
no material hasheado, então a mesma informação sempre produz o mesmo hash.

| Evento                       | Quando é gravado                              |
| ---------------------------- | --------------------------------------------- |
| `LOT_CREATED`                | Lote criado pelo leiloeiro                    |
| `LOT_LIVE`                   | Lote entra na janela de lances                |
| `BID_PLACED` / `BID_ACCEPTED`| Lance aceito (com o `endsAt` resultante)      |
| `AUCTION_ENDED` / `AUCTION_WON` | Encerramento e definição do vencedor       |
| `LOT_CANCELED`               | Cancelamento com motivo                       |
| `RESERVATION_ACTIVE` / `RESERVATION_RELEASED` | Reserva criada e liberada   |
| `AUCTION_SETTLED` / `SETTLEMENT_COMPLETED` | Liquidação iniciada e concluída |
| `WALLET_DEPOSITED`           | Depósito simulado na carteira                 |
| `SELLER_AGREEMENT_ACCEPTED`  | Aceite do termo do leiloeiro                  |
| `CHECKPOINT`                 | Marco periódico da cadeia                     |

`GET /audit/verify` recalcula a cadeia e responde se ela está íntegra; qualquer
alteração ou remoção de evento é detectada (há testes para os dois casos).

## Migrations e dados

As migrations ficam em `apps/api/prisma/migrations` e são **aditivas** — nenhuma
delas derruba dados. O Prisma é configurado por `apps/api/prisma.config.ts`
(schema, pasta de migrations e comando de seed). Aplicação:

```bash
npm run db:migrate --workspace @lance/api    # prisma migrate deploy
npm run db:seed --workspace @lance/api       # seed idempotente
```

No Docker, o container da API roda `prisma migrate deploy` antes de subir o
servidor, então nunca é necessário `migrate reset`.

## Contas de demonstração

O seed cria um leiloeiro e dois licitantes, com carteiras e lotes publicados.
A senha vem de `SEED_DEMO_PASSWORD` (`apps/api/.env`), mínimo de 10 caracteres.
O seed é **idempotente** e **determinístico**: rodar de novo não duplica nada.

## Aplicação principal (Docker)

A imagem da API é multi-stage (`node:22-alpine`), instala dependências com
`npm ci --workspace @lance/api`, gera o Prisma Client, compila e no runtime roda
as migrations e o `dist/src/main.js`. O container da web é o build do Vite
servido por nginx com fallback de SPA.

## Endpoints da API

Base de produção: `https://lance-api-rfiz.onrender.com`

### Autenticação e sessão

| Método | Rota             | Descrição                       |
| ------ | ---------------- | ------------------------------- |
| `POST` | `/auth/register` | Cadastro de usuário             |
| `POST` | `/auth/login`    | Autenticação                    |
| `POST` | `/auth/refresh`  | Renovação de sessão             |
| `POST` | `/auth/logout`   | Encerramento de sessão          |
| `GET`  | `/auth/me`       | Consulta do usuário autenticado |

### Lotes e lances

| Método  | Rota                | Descrição            |
| ------- | ------------------- | -------------------- |
| `GET`   | `/lots`             | Listagem de lotes    |
| `GET`   | `/lots/:id`         | Detalhes do lote     |
| `POST`  | `/lots`             | Criação de lote      |
| `PATCH` | `/lots/:id`         | Edição de lote       |
| `POST`  | `/lots/:id/publish` | Publicação do lote   |
| `POST`  | `/lots/:id/cancel`  | Cancelamento do lote |
| `POST`  | `/lots/:id/bids`    | Envio de lance       |

### Carteira e auditoria

| Método | Rota                          | Descrição                     |
| ------ | ----------------------------- | ----------------------------- |
| `GET`  | `/wallet`                     | Consulta de saldos            |
| `GET`  | `/wallet/transactions`        | Extrato de movimentações      |
| `POST` | `/wallet/deposits`            | Depósito simulado             |
| `GET`  | `/catalog/search?q=:termo`    | Busca em catálogos externos   |
| `GET`  | `/audit`                      | Trilha de auditoria           |
| `GET`  | `/audit/verify`               | Verificação da cadeia SHA-256 |
| `GET`  | `/receipts/:verificationCode` | Consulta de comprovante       |
| `GET`  | `/health`                     | Estado da API (uptime + banco) |

### Notificações do usuário

| Método  | Rota                          | Descrição                                  |
| ------- | ----------------------------- | ------------------------------------------ |
| `GET`   | `/me/notifications`           | Lista notificações, não lidas e total      |
| `PATCH` | `/me/notifications/read`      | Marca todas como lidas                     |
| `PATCH` | `/me/notifications/:id/read`  | Marca uma notificação como lida            |

### Parâmetros de consulta úteis

| Rota                     | Parâmetros                                        |
| ------------------------ | ------------------------------------------------- |
| `GET /lots`              | `status` (`SCHEDULED` etc.) e `category`            |
| `GET /catalog/search`    | `q` (vazio lista o acervo), `offset`, `limit` (máx. 40) |

## Testes automatizados

```bash
# Unitários da API (Jest)
npm test --workspace @lance/api

# Integração + E2E da API (usa o banco lance_test)
npm run test:e2e --workspace @lance/api

# Frontend (Vitest)
npm test --workspace @lance/web
```

Os testes de integração sobem contra um PostgreSQL real e exigem
`localhost:5432/lance_test` (o `test/jest-e2e.setup.ts` troca o nome do banco do
`.env` para `lance_test` e aborta se o host não for local). Cenários cobertos:

| Arquivo                                         | Cobre                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `test/flow.integration.e2e-spec.ts`              | Liquidação com e sem vencedor, idempotência, catch-up, estorno, adulteração da cadeia, concorrência |
| `test/anti-sniping.integration.e2e-spec.ts`      | Extensão de prazo nos últimos 2 min e reflexo na auditoria             |
| `test/bids.integration.e2e-spec.ts`              | Regras de lance e reserva                                             |
| `test/app.e2e-spec.ts`                           | Healthcheck e rotas básicas                                           |
| `apps/web/src/logic/auctionRules.test.ts`        | Regras de lance do frontend (mesma verdade da API)                    |

## Limitações conhecidas

- **Pagamento simulado**: não há cobrança real, nota fiscal, entrega ou revenda.
- **Liquidação roda dentro da API**: em hospedagem que hiberna o processo, o
  settlement pode atrasar até a próxima inicialização (o reconcile retoma).
- **Fontes externas**: The Met, ArtIC, MusicBrainz e CAA têm limites próprios de
  taxa e podem ficar indisponíveis; nesse caso a busca degrada por fonte.
- **Catálogo sem busca em texto livre no banco**: a busca é feita nas APIs
  externas, não sobre um índice local.
- **Upload de imagens**: não há; a imagem vem sempre da fonte externa.

---

## Inteligência Artificial e decisões de projeto

A inteligência artificial fez parte do processo de desenvolvimento da Lance como ferramenta de apoio à engenharia de software e à exploração de soluções.

Foram utilizados **OpenAI Codex e GPT** em atividades como:

- **Documentação:** elaboração e revisão de documentos técnicos e funcionais.
- **Arquitetura de software:** discussão de alternativas, análise de decisões estruturais e avaliação de possíveis soluções.
- **Testes automatizados:** apoio à criação de testes e à exploração de cenários de validação.
- **Identidade visual:** exploração de conceitos visuais, paleta de cores, composição da marca e materiais gráficos.
- **Desenvolvimento:** apoio à implementação, revisão de código, investigação de problemas e refinamento de funcionalidades.

O uso de IA não substitui a responsabilidade técnica. As ferramentas são utilizadas para acelerar tarefas, ampliar possibilidades e apoiar a análise — não para decidir autonomamente os rumos do projeto.

**A decisão final é humana.** As sugestões geradas são avaliadas criticamente, confrontadas com os requisitos e com a arquitetura da aplicação e aceitas, adaptadas ou descartadas conforme necessário. A direção do produto, as prioridades, as escolhas arquiteturais e os critérios de qualidade permanecem sob responsabilidade do desenvolvedor.

> A IA participa do processo; o desenvolvedor define o resultado.

## Documentação do projeto

Os documentos abaixo registram os requisitos, as decisões de arquitetura e as diretrizes de identidade visual da Lance.

[Lance_Identidade_Visual.pdf](https://github.com/user-attachments/files/34138101/Lance_Identidade_Visual.pdf)

[Lance_Arquitetura_Decisoes_Estruturais.pdf](https://github.com/user-attachments/files/34138098/Lance_Arquitetura_Decisoes_Estruturais.pdf)


<div align="center">

**LANCE**

_Tecnologia, transparência e confiança em cada lance._

[Aplicação em produção](https://lance-leiloes.vercel.app/) · [API](https://lance-api-rfiz.onrender.com)

<sub>Projeto demonstrativo. As operações financeiras apresentadas são simuladas.</sub>

</div>
