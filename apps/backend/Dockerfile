FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# Copy root workspace configurations & lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install workspace dependencies
RUN pnpm install

# Copy application source code
COPY apps/backend ./apps/backend

# Build the backend application
RUN pnpm --filter apps-backend build

FROM node:22-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app /app

EXPOSE 5005

CMD ["pnpm", "--filter", "apps-backend", "start"]
