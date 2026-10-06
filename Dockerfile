# syntax=docker/dockerfile:1
# ---------- Stage 1: dependency ----------
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
# ---------- Stage 2: build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Biến NEXT_PUBLIC_* được "đóng" vào JS lúc build, nên phải có ở đây
ARG NEXT_PUBLIC_API_URL=https://tutor.haiphan.org/api
ARG NEXT_PUBLIC_THIRD_SERVICE_URL=http://localhost:4001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
 NEXT_PUBLIC_THIRD_SERVICE_URL=$NEXT_PUBLIC_THIRD_SERVICE_URL \
 NEXT_TELEMETRY_DISABLED=1 \
 DOCKER_BUILD=1
RUN npm run build
# ---------- Stage 3: runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
 NEXT_TELEMETRY_DISABLED=1 \
 PORT=3000 \
 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]