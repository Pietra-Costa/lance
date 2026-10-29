# Scripts auxiliares

Ferramentas de diagnóstico manual. **Não** fazem parte do build nem da API.

Todos leem `DATABASE_URL` do ambiente (carregada do `.env` da raiz ou de
`apps/api/.env` via `dotenv`). Nenhum script escreve no banco: são apenas
consultas de leitura.

| Script                   | Para que serve                                                  |
| ------------------------ | --------------------------------------------------------------- |
| `check-migrations.cjs`   | Lista o histórico de `_prisma_migrations` (aplicadas/revertidas) |
| `check-table.cjs`        | Compara o `lastSequence`/`lastEventHash` do estado da cadeia com o evento correspondente |
| `check-data-counts.cjs`  | Conta registros das tabelas principais (lotes, carteiras, recibos, auditoria) |
| `check-refresh-session.cjs` | Verifica se as tabelas `User` e `RefreshSession` existem      |
| `check-tables.sql`       | Consulta avulsa equivalente, para rodar direto no `psql`         |

## Uso

```bash
node scripts/check-migrations.cjs
node scripts/check-data-counts.cjs
psql "$DATABASE_URL" -f scripts/check-tables.sql
```
