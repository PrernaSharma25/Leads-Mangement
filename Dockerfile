# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code and documentation
COPY src ./src/

# Generate Prisma Client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:./prisma/dev.db"

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy compiled files and Prisma schema/migrations
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/src/docs ./src/docs/

# Generate Prisma Client in the runner stage
RUN npx prisma generate

# Ensure writable data directory for SQLite persistence
RUN mkdir -p /app/prisma && chown -R node:node /app

USER node

# Expose port
EXPOSE 3000

# SQLite volume mount point
VOLUME ["/app/prisma"]

# Deploy pending migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
