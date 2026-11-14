# Multi-stage Dockerfile for AI Resume Job Suite
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm --prefix client install
RUN npm --prefix server install

# Copy application source code
COPY . .

# Generate Prisma Client & Run Builds
RUN npx --prefix server prisma generate --schema=server/prisma/schema.prisma
RUN npm --prefix server run build
RUN npm --prefix client run build

# Production Runner Image
FROM node:20-slim AS runner

WORKDIR /app

# Install Chromium and fonts for headless PDF printing
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5000
ENV CHROME_BIN=/usr/bin/chromium
ENV DATABASE_URL="file:/app/data/dev.db"

# Copy package descriptors and production node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy compiled code & assets
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist

# Ensure persistent data directory exists for SQLite
RUN mkdir -p /app/data

EXPOSE 5000

# Push prisma schema to db on startup and start Express server
CMD ["sh", "-c", "npx --prefix server prisma db push --schema=server/prisma/schema.prisma && node server/dist/index.js"]
