# syntax=docker/dockerfile:1

# Mission Control (Next.js + Prisma + SQLite)
#
# Notes:
# - Uses Prisma v7 Driver Adapters (better-sqlite3) which require native builds.
# - The app reads local files for OpenClaw logs + the markdown/sketch vault.
#   In Docker you should mount those directories and set env vars.

FROM node:22-bookworm AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Native deps for better-sqlite3
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# prisma generate outputs to src/generated; create it so postinstall doesn't fail
RUN mkdir -p src/generated/prisma

RUN npm ci

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3010

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated

EXPOSE 3010

# Run DB migrations on start (idempotent) then start Next
CMD ["bash", "-lc", "npx prisma migrate deploy && npm run start"]
