# syntax=docker/dockerfile:1
# Dockerfile — 33-qism #30/#32 (O-35, O-38): vazifalar web (Vite build) → nginx (statik). Node faqat build bosqichida.
#   docker build --build-arg VITE_API_URL=/v1 -t vazifalar-web:12.1.0 .
# VITE_* qiymatlari BUILD vaqtida JS'ga yoziladi (runtime env EMAS) — API bir origin'da (/v1), shuning uchun bitta image har domenda ishlaydi.
ARG NODE_IMAGE=node:24.22.2-trixie-slim@sha256:90943ae8e65444498fd83f0f23d2a19ef5807e00396cee96bb96b87f9d9ca976
ARG NGINX_IMAGE=nginx:1.30.6-alpine@sha256:0e52bd054126cdc040b1276c0af347aeb02a41b9cfe305d6094767ac30e97949

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
# husky "prepare" skripti git'siz konteynerda kerak emas; Playwright/Storybook brauzer yuklamaydi (npm paketi yuklamaydi)
ENV HUSKY=0
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_URL=/v1
ARG VITE_AUTH_URL=/v1/auth
ENV VITE_API_URL=${VITE_API_URL} VITE_AUTH_URL=${VITE_AUTH_URL}
RUN npm run build

FROM ${NGINX_IMAGE} AS runtime
# nginx:alpine — 8080 da, root'siz (nginx foydalanuvchisi); ichki konfiguratsiya: statik + SPA zaxirasi + kesh sarlavhalari. TLS va /v1 proxy — tashqi nginx (host)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/index.html"]
