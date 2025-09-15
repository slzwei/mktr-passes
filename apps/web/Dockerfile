# =============================================================================
# Web Frontend Dockerfile
# =============================================================================
# Multi-stage build for production-ready web frontend

FROM node:20-bullseye-slim as base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@8

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm fetch
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Development stage
FROM base as development

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=development
ENV VITE_API_URL=http://localhost:3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Start development server with hot reload
CMD ["pnpm", "run", "dev:web"]

# Production build stage
FROM base as build

# Build the application
RUN pnpm -r build

# Production stage
FROM nginx:alpine as production

# Copy built assets
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
