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
COPY apps/landing-page ./apps/landing-page

# Build-time environment variables for Astro bundling
ARG PUBLIC_DASHBOARD_URL
ARG PUBLIC_SUPABASE_URL
ARG PUBLIC_SUPABASE_ANON_KEY

ENV PUBLIC_DASHBOARD_URL=$PUBLIC_DASHBOARD_URL
ENV PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL
ENV PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY

# Build landing page
RUN pnpm --filter apps-landing-page build

FROM node:22-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm@9

COPY --from=builder /app /app

EXPOSE 4321

CMD ["pnpm", "--filter", "apps-landing-page", "preview", "--host", "0.0.0.0", "--port", "4321"]
