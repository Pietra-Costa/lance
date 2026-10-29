# @lance/api

API NestJS da Lance — Casa de Leilões.

A documentação completa (setup, contas demo, regras, auditoria, endpoints,
testes e limitações) está no **[README da raiz](../../README.md)**.

## Atalho

```bash
cp .env.example .env          # ajuste DATABASE_URL, JWT_SECRET e SEED_DEMO_PASSWORD
npm run db:generate
npm run db:migrate
npm run db:seed
npm run start:dev
```

- API: http://localhost:4000
- Healthcheck: http://localhost:4000/health

## Testes

```bash
npm test          # unitários (Jest)
npm run test:e2e  # integração contra localhost:5432/lance_test
```
