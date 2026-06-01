# Admin API for bashkirtseff.org — tiny aggregation service.
# Self-contained (build context is this directory only).

FROM node:22-alpine

WORKDIR /app

# Install dependencies (package.json + lockfile if present)
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# tsx is needed to run TypeScript directly; it's a devDependency, so add it
# explicitly to the production image.
RUN npm install --no-save tsx@^4.19.2

COPY tsconfig.json ./
COPY src/ ./src/

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["npx", "tsx", "src/index.ts"]
