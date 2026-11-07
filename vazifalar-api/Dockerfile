# syntax=docker/dockerfile:1
# Dockerfile — 33-qism #28–#30, #36 (O-33…O-35, O-42): vazifalar-api production image (multi-stage).
#   build:  docker build -t vazifalar-api:4.1.0 .            (arm64 server uchun: docker buildx build --platform linux/arm64 …)
#   run:    docker run --env-file .env -p 127.0.0.1:3000:3000 vazifalar-api:4.1.0
# Bosqichlar: deps (hamma bog'liqlik, kesh) → build (nest build) → prod-deps (faqat prod) → runtime (slim, non-root, tini yo'q — #29 o'lchovi).
# Base image versiya + digest bilan qotiriladi (33 #29): teg ko'chishi mumkin, digest — yo'q. Yangilash — ataylab (Dependabot/Renovate — 34-qism).
ARG NODE_IMAGE=node:24.22.2-trixie-slim@sha256:90943ae8e65444498fd83f0f23d2a19ef5807e00396cee96bb96b87f9d9ca976

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
# kesh tartibi (#29): avval faqat lock va prisma sxemasi — kod o'zgarsa `npm ci` qatlami keshdan
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# postinstall = prisma generate (sxema shu yerda bo'lishi shart). BuildKit cache mount — npm keshi qatlamga tushmaydi
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM deps AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM deps AS prod-deps
# prod bog'liqliklar (prisma — @prisma/client peer'i sifatida qoladi: migrate deploy uchun kerak ham, 33 #07)
RUN --mount=type=cache,target=/root/.npm npm prune --omit=dev --no-audit --no-fund

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
WORKDIR /app
# kod root'niki va faqat o'qish uchun; jarayon — node (UID 1000). Yozish kerak bo'lgan joy yo'q (fayllar S3'da, log — stdout)
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json prisma.config.ts ./
COPY prisma ./prisma
COPY scripts/rol-parollari.mjs ./scripts/
USER node
EXPOSE 3000
# Docker HEALTHCHECK (#33): curl image'da yo'q — Node'ning o'z fetch'i. Compose'da ham shu buyruq (interval/timeout u yerda)
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health/live').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
# exec ko'rinish: node PID 1, SIGTERM to'g'ridan ilovaga (shell orqali EMAS — #29 o'lchovi)
CMD ["node", "dist/main.js"]
