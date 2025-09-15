# =============================================================================
# API Service Dockerfile
# =============================================================================
# Multi-stage build for production-ready API service

FROM node:20-bullseye-slim as base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    zip \
    unzip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@8

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/
COPY infra/db/package.json ./infra/db/

# Install dependencies
RUN pnpm fetch
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build packages
RUN pnpm -r build

# Development stage
FROM base as development

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start development server with hot reload
CMD ["pnpm", "run", "dev:api"]

# Production stage
FROM base as production

# Create non-root user
RUN groupadd -r wallet && useradd -r -g wallet wallet

# Create directories and set permissions
RUN mkdir -p /app/uploads /app/passes && \
    chown -R wallet:wallet /app

# Switch to non-root user
USER wallet

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start production server
CMD ["pnpm", "run", "start"]
