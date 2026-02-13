# Build stage
FROM node:20-alpine AS builder

# Install git for version extraction
RUN apk add --no-cache git

WORKDIR /app

# Copy root package files (for workspaces)
COPY package.json package-lock.json ./

# Copy shared package (workspace dependency)
COPY src/shared/ ./src/shared/

# Copy frontend package files
COPY src/frontend/package.json src/frontend/package-lock.json ./src/frontend/

# Install all workspace dependencies from root
RUN npm ci --workspace=@bashkirtseff/shared --workspace=bashkirtseff-frontend

# Build shared package first
RUN npm run build -w @bashkirtseff/shared

# Copy frontend source files
COPY src/frontend/ ./src/frontend/

# Copy content source (diary entries, glossary)
COPY content/ ./content/

# Copy .git for commit hash extraction
COPY .git ./.git/

# Umami analytics (set at build time, appears in static HTML)
ARG PUBLIC_UMAMI_WEBSITE_ID=""
ARG PUBLIC_UMAMI_URL=""
ENV PUBLIC_UMAMI_WEBSITE_ID=$PUBLIC_UMAMI_WEBSITE_ID
ENV PUBLIC_UMAMI_URL=$PUBLIC_UMAMI_URL

# Build the frontend application
WORKDIR /app/src/frontend
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/src/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY src/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
