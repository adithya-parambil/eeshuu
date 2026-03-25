# ─── Production image with tsx for TypeScript execution ──────────────────────
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install wget for health checks
RUN apk add --no-cache wget

# Non-root user — never run production containers as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install all dependencies (including tsx for TS execution)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src

# Drop privileges before starting the process
USER appuser

EXPOSE 5000

# wget is available in node:20-alpine; use it for the health probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health/live || exit 1

CMD ["npx", "tsx", "src/server.ts"]
