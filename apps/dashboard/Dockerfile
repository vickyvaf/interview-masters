FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@9

# Copy root workspace configurations & lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/dashboard/package.json ./apps/dashboard/
COPY apps/landing-page/package.json ./apps/landing-page/
COPY apps/remotion/package.json ./apps/remotion/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY apps/dashboard ./apps/dashboard

# Build candidate dashboard
RUN pnpm --filter apps-dashboard build

FROM node:22-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm@9

COPY --from=builder /app /app

EXPOSE 5173

CMD ["pnpm", "--filter", "apps-dashboard", "preview", "--host", "0.0.0.0", "--port", "5173"]
