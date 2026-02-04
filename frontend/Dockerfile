# Build stage
FROM node:20-alpine AS builder

# Install git for version extraction
RUN apk add --no-cache git

WORKDIR /app

# Copy root package files (for workspaces)
COPY package.json package-lock.json ./

# Copy shared package (workspace dependency)
COPY shared/ ./shared/

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json ./frontend/

# Install all workspace dependencies from root
RUN npm ci --workspace=@bashkirtseff/shared --workspace=bashkirtseff-frontend

# Build shared package first
RUN npm run build -w @bashkirtseff/shared

# Copy frontend source files
COPY frontend/ ./frontend/

# Copy content source (diary entries, glossary)
COPY src/ ./src/

# Copy .git for commit hash extraction
COPY .git ./.git/

# Build the frontend application
WORKDIR /app/frontend
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
