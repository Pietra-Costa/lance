# ---------- Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN npm ci --workspace @lance/api --include-workspace-root=false

COPY apps/api ./apps/api

RUN npm run db:generate --workspace @lance/api \
 && npm run build --workspace @lance/api

# ---------- Runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache wget

COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN npm ci --omit=dev --workspace @lance/api --include-workspace-root=false \
 && npm cache clean --force

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/generated ./apps/api/generated
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/prisma7.config.ts ./apps/api/prisma7.config.ts

WORKDIR /app/apps/api

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/src/main.js"]
