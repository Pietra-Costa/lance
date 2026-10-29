 <div align="center">

<img src="docs/images/lance-banner.png" alt="Lance — Casa de Leilões" width="100%">

# LANCE

### Casa de Leilões · Plataforma SaaS em tempo real

**Pregões ao vivo. Segurança transacional. Auditoria criptográfica.**

[![Produção](https://img.shields.io/badge/PRODUÇÃO-ONLINE-123D2F?style=for-the-badge)](https://lance-leiloes.vercel.app/)
[![Frontend](https://img.shields.io/badge/FRONTEND-VERCEL-0A2B22?style=for-the-badge&logo=vercel&logoColor=F5F1E7)](https://lance-leiloes.vercel.app/)
[![API](https://img.shields.io/badge/API-RENDER-123D2F?style=for-the-badge&logo=render&logoColor=F5F1E7)](https://lance-api-rfiz.onrender.com)
[![Database](https://img.shields.io/badge/DATABASE-POSTGRESQL%2016-C8A96A?style=for-the-badge&logo=postgresql&logoColor=222923)](https://supabase.com/)

[**Acessar plataforma ↗**](https://lance-leiloes.vercel.app/) · [API](https://lance-api-rfiz.onrender.com) · [Healthcheck](https://lance-api-rfiz.onrender.com/health)

</div>

---

> **Aviso de escopo:** esta plataforma utiliza liquidação financeira simulada para demonstração e homologação. Não realiza cobranças bancárias reais nem remessas físicas.

## Sobre o projeto

O **Lance** é uma plataforma SaaS para gestão, catalogação e realização de leilões online. Combina a elegância de uma casa de leilões tradicional com uma arquitetura moderna para processamento de lances em tempo real, gestão de saldos, governança e rastreabilidade criptográfica.

O sistema contempla fluxos transacionais, concorrência controlada, comunicação em tempo real e mecanismos de verificação da integridade dos eventos registrados.

## Visão geral da plataforma

<div align="center">

|                 Vitrine e lotes                  |                 Pregão e gestão                 |
| :----------------------------------------------: | :---------------------------------------------: |
| ![Vitrine do Lance](docs/images/804shots_so.png) | ![Pregão do Lance](docs/images/453shots_so.png) |

|               Carteira e operações                |               Interface adicional                |
| :-----------------------------------------------: | :----------------------------------------------: |
| ![Carteira do Lance](docs/images/406shots_so.png) | ![Plataforma Lance](docs/images/650shots_so.png) |

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

## Funcionalidades

### 1. Sala de pregão ao vivo

- Sincronização de lances, liderança e contagem regressiva com Socket.IO.
- Extensão automática do pregão quando um lance é enviado nos dois minutos finais.
- Validação no backend do incremento mínimo permitido.
- Notificações de liderança e de lance superado.
- Liberação da reserva quando outro participante supera o lance.
- Proteção contra lances desnecessários do próprio líder.

### 2. Curadoria e cadastro de lotes

- Busca e importação de itens de acervos públicos.
- Integração com o The Metropolitan Museum of Art e o Art Institute of Chicago.
- Fluxo guiado para seleção, procedência, configuração do pregão e prévia.
- Registro dos metadados e das referências das imagens no momento da publicação.

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
| Infraestrutura | Docker Compose · Vercel · Render | Execução e implantação             |
| Testes         | Jest · Supertest · Vitest        | Testes automatizados               |

## Arquitetura do monorepo

```text
lance/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   └── src/
│   │       ├── audit/           # Auditoria criptográfica
│   │       ├── auth/            # Autenticação e autorização
│   │       ├── bids/            # Processamento de lances
│   │       ├── catalog/         # Integrações com catálogos
│   │       ├── lots/            # Ciclo de vida dos lotes
│   │       ├── outbox/          # Publicação de eventos
│   │       ├── realtime/        # Gateway WebSocket
│   │       ├── receipts/        # Comprovantes digitais
│   │       ├── seller-agreements/
│   │       ├── settlements/     # Liquidação e reconciliação
│   │       └── wallet/          # Carteira e ledger
│   └── web/
│       └── src/
│           ├── components/      # Componentes e design system
│           ├── context/         # Sessão e estado da aplicação
│           ├── logic/           # Regras de negócio do frontend
│           ├── pages/           # Páginas da plataforma
│           └── services/        # Cliente HTTP e serviços
├── docs/
│   └── images/                  # Banner e capturas de tela
├── docker-compose.yml
└── package.json
```

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

## Engenharia transacional

| Mecanismo                   | Solução técnica                                  | Objetivo                                     |
| --------------------------- | ------------------------------------------------ | -------------------------------------------- |
| Concorrência de lances      | Transações serializáveis e bloqueio de registros | Reduzir condições de corrida                 |
| Reserva de fundos           | Operações transacionais de reserva e liberação   | Preservar a consistência dos saldos          |
| Prevenção de saldo negativo | Validações condicionais no banco                 | Evitar débitos acima do saldo disponível     |
| Idempotência                | Chave associada à requisição                     | Evitar processamento duplicado               |
| Transactional Outbox        | Persistência dos eventos antes da publicação     | Reduzir divergências entre banco e mensagens |

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
| `GET`  | `/health`                     | Estado da API                 |

## Testes automatizados

```bash
# Testes da API
npm test --workspace @lance/api

# Testes de integração / E2E da API
npm run test:e2e --workspace @lance/api

# Testes do frontend
npm test --workspace @lance/web
```

A cobertura efetiva depende dos testes presentes no repositório. Os cenários relevantes incluem concorrência de lances, idempotência, liquidação e verificação da integridade dos eventos.

---

<div align="center">

**LANCE**

_Tecnologia, transparência e confiança em cada lance._

[Aplicação em produção](https://lance-leiloes.vercel.app/) · [API](https://lance-api-rfiz.onrender.com)

<sub>Projeto demonstrativo. As operações financeiras apresentadas são simuladas.</sub>

</div>
