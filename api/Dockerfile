FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY tsconfig.json ./
COPY migrations ./migrations
COPY src ./src

# tsx for running TypeScript in container without a separate build step
RUN npm install --no-save tsx typescript

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

CMD ["sh", "-c", "npx tsx src/db/migrate.ts && npx tsx src/index.ts"]
