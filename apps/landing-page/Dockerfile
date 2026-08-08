FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# Copy root workspace configurations & lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/dashboard/package.json ./apps/dashboard/
COPY apps/landing-page/package.json ./apps/landing-page/
COPY apps/remotion/package.json ./apps/remotion/

# Install workspace dependencies
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Copy application source code
COPY apps/landing-page ./apps/landing-page

# Build landing page
RUN pnpm --filter apps-landing-page build

FROM node:22-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app /app

EXPOSE 4321

CMD ["pnpm", "--filter", "apps-landing-page", "preview", "--host", "0.0.0.0", "--port", "4321"]
