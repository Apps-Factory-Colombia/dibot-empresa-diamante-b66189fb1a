# dibot-managed-runtime: GitHub Actions builds this image; Dokploy only pulls it.
FROM oven/bun:1.3.2 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1.3.2 AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8787
ENV API_PORT=8787

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=build /app/dist ./dist

EXPOSE 8787
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=12 CMD bun -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8787) + '/healthz').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"
CMD ["bun", "dist/server/api/index.js"]
